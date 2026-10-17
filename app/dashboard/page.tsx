'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Heart,
  DollarSign,
  TrendingUp,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Layers,
  Loader2,
} from 'lucide-react';

export default function DonorDashboardPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/donor/receipts').then((r) => r.json()),
    ])
      .then(([userData, receiptData]) => {
        if (userData?.authenticated) setUser(userData.user);
        if (receiptData?.success) setReceipts(receiptData.receipts);
      })
      .catch((err) => console.error('Dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  // Calculate personal donor metrics
  const totalContributed = receipts.reduce(
    (acc, r) => acc + parseFloat(r.amount),
    0
  );
  const uniqueCampaigns = new Set(receipts.map((r) => r.campaign_id)).size;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Verified Philanthropist Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Supporter'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Trace how every single dollar of your contributions is directly allocated and deployed on the frontlines.
            </p>
          </div>

          <Link
            href="/"
            className="py-3 px-5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md shadow-emerald-950 flex items-center gap-2 flex-shrink-0"
          >
            <Heart className="w-4 h-4 fill-slate-950" />
            Explore More Campaigns
          </Link>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                My Total Contributions
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              ${totalContributed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verified on immutable ledger</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-sky-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Initiatives Empowered
              </span>
              <div className="p-2 rounded-lg bg-sky-500/10">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{uniqueCampaigns}</div>
            <p className="text-[11px] text-slate-500 mt-1">Active relief campaigns supported</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tax Receipts Generated
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{receipts.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">501(c)(3) Compliant audit records</p>
          </div>
        </div>

        {/* Contribution Receipts & Traceability Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Contribution Receipts & Direct Impact Trace
              </h2>
              <p className="text-xs text-slate-400">
                Click any campaign to inspect how leadership deployed funds toward equipment, food, or medical relief.
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg self-start sm:self-auto">
              {receipts.length} Direct Receipts
            </span>
          </div>

          {receipts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Heart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>You have not made any recorded donations under this account yet.</p>
              <Link
                href="/"
                className="mt-3 inline-block text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Browse campaigns to make your first gift &rarr;
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Receipt Date</th>
                    <th className="py-3 px-4">Campaign Target</th>
                    <th className="py-3 px-4">Dedication / Note</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Cumulative Giving</th>
                    <th className="py-3 px-4 text-center">Impact Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {receipts.map((r: any) => {
                    const amount = parseFloat(r.amount);
                    const cumulative = parseFloat(r.cumulative_given);

                    return (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{r.campaign_title}</div>
                          <span className="text-[10px] text-emerald-400 uppercase tracking-wider">
                            {r.campaign_category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                          {r.description}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm whitespace-nowrap">
                          +${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                          ${cumulative.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Link
                            href={`/campaigns/${r.campaign_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all"
                          >
                            Trace Ledger
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
