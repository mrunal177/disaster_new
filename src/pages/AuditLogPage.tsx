import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  UserCheck, 
  Download, 
  FileText, 
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AuditLogPageProps {
  logs: AuditLogEntry[];
  onOpenBrief: () => void;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ logs, onOpenBrief }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const actionTypes = [
    'All',
    'PLAN_GENERATION',
    'STATUS_ADVANCE',
    'MANUAL_OVERRIDE',
    'AUTHORITY_ORDER',
    'INCIDENT_FIELD_REPORT'
  ];

  const filteredLogs = logs.filter(log => {
    const action = log.action || log.actionType || '';
    const user = log.user || log.actor || '';
    const entity = log.entity || log.planCode || '';

    if (searchQuery && 
      !log.details.toLowerCase().includes(searchQuery.toLowerCase()) && 
      !entity.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !user.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (actionFilter !== 'All' && !action.includes(actionFilter)) {
      return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('PLAN')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (action.includes('OVERRIDE')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (action.includes('STATUS')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (action.includes('AUTHORITY') || action.includes('ORDER')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Immutable Administrative Ledger & Statutory Decision Trace</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Audit & Decision Log
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Verifiable chronological trail of solver executions, manual commanding overrides, convoy dispatch orders, and field telemetry observations for post-disaster judicial and administrative reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const text = logs.map(l => `[${l.timestamp}] ${l.user} -> ${l.action} (${l.entity}): ${l.details}`).join('\n');
              const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `audit_trail_${Date.now()}.txt`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Audit Trail</span>
          </button>
          <button
            onClick={onOpenBrief}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Executive Brief</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, officer, or settlement..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Action Class:</span>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            {actionTypes.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="font-mono text-slate-500 text-[11px]">
          Showing <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong> Audit Events
        </div>
      </div>

      {/* Audit Log Table in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 w-44">Timestamp</th>
                <th className="p-3.5 w-48">Action Classification</th>
                <th className="p-3.5 w-52">Authorized Officer / Entity</th>
                <th className="p-3.5 w-44">Subject Entity</th>
                <th className="p-3.5">Operational Details & Legal Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                    <div className="text-slate-900 font-bold">{log.timestamp.split(',')[0]}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{log.timestamp.split(',')[1]}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getActionBadge(log.action || log.actionType || '')}`}>
                      {log.action || log.actionType || 'LOG'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      {log.user || log.actor || 'Authority'}
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    {log.entity || log.planCode || 'System'}
                  </td>
                  <td className="p-3.5 text-slate-700 leading-relaxed max-w-xl">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
