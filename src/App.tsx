import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Pages
import Index from "./pages/Index";
import Notes from "./pages/Notes";
import SelectLeft from "./pages/SelectLeft";
import IconsForAppFeatures from "./pages/IconsForAppFeatures";
import ViewMode from "./pages/ViewMode";
import Microphone from "./pages/Microphone";
import Contacts from "./pages/Contacts";
import Saved from "./pages/Saved";
import New from "./pages/New";
import Inbox from "./pages/Inbox";
import Trash from "./pages/Trash";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === null) {
    return null; // Loading state
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/notes" element={<Notes />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/select-left"
              element={
                <PrivateRoute>
                  <SelectLeft />
                </PrivateRoute>
              }
            />
            <Route
              path="/icons-for-app-features-center-right"
              element={
                <PrivateRoute>
                  <IconsForAppFeatures />
                </PrivateRoute>
              }
            />
            <Route
              path="/view-mode"
              element={
                <PrivateRoute>
                  <ViewMode />
                </PrivateRoute>
              }
            />
            <Route
              path="/microphone"
              element={
                <PrivateRoute>
                  <Microphone />
                </PrivateRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <PrivateRoute>
                  <Contacts />
                </PrivateRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <PrivateRoute>
                  <Saved />
                </PrivateRoute>
              }
            />
            <Route
              path="/new-0"
              element={
                <PrivateRoute>
                  <New />
                </PrivateRoute>
              }
            />
            <Route
              path="/inbox-0"
              element={
                <PrivateRoute>
                  <Inbox />
                </PrivateRoute>
              }
            />
            <Route
              path="/trash-0"
              element={
                <PrivateRoute>
                  <Trash />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
