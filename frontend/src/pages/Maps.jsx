import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Navigation, 
  ChevronRight,
  MapPin
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [search, setSearch] = useState({ from: '', to: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const query = activeField === 'from' ? search.from : search.to;
      if (!query || query.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await axios.get('/api/map/geocode', { params: { q: `${query}`, limit: 5 } });
        setSuggestions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Suggestion fetch error");
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [search.from, search.to, activeField]);

  const geocode = async (query) => {
    try {
      const res = await axios.get('/api/map/geocode', { params: { q: `${query}`, limit: 1 } });
      const data = Array.isArray(res.data) ? res.data : [];
      if (data[0]) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
      return null;
    } catch (err) {
      return null;
    }
  };

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

    mapRef.current = map;

    const handleClickOutside = (e) => {
      if (!e.target.closest('.relative.group')) {
        setSuggestions([]);
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (routeLayerRef.current && mapRef.current) mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        window.startMarker = null;
        window.endMarker = null;
      }
    };
  }, []);

  const handleRouting = async () => {
    if (!search.from || !search.to) return toast.error("Please enter both locations");
    setLoading(true);
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    try {
      const start = await geocode(search.from);
      const end = await geocode(search.to);

      if (!start || !end) {
        toast.error("Could not find one of the locations");
        setLoading(false);
        return;
      }

      if (window.startMarker) window.startMarker.setLatLng([start.lat, start.lon]);
      else window.startMarker = L.marker([start.lat, start.lon], { icon: L.divIcon({ html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>', className: '' }) }).addTo(mapRef.current);

      if (window.endMarker) window.endMarker.setLatLng([end.lat, end.lon]);
      else window.endMarker = L.marker([end.lat, end.lon], { icon: L.divIcon({ html: '<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>', className: '' }) }).addTo(mapRef.current);

      const res = await axios.get('/api/map/route', {
        params: { from: `${start.lat},${start.lon}`, to: `${end.lat},${end.lon}` }
      });
      const geojson = res.data;

      if (!geojson?.features?.length) {
        toast.error("No route found between these locations.");
        setLoading(false);
        return;
      }

      routeLayerRef.current = L.geoJSON(geojson, {
        style: { color: '#3b82f6', weight: 5, opacity: 0.9 }
      }).addTo(mapRef.current);
      const bounds = routeLayerRef.current.getBounds();
      if (bounds.isValid()) mapRef.current.fitBounds(bounds);
      toast.success("Route drawn.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Routing service error");
    } finally {
      setLoading(false);
    }
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
              <Navigation className="text-blue-400" />AQi Route System
            </h1>
            <p className="text-xs text-zinc-500">Enter start and destination to find the Best Path with good AQi.</p>
          </div>

          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
              <input 
                type="text"
                placeholder="Starting Point"
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
                placeholder="Destination"
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
              className="w-full py-4 bg-blue-500 text-white font-extrabold rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Finding route..." : "Get route"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
