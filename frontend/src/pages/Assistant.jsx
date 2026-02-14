import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Heart, 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  ArrowLeft,
  Settings,
  Plus,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am Asli Vayu AI. How can I help you with your health and environment today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ conditions: [], sensitivity: 'Moderate', age: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [newCondition, setNewCondition] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/user/profile');
      setProfile(res.data);
    } catch (err) {
      console.error("Profile fetch error");
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: input });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch (err) {
      toast.error("AI Assistant is offline");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updated) => {
    try {
      await axios.put('/api/user/profile', updated);
      setProfile(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    const updated = { ...profile, conditions: [...profile.conditions, newCondition] };
    updateProfile(updated);
    setNewCondition('');
  };

  const removeCondition = (index) => {
    const updated = { ...profile, conditions: profile.conditions.filter((_, i) => i !== index) };
    updateProfile(updated);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <Bot className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Asli Vayu AI</h1>
              <p className="text-xs text-zinc-500 italic">Personalized Health Assistant</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all flex items-center gap-2"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Health Profile</span>
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
            {messages.map((msg, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx}
                className={clsx(
                  "max-w-[80%] p-4 rounded-3xl",
                  msg.role === 'ai' 
                    ? "bg-zinc-900 border border-zinc-800 rounded-tl-none self-start" 
                    : "bg-green-600 text-white rounded-tr-none self-end ml-auto"
                )}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-3xl rounded-tl-none self-start">
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce delay-150" />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="relative group">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input
              type="text"
              placeholder="Ask about your route, health, or air quality..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-green-500/50 transition-all pr-16"
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-green-500 text-black rounded-xl hover:scale-105 transition-transform"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar / Health Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute inset-y-0 right-0 w-full max-w-sm bg-zinc-900/95 backdrop-blur-2xl border-l border-zinc-800 z-30 p-8 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Heart className="text-red-400" />
                  Health Profile
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-800 rounded-full">
                  <X />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm text-zinc-500 block mb-2 font-bold uppercase tracking-wider">Sensitivity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Moderate', 'High'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateProfile({ ...profile, sensitivity: s })}
                        className={clsx(
                          "py-2 rounded-xl border text-sm transition-all",
                          profile.sensitivity === s ? "bg-green-500/20 border-green-500 text-green-400" : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-zinc-500 block mb-2 font-bold uppercase tracking-wider">Conditions</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.conditions.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs flex items-center gap-2">
                        {c}
                        <button onClick={() => removeCondition(i)}><X className="w-3 h-3 hover:text-red-400" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add condition (e.g. Asthma)"
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500"
                    />
                    <button onClick={addCondition} className="p-2 bg-green-500 text-black rounded-xl"><Plus /></button>
                  </div>
                </div>

                <div className="p-6 bg-red-400/5 border border-red-500/20 rounded-3xl">
                  <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                    <ShieldAlert className="w-5 h-5" />
                    Warning Protocol
                  </div>
                  <p className="text-xs text-zinc-400 italic leading-relaxed">
                    Based on your profile, we will alert you when PM2.5 levels exceed your sensitivity threshold.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

