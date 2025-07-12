import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Inbox from '@/pages/Inbox';
import Contacts from '@/pages/Contacts';
import Microphone from '@/pages/Microphone';
import AdminDashboard from '@/pages/AdminDashboard';
import Saved from '@/pages/Saved';
import Notes from '@/pages/Notes';
import Trash from '@/pages/Trash';
import New from '@/pages/New';
import ViewMode from '@/pages/ViewMode';
import NotFound from '@/pages/NotFound';
import AIAssistant from '@/pages/AIAssistant';
import { Toaster } from 'sonner';
import ForwardMessage from '@/pages/ForwardMessage';
import VoiceDebug from '@/pages/VoiceDebug';
import Settings from '@/pages/Settings';
import AuthDebug from '@/pages/AuthDebug';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/microphone" element={<Microphone />} />
          <Route path="/forward" element={<ForwardMessage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/new" element={<New />} />
          <Route path="/view-mode" element={<ViewMode />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/voice-debug" element={<VoiceDebug />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/auth-debug" element={<AuthDebug />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
