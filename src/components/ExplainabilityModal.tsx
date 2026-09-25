import React from 'react';
import { RelocationAssignment } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  Scale, 
  Route, 
  ArrowRight,
  Printer,
  Copy,
  FileCheck
} from 'lucide-react';

interface ExplainabilityModalProps {
  assignment: RelocationAssignment | null;
  onClose: () => void;
  onOverride?: (assignment: RelocationAssignment) => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  assignment,
  onClose,
  onOverride
}) => {
  if (!assignment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="explainability-decision-dialog"
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900"
      >
        {/* Header in Clean Light UI */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
                  Explainable Decision Trace
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  CP-SAT Deterministic DSS
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                Why was {assignment.habitationName} assigned to {assignment.assignedSiteName}?
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Quick Core Summary Badge */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="text-xs font-bold text-indigo-900">Optimal Assignment Match</span>
                <p className="text-xs text-slate-700 mt-0.5 font-medium">
                  Population: <span className="font-bold text-slate-900">{assignment.population.toLocaleString()} residents</span> • 
                  Transit: <span className="font-bold text-slate-900">{assignment.distanceKm} km</span> • 
                  Site Capacity Impact: <span className="font-bold text-emerald-700">{assignment.siteCapacityUsedPct}%</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-semibold text-slate-500">PRIORITY TIER</span>
              <div className="text-xs font-black text-red-600">{assignment.priority}</div>
            </div>
          </div>

          {/* Key Optimization Reasons */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Primary Justification Factors
            </h3>
            <ul className="space-y-2">
              {assignment.reasonsList.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-mono text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-medium leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Binding Constraints */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Binding Constraints Enforced
            </h3>
            <div className="flex flex-wrap gap-2">
              {assignment.bindingConstraints.map((constraint, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {constraint}
                </span>
              ))}
            </div>
          </div>

          {/* Alternative Sites Considered */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              Alternative Relocation Sites Evaluated & Rejected
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Candidate Site</th>
                    <th className="p-3">Distance</th>
                    <th className="p-3">Suitability</th>
                    <th className="p-3">Reason for Exclusion / Sub-optimality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignment.alternativeSites.map((alt) => (
                    <tr key={alt.siteId} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{alt.siteName}</td>
                      <td className="p-3 text-slate-600 font-mono font-medium">{alt.distanceKm} km</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{alt.suitabilityScore}%</td>
                      <td className="p-3 text-rose-700 font-medium flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{alt.rejectedReason}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mathematical & Governance Disclaimer */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800">Decision-Support Governance Note: </span>
            This assignment was computed using mixed-integer linear programming (CP-SAT) to maximize capacity safety margins and minimize evacuation exposure. The District Magistrate or Incident Commander retains the statutory authority to apply manual overrides based on ground situation reports.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `DSS Decision Trace for ${assignment.habitationName} -> ${assignment.assignedSiteName}\nPopulation: ${assignment.population}\nReasons:\n${assignment.reasonsList.join('\n')}`
              );
              alert('Decision trace copied to clipboard for official log.');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Audit Log Trace
          </button>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                onOverride?.(assignment);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition"
            >
              Authority Manual Override
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
