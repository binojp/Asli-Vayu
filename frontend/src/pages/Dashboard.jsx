import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Map, Wind, Navigation, Leaf, ChevronRight, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

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
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
          </motion.div>

          {/* Activity Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6"
          >
            <div className="p-3 bg-blue-500/10 rounded-2xl w-fit">
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Air Quality Index</h3>
              <div className="text-4xl font-bold text-green-400 underline decoration-zinc-800 underline-offset-8">Good</div>
              <p className="mt-4 text-xs text-zinc-500">Based on recent sensors in your area.</p>
            </div>
          </motion.div>

          {/* Info Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <Wind className="w-6 h-6 text-blue-400 mb-4" />
            <h4 className="font-bold mb-1">PM2.5 Levels</h4>
            <div className="text-2xl font-bold text-white">12 µg/m³</div>
            <span className="text-xs text-green-500 font-medium">Safe Level</span>
          </motion.div>

          {/* Info Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <Map className="w-6 h-6 text-purple-400 mb-4" />
            <h4 className="font-bold mb-1">Active Sensors</h4>
            <div className="text-2xl font-bold text-white">142</div>
            <span className="text-xs text-zinc-500 font-medium">Community Partners</span>
          </motion.div>

          {/* Info Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <TrendingDown className="w-6 h-6 text-green-400 mb-4" />
            <h4 className="font-bold mb-1">Emission Saved</h4>
            <div className="text-2xl font-bold text-white">4.2 kg</div>
            <span className="text-xs text-zinc-500 font-medium">This month</span>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
