import { useState, useEffect } from 'react';
import { X, Loader, Download, Sparkles, Users, Lightbulb, ThumbsUp, Brain, TrendingUp, Target, FileText } from 'lucide-react';
import { clusterAPI } from '../utils/api';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function SummaryModal({ sessionId, session, onClose }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate on open
  useEffect(() => {
    handleGenerateSummary();
  }, []);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await clusterAPI.summarize(sessionId);
      setSummary(r.data);
    } catch (err) {
      console.error('Summary error:', err);
      setError('Failed to generate summary. Make sure the AI service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const el = document.getElementById('summary-content');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Handle multi-page if content is long
    if (imgHeight > 277) {
      let position = 0;
      const pageHeight = 277;
      while (position < imgHeight) {
        if (position > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10 - position, imgWidth, imgHeight);
        position += pageHeight;
      }
    } else {
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, imgHeight);
    }
    pdf.save(`MindQuest-${session?.name || sessionId}-Summary.pdf`);
  };

  const stats = [
    { icon: Lightbulb, label: 'Total Ideas', value: session?.metadata?.totalIdeas || 0, color: 'from-blue-500 to-cyan-500' },
    { icon: Users, label: 'Participants', value: session?.participants?.length || 0, color: 'from-purple-500 to-pink-500' },
    { icon: ThumbsUp, label: 'Total Votes', value: session?.metadata?.totalVotes || 0, color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Project Summary & Abstract</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Complete AI-generated analysis of your brainstorming session</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-20 animate-fade-in">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl animate-pulse-gentle" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold mb-1">Generating Project Abstract...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing all ideas, clusters, votes and patterns</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12 animate-fade-in">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm mb-4">{error}</div>
              <button onClick={handleGenerateSummary} className="btn-primary px-6 py-2.5 rounded-xl text-sm">Retry</button>
            </div>
          )}

          {summary && (
            <div id="summary-content" className="space-y-6 animate-fade-in">
              {/* Project Title */}
              <div className="bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-1">{session?.name}</h3>
                {session?.description && <p className="text-white/80 text-sm">{session.description}</p>}
                <div className="flex items-center space-x-4 mt-4">
                  {stats.map(s => (
                    <div key={s.label} className="flex items-center space-x-2 bg-white/15 rounded-lg px-3 py-1.5">
                      <s.icon className="w-4 h-4" />
                      <span className="text-sm font-bold">{s.value}</span>
                      <span className="text-xs text-white/70">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Abstract / Executive Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-5 h-5 text-brand-500" />
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">Project Abstract</h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm">{summary.summary}</p>
              </div>

              {/* Key Insights */}
              {summary.insights?.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">Key Insights & Findings</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                        <span className="w-7 h-7 bg-gradient-to-br from-brand-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Ideas */}
              {summary.topIdeas?.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Target className="w-5 h-5 text-orange-500" />
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">Top Voted Ideas</h4>
                  </div>
                  <div className="space-y-2">
                    {summary.topIdeas.map((idea, idx) => (
                      <div key={idx} className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-orange-300 text-orange-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }`}>{idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 dark:text-gray-200">{idea.content}</p>
                          <p className="text-[10px] text-gray-500 mt-1">by {idea.author} • {idea.votes} votes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {summary.recommendations?.length > 0 && (
                <div className="bg-brand-50/50 dark:bg-brand-900/10 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-5 h-5 text-brand-500" />
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">AI Recommendations</h4>
                  </div>
                  <ul className="space-y-2">
                    {summary.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-brand-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <button onClick={handleDownloadPDF}
                  className="flex items-center space-x-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" /><span>Download PDF</span>
                </button>
                <button onClick={handleGenerateSummary} disabled={loading}
                  className="flex items-center space-x-2 btn-secondary px-5 py-2.5 text-sm">
                  <Sparkles className="w-4 h-4" /><span>Regenerate</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
