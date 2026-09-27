import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Habitation, RelocationSite } from '../types';
import { 
  Layers, 
  MapPin, 
  ShieldCheck, 
  Maximize2, 
  Navigation2, 
  Eye, 
  AlertTriangle, 
  Waves, 
  Mountain, 
  Building2,
  Compass
} from 'lucide-react';

interface OpenStreetMapProps {
  habitations: Habitation[];
  sites: RelocationSite[];
  selectedHabitation?: Habitation | null;
  selectedSite?: RelocationSite | null;
  onSelectHabitation: (hab: Habitation) => void;
  onSelectSite: (site: RelocationSite) => void;
  showCorridors?: boolean;
  filterHazard?: string;
  heightClass?: string;
}

export const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  habitations,
  sites,
  selectedHabitation,
  selectedSite,
  onSelectHabitation,
  onSelectSite,
  showCorridors = true,
  filterHazard = 'All',
  heightClass = 'h-[540px]'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    tileLayer?: L.TileLayer;
    habitationLayer?: L.LayerGroup;
    siteLayer?: L.LayerGroup;
    corridorLayer?: L.LayerGroup;
    hazardLayer?: L.LayerGroup;
  }>({});

  const [activeBasemap, setActiveBasemap] = useState<'osm' | 'carto'>('osm');
  const [showHabitations, setShowHabitations] = useState(true);
  const [showSites, setShowSites] = useState(true);
  const [showEvacCorridors, setShowEvacCorridors] = useState(showCorridors);
  const [showHazardZones, setShowHazardZones] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Rudraprayag / Chamoli Himalayan sector
    const map = L.map(mapContainerRef.current, {
      center: [30.45, 79.18],
      zoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    // Custom attribution in corner
    L.control.attribution({
      position: 'bottomright',
      prefix: '<span>© <a href="https://www.openstreetmap.org/copyright" target="_blank" class="text-indigo-600 underline">OpenStreetMap</a> contributors</span>'
    }).addTo(map);

    // Zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Tile Layer: OpenStreetMap Standard
    const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    layersRef.current.tileLayer = osmTile;
    layersRef.current.habitationLayer = L.layerGroup().addTo(map);
    layersRef.current.siteLayer = L.layerGroup().addTo(map);
    layersRef.current.corridorLayer = L.layerGroup().addTo(map);
    layersRef.current.hazardLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.tileLayer) {
      map.removeLayer(layersRef.current.tileLayer);
    }

    if (activeBasemap === 'osm') {
      layersRef.current.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);
    } else {
      layersRef.current.tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);
    }
  }, [activeBasemap]);

  // Render Hazard Polygons
  useEffect(() => {
    const layer = layersRef.current.hazardLayer;
    if (!layer) return;
    layer.clearLayers();

    if (!showHazardZones) return;

    // 1. Mandakini Gorge Flood Inundation Envelope
    const floodPolygon = L.polygon([
      [30.655, 79.020],
      [30.640, 79.035],
      [30.550, 79.100],
      [30.400, 79.130],
      [30.290, 78.980],
      [30.280, 78.995],
      [30.390, 79.145],
      [30.560, 79.115],
      [30.660, 79.030]
    ], {
      color: '#0284c7',
      weight: 2,
      fillColor: '#38bdf8',
      fillOpacity: 0.25,
      dashArray: '5, 5'
    }).bindTooltip('<strong>Active River Surge Zone</strong><br/>Mandakini Valley (CWC Warning Mark +1.8m)', { sticky: true });
    layer.addLayer(floodPolygon);

    // 2. Joshimath Subsidence & InSAR Landslide Scarp
    const landslideCircle = L.circle([30.555, 79.565], {
      radius: 4200,
      color: '#ea580c',
      weight: 2,
      fillColor: '#f97316',
      fillOpacity: 0.22,
      dashArray: '6, 6'
    }).bindTooltip('<strong>Active Slope Creep & Subsidence</strong><br/>Joshimath / Helang Shear Plane (InSAR 68mm/mo)', { sticky: true });
    layer.addLayer(landslideCircle);

    // 3. Madhyamaheshwar Cloudburst Ravine Envelope
    const cloudburstPolygon = L.polygon([
      [30.630, 79.170],
      [30.610, 79.220],
      [30.540, 79.190],
      [30.560, 79.150]
    ], {
      color: '#9333ea',
      weight: 2,
      fillColor: '#a855f7',
      fillOpacity: 0.22
    }).bindTooltip('<strong>Cloudburst Debris Torrent Corridor</strong><br/>High-gradient high-altitude funnel', { sticky: true });
    layer.addLayer(cloudburstPolygon);

  }, [showHazardZones]);

  // Render Evacuation Corridors
  useEffect(() => {
    const layer = layersRef.current.corridorLayer;
    if (!layer) return;
    layer.clearLayers();

    if (!showEvacCorridors) return;

    habitations.forEach(hab => {
      if (!hab.assignedSiteId) return;
      const targetSite = sites.find(s => s.id === hab.assignedSiteId);
      if (!targetSite) return;

      const polyline = L.polyline([
        [hab.coords.lat, hab.coords.lng],
        [targetSite.coords.lat, targetSite.coords.lng]
      ], {
        color: '#4f46e5',
        weight: 3,
        dashArray: '7, 9',
        opacity: 0.85
      });

      polyline.bindTooltip(`
        <div class="text-xs p-1">
          <span class="font-bold text-indigo-700">Evacuation Route:</span> ${hab.name} → ${targetSite.name}<br/>
          <span class="text-slate-600">Transit: ${(hab.population).toLocaleString()} evacuees</span>
        </div>
      `, { sticky: true });

      layer.addLayer(polyline);
    });
  }, [habitations, sites, showEvacCorridors]);

  // Render Relocation Sites (Safe Havens)
  useEffect(() => {
    const layer = layersRef.current.siteLayer;
    if (!layer) return;
    layer.clearLayers();

    if (!showSites) return;

    sites.forEach(site => {
      const isSelected = selectedSite?.id === site.id;
      const occupancyPct = Math.round((site.currentOccupancy / site.maxCapacity) * 100);

      const html = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
          <div class="w-8 h-8 rounded-xl bg-emerald-600 border-2 ${isSelected ? 'border-indigo-600 ring-4 ring-indigo-200' : 'border-white'} shadow-lg flex items-center justify-center text-white font-bold text-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
          <span class="absolute -top-2 -right-2 bg-emerald-900 text-emerald-100 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm">
            ${site.code.replace('SITE-', '')}
          </span>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: 'custom-site-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([site.coords.lat, site.coords.lng], { icon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 text-slate-800 text-xs w-64';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
          <span class="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Safe Haven Facility</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Score: ${site.suitabilityScore}/100
          </span>
        </div>
        <h4 class="font-bold text-slate-900 text-sm mb-1">${site.name}</h4>
        <div class="text-[11px] text-slate-600 mb-2">Taluka: ${site.taluka} • Elev: ${site.elevationM}m</div>
        
        <div class="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] mb-2.5">
          <div class="flex justify-between">
            <span class="text-slate-500">Occupancy:</span>
            <span class="font-semibold text-slate-900">${site.currentOccupancy.toLocaleString()} / ${site.maxCapacity.toLocaleString()} (${occupancyPct}%)</span>
          </div>
          <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full ${occupancyPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: ${occupancyPct}%"></div>
          </div>
          <div class="flex justify-between pt-1">
            <span class="text-slate-500">Remaining Buffer:</span>
            <span class="font-bold text-emerald-700">${site.remainingCapacity.toLocaleString()} spots</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Water Supply:</span>
            <span class="font-medium text-slate-800">${site.water.lpcd} LPCD (${site.water.status})</span>
          </div>
        </div>
      `;

      const btn = document.createElement('button');
      btn.className = 'w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition text-center';
      btn.innerText = 'Inspect Carrying Capacity';
      btn.onclick = () => onSelectSite(site);
      popupContent.appendChild(btn);

      marker.bindPopup(popupContent);
      marker.on('click', () => onSelectSite(site));

      layer.addLayer(marker);
    });
  }, [sites, selectedSite, showSites, onSelectSite]);

  // Render Habitations
  useEffect(() => {
    const layer = layersRef.current.habitationLayer;
    if (!layer) return;
    layer.clearLayers();

    if (!showHabitations) return;

    const filteredHabs = habitations.filter(h => {
      if (filterHazard !== 'All' && h.dominantHazard !== filterHazard) return false;
      return true;
    });

    filteredHabs.forEach(hab => {
      const isSelected = selectedHabitation?.id === hab.id;
      const isImmediate = hab.priorityWindow === 'Immediate';
      const isShort = hab.priorityWindow === 'Short-term';
      const isMedium = hab.priorityWindow === 'Medium-term';

      const colorBg = isImmediate ? 'bg-red-600' : isShort ? 'bg-orange-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500';
      const colorRing = isImmediate ? 'ring-red-300' : isShort ? 'ring-orange-200' : 'ring-slate-200';

      const html = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125">
          ${isImmediate ? '<div class="absolute w-8 h-8 rounded-full bg-red-400 opacity-75 pulse-marker-immediate"></div>' : ''}
          <div class="w-6 h-6 rounded-full ${colorBg} border-2 ${isSelected ? 'border-indigo-800 ring-4 ring-indigo-300 scale-125' : 'border-white'} shadow-md flex items-center justify-center text-white font-bold text-[10px]">
            ${hab.riskScore}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: 'custom-hab-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([hab.coords.lat, hab.coords.lng], { icon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 text-slate-800 text-xs w-64';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
          <span class="font-bold uppercase tracking-wider text-[10px] text-slate-500">${hab.code} • ${hab.taluka}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
            isImmediate ? 'bg-red-100 text-red-700 border border-red-200' :
            isShort ? 'bg-orange-100 text-orange-700 border border-orange-200' :
            'bg-amber-100 text-amber-700 border border-amber-200'
          }">
            ${hab.priorityWindow}
          </span>
        </div>
        <h4 class="font-bold text-slate-900 text-sm mb-1">${hab.name}</h4>
        <div class="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] mb-2.5">
          <div class="flex justify-between">
            <span class="text-slate-500">Population:</span>
            <span class="font-semibold text-slate-900">${hab.population.toLocaleString()} citizens</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Multi-Hazard Score:</span>
            <span class="font-bold text-red-600">${hab.riskScore}/100</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Dominant Threat:</span>
            <span class="font-semibold text-slate-800">${hab.dominantHazard}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Road Corridor:</span>
            <span class="font-medium text-slate-700">${hab.accessibility.roadStatus}</span>
          </div>
          ${hab.assignedSiteName ? `
            <div class="flex justify-between pt-1 border-t border-slate-200">
              <span class="text-indigo-600 font-semibold">Assigned Haven:</span>
              <span class="font-bold text-indigo-700">${hab.assignedSiteName.split(':')[0]}</span>
            </div>
          ` : ''}
        </div>
      `;

      const btn = document.createElement('button');
      btn.className = 'w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition text-center shadow-xs mt-1';
      btn.innerText = 'View Profile & Risk Breakdown';
      btn.onclick = () => onSelectHabitation(hab);
      popupContent.appendChild(btn);

      marker.bindPopup(popupContent, {
        className: 'custom-leaflet-village-popup',
        autoPanPadding: [20, 70]
      });
      marker.on('click', () => onSelectHabitation(hab));

      layer.addLayer(marker);
    });
  }, [habitations, selectedHabitation, showHabitations, filterHazard, onSelectHabitation]);

  // Center on selected item
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedHabitation) {
      map.setView([selectedHabitation.coords.lat, selectedHabitation.coords.lng], 12, { animate: true });
    } else if (selectedSite) {
      map.setView([selectedSite.coords.lat, selectedSite.coords.lng], 12, { animate: true });
    }
  }, [selectedHabitation, selectedSite]);

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([30.45, 79.18], 10, { animate: true });
  };

  return (
    <div className={`relative ${heightClass} w-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-white text-slate-800`}>
      
      {/* Map Container Ref */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Controls Bar - Subtle, clean alignment, lowered z-index so it never pops over village inspection or popups */}
      <div className={`absolute top-2.5 left-2.5 z-[450] flex flex-wrap items-center gap-1.5 transition-opacity duration-200 ${
        selectedHabitation ? 'opacity-85 hover:opacity-100' : 'opacity-95 hover:opacity-100'
      }`}>
        
        {/* Basemap Toggle - Sleek Segmented Switch */}
        <div className="flex bg-white/90 backdrop-blur-md rounded-lg p-0.5 shadow-xs border border-slate-200/80 text-[11px] font-medium">
          <button
            onClick={() => setActiveBasemap('osm')}
            className={`px-2 py-0.5 rounded-md transition ${
              activeBasemap === 'osm' 
                ? 'bg-slate-800 text-white font-semibold shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            OSM Standard
          </button>
          <button
            onClick={() => setActiveBasemap('carto')}
            className={`px-2 py-0.5 rounded-md transition ${
              activeBasemap === 'carto' 
                ? 'bg-slate-800 text-white font-semibold shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            OSM Light Carto
          </button>
        </div>

        {/* Layer Toggles - Compact & Low-Profile */}
        <div className="hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-lg px-2.5 py-1 shadow-xs border border-slate-200/80 text-[11px] font-medium text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={showHabitations}
              onChange={e => setShowHabitations(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
            />
            <span>Habitations</span>
          </label>
          <span className="text-slate-200 font-light">|</span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={showSites}
              onChange={e => setShowSites(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-600"
            />
            <span>Safe Havens</span>
          </label>
          <span className="text-slate-200 font-light">|</span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={showEvacCorridors}
              onChange={e => setShowEvacCorridors(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
            />
            <span>Corridors</span>
          </label>
          <span className="text-slate-200 font-light">|</span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={showHazardZones}
              onChange={e => setShowHazardZones(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-0 cursor-pointer accent-amber-600"
            />
            <span>Hazards</span>
          </label>
        </div>

        {/* Reset View Button - Subdued & Subtle */}
        <button
          onClick={handleResetView}
          title="Reset to District Overview"
          className="flex items-center gap-1 bg-white/90 backdrop-blur-md hover:bg-white text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg shadow-xs border border-slate-200/80 text-[11px] font-medium transition"
        >
          <Compass className="w-3 h-3 text-slate-500" />
          <span className="hidden md:inline">Reset Extent</span>
        </button>
      </div>

      {/* Bottom Map Legend - Subtle & Compact */}
      <div className="absolute bottom-2.5 left-2.5 z-[450] bg-white/90 backdrop-blur-md rounded-lg px-2.5 py-1.5 shadow-xs border border-slate-200/80 text-xs text-slate-600 hidden sm:block max-w-lg">
        <div className="flex items-center gap-4 text-[11px] font-medium flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-sm" />
            <span>Immediate Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-sm" />
            <span>Short-Term</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm" />
            <span>Medium-Term</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 border border-white shadow-sm text-white flex items-center justify-center text-[8px] font-bold">S</span>
            <span>Relocation Haven</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-indigo-600" />
            <span>Evacuation Route</span>
          </div>
        </div>
      </div>

    </div>
  );
};
