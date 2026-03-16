import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import { clusterAPI } from '../utils/api';

export default function ChatSidebar({ sessionId, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm your AI brainstorming assistant. Ask me anything about this session." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
      const r = await clusterAPI.chat(sessionId, text, history);
      setMessages(prev => [...prev, { role: 'ai', content: r.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I couldn\'t process that. Make sure the AI service is running.' }]);
    } finally { setLoading(false); }
  };

  const suggestions = ["What are the main themes?", "Which ideas are most popular?", "Suggest improvements", "Find gaps in our brainstorming"];

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200/50 dark:border-gray-700/50 flex flex-col z-40 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-brand-500 to-purple-600">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-white text-sm">AI Assistant</h3>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-brand-500' : 'bg-purple-500'
              }`}>
                {msg.role === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-white" />}
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-500 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 rounded-bl-md'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-gray-700/50 flex items-center space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {messages.length <= 1 && (
          <div className="space-y-1.5 mt-2">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">Suggestions</p>
            {suggestions.map((s, idx) => (
              <button key={idx} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="block w-full text-left text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 hover:text-brand-600 dark:hover:text-brand-400 border border-gray-100 dark:border-gray-700/50 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center space-x-2">
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about your session..."
            className="input-base text-sm py-2" />
          <button onClick={handleSend} disabled={!input.trim() || loading}
            className="p-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-40 transition-all flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
