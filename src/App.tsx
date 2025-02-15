
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";

// Pages
import Index from "./pages/Index";
import SelectLeft from "./pages/SelectLeft";
import IconsForAppFeatures from "./pages/IconsForAppFeatures";
import ViewMode from "./pages/ViewMode";
import Microphone from "./pages/Microphone";
import Contacts from "./pages/Contacts";
import Bookmarks from "./pages/Bookmarks";
import New from "./pages/New";
import Inbox from "./pages/Inbox";
import Saved from "./pages/Saved";
import Trash from "./pages/Trash";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/select-left" element={<SelectLeft />} />
            <Route path="/icons-for-app-features-center-right" element={<IconsForAppFeatures />} />
            <Route path="/view-mode" element={<ViewMode />} />
            <Route path="/microphone" element={<Microphone />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/new-0" element={<New />} />
            <Route path="/inbox-0" element={<Inbox />} />
            <Route path="/saved-309" element={<Saved />} />
            <Route path="/trash-0" element={<Trash />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
