'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import DisbursementReviewModal from '@/components/DisbursementReviewModal';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Layers,
  AlertTriangle,
  Loader2,
  RefreshCw,
  PlusCircle,
  FileText,
} from 'lucide-react';

export default function AdminConsolePage() {
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedDisbursement, setSelectedDisbursement] = useState<any | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);

  // New Campaign Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTarget, setNewTarget] = useState<number>(50000);
  const [newCategory, setNewCategory] = useState('Disaster Relief');
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [campaignMsg, setCampaignMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [disbRes, campRes] = await Promise.all([
        fetch(`/api/disbursements?status=${statusFilter}`),
        fetch('/api/campaigns'),
      ]);

      const disbData = await disbRes.json();
      const campData = await campRes.json();

      if (disbData.success) setDisbursements(disbData.requests);
      if (campData.success) setCampaigns(campData.campaigns);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCampaign(true);
    setCampaignMsg(null);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          targetAmount: Number(newTarget),
          category: newCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create campaign');

      setCampaignMsg('New campaign initialized successfully!');
      setNewTitle('');
      setNewDesc('');
      fetchData();
    } catch (err: any) {
      setCampaignMsg(err.message);
    } finally {
      setCreatingCampaign(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  const pendingCount = disbursements.filter((d) => d.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Executive Governance & Clearances
              </span>
              <span className="text-xs text-slate-400">Restricted to Role: Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Administrative Control Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Two-step financial debit authorization: All disbursements require explicit admin approval before hitting the immutable ledger.
            </p>
          </div>

          <button
            onClick={fetchData}
            title="Refresh Ledger & Requests"
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
        </div>

        {/* Financial Debit Approvals Queue (Admin Exclusive) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-800 gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Disbursement Requests Queue
              </h2>
              <p className="text-xs text-slate-400">
                Approving a request atomically creates a debit in the immutable ledger and updates the campaign balance.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all font-medium ${
                    statusFilter === filter
                      ? 'bg-amber-400 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {disbursements.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>No disbursement requests found with status "{statusFilter}".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Campaign Target</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Operational Purpose</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {disbursements.map((req: any) => {
                    const amount = parseFloat(req.amount);
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'approved';

                    return (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {req.campaign_title}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {req.requested_by_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={req.description}>
                          {req.description}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-amber-400 text-sm whitespace-nowrap">
                          ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isPending
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isPending ? (
                            <button
                              onClick={() => {
                                setSelectedDisbursement(req);
                                setIsReviewOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-sm"
                            >
                              Review & Decide
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Reviewed by {req.reviewed_by_name || 'Admin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Campaign Creation */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6 pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              Launch New Relief Campaign
            </h2>
            <p className="text-xs text-slate-400">
              Initializes a campaign with non-negative constraints <code className="text-emerald-400">target_amount &gt;= 0</code> and <code className="text-emerald-400">current_funding &gt;= 0</code>.
            </p>
          </div>

          {campaignMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              {campaignMsg}
            </div>
          )}

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Flood Crisis Emergency Airlift"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Disaster Relief"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Detailed Operational Description
                </label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mission details and logistical deployment plans"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Amount ($)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTarget}
                  onChange={(e) => setNewTarget(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creatingCampaign}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {creatingCampaign ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Publish Campaign
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Review Modal */}
      <DisbursementReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSuccess={() => fetchData()}
        request={selectedDisbursement}
      />
    </div>
  );
}
