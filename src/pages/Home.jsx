import React from 'react';
import { Link } from 'react-router-dom';
import { tournaments } from '../config/tournaments';
import { Badge } from '../components/ui/Badge';
import { PageWrapper } from '../components/layout/PageWrapper';

export const Home = () => {
  return (
    <PageWrapper>
      <div className="w-full max-w-5xl">
        <h2 className="text-2xl font-body text-gray-400 uppercase tracking-widest mb-8 border-b border-white/10 pb-4">
          Active Operations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((tournament) => (
            <div key={tournament.slug} className={`glass-panel p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 ${tournament.status === 'closed' ? 'opacity-50 grayscale' : 'hover:border-esports-accent hover:-translate-y-1'}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-heading text-white font-bold max-w-[70%]">{tournament.name}</h3>
                  <Badge status={tournament.status} />
                </div>
                <p className="text-sm font-body text-gray-400 mb-6 line-clamp-2">
                  Official registration portal for {tournament.name}. Prepare your roster.
                </p>
              </div>
              
              <div className="mt-auto">
                {tournament.status === 'active' ? (
                  <Link to={`/register/${tournament.slug}`} className="btn-primary inline-flex w-full justify-center">
                    REGISTER NOW
                  </Link>
                ) : (
                  <button disabled className="w-full bg-gray-900 border border-gray-700 text-gray-500 px-6 py-2 uppercase font-heading font-bold tracking-widest cursor-not-allowed">
                    {tournament.status === 'closed' ? 'REGISTRATION CLOSED' : 'COMING SOON'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};
