import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import SwipeInterface from "./pages/SwipeInterface";
import Search from "./pages/Search";
import AddItem from "./pages/AddItem";
import Matches from "./pages/Matches";
import Likes from "./pages/Likes";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// NOTE: the old marketing Homepage.tsx is retired from "/" per the redesign
// decisions doc (home is now the swipe deck itself, browsable logged-out).
// The file is left on disk, unrouted, in case its sections get reused
// elsewhere (e.g. a future standalone "About" page).

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Home = the swipe deck itself, browsable logged-out (see SwipeInterface.tsx). */}
          <Route path="/" element={<SwipeInterface />} />
          {/* Kept as an alias so existing links/bookmarks to /swipe keep working; */}
          {/* renders the same browsable component as "/", unprotected on purpose */}
          {/* so both URLs behave identically for logged-out visitors. */}
          <Route path="/swipe" element={<SwipeInterface />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/add-item" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/likes" element={<ProtectedRoute><Likes /></ProtectedRoute>} />
          <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
