import { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';

export default function OTPVerification({ email, onVerify, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(countdown - 1), 1000); return () => clearTimeout(t); }
    else setCanResend(true);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) handleVerify(newOtp.join(''));
  };

  const handleKeyDown = (index, e) => { if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus(); };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(data)) return;
    const newOtp = data.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    if (newOtp.every(d => d !== '')) handleVerify(newOtp.join(''));
  };

  const handleVerify = async (otpCode) => {
    setLoading(true); setError('');
    try { await onVerify(otpCode || otp.join('')); }
    catch (err) { setError(err.response?.data?.error || 'Invalid OTP code'); setOtp(['', '', '', '', '', '']); inputRefs.current[0]?.focus(); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true); setError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const r = await fetch(`${API_URL}/api/otp/resend-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCountdown(60); setCanResend(false); setOtp(['', '', '', '', '', '']); inputRefs.current[0]?.focus();
    } catch (err) { setError(err.message || 'Failed to resend OTP'); }
    finally { setResendLoading(false); }
  };

  return (
    <div className="glass rounded-3xl shadow-modal p-8 animate-slide-up">
      <button onClick={onBack} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4 mr-1.5" />Back
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-purple animate-pulse-gentle">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Verify Email</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Enter the 6-digit code sent to</p>
        <p className="text-gray-900 dark:text-white font-semibold text-sm">{email}</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm text-center animate-fade-in">{error}</div>
      )}

      <div className="flex justify-center gap-2.5 mb-6">
        {otp.map((digit, index) => (
          <input key={index} ref={el => inputRefs.current[index] = el}
            type="text" inputMode="numeric" maxLength={1} value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste} disabled={loading}
            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none transition-all disabled:opacity-50 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white"
            autoFocus={index === 0} />
        ))}
      </div>

      <button onClick={() => handleVerify()} disabled={loading || otp.some(d => !d)}
        className="btn-primary w-full py-3 rounded-xl mb-4">
        {loading ? 'Verifying...' : 'Verify Email'}
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Didn't receive the code?</p>
        {canResend ? (
          <button onClick={handleResend} disabled={resendLoading}
            className="text-brand-600 dark:text-brand-400 hover:text-brand-700 text-sm font-medium disabled:opacity-50">
            {resendLoading ? 'Sending...' : 'Resend Code'}
          </button>
        ) : (
          <p className="text-gray-400 text-xs">Resend in {countdown}s</p>
        )}
      </div>
    </div>
  );
}
