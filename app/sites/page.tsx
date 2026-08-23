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

function Arrow({ positive }: { positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>
      {positive ? '▲' : '▼'}
    </span>
  );
}

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

  if (loading) return <div className="min-h-screen bg-[#f7f4ef] p-8 text-[#3a352f]">Loading sites...</div>;

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      {/* Brand header band */}
      <div className="bg-[#2b2622] text-[#f0ead9]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#c9a15a] mb-1">Mysticape Concepts</p>
            <h1 className="text-xl font-medium">Manoj Kumar Sharma <span className="text-[#c9a15a]">·</span> Operations Head</h1>
          </div>
          <Link
            href="/sites/new"
            className="bg-[#c9a15a] text-[#2b2622] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#d8b26e] transition-colors"
          >
            + Add Site
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-medium text-[#3a352f]">Live Sites ({sites.length})</h2>
          <p className="text-xs text-[#8a8073]">Offices · Hotels · Workspaces — Pan-India</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sites.map((site) => {
            const cashHealthy = (site.latest_cash_in_hand ?? 0) >= (site.latest_cash_required ?? 0);
            const materialsHealthy = site.materials_pending === 0;

            return (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="bg-white border border-[#e6dfd0] rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {/* Category strip */}
                <div className="h-1.5 -mx-5 -mt-5 mb-4 rounded-t-xl bg-gradient-to-r from-[#c9a15a] to-[#8a6d3a]" />

                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-[#2b2622]">{site.name}</h3>
                  <span
                    className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-medium ${
                      site.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : site.status === 'on_hold'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {site.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-[#8a8073] mb-3">
                  {site.client} · {site.location} {site.category && `· ${site.category}`}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#f7f4ef] rounded-lg px-3 py-2">
                    <p className="text-[10px] uppercase text-[#8a8073] mb-0.5">Team</p>
                    <p className="font-medium text-[#2b2622]">{site.team_count}</p>
                  </div>
                  <div className="bg-[#f7f4ef] rounded-lg px-3 py-2">
                    <p className="text-[10px] uppercase text-[#8a8073] mb-0.5 flex items-center gap-1">
                      Materials <Arrow positive={materialsHealthy} />
                    </p>
                    <p className="font-medium text-[#2b2622]">
                      {materialsHealthy ? 'All received' : `${site.materials_pending} pending`}
                    </p>
                  </div>
                  <div className="bg-[#f7f4ef] rounded-lg px-3 py-2 col-span-2">
                    <p className="text-[10px] uppercase text-[#8a8073] mb-0.5 flex items-center gap-1">
                      Cash position <Arrow positive={cashHealthy} />
                    </p>
                    <p className={`font-medium ${cashHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>
                      ₹{(site.latest_cash_in_hand ?? 0).toLocaleString('en-IN')} in hand
                      {' '}vs ₹{(site.latest_cash_required ?? 0).toLocaleString('en-IN')} required
                    </p>
                  </div>
                </div>

                {site.tentative_completion_date && (
                  <p className="mt-3 text-xs text-[#8a8073]">
                    Target completion: {new Date(site.tentative_completion_date).toLocaleDateString('en-IN')}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {sites.length === 0 && (
          <div className="text-center py-16 text-[#8a8073]">
            <p className="mb-3">No sites added yet.</p>
            <Link href="/sites/new" className="text-[#8a6d3a] font-medium underline">
              Add your first site
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
