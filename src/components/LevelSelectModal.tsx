/**
 * Level Selection Modal for Cubiverse 3D.
 * Displays all 10 handcrafted levels, difficulty badges, and earned stars.
 */

import React from 'react';
import { X, Star, Lock, Play, Sparkles } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { soundFx } from '../game/audio';

interface LevelSelectModalProps {
  currentLevelId: number;
  unlockedLevelMax: number;
  completedScores: Record<number, { stars: number; bestMoves: number }>;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevelId,
  unlockedLevelMax,
  completedScores,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-none select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Progression Spatiale
            </span>
            <h2 className="text-2xl font-black text-white">Sélection des Mondes</h2>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 overflow-y-auto pr-1">
          {LEVELS.map((lvl) => {
            const isUnlocked = lvl.id <= unlockedLevelMax;
            const isCurrent = lvl.id === currentLevelId;
            const score = completedScores[lvl.id];

            return (
              <button
                key={lvl.id}
                disabled={!isUnlocked}
                onClick={() => {
                  soundFx.playClick();
                  onSelectLevel(lvl.id);
                  onClose();
                }}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-2 ${
                  !isUnlocked
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                    : isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.2)] cursor-pointer hover:border-cyan-400'
                    : 'bg-slate-850 hover:bg-slate-800 border-slate-700/70 hover:border-slate-500 cursor-pointer'
                }`}
              >
                {/* Top row: id, name, difficulty */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      #{lvl.id}
                    </span>
                    <span className="text-sm font-bold text-white truncate max-w-[150px]">
                      {lvl.nameFr}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      lvl.difficulty === 'Facile'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                        : lvl.difficulty === 'Moyen'
                        ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                        : lvl.difficulty === 'Difficile'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                        : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                    }`}
                  >
                    {lvl.difficulty}
                  </span>
                </div>

                {/* Description snippet */}
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {lvl.descriptionFr}
                </p>

                {/* Bottom row: Stars & Best Moves */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 w-full">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          score && s <= score.stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {isUnlocked ? (
                    <div className="text-[11px] font-mono text-slate-400">
                      {score ? (
                        <span className="text-emerald-400 font-bold">{score.bestMoves} coups</span>
                      ) : (
                        <span className="text-slate-500">Non terminé</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <Lock className="w-3 h-3" />
                      <span>Verrouillé</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Chaque niveau réussi débloque l'épreuve suivante.</span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
