/**
 * Multiplayer & Friend Invite Modal for Cubiverse 3D.
 * Allows instant room creation, 1-click invitation link copying,
 * QR Code generation, and real-time live duel lobby.
 */

import React, { useState } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Play,
  Share2,
  Sparkles,
  QrCode,
  Crown,
  CheckCircle2,
  Clock,
  Swords,
} from 'lucide-react';
import { soundFx } from '../game/audio';
import { LEVELS } from '../game/levels';
import { mpClient, RoomState } from '../game/multiplayerClient';

interface MultiplayerModalProps {
  roomState: RoomState | null;
  myId: string | null;
  playerName: string;
  onSetPlayerName: (name: string) => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  roomState,
  myId,
  playerName,
  onSetPlayerName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'CREATE' | 'JOIN'>(roomState ? 'CREATE' : 'CREATE');
  const [inputCode, setInputCode] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState(roomState?.levelId || 1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isHost = roomState?.players.find((p) => p.id === myId)?.isHost ?? false;
  const myPlayer = roomState?.players.find((p) => p.id === myId);

  // Generate public invitation URL
  const inviteUrl = roomState
    ? `${window.location.origin}${window.location.pathname}?room=${roomState.code}`
    : '';

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    soundFx.playClick();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!roomState) return;
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    soundFx.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareNative = async () => {
    if (navigator.share && roomState) {
      try {
        await navigator.share({
          title: 'Cubiverse 3D - Défi de puzzle !',
          text: `Viens m'affronter sur le puzzle 3D Cubiverse ! Code de salle : ${roomState.code}`,
          url: inviteUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCreateRoom = async () => {
    try {
      setErrorMessage(null);
      soundFx.playClick();
      await mpClient.createRoom(playerName || 'Explorateur', selectedLevelId);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de la création du salon');
    }
  };

  const handleJoinRoom = async () => {
    if (!inputCode.trim()) {
      setErrorMessage('Veuillez entrer un code de salon');
      return;
    }
    try {
      setErrorMessage(null);
      soundFx.playClick();
      await mpClient.joinRoom(inputCode.trim().toUpperCase(), playerName || 'Ami');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de la connexion');
    }
  };

  const handleToggleReady = () => {
    if (!myPlayer) return;
    soundFx.playClick();
    mpClient.toggleReady(!myPlayer.ready);
  };

  const handleStartRace = () => {
    soundFx.playClick();
    mpClient.startRace();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-none select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-400">
              <Swords className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                Mode Multijoueur
              </span>
              <h2 className="text-xl font-bold text-white">Jouer avec des Amis</h2>
            </div>
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

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Content: In Lobby vs Setup */}
        {roomState ? (
          /* ACTIVE LOBBY VIEW */
          <div className="flex flex-col gap-4 my-4 overflow-y-auto pr-1">
            {/* Room Code & Share Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/50 to-slate-900 border border-cyan-500/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-cyan-300 uppercase">Code du Salon</span>
                  <div className="text-3xl font-black font-mono tracking-wider text-white">
                    {roomState.code}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    title="Copier le code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copié !' : 'Code'}</span>
                  </button>

                  <button
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer"
                    title="Afficher le QR Code"
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>

              {/* QR Code view */}
              {showQrCode && (
                <div className="p-3 bg-white rounded-xl mx-auto my-2 text-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      inviteUrl
                    )}`}
                    alt="Scan QR to Join"
                    className="w-36 h-36 mx-auto"
                  />
                  <p className="text-[11px] text-slate-800 font-sans font-semibold mt-1">
                    Scannez pour rejoindre la partie
                  </p>
                </div>
              )}

              {/* Direct Link Share Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Lien d\'invitation copié !' : 'Copier le lien d\'invitation'}</span>
                </button>

                <button
                  onClick={handleShareNative}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer"
                  title="Partager"
                >
                  <Share2 className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>

            {/* Level Selection for Host */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-300 font-medium">Niveau du Défi :</span>
              {isHost ? (
                <select
                  value={roomState.levelId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedLevelId(id);
                    mpClient.changeLevel(id);
                  }}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      #{lvl.id} - {lvl.nameFr} ({lvl.difficulty})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-cyan-400">
                  Niveau {roomState.levelId} : {LEVELS[roomState.levelId - 1]?.nameFr}
                </span>
              )}
            </div>

            {/* Players List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>JOUEURS ({roomState.players.length}/6)</span>
                <span>STATUT</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {roomState.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-850 border border-slate-800 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {p.isHost && <Crown className="w-4 h-4 text-amber-400" />}
                      <span className="font-semibold text-white">
                        {p.name} {p.id === myId ? '(Vous)' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.ready ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Prêt</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>En attente</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions: Ready / Start */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800 mt-2">
              <button
                onClick={handleToggleReady}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  myPlayer?.ready
                    ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-900'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
                }`}
              >
                {myPlayer?.ready ? '✓ Prêt ! (Cliquez pour annuler)' : 'Se déclarer Prêt'}
              </button>

              {isHost && (
                <button
                  onClick={handleStartRace}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-98 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>LANCER LE DUEL !</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* CREATE OR JOIN TABS */
          <div className="flex flex-col gap-4 my-4">
            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('CREATE');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'CREATE'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Créer un Salon
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('JOIN');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'JOIN'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rejoindre un Salon
              </button>
            </div>

            {/* Pseudo Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Votre Pseudo :</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => onSetPlayerName(e.target.value)}
                maxLength={16}
                placeholder="Ex: Alex, Maître-Cube..."
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            {activeTab === 'CREATE' ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Niveau de départ :</label>
                  <select
                    value={selectedLevelId}
                    onChange={(e) => setSelectedLevelId(Number(e.target.value))}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        Niveau {lvl.id} : {lvl.nameFr} ({lvl.difficulty})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateRoom}
                  className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  CRÉER LE SALON & OBTENIR LE LIEN
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Code du Salon (5 lettres) :</label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="Ex: CUBIX"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase text-base tracking-widest focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  REJOINDRE LE SALON
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
