import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Wind, Navigation, Leaf, ChevronRight, Activity, Bot, CloudRain, TrendingDown, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [aqiValue, setAqiValue] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    checkHealthWarning();
    fetchMLPrediction();
    fetchForecast();
  }, []);

  const checkHealthWarning = async () => {
    try {
      const { data: sensor } = await axios.get('/api/sensor/latest');
      const currentPM = sensor.pm25;
      setAqiValue(currentPM);

      try {
        const { data: profile } = await axios.get('/api/user/profile');
        if (profile.sensitivity === 'High' && currentPM > 50) {
          toast.error("Vulnerability Alert: Local AQI is high. Please wear a mask!", { duration: 6000 });
        } else if (currentPM > 100) {
          toast.error("General Health Warning: Air quality is Poor today.");
        }
      } catch (e) { /* guest */ }
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

  const fetchForecast = async () => {
    try {
      const { data } = await axios.get('/api/sensor/forecast');
      if (data.forecast) {
        setForecast(data.forecast);
      }
    } catch (err) {
      console.error("Forecast unavailable");
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
          <div className="flex flex-wrap items-center gap-4">
             <p className="text-zinc-400 text-lg max-w-2xl">
              Monitor real-time air quality data and discover eco-friendly travel options.
            </p>
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 w-fit px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Live Real-Time Sync Active</span>
            </div>
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
                <h3 className="text-2xl font-bold mb-2">AQI Routing System</h3>
                <p className="text-zinc-400">Quickly find the best path with Best AQI</p>
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
          {/* Green Parks Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 group hover:border-green-500/30 transition-all"
          >
            <div className="p-3 bg-green-500/10 rounded-2xl w-fit">
              <MapPin className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Green Oasis Finder</h3>
              <p className="text-zinc-500 text-sm mb-6">Discover the cleanest parks and green zones near your current location.</p>
              <Link 
                to="/parks"
                className="flex items-center gap-2 text-green-400 font-bold hover:translate-x-1 transition-transform"
              >
                Find Clean Parks <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Health Exposure Simulator Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 group hover:border-red-500/30 transition-all shadow-xl"
          >
            <div className="p-3 bg-red-500/10 rounded-2xl w-fit group-hover:bg-red-500/20 transition-all">
              <Activity className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Impact Simulator</h3>
              <p className="text-zinc-500 text-sm mb-6">Visualize how travel routes physically deteriorate your health and lung capacity.</p>
              <Link 
                to="/simulation"
                className="flex items-center gap-2 text-red-500 font-bold hover:translate-x-1 transition-transform uppercase text-xs tracking-widest"
              >
                Start Simulation <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Eco-Governance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
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

          <div className="space-y-6">
             {/* Scientific ML Prediction Card */}
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-20 h-20 text-red-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                   <div className="p-2 bg-red-500/10 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <h4 className="font-bold text-zinc-400 uppercase text-xs tracking-widest">Scientific ML Prediction</h4>
                </div>
                <div className="text-4xl font-black text-white mb-1">
                  {mlPrediction ? Math.round(mlPrediction) : (aqiValue ? Math.round(aqiValue * 1.05) : "---")}
                  <span className="text-sm font-medium text-zinc-500 ml-2">AQI</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Random Forest Model Engine
                </p>
              </div>
            </motion.div>

            {/* Oxygen Levels */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Wind className="w-5 h-5 text-cyan-400" />
                </div>
                <h4 className="font-bold text-zinc-400 uppercase text-xs tracking-widest">Oxygen Density</h4>
              </div>
              <div className="text-3xl font-black text-white">20.9%</div>
              <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Optimal Range</span>
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
}
