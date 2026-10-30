import React from 'react';
import LandingMasthead from './LandingMasthead';
import LandingHeroWithSimulator from './LandingHeroWithSimulator';
import ComparisonMatrix from './ComparisonMatrix';
import FeatureBlueprints from './FeatureBlueprints';
import EditorialColophonFooter from './EditorialColophonFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#111827] flex flex-col font-sans selection:bg-[#0F5132]/10 selection:text-[#0F5132]">
      {/* 1. Sticky Editorial Masthead with Live Micro-Ticker */}
      <LandingMasthead />

      {/* 2. Asymmetric Split Hero & Live Compounding Sandbox */}
      <LandingHeroWithSimulator />

      {/* 3. Market Reality Comparison Matrix */}
      <ComparisonMatrix />

      {/* 4. Architectural System Blueprints */}
      <FeatureBlueprints />

      {/* 5. Editorial Colophon Footer with 1-Click Sandbox Logins */}
      <EditorialColophonFooter />
    </div>
  );
}

