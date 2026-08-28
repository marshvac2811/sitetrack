-- SiteTrack schema — run this in the Supabase SQL editor
-- Design: one row per "site" (project), everything else references site_id.
-- New sites just get a new row — no code changes needed to add site #13, #14...

create extension if not exists "uuid-ossp";

-- 1. SITES — the master list. Each site = one project (office/hotel/workspace fit-out)
create table sites (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                          -- e.g. "DLF Cyber City - Tower 3"
  client text,
  location text,
  category text check (category in ('office','hotel','workspace')),
  status text default 'active' check (status in ('active','on_hold','completed')),
  tentative_completion_date date,
  actual_completion_date date,
  work_completed_summary text,                 -- free text: what's done
  work_pending_summary text,                    -- free text: what's left
  extra_required text,                          -- anything extra needed (approvals, material, manpower)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. TEAM — engineers / supervisors / labor assigned to a site
create table site_team (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  name text not null,
  role text check (role in ('engineer','supervisor','labor')),
  contact text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. MATERIALS — order placed vs received tracking
create table site_materials (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  item text not null,
  quantity text,
  vendor text,
  status text default 'ordered' check (status in ('ordered','received','pending_order')),
  order_date date,
  received_date date,
  notes text,
  created_at timestamptz default now()
);

-- 4. ATTENDANCE — daily, per team member
create table site_attendance (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  team_member_id uuid references site_team(id) on delete cascade,
  date date not null,
  present boolean default true,
  notes text,
  created_at timestamptz default now(),
  unique(team_member_id, date)
);

-- 5. CASH — cash in hand vs required, and which account it sits against
create table site_cash (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  date date not null default current_date,
  cash_in_hand numeric default 0,
  cash_required numeric default 0,
  account text,                                 -- e.g. "Riyada - HDFC Site Account"
  purpose text,                                  -- what the required cash is for
  notes text,
  created_at timestamptz default now()
);

-- 6. MILESTONES — individual work items with tentative vs actual dates
create table site_milestones (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  work_item text not null,                      -- e.g. "Ceiling grid - 2nd floor"
  tentative_date date,
  actual_completion_date date,
  status text default 'pending' check (status in ('pending','in_progress','completed')),
  created_at timestamptz default now()
);

-- Helpful view: one-row overview per site for the dashboard/list page
create view site_overview as
select
  s.id, s.name, s.client, s.location, s.category, s.status,
  s.tentative_completion_date,
  (select count(*) from site_team t where t.site_id = s.id and t.active) as team_count,
  (select count(*) from site_materials m where m.site_id = s.id and m.status = 'ordered') as materials_pending,
  (select cash_in_hand from site_cash c where c.site_id = s.id order by date desc limit 1) as latest_cash_in_hand,
  (select cash_required from site_cash c where c.site_id = s.id order by date desc limit 1) as latest_cash_required
from sites s;

-- Migration: add site start date (for elapsed/remaining day tracking)
alter table sites add column if not exists start_date date;

-- Migration: include start_date in the dashboard view
create or replace view site_overview as
select
  s.id, s.name, s.client, s.location, s.category, s.status,
  s.start_date, s.tentative_completion_date,
  (select count(*) from site_team t where t.site_id = s.id and t.active) as team_count,
  (select count(*) from site_materials m where m.site_id = s.id and m.status = 'ordered') as materials_pending,
  (select cash_in_hand from site_cash c where c.site_id = s.id order by date desc limit 1) as latest_cash_in_hand,
  (select cash_required from site_cash c where c.site_id = s.id order by date desc limit 1) as latest_cash_required
from sites s;

-- Migration: attendance photo + GPS location
alter table site_attendance add column if not exists photo_url text;
alter table site_attendance add column if not exists latitude numeric;
alter table site_attendance add column if not exists longitude numeric;

-- Storage bucket for attendance photos (public read so photos display in the app)
insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', true)
on conflict (id) do nothing;

-- Allow the app (no login yet) to upload and read attendance photos
create policy "Public read attendance photos" on storage.objects
  for select using (bucket_id = 'attendance-photos');
create policy "Public upload attendance photos" on storage.objects
  for insert with check (bucket_id = 'attendance-photos');


-- ============================================================
-- Migration: BOQ-driven Material Planning system
-- Work Library (admin-editable recipes) -> Site BOQ items ->
-- auto-calculated material requirements -> Requests -> Supplies -> Balance
-- ============================================================

-- Work type library (global, shared across all sites, admin-editable)
create table if not exists work_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null,              -- e.g. "Gypsum Wall Partition", "Vitrified Tile Flooring"
  unit text not null,              -- e.g. "sqft"
  created_at timestamptz default now()
);

-- The "recipe": materials required per unit of a work type, with wastage factor.
-- Editable by the owner/admin without touching the app code.
create table if not exists work_type_materials (
  id uuid primary key default uuid_generate_v4(),
  work_type_id uuid references work_types(id) on delete cascade,
  material_name text not null,             -- e.g. "Gypsum Board 12mm"
  unit text not null,                      -- e.g. "sqft", "nos", "kg", "m"
  consumption_per_unit numeric not null default 0,  -- e.g. 2.1 boards per 1 sqft of partition
  wastage_percent numeric not null default 0,       -- e.g. 5 for 5%
  created_at timestamptz default now()
);

-- A BOQ line item for a specific site (e.g. "2nd Floor Partition = 1000 sqft")
create table if not exists site_work_items (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  work_type_id uuid references work_types(id),
  label text,                              -- optional custom name, e.g. "2nd Floor Partition"
  boq_quantity numeric not null default 0, -- BOQ/tender quantity, e.g. 1000
  created_at timestamptz default now()
);

-- Auto-calculated material requirement for a site work item (copied from the recipe when
-- the work item is created; editable afterwards since specs/wastage can vary by site)
create table if not exists site_work_materials (
  id uuid primary key default uuid_generate_v4(),
  site_work_item_id uuid references site_work_items(id) on delete cascade,
  material_name text not null,
  unit text,
  required_quantity numeric not null default 0,
  created_at timestamptz default now()
);

-- Site team's material requests against a required material
create table if not exists material_requests (
  id uuid primary key default uuid_generate_v4(),
  site_work_material_id uuid references site_work_materials(id) on delete cascade,
  requested_quantity numeric not null default 0,
  requested_by text,
  request_date date default current_date,
  created_at timestamptz default now()
);

-- Purchase manager's order + supply records against a required material
create table if not exists material_supplies (
  id uuid primary key default uuid_generate_v4(),
  site_work_material_id uuid references site_work_materials(id) on delete cascade,
  ordered_quantity numeric default 0,
  supplied_quantity numeric default 0,
  vendor text,
  supply_date date default current_date,
  notes text,
  created_at timestamptz default now()
);

alter table work_types disable row level security;
alter table work_type_materials disable row level security;
alter table site_work_items disable row level security;
alter table site_work_materials disable row level security;
alter table material_requests disable row level security;
alter table material_supplies disable row level security;
