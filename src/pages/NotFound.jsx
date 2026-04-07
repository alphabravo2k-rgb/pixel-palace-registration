import React from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <PageWrapper>
      <div className="glass-panel p-12 text-center w-full max-w-2xl flex flex-col items-center">
        <h1 className="text-7xl font-heading text-esports-warning font-bold mb-4">404</h1>
        <h2 className="text-2xl font-body text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
          Sector Not Found
        </h2>
        <p className="text-gray-400 font-body mb-8">
          The operation you are looking for does not exist or has been classified.
        </p>
        <Link to="/" className="btn-warning inline-flex items-center gap-2">
          <Home className="w-5 h-5" /> RECALIBRATE TO HUB
        </Link>
      </div>
    </PageWrapper>
  );
};
