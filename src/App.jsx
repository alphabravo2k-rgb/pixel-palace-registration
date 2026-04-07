import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register/:tournamentSlug" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
