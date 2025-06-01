export interface AgentVersion {
  id: string;
  name: string;
  icon: string;
  type: 'voice' | 'chat' | 'custom';
  demoUrl: string;
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  tagline: string;
  versions?: AgentVersion[];
  features?: string[];
  gradient: string;
}

export const agents: Agent[] = [
  {
    id: 'syndra',
    name: 'SYNDRA',
    emoji: '👩‍💼',
    role: 'Agency Development Specialist',
    description: 'Expert guidance for building and scaling your agency',
    tagline: 'Your strategic partner for agency growth and success',
    gradient: 'from-purple-600 to-blue-600',
    versions: [
      {
        id: 'syndra-voice',
        name: 'Voice Agent',
        icon: '🎙️',
        type: 'voice',
        demoUrl: 'https://vapi.ai?demo=true&shareKey=14cfb7ae-db06-41a6-9fa9-be817341c9e2&assistantId=ce24108c-5689-45b1-95da-747409d00df3',
        description: 'Natural voice conversations for real-time strategy'
      },
      {
        id: 'syndra-chat',
        name: 'ChatGPT',
        icon: '💬',
        type: 'chat',
        demoUrl: 'https://chatgpt.com/g/g-67b37c0073488191aa2f74e75b5ff1bf-syndra-agency-development-specialist',
        description: 'Text-based strategic discussions and planning'
      },
      {
        id: 'syndra-poppy',
        name: 'Poppy Version',
        icon: '🌸',
        type: 'custom',
        demoUrl: 'https://chat.getpoppy.ai/g/syndra-p',
        description: 'Enhanced personality experience with Poppy AI'
      }
    ]
  },
  {
    id: 'auntmn',
    name: 'AUNTMN',
    emoji: '🎤',
    role: 'Interview Prep Coach',
    description: 'Master your interviews with personalized coaching and real-time feedback',
    tagline: 'Land your dream job with confidence',
    gradient: 'from-teal-600 to-green-600',
    features: [
      'Personalized mock interviews',
      'Industry-specific preparation',
      'Real-time feedback & tips',
      'Confidence building exercises'
    ],
    versions: [
      {
        id: 'auntmn-voice',
        name: 'Voice Coach',
        icon: '🎯',
        type: 'voice',
        demoUrl: 'https://vapi.ai?demo=true&shareKey=14cfb7ae-db06-41a6-9fa9-be817341c9e2&assistantId=373915d6-eb2f-49f6-8a87-d2b4603a517d',
        description: 'Interactive interview practice with voice feedback'
      }
    ]
  }
]; 