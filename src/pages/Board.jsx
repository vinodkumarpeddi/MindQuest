import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { sessionAPI, ideaAPI, clusterAPI } from '../utils/api';
import IdeaCard from '../components/IdeaCard';
import Toolbar from '../components/Toolbar';
import ClusterPanel from '../components/ClusterPanel';
import SummaryModal from '../components/SummaryModal';
import DarkModeToggle from '../components/DarkModeToggle';
import ChatSidebar from '../components/ChatSidebar';
import PriorityMatrix from '../components/PriorityMatrix';
import TimerRounds from '../components/TimerRounds';
import { ArrowLeft, MessageSquare, Grid3X3, Timer, Sparkles, Brain, Mouse } from 'lucide-react';

export default function Board() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [session, setSession] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClusters, setShowClusters] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const boardRef = useRef(null);

  useEffect(() => { loadSessionData(); }, [sessionId]);

  useEffect(() => {
    if (socket && session) {
      socket.emit('join-session', sessionId);
      socket.on('idea-created', (idea) => setIdeas(prev => [...prev, idea]));
      socket.on('idea-updated', (idea) => setIdeas(prev => prev.map(i => i._id === idea._id ? idea : i)));
      socket.on('idea-deleted', (ideaId) => setIdeas(prev => prev.filter(i => i._id !== ideaId)));
      socket.on('idea-moved', ({ ideaId, position }) => setIdeas(prev => prev.map(i => i._id === ideaId ? { ...i, position } : i)));
      socket.on('idea-voted', (idea) => setIdeas(prev => prev.map(i => i._id === idea._id ? idea : i)));
      socket.on('clusters-updated', (newClusters) => { setClusters(newClusters); loadIdeas(); });
      return () => { socket.emit('leave-session', sessionId); ['idea-created','idea-updated','idea-deleted','idea-moved','idea-voted','clusters-updated'].forEach(e => socket.off(e)); };
    }
  }, [socket, session, sessionId]);

  const loadSessionData = async () => {
    try {
      const [sessionRes, ideasRes, clustersRes] = await Promise.all([
        sessionAPI.getById(sessionId), ideaAPI.getBySession(sessionId), clusterAPI.getBySession(sessionId)
      ]);
      setSession(sessionRes.data.session);
      setIdeas(ideasRes.data.ideas);
      setClusters(clustersRes.data.clusters);
    } catch (error) { console.error('Failed to load session:', error); }
    finally { setLoading(false); }
  };

  const loadIdeas = async () => { try { const r = await ideaAPI.getBySession(sessionId); setIdeas(r.data.ideas); } catch (e) {} };
  const handleAddIdea = async (content, position) => { try { const r = await ideaAPI.create({ sessionId, content, position }); setIdeas(prev => [...prev, r.data.idea]); if (socket) socket.emit('idea-created', { sessionId, idea: r.data.idea }); } catch (e) {} };
  const handleUpdateIdea = async (id, updates) => { try { const r = await ideaAPI.update(id, updates); setIdeas(prev => prev.map(i => i._id === id ? r.data.idea : i)); if (socket) socket.emit('idea-updated', { sessionId, idea: r.data.idea }); } catch (e) {} };
  const handleDeleteIdea = async (id) => { try { await ideaAPI.delete(id); setIdeas(prev => prev.filter(i => i._id !== id)); if (socket) socket.emit('idea-deleted', { sessionId, ideaId: id }); } catch (e) {} };
  const handleVote = async (id) => { try { const r = await ideaAPI.vote(id); setIdeas(prev => prev.map(i => i._id === id ? r.data.idea : i)); if (socket) socket.emit('idea-voted', { sessionId, idea: r.data.idea }); } catch (e) {} };
  const handleReact = async (id, emoji) => { try { const r = await ideaAPI.react(id, emoji); setIdeas(prev => prev.map(i => i._id === id ? r.data.idea : i)); if (socket) socket.emit('idea-reacted', { sessionId, idea: r.data.idea }); } catch (e) {} };
  const handleCluster = async () => { try { const r = await clusterAPI.trigger(sessionId); setClusters(r.data.clusters); await loadIdeas(); if (socket) socket.emit('clusters-updated', { sessionId, clusters: r.data.clusters }); } catch (e) {} };

  const handleBoardMouseDown = (e) => { if (e.target === boardRef.current) { setIsDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); } };
  const handleBoardMouseMove = (e) => { if (isDragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleBoardMouseUp = () => setIsDragging(false);
  const handleWheel = (e) => { e.preventDefault(); setScale(prev => Math.max(0.3, Math.min(2.5, prev * (e.deltaY > 0 ? 0.9 : 1.1)))); };

  const iconBtn = (active) => `p-2.5 rounded-xl transition-all duration-200 ${active ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-white'}`;

  if (loading) {
    return (
      <div className="h-screen bg-animated-gradient flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-purple animate-pulse-gentle">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-heading">Loading Session</h2>
          <p className="text-gray-500 dark:text-gray-400">Preparing your brainstorming workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Minimal Top Bar */}
      <div className="glass border-b border-gray-200/30 dark:border-gray-700/30 px-4 py-2.5 z-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/lobby')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white font-heading leading-tight">{session?.name}</h1>
            <div className="flex items-center space-x-2 text-[11px] text-gray-400">
              <span>{ideas.length} ideas</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span>{session?.participants?.length} participants</span>
              {connected && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="flex items-center space-x-1 text-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>Live</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar + utilities */}
        <div className="flex items-center space-x-1.5">
          <Toolbar
            onAddIdea={handleAddIdea} onCluster={handleCluster}
            onShowClusters={() => setShowClusters(true)} onShowSummary={() => setShowSummary(true)}
            sessionId={sessionId} scale={scale}
            onZoomIn={() => setScale(prev => Math.min(2.5, prev * 1.2))}
            onZoomOut={() => setScale(prev => Math.max(0.3, prev / 1.2))}
            isOwner={session?.owner?._id === user?._id}
          />
          <div className="h-6 w-px bg-gray-200/50 dark:bg-gray-700/50 mx-0.5" />
          <button onClick={() => setShowTimer(!showTimer)} className={iconBtn(showTimer)} title="Timer">
            <Timer className="w-4 h-4" />
          </button>
          <button onClick={() => setShowMatrix(true)} className={iconBtn(false)} title="Priority Matrix">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowChat(!showChat)} className={iconBtn(showChat)} title="AI Chat">
            <MessageSquare className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-gray-200/50 dark:bg-gray-700/50 mx-0.5" />
          <DarkModeToggle />
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={boardRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-grid bg-gray-50/80 dark:bg-gray-900"
        onMouseDown={handleBoardMouseDown}
        onMouseMove={handleBoardMouseMove}
        onMouseUp={handleBoardMouseUp}
        onMouseLeave={handleBoardMouseUp}
        onWheel={handleWheel}
      >
        <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', width: '4000px', height: '4000px', position: 'absolute', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
          {ideas.map(idea => (
            <IdeaCard key={idea._id} idea={idea} onUpdate={handleUpdateIdea} onDelete={handleDeleteIdea}
              onVote={handleVote} onReact={handleReact} socket={socket} sessionId={sessionId} currentUser={user} />
          ))}
        </div>

        {/* Empty state */}
        {ideas.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center animate-fade-in max-w-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-brand-200 dark:border-brand-800">
                <Sparkles className="w-10 h-10 text-brand-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Start Brainstorming</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">Click <strong>"Add Idea"</strong> below or use <strong>"AI Generate"</strong></p>
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-400 dark:text-gray-600 mt-3">
                <Mouse className="w-3.5 h-3.5" />
                <span>Scroll to zoom, drag to pan</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zoom indicator - bottom left */}
      <div className="absolute bottom-4 left-4 z-10 glass rounded-xl px-3 py-1.5 border border-gray-200/30 dark:border-gray-700/30 text-xs font-mono font-medium text-gray-500 dark:text-gray-400">
        {Math.round(scale * 100)}%
      </div>

      {showTimer && <TimerRounds onClose={() => setShowTimer(false)} socket={socket} sessionId={sessionId} />}
      {showMatrix && <PriorityMatrix ideas={ideas} onClose={() => setShowMatrix(false)} onUpdateIdea={handleUpdateIdea} />}
      {showClusters && <ClusterPanel clusters={clusters} ideas={ideas} onClose={() => setShowClusters(false)} />}
      {showSummary && <SummaryModal sessionId={sessionId} session={session} onClose={() => setShowSummary(false)} />}
      {showChat && <ChatSidebar sessionId={sessionId} onClose={() => setShowChat(false)} />}
    </div>
  );
}
