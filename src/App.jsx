import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';

import { Footer } from './components/layout/Footer';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col relative content-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register/:tournamentSlug" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
