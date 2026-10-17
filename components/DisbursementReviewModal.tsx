'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DisbursementRequest {
  id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_current_funding: string;
  amount: string;
  description: string;
  requested_by_name: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: DisbursementRequest | null;
}

export default function DisbursementReviewModal({
  isOpen,
  onClose,
  onSuccess,
  request,
}: Props) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const reqAmount = parseFloat(request.amount);
  const availableFunding = parseFloat(request.campaign_current_funding);
  const hasInsufficientFunds = availableFunding < reqAmount;

  const handleDecision = async (status: 'approved' | 'rejected') => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/disbursements/${request.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes || `Decision: ${status} by Administrator.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to review request');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Review Disbursement Request</h3>
        <p className="text-xs text-slate-400 mb-5">
          Admin clearance required before debit hits the immutable ledger.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-3 mb-5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Target Campaign:</span>
            <span className="text-white font-medium">{request.campaign_title}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Requested Amount:</span>
            <span className="text-amber-400 font-extrabold text-sm">
              ${reqAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Campaign Available Funding:</span>
            <span
              className={`font-bold ${
                hasInsufficientFunds ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              ${availableFunding.toLocaleString()}
            </span>
          </div>

          {hasInsufficientFunds && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
              <strong>Warning:</strong> Requested debit exceeds current campaign balance. The database CHECK constraint will block approval.
            </div>
          )}

          <div className="pt-2 border-t border-slate-700 text-slate-300">
            <span className="text-slate-400 block mb-1">Operational Purpose:</span>
            <p className="italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
              "{request.description}"
            </p>
          </div>

          <div className="text-[11px] text-slate-400">
            Submitted by: <span className="text-slate-200">{request.requested_by_name}</span> on{' '}
            {new Date(request.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Admin Review Notes
          </label>
          <textarea
            rows={2}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="e.g. Verified vendor manifest & invoice #4412"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDecision('rejected')}
            className="px-4 py-2 rounded-lg text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            Reject Request
          </button>
          <button
            type="button"
            disabled={loading || hasInsufficientFunds}
            onClick={() => handleDecision('approved')}
            className="px-5 py-2 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-slate-950" />
                Approve & Debit Ledger
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
