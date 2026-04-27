import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';
import { AdminPreview } from './pages/AdminPreview';
import { Footer } from './components/layout/Footer';
import { BootSequence } from './components/ui/BootSequence';
import { Terminal } from './utils/logger';

function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    Terminal.boot();
  }, []);

  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col relative content-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register/:tournamentSlug" element={<Register />} />
          <Route path="/admin/preview/:tournamentSlug" element={<AdminPreview />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
