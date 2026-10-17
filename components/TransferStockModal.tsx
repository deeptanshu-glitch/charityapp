'use client';

import { useState } from 'react';
import { X, AlertCircle, Loader2, ArrowRightLeft } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stockLevels: Array<{
    warehouse_id: string;
    warehouse_name: string;
    item_id: string;
    item_name: string;
    item_unit: string;
    quantity: number;
  }>;
}

export default function TransferStockModal({ isOpen, onClose, onSuccess, stockLevels }: Props) {
  const warehouses = Array.from(
    new Map(stockLevels.map((s) => [s.warehouse_id, { id: s.warehouse_id, name: s.warehouse_name }])).values()
  );

  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id || '');
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[1]?.id || warehouses[0]?.id || '');
  const [itemId, setItemId] = useState(stockLevels[0]?.item_id || '');
  const [quantity, setQuantity] = useState<number>(20);
  const [reason, setReason] = useState('Regional inventory rebalancing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const itemsInFromWarehouse = stockLevels.filter((s) => s.warehouse_id === fromWarehouseId);
  const selectedItemStock = itemsInFromWarehouse.find((s) => s.item_id === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          fromWarehouseId,
          toWarehouseId,
          quantity: Number(quantity),
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
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

        <h3 className="text-lg font-bold text-white mb-1">Inter-Warehouse Transfer</h3>
        <p className="text-xs text-slate-400 mb-5">
          Atomic double-entry transaction ordered by warehouse ID to prevent concurrency deadlocks.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                From Warehouse
              </label>
              <select
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(e.target.value)}
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
                To Warehouse
              </label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === fromWarehouseId}>
                    {w.name} {w.id === fromWarehouseId ? '(Source)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Item to Relocate
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {itemsInFromWarehouse.map((s) => (
                <option key={s.item_id} value={s.item_id}>
                  {s.item_name} (Current: {s.quantity} {s.item_unit})
                </option>
              ))}
            </select>
          </div>

          {selectedItemStock && (
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs flex justify-between items-center">
              <span className="text-slate-400">Available at Source Hub:</span>
              <span className="font-bold text-sky-400">
                {selectedItemStock.quantity} {selectedItemStock.item_unit}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Transfer Quantity
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
              Transfer Reason
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transfer Inventory
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
