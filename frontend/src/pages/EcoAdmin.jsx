import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudRain, 
  MapPin, 
  FileText, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Filter,
  Users,
  Building,
  Plus,
  X,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function EcoAdmin() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [stats, setStats] = useState({ pending: 0, accepted: 0, total: 0 });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'Artificial Rain' });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await axios.get('/api/user/proposals');
      setProposals(res.data);
      const s = res.data.reduce((acc, p) => {
        acc.total++;
        if (p.status === 'Pending') acc.pending++;
        if (p.status === 'Accepted') acc.accepted++;
        return acc;
      }, { pending: 0, accepted: 0, total: 0 });
      setStats(s);
    } catch (err) {
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/user/proposals', formData);
      toast.success("Proposal submitted");
      setShowForm(false);
      setFormData({ title: '', description: '', type: 'Artificial Rain' });
      fetchProposals();
    } catch (err) {
      toast.error("Submission failed");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/user/proposals/${id}`, { status });
      toast.success(`Proposal ${status}`);
      fetchProposals();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const filtered = proposals.filter(p => filter === 'All' || p.type === filter);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-4 sm:p-8">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/dashboard" className="p-2 sm:p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tighter">Eco-Governance</h1>
            <p className="text-xs sm:text-base text-zinc-500">Contract Invitations & Infrastructure Management</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
          <div className="grid grid-cols-2 gap-4 flex-1 xl:flex-none">
            <StatCard label="Pending" value={stats.pending} color="text-yellow-400" />
            <StatCard label="Accepted" value={stats.accepted} color="text-green-400" />
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-green-500 text-black font-bold rounded-2xl sm:rounded-3xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Proposal
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[30px] sm:rounded-[40px] p-6 sm:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                  <FileText className="text-green-400" />
                  Submit Initiative
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-800 rounded-full">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase mb-2 block">Proposal Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Artificial Rain in Rohini"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:border-green-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase mb-2 block">Initiative Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:border-green-500 transition-all appearance-none text-sm sm:text-base"
                  >
                    <option>Artificial Rain</option>
                    <option>Sensor Installation</option>
                    <option>Afforestation</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase mb-2 block">Detailed Description</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe the impact and requirements..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:border-green-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 sm:py-5 bg-green-500 text-black font-extrabold rounded-xl sm:rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all text-sm sm:text-base"
                >
                  Confirm Submission
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-green-400" />
              Filter Proposals
            </h3>
            <div className="flex flex-wrap xl:flex-col gap-2">
              {['All', 'Artificial Rain', 'Sensor Installation', 'Afforestation'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "flex-1 xl:w-full text-left px-4 py-3 rounded-xl transition-all border text-sm sm:text-base",
                    filter === f ? "bg-green-500/10 border-green-500/50 text-green-400" : "bg-transparent border-transparent text-zinc-500 hover:bg-zinc-800"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-white/5 rounded-3xl hidden xl:block">
            <h4 className="font-bold mb-2">Smart Contracts Info</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Accepting a proposal automatically triggers the resource allocation protocol and notifies the relevant agencies.
            </p>
          </div>
        </div>

        {/* Catalog */}
        <div className="xl:col-span-3 space-y-4">
          {loading ? (
            <div className="flex justify-center p-20 text-zinc-500">Loading catalog...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center text-zinc-500">
              No proposals found for the selected category.
            </div>
          ) : (
            filtered.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item._id}
                className="group bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-4 sm:p-6 rounded-3xl transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    <div className={clsx(
                      "p-3 sm:p-4 rounded-2xl shrink-0",
                      item.type === 'Artificial Rain' ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                    )}>
                      {item.type === 'Artificial Rain' ? <CloudRain className="w-6 h-6 sm:w-8 sm:h-8" /> : <Building className="w-6 h-6 sm:w-8 sm:h-8" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                        <h3 className="text-lg sm:text-xl font-bold truncate max-w-[200px] sm:max-w-none">{item.title}</h3>
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold uppercase",
                          item.status === 'Pending' ? "bg-yellow-500/10 text-yellow-400" : 
                          item.status === 'Accepted' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.submittedBy?.name || 'Anonymous'}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location?.address || 'Citywide'}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {item.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto">
                    <button 
                      onClick={async () => {
                        try {
                          const res = await axios.post('/api/sensor/zoning-analysis', { lat: item.location?.lat, lon: item.location?.lon });
                          toast((t) => (
                            <div className="space-y-2">
                              <div className="font-bold flex items-center gap-2">
                                <Activity className={clsx("w-4 h-4", res.data.color === 'green' ? "text-green-400" : res.data.color === 'red' ? "text-red-400" : "text-yellow-400")} />
                                ML Sustainability Decision: {res.data.decision}
                              </div>
                              <p className="text-xs text-zinc-400">{res.data.reason}</p>
                              <button onClick={() => toast.dismiss(t.id)} className="text-[10px] text-zinc-500 uppercase font-bold hover:text-white">Close Analysis</button>
                            </div>
                          ), { duration: 8000, style: { background: '#18181b', color: '#fff', border: '1px solid #27272a', borderRadius: '1rem' } });
                        } catch (e) {
                          toast.error("Analysis engine unavailable");
                        }
                      }}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl sm:rounded-2xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5" /> Analyze
                    </button>

                    {item.status === 'Pending' && (user?.role === 'Admin' || user?.role === 'Partner') && (
                      <div className="flex gap-2 flex-1 sm:flex-none">
                        <button 
                          onClick={() => updateStatus(item._id, 'Accepted')}
                          className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-green-500 text-black font-bold rounded-xl sm:rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Accept
                        </button>
                        <button 
                          onClick={() => updateStatus(item._id, 'Rejected')}
                          className="flex-1 sm:sm-none px-4 sm:px-6 py-2 sm:py-3 bg-zinc-800 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Deny
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-800/50">
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all">
                    "{item.description}"
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl min-w-0 flex-1 sm:min-w-[140px]">
      <div className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1 truncate">{label}</div>
      <div className={clsx("text-xl sm:text-3xl font-black", color)}>{value}</div>
    </div>
  );
}
