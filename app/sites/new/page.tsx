'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewSitePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', client: '', location: '', category: 'office' });

  async function create() {
    const { data } = await supabase.from('sites').insert(form).select().single();
    if (data) router.push(`/sites/${data.id}`);
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Add a new site</h1>
      <input className="border rounded-lg p-2 w-full" placeholder="Site name (e.g. DLF Tower 3)"
        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="border rounded-lg p-2 w-full" placeholder="Client"
        value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
      <input className="border rounded-lg p-2 w-full" placeholder="Location"
        value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <select className="border rounded-lg p-2 w-full" value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}>
        <option value="office">Office</option>
        <option value="hotel">Hotel</option>
        <option value="workspace">Workspace</option>
      </select>
      <button onClick={create} className="bg-black text-white px-4 py-2 rounded-lg text-sm w-full">
        Create site
      </button>
    </div>
  );
}
