import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Map, Wind, Navigation, Leaf, ChevronRight, Activity, Bot, CloudRain, TrendingDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [aqiValue, setAqiValue] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);

  useEffect(() => {
    checkHealthWarning();
    fetchMLPrediction();
  }, []);

  const checkHealthWarning = async () => {
    try {
      const { data: profile } = await axios.get('/api/user/profile');
      const { data: sensor } = await axios.get('/api/sensor/latest');
      
      const currentPM = sensor.pm25;
      setAqiValue(currentPM);

      if (profile.sensitivity === 'High' && currentPM > 50) {
        toast.error("Vulnerability Alert: Local AQI is high. Please wear a mask!", { duration: 6000 });
      } else if (currentPM > 100) {
        toast.error("General Health Warning: Air quality is Poor today.");
      }
    } catch (err) {
      console.error("Health check skipped");
    }
  };

  const fetchMLPrediction = async () => {
    try {
      const { data } = await axios.get('/api/sensor/predict');
      setMlPrediction(data.predicted_aqi);
    } catch (err) {
      console.error("ML prediction unavailable");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12">
      <nav className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <Leaf className="w-8 h-8 text-green-400" />
          <span className="text-2xl font-bold tracking-tight">Asli Vayu</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 hidden sm:inline">Hello, <span className="text-white font-medium">{user?.name}</span></span>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto space-y-12">
        <header className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent"
          >
            Environmental Dashboard
          </motion.h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Monitor real-time air quality data and discover eco-friendly travel options.
          </p>
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 w-fit px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Live Real-Time Sync: Kochi Anchor Active</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Feature: Green Routing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 group relative overflow-hidden bg-gradient-to-br from-green-500/20 via-zinc-900 to-zinc-900 border border-green-500/20 rounded-3xl p-8 hover:border-green-500/40 transition-all shadow-2xl shadow-green-500/5"
          >
            <div className="relative z-10 space-y-6">
              <div className="p-3 bg-green-500/10 rounded-2xl w-fit">
                <Navigation className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Green Routing</h3>
                <p className="text-zinc-400">Find the cleanest path to your destination with real-time AQI analysis.</p>
              </div>
              <Link 
                to="/maps"
                className="inline-flex items-center gap-2 bg-green-500 text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
              >
                Go to Maps
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* AI Assistant Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 group hover:border-blue-500/30 transition-all"
          >
            <div className="p-3 bg-blue-500/10 rounded-2xl w-fit">
              <Bot className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Asli Vayu AI</h3>
              <p className="text-zinc-500 text-sm mb-6">Personalized environmental advice and health monitoring based on your profile.</p>
              <Link 
                to="/assistant"
                className="flex items-center gap-2 text-blue-400 font-bold hover:translate-x-1 transition-transform"
              >
                Ask Assistant <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Eco-Governance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 group hover:border-purple-500/30 transition-all"
          >
            <div className="p-3 bg-purple-500/10 rounded-2xl w-fit">
              <CloudRain className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Eco Governance</h3>
              <p className="text-zinc-500 text-sm mb-6">Submit proposals for artificial rain or sensor deployment in your local area.</p>
              <Link 
                to="/admin"
                className="flex items-center gap-2 text-purple-400 font-bold hover:translate-x-1 transition-transform"
              >
                Manage Proposals <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* New feature: Trend Prediction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <TrendingDown className="w-6 h-6 text-red-400 mb-4" />
            <h4 className="font-bold mb-1">Scientific ML Prediction</h4>
            <div className="text-2xl font-bold text-white">
              {mlPrediction ? Math.round(mlPrediction) : "Analysing..."} AQI
            </div>
            <span className="text-xs text-zinc-500 font-medium">Random Forest Model</span>
          </motion.div>

          {/* New feature: Oxygen Levels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <Wind className="w-6 h-6 text-cyan-400 mb-4" />
            <h4 className="font-bold mb-1">Oxygen Density</h4>
            <div className="text-2xl font-bold text-white">20.9%</div>
            <span className="text-xs text-green-500 font-medium">Optimal</span>
          </motion.div>

          {/* New Discover: Green Parks */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-3 bg-gradient-to-r from-emerald-500/10 to-transparent border border-white/5 rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 group"
          >
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="p-3 bg-emerald-500 text-black rounded-2xl">
                  <Leaf className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black italic">Find Your Oasis</h3>
              </div>
              <p className="text-zinc-400 max-w-md">Our algorithm scans nearby recreational areas and ranks them by real-time oxygen levels and lowest AQI. Breathe deep.</p>
            </div>
            <Link 
              to="/maps?action=find-park"
              className="px-10 py-5 bg-white text-black font-black rounded-3xl hover:bg-emerald-400 transition-colors flex items-center gap-3 shadow-xl"
            >
              Locate Greenest Park <ChevronRight />
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
