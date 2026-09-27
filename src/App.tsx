import React, { useState } from 'react';
import { 
  MOCK_HABITATIONS, 
  MOCK_RELOCATION_SITES, 
  MOCK_AUDIT_LOGS, 
  MOCK_DATA_SOURCES 
} from './data/mockData';
import { 
  Habitation, 
  RelocationSite, 
  AuditLogEntry, 
  TrackingStatus, 
  GeneratedPlanResult,
  RelocationAssignment 
} from './types';
import { Navigation, NavTabId } from './components/Navigation';
import { HabitationDetailModal } from './components/HabitationDetailModal';
import { SiteDetailModal } from './components/SiteDetailModal';
import { AuthorityBriefModal } from './components/AuthorityBriefModal';

import { AuthorityDashboardPage } from './pages/AuthorityDashboardPage';
import { OverviewPage } from './pages/OverviewPage';
import { RiskIntelligencePage } from './pages/RiskIntelligencePage';
import { HabitationPrioritiesPage } from './pages/HabitationPrioritiesPage';
import { RelocationSitesPage } from './pages/RelocationSitesPage';
import { GeneratePlanPage } from './pages/GeneratePlanPage';
import { RelocationTrackingPage } from './pages/RelocationTrackingPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { Orchestrator } from './agents/orchestrator';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('authority');
  const [selectedDistrict, setSelectedDistrict] = useState('Rudraprayag / Chamoli Himalayan Sector');

  // Application Data State
  const [habitations, setHabitations] = useState<Habitation[]>(MOCK_HABITATIONS);
  const [sites, setSites] = useState<RelocationSite[]>(MOCK_RELOCATION_SITES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [lastPlanResult, setLastPlanResult] = useState<GeneratedPlanResult | null>(null);

  // Multi-Agent Orchestrator Instance
  const [orchestrator] = useState(() => new Orchestrator(MOCK_HABITATIONS));

  // Modals state
  const [selectedHabForModal, setSelectedHabForModal] = useState<Habitation | null>(null);
  const [selectedSiteForModal, setSelectedSiteForModal] = useState<RelocationSite | null>(null);
  const [showAuthorityBrief, setShowAuthorityBrief] = useState(false);

  // Toast / System notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addAuditLog = (action: string, entity: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC',
      action,
      user: 'DDMA Incident Commander (DA-482)',
      entity,
      details
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  const handleUpdateHabitationStatus = (habId: string, newStatus: TrackingStatus) => {
    setHabitations(prev => prev.map(h => {
      if (h.id === habId) {
        return { ...h, status: newStatus };
      }
      return h;
    }));
    showToast(`Updated habitation status to "${newStatus}"`);
  };

  const handleApprovePlan = (plan: GeneratedPlanResult) => {
    setLastPlanResult(plan);
    // Update habitations with assigned sites
    setHabitations(prev => prev.map(h => {
      const match = plan.assignments.find(a => a.habitationId === h.id);
      if (match) {
        return {
          ...h,
          status: 'Assigned',
          assignedSiteId: match.assignedSiteId,
          assignedSiteName: match.assignedSiteName
        };
      }
      return h;
    }));

    // Update site occupancy
    setSites(prev => prev.map(s => {
      const siteAssignments = plan.assignments.filter(a => a.assignedSiteId === s.id);
      const addedPop = siteAssignments.reduce((acc, a) => acc + a.population, 0);
      const newOccupancy = s.currentOccupancy + addedPop;
      return {
        ...s,
        currentOccupancy: newOccupancy,
        remainingCapacity: Math.max(0, s.maxCapacity - newOccupancy),
        assignedHabitations: [...new Set([...s.assignedHabitations, ...siteAssignments.map(a => a.habitationId)])]
      };
    }));

    addAuditLog(
      'PLAN_APPROVAL_DISPATCH',
      plan.planId,
      `Official sign-off for ${plan.habitationsRelocatedCount || plan.assignedHabitationsCount || 0} habitations (${(plan.totalPopulationRelocated || plan.assignedPopulation || 0).toLocaleString()} residents). Execution orders issued to Sub-Divisional Magistrates.`
    );

    showToast(`Plan ${plan.planId} approved! Relocation tracking schedule initialized.`);
  };

  const handleAddToPlan = (hab: Habitation) => {
    showToast(`Added ${hab.name} to active optimization roster.`);
    setActiveTab('generate');
  };

  // Metrics for navigation
  const highRiskHabsCount = habitations.filter(h => h.priorityWindow === 'Immediate').length;
  const unassignedCount = habitations.filter(h => !h.assignedSiteId && h.priorityWindow === 'Immediate').length;
  const availableCap = sites.reduce((acc, s) => acc + s.remainingCapacity, 0);

  // Default assignments for authority brief if plan not yet generated
  const activeAssignments: RelocationAssignment[] = lastPlanResult?.assignments || [
    {
      habitationId: 'hab-01',
      habitationName: 'Village Kedarnath Baseline',
      assignedSiteId: 'site-01',
      assignedSiteName: 'Guptkashi High Ground Enclave',
      population: 1450,
      distanceKm: 14,
      priority: 'Immediate',
      siteCapacityUsedPct: 78,
      reason: 'Optimal shelter haven offering flood elevation safety and high-capacity piped spring supply.',
      bindingConstraints: ['Distance limit: 35 km', 'SPHERE LPCD compliance verified'],
      reasonsList: ['Extreme flood inundation zone', 'Immediate transit connection via NH-107'],
      alternativeSites: []
    },
    {
      habitationId: 'hab-02',
      habitationName: 'Village Sunil Joshimath',
      assignedSiteId: 'site-02',
      assignedSiteName: 'Pipalkoti Terraced Relief Center',
      population: 920,
      distanceKm: 19,
      priority: 'Immediate',
      siteCapacityUsedPct: 62,
      reason: 'Stable bedrock foundation avoiding subsidence active shear planes.',
      bindingConstraints: ['Subsidence buffer margin: 25% reserve'],
      reasonsList: ['Active 68mm InSAR creep', 'Direct emergency arterial access'],
      alternativeSites: []
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Persistent Navigation Header */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedDistrict={selectedDistrict}
        onChangeDistrict={setSelectedDistrict}
        totalHighRiskHabitations={highRiskHabsCount}
        unassignedHabitations={unassignedCount}
        availableCapacity={availableCap}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 pt-6">
        
        {/* Render Active View */}
        {activeTab === 'authority' && (
          <AuthorityDashboardPage
            habitations={habitations}
            sites={sites}
            selectedDistrict={selectedDistrict}
            orchestrator={orchestrator}
            activePlan={lastPlanResult}
            onSelectHabitation={setSelectedHabForModal}
            onSelectSite={setSelectedSiteForModal}
            onUpdatePlan={handleApprovePlan}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewPage
            habitations={habitations}
            sites={sites}
            selectedDistrict={selectedDistrict}
            onSelectHabitation={setSelectedHabForModal}
            onSelectSite={setSelectedSiteForModal}
            onNavigateToGenerate={() => setActiveTab('generate')}
            onNavigateToTracking={() => setActiveTab('tracking')}
            onNavigateToPriorities={() => setActiveTab('priorities')}
            onOpenBrief={() => setShowAuthorityBrief(true)}
          />
        )}

        {activeTab === 'risk' && (
          <RiskIntelligencePage
            habitations={habitations}
            sites={sites}
            selectedHabitation={selectedHabForModal}
            onSelectHabitation={setSelectedHabForModal}
            onSelectSite={setSelectedSiteForModal}
          />
        )}

        {activeTab === 'priorities' && (
          <HabitationPrioritiesPage
            habitations={habitations}
            onSelectHabitation={setSelectedHabForModal}
            onAddToPlan={handleAddToPlan}
            onNavigateToGenerate={() => setActiveTab('generate')}
          />
        )}

        {activeTab === 'sites' && (
          <RelocationSitesPage
            sites={sites}
            habitations={habitations}
            selectedSite={selectedSiteForModal}
            onSelectSite={setSelectedSiteForModal}
            onNavigateToGenerate={() => setActiveTab('generate')}
          />
        )}

        {activeTab === 'generate' && (
          <GeneratePlanPage
            habitations={habitations}
            sites={sites}
            orchestrator={orchestrator}
            onApprovePlan={handleApprovePlan}
            onNavigateToTracking={() => setActiveTab('tracking')}
            onOpenBrief={() => setShowAuthorityBrief(true)}
          />
        )}

        {activeTab === 'tracking' && (
          <RelocationTrackingPage
            habitations={habitations}
            sites={sites}
            onUpdateHabitationStatus={handleUpdateHabitationStatus}
            onAddLog={addAuditLog}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            habitations={habitations}
            sites={sites}
            selectedDistrict={selectedDistrict}
            onOpenBrief={() => setShowAuthorityBrief(true)}
          />
        )}

        {activeTab === 'datasources' && (
          <DataSourcesPage sources={MOCK_DATA_SOURCES} />
        )}

        {activeTab === 'audit' && (
          <AuditLogPage logs={auditLogs} onOpenBrief={() => setShowAuthorityBrief(true)} />
        )}

      </main>

      {/* Floating System Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-indigo-500 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl animate-bounce">
          <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <HabitationDetailModal
        habitation={selectedHabForModal}
        sites={sites}
        onClose={() => setSelectedHabForModal(null)}
        onAddToPlan={handleAddToPlan}
        onOpenGeneratePlan={() => {
          setSelectedHabForModal(null);
          setActiveTab('generate');
        }}
      />

      <SiteDetailModal
        site={selectedSiteForModal}
        allHabitations={habitations}
        onClose={() => setSelectedSiteForModal(null)}
      />

      {showAuthorityBrief && (
        <AuthorityBriefModal
          assignments={activeAssignments}
          habitations={habitations}
          sites={sites}
          selectedDistrict={selectedDistrict}
          onClose={() => setShowAuthorityBrief(false)}
        />
      )}

      {/* Footer System Attribution */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">MHDR-DSS Operational Architecture • Multi-Hazard Decision Support Platform</span>
          </div>
          <div className="text-slate-500 font-medium">
            Positioned for State & District Disaster Management Authorities • Active Multi-Agent Pipeline
          </div>
        </div>
      </footer>

    </div>
  );
}
