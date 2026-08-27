import React, { useState } from 'react';
import { SceneAspect, Character, NPC, SpecialCard } from '../types/fate';
import { calculateCharacterCardBonuses } from '../utils/fateLadder';
import {
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  Swords,
  Shield,
  Dices,
  Flame,
  User,
  Check,
  X,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SceneTrackerProps {
  currentLocation: string;
  locations: string[];
  onChangeLocation: (newLoc: string) => void;
  sceneAspects: SceneAspect[];
  onUpdateAspects: (aspects: SceneAspect[]) => void;
  characters: Character[];
  npcs: NPC[];
  allCards: SpecialCard[];
  onQuickRoll: (rollerName: string, skillName: string, skillBonus: number, cardBonus: number) => void;
  isGM?: boolean;
}

export const SceneTracker: React.FC<SceneTrackerProps> = ({
  currentLocation,
  locations,
  onChangeLocation,
  sceneAspects,
  onUpdateAspects,
  characters,
  npcs,
  allCards,
  onQuickRoll,
  isGM = true,
}) => {
  const [newAspectText, setNewAspectText] = useState<string>('');
  const [newAspectZone, setNewAspectZone] = useState<string>('');
  const [newAspectInvokes, setNewAspectInvokes] = useState<number>(1);

  // NPCs located at the current scene location
  const npcsHere = npcs.filter((n) => n.location === currentLocation);
  const npcsInEncounter = npcs.filter((n) => n.isInEncounter);

  const addSceneAspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAspectText.trim()) return;

    const newAsp: SceneAspect = {
      id: `sa-${Date.now()}`,
      text: newAspectText.trim(),
      zone: newAspectZone.trim() || undefined,
      freeInvokes: newAspectInvokes,
    };

    onUpdateAspects([...sceneAspects, newAsp]);
    setNewAspectText('');
    setNewAspectZone('');
    setNewAspectInvokes(1);
  };

  const adjustInvokes = (id: string, delta: number) => {
    const next = sceneAspects.map((asp) => {
      if (asp.id === id) {
        return { ...asp, freeInvokes: Math.max(0, asp.freeInvokes + delta) };
      }
      return asp;
    });
    onUpdateAspects(next);
  };

  const removeAspect = (id: string) => {
    onUpdateAspects(sceneAspects.filter((a) => a.id !== id));
  };

  return (
    <div id="fate-scene-tracker" className="space-y-6">
      {/* Location Selector & Active Scene Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              Aktif Sahne & Karşılaşma Konumu
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={currentLocation}
                onChange={(e) => onChangeLocation(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-base sm:text-lg font-bold text-white focus:outline-none focus:border-cyan-500"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">
            Bu Konumdaki NPC Sayısı:{' '}
            <strong className="text-amber-400 font-bold">{npcsHere.length}</strong>
          </span>
        </div>
      </div>

      {/* 2-Column: Scene Aspects & Zones Left | Turn & Encounter Tracker Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scene Aspects (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  Sahne Yönleri (Scene Aspects & Zones)
                </h3>
              </div>
              <span className="text-xs text-zinc-400">{sceneAspects.length} Yön Aktif</span>
            </div>

            {/* Add Aspect Form */}
            {isGM && (
              <form onSubmit={addSceneAspect} className="mb-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newAspectText}
                    onChange={(e) => setNewAspectText(e.target.value)}
                    placeholder="Yeni Sahne Yönü (Örn: Alev Alan Kütüphane)..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    value={newAspectZone}
                    onChange={(e) => setNewAspectZone(e.target.value)}
                    placeholder="Bölge / Zone"
                    className="w-full sm:w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>Serbest Invoke:</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={newAspectInvokes}
                      onChange={(e) => setNewAspectInvokes(Number(e.target.value))}
                      className="w-12 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-white font-mono font-bold text-center"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yönü Sahneye Ekle</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Aspects */}
            {sceneAspects.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">
                Bu sahnede henüz aktif yön veya durum bulunmuyor.
              </p>
            ) : (
              <div className="space-y-2.5">
                {sceneAspects.map((asp) => (
                  <div
                    key={asp.id}
                    className="p-3 rounded-xl bg-zinc-950/80 border border-cyan-500/30 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{asp.text}</span>
                        {asp.zone && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-cyan-300 text-[10px] border border-cyan-500/30 font-medium">
                            📍 {asp.zone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 text-xs">
                        <span className="text-zinc-400 text-[10px] mr-1">Serbest Invoke:</span>
                        <button
                          type="button"
                          onClick={() => adjustInvokes(asp.id, -1)}
                          className="w-4 h-4 rounded bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-amber-400 w-4 text-center">
                          {asp.freeInvokes}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustInvokes(asp.id, 1)}
                          className="w-4 h-4 rounded bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>

                      {isGM && (
                        <button
                          type="button"
                          onClick={() => removeAspect(asp.id)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950 text-zinc-500 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Combatants / Encounter Participants (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-white text-sm">
                  Aktif Çatışma & Karşılaşma Katılımcıları
                </h3>
              </div>
              <span className="text-xs text-zinc-400">{characters.length + npcsHere.length} Katılımcı</span>
            </div>

            {/* PC Combatants */}
            <div className="space-y-2 mb-4">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Oyuncu Karakterleri (PCs)
              </span>
              {characters.map((pc) => {
                const { skillBonuses } = calculateCharacterCardBonuses(pc.id, allCards);
                const fightSkill = (pc.skills['Dövüş'] || 0) + (skillBonuses['Dövüş'] || 0);

                return (
                  <div
                    key={pc.id}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {pc.avatarUrl && (
                        <img src={pc.avatarUrl} alt={pc.name} className="w-8 h-8 rounded-lg object-cover" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{pc.name}</h4>
                        <span className="text-[10px] text-amber-300">Kader Puanı: {pc.fatePoints}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onQuickRoll(pc.name, 'Dövüş', pc.skills['Dövüş'] || 0, skillBonuses['Dövüş'] || 0)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-emerald-300 font-mono font-bold flex items-center gap-1"
                      title="Dövüş Zarı At"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Dövüş +{fightSkill}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* NPCs at Current Location */}
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Bu Konumdaki NPC'ler ({npcsHere.length})
              </span>
              {npcsHere.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-2">
                  Bu konumda henüz NPC bulunmuyor. (NPC panelinden konum taşıyabilirsiniz)
                </p>
              ) : (
                npcsHere.map((npc) => (
                  <div
                    key={npc.id}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {npc.avatarUrl && (
                        <img src={npc.avatarUrl} alt={npc.name} className="w-8 h-8 rounded-lg object-cover" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{npc.name}</h4>
                        <span className="text-[10px] text-zinc-400">{npc.category === 'main' ? '👑 Boss' : npc.category}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onQuickRoll(npc.name, 'Dövüş', npc.skills['Dövüş'] || 0, 0)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-orange-300 font-mono font-bold flex items-center gap-1"
                      title="NPC Dövüş Zarı At"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>+{npc.skills['Dövüş'] || 0}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
