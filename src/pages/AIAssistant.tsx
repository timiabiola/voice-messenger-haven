import { ChevronLeft, Settings, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AgentCard } from '@/components/ai-assistant/AgentCard';
import { FeatureSection } from '@/components/ai-assistant/FeatureSection';
import { agents } from '@/data/aiAgents';

const AIAssistant = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[100dvh] bg-black">
      <main className="flex-1 flex flex-col w-full">
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 border-b border-amber-400/20 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-amber-400/10 rounded-full"
            >
              <ChevronLeft className="w-6 h-6 text-amber-400" />
            </Button>
            <h1 className="text-lg font-semibold text-amber-400">AI Voice Assistants</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-amber-400/10 rounded-full"
          >
            <Settings className="w-6 h-6 text-amber-400" />
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Bot className="w-10 h-10 text-amber-400" />
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                  Your AI Voice Companions
                </h1>
              </div>
              <p className="text-gray-400 text-lg">
                Intelligent assistants at your service
              </p>
            </div>

            {/* Agent Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>

            {/* Features Section */}
            <FeatureSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant; 