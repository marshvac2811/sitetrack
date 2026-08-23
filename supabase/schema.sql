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
