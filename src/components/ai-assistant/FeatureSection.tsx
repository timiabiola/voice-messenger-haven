import { Sparkles, Globe, Shield, Zap, Brain } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Specialized Expertise',
    description: 'Each AI assistant is trained in their specific domain for expert guidance'
  },
  {
    icon: Sparkles,
    title: 'Natural Conversations',
    description: 'Engage in fluid, human-like conversations with advanced AI models'
  },
  {
    icon: Globe,
    title: '24/7 Availability',
    description: 'Access your AI assistants anytime, anywhere, on any device'
  },
  {
    icon: Zap,
    title: 'Instant Responses',
    description: 'Get immediate answers and guidance without waiting'
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your conversations are private and data is handled securely'
  }
];

export const FeatureSection = () => {
  return (
    <div className="mt-12 border-t border-zinc-800 pt-12">
      <h2 className="text-2xl font-bold text-amber-400 mb-8 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-6 h-6" />
        Why Choose Our AI Assistants?
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div 
              key={idx}
              className="glass-panel p-4 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-400/10 rounded-lg">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 