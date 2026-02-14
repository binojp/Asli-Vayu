import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Navigation, 
  Wind, 
  Leaf, 
  ChevronRight,
  ArrowRight,
  Map as MapIcon,
  Search,
  X,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Fix for Leaflet default icon issues in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function Maps() {
  const [searchParams] = useSearchParams();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const parksLayerRef = useRef(L.layerGroup());

  const [search, setSearch] = useState({ from: '', to: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); // 'from' or 'to'
  const [loading, setLoading] = useState(false);
  const [parks, setParks] = useState([]);
  const [startLoc, setStartLoc] = useState(null);
  const [endLoc, setEndLoc] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const query = activeField === 'from' ? search.from : search.to;
      if (!query || query.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}, Kochi&limit=5`);
        setSuggestions(res.data);
      } catch (err) {
        console.error("Suggestion fetch error");
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [search.from, search.to, activeField]);

  const geocode = async (query) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}, Kochi`);
      if (res.data && res.data[0]) {
        return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) };
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const map = L.map(mapContainerRef.current, {
      center: [9.9312, 76.2673],
      zoom: 13,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    parksLayerRef.current.addTo(map);
    mapRef.current = map;

    fetchHeatmap();
    if (searchParams.get('action') === 'find-park') findParks();

    const handleClickOutside = (e) => {
      if (!e.target.closest('.relative.group')) {
        setSuggestions([]);
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        window.startMarker = null;
        window.endMarker = null;
      }
    };
  }, []);

  const fetchHeatmap = async () => {
    try {
      const res = await axios.get('/api/sensor/heat');
      if (res.data.grid && res.data.grid.length > 0) {
        const heatPoints = [];
        const { grid, lat_range, lon_range } = res.data;
        for (let i = 0; i < grid.length; i++) {
          for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j] > 10) heatPoints.push([lat_range[i], lon_range[j], grid[i][j] / 500]);
          }
        }
        if (heatLayerRef.current) mapRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17, gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' } }).addTo(mapRef.current);
      }
    } catch (err) {}
  };

  const findParks = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/sensor/park', { lat: startLoc.lat, lon: startLoc.lon });
      const foundParks = res.data.parks || [];
      setParks(foundParks);
      parksLayerRef.current.clearLayers();
      foundParks.forEach(p => {
        L.marker([p.lat, p.lon], { icon: DefaultIcon }).bindPopup(`<b>${p.name}</b><br/>AQI: ${p.aqi}`).addTo(parksLayerRef.current);
      });
      if (foundParks.length > 0) toast.success("Nearby green oases found!");
    } catch (err) { toast.error("Failed to find parks"); } finally { setLoading(false); }
  };

  const handleRouting = async () => {
    if (!search.from || !search.to) return toast.error("Please enter both locations");
    setLoading(true);
    try {
      const start = await geocode(search.from);
      const end = await geocode(search.to);

      if (!start || !end) {
        toast.error("Could not find one of the locations");
        return;
      }

      setStartLoc(start);
      setEndLoc(end);

      // Update markers
      if (window.startMarker) window.startMarker.setLatLng([start.lat, start.lon]);
      else window.startMarker = L.marker([start.lat, start.lon], { icon: L.divIcon({ html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>', className: '' }) }).addTo(mapRef.current);

      if (window.endMarker) window.endMarker.setLatLng([end.lat, end.lon]);
      else window.endMarker = L.marker([end.lat, end.lon], { icon: L.divIcon({ html: '<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>', className: '' }) }).addTo(mapRef.current);

      const res = await axios.post('/api/sensor/green-route', { from: start, to: end });
      if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = L.geoJSON(res.data, { style: { color: '#22c55e', weight: 6, opacity: 0.8 } }).addTo(mapRef.current);
      mapRef.current.fitBounds(routeLayerRef.current.getBounds());
      toast.success("Green route calculated!");
    } catch (err) { toast.error("Routing service error"); } finally { setLoading(false); }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden font-sans relative">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-4 max-w-[calc(100vw-48px)]">
        <Link to="/dashboard" className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center hover:bg-zinc-800 transition-all shadow-2xl">
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        
        <motion.div 
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="w-full sm:w-[380px] bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 rounded-[32px] p-6 shadow-2xl space-y-6"
        >
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              <Navigation className="text-green-400" /> Green Navigator
            </h1>
            <p className="text-xs text-zinc-500">Pick points on the map to begin.</p>
          </div>

          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
              <input 
                type="text"
                placeholder="Starting Point (e.g. Edapally)"
                value={search.from}
                onFocus={() => setActiveField('from')}
                onChange={(e) => setSearch({...search, from: e.target.value})}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-10 pr-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
              />
              {activeField === 'from' && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden z-[1100] shadow-2xl">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearch({...search, from: s.display_name});
                        setSuggestions([]);
                        setActiveField(null);
                      }}
                      className="w-full text-left px-4 py-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800 last:border-0"
                    >
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500" />
              <input 
                type="text"
                placeholder="Destination (e.g. Marine Drive)"
                value={search.to}
                onFocus={() => setActiveField('to')}
                onChange={(e) => setSearch({...search, to: e.target.value})}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl pl-10 pr-6 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
              />
              {activeField === 'to' && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden z-[1100] shadow-2xl">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearch({...search, to: s.display_name});
                        setSuggestions([]);
                        setActiveField(null);
                      }}
                      className="w-full text-left px-4 py-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800 last:border-0"
                    >
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleRouting} disabled={loading || !search.to}
              className="w-full py-4 bg-green-500 text-black font-extrabold rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Calculate Green Route"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">
             Enter any place or area name in the city.
          </div>
        </motion.div>
      </div>

      {/* Parks List Overlay */}
      <AnimatePresence>
        {parks.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-10 left-6 z-[1000] w-[380px] max-w-[calc(100vw-48px)] bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-[32px] p-6 shadow-2xl"
          >
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold flex items-center gap-2 text-white">
                 <Leaf className="text-emerald-400" />
                 Nearby Green Oases
               </h3>
               <button onClick={() => setParks([])} className="p-1 hover:bg-zinc-800 rounded-full text-zinc-500">
                 <X className="w-4 h-4" />
               </button>
             </div>
             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-zinc">
               {parks.map((p, i) => (
                 <div 
                   key={i} 
                   onClick={() => mapRef.current.setView([p.lat, p.lon], 16)}
                   className="p-3 bg-zinc-800/40 border border-transparent hover:border-emerald-500/30 rounded-xl flex items-center justify-between group cursor-pointer transition-all"
                 >
                   <div>
                     <p className="text-sm font-bold text-white">{p.name}</p>
                     <p className="text-[10px] text-zinc-500 tracking-wide uppercase font-medium">PM2.5: {p.aqi}</p>
                   </div>
                   <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500 group-hover:text-black transition-all">
                     <ArrowRight className="w-4 h-4" />
                   </div>
                 </div>
               ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
