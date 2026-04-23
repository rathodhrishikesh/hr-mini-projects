import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Overview from "./pages/Overview";
import Trends from "./pages/Trends";
import Segmentation from "./pages/Segmentation";
import Pricing from "./pages/Pricing";
import Finder from "./pages/Finder";
import StateMap from "./pages/StateMap";
import Fico from "./pages/Fico";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/segmentation" element={<Segmentation />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/finder" element={<Finder />} />
            <Route path="/states" element={<StateMap />} />
            <Route path="/fico" element={<Fico />} />
            <Route path="/upload" element={<Upload />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
