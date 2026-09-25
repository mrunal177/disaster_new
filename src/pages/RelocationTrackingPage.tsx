import React, { useState } from 'react';
import { Habitation, RelocationSite, TrackingStatus } from '../types';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Building2, 
  FileText, 
  AlertTriangle, 
  Plus, 
  PhoneCall, 
  Car,
  ChevronRight,
  Droplet,
  HeartPulse
} from 'lucide-react';

interface RelocationTrackingPageProps {
  habitations: Habitation[];
  sites: RelocationSite[];
  onUpdateHabitationStatus: (habId: string, newStatus: TrackingStatus) => void;
  onAddLog: (action: string, entity: string, details: string) => void;
}

export const RelocationTrackingPage: React.FC<RelocationTrackingPageProps> = ({
  habitations,
  sites,
  onUpdateHabitationStatus,
  onAddLog
}) => {
  const [activeStageFilter, setActiveStageFilter] = useState<string>('All');
  const [selectedHabForNote, setSelectedHabForNote] = useState<Habitation | null>(null);
  const [fieldNoteText, setFieldNoteText] = useState('');

  const stages: { stage: TrackingStatus; label: string; color: string }[] = [
    { stage: 'Identified', label: 'Identified', color: 'border-slate-300 text-slate-700' },
    { stage: 'Assessed', label: 'Field Assessed', color: 'border-amber-300 text-amber-800' },
    { stage: 'Assigned', label: 'Site Assigned', color: 'border-indigo-300 text-indigo-800' },
    { stage: 'In Progress', label: 'Transit In Progress', color: 'border-cyan-300 text-cyan-800' },
    { stage: 'Relocated', label: 'Safely Accommodated', color: 'border-emerald-300 text-emerald-800' },
    { stage: 'Monitoring', label: 'Post-Relocation Monitoring', color: 'border-purple-300 text-purple-800' }
  ];

  const getNextStage = (curr: TrackingStatus): TrackingStatus | null => {
    switch (curr) {
      case 'Identified': return 'Assessed';
      case 'Assessed': return 'Assigned';
      case 'Assigned': return 'In Progress';
      case 'In Progress': return 'Relocated';
      case 'Relocated': return 'Monitoring';
      default: return null;
    }
  };

  const handleAdvance = (hab: Habitation) => {
    const next = getNextStage(hab.status);
    if (next) {
      onUpdateHabitationStatus(hab.id, next);
      onAddLog(
        `STATUS_ADVANCE_${next.toUpperCase().replace(' ', '_')}`,
        hab.name,
        `Evacuation operation for ${hab.name} (${hab.population} residents) transitioned from ${hab.status} to ${next}.`
      );
    }
  };

  const handleSaveNote = () => {
    if (selectedHabForNote && fieldNoteText) {
      onAddLog(
        'INCIDENT_FIELD_REPORT',
        selectedHabForNote.name,
        `Officer log: ${fieldNoteText}`
      );
      alert(`Field note saved to official incident audit trail.`);
      setFieldNoteText('');
      setSelectedHabForNote(null);
    }
  };

  const filteredHabs = activeStageFilter === 'All' 
    ? habitations 
    : habitations.filter(h => h.status === activeStageFilter);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-bold text-cyan-700 uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>Operational Movement Pipeline & Transit Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Relocation Operation Tracking
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Live lifecycle control of population evacuation—from initial hazard identification and shelter readiness verification to convoy dispatch, transit staging, and long-term shelter habitation.
          </p>
        </div>

        {/* Total stats pill */}
        <div className="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs shadow-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Operations</span>
            <span className="text-base font-black text-slate-900">{habitations.length} Habitations</span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Active In Transit</span>
            <span className="text-base font-bold text-cyan-700">
              {habitations.filter(h => h.status === 'In Progress').length} Convoys
            </span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="text-emerald-800 block text-[10px] uppercase font-bold">Relocated</span>
            <span className="text-base font-black text-emerald-700">
              {habitations.filter(h => h.status === 'Relocated').length} Safe
            </span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Stage Ribbon / Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {stages.map((s, idx) => {
          const count = habitations.filter(h => h.status === s.stage).length;
          const isActive = activeStageFilter === s.stage;
          return (
            <button
              key={s.stage}
              onClick={() => setActiveStageFilter(isActive ? 'All' : s.stage)}
              className={`p-3.5 rounded-xl border text-left transition ${
                isActive 
                  ? 'bg-indigo-50 border-indigo-400 shadow-sm ring-1 ring-indigo-300' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-500">STAGE 0{idx + 1}</span>
                <span className="text-xs font-mono font-black text-slate-900">{count}</span>
              </div>
              <div className="font-bold text-slate-800 mt-1 truncate">{s.label}</div>
              <div className="mt-2.5 w-full h-1.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${idx === 4 ? 'bg-emerald-500' : idx === 3 ? 'bg-cyan-500' : 'bg-indigo-600'}`}
                  style={{ width: `${(count / habitations.length) * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Cards List for Habitations in Tracking */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>
            Displaying <strong className="text-slate-900 font-bold">{filteredHabs.length}</strong> settlements in pipeline (Filter: {activeStageFilter})
          </span>
          {activeStageFilter !== 'All' && (
            <button
              onClick={() => setActiveStageFilter('All')}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabs.map(hab => {
            const nextStage = getNextStage(hab.status);
            const assignedSite = sites.find(s => s.id === hab.assignedSiteId) || sites[0];

            return (
              <div 
                key={hab.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm space-y-4 text-xs flex flex-col justify-between transition"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono text-[11px] font-bold text-slate-500">{hab.code}</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                      hab.status === 'Relocated' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      hab.status === 'In Progress' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                      hab.status === 'Assigned' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {hab.status}
                    </span>
                  </div>

                  {/* Village Info */}
                  <div className="mt-2.5">
                    <h3 className="text-base font-black text-slate-900">{hab.name}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Taluka: <strong className="text-slate-700">{hab.taluka}</strong> • Pop: <strong className="text-slate-900">{hab.population.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Destination Haven */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Assigned Haven Enclave</div>
                    <div className="font-bold text-emerald-800 mt-0.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{hab.assignedSiteName || assignedSite.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span>Available: {assignedSite.remainingCapacity.toLocaleString()} spots</span>
                      <span className="text-indigo-700 font-semibold">{assignedSite.water.status}</span>
                    </div>
                  </div>

                  {/* Field Readiness Checklist */}
                  <div className="mt-3 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-cyan-600" />
                        Transport Convoys:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {hab.status === 'In Progress' ? '12 Buses Dispatched (NDRF)' : 
                         hab.status === 'Relocated' ? 'Arrived & Staged' : 'Staged at Taluka Base'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-cyan-600" />
                        Shelter Water Supply:
                      </span>
                      <span className="font-semibold text-emerald-700">Verified ({assignedSite.water.lpcd} LPCD)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                        Medical Dependent Triage:
                      </span>
                      <span className="font-semibold text-amber-700">
                        {hab.demographics.medicalDependents} patients screened
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedHabForNote(hab)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 transition font-medium"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Field Log</span>
                  </button>

                  {nextStage ? (
                    <button
                      onClick={() => handleAdvance(hab)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                    >
                      <span>Advance to {nextStage}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Operation Concluded
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Field Note Modal */}
      {selectedHabForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-300 rounded-2xl p-6 shadow-2xl text-slate-800 text-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                Add Operational Field Log: {selectedHabForNote.name}
              </h3>
              <button onClick={() => setSelectedHabForNote(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1.5 font-semibold">
                Field Officer Observation / Incident Note:
              </label>
              <textarea
                rows={4}
                value={fieldNoteText}
                onChange={e => setFieldNoteText(e.target.value)}
                placeholder="e.g., Road clearance completed at KM 14 landslide slip. Evacuee bus convoy 2 departed with 48 occupants..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedHabForNote(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Affix to Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
