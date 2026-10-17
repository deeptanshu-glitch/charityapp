'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CampaignFinancialChart from '@/components/CampaignFinancialChart';
import DonateModal from '@/components/DonateModal';
import {
  TrendingUp,
  Package,
  Heart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
} from 'lucide-react';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [campRes, ledgerRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`),
        fetch(`/api/ledger/campaign/${campaignId}`),
      ]);

      const campData = await campRes.json();
      const ledgerData = await ledgerRes.json();

      if (campData.success) {
        setCampaign(campData.campaign);
        setAllocations(campData.allocations || []);
      }
      if (ledgerData.success) {
        setLedger(ledgerData.ledger || []);
      }
    } catch (err) {
      console.error('Error fetching campaign details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

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

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
          <h2 className="text-xl font-bold">Campaign Not Found</h2>
          <p className="text-xs text-slate-400 mt-2">The specified campaign does not exist or has ended.</p>
        </div>
      </div>
    );
  }

  const target = parseFloat(campaign.target_amount);
  const current = parseFloat(campaign.current_funding);
  const totalIn = parseFloat(campaign.total_in || '0');
  const totalOut = parseFloat(campaign.total_out || '0');
  const percent = Math.min(Math.round((current / (target || 1)) * 100), 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Campaign Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {campaign.category}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Ledger
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {campaign.title}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {campaign.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
              <button
                onClick={() => setIsDonateOpen(true)}
                className="w-full py-3 px-5 rounded-xl text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-slate-950" />
                Make a Contribution
              </button>
            </div>
          </div>

          {/* Funding Progress Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-2xl font-black text-emerald-400">
                  ${current.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-2">current unspent balance</span>
              </div>
              <div className="text-right text-xs text-slate-400">
                Target: <span className="font-semibold text-white">${target.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{campaign.donor_count || 0} unique donors</span>
              <span>{percent}% of target achieved</span>
            </div>
          </div>
        </div>

        {/* 3 Key Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Funds In (Credits)
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              ${totalIn.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">All verified donor contributions</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Funds Deployed (Debits)
              </span>
              <div className="p-2 rounded-lg bg-rose-500/10">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              ${totalOut.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Admin-approved operational disbursements</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-sky-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Treasury Balance
              </span>
              <div className="p-2 rounded-lg bg-sky-500/10">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              ${current.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Guaranteed $\ge$ 0 via Postgres CHECK constraint
            </p>
          </div>
        </div>

        {/* Recharts Financial Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Financial Flow & Rolling Balance Timeline</h2>
              <p className="text-xs text-slate-400">
                Interactive Recharts visualization tracing deposits, disbursements, and cumulative balance.
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-sky-300 font-mono self-start sm:self-auto">
              SQL Window Function
            </span>
          </div>

          <CampaignFinancialChart ledger={ledger} />
        </div>

        {/* Physical Inventory Deployment Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-400" />
                Physical Relief Supplies Allocated
              </h2>
              <p className="text-xs text-slate-400">
                Physical donations deployed to this campaign from regional distribution centers.
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
              {allocations.length} Shipments
            </span>
          </div>

          {allocations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No physical inventory supplies deployed yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allocations.map((a: any) => (
                <div
                  key={a.id}
                  className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">{a.item_name}</span>
                    <span className="font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {a.allocated_quantity} {a.item_unit}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Dispatched from: <span className="text-slate-200">{a.warehouse_name}</span>
                  </div>
                  {a.notes && (
                    <p className="text-[11px] italic text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                      "{a.notes}"
                    </p>
                  )}
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex justify-between">
                    <span>By {a.created_by_name}</span>
                    <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Immutable Ledger Table (Window Function Showcase) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Immutable Ledger Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Calculated natively in PostgreSQL using{' '}
                <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded text-[11px]">
                  SUM(...) OVER (PARTITION BY campaign_id ORDER BY created_at, id)
                </code>
              </p>
            </div>
            <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 self-start sm:self-auto">
              {ledger.length} Ledger Records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Donor / Vendor</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ledger.map((entry: any) => {
                  const isCredit = entry.type === 'credit';
                  const amount = parseFloat(entry.amount);
                  const running = parseFloat(entry.running_balance);

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCredit
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {entry.donor_name}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                          isCredit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-sky-400 whitespace-nowrap font-mono">
                        ${running.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Donate Modal */}
      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        onSuccess={() => fetchData()}
        campaignId={campaign.id}
        campaignTitle={campaign.title}
      />
    </div>
  );
}
