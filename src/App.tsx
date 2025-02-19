import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { Toaster } from 'sonner';
import ForwardMessage from '@/pages/ForwardMessage';

function App() {
  return (
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
