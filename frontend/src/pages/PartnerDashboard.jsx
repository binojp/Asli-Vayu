import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Activity, LayoutDashboard, Database, Settings, ShieldCheck, TrendingUp, Users, Factory, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";

export default function PartnerDashboard() {
  const { user, logout } = useAuth();
  const [liveReadings, setLiveReadings] = useState([]);
  const [stats, setStats] = useState({
    activeSensors: 50,
    dataIntegrity: "99.8%",
    complianceScore: 94,
    marketShare: "4.5%"
  });

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const { data } = await axios.get('/api/sensor/readings');
        setLiveReadings(data.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch live stream");
      }
    };
    fetchReadings();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center mb-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">Partner Portal</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">{user?.role} Entity</p>
          </div>
          <button 
            onClick={logout}
            className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-sm font-bold"
          >
            Terminal Exit
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto space-y-10">
        <section className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter"
          >
            INDUSTRIAL <span className="text-blue-500">INSIGHTS.</span>
          </motion.h1>
          <p className="text-zinc-500 text-lg max-w-xl font-medium">
            Managing environmental governance and industrial compliance for the Kochi Economic Zone.
          </p>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Active Nodes", value: stats.activeSensors, icon: Database, color: "text-blue-400" },
            { label: "Data Integrity", value: stats.dataIntegrity, icon: Activity, color: "text-green-400" },
            { label: "Compliance", value: `${stats.complianceScore}/100`, icon: ShieldCheck, color: "text-purple-400" },
            { label: "Energy Impact", value: stats.marketShare, icon: Zap, color: "text-yellow-400" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-4`} />
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action: Industrial Compliance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 bg-gradient-to-br from-blue-600/20 to-zinc-900 border border-blue-500/20 rounded-[40px] p-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <Factory className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tight mb-4">Carbon Footprint Analysis</h3>
                <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
                  Real-time monitoring of your production facility's impact on the local Kochi biosphere. Review your emission quotas and optimization strategies.
                </p>
              </div>
              <button className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-blue-400 transition-colors shadow-xl">
                Generate Full Report
              </button>
            </div>
          </motion.div>

          {/* Side Module: Fleet Management */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-10 space-y-8 flex flex-col justify-between"
          >
            <div>
              <Users className="w-10 h-10 text-purple-400 mb-6" />
              <h3 className="text-2xl font-black mb-3">Governance Access</h3>
              <p className="text-zinc-500 leading-relaxed">
                Connect with local authorities to coordinate on artificial rain projects or emergency environmental responses.
              </p>
            </div>
            <Link 
              to="/admin"
              className="p-5 bg-zinc-800/50 rounded-2xl text-center font-bold hover:bg-zinc-800 transition-colors"
            >
              Open Governance Terminal
            </Link>
          </motion.div>
        </div>

        {/* Technical Data Stream */}
        <section className="bg-zinc-900/30 border border-zinc-800 rounded-[40px] p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-green-400" />
              <h3 className="text-2xl font-black">Live Sensor Stream</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Link</span>
            </div>
          </div>
          <div className="space-y-4">
            {liveReadings.map((reading, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-xs">#{i+1}</div>
                  <div>
                    <p className="font-bold">Kochi Node {Math.floor(reading.lat * 100)} - {reading.lat.toFixed(4)}, {reading.lon.toFixed(4)}</p>
                    <p className="text-xs text-zinc-600 font-medium">PM2.5: {reading.pm25} µg/m³ • Live Reading</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-400">OPERATIONAL</p>
                  <p className="text-xs text-zinc-600 uppercase tracking-widest">Secure Handshake</p>
                </div>
              </div>
            ))}
            {liveReadings.length === 0 && <p className="text-zinc-500 text-center py-4">Synchronizing with sensor network...</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
