import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Zap,
  Lock,
  FileCheck
} from 'lucide-react';
import { PipelineExecutionProgress, PipelineStage } from '../agents/orchestrator';
import { RedZoneEvent, RedZoneMonitor } from '../agents/redZoneMonitor';

interface PipelineFlowchartProps {
  progress?: PipelineExecutionProgress | null;
  redZoneMonitor?: RedZoneMonitor;
  onTriggerSpike?: (habId: string) => void;
}

export const PipelineFlowchart: React.FC<PipelineFlowchartProps> = ({
  progress,
  redZoneMonitor,
  onTriggerSpike
}) => {
  const [events, setEvents] = useState<RedZoneEvent[]>([]);

  useEffect(() => {
    if (!redZoneMonitor) return;
    setEvents(redZoneMonitor.getRecentEvents(5));
    const unsubscribe = redZoneMonitor.subscribe(() => {
      setEvents(redZoneMonitor.getRecentEvents(5));
    });
    return unsubscribe;
  }, [redZoneMonitor]);

  const currentStage: PipelineStage = progress?.stage || 'COMPLETED';

  const nodes = [
    {
      id: 'telemetry',
      label: 'Telemetry & Feeds',
      sublabel: 'IMD, CWC, INCOIS (Polled)',
      type: 'ingestion',
      icon: Radio,
      active: currentStage === 'RISK_VULNERABILITY_EVAL',
      isLLM: false
    },
    {
      id: 'risk_vuln',
      label: 'Risk & SoVI Agents',
      sublabel: 'AHP & Social Vulnerability',
      type: 'deterministic',
      icon: Cpu,
      active: currentStage === 'RISK_VULNERABILITY_EVAL',
      isLLM: false
    },
    {
      id: 'suitability_capacity',
      label: 'Suitability & Capacity',
      sublabel: 'Safety Gate & 15% Buffer',
      type: 'deterministic',
      icon: ShieldCheck,
      active: currentStage === 'SUITABILITY_CAPACITY_FILTER',
      isLLM: false
    },
    {
      id: 'planning_mip',
      label: 'CP-SAT / MILP Planner',
      sublabel: 'Exact Branch-and-Bound',
      type: 'deterministic',
      icon: Activity,
      active: currentStage === 'RELOCATION_PLANNING_MIP',
      isLLM: false
    },
    {
      id: 'verification',
      label: 'Verification Auditor',
      sublabel: 'Constraint & Overrun Guard',
      type: 'auditor',
      icon: FileCheck,
      active: currentStage === 'VERIFICATION_AUDIT',
      isLLM: false
    },
    {
      id: 'explanation',
      label: 'AI Explainability',
      sublabel: 'Gemini Number-Grounded',
      type: 'ai-assisted',
      icon: Sparkles,
      active: currentStage === 'AI_EXPLANATION_SYNTHESIS',
      isLLM: true
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Header bar */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-lg">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide text-white uppercase">Multi-Agent Decision Pipeline</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE PIPELINE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Deterministic Decision Core (Auditable, No-LLM) + Verified AI Narrative Synthesis
            </p>
          </div>
        </div>

        {/* Live telemetry trigger simulation */}
        <div className="flex items-center gap-2">
          {onTriggerSpike && (
            <button
              onClick={() => onTriggerSpike('hab-1')}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Inject a real-time rainfall spike to test RedZoneMonitor reclassification"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Simulate Sensor Spike
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Node Visual Flow */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/70">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
          {nodes.map((node, idx) => {
            const Icon = node.icon;
            const isCompleted = currentStage === 'COMPLETED';
            return (
              <div
                key={node.id}
                className={`relative rounded-xl p-3.5 border transition-all duration-300 flex flex-col justify-between ${
                  node.active
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 shadow-md transform -translate-y-0.5'
                    : isCompleted
                    ? 'bg-white border-slate-200/90 shadow-sm'
                    : 'bg-slate-50/50 border-slate-200/60 opacity-80'
                }`}
              >
                {/* Node Top Row */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      node.active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isCompleted
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {node.isLLM ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      LLM
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Math/CP
                    </span>
                  )}
                </div>

                {/* Node Titles */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{node.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{node.sublabel}</p>
                </div>

                {/* Stage Status Indicator */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  {node.active ? (
                    <span className="text-indigo-600 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Solving...
                    </span>
                  ) : isCompleted ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-slate-400">Standby</span>
                  )}
                  <span className="font-mono text-[10px] text-slate-400">Step {idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RedZoneMonitor Real-Time Reclassification Feed Log */}
      <div className="px-5 py-3.5 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              RedZoneMonitor Dynamic Event Log (Live Stream)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Polled Telemetry Stream: IMD AWS & CWC Gauges</span>
        </div>

        {events.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            All sensor telemetry within nominal limits. Zero threshold violations detected.
          </div>
        ) : (
          <div className="space-y-1.5">
            {events.slice(0, 5).map(evt => (
              <div
                key={evt.id}
                className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-slate-400">{evt.timestamp}</span>
                  <span className="font-bold text-slate-800">{evt.habitationName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                    {evt.triggerFeed}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">Tier Shift:</span>
                    <span className="font-semibold text-slate-600 line-through text-[11px]">{evt.oldTier}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                      {evt.newTier}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Score: {evt.oldScore} → <strong className="text-slate-800">{evt.newScore}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
