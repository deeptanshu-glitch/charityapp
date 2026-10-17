import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getAllCampaigns } from '@/lib/ledger';
import {
  HeartHandshake,
  ShieldCheck,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let campaigns: any[] = [];
  try {
    campaigns = await getAllCampaigns();
  } catch {
    campaigns = [];
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800 py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
            <Database className="w-3.5 h-3.5" />
            PostgreSQL Native Integrity &middot; Row-Level Locks &middot; Window Functions
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Transparent Non-Profit Operations &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Immutable Financial Ledger
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            GiveTrack pairs real-time physical inventory supply chains across distributed warehouses
            with an append-only, cryptographic donation ledger. Zero negative stock. Zero untraced dollars.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              Donor Dashboard & Receipts
            </Link>
            <Link
              href="/volunteer"
              className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4 text-sky-400" />
              Volunteer Supply Chain Hub
            </Link>
          </div>
        </div>
      </section>

      {/* Engineering Highlights Banner */}
      <section className="bg-slate-900/50 border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Immutable Ledger
            </div>
          </div>
          <div className="p-3">
            <div className="text-xl sm:text-2xl font-black text-sky-400">Pessimistic</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Row Locks (FOR UPDATE)
            </div>
          </div>
          <div className="p-3">
            <div className="text-xl sm:text-2xl font-black text-amber-400">CHECK &gt;= 0</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Database Constraints
            </div>
          </div>
          <div className="p-3">
            <div className="text-xl sm:text-2xl font-black text-purple-400">Edge RBAC</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Middleware + Deep Check
            </div>
          </div>
        </div>
      </section>

      {/* Active Campaigns Directory */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Relief Campaigns</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Each campaign features a live, transparent financial timeline calculated via SQL window functions.
            </p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            {campaigns.length} Verified Campaigns
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((c: any) => {
            const target = parseFloat(c.target_amount);
            const current = parseFloat(c.current_funding);
            const percent = Math.min(Math.round((current / (target || 1)) * 100), 100);

            return (
              <div
                key={c.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden flex flex-col hover:border-slate-700 transition-all shadow-lg group"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {c.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {c.allocation_count} Supply Deployments
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6 flex-1">
                    {c.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-emerald-400 text-sm">
                        ${current.toLocaleString()}
                      </span>
                      <span className="text-slate-400">
                        Goal: ${target.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-right text-[11px] text-slate-500 font-medium">
                      {percent}% Funded
                    </div>
                  </div>

                  <Link
                    href={`/campaigns/${c.id}`}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                  >
                    View Transparent Ledger
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>GiveTrack &middot; Portfolio-Grade Non-Profit Operations Platform</p>
        <p className="mt-1 text-slate-600">Built with Next.js 14 App Router, PostgreSQL, node-postgres & Jose</p>
      </footer>
    </div>
  );
}
