import React from 'react';
import { ActivityLog } from '../types';
import { Clock, CheckCircle2, Mail, ShieldCheck, Sparkles, Sliders } from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
          <Clock className="w-6 h-6 text-indigo-600 mr-2.5" />
          Operations Audit & Activity Log
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Complete log of sent email reminders, verified expenses, simulated scenarios, and daily AI briefings.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
        {logs.map((log) => {
          return (
            <div
              key={log.id}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                  {log.type === 'reminder_sent' && <Mail className="w-4 h-4" />}
                  {log.type === 'expense_verified' && <ShieldCheck className="w-4 h-4" />}
                  {log.type === 'ai_briefing_generated' && <Sparkles className="w-4 h-4" />}
                  {log.type === 'forecast_adjusted' && <Sliders className="w-4 h-4" />}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{log.title}</span>
                    {log.channel && (
                      <span className="px-2 py-0.2 rounded text-[10px] uppercase font-bold bg-slate-200 text-slate-700">
                        {log.channel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{log.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400 shrink-0 font-medium">
                <span>{log.timestamp}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
