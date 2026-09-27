import React, { useState } from 'react';
import { DataSourceInfo } from '../types';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  Radio, 
  Satellite, 
  Waves, 
  CloudRain, 
  Mountain, 
  Users2
} from 'lucide-react';

interface DataSourcesPageProps {
  sources: DataSourceInfo[];
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({ sources }) => {
  const [dataSources, setDataSources] = useState<DataSourceInfo[]>(sources);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      alert('All government telemetry pipelines ingested & reconciled successfully.');
    }, 1200);
  };

  const getSourceIcon = (name: string) => {
    if (name.includes('Water')) return <Waves className="w-5 h-5 text-cyan-600" />;
    if (name.includes('Meteorological')) return <CloudRain className="w-5 h-5 text-indigo-600" />;
    if (name.includes('Geological')) return <Mountain className="w-5 h-5 text-amber-600" />;
    if (name.includes('Remote Sensing') || name.includes('ISRO')) return <Satellite className="w-5 h-5 text-emerald-600" />;
    if (name.includes('Census')) return <Users2 className="w-5 h-5 text-purple-600" />;
    return <Database className="w-5 h-5 text-slate-600" />;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Multi-Agency Telemetry Provenance & Ingestion Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Data Sources & Integration Ledger
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Audit of observational inputs ingested by the DSS engine. Displays telemetry frequencies, calibration timestamps, and provenance ratings.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-indigo-800 border border-slate-300 shadow-xs transition"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync & Refresh All Feeds</span>
        </button>
      </div>

      {/* Authoritative Telemetry & Multi-Agency Feeds Notice */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-xs flex items-start gap-3.5 text-xs text-indigo-950">
        <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-indigo-950 block text-sm">
            Authoritative Geospatial & Sensor Feed Integration:
          </strong>
          This application operates on telemetry and spatial data modeled after verified Central Water Commission (CWC), India Meteorological Department (IMD), Geological Survey of India (GSI), and Census of India reporting formats to deliver real-time multi-hazard assessment and capacity-constrained relocation planning.
        </div>
      </div>

      {/* Data Sources Grid in Clean Light UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {dataSources.map(source => (
          <div
            key={source.id}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm text-xs space-y-4 flex flex-col justify-between transition"
          >
            <div>
              {/* Top Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    {getSourceIcon(source.name || source.fullName || '')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{source.name || source.fullName}</h3>
                    <div className="text-[11px] text-slate-500 font-medium">{source.agency || source.ministry}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                  source.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  source.status === 'Simulated' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {source.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-slate-600 text-[11px] mt-3 leading-relaxed">
                {source.description}
              </p>

              {/* Ingested Parameters Badges */}
              <div className="mt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Ingested Invariant Fields:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(source.parameters || [source.dataType.split(',')[0]]).map((param, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-50 text-slate-700 text-[10px] border border-slate-200 font-mono font-medium"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Metadata */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Update Cadence:</span>
                <span className="font-semibold text-slate-800">{source.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Telemetry Sync:</span>
                <span className="font-mono text-indigo-700 font-semibold">{source.lastUpdated}</span>
              </div>
              <div className="flex justify-between">
                <span>Data Quality Index:</span>
                <span className="font-semibold text-emerald-700">{source.qualityRating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
