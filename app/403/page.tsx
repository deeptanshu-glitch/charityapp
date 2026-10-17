import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8 bg-slate-800/80 p-8 rounded-2xl border border-rose-500/30 shadow-2xl backdrop-blur-sm">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/60 rounded-full border border-rose-800">
            HTTP 403 Forbidden
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
            Access Denied
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Your current account role does not have administrative clearance to access this module.
            Role-Based Access Control (RBAC) rules prevent unauthorized operations.
          </p>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60 text-xs text-slate-400 text-left space-y-1">
          <p className="font-semibold text-slate-200">Role Permissions:</p>
          <p>• <span className="text-emerald-400 font-medium">Donor:</span> Dashboard, receipts & public campaigns</p>
          <p>• <span className="text-sky-400 font-medium">Volunteer:</span> Inventory logging & campaign allocations</p>
          <p>• <span className="text-amber-400 font-medium">Admin:</span> Disbursement reviews, system audit & user management</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-700 rounded-lg text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <Home className="w-4 h-4 mr-2" />
            My Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md shadow-rose-900/30"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
