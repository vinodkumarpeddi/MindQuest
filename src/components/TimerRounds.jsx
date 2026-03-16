import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, ChevronRight, X, Bell } from 'lucide-react';

const PHASES = [
  { id: 'ideation', label: 'Ideation', description: 'Generate as many ideas as possible', color: 'bg-blue-500', defaultMinutes: 5 },
  { id: 'discussion', label: 'Discussion', description: 'Discuss and refine ideas', color: 'bg-purple-500', defaultMinutes: 3 },
  { id: 'voting', label: 'Voting', description: 'Vote on the best ideas', color: 'bg-green-500', defaultMinutes: 2 },
  { id: 'review', label: 'Review', description: 'Review results and next steps', color: 'bg-orange-500', defaultMinutes: 2 },
];

export default function TimerRounds({ onClose, socket, sessionId }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PHASES[0].defaultMinutes * 60);
  const [totalRounds, setTotalRounds] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [showSetup, setShowSetup] = useState(true);
  const [phaseDurations, setPhaseDurations] = useState(PHASES.map(p => p.defaultMinutes));
  const [showAlert, setShowAlert] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      }, 350);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      clearInterval(intervalRef.current);
      playSound();
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      advancePhase();
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const advancePhase = () => {
    if (currentPhase < PHASES.length - 1) {
      const next = currentPhase + 1;
      setCurrentPhase(next);
      setTimeLeft(phaseDurations[next] * 60);
      setIsRunning(true);
    } else if (currentRound < totalRounds) {
      setCurrentRound(prev => prev + 1);
      setCurrentPhase(0);
      setTimeLeft(phaseDurations[0] * 60);
      setIsRunning(true);
    } else {
      setIsRunning(false);
      setShowAlert(true);
    }
  };

  const handleStart = () => {
    setShowSetup(false);
    setTimeLeft(phaseDurations[0] * 60);
    setCurrentPhase(0);
    setCurrentRound(1);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setShowSetup(true);
    setCurrentPhase(0);
    setCurrentRound(1);
    setTimeLeft(phaseDurations[0] * 60);
  };

  const handleSkip = () => {
    clearInterval(intervalRef.current);
    advancePhase();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeLeft / (phaseDurations[currentPhase] * 60));
  const phase = PHASES[currentPhase];
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Alert notification */}
      {showAlert && (
        <div className="absolute -top-16 right-0 bg-white dark:bg-gray-800 shadow-xl rounded-lg px-4 py-3 flex items-center space-x-2 border border-gray-200 dark:border-gray-700 animate-bounce">
          <Bell className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {currentPhase >= PHASES.length - 1 && currentRound >= totalRounds ? 'All rounds complete!' : `${phase.label} phase complete!`}
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ width: showSetup ? '320px' : '280px' }}>
        {/* Header */}
        <div className={`${phase.color} px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-white" />
            <span className="text-white font-semibold text-sm">
              {showSetup ? 'Timer Setup' : `Round ${currentRound}/${totalRounds}`}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {showSetup ? (
          /* Setup View */
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Rounds</label>
              <select
                value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} round{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Phase Durations (minutes)</label>
              {PHASES.map((p, idx) => (
                <div key={p.id} className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${p.color}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-20">{p.label}</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={phaseDurations[idx]}
                    onChange={(e) => {
                      const newDurations = [...phaseDurations];
                      newDurations[idx] = Math.max(1, Number(e.target.value));
                      setPhaseDurations(newDurations);
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-medium text-sm hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Timer</span>
            </button>
          </div>
        ) : (
          /* Timer View */
          <div className="p-4">
            {/* Phase indicators */}
            <div className="flex items-center justify-center space-x-1 mb-4">
              {PHASES.map((p, idx) => (
                <div key={p.id} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === currentPhase ? `${p.color} text-white` :
                    idx < currentPhase ? 'bg-gray-300 dark:bg-gray-600 text-white' :
                    'border-2 border-gray-300 dark:border-gray-600 text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < PHASES.length - 1 && (
                    <div className={`w-4 h-0.5 ${idx < currentPhase ? 'bg-gray-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Circular timer */}
            <div className="flex justify-center mb-3">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6"
                    className="text-gray-200 dark:text-gray-700" />
                  <circle cx="60" cy="60" r="54" fill="none" strokeWidth="6"
                    stroke="currentColor"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap="round"
                    className={phase.id === 'ideation' ? 'text-blue-500' : phase.id === 'discussion' ? 'text-purple-500' : phase.id === 'voting' ? 'text-green-500' : 'text-orange-500'}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{formatTime(timeLeft)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{phase.label}</span>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-4">{phase.description}</p>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-6 py-2 rounded-lg font-medium text-sm text-white transition-colors ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                <div className="flex items-center space-x-1">
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isRunning ? 'Pause' : 'Resume'}</span>
                </div>
              </button>
              <button
                onClick={handleSkip}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Skip phase"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
