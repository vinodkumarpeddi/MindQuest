import { useState, useEffect, useCallback } from 'react';
import { X, ArrowUp, ArrowRight, Star, Zap, Clock, AlertTriangle, GripVertical } from 'lucide-react';

const QUADRANTS = [
  { id: 'quick-win', label: 'Quick Wins', subtitle: 'High Impact, Low Effort', icon: Zap, bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', badge: 'bg-green-500', dropBg: 'bg-green-100 dark:bg-green-900/40' },
  { id: 'major-project', label: 'Major Projects', subtitle: 'High Impact, High Effort', icon: Star, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', badge: 'bg-blue-500', dropBg: 'bg-blue-100 dark:bg-blue-900/40' },
  { id: 'fill-in', label: 'Fill-Ins', subtitle: 'Low Impact, Low Effort', icon: Clock, bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700', badge: 'bg-yellow-500', dropBg: 'bg-yellow-100 dark:bg-yellow-900/40' },
  { id: 'avoid', label: 'Reconsider', subtitle: 'Low Impact, High Effort', icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', badge: 'bg-red-500', dropBg: 'bg-red-100 dark:bg-red-900/40' },
];

export default function PriorityMatrix({ ideas, onClose, onUpdateIdea }) {
  const [assignments, setAssignments] = useState({});
  const [dragId, setDragId] = useState(null);
  const [dragOverZone, setDragOverZone] = useState(null);

  useEffect(() => {
    const saved = {};
    ideas.forEach(idea => { if (idea.priority) saved[idea._id] = idea.priority; });
    setAssignments(saved);
  }, [ideas]);

  const unassigned = ideas.filter(i => !assignments[i._id]);
  const getQuadrantIdeas = (qId) => ideas.filter(i => assignments[i._id] === qId);

  const onDragStart = useCallback((e, ideaId) => {
    setDragId(ideaId);
    e.dataTransfer.setData('text/plain', ideaId);
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image semi-transparent
    if (e.target) e.target.style.opacity = '0.5';
  }, []);

  const onDragEnd = useCallback((e) => {
    if (e.target) e.target.style.opacity = '1';
    setDragId(null);
    setDragOverZone(null);
  }, []);

  const onDropQuadrant = useCallback((e, quadrantId) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData('text/plain') || dragId;
    if (!ideaId) return;
    setAssignments(prev => ({ ...prev, [ideaId]: quadrantId }));
    if (onUpdateIdea) onUpdateIdea(ideaId, { priority: quadrantId });
    setDragId(null);
    setDragOverZone(null);
  }, [dragId, onUpdateIdea]);

  const onDropUnassigned = useCallback((e) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData('text/plain') || dragId;
    if (!ideaId) return;
    setAssignments(prev => { const n = { ...prev }; delete n[ideaId]; return n; });
    if (onUpdateIdea) onUpdateIdea(ideaId, { priority: null });
    setDragId(null);
    setDragOverZone(null);
  }, [dragId, onUpdateIdea]);

  const onDragOver = useCallback((e, zone) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(zone);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOverZone(null);
  }, []);

  const IdeaChip = ({ idea }) => (
    <div
      draggable="true"
      onDragStart={(e) => onDragStart(e, idea._id)}
      onDragEnd={onDragEnd}
      className={`flex items-start space-x-2 px-3 py-2.5 rounded-xl text-sm cursor-grab active:cursor-grabbing
        shadow-sm hover:shadow-md transition-all duration-150 border border-gray-200 dark:border-gray-600
        bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
        ${dragId === idea._id ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}`}
    >
      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="line-clamp-2 leading-snug text-xs font-medium">{idea.content}</p>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            <img src={idea.author?.avatar} alt="" className="w-3.5 h-3.5 rounded-full" />
            <span>{idea.author?.username}</span>
          </span>
          <span className="font-medium">{idea.votes?.length || 0} votes</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Priority Matrix</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Drag ideas into quadrants to prioritize them</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="flex gap-4 min-h-[520px]">
            {/* Unassigned sidebar */}
            <div
              className={`w-60 flex-shrink-0 rounded-2xl p-3 overflow-y-auto transition-colors duration-200
                ${dragOverZone === 'unassigned'
                  ? 'bg-gray-100 dark:bg-gray-700/50 border-2 border-dashed border-brand-400'
                  : 'border-2 border-dashed border-gray-200 dark:border-gray-700'}`}
              onDragOver={(e) => onDragOver(e, 'unassigned')}
              onDragLeave={onDragLeave}
              onDrop={onDropUnassigned}
            >
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                Unassigned ({unassigned.length})
              </h4>
              <div className="space-y-2">
                {unassigned.map(idea => <IdeaChip key={idea._id} idea={idea} />)}
                {unassigned.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">All ideas assigned!</p>
                )}
              </div>
            </div>

            {/* 2x2 Matrix */}
            <div className="flex-1 flex flex-col">
              {/* Top label */}
              <div className="flex items-center justify-center mb-2">
                <ArrowUp className="w-3.5 h-3.5 text-gray-400 mr-1" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">High Impact</span>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3">
                {QUADRANTS.map((q) => {
                  const Icon = q.icon;
                  const qIdeas = getQuadrantIdeas(q.id);
                  const isOver = dragOverZone === q.id;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl p-3 flex flex-col transition-all duration-200 border-2
                        ${isOver ? `${q.dropBg} border-dashed ${q.border} scale-[1.01]` : `${q.bg} ${q.border}`}`}
                      onDragOver={(e) => onDragOver(e, q.id)}
                      onDragLeave={onDragLeave}
                      onDrop={(e) => onDropQuadrant(e, q.id)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`w-7 h-7 ${q.badge} rounded-lg flex items-center justify-center shadow-sm`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{q.label}</h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{q.subtitle}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-full">{qIdeas.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px]">
                        {qIdeas.map(idea => <IdeaChip key={idea._id} idea={idea} />)}
                        {qIdeas.length === 0 && !isOver && (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-xs text-gray-400 dark:text-gray-500">Drop ideas here</p>
                          </div>
                        )}
                        {isOver && qIdeas.length === 0 && (
                          <div className="flex items-center justify-center h-full">
                            <div className="w-12 h-12 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl flex items-center justify-center animate-pulse-gentle">
                              <Plus className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom labels */}
              <div className="flex items-center justify-between mt-2 px-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Low Effort</span>
                <div className="flex items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">High Effort</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Plus({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
