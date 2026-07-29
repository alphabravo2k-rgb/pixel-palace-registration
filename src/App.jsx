import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';
import { AdminPreview } from './pages/AdminPreview';
import DraftRegistrations from './pages/admin/DraftRegistrations';
import { Footer } from './components/layout/Footer';
import { BootSequence } from './components/ui/BootSequence';
import { Terminal } from './utils/logger';
import { MatchCenterDashboard } from './match-center/presentation/pages/MatchCenterDashboard';
import { MatchCenterSpectator } from './match-center/presentation/pages/MatchCenterSpectator';
import { MatchCenterList } from './match-center/presentation/pages/MatchCenterList';

import { EsportsCommandPalette } from './components/common/EsportsCommandPalette';

function App() {
  const [booting, setBooting] = useState(true);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    Terminal.boot();

    // Ctrl + K / Cmd + K listener
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <EsportsCommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      <main className="flex-grow flex flex-col relative content-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register/:tournamentSlug" element={<Register />} />
          <Route path="/admin/preview/:tournamentSlug" element={<AdminPreview />} />
          <Route path="/admin/drafts" element={<DraftRegistrations />} />
          <Route path="/admin/match-center/:matchId" element={<MatchCenterDashboard />} />
          <Route path="/match-center/:matchId" element={<MatchCenterSpectator />} />
          <Route path="/match-center" element={<MatchCenterList />} />
          <Route path="/admin/match-center" element={<MatchCenterList isAdmin={true} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
