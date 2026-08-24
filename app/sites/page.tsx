'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CATEGORY_ICON, CATEGORY_IMAGE, HERO_IMAGE } from '@/lib/images';

type SiteOverview = {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  category: string | null;
  status: string;
  start_date: string | null;
  tentative_completion_date: string | null;
  team_count: number;
  materials_pending: number;
  latest_cash_in_hand: number | null;
  latest_cash_required: number | null;
};

function daysRemaining(target: string | null): number | null {
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(target).getTime() - today.getTime()) / 86400000);
}

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

      {/* Hero photo banner */}
      <div className="relative h-40 md:h-56 w-full overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2b2622]/80 via-[#2b2622]/20 to-transparent" />
        <div className="absolute bottom-3 left-0 right-0 max-w-6xl mx-auto px-6">
          <p className="text-[#f0ead9] text-sm">Offices · Hotels · Workspaces — Pan-India Fit-Out</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-lg font-medium text-[#3a352f]">Live Sites ({sites.length})</h2>
          <p className="text-xs text-[#5c5346]">Offices · Hotels · Workspaces — Pan-India</p>
        </div>

        {/* Pivot summary table — all sites, one row each, totals at bottom */}
        {sites.length > 0 && (
          <div className="mb-8 bg-white border border-[#e6dfd0] rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-[#e6dfd0] bg-[#f7f4ef] text-[#5c5346] text-[10px] uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Site</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Team</th>
                  <th className="text-right px-4 py-3">Materials</th>
                  <th className="text-right px-4 py-3">Cash in hand</th>
                  <th className="text-right px-4 py-3">Cash required</th>
                  <th className="text-right px-4 py-3">Cash delta</th>
                  <th className="text-left px-4 py-3">Target</th>
                  <th className="text-right px-4 py-3">Days left</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => {
                  const inHand = site.latest_cash_in_hand ?? 0;
                  const required = site.latest_cash_required ?? 0;
                  const delta = inHand - required;
                  return (
                    <tr key={site.id} className="border-b border-[#f0ead9] last:border-0 hover:bg-[#f7f4ef]">
                      <td className="px-4 py-2.5">
                        <Link href={`/sites/${site.id}`} className="font-medium text-[#2b2622] hover:underline">
                          {site.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-medium ${
                            site.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : site.status === 'on_hold'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {site.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#3a352f]">{site.team_count}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={site.materials_pending === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {site.materials_pending === 0 ? '▲ 0 pending' : `▼ ${site.materials_pending} pending`}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#3a352f]">₹{inHand.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right text-[#3a352f]">₹{required.toLocaleString('en-IN')}</td>
                      <td className={`px-4 py-2.5 text-right font-medium ${delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {delta >= 0 ? '▲' : '▼'} ₹{Math.abs(delta).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5 text-[#5c5346]">
                        {site.tentative_completion_date
                          ? new Date(site.tentative_completion_date).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {(() => {
                          const d = daysRemaining(site.tentative_completion_date);
                          if (d === null) return <span className="text-[#5c5346]">—</span>;
                          return (
                            <span className={d < 0 ? 'text-rose-700 font-medium' : 'text-[#3a352f]'}>
                              {d < 0 ? `${Math.abs(d)}d overdue` : `${d}d left`}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#2b2622] text-[#f0ead9] font-medium">
                  <td className="px-4 py-3">Total ({sites.length} sites)</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right">{sites.reduce((s, x) => s + x.team_count, 0)}</td>
                  <td className="px-4 py-3 text-right">{sites.reduce((s, x) => s + x.materials_pending, 0)} pending</td>
                  <td className="px-4 py-3 text-right">
                    ₹{sites.reduce((s, x) => s + (x.latest_cash_in_hand ?? 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ₹{sites.reduce((s, x) => s + (x.latest_cash_required ?? 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right text-[#c9a15a]">
                    ₹{Math.abs(sites.reduce((s, x) => s + (x.latest_cash_in_hand ?? 0) - (x.latest_cash_required ?? 0), 0)).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

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
                {/* Category photo */}
                <div className="h-28 -mx-5 -mt-5 mb-4 rounded-t-xl overflow-hidden relative">
                  <img
                    src={CATEGORY_IMAGE[site.category ?? ''] ?? CATEGORY_IMAGE.office}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-white text-xs font-medium capitalize">
                    {site.category ?? 'site'}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-[#2b2622] flex items-center gap-2">
                    <span>{CATEGORY_ICON[site.category ?? ''] ?? '🏗️'}</span>
                    {site.name}
                  </h3>
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
                <p className="text-sm text-[#5c5346] mb-3">
                  {site.client} · {site.location} {site.category && `· ${site.category}`}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#f7f4ef] rounded-lg px-3 py-2">
                    <p className="text-[10px] uppercase text-[#5c5346] mb-0.5">Team</p>
                    <p className="font-medium text-[#2b2622]">{site.team_count}</p>
                  </div>
                  <div className="bg-[#f7f4ef] rounded-lg px-3 py-2">
                    <p className="text-[10px] uppercase text-[#5c5346] mb-0.5 flex items-center gap-1">
                      Materials <Arrow positive={materialsHealthy} />
                    </p>
                    <p className="font-medium text-[#2b2622]">
                      {materialsHealthy ? 'All received' : `${site.materials_pending} pending`}
                    </p>
                  </div>
                  <div className="bg-[#f7f4ef] rounded-lg px-3 py-2 col-span-2">
                    <p className="text-[10px] uppercase text-[#5c5346] mb-0.5 flex items-center gap-1">
                      Cash position <Arrow positive={cashHealthy} />
                    </p>
                    <p className={`font-medium ${cashHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>
                      ₹{(site.latest_cash_in_hand ?? 0).toLocaleString('en-IN')} in hand
                      {' '}vs ₹{(site.latest_cash_required ?? 0).toLocaleString('en-IN')} required
                    </p>
                  </div>
                </div>

                {site.tentative_completion_date && (
                  <p className="mt-3 text-xs text-[#5c5346]">
                    Target completion: {new Date(site.tentative_completion_date).toLocaleDateString('en-IN')}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {sites.length === 0 && (
          <div className="text-center py-16 text-[#5c5346]">
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
