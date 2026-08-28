'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CATEGORY_ICON, CATEGORY_IMAGE } from '@/lib/images';

const TABS = ['Status', 'BOQ Plan', 'Team', 'Materials', 'Attendance', 'Cash', 'Milestones'] as const;
type Tab = typeof TABS[number];

// --- Toast pop-up shown after any on-site action succeeds ---
function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-[#2b2622] text-[#f0ead9] px-4 py-3 rounded-lg shadow-lg border border-[#c9a15a]/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
      <span className="text-[#c9a15a]">âœ“</span>
      <span className="text-sm">{message}</span>
    </div>
  );
}

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Status');
  const [site, setSite] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('sites').select('*').eq('id', siteId).single().then(({ data }) => setSite(data));
  }, [siteId]);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function deleteSite() {
    if (!confirm(`Delete "${site.name}"? This removes all its team, materials, attendance, cash, and milestone data. This cannot be undone.`)) return;
    await supabase.from('sites').delete().eq('id', siteId);
    router.push('/sites');
  }

  if (!site) return <div className="min-h-screen bg-[#f7f4ef] p-8 text-[#3a352f]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <div className="bg-[#2b2622] text-[#f0ead9]">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#c9a15a] to-[#8a6d3a] flex items-center justify-center text-xl shrink-0">
              {CATEGORY_ICON[site.category] ?? 'ðŸ—ï¸'}
            </div>
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#c9a15a] mb-0.5">Mysticape Concepts</p>
              <h1 className="text-xl font-medium">{site.name}</h1>
              <p className="text-sm text-[#e8dfc9]">{site.client} Â· {site.location}</p>
            </div>
          </div>
          <button
            onClick={deleteSite}
            className="text-xs text-rose-200 border border-rose-300/40 rounded-md px-3 py-1.5 hover:bg-rose-950/30 transition-colors"
          >
            Delete site
          </button>
        </div>
      </div>

      {/* Category hero photo */}
      <div className="relative h-32 md:h-44 w-full overflow-hidden">
        <img
          src={CATEGORY_IMAGE[site.category] ?? CATEGORY_IMAGE.office}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f7f4ef] via-[#2b2622]/10 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex gap-1 mb-6 overflow-x-auto bg-white border border-[#e6dfd0] rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm whitespace-nowrap rounded-md transition-colors ${
                tab === t
                  ? 'bg-[#2b2622] text-[#f0ead9] font-medium'
                  : 'text-[#5c5346] hover:bg-[#f7f4ef]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#e6dfd0] rounded-xl p-6">
          {tab === 'Status' && <StatusTab site={site} siteId={siteId} onSaved={setSite} notify={notify} />}
          {tab === 'BOQ Plan' && <BOQPlanTab siteId={siteId} siteName={site.name} notify={notify} />}
          {tab === 'Team' && <TeamTab siteId={siteId} notify={notify} />}
          {tab === 'Materials' && <MaterialsTab siteId={siteId} notify={notify} />}
          {tab === 'Attendance' && <AttendanceTab siteId={siteId} notify={notify} />}
          {tab === 'Cash' && <CashTab siteId={siteId} notify={notify} />}
          {tab === 'Milestones' && <MilestonesTab siteId={siteId} notify={notify} />}
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}

// --- Days elapsed / remaining banner ---
function DaysBanner({ startDate, targetDate }: { startDate: string | null; targetDate: string | null }) {
  if (!startDate && !targetDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const elapsed = startDate ? Math.floor((today.getTime() - new Date(startDate).getTime()) / 86400000) : null;
  const remaining = targetDate ? Math.ceil((new Date(targetDate).getTime() - today.getTime()) / 86400000) : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <div className="bg-[#faf6ec] border border-[#e6dfd0] rounded-lg px-4 py-3">
        <p className="text-[10px] uppercase text-[#5c5346] mb-0.5">Days since start</p>
        <p className="text-lg font-semibold text-[#2b2622]">{elapsed !== null ? `${elapsed} days` : 'â€”'}</p>
      </div>
      <div className={`border rounded-lg px-4 py-3 ${remaining !== null && remaining < 0 ? 'bg-rose-50 border-rose-200' : 'bg-[#faf6ec] border-[#e6dfd0]'}`}>
        <p className="text-[10px] uppercase text-[#5c5346] mb-0.5">Days remaining</p>
        <p className={`text-lg font-semibold ${remaining !== null && remaining < 0 ? 'text-rose-700' : 'text-[#2b2622]'}`}>
          {remaining !== null ? (remaining < 0 ? `${Math.abs(remaining)} days overdue` : `${remaining} days`) : 'â€”'}
        </p>
      </div>
      <div className="bg-[#faf6ec] border border-[#e6dfd0] rounded-lg px-4 py-3">
        <p className="text-[10px] uppercase text-[#5c5346] mb-0.5">Target completion</p>
        <p className="text-lg font-semibold text-[#2b2622]">
          {targetDate ? new Date(targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'â€”'}
        </p>
      </div>
    </div>
  );
}

// --- BOQ Plan: work items -> auto-calculated materials -> request -> supply -> balance ---
function BOQPlanTab({ siteId, siteName, notify }: { siteId: string; siteName: string; notify: (m: string) => void }) {
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [materialsByItem, setMaterialsByItem] = useState<Record<string, any[]>>({});
  const [requestsByMaterial, setRequestsByMaterial] = useState<Record<string, any[]>>({});
  const [suppliesByMaterial, setSuppliesByMaterial] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ work_type_id: '', label: '', boq_quantity: '' });
  const [actionRow, setActionRow] = useState<{ materialId: string; kind: 'request' | 'supply' } | null>(null);
  const [actionForm, setActionForm] = useState({ quantity: '', by: '', vendor: '' });
const [aiDescription, setAiDescription] = useState('');
const [aiResult, setAiResult] = useState<any>(null);
const [aiLoading, setAiLoading] = useState(false);

async function generateAIMaterials() {
  if (!aiDescription.trim()) {
    notify('Enter a BOQ description first');
    return;
  }

  setAiLoading(true);
  setAiResult(null);

  try {
    const res = await fetch('/api/ai-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boqText: aiDescription }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'AI request failed');
    }

    setAiResult(data.result);
    notify('AI material calculation complete');
  } catch (error: any) {
    notify(error?.message || 'AI calculation failed');
  } finally {
    setAiLoading(false);
  }
}
  useEffect(() => { load(); }, [siteId]);

  async function load() {
    const { data: wt } = await supabase.from('work_types').select('*').order('name');
    setWorkTypes(wt ?? []);
    const { data: wi } = await supabase.from('site_work_items').select('*, work_types(name, unit)').eq('site_id', siteId).order('created_at');
    setItems(wi ?? []);
    if (wi && wi.length > 0) {
      const { data: mats } = await supabase.from('site_work_materials').select('*').in('site_work_item_id', wi.map((i: any) => i.id));
      const grouped: Record<string, any[]> = {};
      (mats ?? []).forEach((m: any) => { grouped[m.site_work_item_id] = grouped[m.site_work_item_id] ?? []; grouped[m.site_work_item_id].push(m); });
      setMaterialsByItem(grouped);

      const matIds = (mats ?? []).map((m: any) => m.id);
      if (matIds.length > 0) {
        const { data: reqs } = await supabase.from('material_requests').select('*').in('site_work_material_id', matIds);
        const rg: Record<string, any[]> = {};
        (reqs ?? []).forEach((r: any) => { rg[r.site_work_material_id] = rg[r.site_work_material_id] ?? []; rg[r.site_work_material_id].push(r); });
        setRequestsByMaterial(rg);

        const { data: sups } = await supabase.from('material_supplies').select('*').in('site_work_material_id', matIds);
        const sg: Record<string, any[]> = {};
        (sups ?? []).forEach((s: any) => { sg[s.site_work_material_id] = sg[s.site_work_material_id] ?? []; sg[s.site_work_material_id].push(s); });
        setSuppliesByMaterial(sg);
      }
    }
  }

  async function addWorkItem() {
    if (!newItem.work_type_id || !newItem.boq_quantity) return;
    const workType = workTypes.find((w) => w.id === newItem.work_type_id);
    const { data: created } = await supabase.from('site_work_items').insert({
      site_id: siteId,
      work_type_id: newItem.work_type_id,
      label: newItem.label || workType?.name,
      boq_quantity: Number(newItem.boq_quantity),
    }).select().single();

    if (created) {
      const { data: recipe } = await supabase.from('work_type_materials').select('*').eq('work_type_id', newItem.work_type_id);
      const qty = Number(newItem.boq_quantity);
      const materialRows = (recipe ?? []).map((r: any) => ({
        site_work_item_id: created.id,
        material_name: r.material_name,
        unit: r.unit,
        required_quantity: Math.round(qty * r.consumption_per_unit * (1 + r.wastage_percent / 100) * 100) / 100,
      }));
      if (materialRows.length > 0) await supabase.from('site_work_materials').insert(materialRows);
      notify(`${created.label} added â€” ${materialRows.length} materials calculated`);
    }
    setNewItem({ work_type_id: '', label: '', boq_quantity: '' });
    load();
  }

  async function recalculateWorkItem(item: any, newQuantity: string) {
    const qty = Number(newQuantity);

    if (!qty || qty <= 0) {
      notify('Enter a valid BOQ quantity');
      return;
    }

    const { data: recipe, error: recipeError } = await supabase
      .from('work_type_materials')
      .select('*')
      .eq('work_type_id', item.work_type_id);

    if (recipeError) {
      notify('Could not load the Work Library recipe');
      return;
    }

    const { error: updateItemError } = await supabase
      .from('site_work_items')
      .update({ boq_quantity: qty })
      .eq('id', item.id);

    if (updateItemError) {
      notify('Could not update BOQ quantity');
      return;
    }

    const existingMaterials = materialsByItem[item.id] ?? [];

    for (const r of recipe ?? []) {
      const requiredQuantity =
        Math.round(
          qty *
          Number(r.consumption_per_unit ?? 0) *
          (1 + Number(r.wastage_percent ?? 0) / 100) *
          100
        ) / 100;

      const existing = existingMaterials.find(
        (m: any) =>
          m.material_name.trim().toLowerCase() ===
            r.material_name.trim().toLowerCase() &&
          m.unit.trim().toLowerCase() ===
            r.unit.trim().toLowerCase()
      );

      if (existing) {
        await supabase
          .from('site_work_materials')
          .update({ required_quantity: requiredQuantity })
          .eq('id', existing.id);
      } else {
        await supabase.from('site_work_materials').insert({
          site_work_item_id: item.id,
          material_name: r.material_name,
          unit: r.unit,
          required_quantity: requiredQuantity,
        });
      }
    }

    notify(`${item.label} recalculated for ${qty} ${item.work_types?.unit ?? ''}`);
    load();
  }
  function getConsolidatedMaterials() {
    const consolidated: Record<string, {
      material_name: string;
      unit: string;
      required: number;
      requested: number;
      supplied: number;
    }> = {};

    items.forEach((item) => {
      const materials = materialsByItem[item.id] ?? [];

      materials.forEach((m) => {
        const key = `${m.material_name.trim().toLowerCase()}|${m.unit.trim().toLowerCase()}`;

        if (!consolidated[key]) {
          consolidated[key] = {
            material_name: m.material_name,
            unit: m.unit,
            required: 0,
            requested: 0,
            supplied: 0,
          };
        }

        consolidated[key].required += Number(m.required_quantity ?? 0);
        consolidated[key].requested += sumQty(
          requestsByMaterial[m.id],
          'requested_quantity'
        );
        consolidated[key].supplied += sumQty(
          suppliesByMaterial[m.id],
          'supplied_quantity'
        );
      });
    });

    return Object.values(consolidated).sort((a, b) =>
      a.material_name.localeCompare(b.material_name)
    );
  }
  function sumQty(rows: any[] | undefined, field: string) {
    return (rows ?? []).reduce((s, r) => s + Number(r[field] ?? 0), 0);
  }

  function openAction(materialId: string, kind: 'request' | 'supply') {
    setActionRow({ materialId, kind });
    setActionForm({ quantity: '', by: '', vendor: '' });
  }

  async function submitAction(material: any) {
    if (!actionRow || !actionForm.quantity) return;
    const qty = Number(actionForm.quantity);
    if (actionRow.kind === 'request') {
      const alreadySupplied = sumQty(suppliesByMaterial[material.id], 'supplied_quantity');
      const balance = material.required_quantity - alreadySupplied;
      await supabase.from('material_requests').insert({
        site_work_material_id: material.id,
        requested_quantity: qty,
        requested_by: actionForm.by,
      });
      if (qty > balance) {
        notify(`âš  ${material.material_name}: requested ${qty} exceeds remaining BOQ balance of ${balance}`);
      } else {
        notify(`Request logged: ${material.material_name} â€” ${qty} ${material.unit}`);
      }
    } else {
      await supabase.from('material_supplies').insert({
        site_work_material_id: material.id,
        supplied_quantity: qty,
        ordered_quantity: qty,
        vendor: actionForm.vendor,
      });
      notify(`Supply logged: ${material.material_name} â€” ${qty} ${material.unit}`);
    }
    setActionRow(null);
    load();
  }

  async function exportExcel() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Summary sheet across all work items
    const summaryRows: any[] = [];
    for (const item of items) {
      const materials = materialsByItem[item.id] ?? [];
      materials.forEach((m) => {
        const requested = sumQty(requestsByMaterial[m.id], 'requested_quantity');
        const supplied = sumQty(suppliesByMaterial[m.id], 'supplied_quantity');
        summaryRows.push({
          'Work Item': item.label,
          'Material': m.material_name,
          'Unit': m.unit,
          'Required (BOQ)': m.required_quantity,
          'Requested': requested,
          'Supplied': supplied,
          'Balance': m.required_quantity - supplied,
        });
      });
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

    // One sheet per work item with full request/supply history
    for (const item of items) {
      const materials = materialsByItem[item.id] ?? [];
      const rows: any[] = [];
      materials.forEach((m) => {
        const requested = sumQty(requestsByMaterial[m.id], 'requested_quantity');
        const supplied = sumQty(suppliesByMaterial[m.id], 'supplied_quantity');
        rows.push({ Material: m.material_name, Unit: m.unit, 'Required (BOQ)': m.required_quantity, Requested: requested, Supplied: supplied, Balance: m.required_quantity - supplied });
        (requestsByMaterial[m.id] ?? []).forEach((r: any) => {
          rows.push({ Material: `  â†³ Request: ${m.material_name}`, Unit: m.unit, 'Required (BOQ)': '', Requested: r.requested_quantity, Supplied: '', Balance: `by ${r.requested_by || 'â€”'} on ${r.request_date}` });
        });
        (suppliesByMaterial[m.id] ?? []).forEach((s: any) => {
          rows.push({ Material: `  â†³ Supply: ${m.material_name}`, Unit: m.unit, 'Required (BOQ)': '', Requested: '', Supplied: s.supplied_quantity, Balance: `vendor ${s.vendor || 'â€”'} on ${s.supply_date}` });
        });
      });
      const sheetName = (item.label || 'Item').slice(0, 31).replace(/[\\/*?:[\]]/g, '');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName || 'Item');
    }

    // Attendance sheet
    const { data: attendance } = await supabase
      .from('site_attendance')
      .select('date, present, latitude, longitude, site_team(name, role)')
      .eq('site_id', siteId)
      .order('date', { ascending: false });
    const attRows = (attendance ?? []).map((a: any) => ({
      Date: a.date,
      Name: a.site_team?.name ?? '',
      Role: a.site_team?.role ?? '',
      Present: a.present ? 'Yes' : 'No',
      Location: a.latitude ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}` : '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attRows), 'Attendance');

    XLSX.writeFile(wb, `${siteName.replace(/[^a-z0-9]/gi, '-')}-BOQ-Report.xlsx`);
    notify('Excel report downloaded');
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={exportExcel} className="bg-emerald-700 text-white hover:bg-emerald-600 transition-colors font-medium px-3 py-2 rounded-lg text-xs">
          ðŸ“Š Export to Excel
        </button>
      </div>
      <div className="bg-[#faf6ec] border border-[#e6dfd0] rounded-lg p-4 mb-5">
        <p className="text-xs uppercase text-[#5c5346] mb-2">Add a BOQ work item</p>
        <div className="flex gap-2 flex-wrap">
          <select className="border border-[#c9bfa8] rounded-lg p-2.5 bg-white text-[#2b2622] focus:outline-none focus:ring-2 focus:ring-[#c9a15a]"
            value={newItem.work_type_id} onChange={(e) => setNewItem({ ...newItem, work_type_id: e.target.value })}>
            <option value="">Select work typeâ€¦</option>
            {workTypes.map((w) => <option key={w.id} value={w.id}>{w.name} (per {w.unit})</option>)}
          </select>
          <input className="border border-[#c9bfa8] rounded-lg p-2.5 flex-1 min-w-[140px] bg-white text-[#2b2622] focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="Label (optional, e.g. 2nd Floor)"
            value={newItem.label} onChange={(e) => setNewItem({ ...newItem, label: e.target.value })} />
          <input className="border border-[#c9bfa8] rounded-lg p-2.5 w-32 bg-white text-[#2b2622] focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="BOQ quantity"
            value={newItem.boq_quantity} onChange={(e) => setNewItem({ ...newItem, boq_quantity: e.target.value })} />
          <button onClick={addWorkItem} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-4 py-2.5 rounded-lg text-sm">
            Add & Calculate
          </button><button
  onClick={async () => {
    const boqText = `${newItem.label || 'BOQ work item'} - Quantity: ${newItem.boq_quantity}`;
    if (!newItem.boq_quantity) {
      notify('Enter BOQ quantity first');
      return;
    }

    try {
      const res = await fetch('/api/ai-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boqText }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        notify(data.error || 'AI material calculation failed');
        return;
      }

      console.log('AI MATERIAL RESULT:', data.result);
      alert(JSON.stringify(data.result, null, 2));
    } catch (error) {
      notify('Could not connect to AI');
    }
  }}
  className="bg-[#2b2622] text-[#f0ead9] hover:bg-[#403a34] transition-colors font-medium px-4 py-2.5 rounded-lg text-sm"
>
  ✨ AI Materials
</button>
        </div>
        {workTypes.length === 0 && (
          <p className="text-xs text-rose-700 mt-2">
            No work types yet â€” <a href="/work-library" target="_blank" className="underline">set up your Work Library</a> first (e.g. Gypsum Partition, Tile Flooring).
          </p>
        )}
      </div>

      {items.length > 0 && (
        <div className="bg-[#faf6ec] border border-[#e6dfd0] rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#5c5346]">
                Site Material Requirement
              </p>
              <p className="text-sm text-[#2b2622] mt-1">
                Total material required across all BOQ work items
              </p>
            </div>
            <span className="text-xs text-[#8a6d3a]">
              {getConsolidatedMaterials().length} materials
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="text-left text-[#5c5346] text-xs uppercase border-b border-[#e6dfd0]">
                  <th className="py-2">Material</th>
                  <th>Unit</th>
                  <th className="text-right">Total Required</th>
                  <th className="text-right">Requested</th>
                  <th className="text-right">Supplied</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {getConsolidatedMaterials().map((m) => {
                  const balance = m.required - m.supplied;

                  return (
                    <tr
                      key={`${m.material_name}-${m.unit}`}
                      className="border-b border-[#f0ead9]"
                    >
                      <td className="py-2 font-medium text-[#2b2622]">
                        {m.material_name}
                      </td>
                      <td className="text-[#5c5346]">{m.unit}</td>
                      <td className="text-right font-medium text-[#2b2622]">
                        {Math.round(m.required * 100) / 100}
                      </td>
                      <td className="text-right text-[#5c5346]">
                        {Math.round(m.requested * 100) / 100}
                      </td>
                      <td className="text-right text-[#5c5346]">
                        {Math.round(m.supplied * 100) / 100}
                      </td>
                      <td
                        className={`text-right font-medium ${
                          balance < 0
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {Math.round(balance * 100) / 100}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {items.map((item) => {
          const materials = materialsByItem[item.id] ?? [];
          return (
            <div key={item.id} className="border border-[#e6dfd0] rounded-lg overflow-hidden">
              <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="w-full flex items-center justify-between px-4 py-3 bg-[#f7f4ef] text-left">
                <span className="font-medium text-[#2b2622]">{item.label} <span className="text-xs text-[#5c5346]">â€” {item.boq_quantity} {item.work_types?.unit}</span></span>
                <span className="text-xs text-[#8a6d3a]">{expanded === item.id ? 'Hide â–²' : `${materials.length} materials â–¼`}</span>
              </button>
              <div className="px-4 py-3 border-t border-[#e6dfd0] bg-white flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#5c5346] font-medium">
                  BOQ Quantity:
                </span>

                <input
                  type="number"
                  min="0"
                  step="any"
                  className="border border-[#c9bfa8] rounded-lg p-2 w-28 bg-white text-[#2b2622] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a15a]"
                  defaultValue={item.boq_quantity}
                  id={`boq-qty-${item.id}`}
                />

                <span className="text-xs text-[#5c5346]">
                  {item.work_types?.unit}
                </span>

                <button
                  onClick={() => {
                    const input = document.getElementById(
                      `boq-qty-${item.id}`
                    ) as HTMLInputElement | null;

                    recalculateWorkItem(
                      item,
                      input?.value ?? String(item.boq_quantity)
                    );
                  }}
                  className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-3 py-2 rounded-lg text-xs"
                >
                  Recalculate Materials
                </button>
              </div>
              {expanded === item.id && (
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="text-left text-[#5c5346] text-xs uppercase border-b border-[#e6dfd0]">
                        <th className="py-2">Material</th>
                        <th className="text-right">Required</th>
                        <th className="text-right">Requested</th>
                        <th className="text-right">Supplied</th>
                        <th className="text-right">Balance</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => {
                        const requested = sumQty(requestsByMaterial[m.id], 'requested_quantity');
                        const supplied = sumQty(suppliesByMaterial[m.id], 'supplied_quantity');
                        const balance = m.required_quantity - supplied;
                        return (
                          <>
                            <tr key={m.id} className="border-b border-[#f0ead9]">
                              <td className="py-2 text-[#2b2622]">{m.material_name} <span className="text-[#5c5346] text-xs">({m.unit})</span></td>
                              <td className="text-right text-[#2b2622]">{m.required_quantity}</td>
                              <td className="text-right text-[#5c5346]">{requested}</td>
                              <td className="text-right text-[#5c5346]">{supplied}</td>
                              <td className={`text-right font-medium ${balance < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{balance}</td>
                              <td className="text-right whitespace-nowrap">
                                <button onClick={() => openAction(m.id, 'request')} className="text-xs text-[#8a6d3a] underline mr-2">Request</button>
                                <button onClick={() => openAction(m.id, 'supply')} className="text-xs text-[#8a6d3a] underline">Supply</button>
                              </td>
                            </tr>
                            {actionRow && actionRow.materialId === m.id && (
                              <tr className="bg-[#faf6ec]">
                                <td colSpan={6} className="p-3">
                                  <div className="flex gap-2 items-center flex-wrap">
                                    <span className="text-xs font-medium text-[#2b2622] capitalize">{actionRow.kind} quantity:</span>
                                    <input className="border border-[#c9bfa8] rounded-lg p-2 w-28 bg-white text-[#2b2622] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="Qty"
                                      value={actionForm.quantity} onChange={(e) => setActionForm({ ...actionForm, quantity: e.target.value })} />
                                    {actionRow.kind === 'request' ? (
                                      <input className="border border-[#c9bfa8] rounded-lg p-2 flex-1 min-w-[120px] bg-white text-[#2b2622] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="Requested by"
                                        value={actionForm.by} onChange={(e) => setActionForm({ ...actionForm, by: e.target.value })} />
                                    ) : (
                                      <input className="border border-[#c9bfa8] rounded-lg p-2 flex-1 min-w-[120px] bg-white text-[#2b2622] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="Vendor"
                                        value={actionForm.vendor} onChange={(e) => setActionForm({ ...actionForm, vendor: e.target.value })} />
                                    )}
                                    <button onClick={() => submitAction(m)} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-3 py-2 rounded-lg text-xs">Save</button>
                                    <button onClick={() => setActionRow(null)} className="text-xs text-[#5c5346] underline">Cancel</button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-[#5c5346]">No BOQ work items added for this site yet.</p>}
      </div>
    </div>
  );
}


function StatusTab({ site, siteId, onSaved, notify }: any) {
  const [form, setForm] = useState({
    work_completed_summary: site.work_completed_summary ?? '',
    work_pending_summary: site.work_pending_summary ?? '',
    extra_required: site.extra_required ?? '',
    start_date: site.start_date ?? '',
    tentative_completion_date: site.tentative_completion_date ?? '',
    status: site.status ?? 'active',
  });

  async function save() {
    const { data } = await supabase.from('sites').update(form).eq('id', siteId).select().single();
    onSaved(data);
    notify('Site status saved');
  }

  return (
    <div className="space-y-4">
      <DaysBanner startDate={form.start_date} targetDate={form.tentative_completion_date} />
      <div>
        <label className="text-sm font-medium">Site status</label>
        <select
          className="border border-[#c9bfa8] rounded-lg p-2.5 w-full mt-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent"
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
          className="border border-[#c9bfa8] rounded-lg p-2.5 w-full mt-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent"
          rows={3}
          value={form.work_completed_summary}
          onChange={(e) => setForm({ ...form, work_completed_summary: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Work pending</label>
        <textarea
          className="border border-[#c9bfa8] rounded-lg p-2.5 w-full mt-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent"
          rows={3}
          value={form.work_pending_summary}
          onChange={(e) => setForm({ ...form, work_pending_summary: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Anything extra required</label>
        <textarea
          className="border border-[#c9bfa8] rounded-lg p-2.5 w-full mt-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent"
          rows={2}
          value={form.extra_required}
          onChange={(e) => setForm({ ...form, extra_required: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Site start date</label>
          <input
            type="date"
            className="border border-[#c9bfa8] rounded-lg p-2.5 w-full mt-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent"
            value={form.start_date ?? ''}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tentative completion date</label>
          <input
            type="date"
            className="border border-[#c9bfa8] rounded-lg p-2.5 w-full mt-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent"
            value={form.tentative_completion_date ?? ''}
            onChange={(e) => setForm({ ...form, tentative_completion_date: e.target.value })}
          />
        </div>
      </div>
      <button onClick={save} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-4 py-2 rounded-lg text-sm">
        Save
      </button>
    </div>
  );
}

// --- Team: engineers / supervisors / labor ---
function TeamTab({ siteId, notify }: { siteId: string; notify: (m: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', role: 'engineer', contact: '' });

  useEffect(() => { load(); }, [siteId]);
  async function load() {
    const { data } = await supabase.from('site_team').select('*').eq('site_id', siteId).order('role');
    setRows(data ?? []);
  }
  async function add() {
    if (!form.name.trim()) return;
    await supabase.from('site_team').insert({ ...form, site_id: siteId });
    notify(`${form.name} added to the team`);
    setForm({ name: '', role: 'engineer', contact: '' });
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 flex-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="border border-[#c9bfa8] rounded-lg p-2.5 bg-white text-[#2b2622] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="engineer">Engineer</option>
          <option value="supervisor">Supervisor</option>
          <option value="labor">Labor</option>
        </select>
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 flex-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Contact" value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <button onClick={add} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-4 py-2 rounded-lg text-sm">Add</button>
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
function MaterialsTab({ siteId, notify }: { siteId: string; notify: (m: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ item: '', quantity: '', vendor: '', status: 'ordered' });

  useEffect(() => { load(); }, [siteId]);
  async function load() {
    const { data } = await supabase.from('site_materials').select('*').eq('site_id', siteId).order('created_at', { ascending: false });
    setRows(data ?? []);
  }
  async function add() {
    if (!form.item.trim()) return;
    await supabase.from('site_materials').insert({ ...form, site_id: siteId, order_date: new Date().toISOString().slice(0, 10) });
    notify(`Order placed: ${form.item}`);
    setForm({ item: '', quantity: '', vendor: '', status: 'ordered' });
    load();
  }
  async function markReceived(id: string, item: string) {
    await supabase.from('site_materials').update({ status: 'received', received_date: new Date().toISOString().slice(0, 10) }).eq('id', id);
    notify(`${item} marked received`);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 flex-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Item" value={form.item}
          onChange={(e) => setForm({ ...form, item: e.target.value })} />
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 w-24 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Qty" value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 flex-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Vendor" value={form.vendor}
          onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        <button onClick={add} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-4 py-2 rounded-lg text-sm">Add Order</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th className="py-2">Item</th><th>Qty</th><th>Vendor</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2">{r.item}</td><td>{r.quantity}</td><td>{r.vendor}</td>
              <td className={r.status === 'received' ? 'text-green-600' : 'text-yellow-600'}>{r.status}</td>
              <td>{r.status !== 'received' && (
                <button onClick={() => markReceived(r.id, r.item)} className="text-xs underline">Mark received</button>
              )}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Attendance: daily check-in with live photo + GPS location proof ---
function AttendanceTab({ siteId, notify }: { siteId: string; notify: (m: string) => void }) {
  const [team, setTeam] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<Record<string, any>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { load(); }, [siteId, date]);
  async function load() {
    const { data: teamData } = await supabase.from('site_team').select('*').eq('site_id', siteId).eq('active', true);
    setTeam(teamData ?? []);
    const { data: att } = await supabase.from('site_attendance').select('*').eq('site_id', siteId).eq('date', date);
    const m: Record<string, any> = {};
    (att ?? []).forEach((a: any) => { m[a.team_member_id] = a; });
    setRecords(m);
  }

  function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 8000 }
      );
    });
  }

  function startCheckIn(memberId: string) {
    fileInputs.current[memberId]?.click();
  }

  async function handlePhoto(memberId: string, name: string, file: File | undefined) {
    if (!file) return;
    setBusyId(memberId);
    try {
      const { lat, lng } = await getLocation();
      const path = `${siteId}/${memberId}/${date}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('attendance-photos').upload(path, file);
      if (uploadError) {
        notify('Photo upload failed â€” check storage bucket setup');
        setBusyId(null);
        return;
      }
      const { data: urlData } = supabase.storage.from('attendance-photos').getPublicUrl(path);
      await supabase.from('site_attendance').upsert(
        { site_id: siteId, team_member_id: memberId, date, present: true, photo_url: urlData.publicUrl, latitude: lat, longitude: lng },
        { onConflict: 'team_member_id,date' }
      );
      notify(`${name} checked in${lat ? ' with location' : ''}`);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function markAbsent(memberId: string, name: string) {
    await supabase.from('site_attendance').upsert(
      { site_id: siteId, team_member_id: memberId, date, present: false },
      { onConflict: 'team_member_id,date' }
    );
    notify(`${name} marked absent`);
    load();
  }

  return (
    <div>
      <input type="date" className="border border-[#c9bfa8] rounded-lg p-2.5 mb-4 bg-white text-[#2b2622] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="space-y-2">
        {team.map((m) => {
          const rec = records[m.id];
          return (
            <div key={m.id} className="flex items-center gap-3 border border-[#e6dfd0] rounded-lg p-2.5">
              {rec?.photo_url ? (
                <img src={rec.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-[#e6dfd0]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#f7f4ef] border border-[#e6dfd0] flex items-center justify-center text-xs text-[#7a7160]">
                  {m.name.slice(0, 1)}
                </div>
              )}
              <div className="flex-1">
                <span className="text-[#2b2622]">{m.name}</span>
                <span className="text-xs text-[#5c5346] capitalize ml-2">({m.role})</span>
                {rec?.latitude && (
                  <a
                    href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-[#8a6d3a] underline"
                  >
                    ðŸ“ View check-in location
                  </a>
                )}
              </div>

              <input
                ref={(el) => { fileInputs.current[m.id] = el; }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhoto(m.id, m.name, e.target.files?.[0])}
              />

              {rec?.present ? (
                <>
                  <span className="text-xs text-emerald-700 font-medium">Present</span>
                  <button onClick={() => markAbsent(m.id, m.name)} className="text-xs text-[#5c5346] underline">
                    Mark absent
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startCheckIn(m.id)}
                    disabled={busyId === m.id}
                    className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                  >
                    {busyId === m.id ? 'Checking inâ€¦' : 'ðŸ“· Check in'}
                  </button>
                  {rec && rec.present === false && (
                    <span className="text-xs text-rose-700">Absent</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[#7a7160] mt-3">
        "Check in" opens your camera and tags your current location â€” used as proof of on-site presence.
      </p>
    </div>
  );
}

// --- Cash: in hand vs required, and account ---
function CashTab({ siteId, notify }: { siteId: string; notify: (m: string) => void }) {
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
    notify('Cash entry logged');
    setForm({ cash_in_hand: '', cash_required: '', account: '', purpose: '' });
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 w-32 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Cash in hand" value={form.cash_in_hand}
          onChange={(e) => setForm({ ...form, cash_in_hand: e.target.value })} />
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 w-32 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Cash required" value={form.cash_required}
          onChange={(e) => setForm({ ...form, cash_required: e.target.value })} />
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 flex-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Account" value={form.account}
          onChange={(e) => setForm({ ...form, account: e.target.value })} />
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 flex-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Purpose" value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
        <button onClick={add} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-4 py-2 rounded-lg text-sm">Log Entry</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th className="py-2">Date</th><th>In hand</th><th>Required</th><th>Account</th><th>Purpose</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2">{r.date}</td><td>â‚¹{r.cash_in_hand}</td><td>â‚¹{r.cash_required}</td>
              <td>{r.account}</td><td>{r.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Milestones: individual work items with tentative vs actual completion ---
function MilestonesTab({ siteId, notify }: { siteId: string; notify: (m: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ work_item: '', tentative_date: '' });

  useEffect(() => { load(); }, [siteId]);
  async function load() {
    const { data } = await supabase.from('site_milestones').select('*').eq('site_id', siteId).order('tentative_date');
    setRows(data ?? []);
  }
  async function add() {
    if (!form.work_item.trim()) return;
    await supabase.from('site_milestones').insert({ ...form, site_id: siteId });
    notify(`Milestone added: ${form.work_item}`);
    setForm({ work_item: '', tentative_date: '' });
    load();
  }
  async function markDone(id: string, item: string) {
    await supabase.from('site_milestones').update({ status: 'completed', actual_completion_date: new Date().toISOString().slice(0, 10) }).eq('id', id);
    notify(`${item} marked complete`);
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input className="border border-[#c9bfa8] rounded-lg p-2.5 flex-1 bg-white text-[#2b2622] placeholder:text-[#7a7160] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" placeholder="Work item" value={form.work_item}
          onChange={(e) => setForm({ ...form, work_item: e.target.value })} />
        <input type="date" className="border border-[#c9bfa8] rounded-lg p-2.5 bg-white text-[#2b2622] focus:outline-none focus:ring-2 focus:ring-[#c9a15a] focus:border-transparent" value={form.tentative_date}
          onChange={(e) => setForm({ ...form, tentative_date: e.target.value })} />
        <button onClick={add} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-4 py-2 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th className="py-2">Work item</th><th>Tentative date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2">{r.work_item}</td><td>{r.tentative_date}</td>
              <td className={r.status === 'completed' ? 'text-green-600' : 'text-gray-600'}>{r.status}</td>
              <td>{r.status !== 'completed' && <button onClick={() => markDone(r.id, r.work_item)} className="text-xs underline">Mark done</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}




