import React from 'react';
import { RelocationSite, Habitation } from '../types';
import { 
  Building2, 
  ShieldCheck, 
  Droplet, 
  Bath, 
  HeartPulse, 
  GraduationCap, 
  Car, 
  AlertCircle,
  Users,
  MapPin
} from 'lucide-react';

interface SiteDetailModalProps {
  site: RelocationSite | null;
  allHabitations: Habitation[];
  onClose: () => void;
}

export const SiteDetailModal: React.FC<SiteDetailModalProps> = ({
  site,
  allHabitations,
  onClose
}) => {
  if (!site) return null;

  const occupancyRate = (site.currentOccupancy / site.maxCapacity) * 100;
  const assignedHabs = allHabitations.filter(h => site.assignedHabitations.includes(h.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="relocation-site-detailed-dialog"
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900"
      >
        {/* Header in Clean Light UI */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-800">{site.code}</span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Suitability Score: {site.suitabilityScore}/100
                </span>
                <span className="text-xs text-slate-500 font-mono font-medium">Elevation: {site.elevationM}m</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">{site.name}</h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{site.location}, Taluka: <strong className="text-slate-800">{site.taluka}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Capacity Utilization Meter */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Shelter Carrying Capacity Envelope
              </span>
              <span className={`text-xs font-mono font-black ${occupancyRate > 90 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {occupancyRate.toFixed(1)}% Occupied
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-500 ${occupancyRate > 90 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500 text-[10px] font-semibold block">Max Capacity</span>
                <span className="text-base font-black text-slate-900">{site.maxCapacity.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500 text-[10px] font-semibold block">Current Occupancy</span>
                <span className="text-base font-black text-amber-700">{site.currentOccupancy.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-emerald-800 text-[10px] font-bold block">Available Capacity</span>
                <span className="text-base font-black text-emerald-700">{site.remainingCapacity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Infrastructure & Humanitarian Services Checklist */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Essential Services & SPHERE Standards Check
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <Droplet className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Water Availability</span>
                    <span className="text-[10px] font-bold text-emerald-700">{site.water.status} ({site.water.lpcd} LPCD)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">{site.water.source}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <Bath className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Sanitation Facility</span>
                    <span className="text-[10px] font-bold text-emerald-700">{site.sanitation.status}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    {site.sanitation.toiletsAvailable} toilets installed (1 toilet per {site.sanitation.ratioPerPerson} persons)
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <HeartPulse className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Healthcare Proximity</span>
                    <span className="text-[10px] font-mono text-slate-700 font-bold">{site.healthcareKm} km</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">{site.healthcareDetails}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <Car className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Road Transport Access</span>
                    <span className="text-[10px] font-bold text-emerald-700">{site.roadAccess}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">{site.roadDetails}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Secondary Hazard & Geotechnical Terrain Verification */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Secondary Hazard Exclusion Certificate
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                Hazard Exposure: {site.hazardExposure}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">{site.hazardDetails}</p>
            <div className="mt-2 text-slate-600 text-[11px]">
              Slope Gradient: <strong className="text-slate-800 font-bold">{site.terrainSlope}</strong>
            </div>
          </div>

          {/* Currently Assigned Habitations */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-700" />
              Currently Assigned / Accommodated Habitations ({assignedHabs.length})
            </h3>
            {assignedHabs.length > 0 ? (
              <div className="space-y-1.5">
                {assignedHabs.map(h => (
                  <div key={h.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{h.name}</span>
                      <span className="text-slate-500 ml-2 font-mono">({h.code})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-800 font-mono font-bold">{h.population.toLocaleString()} pers</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.status === 'Relocated' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-xs text-center border border-slate-200 font-medium">
                No habitations currently relocated here yet. Available for immediate solver allocation.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
          >
            Close Assessment
          </button>
        </div>
      </div>
    </div>
  );
};
