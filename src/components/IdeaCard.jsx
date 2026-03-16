import { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, ThumbsUp, Smile, Edit2, Check, X, AlertCircle } from 'lucide-react';

export default function IdeaCard({ idea, onUpdate, onDelete, onVote, onReact, socket, sessionId, currentUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(idea.content);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(idea.position);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showReactions, setShowReactions] = useState(false);
  const [voteAnim, setVoteAnim] = useState(false);
  const cardRef = useRef(null);

  const emojis = ['👍', '❤️', '🎉', '💡', '🚀', '⭐'];
  const hasVoted = idea.votes?.some(v => v.user === currentUser?.id);
  const voteCount = idea.votes?.length || 0;

  const rotation = useMemo(() => (Math.random() - 0.5) * 2.5, []);

  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    setIsDragging(true);
    const rect = cardRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e) => { if (isDragging) setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }); };
  const handleMouseUp = () => { if (isDragging) { setIsDragging(false); onUpdate(idea._id, { position }); if (socket) socket.emit('idea-moved', { sessionId, ideaId: idea._id, position }); } };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    }
  }, [isDragging, position]);

  const handleVoteClick = () => { setVoteAnim(true); setTimeout(() => setVoteAnim(false), 400); onVote(idea._id); };

  // Slightly darken the card color for the top stripe
  const cardColor = idea.color || '#fef08a';

  return (
    <div
      ref={cardRef}
      className={`absolute select-none transition-all duration-150 group
        ${isDragging ? 'z-[1000] scale-[1.06] shadow-2xl cursor-grabbing' : 'cursor-grab hover:z-10'}
        ${idea.isDuplicate ? 'ring-2 ring-orange-400/60 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '264px',
        transform: isDragging ? 'rotate(2deg)' : `rotate(${rotation}deg)`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Card body */}
      <div className="rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300" style={{ backgroundColor: cardColor }}>
        {/* Top colored stripe */}
        <div className="h-1" style={{ backgroundColor: cardColor, filter: 'brightness(0.75)' }} />

        <div className="p-4">
          {idea.isDuplicate && (
            <div className="flex items-center space-x-1 text-orange-700 text-[10px] mb-2 no-drag font-semibold">
              <AlertCircle className="w-3 h-3" />
              <span>Similar ({(idea.similarity * 100).toFixed(0)}%)</span>
            </div>
          )}

          {isEditing ? (
            <div className="no-drag">
              <textarea value={content} onChange={(e) => setContent(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-gray-900 text-sm leading-relaxed" rows="3" autoFocus />
              <div className="flex space-x-2">
                <button onClick={() => { if (content.trim()) { onUpdate(idea._id, { content }); setIsEditing(false); } }}
                  className="flex-1 flex items-center justify-center space-x-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                  <Check className="w-3 h-3" /><span>Save</span>
                </button>
                <button onClick={() => { setContent(idea.content); setIsEditing(false); }}
                  className="flex-1 flex items-center justify-center space-x-1 bg-white/70 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white transition-colors">
                  <X className="w-3 h-3" /><span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Author */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-[10px] opacity-60">
                  <img src={idea.author?.avatar} alt="" className="w-4 h-4 rounded-full" />
                  <span className="font-semibold">{idea.author?.username}</span>
                </div>
                {voteCount > 0 && (
                  <span className="flex items-center space-x-0.5 text-[10px] font-bold opacity-50">
                    <ThumbsUp className="w-3 h-3" />{voteCount}
                  </span>
                )}
              </div>

              {/* Content */}
              <p className="text-gray-800 leading-relaxed text-[13px] mb-2.5">{idea.content}</p>

              {/* Tags & Sentiment */}
              {(idea.sentiment || idea.tags?.length > 0) && (
                <div className="flex flex-wrap items-center gap-1 mb-2.5">
                  {idea.sentiment && idea.sentiment.label !== 'neutral' && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      idea.sentiment.label === 'positive' ? 'bg-green-200/70 text-green-800' : 'bg-red-200/70 text-red-800'
                    }`}>{idea.sentiment.label}</span>
                  )}
                  {idea.tags?.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-[9px] bg-black/8 px-1.5 py-0.5 rounded font-medium">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Reactions row (always visible if present) */}
              {idea.reactions?.length > 0 && (
                <div className="flex items-center space-x-1 mb-2">
                  {[...new Set(idea.reactions.map(r => r.emoji))].map(emoji => (
                    <span key={emoji} className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded-md font-medium">
                      {emoji} {idea.reactions.filter(r => r.emoji === emoji).length}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions - slide up on hover */}
              <div className="flex items-center space-x-1 no-drag pt-1 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-all duration-200 -mb-1">
                <button onClick={handleVoteClick}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                    hasVoted ? 'bg-brand-500 text-white' : 'bg-white/50 hover:bg-white/80 text-gray-700'
                  } ${voteAnim ? 'scale-125' : ''}`}>
                  <ThumbsUp className="w-3 h-3" /><span>{hasVoted ? 'Voted' : 'Vote'}</span>
                </button>

                <div className="relative">
                  <button onClick={() => setShowReactions(!showReactions)} className="p-1 bg-white/50 rounded-md hover:bg-white/80 transition-colors">
                    <Smile className="w-3 h-3 text-gray-600" />
                  </button>
                  {showReactions && (
                    <div className="absolute bottom-full left-0 mb-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-1 flex space-x-0.5 z-50 animate-scale-in border border-gray-100 dark:border-gray-700">
                      {emojis.map(emoji => (
                        <button key={emoji} onClick={() => { onReact(idea._id, emoji); setShowReactions(false); }}
                          className="text-sm hover:scale-125 transition-transform p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1" />
                <button onClick={() => setIsEditing(true)} className="p-1 bg-white/50 rounded-md hover:bg-white/80 transition-colors">
                  <Edit2 className="w-3 h-3 text-gray-600" />
                </button>
                <button onClick={() => onDelete(idea._id)} className="p-1 bg-red-100/60 rounded-md hover:bg-red-200/80 transition-colors">
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
