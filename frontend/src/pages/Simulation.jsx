import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Wind, 
  ShieldAlert, 
  HeartPulse, 
  Activity, 
  Timer,
  ChevronRight,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";

// Lung Image Component (Responsive & Interactive)
const LungVisualizer = ({ pm25, routeName }) => {
  const capacity = Math.max(10, 100 - (pm25 / 4));
  
  // Dynamic CSS Filters based on PM2.5
  // Healthy: Pinkish/Bright
  // Bad: Dark/Grayscale/Murky
  const filters = {
    grayscale: Math.min(100, (pm25 / 2)) + "%",
    brightness: Math.max(20, 100 - (pm25 / 3)) + "%",
    sepia: Math.min(80, (pm25 / 4)) + "%",
    hueRotate: pm25 > 100 ? "320deg" : "0deg",
    blur: pm25 > 150 ? "1px" : "0px"
  };

  const scale = 0.95 + (Math.sin(Date.now() / 1000) * 0.05); // Simplified breath scale

  return (
    <div className="relative flex flex-col items-center justify-center py-6 sm:py-10">
      {/* Capacity Progress Bar - Mobile Optimized */}
      <div className="w-full max-w-[280px] h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 mb-8 relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${capacity}%` }}
          className={clsx(
            "h-full transition-all duration-1000",
            capacity > 80 ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : 
            capacity > 50 ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]" : 
            "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[7px] sm:text-[9px] font-black uppercase text-white tracking-widest drop-shadow-md">
              Bio-Efficiency: {Math.round(capacity)}%
            </span>
        </div>
      </div>

      {/* Realistic Lung Image with Filters */}
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80">
        
        {/* Particle Overlay for Bad Air */}
        {pm25 > 100 && (
          <div className="absolute flex items-center justify-center inset-0 pointer-events-none overflow-hidden rounded-full">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "100%", x: Math.random() * 100 + "%", opacity: 0 }}
                animate={{ y: "-20%", opacity: [0, 0.5, 0] }}
                transition={{ repeat: Infinity, duration: Math.random() * 2 + 1, delay: Math.random() * 2 }}
                className="w-1 h-1  bg-zinc-400 rounded-full blur-[1px]"
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="text-center mt-6 sm:mt-8">
        <h3 className={clsx(
          "text-4xl sm:text-6xl font-black italic tracking-tighter mb-1",
          capacity > 80 ? "text-green-500" : capacity > 50 ? "text-yellow-500" : "text-red-500"
        )}>
          {capacity > 80 ? "OPTIMAL" : capacity > 50 ? "STRESSED" : "HAZARD"}
        </h3>
        <p className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">{routeName}</p>
      </div>
    </div>
  );
};

export default function Simulation() {
  const [selectedRoute, setSelectedRoute] = useState("Standard");
  const [userProfile] = useState({ hasAsthma: true });

  const routes = {
    Standard: {
      name: "NH-66 Highway",
      distance: 12.4,
      avgSpeed: 25,
      pm25: 195,
      desc: "Industrial corridor with extreme particulate accumulation.",
      color: "red"
    },
    Green: {
      name: "Coastal Greenway",
      distance: 14.8,
      avgSpeed: 22,
      pm25: 12,
      desc: "Mangrove-filtered air with low traffic density.",
      color: "green"
    }
  };

  const current = routes[selectedRoute];
  const travelTime = Math.round((current.distance / current.avgSpeed) * 60);
  const exposureDose = ((current.distance / current.avgSpeed) * current.pm25).toFixed(2);

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 sm:p-8 md:p-12 font-sans overflow-x-hidden selection:bg-red-500/30">
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 md:mb-20">
        <Link to="/dashboard" className="p-2 sm:p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all flex items-center gap-2 sm:gap-3 font-bold group text-xs sm:text-sm">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Exit Simulation</span>
        </Link>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <h1 className="text-xl sm:text-3xl font-black tracking-tighter italic uppercase">Exposure Terminal</h1>
          <p className="text-zinc-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 sm:justify-end">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live Biometric Sync • v4.8
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        
        {/* Simulation Bay - Responsive Grid */}
        <div className="col-span-1 lg:col-span-8 space-y-6 sm:space-y-10">
          <section className="bg-zinc-950/50 border border-zinc-900 rounded-[30px] sm:rounded-[50px] p-6 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Wind className="w-48 h-48 sm:w-80 sm:h-80" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
              {/* Image Lung & Scale */}
              <LungVisualizer pm25={current.pm25} routeName={current.name} />

              <div className="space-y-6 sm:space-y-10">
                <div className="bg-zinc-900/40 border border-zinc-800 p-6 sm:p-10 rounded-[30px] sm:rounded-[40px] space-y-6 sm:space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <span className="text-zinc-500 font-black uppercase text-[8px] sm:text-[10px] tracking-widest">Selected Route</span>
                         <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
                            {Object.keys(routes).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedRoute(key)}
                                    className={clsx(
                                        "flex-1 sm:flex-none px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                                        selectedRoute === key ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    {key}
                                </button>
                            ))}
                         </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">{current.name}</h2>
                        <p className="text-zinc-500 text-xs sm:text-sm italic font-medium leading-relaxed">"{current.desc}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-6">
                        <div className="bg-zinc-950/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800">
                            <p className="text-[7px] sm:text-[9px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Air Density</p>
                            <p className={clsx("text-xl sm:text-3xl font-black", current.color === 'red' ? "text-red-500" : "text-green-500")}>
                                {current.pm25}<span className="text-[9px] sm:text-[11px] text-zinc-700 ml-1 font-bold">AQI</span>
                            </p>
                        </div>
                        <div className="bg-zinc-950/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800">
                            <p className="text-[7px] sm:text-[9px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Route Length</p>
                            <p className="text-xl sm:text-3xl font-black">{current.distance}<span className="text-[9px] sm:text-[11px] text-zinc-700 ml-1 font-bold">KM</span></p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-10 px-2 sm:px-6">
                    <div className="w-full sm:flex-1 space-y-2">
                        <div className="flex justify-between items-center text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                          <span>Toxic Accumulation</span>
                          <span className={clsx(current.color === 'red' ? "text-red-500" : "text-green-500")}>
                            {current.color === 'red' ? "Critical" : "Safe"}
                          </span>
                        </div>
                        <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (current.pm25/200)*100)}%` }}
                                className={clsx("h-full transition-all duration-1000 bg-gradient-to-r", 
                                  current.color === 'red' ? "from-red-600 to-red-400" : "from-green-600 to-green-400"
                                )}
                            />
                        </div>
                    </div>
                    <div className="text-center sm:text-right shrink-0">
                        <p className="text-2xl sm:text-4xl font-black italic tracking-tighter">{exposureDose}µg</p>
                        <p className="text-[7px] sm:text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Particulate Intake</p>
                    </div>
                </div>
              </div>
            </div>
          </section>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
             {[
               { label: "Transit Time", val: `${travelTime} MINS`, icon: Timer, color: "text-zinc-400" },
               { label: "Lung Stress", val: current.color === 'red' ? "+18%" : "-3%", icon: Activity, color: current.color === 'red' ? "text-red-500" : "text-green-500" },
               { label: "Safety Tier", val: current.color === 'red' ? "HAZARD" : "CLEAN", icon: ShieldAlert, color: current.color === 'red' ? "text-red-500" : "text-green-500" }
             ].map((stat, i) => (
               <div key={i} className="bg-zinc-900/30 border border-zinc-900 p-6 sm:p-8 rounded-[30px] sm:rounded-[40px] flex items-center justify-between group hover:border-zinc-700 transition-colors">
                  <div>
                     <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                     <p className={clsx("text-xl sm:text-2xl font-black italic", stat.color)}>{stat.val}</p>
                  </div>
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-800 group-hover:text-zinc-400 transition-all opacity-50 group-hover:opacity-100" />
               </div>
             ))}
          </div>
        </div>

        {/* Sidebar Console - Health Logic */}
        <aside className="col-span-1 lg:col-span-4 space-y-6 sm:space-y-8">
            <section className="bg-white text-black p-8 sm:p-12 rounded-[40px] sm:rounded-[50px] space-y-8 shadow-[0_40px_100px_-20px_rgba(255,255,255,0.05)] cursor-default">
                <div className="flex items-center gap-4">
                    <HeartPulse className="w-5 h-5 sm:w-7 sm:h-7 text-red-600 animate-pulse" />
                    <h3 className="text-lg sm:text-xl font-black tracking-tighter uppercase italic">Bio-Impact Ledger</h3>
                </div>
                
                <div className="space-y-6">
                    <div className="p-5 sm:p-6 bg-zinc-100 rounded-[30px] space-y-4 border border-zinc-200">
                        <div className="flex justify-between items-center font-black uppercase text-[8px] sm:text-[10px]">
                            <span className="text-zinc-500">Clinical Status</span>
                            <span className={clsx(current.color === 'red' ? "text-red-600" : "text-green-600")}>
                                {current.color === 'red' ? "Alert" : "Verified"}
                            </span>
                        </div>
                        <p className="font-bold text-sm sm:text-base tracking-tight leading-snug">
                          {current.color === 'red' 
                            ? "⚠️ Multiple PM2.5 threshold breaches detected. Lung lining inflammation risk is high." 
                            : "Biological exposure is within WHO-recommended safety parameters."}
                        </p>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-zinc-200">
                        <p className="text-[8px] sm:text-[10px] font-black uppercase text-zinc-400 tracking-widest">Protocol Safeguards</p>
                        <ul className="space-y-4">
                          {[
                            "Activate vehicle recycling mode",
                            current.color === 'red' ? "Deploy N95 respiratory barrier" : "Optimize aerobic breathing",
                            "Review pulmonary data post-trip"
                          ].map((p, i) => (
                            <li key={i} className="flex gap-4 text-xs sm:text-sm font-bold leading-tight group">
                                <div className={clsx("w-2 h-2 rounded-full mt-1 shrink-0", current.color === 'red' ? "bg-red-500" : "bg-green-500")} />
                                <span className="group-hover:translate-x-1 transition-transform">{p}</span>
                            </li>
                          ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="bg-zinc-900 border border-zinc-800 p-8 sm:p-12 rounded-[40px] sm:rounded-[50px] relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-all duration-700">
                    <Info className="w-40 h-40" />
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500">Sensitivity Analysis</h4>
                    </div>
                    <p className="text-zinc-400 text-xs sm:text-sm font-medium leading-relaxed">
                        User profile indicates <span className="text-white font-bold">Asthma Sensitivity</span>. 
                        Safe PM2.5 intake limit for your profile is strictly <span className="italic">12.5µg/trip</span>.
                    </p>
                    <button className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                        Audit Health History <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </section>
        </aside>

      </main>
    </div>
  );
}
