/**
 * Rules and mechanics guide modal for Cubiverse 3D.
 */

import React from 'react';
import { X, ShieldCheck, Box, Disc, Diamond, Flame, Layers } from 'lucide-react';
import { soundFx } from '../game/audio';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-none select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 flex flex-col max-h-[85vh] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Guide des Énigmes 3D</h2>
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

        <div className="overflow-y-auto pr-1 my-4 space-y-4 text-xs sm:text-sm text-slate-300">
          {/* Rule 1 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <Box className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white">Le Monolithe Spatial (1x1x2)</h3>
              <p className="mt-1 text-slate-400">
                Vous contrôlez un monolithe de 2 unités de long. Il bascule dans les 4 directions et alterne entre la position <strong>Debout</strong> (occupe 1 case) et <strong>Couché</strong> (occupe 2 cases).
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 shrink-0 flex items-center justify-center text-[10px] text-emerald-300 font-bold mt-0.5">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-white">L'Objectif du Sanctuaire</h3>
              <p className="mt-1 text-slate-400">
                Pour remporter un niveau, le monolithe doit atterrir <strong>DEBOUT</strong> sur le vortex vert étincelant. Passer dessus à l'horizontale ne valide pas l'épreuve !
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <Disc className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white">Interrupteur Souple (Cercle Bleu)</h3>
              <p className="mt-1 text-slate-400">
                S'active dès que n'importe quelle partie du bloc entre en contact avec la dalle (debout ou couché). Déploie ou rétracte un pont énergétique.
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <Diamond className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white">Dalle de Pression Lourde (Losange Rose)</h3>
              <p className="mt-1 text-slate-400">
                Exige une masse concentrée : seul le monolithe <strong>DEBOUT</strong> a le poids suffisant pour l'actionner. Rouler dessus à plat n'a aucun effet.
              </p>
            </div>
          </div>

          {/* Rule 5 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <Flame className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white">Dalles Fragiles en Obsidienne (Orange)</h3>
              <p className="mt-1 text-slate-400">
                Ces dalles fissurées se brisent sous votre poids si vous vous dressez <strong>debout</strong> dessus ! Vous pouvez en revanche rouler dessus en position allongée car votre masse est répartie.
              </p>
            </div>
          </div>

          {/* Rule 6 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <Layers className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white">Scission Quantique (Téléporteur Violet)</h3>
              <p className="mt-1 text-slate-400">
                Divise le monolithe en deux cubes compagnons 1x1 indépendants. Utilisez la touche <strong>[Tab]</strong> pour basculer le contrôle entre eux. Rapprochez-les pour les refusionner en un bloc unifié !
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm cursor-pointer transition-all"
        >
          COMPRIS, C'EST PARTI !
        </button>
      </div>
    </div>
  );
};
