import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  ArrowLeft, 
  Search, 
  Leaf, 
  Info, 
  CheckCircle2, 
  Activity,
  Trees,
  Wind
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Parks() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bestPark, setBestPark] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(false);
    try {
      // 1. Geocode the location
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { q: query, format: 'json', limit: 1 }
      });

      if (!geoRes.data.length) {
        toast.error("Location not found");
        return;
      }

      const { lat, lon } = geoRes.data[0];

      // 2. Fetch parks with AQI from our backend
      const res = await axios.post('/api/sensor/park', { 
        lat: parseFloat(lat), 
        lon: parseFloat(lon) 
      });

      const parks = res.data.parks || [];
      setResults(parks);
      
      if (parks.length > 0) {
        setBestPark(parks[0]); // Backend already sorts by lowest AQI
        toast.success(`Found ${parks.length} clean zones!`);
      } else {
        setBestPark(null);
        toast.error("No parks found in this area");
      }
      setSearched(true);
    } catch (err) {
      toast.error("Failed to fetch green zones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 md:p-12 font-sans selection:bg-green-500/30 overflow-x-hidden">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/dashboard" className="p-2 sm:p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all group shrink-0">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter flex items-center gap-2 md:gap-3">
              <Trees className="text-green-400 w-6 h-6 sm:w-8 sm:h-8" />
              Green Oasis Finder
            </h1>
            <p className="text-xs sm:text-base text-zinc-500 font-medium">Discover the cleanest air zones in your city</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Search Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-4 sm:p-8 rounded-[30px] sm:rounded-[40px] mb-8 md:mb-12 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSearch} className="relative flex flex-col sm:block">
            <Search className="hidden sm:block absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 w-6 h-6" />
            <input 
              type="text" 
              placeholder="Where are you? (e.g. Kochi...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl py-4 sm:py-6 pl-4 sm:pl-16 pr-4 sm:pr-32 focus:outline-none focus:border-green-500/50 transition-all text-base sm:text-lg font-medium shadow-inner"
            />
            <button 
              disabled={loading}
              type="submit"
              className="mt-3 sm:mt-0 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2 bg-green-500 text-black px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-bold hover:scale-105 active:scale-95 disabled:opacity-50 transition-all text-sm sm:text-base"
            >
              {loading ? "Searching..." : "Find Parks"}
            </button>
          </form>
        </section>

        {/* Results Section */}
        <div className="space-y-6 sm:space-y-8">
          {searched && results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-gradient-to-br from-green-500/20 via-zinc-900 to-zinc-900 border border-green-500/30 rounded-[30px] sm:rounded-[40px] p-6 sm:p-10 shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10">
                <Leaf className="w-20 h-20 sm:w-32 sm:h-32 text-green-400" />
              </div>
              
              <div className="relative z-10 space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 bg-green-500 text-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> Recommended Oasis
                </div>
                
                <div>
                  <h2 className="text-3xl sm:text-5xl font-black mb-2 tracking-tighter leading-tight">{bestPark.name}</h2>
                  <p className="text-xs sm:text-base text-zinc-400 flex items-center gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {bestPark.address}
                  </p>
                </div>

                <div className="flex flex-wrap gap-6 sm:gap-8 py-2 sm:py-4">
                  <div className="space-y-1">
                    <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Real-Time AQI</span>
                    <div className="text-3xl sm:text-4xl font-black text-green-400 flex items-baseline gap-1">
                      {Math.round(bestPark.aqi)}
                      <span className="text-[10px] sm:text-sm font-medium text-zinc-600 uppercase">Index</span>
                    </div>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-zinc-800 self-center"></div>
                  <div className="space-y-1">
                    <span className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Air Purity</span>
                    <div className="text-3xl sm:text-4xl font-black text-white">94%</div>
                  </div>
                </div>

                <div className="pt-2 sm:pt-4">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${bestPark.lat},${bestPark.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full sm:w-auto text-center bg-white text-black px-8 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:scale-105 transition-all shadow-xl text-sm sm:text-base"
                  >
                    Get Directions
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <AnimatePresence>
              {results.slice(1).map((park, idx) => (
                <motion.div 
                   key={idx}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: idx * 0.1 }}
                   className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl hover:border-zinc-700 transition-all group"
                 >
                   <div className="flex justify-between items-start mb-3 sm:mb-4">
                     <div className="p-2 sm:p-3 bg-zinc-950 rounded-xl sm:rounded-2xl border border-zinc-800 group-hover:border-green-500/30 transition-all">
                       <Wind className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 group-hover:text-green-400" />
                     </div>
                     <div className={clsx(
                       "px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest border",
                       park.aqi < 50 ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                     )}>
                       AQI {Math.round(park.aqi)}
                     </div>
                   </div>
                   <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">{park.name}</h3>
                   <p className="text-[10px] sm:text-xs text-zinc-500 mb-4 sm:mb-6 flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3 h-3" /> {park.address}
                   </p>
                   <a 
                     href={`https://www.google.com/maps/dir/?api=1&destination=${park.lat},${park.lon}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 text-xs sm:text-sm font-bold text-green-400 hover:gap-3 transition-all"
                   >
                     Navigate <ArrowLeft className="rotate-180 w-3 h-3 sm:w-4 sm:h-4" />
                   </a>
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>
 
           {searched && results.length === 0 && !loading && (
             <div className="text-center py-12 sm:py-20 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-[30px] sm:rounded-[40px] px-4">
               <div className="p-3 sm:p-4 bg-zinc-900 rounded-full w-fit mx-auto mb-4">
                 <Trees className="w-8 h-8 sm:w-12 sm:h-12 text-zinc-700" />
               </div>
               <h3 className="text-lg sm:text-xl font-bold text-zinc-400">No Clean Zones Detected</h3>
               <p className="text-xs sm:text-base text-zinc-500">Try searching for a different area or city.</p>
             </div>
           )}
         </div>
       </main>
     </div>
  );
}
