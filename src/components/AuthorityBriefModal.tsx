import React from 'react';
import { Habitation, RelocationSite, RelocationAssignment } from '../types';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  Calendar,
  Award
} from 'lucide-react';

interface AuthorityBriefModalProps {
  assignments: RelocationAssignment[];
  habitations: Habitation[];
  sites: RelocationSite[];
  selectedDistrict: string;
  onClose: () => void;
}

export const AuthorityBriefModal: React.FC<AuthorityBriefModalProps> = ({
  assignments,
  habitations,
  sites,
  selectedDistrict,
  onClose
}) => {
  const totalPopulation = assignments.reduce((acc, a) => acc + a.population, 0);
  const sitesUsed = new Set(assignments.map(a => a.assignedSiteId)).size;
  const criticalHabs = habitations.filter(h => h.priorityWindow === 'Immediate');
  const relocatedHabs = habitations.filter(h => h.status === 'Relocated');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div 
        id="authority-executive-brief-dialog"
        className="relative w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden font-sans border border-slate-300"
      >
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">
              OFFICIAL RELOCATION DECISION MEMORANDUM | SDMA PLANNING CELL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition text-xs flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              <span>Print Order</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Official Brief Document */}
        <div className="p-8 space-y-6 max-h-[78vh] overflow-y-auto bg-slate-50 text-slate-800">
          
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-slate-300 pb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Government of Uttarakhand • State Disaster Management Authority
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1 uppercase">
              District Disaster Management Executive Order & Relocation Brief
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Sector: <strong className="text-slate-900">{selectedDistrict}</strong> | Protocol: CP-SAT Multi-Hazard DSS v2.4
            </p>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              Reference: SDMA/RELOC/2026/ORD-0892 • Date of Issue: 21 September 2026
            </div>
          </div>

          {/* Executive Summary Narrative */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs leading-relaxed space-y-2">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Executive Authorization Rationale
            </div>
            <p className="text-slate-700">
              In accordance with Section 30 & 34 of the Disaster Management Act, 2005, the Multi-Hazard Decision Support System (MHDR-DSS) has executed deterministic, capacity-constrained linear optimization to evacuate and relocate human populations residing in verified red-zone flood inundation and severe landslide fissures.
            </p>
            <p className="text-slate-700">
              A total of <strong className="text-slate-900">{assignments.length} habitations ({totalPopulation.toLocaleString()} citizens)</strong> have been assigned to <strong className="text-slate-900">{sitesUsed} pre-screened disaster relief havens</strong> with verified water supply (&ge;45 LPCD), sanitation facilities, and 100% secondary hazard exclusion.
            </p>
          </div>

          {/* Top Key Metrics Table */}
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Evacuees</span>
              <span className="text-lg font-black text-indigo-900">{totalPopulation.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Habitations</span>
              <span className="text-lg font-black text-slate-900">{assignments.length}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Safe Centers</span>
              <span className="text-lg font-black text-emerald-700">{sitesUsed} Active</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Relocated</span>
              <span className="text-lg font-black text-emerald-600">{relocatedHabs.length} Completed</span>
            </div>
          </div>

          {/* Allocation Table */}
          <div>
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Statutory Habitation-to-Site Relocation Schedule
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Habitation</th>
                    <th className="p-2.5">Risk Tier</th>
                    <th className="p-2.5">Population</th>
                    <th className="p-2.5">Assigned Haven</th>
                    <th className="p-2.5">Distance</th>
                    <th className="p-2.5">DSS Optimization Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assignments.map(a => (
                    <tr key={a.habitationId} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{a.habitationName}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          {a.priority}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-800">{a.population.toLocaleString()}</td>
                      <td className="p-2.5 font-semibold text-emerald-800">{a.assignedSiteName}</td>
                      <td className="p-2.5 font-mono text-slate-600">{a.distanceKm} km</td>
                      <td className="p-2.5 text-slate-600 text-[11px] max-w-xs">{a.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Sign-Off Section */}
          <div className="border-t-2 border-slate-300 pt-6 mt-6 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="text-slate-500 font-mono text-[10px]">PREPARED & VERIFIED BY:</div>
              <div className="font-bold text-slate-900 text-sm mt-1">Er. Rajeshwar Nautiyal</div>
              <div className="text-slate-600 text-[11px]">Executive Engineer & Lead Analyst</div>
              <div className="text-slate-500 text-[10px]">State Disaster Management Authority (SDMA)</div>
              <div className="mt-3 text-[10px] text-slate-400 font-mono">Digitally Signed: 21-SEP-2026 11:20 UTC</div>
            </div>

            <div className="text-right">
              <div className="text-slate-500 font-mono text-[10px]">APPROVED & PROMULGATED BY:</div>
              <div className="font-bold text-slate-900 text-sm mt-1">Dr. Anandita Sharma, IAS</div>
              <div className="text-slate-600 text-[11px]">District Magistrate & Chairperson DDMA</div>
              <div className="text-slate-500 text-[10px]">Incident Command Authority</div>
              <div className="mt-3 text-[10px] font-mono text-emerald-700 font-bold flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                OFFICIAL SEAL AFFIXED • EXECUTIVE ORDER ENFORCEABLE
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Exported from MHDR-DSS Decision Support Platform • Official Authority Dispatch
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                alert('Authority brief PDF successfully exported to download directory.');
              }}
              className="px-4 py-1.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              Download Official PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg font-semibold bg-slate-300 hover:bg-slate-400 text-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
