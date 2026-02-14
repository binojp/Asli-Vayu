import { motion } from "framer-motion";
import { Activity, Database, ShieldCheck, Zap, History, Send, Beaker } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function PartnerDashboard() {
  const { user, logout } = useAuth();
  const [liveReadings, setLiveReadings] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Input state for the "Statistic Card"
  const [inputs, setInputs] = useState({
    pm25: 45,
    pm10: 80,
    no2: 24,
    so2: 12,
    co: 1.5,
    o3: 35
  });

  useEffect(() => {
    fetchReadings();
    const interval = setInterval(fetchReadings, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchReadings = async () => {
    try {
      const { data } = await axios.get('/api/sensor/partner-readings');
      setLiveReadings(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch (err) {
      console.error("Live stream unavailable");
    }
  };

  const handleAudit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.get('/api/sensor/predict', { params: inputs });
      setPrediction(data.predicted_aqi);
      toast.success("Industrial Audit Complete");
    } catch (err) {
      toast.error("Prediction engine offline");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 sm:p-6 md:p-12 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="flex justify-between items-center mb-10 sm:mb-16 max-w-5xl mx-auto gap-4">
        <div className="flex items-center gap-2 sm:gap-3 group">
          <div className="p-2 sm:p-2.5 bg-blue-600 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-sm sm:text-xl font-black tracking-tighter uppercase whitespace-nowrap">Partner Terminal</span>
        </div>
        <button 
          onClick={logout}
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all text-[10px] sm:text-sm font-black uppercase tracking-widest"
        >
          Exit
        </button>
      </nav>

      <main className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
        {/* Title Section */}
        <section className="text-center space-y-3 sm:space-y-4">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-tight"
          >
            Partner <span className="text-blue-600">Dashboard.</span>
          </motion.h1>
          <p className="text-zinc-500 text-sm sm:text-lg font-medium px-4">Verify your facility's environmental compliance metrics.</p>
        </section>

        {/* The "Statistic Card" as Input - Responsive Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-[30px] sm:rounded-[40px] p-6 sm:p-8 md:p-12 backdrop-blur-xl shadow-2xl space-y-6 sm:space-y-10"
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-xl sm:rounded-2xl">
              <Beaker className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Pollutant Metrics</h2>
              <p className="text-[9px] sm:text-xs text-zinc-500 font-bold uppercase">Simulate Industrial Impact</p>
            </div>
          </div>

          <form onSubmit={handleAudit} className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {Object.keys(inputs).map((key) => (
              <div key={key} className="space-y-1.5 sm:space-y-2">
                <label className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{key}</label>
                <input 
                  type="number"
                  step="0.01"
                  value={inputs[key]}
                  onChange={(e) => setInputs({...inputs, [key]: parseFloat(e.target.value)})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-blue-400 shadow-inner text-sm sm:text-base"
                />
              </div>
            ))}
            
            <div className="col-span-2 md:col-span-3 pt-4 sm:pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-black py-4 sm:py-5 rounded-xl sm:rounded-[2rem] font-black text-lg sm:text-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-xl order-2 sm:order-1"
              >
                {loading ? "Calculating..." : <><Send className="w-5 h-5 sm:w-6 sm:h-6" /> Run Audit Prediction</>}
              </button>
              
              {prediction !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-blue-600 px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-[2rem] text-center shadow-lg shadow-blue-500/40 order-1 sm:order-2"
                >
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter opacity-80 whitespace-nowrap">Predicted AQI</p>
                  <p className="text-2xl sm:text-4xl font-black">{Math.round(prediction)}</p>
                </motion.div>
              )}
            </div>
          </form>
        </motion.div>

        {/* History Section - Responsive List */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between px-2 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
              <h3 className="text-lg sm:text-xl font-black tracking-tight">Data History</h3>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[8px] sm:text-[10px] font-bold text-zinc-600 uppercase tracking-widest whitespace-nowrap">Live Archive</span>
            </div>
          </div>

          <div className="space-y-3">
            {liveReadings.map((reading, i) => (
              <motion.div 
                key={reading._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl sm:rounded-3xl hover:border-zinc-700 transition-all gap-4"
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-950 rounded-xl sm:rounded-2xl flex items-center justify-center border border-zinc-800 font-black text-zinc-500 text-xs sm:text-base shrink-0">
                    {i+1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 overflow-hidden">
                      <p className="font-bold text-white uppercase text-[10px] sm:text-xs tracking-tight truncate">Node {reading.deviceId || 'IND-01'}</p>
                      <span className="text-[7px] sm:text-[10px] bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded-full text-zinc-400 font-bold tracking-tighter shrink-0">Verified</span>
                    </div>
                    <p className="text-[9px] sm:text-xs text-zinc-500 font-medium font-mono line-clamp-1">
                      PM2.5: <span className="text-blue-400">{reading.pm25 ?? '—'}</span> • 
                      O₂: <span className="text-green-400">{reading.oxygen ?? '—'}%</span> • 
                      {reading.temp ?? '—'}°C
                    </p>
                  </div>
                </div>
                <div className="flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 border-zinc-800/50 pt-3 sm:pt-0 shrink-0">
                  <p className="text-xs sm:text-sm font-black text-zinc-400">
                    {reading.timestamp ? new Date(reading.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Logged UTC</p>
                </div>
              </motion.div>
            ))}
            
            {liveReadings.length === 0 && (
              <div className="py-10 sm:py-20 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl sm:rounded-[3rem]">
                <Database className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-[8px] sm:text-xs px-4">Awaiting Industrial Uplink...</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
