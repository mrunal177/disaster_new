import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  ListOrdered,
  Building2,
  Cpu,
  Truck,
  BarChart3,
  Database,
  History,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Sliders,
  UserCheck
} from 'lucide-react';

export type NavTabId =
  | 'authority'
  | 'overview'
  | 'risk'
  | 'priorities'
  | 'sites'
  | 'generate'
  | 'tracking'
  | 'analytics'
  | 'datasources'
  | 'audit';

interface NavigationProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  selectedDistrict: string;
  onChangeDistrict: (dist: string) => void;
  totalHighRiskHabitations: number;
  unassignedHabitations: number;
  availableCapacity: number;
  onRefreshData?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  selectedDistrict,
  onChangeDistrict,
  totalHighRiskHabitations,
  unassignedHabitations,
  availableCapacity,
  onRefreshData
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDistrictMenu, setShowDistrictMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems: { id: NavTabId; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'authority', label: 'SDMA Command', icon: <Cpu className="w-4 h-4 text-indigo-600" />, badge: 'LIVE' },
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'risk', label: 'Risk Intelligence', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'priorities', label: 'Habitation Priorities', icon: <ListOrdered className="w-4 h-4" />, badge: totalHighRiskHabitations },
    { id: 'sites', label: 'Relocation Sites', icon: <Building2 className="w-4 h-4" /> },
    { id: 'generate', label: 'Generate Plan', icon: <Cpu className="w-4 h-4" />, badge: 'DSS' },
    { id: 'tracking', label: 'Relocation Tracking', icon: <Truck className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics & Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'datasources', label: 'Data Sources', icon: <Database className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit / Decision Log', icon: <History className="w-4 h-4" /> }
  ];

  const districts = [
    'Rudraprayag / Chamoli Himalayan Sector',
    'Alappuzha Coastal Inundation Sector',
    'Kullu Valley Catchment (Himachal)',
    'Tehri-Garhwal Reservoir Rim Zone'
  ];

  return (
    <>
      {/* Top Command Bar in Crisp Light UI */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 font-sans shadow-xs">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Authority Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 border border-indigo-700 flex items-center justify-center shadow-md shadow-indigo-200">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                  MHDR-DSS
                  <span className="text-slate-300 font-normal text-xs hidden lg:inline">|</span>
                  <span className="text-xs font-bold text-indigo-700 hidden lg:inline">Disaster Management Authority</span>
                </span>
                <span className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Prototype / Demonstration Dataset
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5 hidden sm:block">
                Multi-Hazard Intelligence & Capacity-Constrained Relocation Decision-Support
              </p>
            </div>
          </div>

          {/* Region / District Selector & Data Vintage */}
          <div className="flex items-center gap-3">
            {/* District Dropdown */}
            <div className="relative">
              <button
                id="btn-select-district"
                onClick={() => setShowDistrictMenu(!showDistrictMenu)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="max-w-[170px] sm:max-w-[260px] truncate">{selectedDistrict}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showDistrictMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Select Planning Sector
                  </div>
                  {districts.map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        onChangeDistrict(d);
                        setShowDistrictMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition ${
                        selectedDistrict === d ? 'bg-indigo-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{d}</span>
                      {selectedDistrict === d && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Data Vintage Badge */}
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-mono font-semibold">DATA VINTAGE</span>
              <span className="text-[11px] text-slate-700 font-mono font-bold">21 Sep 2026, 11:15 UTC</span>
            </div>

            {/* Live Notifications */}
            <div className="relative">
              <button
                id="btn-nav-notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 hover:text-slate-900 transition"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  3
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 text-xs text-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Operational Hazard Bulletins
                    </span>
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono font-bold">
                      3 Active
                    </span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
                      <div className="flex justify-between items-center text-red-800 font-bold text-[11px]">
                        <span>CWC River Warning: Mandakini</span>
                        <span className="text-[9px] text-slate-500 font-mono">15m ago</span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-1">
                        Discharge reached 1,840 m³/s at Rudraprayag gauge. Overbank flood crest forecasted in 90 min.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex justify-between items-center text-amber-800 font-bold text-[11px]">
                        <span>GSI Landslide Alert: Joshimath</span>
                        <span className="text-[9px] text-slate-500 font-mono">42m ago</span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-1">
                        InSAR displacement sensors registered 68mm creep in Sector 4 ravine. Immediate relocation recommended.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                      <div className="flex justify-between items-center text-indigo-800 font-bold text-[11px]">
                        <span>Capacity Update: Site S1</span>
                        <span className="text-[9px] text-slate-500 font-mono">1h ago</span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-1">
                        Borewell commissioning increased available capacity from 2,000 to 2,500 occupants.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Officer Profile Badge */}
            <div className="relative">
              <button
                id="btn-user-profile"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-xl text-xs transition"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[11px]">
                  DA
                </div>
                <div className="text-left hidden md:block">
                  <div className="font-bold text-slate-800 leading-none">DDMA Planning Cell</div>
                  <div className="text-[9px] text-slate-500 font-mono font-semibold mt-0.5">Duty Officer #482</div>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 text-xs text-slate-800">
                  <div className="font-bold text-slate-900 text-sm">State Emergency Operations</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Uttarakhand SDMA / DDMA Chamoli</div>
                  <div className="my-2 pt-2 border-t border-slate-200 text-[11px] space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Role:</span>
                      <span className="font-bold text-slate-900">Relocation Commander</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Authorization:</span>
                      <span className="text-indigo-700 font-mono font-bold">CP-SAT DSS Level-3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Security Clearance:</span>
                      <span className="text-emerald-700 font-semibold">Government Restricted</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Global Horizontal Navigation Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6">
          <div className="max-w-[1720px] mx-auto flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-tab-${item.id}`}
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white text-indigo-800'
                          : typeof item.badge === 'number' && item.badge > 0
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>
    </>
  );
};
