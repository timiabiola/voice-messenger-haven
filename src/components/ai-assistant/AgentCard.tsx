import { useState } from 'react';
import { Agent } from '@/data/aiAgents';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  const [selectedVersion, setSelectedVersion] = useState(0);
  const hasMultipleVersions = agent.versions && agent.versions.length > 1;

  const handleLaunch = () => {
    if (agent.versions && agent.versions[selectedVersion]) {
      window.open(agent.versions[selectedVersion].demoUrl, '_blank');
    }
  };

  return (
    <div className="glass-panel overflow-hidden transform transition-all duration-300 hover:scale-[1.02]">
      {/* Header with gradient */}
      <div className={`p-6 bg-gradient-to-br ${agent.gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl filter drop-shadow-lg">{agent.emoji}</span>
            <div>
              <h3 className="text-2xl font-bold text-white">{agent.name}</h3>
              <p className="text-white/90">{agent.role}</p>
            </div>
          </div>
          <p className="text-white/80 italic mt-2">"{agent.tagline}"</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Features for single-version agents */}
        {agent.features && (
          <div className="space-y-2">
            <h4 className="font-semibold text-amber-400">What I help with:</h4>
            <ul className="space-y-1">
              {agent.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-300">
                  <span className="text-amber-400">•</span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Version selector for multi-version agents */}
        {hasMultipleVersions && (
          <div>
            <h4 className="font-semibold text-amber-400 mb-3">
              Choose your interaction style:
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {agent.versions?.map((version, idx) => (
                <button
                  key={version.id}
                  onClick={() => setSelectedVersion(idx)}
                  className={`p-3 rounded-lg border-2 transition-all transform ${
                    selectedVersion === idx
                      ? 'border-amber-400 bg-amber-400/10 scale-105'
                      : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{version.icon}</div>
                  <div className="text-xs font-medium">{version.name}</div>
                </button>
              ))}
            </div>
            {agent.versions && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                {agent.versions[selectedVersion].description}
              </p>
            )}
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleLaunch}
          className="w-full py-3 px-6 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
        >
          {hasMultipleVersions ? (
            <>
              <span>Start with {agent.versions?.[selectedVersion].name}</span>
              <span className="text-lg">{agent.versions?.[selectedVersion].icon}</span>
            </>
          ) : (
            <>
              <span className="text-lg">🎯</span>
              <span>Start Practice Session</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}; 