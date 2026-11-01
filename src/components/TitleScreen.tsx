/**
 * Title Screen for Cubiverse 3D.
 * Bespoke inline SVG title lockup, live background world pan, and keyboard start prompt.
 */

import React from 'react';
import { Play, Grid, Volume2, VolumeX, Sparkles, HelpCircle, Users } from 'lucide-react';
import { soundFx } from '../game/audio';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenRules: () => void;
  onOpenMultiplayer: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenLevelSelect,
  onOpenRules,
  onOpenMultiplayer,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-12 pointer-events-none select-none">
      {/* Top Header Cluster */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Édition Spatiale 3D</span>
        </div>

        <button
          onClick={() => {
            soundFx.playClick();
            onToggleMute();
          }}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition-all shadow-lg active:scale-95"
          title={isMuted ? 'Activer le son' : 'Couper le son'}
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
        </button>
      </div>

      {/* Hero Centerpiece Lockup with Bespoke SVG Title */}
      <div className="flex flex-col items-center justify-center text-center my-auto pointer-events-auto max-w-xl mx-auto">
        {/* Bespoke 3D Totem SVG Icon */}
        <div className="w-20 h-20 mb-4 drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <polygon points="50,10 90,30 50,50 10,30" fill="#0284c7" stroke="#38bdf8" strokeWidth="2.5" />
            <polygon points="10,30 50,50 50,90 10,70" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
            <polygon points="90,30 50,50 50,90 90,70" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="10" fill="#38bdf8" className="animate-pulse" />
            <polygon points="50,22 75,34 50,46 25,34" fill="#38bdf8" opacity="0.3" />
          </svg>
        </div>

        {/* Title Lockup */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-md uppercase">
          CUBIVERSE <span className="text-cyan-400">3D</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-md font-medium leading-relaxed">
          Puzzles spatiaux de blocs en apesanteur. Équilibrez le monolithe et découvrez les mystères des dimensions.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              soundFx.playClick();
              onStartGame();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>COMMENCER (ESPACE)</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onOpenLevelSelect();
            }}
            className="w-full sm:w-auto px-5 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-base transition-all hover:text-white flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Grid className="w-5 h-5 text-cyan-400" />
            <span>NIVEAUX (1–10)</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onOpenMultiplayer();
            }}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/70 text-purple-200 font-bold text-base transition-all hover:text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:border-purple-400"
          >
            <Users className="w-5 h-5 text-purple-400" />
            <span>INVITER DES AMIS</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onOpenRules();
            }}
            className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
            title="Comment jouer / Règles"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Control-Hint Footer Line */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-slate-400/90 font-mono tracking-wide text-center">
        <span>Flèches / ZQSD Rouler</span>
        <span className="hidden sm:inline">•</span>
        <span>Espace Valider</span>
        <span className="hidden sm:inline">•</span>
        <span>R Recommencer</span>
        <span className="hidden sm:inline">•</span>
        <span>Z Annuler (Undo)</span>
        <span className="hidden sm:inline">•</span>
        <span>Échap Pause</span>
      </div>
    </div>
  );
};
