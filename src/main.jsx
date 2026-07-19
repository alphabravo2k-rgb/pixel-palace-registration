import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Config, FeatureFlags } from './match-center/shared';
import { MatchApplicationService, ProjectionBuilder } from './match-center/application';
import {
  platformMatchRepository,
  platformSummaryRepo,
  platformScoreboardRepo,
  platformTimelineRepo,
  platformUnitOfWork,
  platformProviderGateway,
  LotGamingAdapter,
} from './match-center/infrastructure';

// Initialize Match Center Platform Core
Config.load();
FeatureFlags.initialize();

// Register LOT Gaming provider plugin adapter
const lotAdapter = new LotGamingAdapter();
platformProviderGateway.registerProvider('LOT', lotAdapter);

// Wire CQRS Application handlers & Projection builders
const matchAppService = new MatchApplicationService(platformMatchRepository, platformUnitOfWork);
matchAppService.registerHandlers();

const projectionBuilder = new ProjectionBuilder(
  platformSummaryRepo,
  platformScoreboardRepo,
  platformTimelineRepo
);
projectionBuilder.registerSubscriptions();

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
          <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
