'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CATEGORY_IMAGE } from '@/lib/images';

export default function NewSitePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', client: '', location: '', category: 'office' });

  async function create() {
    const { data } = await supabase.from('sites').insert(form).select().single();
    if (data) router.push(`/sites/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <div className="bg-[#2b2622] text-[#f0ead9]">
        <div className="max-w-md mx-auto px-6 py-6">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#c9a15a] mb-1">Mysticape Concepts</p>
          <h1 className="text-xl font-medium">Add a new site</h1>
        </div>
      </div>

      <div className="relative h-32 w-full overflow-hidden">
        <img src={CATEGORY_IMAGE[form.category] ?? CATEGORY_IMAGE.office} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f7f4ef] to-transparent" />
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-white border border-[#e6dfd0] rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs uppercase text-[#5c5346] mb-1 block">Site name</label>
            <input className="border border-[#e6dfd0] rounded-lg p-2.5 w-full focus:outline-none focus:border-[#c9a15a]" placeholder="e.g. DLF Tower 3"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs uppercase text-[#5c5346] mb-1 block">Client</label>
            <input className="border border-[#e6dfd0] rounded-lg p-2.5 w-full focus:outline-none focus:border-[#c9a15a]" placeholder="Client name"
              value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
          </div>
          <div>
            <label className="text-xs uppercase text-[#5c5346] mb-1 block">Location</label>
            <input className="border border-[#e6dfd0] rounded-lg p-2.5 w-full focus:outline-none focus:border-[#c9a15a]" placeholder="City / area"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="text-xs uppercase text-[#5c5346] mb-1 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'office', label: 'Office', icon: '🏢' },
                { value: 'hotel', label: 'Hotel', icon: '🏨' },
                { value: 'workspace', label: 'Workspace', icon: '🧩' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: c.value })}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    form.category === c.value
                      ? 'border-[#c9a15a] bg-[#faf6ec]'
                      : 'border-[#e6dfd0] hover:bg-[#f7f4ef]'
                  }`}
                >
                  <div className="text-lg mb-0.5">{c.icon}</div>
                  <div className="text-xs text-[#3a352f]">{c.label}</div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={create} className="bg-[#c9a15a] text-[#2b2622] hover:bg-[#d8b26e] transition-colors font-medium px-4 py-2.5 rounded-lg text-sm w-full">
            Create site
          </button>
        </div>
      </div>
    </div>
  );
}
