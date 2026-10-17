'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaigns: Array<{ id: string; title: string }>;
  stockLevels: Array<{
    warehouse_id: string;
    warehouse_name: string;
    item_id: string;
    item_name: string;
    item_unit: string;
    quantity: number;
  }>;
}

export default function AllocateStockModal({
  isOpen,
  onClose,
  onSuccess,
  campaigns,
  stockLevels,
}: Props) {
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(stockLevels[0]?.warehouse_id || '');
  const [itemId, setItemId] = useState(stockLevels[0]?.item_id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Extract unique warehouses
  const warehouses = Array.from(
    new Map(stockLevels.map((s) => [s.warehouse_id, { id: s.warehouse_id, name: s.warehouse_name }])).values()
  );

  // Filter items available in the selected warehouse
  const itemsInWarehouse = stockLevels.filter((s) => s.warehouse_id === warehouseId);
  const currentSelectedStock = itemsInWarehouse.find((s) => s.item_id === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/inventory/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          itemId,
          warehouseId,
          quantity: Number(quantity),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Allocation failed');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to allocate stock');
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

        <h3 className="text-lg font-bold text-white mb-1">Allocate Supplies to Campaign</h3>
        <p className="text-xs text-slate-400 mb-5">
          Atomic database transaction will lock row, decrement stock, and log audit entry.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Destination Campaign
            </label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Source Warehouse
              </label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  const firstItem = stockLevels.find((s) => s.warehouse_id === e.target.value);
                  if (firstItem) setItemId(firstItem.item_id);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Item
              </label>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {itemsInWarehouse.map((s) => (
                  <option key={s.item_id} value={s.item_id}>
                    {s.item_name} (Avail: {s.quantity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentSelectedStock && (
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs flex justify-between items-center">
              <span className="text-slate-400">Available In Selected Facility:</span>
              <span
                className={`font-bold ${
                  currentSelectedStock.quantity > 50
                    ? 'text-emerald-400'
                    : currentSelectedStock.quantity > 0
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {currentSelectedStock.quantity} {currentSelectedStock.item_unit}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Quantity to Allocate
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Field Notes / Manifest
            </label>
            <input
              type="text"
              placeholder="e.g. Dispatched for frontline tent zone 3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Execute Allocation
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
