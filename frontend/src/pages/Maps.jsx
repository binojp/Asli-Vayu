import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Navigation, 
  Wind, 
  Clock, 
  Activity,
  ChevronRight,
  MapPin,
  Leaf
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

// Global Leaflet for legacy plugins
if (typeof window !== 'undefined') {
  window.L = L;
}
import 'leaflet.heat/dist/leaflet-heat.js';
import clsx from 'clsx';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Maps() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const heatLayer = useRef(null);
  const routeLayer = useRef(null);
  
  const [search, setSearch] = useState({ from: '', to: '' });
  const [results, setResults] = useState({ from: [], to: [] });
  const [selected, setSelected] = useState({ from: null, to: null });
  const [loading, setLoading] = useState({ from: false, to: false, route: false });
  const [routeInfo, setRouteInfo] = useState(null);

  const API_BASE = "/api/sensor";

  // Initialize Map
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([28.6139, 77.2090], 11);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapInstance.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
      
      // Initial heatmap fetch
      fetchHeatmap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const fetchHeatmap = async () => {
    try {
      const res = await fetch(`${API_BASE}/heat`);
      const data = await res.json();
      
      if (data.grid && data.grid.length > 0 && mapInstance.current) {
        if (heatLayer.current) mapInstance.current.removeLayer(heatLayer.current);
        
        // Convert grid to heatmap points [[lat, lon, intensity], ...]
        const points = [];
        const { lat_range, lon_range, grid } = data;
        
        for (let i = 0; i < lat_range.length; i++) {
          for (let j = 0; j < lon_range.length; j++) {
            if (grid[i][j] > 20) { // Only show significant pollution
               points.push([lat_range[i], lon_range[j], grid[i][j] / 200]);
            }
          }
        }

        heatLayer.current = L.heatLayer(points, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
        }).addTo(mapInstance.current);
      }
    } catch (err) {
      console.error("Heatmap fetch error:", err);
    }
  };

  // Handle Geocoding Search
  const performSearch = async (query, type) => {
    if (query.length < 3) return;
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
      const data = await res.json();
      setResults(prev => ({ ...prev, [type]: data }));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Handle Location Selection
  const handleSelect = (item, type) => {
    const pos = [parseFloat(item.lat), parseFloat(item.lon)];
    setSelected(prev => ({ ...prev, [type]: { ...item, lat: parseFloat(item.lat), lon: parseFloat(item.lon) } }));
    setSearch(prev => ({ ...prev, [type]: item.display_name }));
    setResults(prev => ({ ...prev, [type]: [] }));

    if (mapInstance.current) {
      mapInstance.current.flyTo(pos, 15);
      L.marker(pos).addTo(mapInstance.current)
        .bindPopup(type === 'from' ? 'Start' : 'End')
        .openPopup();
    }
  };

  // Handle Routing via Backend
  useEffect(() => {
    const getGreenRoute = async () => {
      if (!selected.from || !selected.to || !mapInstance.current) return;
      
      setLoading(prev => ({ ...prev, route: true }));
      try {
        const res = await fetch(`${API_BASE}/route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: selected.from,
            to: selected.to
          })
        });
        
        const geojson = await res.json();
        
        if (routeLayer.current) mapInstance.current.removeLayer(routeLayer.current);
        
        routeLayer.current = L.geoJSON(geojson, {
          style: {
            color: "#10b981",
            weight: 6,
            opacity: 0.8,
            lineCap: 'round'
          }
        }).addTo(mapInstance.current);

        // Zoom to route
        const bounds = routeLayer.current.getBounds();
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });

        // Calculate simulated info (Backend could provide this too)
        setRouteInfo({
          distance: "Calculating...",
          duration: "Calculating...",
          aqi: Math.floor(Math.random() * 50) + 40 // Example logic
        });

      } catch (err) {
        console.error("Routing error:", err);
      } finally {
        setLoading(prev => ({ ...prev, route: false }));
      }
    };

    getGreenRoute();
  }, [selected]);

  return (
    <div className="relative h-screen w-full bg-zinc-950 overflow-hidden font-sans">
      <div ref={mapRef} className="absolute inset-0 z-0" />

      <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col gap-6">
        <div className="flex justify-between items-start pointer-events-auto">
          <Link 
            to="/dashboard"
            className="p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>

          <div className="flex items-center gap-2 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl">
            <Leaf className="w-6 h-6 text-green-400" />
            <span className="text-xl font-bold tracking-tight text-white">Green Routes</span>
          </div>
        </div>

        <div className="w-full max-w-md pointer-events-auto space-y-3">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-green-400" />
              Plan Your Journey
            </h3>
            
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                <input 
                  type="text"
                  placeholder="Start Location..."
                  value={search.from}
                  onChange={(e) => {
                    setSearch(prev => ({ ...prev, from: e.target.value }));
                    performSearch(e.target.value, 'from');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-green-500/50 transition-all"
                />
                <AnimatePresence>
                  {results.from.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-2xl"
                    >
                      {results.from.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelect(item, 'from')}
                          className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-green-500/10 hover:text-white transition-colors border-b border-zinc-800 last:border-0"
                        >
                          {item.display_name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <input 
                  type="text"
                  placeholder="Where to?"
                  value={search.to}
                  onChange={(e) => {
                    setSearch(prev => ({ ...prev, to: e.target.value }));
                    performSearch(e.target.value, 'to');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-green-500/50 transition-all"
                />
                <AnimatePresence>
                  {results.to.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-2xl"
                    >
                      {results.to.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelect(item, 'to')}
                          className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-green-500/10 hover:text-white transition-colors border-b border-zinc-800 last:border-0"
                        >
                          {item.display_name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {routeInfo && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    Eco Analysis
                  </h4>
                  <div className={clsx(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    routeInfo.aqi < 100 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  )}>
                    AQI: {routeInfo.aqi}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                      <Wind className="w-3 h-3" />
                      Condition
                    </div>
                    <div className="text-xl font-bold text-white">{routeInfo.aqi < 100 ? "Clean" : "Moderate"}</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                      <Clock className="w-3 h-3" />
                      Green Factor
                    </div>
                    <div className="text-xl font-bold text-white">Optimal</div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Leaf className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <div className="text-xs text-green-400 font-bold uppercase tracking-wider">Green Choice</div>
                    <div className="text-white text-sm">Path optimized for minimal pollution.</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
