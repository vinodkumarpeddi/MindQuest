import { useState } from 'react';
import { Plus, Sparkles, LayoutGrid, FileText, Download, Wand2, Users, Lock, ChevronDown } from 'lucide-react';
import { clusterAPI, sessionAPI } from '../utils/api';

export default function Toolbar({
  onAddIdea, onCluster, onShowClusters, onShowSummary, sessionId, isOwner = false
}) {
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [newIdeaContent, setNewIdeaContent] = useState('');
  const [showAIGen, setShowAIGen] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [emails, setEmails] = useState('');
  const [sending, setSending] = useState(false);

  const handleAddIdea = () => {
    if (newIdeaContent.trim()) {
      onAddIdea(newIdeaContent, { x: Math.random() * 800 + 200, y: Math.random() * 600 + 200 });
      setNewIdeaContent('');
      setShowNewIdea(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const r = await clusterAPI.generateIdeas(sessionId, aiPrompt);
      r.data.ideas.forEach((content, i) => setTimeout(() => onAddIdea(content, { x: 300 + (i % 3) * 280, y: 300 + Math.floor(i / 3) * 200 }), i * 500));
      setAIPrompt(''); setShowAIGen(false);
    } catch (e) { alert('Failed to generate ideas. Make sure the AI service is running.'); }
    finally { setGenerating(false); }
  };

  const handleExport = async () => {
    try {
      const r = await sessionAPI.export(sessionId);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' }));
      a.download = `mindquest-${sessionId}-${Date.now()}.json`;
      a.click();
    } catch (e) {}
  };

  const handleSendInvites = async () => {
    const list = emails.split(',').map(e => e.trim()).filter(e => e);
    if (!list.length) return;
    setSending(true);
    try { await sessionAPI.inviteParticipants(sessionId, list); alert('Invitations sent!'); setShowInvite(false); setEmails(''); }
    catch (e) { alert('Failed to send invitations.'); }
    finally { setSending(false); }
  };

  const toolBtn = "flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0";
  const iconBtn = "p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-white transition-all";

  return (
    <>
      <div className="flex items-center space-x-1">
        {/* Primary actions */}
        <button onClick={() => setShowNewIdea(true)} className={`${toolBtn} bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20`}>
          <Plus className="w-4 h-4" /><span>Add Idea</span>
        </button>
        <button onClick={() => setShowAIGen(true)} className={`${toolBtn} bg-purple-500 hover:bg-purple-600 text-white shadow-sm shadow-purple-500/20`}>
          <Wand2 className="w-4 h-4" /><span>AI Generate</span>
        </button>
        <button onClick={onCluster} className={`${toolBtn} bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20`}>
          <Sparkles className="w-4 h-4" /><span>Cluster</span>
        </button>

        <div className="h-6 w-px bg-gray-200/50 dark:bg-gray-700/50 mx-0.5" />

        {/* Secondary actions */}
        <button onClick={onShowClusters} className={iconBtn} title="View Clusters"><LayoutGrid className="w-4 h-4" /></button>
        <button onClick={onShowSummary} className={iconBtn} title="Summary"><FileText className="w-4 h-4" /></button>
        <button onClick={handleExport} className={iconBtn} title="Export"><Download className="w-4 h-4" /></button>

        {isOwner && (
          <>
            <div className="h-6 w-px bg-gray-200/50 dark:bg-gray-700/50 mx-0.5" />
            <button onClick={() => setShowInvite(true)} className={`${toolBtn} bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-500/20`}>
              <Users className="w-3.5 h-3.5" /><span>Invite</span>
            </button>
          </>
        )}
      </div>

      {/* Modals */}
      {showNewIdea && (
        <div className="modal-backdrop" onClick={() => setShowNewIdea(false)}>
          <div className="modal-content max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-heading">Add New Idea</h3>
            <textarea value={newIdeaContent} onChange={(e) => setNewIdeaContent(e.target.value)}
              className="input-base" placeholder="Type your idea here..." rows="4" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleAddIdea(); }} />
            <p className="text-[10px] text-gray-400 mt-1.5">Press Cmd+Enter to submit</p>
            <div className="flex space-x-3 mt-4">
              <button onClick={() => setShowNewIdea(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={handleAddIdea} className="btn-primary flex-1 py-2.5">Add Idea</button>
            </div>
          </div>
        </div>
      )}

      {showAIGen && (
        <div className="modal-backdrop" onClick={() => setShowAIGen(false)}>
          <div className="modal-content max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading">AI Idea Generation</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI will generate 5 creative suggestions</p>
              </div>
            </div>
            <textarea value={aiPrompt} onChange={(e) => setAIPrompt(e.target.value)}
              className="input-base" placeholder="E.g., innovative marketing strategies for social media" rows="3" autoFocus />
            <div className="flex space-x-3 mt-4">
              <button onClick={() => setShowAIGen(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={handleGenerateIdeas} disabled={generating} className="btn-primary flex-1 py-2.5">
                {generating ? 'Generating...' : 'Generate Ideas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvite && isOwner && (
        <div className="modal-backdrop" onClick={() => setShowInvite(false)}>
          <div className="modal-content max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-heading">Invite Participants</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter email addresses, separated by commas.</p>
            <textarea value={emails} onChange={(e) => setEmails(e.target.value)}
              className="input-base" placeholder="user1@example.com, user2@example.com" rows="3" autoFocus />
            <div className="flex space-x-3 mt-4">
              <button onClick={() => setShowInvite(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={handleSendInvites} disabled={sending} className="btn-primary flex-1 py-2.5">
                {sending ? 'Sending...' : 'Send Invites'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
