import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionAPI } from '../utils/api';
import { Plus, Users, Clock, LogOut, Sparkles, Search, Lightbulb } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Lobby() {
  const [sessions, setSessions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSession, setNewSession] = useState({ name: '', description: '', isPublic: true });
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await sessionAPI.create(newSession);
      navigate(`/session/${response.data.session.sessionId}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      await sessionAPI.join(sessionId);
      navigate(`/session/${sessionId}`);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const filtered = sessions.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'mine' && s.owner?._id === user?.id) || (filter === 'public' && s.isPublic);
    return matchesSearch && matchesFilter;
  });

  const cardColors = ['from-blue-500/10 to-cyan-500/10', 'from-purple-500/10 to-pink-500/10', 'from-green-500/10 to-emerald-500/10', 'from-orange-500/10 to-amber-500/10', 'from-rose-500/10 to-red-500/10'];
  const accentColors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-green-500 to-emerald-500', 'from-orange-500 to-amber-500', 'from-rose-500 to-red-500'];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 glass border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white font-heading">MindQuest</h1>
            </div>
            <div className="flex items-center space-x-3">
              <DarkModeToggle />
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80">
                <img src={user?.avatar} alt={user?.username} className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-gray-700" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{user?.username}</span>
              </div>
              <button onClick={logout} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-in">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-heading tracking-tight">Sessions</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Join or create a collaborative brainstorming session</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary px-6 py-3 rounded-xl flex items-center space-x-2 self-start">
            <Plus className="w-5 h-5" /><span>New Session</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-10" placeholder="Search sessions..." />
          </div>
          <div className="flex items-center space-x-2">
            {[['all', 'All'], ['mine', 'My Sessions'], ['public', 'Public']].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === key ? 'bg-brand-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeleton */}
        {sessionsLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card-base p-6 space-y-4">
                <div className="h-6 w-3/4 rounded-lg shimmer" />
                <div className="h-4 w-full rounded-lg shimmer" />
                <div className="h-4 w-1/2 rounded-lg shimmer" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 rounded-lg shimmer" />
                  <div className="h-4 w-16 rounded-lg shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Session Grid */}
        {!sessionsLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((session, idx) => (
              <div
                key={session._id}
                onClick={() => handleJoinSession(session.sessionId)}
                className="card-base p-0 overflow-hidden cursor-pointer group hover:scale-[1.02] hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Accent bar */}
                <div className={`h-1.5 bg-gradient-to-r ${accentColors[idx % accentColors.length]}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">{session.name}</h3>
                    <span className={`status-dot ${session.status === 'active' ? 'status-dot-live' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  </div>
                  {session.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{session.description}</p>
                  )}
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">
                      <Users className="w-3.5 h-3.5" /><span>{session.participants?.length || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">
                      <Lightbulb className="w-3.5 h-3.5" /><span>{session.metadata?.totalIdeas || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1 ml-auto">
                      <Clock className="w-3.5 h-3.5" /><span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <img src={session.owner?.avatar} alt="" className="w-6 h-6 rounded-full ring-1 ring-gray-200 dark:ring-gray-700" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">by <span className="font-medium text-gray-700 dark:text-gray-300">{session.owner?.username}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!sessionsLoading && filtered.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {search ? 'No matching sessions' : 'No sessions yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              {search ? 'Try a different search term' : 'Create your first brainstorming session and invite your team to get started'}
            </p>
            {!search && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary px-8 py-3 rounded-xl inline-flex items-center space-x-2">
                <Plus className="w-5 h-5" /><span>Create First Session</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 font-heading">Create New Session</h2>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Session Name</label>
                <input type="text" required value={newSession.name}
                  onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                  className="input-base" placeholder="Product Launch Ideas" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  className="input-base" placeholder="What will you brainstorm about?" rows="3" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isPublic" checked={newSession.isPublic}
                  onChange={(e) => setNewSession({ ...newSession, isPublic: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500" />
                <label htmlFor="isPublic" className="text-sm text-gray-600 dark:text-gray-400">Make this session public</label>
              </div>
              <div className="flex space-x-3 pt-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
                  {loading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
