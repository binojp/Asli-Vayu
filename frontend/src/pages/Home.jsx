import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ChevronRight, User as UserIcon, Leaf, Truck, Wind, MapPin, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useEffect } from 'react';
export default function Home() {
  const navigate = useNavigate();
  const { user, login, register } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    role: 'User',
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  // Define steps based on mode
  const loginSteps = [
    { id: 'email', title: "What's your email?", icon: Mail, field: 'email' },
    { id: 'password', title: "Enter your password", icon: Lock, field: 'password' },
  ];

  const registerSteps = [
    { id: 'role', title: "Who are you?", field: 'role' },
    { id: 'name', title: "What's your name?", icon: UserIcon, field: 'name' },
    { id: 'email', title: "What's your email?", icon: Mail, field: 'email' },
    { id: 'password', title: "Choose a password", icon: Lock, field: 'password' },
  ];

  const steps = mode === 'login' ? loginSteps : registerSteps;
  const stepData = steps[currentStep];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Submit
      if (mode === 'login') {
        if (!formData.email || !formData.password) {
          toast.error('Please fill in all fields');
          return;
        }

        setLoading(true);
        const result = await login({ email: formData.email, password: formData.password });
        setLoading(false);

        if (result.success) {
          toast.success('Welcome back!');
          navigate('/dashboard');
        } else {
          toast.error(result.error || 'Login failed');
        }
      } else {
        // Register
        if (!formData.name || !formData.email || !formData.password) {
          toast.error('Please fill in all fields');
          return;
        }

        setLoading(true);
        const result = await register(formData);
        setLoading(false);

        if (result.success) {
          navigate('/dashboard');
        }
      }
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDotClick = (index) => {
    if (index < currentStep) {
      setCurrentStep(index);
    }
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setCurrentStep(0);
    setFormData({
      role: 'User',
      name: '',
      email: '',
      password: '',
    });
  };

  const canProceed = stepData.id === 'role' || formData[stepData.field]?.trim();

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-5xl z-10 grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side - Project Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Asli Vayu
            </h1>
            <p className="text-xl text-zinc-400">
              Real-time air quality monitoring powered by community data
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Wind className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Live Air Quality Data</h3>
                <p className="text-zinc-500">Monitor AQI levels in real-time across your city</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Green Routes</h3>
                <p className="text-zinc-500">Discover cleaner paths for your daily commute</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrendingDown className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Community Powered</h3>
                <p className="text-zinc-500">Join partners collecting environmental data</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8"
        >
          {/* Mode Switcher */}
          <div className="flex gap-2 mb-8 bg-zinc-800/50 p-1 rounded-xl">
            <button
              onClick={() => handleModeSwitch('login')}
              className={clsx(
                "flex-1 py-3 rounded-lg font-semibold transition-all",
                mode === 'login'
                  ? "bg-green-500 text-white"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              Login
            </button>
            <button
              onClick={() => handleModeSwitch('register')}
              className={clsx(
                "flex-1 py-3 rounded-lg font-semibold transition-all",
                mode === 'register'
                  ? "bg-green-500 text-white"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              Register
            </button>
          </div>

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                {stepData.icon && <stepData.icon className="w-12 h-12 mx-auto text-green-400 mb-4" />}
                <h2 className="text-2xl font-bold">{stepData.title}</h2>
              </div>

              <div>
                {stepData.field === 'role' ? (
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => updateField('role', 'User')}
                      className={clsx(
                        "p-4 rounded-xl border transition-all text-left",
                        formData.role === 'User'
                          ? "border-green-500 bg-green-500/10 text-white"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <Leaf className="w-5 h-5" />
                        <div className="font-bold">User</div>
                      </div>
                      <div className="text-sm text-zinc-500">
                        View air quality data and green routes
                      </div>
                    </button>

                    <button
                      onClick={() => updateField('role', 'Partner')}
                      className={clsx(
                        "p-4 rounded-xl border transition-all text-left",
                        formData.role === 'Partner'
                          ? "border-green-500 bg-green-500/10 text-white"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <Truck className="w-5 h-5" />
                        <div className="font-bold">Partner</div>
                      </div>
                      <div className="text-sm text-zinc-500">
                        Collect environmental data on the move
                      </div>
                    </button>
                  </div>
                ) : (
                  <input
                    type={stepData.field === 'password' ? 'password' : stepData.field === 'email' ? 'email' : 'text'}
                    value={formData[stepData.field]}
                    onChange={(e) => updateField(stepData.field, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && canProceed) {
                        handleNext();
                      }
                    }}
                    placeholder={`Enter your ${stepData.field}`}
                    className="w-full px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-lg focus:outline-none focus:border-green-500 transition-colors"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex space-x-1">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDotClick(idx)}
                      className={clsx(
                        "w-2 h-2 rounded-full transition-all",
                        idx < currentStep
                          ? "bg-green-500 cursor-pointer hover:scale-150"
                          : idx === currentStep
                          ? "bg-green-500"
                          : "bg-zinc-700 cursor-default"
                      )}
                      disabled={idx > currentStep}
                    />
                  ))}
                </div>
                <button
                  onClick={handleNext}
                  disabled={!canProceed || loading}
                  className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
