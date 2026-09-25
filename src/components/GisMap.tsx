import React, { useState, useRef } from 'react';
import { Habitation, RelocationSite, RelocationAssignment } from '../types';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Eye, 
  EyeOff, 
  Compass, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle,
  Route,
  Activity,
  Crosshair
} from 'lucide-react';

interface GisMapProps {
  habitations: Habitation[];
  sites: RelocationSite[];
  selectedHabitation?: Habitation | null;
  selectedSite?: RelocationSite | null;
  assignments?: RelocationAssignment[];
  onSelectHabitation?: (hab: Habitation) => void;
  onSelectSite?: (site: RelocationSite) => void;
  height?: string;
  showAssignments?: boolean;
  activeHazardFilter?: string; // 'All' | 'Flood' | 'Landslide' | 'Cloudburst' | 'Multi-hazard'
}

export const GisMap: React.FC<GisMapProps> = ({
  habitations,
  sites,
  selectedHabitation,
  selectedSite,
  assignments = [],
  onSelectHabitation,
  onSelectSite,
  height = 'h-[540px]',
  showAssignments = false,
  activeHazardFilter = 'All'
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredEntity, setHoveredEntity] = useState<{
    type: 'hab' | 'site';
    item: Habitation | RelocationSite;
    x: number;
    y: number;
  } | null>(null);

  // Layer Toggles
  const [layers, setLayers] = useState({
    floodHazard: true,
    landslideHazard: true,
    cloudburstHazard: true,
    roads: true,
    rivers: true,
    contours: true,
    sites: true,
    habitations: true,
    routes: true,
    satelliteOverlay: false
  });
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [mouseCoords, setMouseCoords] = useState({ lat: 30.452, lng: 79.124 });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    // Compute approximate real-world coordinates from container offset
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left - pan.x) / (rect.width * zoom);
      const relativeY = (e.clientY - rect.top - pan.y) / (rect.height * zoom);
      const lat = 30.75 - relativeY * 0.7;
      const lng = 78.4 + relativeX * 1.5;
      setMouseCoords({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Convert normalized 0-100 coordinates into SVG space (1000 x 600 viewbox)
  const mapToSvg = (x: number, y: number) => ({
    x: (x / 100) * 980 + 10,
    y: (y / 100) * 580 + 10
  });

  const getRiskColor = (priority: string) => {
    switch (priority) {
      case 'Immediate':
        return '#ef4444'; // Red
      case 'Short-term':
        return '#f97316'; // Orange
      case 'Medium-term':
        return '#eab308'; // Yellow
      case 'Monitor':
        return '#10b981'; // Green
      default:
        return '#94a3b8';
    }
  };

  return (
    <div 
      id="gis-map-viewport" 
      ref={containerRef}
      className={`relative ${height} w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl select-none cursor-grab active:cursor-grabbing font-sans`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setHoveredEntity(null);
      }}
    >
      {/* Tactical Top Bar Header */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg text-xs">
        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 animate-pulse text-red-400" />
          <span>GIS Operational Surface</span>
        </div>
        <div className="h-3.5 w-px bg-slate-700 mx-1" />
        <span className="text-slate-400 font-mono">Mandakini-Alaknanda Basin | WGS-84</span>
        <div className="h-3.5 w-px bg-slate-700 mx-1" />
        <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          CWC & IMD Feed Active
        </span>
      </div>

      {/* Map Control Tools (Top Right) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-lg">
        <button
          id="btn-map-zoom-in"
          title="Zoom In"
          onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.5))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-map-zoom-out"
          title="Zoom Out"
          onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.75))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-map-reset-view"
          title="Reset View"
          onClick={handleReset}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition text-xs font-mono px-2"
        >
          1:1
        </button>
        <div className="h-4 w-px bg-slate-700 mx-1" />
        <div className="relative">
          <button
            id="btn-map-toggle-layers"
            title="Map Layers"
            onClick={() => setShowLayerMenu(prev => !prev)}
            className={`p-1.5 rounded transition flex items-center gap-1 text-xs ${
              showLayerMenu ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Layers</span>
          </button>

          {/* Layer Selection Dropdown */}
          {showLayerMenu && (
            <div className="absolute right-0 top-9 w-60 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg p-2.5 shadow-2xl z-40 text-xs text-slate-200">
              <div className="font-semibold text-slate-300 pb-1.5 mb-1.5 border-b border-slate-800 flex justify-between items-center">
                <span>Display GIS Overlays</span>
                <button 
                  onClick={() => setShowLayerMenu(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center justify-between hover:bg-slate-800/60 p-1 rounded cursor-pointer">
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 border border-red-400" />
                    Flood Inundation (CWC)
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.floodHazard}
                    onChange={e => setLayers({ ...layers, floodHazard: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between hover:bg-slate-800/60 p-1 rounded cursor-pointer">
                  <span className="flex items-center gap-1.5 text-orange-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500/50 border border-orange-400" />
                    Landslide Hazard (GSI)
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.landslideHazard}
                    onChange={e => setLayers({ ...layers, landslideHazard: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between hover:bg-slate-800/60 p-1 rounded cursor-pointer">
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500/50 border border-purple-400" />
                    Cloudburst Impact (IMD)
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.cloudburstHazard}
                    onChange={e => setLayers({ ...layers, cloudburstHazard: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between hover:bg-slate-800/60 p-1 rounded cursor-pointer">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Safe Relocation Sites (8)
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.sites}
                    onChange={e => setLayers({ ...layers, sites: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between hover:bg-slate-800/60 p-1 rounded cursor-pointer">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-1 bg-cyan-400 rounded-full" />
                    Rivers & Water Channels
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.rivers}
                    onChange={e => setLayers({ ...layers, rivers: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between hover:bg-slate-800/60 p-1 rounded cursor-pointer">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <span className="w-2.5 h-1 bg-amber-400 rounded-full" />
                    Roads & Evacuation Routes
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.roads}
                    onChange={e => setLayers({ ...layers, roads: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between hover:bg-slate-800/60 p-1 rounded cursor-pointer">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-1 border-b border-dashed border-slate-400" />
                    Contour Elevation Lines
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.contours}
                    onChange={e => setLayers({ ...layers, contours: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                </label>

                {showAssignments && (
                  <label className="flex items-center justify-between hover:bg-slate-800/60 p-1 rounded cursor-pointer">
                    <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                      <Route className="w-3.5 h-3.5 text-indigo-400" />
                      Assigned Relocation Vectors
                    </span>
                    <input
                      type="checkbox"
                      checked={layers.routes}
                      onChange={e => setLayers({ ...layers, routes: e.target.checked })}
                      className="accent-indigo-500 rounded"
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Map */}
      <svg
        id="gis-interactive-canvas"
        viewBox="0 0 1000 600"
        className="w-full h-full transition-transform duration-75"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center'
        }}
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="floodGrad1" cx="45%" cy="30%" r="45%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#ef4444" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="landslideGrad" cx="60%" cy="35%" r="40%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="65%" stopColor="#f97316" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="cloudburstGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
            <stop offset="80%" stopColor="#a855f7" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
          </pattern>
        </defs>

        {/* Tactical Grid Background */}
        <rect width="1000" height="600" fill="#090d16" />
        <rect width="1000" height="600" fill="url(#grid)" />

        {/* Topography Contours */}
        {layers.contours && (
          <g id="map-contours" stroke="#1e293b" strokeWidth="1" fill="none" opacity="0.8">
            <path d="M 50 120 Q 250 80 480 140 T 920 110" />
            <path d="M 30 180 Q 280 140 510 200 T 950 170" />
            <path d="M 20 260 Q 260 210 520 270 T 960 240" />
            <path d="M 10 350 Q 290 300 560 360 T 970 330" />
            <path d="M 20 440 Q 300 390 580 450 T 980 420" />
            <path d="M 30 520 Q 320 480 600 530 T 990 510" />
            
            {/* Topography Heights Badges */}
            <text x="80" y="115" fill="#334155" fontSize="9" fontFamily="monospace">2400m</text>
            <text x="70" y="255" fill="#334155" fontSize="9" fontFamily="monospace">1800m</text>
            <text x="60" y="435" fill="#334155" fontSize="9" fontFamily="monospace">1200m</text>
            <text x="70" y="515" fill="#334155" fontSize="9" fontFamily="monospace">800m</text>
          </g>
        )}

        {/* River Water Bodies (Mandakini, Alaknanda & Tributaries) */}
        {layers.rivers && (
          <g id="map-rivers">
            {/* Alaknanda Main River Flow */}
            <path
              d="M 850 40 Q 720 180 580 320 T 480 490 T 360 560 T 180 590"
              fill="none"
              stroke="#0284c7"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Mandakini River Flow Confluence at Rudraprayag */}
            <path
              d="M 380 40 Q 370 160 350 260 T 330 380 Q 320 420 360 460"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Pindar River Tributary */}
            <path
              d="M 920 440 Q 780 480 640 520 L 480 490"
              fill="none"
              stroke="#0284c7"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.75"
            />
            {/* River Labels */}
            <text x="390" y="140" fill="#38bdf8" fontSize="10" fontWeight="600" opacity="0.8" transform="rotate(78, 390, 140)">
              MANDAKINI RIVER ➔
            </text>
            <text x="650" y="270" fill="#38bdf8" fontSize="10" fontWeight="600" opacity="0.8" transform="rotate(45, 650, 270)">
              ALAKNANDA RIVER ➔
            </text>
            <text x="365" y="480" fill="#67e8f9" fontSize="9" fontWeight="700">
              Rudraprayag Confluence
            </text>
          </g>
        )}

        {/* Hazard Polygons */}
        {layers.floodHazard && (activeHazardFilter === 'All' || activeHazardFilter === 'Flood' || activeHazardFilter === 'Multi-hazard') && (
          <g id="map-flood-hazard-zones">
            {/* Upper Mandakini High Flood Inundation Polygon */}
            <path
              d="M 340 90 Q 420 110 400 190 Q 380 270 330 310 Q 300 240 330 160 Z"
              fill="url(#floodGrad1)"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Lower Alaknanda Gorge Flood Pocket */}
            <path
              d="M 440 450 Q 560 460 520 530 Q 440 550 400 500 Z"
              fill="url(#floodGrad1)"
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="4 2"
            />
            <text x="345" y="210" fill="#fca5a5" fontSize="10" fontWeight="700" opacity="0.9">
              FLOOD RED ZONE (100-YR)
            </text>
          </g>
        )}

        {layers.landslideHazard && (activeHazardFilter === 'All' || activeHazardFilter === 'Landslide' || activeHazardFilter === 'Multi-hazard') && (
          <g id="map-landslide-hazard-zones">
            {/* Joshimath & Bhyundar Slope Instability Zone */}
            <path
              d="M 640 120 Q 820 140 760 280 Q 640 260 620 190 Z"
              fill="url(#landslideGrad)"
              stroke="#f97316"
              strokeWidth="1.5"
              strokeDasharray="5 3"
            />
            {/* Rambara Slope Scarp */}
            <path
              d="M 390 60 Q 480 70 460 140 Q 390 130 380 90 Z"
              fill="url(#landslideGrad)"
              stroke="#f97316"
              strokeWidth="1.2"
            />
            <text x="660" y="200" fill="#fdba74" fontSize="10" fontWeight="700" opacity="0.9">
              GSI CRITICAL LANDSLIDE ZONE
            </text>
          </g>
        )}

        {layers.cloudburstHazard && (activeHazardFilter === 'All' || activeHazardFilter === 'Cloudburst' || activeHazardFilter === 'Multi-hazard') && (
          <g id="map-cloudburst-hazard-zones">
            <ellipse
              cx="420"
              cy="220"
              rx="110"
              ry="75"
              fill="url(#cloudburstGrad)"
              stroke="#c084fc"
              strokeWidth="1.2"
              strokeDasharray="6 3"
            />
            <text x="375" y="235" fill="#e9d5ff" fontSize="9" fontWeight="600">
              IMD Cloudburst Convective Pocket
            </text>
          </g>
        )}

        {/* Roads and Bridges */}
        {layers.roads && (
          <g id="map-roads">
            {/* NH-107 (Rudraprayag to Gaurikund) */}
            <path
              d="M 310 490 Q 325 380 345 280 Q 365 180 395 100"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="none"
            />
            {/* NH-07 (Rishikesh - Srinagar - Rudraprayag - Karnaprayag - Joshimath) */}
            <path
              d="M 160 590 Q 320 540 460 480 T 680 290 T 780 180"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
            />
            {/* Arterial Connecting Roads */}
            <path
              d="M 345 280 L 590 390"
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <path
              d="M 590 390 L 760 490"
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />

            {/* Critical Bridge Markers */}
            <g transform="translate(355, 460)">
              <circle r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <text x="10" y="4" fill="#fca5a5" fontSize="8" fontWeight="bold">Bridge Chokepoint (Red Alert)</text>
            </g>
            <g transform="translate(480, 485)">
              <circle r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <text x="8" y="3" fill="#6ee7b7" fontSize="8">NH-07 Reinforced Bridge</text>
            </g>
          </g>
        )}

        {/* Assigned Relocation Flow Vectors (Plan generation result) */}
        {layers.routes && (showAssignments || assignments.length > 0) && (
          <g id="map-relocation-routes">
            {assignments.map((assignment, index) => {
              const hab = habitations.find(h => h.id === assignment.habitationId);
              const site = sites.find(s => s.id === assignment.assignedSiteId);
              if (!hab || !site) return null;

              const origin = mapToSvg(hab.coords.x, hab.coords.y);
              const target = mapToSvg(site.coords.x, site.coords.y);
              
              // Quadratic bezier midpoint calculation for gentle arc
              const midX = (origin.x + target.x) / 2 + (index % 2 === 0 ? 30 : -30);
              const midY = (origin.y + target.y) / 2 - 25;

              return (
                <g key={`route-${assignment.habitationId}-${assignment.assignedSiteId}`}>
                  <path
                    d={`M ${origin.x} ${origin.y} Q ${midX} ${midY} ${target.x} ${target.y}`}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    opacity="0.85"
                  >
                    <animate 
                      attributeName="stroke-dashoffset" 
                      from="40" 
                      to="0" 
                      dur="2s" 
                      repeatCount="indefinite" 
                    />
                  </path>
                  {/* Directional arrowhead */}
                  <circle cx={(origin.x + target.x) / 2} cy={(origin.y + target.y) / 2 - 12} r="3" fill="#c7d2fe" />
                </g>
              );
            })}
          </g>
        )}

        {/* Safe Relocation Sites (Green Shields / Safe Havens) */}
        {layers.sites && sites.map((site) => {
          const pt = mapToSvg(site.coords.x, site.coords.y);
          const isSelected = selectedSite?.id === site.id;
          const occupancyRate = site.currentOccupancy / site.maxCapacity;

          return (
            <g
              id={`site-marker-${site.id}`}
              key={site.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSite?.(site);
              }}
              onMouseEnter={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                setHoveredEntity({
                  type: 'site',
                  item: site,
                  x: e.clientX - (rect?.left || 0),
                  y: e.clientY - (rect?.top || 0) - 40
                });
              }}
              onMouseLeave={() => setHoveredEntity(null)}
            >
              {/* Pulsing ring if selected */}
              {isSelected && (
                <circle
                  r="22"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  className="animate-spin"
                />
              )}

              {/* Outer Capacity Ring */}
              <circle
                r="15"
                fill="#064e3b"
                stroke="#10b981"
                strokeWidth="2"
                opacity="0.9"
              />
              {/* Inner Utilization Sector / Core */}
              <circle
                r="11"
                fill={occupancyRate > 0.9 ? '#b45309' : '#059669'}
                stroke="#34d399"
                strokeWidth="1.5"
              />

              {/* Shelter Icon representation */}
              <path
                d="M -5 2 L 0 -4 L 5 2 Z M -3 2 L -3 5 L 3 5 L 3 2 Z"
                fill="#ffffff"
              />

              {/* Site Code Label */}
              <rect
                x="-18"
                y="16"
                width="36"
                height="13"
                rx="3"
                fill="#0f172a"
                stroke="#10b981"
                strokeWidth="1"
              />
              <text
                x="0"
                y="25.5"
                textAnchor="middle"
                fill="#a7f3d0"
                fontSize="8"
                fontWeight="700"
                fontFamily="monospace"
              >
                {site.code.replace('SITE-', '')}
              </text>
            </g>
          );
        })}

        {/* Habitations Markers */}
        {layers.habitations && habitations.map((hab) => {
          const pt = mapToSvg(hab.coords.x, hab.coords.y);
          const isSelected = selectedHabitation?.id === hab.id;
          const color = getRiskColor(hab.priorityWindow);

          return (
            <g
              id={`hab-marker-${hab.id}`}
              key={hab.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={(e) => {
                e.stopPropagation();
                onSelectHabitation?.(hab);
              }}
              onMouseEnter={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                setHoveredEntity({
                  type: 'hab',
                  item: hab,
                  x: e.clientX - (rect?.left || 0),
                  y: e.clientY - (rect?.top || 0) - 40
                });
              }}
              onMouseLeave={() => setHoveredEntity(null)}
            >
              {/* Critical pulse animation for Immediate Priority */}
              {hab.priorityWindow === 'Immediate' && (
                <circle
                  r="18"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity="0.75"
                >
                  <animate
                    attributeName="r"
                    values="9;22;9"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0;0.8"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Selection Reticle */}
              {isSelected && (
                <g>
                  <circle
                    r="16"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                    className="animate-spin"
                  />
                  <line x1="-20" y1="0" x2="-14" y2="0" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="14" y1="0" x2="20" y2="0" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="0" y1="-20" x2="0" y2="-14" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="0" y1="14" x2="0" y2="20" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              )}

              {/* Habitation Node */}
              <circle
                r={hab.priorityWindow === 'Immediate' ? 8.5 : 7}
                fill={color}
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* Status Indicator inner pip if Relocated */}
              {hab.status === 'Relocated' && (
                <circle r="3" fill="#ffffff" />
              )}

              {/* Compact Name Tag */}
              <text
                x="11"
                y="3.5"
                fill="#f8fafc"
                fontSize="9"
                fontWeight="600"
                stroke="#020617"
                strokeWidth="2.5"
                paintOrder="stroke"
              >
                {hab.name.replace('Village ', '')}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Interactive Hover Tooltip */}
      {hoveredEntity && (
        <div 
          className="pointer-events-none absolute z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white rounded-lg p-2.5 shadow-2xl text-xs max-w-xs transition-all"
          style={{
            left: `${Math.min(hoveredEntity.x, 700)}px`,
            top: `${Math.max(hoveredEntity.y, 40)}px`
          }}
        >
          {hoveredEntity.type === 'hab' ? (
            (() => {
              const h = hoveredEntity.item as Habitation;
              return (
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1.5">
                    <span className="font-bold text-white text-[13px]">{h.name}</span>
                    <span 
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{ 
                        backgroundColor: `${getRiskColor(h.priorityWindow)}25`,
                        color: getRiskColor(h.priorityWindow)
                      }}
                    >
                      {h.priorityWindow}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300 text-[11px]">
                    <div>Pop: <span className="font-semibold text-white">{h.population.toLocaleString()}</span></div>
                    <div>Risk Score: <span className="font-bold text-red-400">{h.riskScore}/100</span></div>
                    <div>Hazard: <span className="text-amber-300">{h.dominantHazard}</span></div>
                    <div>Status: <span className="text-cyan-300 font-medium">{h.status}</span></div>
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                    Action: {h.recommendedAction}
                  </div>
                </div>
              );
            })()
          ) : (
            (() => {
              const s = hoveredEntity.item as RelocationSite;
              return (
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1.5">
                    <span className="font-bold text-emerald-300 text-[13px]">{s.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                      Suitability: {s.suitabilityScore}%
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span>Total Capacity:</span>
                      <span className="font-semibold text-white">{s.maxCapacity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Occupancy:</span>
                      <span className="font-semibold text-amber-300">{s.currentOccupancy.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Available:</span>
                      <span className="font-bold text-emerald-400">{s.remainingCapacity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Water: {s.water.status}</span>
                      <span>Health: {s.healthcareKm} km</span>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-30 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700/80 shadow-lg text-[11px]">
        <div className="font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Operational Legend</span>
          <span className="text-[10px] font-mono text-slate-400">GIS Layer 1.2</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-slate-300">Critical / Immediate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Safe Relocation Site</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-300">High / Short-term</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 rounded-full" />
            <span className="text-slate-300">Primary River Gorges</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-slate-300">Moderate / Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-400 rounded-full" />
            <span className="text-slate-300">National Highway NH-07</span>
          </div>
        </div>
      </div>

      {/* Bottom Coordinates & Scale Status (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-indigo-400" />
          <span>{mouseCoords.lat.toFixed(4)}°N, {mouseCoords.lng.toFixed(4)}°E</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1">
          <span>Scale:</span>
          <div className="w-12 h-1 bg-slate-600 relative">
            <div className="w-6 h-full bg-indigo-400" />
          </div>
          <span>10 km</span>
        </div>
      </div>
    </div>
  );
};
