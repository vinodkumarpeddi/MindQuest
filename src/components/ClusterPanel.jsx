import { X } from 'lucide-react';

export default function ClusterPanel({ clusters, ideas, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Idea Clusters</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">AI-organized themes from your session</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {clusters.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 dark:text-gray-500">No clusters yet. Click "Cluster" to organize your ideas.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {clusters.map((cluster) => {
                const clusterIdeas = ideas.filter(idea => idea.clusterId?._id === cluster._id || idea.clusterId === cluster._id);
                return (
                  <div key={cluster._id} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden"
                    style={{ borderLeftWidth: '4px', borderLeftColor: cluster.color }}>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cluster.label}</h3>
                          {cluster.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{cluster.description}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">{clusterIdeas.length} ideas</span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wide" style={{ backgroundColor: cluster.color }}>
                            {cluster.algorithm || 'kmeans'}
                          </span>
                        </div>
                      </div>
                      {cluster.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {cluster.keywords.map((kw, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">{kw.word}</span>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        {clusterIdeas.map(idea => (
                          <div key={idea._id} className="p-3 rounded-xl text-sm" style={{ backgroundColor: `${cluster.color}15` }}>
                            <p className="text-gray-800 dark:text-gray-200">{idea.content}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-1.5">
                                <img src={idea.author?.avatar} alt="" className="w-4 h-4 rounded-full" />
                                <span>{idea.author?.username}</span>
                              </div>
                              <span>{idea.votes?.length || 0} votes</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
