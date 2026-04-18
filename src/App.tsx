import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Onboarding } from "./pages/Onboarding";
import { Navbar } from "./components/layout/Navbar";
import { Toaster } from "sonner";

export default function App() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background font-sans text-foreground">
      <Navbar />
      <main className="flex-1 px-4 md:px-8 py-10 lg:py-10 mt-16 lg:mt-0 overflow-y-auto max-w-[1280px]">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
