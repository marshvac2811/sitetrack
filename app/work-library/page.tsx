'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SEED_LIBRARY = [
  {
    name: 'Gypsum Wall Partition',
    unit: 'sqft',
    materials: [
      { material_name: 'Gypsum Board 12mm', unit: 'sqft', consumption_per_unit: 2.1, wastage_percent: 5 },
      { material_name: 'Floor/Ceiling Track', unit: 'rft', consumption_per_unit: 0.22, wastage_percent: 5 },
      { material_name: 'E Section / Stud', unit: 'rft', consumption_per_unit: 0.7, wastage_percent: 5 },
      { material_name: 'Screws', unit: 'nos', consumption_per_unit: 4, wastage_percent: 5 },
      { material_name: 'Jointing Compound', unit: 'kg', consumption_per_unit: 0.1, wastage_percent: 5 },
      { material_name: 'Gypsum Tape', unit: 'm', consumption_per_unit: 0.5, wastage_percent: 5 },
      { material_name: 'Anchors/Fasteners', unit: 'nos', consumption_per_unit: 0.5, wastage_percent: 5 },
    ],
  },
  {
    name: 'Vitrified Tile Flooring',
    unit: 'sqft',
    materials: [
      { material_name: 'Vitrified Tiles', unit: 'sqft', consumption_per_unit: 1.05, wastage_percent: 5 },
      { material_name: 'Cement', unit: 'kg', consumption_per_unit: 4, wastage_percent: 5 },
      { material_name: 'Sand', unit: 'kg', consumption_per_unit: 10, wastage_percent: 5 },
      { material_name: 'Tile Adhesive', unit: 'kg', consumption_per_unit: 3, wastage_percent: 5 },
      { material_name: 'Grout', unit: 'kg', consumption_per_unit: 0.3, wastage_percent: 0 },
      { material_name: 'Spacers', unit: 'nos', consumption_per_unit: 4, wastage_percent: 0 },
    ],
  },
];

export default function WorkLibraryPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [materialsByType, setMaterialsByType] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newType, setNewType] = useState({ name: '', unit: '' });
  const [newMaterial, setNewMaterial] = useState({ material_name: '', unit: '', consumption_per_unit: '', wastage_percent: '5' });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: t } = await supabase.from('work_types').select('*').order('name');
    setTypes(t ?? []);
    const { data: m } = await supabase.from('work_type_materials').select('*');
    const grouped: Record<string, any[]> = {};
    (m ?? []).forEach((row: any) => {
      grouped[row.work_type_id] = grouped[row.work_type_id] ?? [];
      grouped[row.work_type_id].push(row);
    });
    setMaterialsByType(grouped);
  }

  async function addType() {
    if (!newType.name.trim() || !newType.unit.trim()) return;
    await supabase.from('work_types').insert(newType);
    setNewType({ name: '', unit: '' });
    load();
  }

  async function addMaterial(workTypeId: string) {
    if (!newMaterial.material_name.trim()) return;
    await supabase.from('work_type_materials').insert({
      work_type_id: workTypeId,
      material_name: newMaterial.material_name,
      unit: newMaterial.unit,
      consumption_per_unit: Number(newMaterial.consumption_per_unit) || 0,
      wastage_percent: Number(newMaterial.wastage_percent) || 0,
    });
    setNewMaterial({ material_name: '', unit: '', consumption_per_unit: '', wastage_percent: '5' });
    load();
  }

  async function removeMaterial(id: string) {
    await supabase.from('work_type_materials').delete().eq('id', id);
    load();
  }

  async function seedLibrary() {
    for (const wt of SEED_LIBRARY) {
      const { data: existing } = await supabase.from('work_types').select('id').eq('name', wt.name).maybeSingle();
      if (existing) continue;
      const { data: created } = await supabase.from('work_types').insert({ name: wt.name, unit: wt.unit }).select().single();
      if (created) {
        await supabase.from('work_type_materials').insert(
          wt.materials.map((m) => ({ ...m, work_type_id: created.id }))
        );
      }
    }
    load();
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <div className="bg-[#2b2622] text-[#f0ead9]">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#c9a15a] mb-1">Mysticape Concepts</p>
            <h1 className="text-xl font-medium">Work Library — Material Recipes</h1>
          </div>
          <Link href="/sites" className="text-sm text-[#e8dfc9] underline">← Back to Sites</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {types.length === 0 && (
          <div className="bg-white border border-[#e6dfd0] rounded-xl p-6 mb-6 text-center">
            <p className="text-[#5c5346] mb-3">No work types yet. Start with the two standard examples, or add your own below.</p>
            <button onClick={seedLibrary} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-4 py-2 rounded-lg text-sm">
              Load Gypsum Partition + Tile Flooring examples
            </button>
          </div>
        )}

        <div className="bg-white border border-[#e6dfd0] rounded-xl p-5 mb-6">
          <p className="text-xs uppercase text-[#5c5346] mb-2">Add a new work type</p>
          <div className="flex gap-2">
            <input className="border border-[#c9bfa8] rounded-lg p-2.5 flex-1 bg-white text-[#2b2622] focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="e.g. Aluminium Partition"
              value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} />
            <input className="border border-[#c9bfa8] rounded-lg p-2.5 w-28 bg-white text-[#2b2622] focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="Unit (sqft)"
              value={newType.unit} onChange={(e) => setNewType({ ...newType, unit: e.target.value })} />
            <button onClick={addType} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-4 py-2 rounded-lg text-sm">Add</button>
          </div>
        </div>

        <div className="space-y-3">
          {types.map((t) => (
            <div key={t.id} className="bg-white border border-[#e6dfd0] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#f7f4ef]"
              >
                <span className="font-medium text-[#2b2622]">{t.name} <span className="text-xs text-[#5c5346]">(per {t.unit})</span></span>
                <span className="text-xs text-[#8a6d3a]">{expanded === t.id ? 'Hide recipe ▲' : 'Show recipe ▼'}</span>
              </button>
              {expanded === t.id && (
                <div className="px-5 pb-5">
                  <table className="w-full text-sm mb-3">
                    <thead>
                      <tr className="text-left text-[#5c5346] text-xs uppercase border-b border-[#e6dfd0]">
                        <th className="py-2">Material</th>
                        <th>Unit</th>
                        <th className="text-right">Qty per {t.unit}</th>
                        <th className="text-right">Wastage %</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(materialsByType[t.id] ?? []).map((m) => (
                        <tr key={m.id} className="border-b border-[#f0ead9]">
                          <td className="py-2 text-[#2b2622]">{m.material_name}</td>
                          <td className="text-[#5c5346]">{m.unit}</td>
                          <td className="text-right text-[#2b2622]">{m.consumption_per_unit}</td>
                          <td className="text-right text-[#5c5346]">{m.wastage_percent}%</td>
                          <td className="text-right">
                            <button onClick={() => removeMaterial(m.id)} className="text-xs text-rose-700 underline">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex gap-2 flex-wrap">
                    <input className="border border-[#c9bfa8] rounded-lg p-2 flex-1 min-w-[140px] bg-white text-[#2b2622] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="Material name"
                      value={newMaterial.material_name} onChange={(e) => setNewMaterial({ ...newMaterial, material_name: e.target.value })} />
                    <input className="border border-[#c9bfa8] rounded-lg p-2 w-20 bg-white text-[#2b2622] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="Unit"
                      value={newMaterial.unit} onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })} />
                    <input className="border border-[#c9bfa8] rounded-lg p-2 w-28 bg-white text-[#2b2622] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="Qty/unit"
                      value={newMaterial.consumption_per_unit} onChange={(e) => setNewMaterial({ ...newMaterial, consumption_per_unit: e.target.value })} />
                    <input className="border border-[#c9bfa8] rounded-lg p-2 w-24 bg-white text-[#2b2622] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a15a]" placeholder="Wastage %"
                      value={newMaterial.wastage_percent} onChange={(e) => setNewMaterial({ ...newMaterial, wastage_percent: e.target.value })} />
                    <button onClick={() => addMaterial(t.id)} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-3 py-2 rounded-lg text-sm">Add</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
