import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Brain, Users, Mail, Lock, User, Loader } from 'lucide-react';
import OTPVerification from './OTPVerification';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);

  const navigate = useNavigate();
  const { login, verifyAndRegister, sendOTP } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/lobby');
      } else {
        await sendOTP(formData.email);
        setPendingRegistration({ username: formData.username, email: formData.email, password: formData.password });
        setShowOTP(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otp) => {
    setError('');
    setLoading(true);
    try {
      await verifyAndRegister(pendingRegistration.email, otp, pendingRegistration.username, pendingRegistration.password);
      navigate('/lobby');
    } catch (err) {
      console.error('OTP verify/register error:', err);
      setError(err.response?.data?.error || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, color: 'from-blue-500 to-cyan-500', title: 'Intelligent Clustering', desc: 'AI automatically groups similar ideas into themes' },
    { icon: Users, color: 'from-purple-500 to-pink-500', title: 'Real-Time Collaboration', desc: 'Brainstorm together with live updates' },
    { icon: Brain, color: 'from-green-500 to-emerald-500', title: 'AI Assistance', desc: 'Generate ideas, detect duplicates, and create summaries' },
  ];

  return (
    <div className="min-h-screen bg-animated-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="absolute top-4 right-4 z-10">
        <DarkModeToggle />
      </div>

      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 relative z-10">
        {/* Left - Features */}
        <div className="flex flex-col justify-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow-purple">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white font-heading tracking-tight">MindQuest</h1>
                <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">AI-Powered Brainstorming</p>
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
              Transform your team's creativity with intelligent collaboration tools powered by AI.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f, idx) => (
              <div
                key={f.title}
                className="flex items-start space-x-4 animate-fade-in"
                style={{ animationDelay: `${(idx + 1) * 150}ms` }}
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3 text-sm text-gray-400 dark:text-gray-500">
            <div className="flex -space-x-2">
              {['A', 'B', 'C', 'D'].map((l, i) => (
                <div key={l} className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold">
                  {l}
                </div>
              ))}
            </div>
            <span>Join 100+ teams brainstorming smarter</span>
          </div>
        </div>

        {/* Right - Form */}
        {showOTP ? (
          <OTPVerification email={pendingRegistration.email} onVerify={handleOTPVerify} onBack={() => { setShowOTP(false); setPendingRegistration(null); setError(''); }} />
        ) : (
          <div className="glass rounded-3xl shadow-modal p-8 animate-scale-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {isLogin ? 'Sign in to continue brainstorming' : 'Join the creative community'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm animate-fade-in flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">!</div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" required value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="input-base pl-10" placeholder="johndoe" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-base pl-10" placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" required value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-base pl-10" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl flex items-center justify-center space-x-2">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : null}
                <span>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-medium transition-colors">
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
