'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const TABS = ['Status', 'Team', 'Materials', 'Attendance', 'Cash', 'Milestones'] as const;
type Tab = typeof TABS[number];

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Status');
  const [site, setSite] = useState<any>(null);

  useEffect(() => {
    supabase.from('sites').select('*').eq('id', siteId).single().then(({ data }) => setSite(data));
  }, [siteId]);

  async function deleteSite() {
    if (!confirm(`Delete "${site.name}"? This removes all its team, materials, attendance, cash, and milestone data. This cannot be undone.`)) return;
    await supabase.from('sites').delete().eq('id', siteId);
    router.push('/sites');
  }

  if (!site) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{site.name}</h1>
          <p className="text-sm text-gray-500 mb-4">{site.client} · {site.location}</p>
        </div>
        <button onClick={deleteSite} className="text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">
          Delete site
        </button>
      </div>

      <div className="flex gap-1 border-b mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm whitespace-nowrap ${
              tab === t ? 'border-b-2 border-black font-medium' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Status' && <StatusTab site={site} siteId={siteId} onSaved={setSite} />}
      {tab === 'Team' && <TeamTab siteId={siteId} />}
      {tab === 'Materials' && <MaterialsTab siteId={siteId} />}
      {tab === 'Attendance' && <AttendanceTab siteId={siteId} />}
      {tab === 'Cash' && <CashTab siteId={siteId} />}
      {tab === 'Milestones' && <MilestonesTab siteId={siteId} />}
    </div>
  );
}

// --- Status: work completed/pending, extra required, tentative completion date ---
function StatusTab({ site, siteId, onSaved }: any) {
  const [form, setForm] = useState({
    work_completed_summary: site.work_completed_summary ?? '',
    work_pending_summary: site.work_pending_summary ?? '',
    extra_required: site.extra_required ?? '',
    tentative_completion_date: site.tentative_completion_date ?? '',
    status: site.status ?? 'active',
  });

  async function save() {
    const { data } = await supabase.from('sites').update(form).eq('id', siteId).select().single();
    onSaved(data);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Site status</label>
        <select
          className="border rounded-lg p-2 w-full mt-1"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Work completed</label>
        <textarea
          className="border rounded-lg p-2 w-full mt-1"
          rows={3}
          value={form.work_completed_summary}
          onChange={(e) => setForm({ ...form, work_completed_summary: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Work pending</label>
        <textarea
          className="border rounded-lg p-2 w-full mt-1"
          rows={3}
          value={form.work_pending_summary}
          onChange={(e) => setForm({ ...form, work_pending_summary: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Anything extra required</label>
        <textarea
          className="border rounded-lg p-2 w-full mt-1"
          rows={2}
          value={form.extra_required}
          onChange={(e) => setForm({ ...form, extra_required: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Tentative completion date</label>
        <input
          type="date"
          className="border rounded-lg p-2 w-full mt-1"
          value={form.tentative_completion_date ?? ''}
          onChange={(e) => setForm({ ...form, tentative_completion_date: e.target.value })}
        />
      </div>
      <button onClick={save} className="bg-black text-white px-4 py-2 rounded-lg text-sm">
        Save
      </button>
    </div>
  );
}

// --- Team: engineers / supervisors / labor ---
function TeamTab({ siteId }: { siteId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', role: 'engineer', contact: '' });

  useEffect(() => { load(); }, [siteId]);
  async function load() {
    const { data } = await supabase.from('site_team').select('*').eq('site_id', siteId).order('role');
    setRows(data ?? []);
  }
  async function add() {
    await supabase.from('site_team').insert({ ...form, site_id: siteId });
    setForm({ name: '', role: 'engineer', contact: '' });
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input className="border rounded-lg p-2 flex-1" placeholder="Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="border rounded-lg p-2" value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="engineer">Engineer</option>
          <option value="supervisor">Supervisor</option>
          <option value="labor">Labor</option>
        </select>
        <input className="border rounded-lg p-2 flex-1" placeholder="Contact" value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <button onClick={add} className="bg-black text-white px-4 py-2 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th className="py-2">Name</th><th>Role</th><th>Contact</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2">{r.name}</td><td className="capitalize">{r.role}</td><td>{r.contact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Materials: ordered vs received ---
function MaterialsTab({ siteId }: { siteId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ item: '', quantity: '', vendor: '', status: 'ordered' });

  useEffect(() => { load(); }, [siteId]);
  async function load() {
    const { data } = await supabase.from('site_materials').select('*').eq('site_id', siteId).order('created_at', { ascending: false });
    setRows(data ?? []);
  }
  async function add() {
    await supabase.from('site_materials').insert({ ...form, site_id: siteId, order_date: new Date().toISOString().slice(0, 10) });
    setForm({ item: '', quantity: '', vendor: '', status: 'ordered' });
    load();
  }
  async function markReceived(id: string) {
    await supabase.from('site_materials').update({ status: 'received', received_date: new Date().toISOString().slice(0, 10) }).eq('id', id);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input className="border rounded-lg p-2 flex-1" placeholder="Item" value={form.item}
          onChange={(e) => setForm({ ...form, item: e.target.value })} />
        <input className="border rounded-lg p-2 w-24" placeholder="Qty" value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <input className="border rounded-lg p-2 flex-1" placeholder="Vendor" value={form.vendor}
          onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        <button onClick={add} className="bg-black text-white px-4 py-2 rounded-lg text-sm">Add Order</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th className="py-2">Item</th><th>Qty</th><th>Vendor</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2">{r.item}</td><td>{r.quantity}</td><td>{r.vendor}</td>
              <td className={r.status === 'received' ? 'text-green-600' : 'text-yellow-600'}>{r.status}</td>
              <td>{r.status !== 'received' && (
                <button onClick={() => markReceived(r.id)} className="text-xs underline">Mark received</button>
              )}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Attendance: daily checkbox grid per team member ---
function AttendanceTab({ siteId }: { siteId: string }) {
  const [team, setTeam] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marked, setMarked] = useState<Record<string, boolean>>({});

  useEffect(() => { load(); }, [siteId, date]);
  async function load() {
    const { data: teamData } = await supabase.from('site_team').select('*').eq('site_id', siteId).eq('active', true);
    setTeam(teamData ?? []);
    const { data: att } = await supabase.from('site_attendance').select('*').eq('site_id', siteId).eq('date', date);
    const m: Record<string, boolean> = {};
    (att ?? []).forEach((a: any) => { m[a.team_member_id] = a.present; });
    setMarked(m);
  }

  async function toggle(memberId: string) {
    const present = !marked[memberId];
    await supabase.from('site_attendance').upsert(
      { site_id: siteId, team_member_id: memberId, date, present },
      { onConflict: 'team_member_id,date' }
    );
    setMarked({ ...marked, [memberId]: present });
  }

  return (
    <div>
      <input type="date" className="border rounded-lg p-2 mb-4" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="space-y-2">
        {team.map((m) => (
          <label key={m.id} className="flex items-center gap-3 border rounded-lg p-2">
            <input type="checkbox" checked={!!marked[m.id]} onChange={() => toggle(m.id)} />
            <span>{m.name}</span>
            <span className="text-xs text-gray-500 capitalize">({m.role})</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// --- Cash: in hand vs required, and account ---
function CashTab({ siteId }: { siteId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ cash_in_hand: '', cash_required: '', account: '', purpose: '' });

  useEffect(() => { load(); }, [siteId]);
  async function load() {
    const { data } = await supabase.from('site_cash').select('*').eq('site_id', siteId).order('date', { ascending: false });
    setRows(data ?? []);
  }
  async function add() {
    await supabase.from('site_cash').insert({
      ...form,
      cash_in_hand: Number(form.cash_in_hand) || 0,
      cash_required: Number(form.cash_required) || 0,
      site_id: siteId,
      date: new Date().toISOString().slice(0, 10),
    });
    setForm({ cash_in_hand: '', cash_required: '', account: '', purpose: '' });
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="border rounded-lg p-2 w-32" placeholder="Cash in hand" value={form.cash_in_hand}
          onChange={(e) => setForm({ ...form, cash_in_hand: e.target.value })} />
        <input className="border rounded-lg p-2 w-32" placeholder="Cash required" value={form.cash_required}
          onChange={(e) => setForm({ ...form, cash_required: e.target.value })} />
        <input className="border rounded-lg p-2 flex-1" placeholder="Account" value={form.account}
          onChange={(e) => setForm({ ...form, account: e.target.value })} />
        <input className="border rounded-lg p-2 flex-1" placeholder="Purpose" value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
        <button onClick={add} className="bg-black text-white px-4 py-2 rounded-lg text-sm">Log Entry</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th className="py-2">Date</th><th>In hand</th><th>Required</th><th>Account</th><th>Purpose</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2">{r.date}</td><td>₹{r.cash_in_hand}</td><td>₹{r.cash_required}</td>
              <td>{r.account}</td><td>{r.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Milestones: individual work items with tentative vs actual completion ---
function MilestonesTab({ siteId }: { siteId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ work_item: '', tentative_date: '' });

  useEffect(() => { load(); }, [siteId]);
  async function load() {
    const { data } = await supabase.from('site_milestones').select('*').eq('site_id', siteId).order('tentative_date');
    setRows(data ?? []);
  }
  async function add() {
    await supabase.from('site_milestones').insert({ ...form, site_id: siteId });
    setForm({ work_item: '', tentative_date: '' });
    load();
  }
  async function markDone(id: string) {
    await supabase.from('site_milestones').update({ status: 'completed', actual_completion_date: new Date().toISOString().slice(0, 10) }).eq('id', id);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input className="border rounded-lg p-2 flex-1" placeholder="Work item" value={form.work_item}
          onChange={(e) => setForm({ ...form, work_item: e.target.value })} />
        <input type="date" className="border rounded-lg p-2" value={form.tentative_date}
          onChange={(e) => setForm({ ...form, tentative_date: e.target.value })} />
        <button onClick={add} className="bg-black text-white px-4 py-2 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th className="py-2">Work item</th><th>Tentative date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2">{r.work_item}</td><td>{r.tentative_date}</td>
              <td className={r.status === 'completed' ? 'text-green-600' : 'text-gray-600'}>{r.status}</td>
              <td>{r.status !== 'completed' && <button onClick={() => markDone(r.id)} className="text-xs underline">Mark done</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
