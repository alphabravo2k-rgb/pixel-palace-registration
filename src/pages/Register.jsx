import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { getTournamentBySlug } from '../config/tournaments';
import { TournamentForm } from '../components/forms/TournamentForm';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ArrowLeft } from 'lucide-react';

export const Register = () => {
  const { tournamentSlug } = useParams();
  const tournament = getTournamentBySlug(tournamentSlug);

  if (!tournament) {
    return <Navigate to="/404" replace />;
  }

  if (tournament.status !== 'active') {
    return (
      <PageWrapper>
        <div className="glass-panel p-12 text-center w-full max-w-2xl">
          <h2 className="text-3xl text-esports-warning font-heading mb-4 uppercase">Access Denied</h2>
          <p className="text-gray-400 font-body mb-8">Registration for this tournament is currently offline.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> RETRUN TO HUB
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="w-full mb-6">
        <Link to="/" className="text-gray-500 hover:text-esports-accent font-body text-xs tracking-widest uppercase flex items-center gap-2 transition-colors inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Operations
        </Link>
      </div>
      <TournamentForm tournament={tournament} />
    </PageWrapper>
  );
};
