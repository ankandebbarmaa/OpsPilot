import React, { useState } from 'react';
import { CashForecast, formatRupee } from '../types';
import {
  TrendingUp,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface CashflowForecastProps {
  cashForecast: CashForecast;
}

export const CashflowForecast: React.FC<CashflowForecastProps> = ({ cashForecast }) => {
  const [delayedInvoiceDays, setDelayedInvoiceDays] = useState(0);
  const [expenseReductionPct, setExpenseReductionPct] = useState(0);

  // Safe timeline fallback for both forecastTimeline and trend array properties
  const timeline = cashForecast?.forecastTimeline || cashForecast?.trend || [];
  const currentBalance = cashForecast?.currentBalance ?? 185000;
  const safetyBufferTarget = cashForecast?.cashBufferTarget ?? 200000;
  const daysUntilShortfall = cashForecast?.daysUntilShortfall ?? 11;
  const predictedShortfallDate = cashForecast?.predictedShortfallDate ?? 'Aug 11';

  // Apply scenario adjustments to forecast timeline
  const chartData = timeline.map((item) => {
    let adjustedBalance = item.projectedBalance ?? 0;

    const inflow = item.inflow ?? item.expectedInflows ?? 0;
    const outflow = item.outflow ?? item.expectedOutflows ?? 0;

    // Simulate delayed collection impact
    if (delayedInvoiceDays > 0) {
      adjustedBalance -= inflow * (delayedInvoiceDays / 30);
    }

    // Simulate expense reduction impact
    if (expenseReductionPct > 0) {
      adjustedBalance += outflow * (expenseReductionPct / 100);
    }

    return {
      ...item,
      inflow,
      outflow,
      adjustedBalance: Math.round(adjustedBalance),
      safetyBuffer: safetyBufferTarget,
    };
  });

  const lowestProjectedBalance = chartData.length > 0 
    ? Math.min(...chartData.map((d) => d.adjustedBalance)) 
    : currentBalance;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center space-x-2">
          <span className="p-1 bg-sky-600 text-white rounded-md font-bold text-xs">
            ₹
          </span>
          <span className="text-xs font-medium text-slate-600">Predictive Cashflow</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center">
          Cash Runway & 15-Day Forecast
        </h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Simulate cash trajectories in Rupees (₹) under varying collection speed and vendor expense adjustments
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Current Bank Balance</p>
          <p className="text-2xl font-bold text-slate-900">{formatRupee(currentBalance)}</p>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Live Sync Active
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Safety Buffer Target</p>
          <p className="text-2xl font-bold text-indigo-700">{formatRupee(safetyBufferTarget)}</p>
          <p className="text-[11px] text-slate-400 font-normal">Minimum threshold required for payroll</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Predicted Shortfall Alert</p>
          <p className="text-2xl font-bold text-amber-600">{daysUntilShortfall} Days Away</p>
          <p className="text-[11px] text-amber-700 font-medium">Predicted Date: {predictedShortfallDate}</p>
        </div>
      </div>

      {/* Interactive Scenario Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Interactive Scenario Simulator ("What-If" Planning)
            </h2>
          </div>
          {(delayedInvoiceDays > 0 || expenseReductionPct > 0) && (
            <button
              onClick={() => {
                setDelayedInvoiceDays(0);
                setExpenseReductionPct(0);
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Reset Simulation
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-slate-700">Simulate Invoice Collection Delay:</span>
              <span className="text-indigo-600 font-mono">+{delayedInvoiceDays} Days</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              value={delayedInvoiceDays}
              onChange={(e) => setDelayedInvoiceDays(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 font-medium">
              Simulates late client payments delaying inbound accounts receivable cash inflow.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-slate-700">Simulate Discretionary Expense Reduction:</span>
              <span className="text-emerald-600 font-mono">-{expenseReductionPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              value={expenseReductionPct}
              onChange={(e) => setExpenseReductionPct(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 font-medium">
              Simulates cutting or pausing vendor expenses and discretionary overhead spend.
            </p>
          </div>
        </div>

        {/* Simulation Scenario Outcome summary */}
        <div className="mt-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Scenario Lowest Point: </span>
            <span
              className={`font-extrabold ${
                lowestProjectedBalance < safetyBufferTarget ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatRupee(lowestProjectedBalance)}
            </span>
            {lowestProjectedBalance < safetyBufferTarget ? (
              <span className="ml-2 text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                Below Safety Target
              </span>
            ) : (
              <span className="ml-2 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                Buffer Preserved
              </span>
            )}
          </div>
          <div className="text-slate-500">
            Target Buffer: <span className="font-bold text-slate-800">{formatRupee(safetyBufferTarget)}</span>
          </div>
        </div>
      </div>

      {/* Recharts Cashflow Chart - Light */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">15-Day Cash Projection Trajectory</h3>
            <p className="text-xs text-slate-500 font-medium">
              Solid line: Projected Balance | Red Dashed Line: {formatRupee(safetyBufferTarget)} Safety Target
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4 min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                  color: '#0f172a',
                }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Balance']}
              />
              <ReferenceLine
                y={safetyBufferTarget}
                label={{ value: `Buffer (${formatRupee(safetyBufferTarget)})`, fill: '#e11d48', fontSize: 10 }}
                stroke="#e11d48"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="adjustedBalance"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#balanceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
