'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface LedgerItem {
  id: string;
  amount: string;
  type: 'credit' | 'debit';
  created_at: string;
  running_balance: string;
  description: string;
}

interface Props {
  ledger: LedgerItem[];
}

export default function CampaignFinancialChart({ ledger }: Props) {
  // Sort chronologically ascending for the chart timeline
  const chartData = useMemo(() => {
    const sorted = [...ledger].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return sorted.map((item, index) => {
      const date = new Date(item.created_at);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const amountVal = parseFloat(item.amount);
      const balanceVal = parseFloat(item.running_balance);

      return {
        id: item.id,
        index: index + 1,
        date: dateStr,
        fullDate: date.toLocaleString(),
        description: item.description,
        runningBalance: balanceVal,
        credit: item.type === 'credit' ? amountVal : 0,
        debit: item.type === 'debit' ? amountVal : 0,
      };
    });
  }, [ledger]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        No financial transactions logged yet.
      </div>
    );
  }

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-semibold text-slate-300">{data.fullDate}</p>
          <p className="text-slate-400 text-[11px] max-w-xs">{data.description}</p>
          <div className="pt-1 border-t border-slate-800 space-y-1">
            {data.credit > 0 && (
              <p className="text-emerald-400 font-medium">
                + Credit: ${data.credit.toLocaleString()}
              </p>
            )}
            {data.debit > 0 && (
              <p className="text-rose-400 font-medium">
                - Outlay (Debit): ${data.debit.toLocaleString()}
              </p>
            )}
            <p className="text-sky-400 font-bold">
              Rolling Balance: ${data.runningBalance.toLocaleString()}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatCurrency} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => {
              if (value === 'runningBalance') return 'Running Balance (SQL Window)';
              if (value === 'credit') return 'Donations Received';
              if (value === 'debit') return 'Disbursements Deployed';
              return value;
            }}
          />
          <Bar dataKey="credit" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar dataKey="debit" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Area
            type="monotone"
            dataKey="runningBalance"
            stroke="#38bdf8"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#balanceGradient)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
