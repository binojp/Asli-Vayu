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
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-[#050505] text-white font-sans p-8">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all">
            <ArrowLeft />
          </Link>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter">Eco-Governance</h1>
            <p className="text-zinc-500">Contract Invitations & Infrastructure Management</p>
          </div>
        </div>

        <div className="flex gap-4">
          <StatCard label="Pending" value={stats.pending} color="text-yellow-400" />
          <StatCard label="Accepted" value={stats.accepted} color="text-green-400" />
          <button 
            onClick={() => setShowForm(true)}
            className="px-8 py-4 bg-green-500 text-black font-bold rounded-3xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 w-full max-w-xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FileText className="text-green-400" />
                  Submit Initiative
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-800 rounded-full">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Proposal Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Artificial Rain in Rohini"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-green-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Initiative Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-green-500 transition-all appearance-none"
                  >
                    <option>Artificial Rain</option>
                    <option>Sensor Installation</option>
                    <option>Afforestation</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Detailed Description</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe the impact and requirements..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-green-500 transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-green-500 text-black font-extrabold rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Confirm Submission
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-green-400" />
              Filter Proposals
            </h3>
            <div className="space-y-2">
              {['All', 'Artificial Rain', 'Sensor Installation', 'Afforestation'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "w-full text-left px-4 py-3 rounded-xl transition-all border",
                    filter === f ? "bg-green-500/10 border-green-500/50 text-green-400" : "bg-transparent border-transparent text-zinc-500 hover:bg-zinc-800"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-white/5 rounded-3xl">
            <h4 className="font-bold mb-2">Smart Contracts Info</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Accepting a proposal automatically triggers the resource allocation protocol and notifies the relevant agencies.
            </p>
          </div>
        </div>

        {/* Catalog */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="flex justify-center p-20 text-zinc-500">Loading catalog...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500">
              No proposals found for the selected category.
            </div>
          ) : (
            filtered.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item._id}
                className="group bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-6 rounded-3xl transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className={clsx(
                      "p-4 rounded-2xl",
                      item.type === 'Artificial Rain' ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                    )}>
                      {item.type === 'Artificial Rain' ? <CloudRain className="w-8 h-8" /> : <Building className="w-8 h-8" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold">{item.title}</h3>
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          item.status === 'Pending' ? "bg-yellow-500/10 text-yellow-400" : 
                          item.status === 'Accepted' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.submittedBy?.name || 'Anonymous'}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location?.address || 'Citywide'}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {item.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {item.status === 'Pending' && (user?.role === 'Admin' || user?.role === 'Partner') && (
                      <>
                        <button 
                          onClick={() => updateStatus(item._id, 'Accepted')}
                          className="flex-1 md:flex-none px-6 py-3 bg-green-500 text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" /> Accept
                        </button>
                        <button 
                          onClick={() => updateStatus(item._id, 'Rejected')}
                          className="flex-1 md:flex-none px-6 py-3 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" /> Deny
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-zinc-800/50">
                  <p className="text-sm text-zinc-400 leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all">
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
    <div className="bg-zinc-900 border border-zinc-800 px-8 py-4 rounded-3xl min-w-[140px]">
      <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">{label}</div>
      <div className={clsx("text-3xl font-black", color)}>{value}</div>
    </div>
  );
}

function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}
