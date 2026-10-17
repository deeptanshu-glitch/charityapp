'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import AllocateStockModal from '@/components/AllocateStockModal';
import TransferStockModal from '@/components/TransferStockModal';
import {
  Package,
  ArrowRightLeft,
  Warehouse,
  History,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function VolunteerHubPage() {
  const [stockLevels, setStockLevels] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [stockRes, txRes, campRes] = await Promise.all([
        fetch('/api/inventory/stock'),
        fetch('/api/inventory/transactions?limit=30'),
        fetch('/api/campaigns'),
      ]);

      const stockData = await stockRes.json();
      const txData = await txRes.json();
      const campData = await campRes.json();

      if (stockData.success) setStockLevels(stockData.stock);
      if (txData.success) setTransactions(txData.transactions);
      if (campData.success) setCampaigns(campData.campaigns);
    } catch (err) {
      console.error('Failed to load volunteer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      </div>
    );
  }

  // Calculate high-level stock statistics
  const totalPhysicalUnits = stockLevels.reduce((acc, s) => acc + s.quantity, 0);
  const uniqueWarehouses = new Set(stockLevels.map((s) => s.warehouse_id)).size;
  const uniqueItems = new Set(stockLevels.map((s) => s.item_id)).size;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Header and Quick Action Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                Logistics & Supply Chain Hub
              </span>
              <span className="text-xs text-slate-400">
                Guaranteed Non-Negative Database Constraints
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Frontline Inventory Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage distributed emergency supplies. All movements execute inside atomic transactions with row locks.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsAllocateOpen(true)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 transition-all shadow-md shadow-sky-950 flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Allocate to Campaign
            </button>
            <button
              onClick={() => setIsTransferOpen(true)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              Inter-Warehouse Transfer
            </button>
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-sky-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Stock In Inventory
              </span>
              <div className="p-2 rounded-lg bg-sky-500/10">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {totalPhysicalUnits.toLocaleString()} units
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ready for rapid frontline dispatch</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Supply Depots
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Warehouse className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{uniqueWarehouses} Facilities</div>
            <p className="text-[11px] text-slate-500 mt-1">Chicago Central & Seattle Coastal</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-purple-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Essential Catalog SKUs
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <History className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{uniqueItems} Items</div>
            <p className="text-[11px] text-slate-500 mt-1">Blankets, RUTF Food, First Aid, Filters</p>
          </div>
        </div>

        {/* Real-Time Warehouse Stock Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-sky-400" />
                Live Warehouse Stock Levels
              </h2>
              <p className="text-xs text-slate-400">
                Backed by PostgreSQL row-level checks <code className="text-sky-300">CHECK (quantity &gt;= 0)</code>.
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg">
              {stockLevels.length} Stock Positions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Warehouse Depot</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Available Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stockLevels.map((row: any) => (
                  <tr
                    key={`${row.warehouse_id}-${row.item_id}`}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-white">{row.warehouse_name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{row.warehouse_location}</td>
                    <td className="py-3.5 px-4 text-slate-200 font-medium">{row.item_name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-sky-400">{row.item_sku}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {row.item_category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-sm text-white">
                      <span
                        className={`px-2.5 py-1 rounded-lg ${
                          row.quantity > 300
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : row.quantity > 50
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {row.quantity} {row.item_unit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Append-Only Inventory Transactions Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Append-Only Inventory Audit Trail
              </h2>
              <p className="text-xs text-slate-400">
                Immutable audit ledger. Trigger prevents UPDATE and DELETE modifications.
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg">
              {transactions.length} Audit Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Campaign Target</th>
                  <th className="py-3 px-4 text-center">Change</th>
                  <th className="py-3 px-4">Reason / Dispatch Note</th>
                  <th className="py-3 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx: any) => {
                  const isPositive = tx.change > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{tx.item_name}</td>
                      <td className="py-3 px-4 text-slate-300">{tx.warehouse_name}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {tx.campaign_title || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[11px] ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {isPositive ? `+${tx.change}` : tx.change}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={tx.reason}>
                        {tx.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {tx.created_by_name}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Allocation Modal */}
      <AllocateStockModal
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        onSuccess={() => fetchData()}
        campaigns={campaigns}
        stockLevels={stockLevels}
      />

      {/* Transfer Modal */}
      <TransferStockModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={() => fetchData()}
        stockLevels={stockLevels}
      />
    </div>
  );
}
