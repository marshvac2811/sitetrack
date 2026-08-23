'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type SiteOverview = {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  category: string | null;
  status: string;
  tentative_completion_date: string | null;
  team_count: number;
  materials_pending: number;
  latest_cash_in_hand: number | null;
  latest_cash_required: number | null;
};

export default function SitesPage() {
  const [sites, setSites] = useState<SiteOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('site_overview')
      .select('*')
      .order('name');
    setSites(data ?? []);
    setLoading(false);
  }

  if (loading) return <div className="p-8">Loading sites...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Manoj Kumar Sharma — Operations Head</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Sites ({sites.length})</h1>
        <Link href="/sites/new" className="bg-black text-white px-4 py-2 rounded-lg text-sm">
          + Add Site
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => (
          <Link
            key={site.id}
            href={`/sites/${site.id}`}
            className="border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-medium">{site.name}</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  site.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : site.status === 'on_hold'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {site.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500">{site.client} · {site.location}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>Team: {site.team_count}</div>
              <div>Materials pending: {site.materials_pending}</div>
              <div>Cash in hand: ₹{site.latest_cash_in_hand ?? 0}</div>
              <div>Cash required: ₹{site.latest_cash_required ?? 0}</div>
            </div>
            {site.tentative_completion_date && (
              <p className="mt-2 text-xs text-gray-500">
                Target: {new Date(site.tentative_completion_date).toLocaleDateString()}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
