import React, { useState } from 'react';
import { Character, SpecialCard, Aspect, Stunt, Consequence } from '../types/fate';
import { calculateCharacterCardBonuses, calculateStressBoxesCount, FATE_LADDER, DEFAULT_FATE_SKILLS } from '../utils/fateLadder';
import { CardItem } from './CardItem';
import { sfx } from '../utils/sound';
import {
  User,
  Shield,
  Brain,
  Sparkles,
  Flame,
  Plus,
  Minus,
  Edit3,
  Dices,
  BookOpen,
  PlusCircle,
  Trash2,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  Zap,
  Activity,
  HeartPulse,
  Eye,
  SlidersHorizontal,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CharacterSheetProps {
  character: Character;
  allCards: SpecialCard[];
  onUpdateCharacter: (updated: Character) => void;
  onQuickRoll: (rollerName: string, skillName: string, skillBonus: number, cardBonus: number) => void;
  onUnassignCard: (cardId: string) => void;
  onAssignCard: (cardId: string, characterId: string) => void;
  isGM?: boolean;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
  allCards,
  onUpdateCharacter,
  onQuickRoll,
  onUnassignCard,
  onAssignCard,
  isGM = true,
}) => {
  // Mode: 'simple' (Sade Oyuncu HUD) vs 'full' (Detaylı Sayfa)
  const [viewMode, setViewMode] = useState<'simple' | 'full'>('simple');
  const [isEditingAspects, setIsEditingAspects] = useState<boolean>(false);
  const [isEditingSkills, setIsEditingSkills] = useState<boolean>(false);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState<boolean>(false);

  // Dynamic calculations from cards
  const { skillBonuses, extraPhysicalStress, extraMentalStress, extraFatePoints, assignedCards } =
    calculateCharacterCardBonuses(character.id, allCards);

  // Stress box counts
  const physiqueLevel = (character.skills['Fizik'] || 0) + (skillBonuses['Fizik'] || 0);
  const willLevel = (character.skills['İrade'] || 0) + (skillBonuses['İrade'] || 0);

  const physicalBoxCount = calculateStressBoxesCount(physiqueLevel, extraPhysicalStress);
  const mentalBoxCount = calculateStressBoxesCount(willLevel, extraMentalStress);

  // Toggle stress box check
  const togglePhysicalStress = (index: number) => {
    const current = [...character.physicalStress];
    while (current.length < physicalBoxCount) current.push(false);
    current[index] = !current[index];
    onUpdateCharacter({ ...character, physicalStress: current });
    sfx.playSuccessSound();
  };

  const toggleMentalStress = (index: number) => {
    const current = [...character.mentalStress];
    while (current.length < mentalBoxCount) current.push(false);
    current[index] = !current[index];
    onUpdateCharacter({ ...character, mentalStress: current });
    sfx.playSuccessSound();
  };

  // Fate points adjustments
  const adjustFatePoints = (delta: number) => {
    const next = Math.max(0, character.fatePoints + delta);
    onUpdateCharacter({ ...character, fatePoints: next });
    if (delta > 0) sfx.playSuccessSound();
  };

  // Update consequence
  const handleConsequenceChange = (index: number, text: string) => {
    const next = [...character.consequences];
    next[index] = {
      ...next[index],
      aspect: text,
      used: text.trim().length > 0,
    };
    onUpdateCharacter({ ...character, consequences: next });
  };

  // Active skills (with value > 0 or card bonuses)
  const activeSkillsList = (Object.entries(character.skills) as [string, number][])
    .filter(([_, val]) => Number(val) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  // Unassigned cards pool
  const unassignedCards = allCards.filter((c) => !c.assignedCharacterId);

  return (
    <div id={`sheet-${character.id}`} className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top Character Header / Compact Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-500/60 bg-zinc-950 shadow-lg shrink-0">
              {character.avatarUrl ? (
                <img
                  src={character.avatarUrl}
                  alt={character.name}
                  referrerPolicy="no-referrer"
                  style={{
                    objectPosition: character.avatarPosition || '50% 50%',
                    transform: character.avatarScale ? `scale(${character.avatarScale})` : undefined,
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <User className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-white truncate">{character.name}</h1>
                {character.playerName && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 truncate max-w-[140px]">
                    👤 {character.playerName}
                  </span>
                )}
                {/* Optional Location Badge */}
                <button
                  type="button"
                  onClick={() => {
                    const nextLoc = prompt('Karakterin Konumu (Boş bırakabilirsiniz):', character.location || '');
                    if (nextLoc !== null) {
                      onUpdateCharacter({ ...character, location: nextLoc.trim() || 'Bilinmiyor' });
                    }
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-orange-300 hover:text-orange-200 border border-orange-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Konumu Değiştir / Belirle"
                >
                  <MapPin className="w-3 h-3 text-orange-400" />
                  <span>{character.location || 'Bilinmiyor'}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-amber-300 mt-0.5 line-clamp-1">
                ★ {character.highConcept}
              </p>
              <p className="text-[11px] sm:text-xs text-rose-400 italic line-clamp-1">
                ⚡ {character.trouble}
              </p>
            </div>
          </div>

          {/* Quick Stats & View Mode Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
            {/* View Mode Toggle: Sade (Clean HUD) vs Detaylı (Full Sheet) */}
            <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('simple')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'simple'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Sade Oyuncu Paneli"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Sade HUD</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'full'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Detaylı Karakter Kağıdı"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Detaylı</span>
              </button>
            </div>

            {/* Quick Fate Dice Roller Launcher */}
            <button
              type="button"
              onClick={() => onQuickRoll(character.name, '', 0, 0)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Dices className="w-4 h-4" />
              <span>Zar At</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SADE OYUNCU MODU (STREAMLINED PLAYER HUD - MOBILE FIRST) */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'simple' ? (
        <div className="space-y-4">
          {/* Quick HUD Strip: Fate Points + Stress Tracks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Fate Points Counter */}
            <div className="bg-gradient-to-br from-zinc-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Kader Puanı (Fate Points)
                </span>
                <span className="text-[11px] text-zinc-400">Yenileme: +{character.refresh}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustFatePoints(-1)}
                  className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                  aria-label="Kader puanı azalt"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono text-3xl font-black text-amber-400">
                  {character.fatePoints}
                </span>
                <button
                  type="button"
                  onClick={() => adjustFatePoints(1)}
                  className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-zinc-950 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors shadow-md shadow-amber-500/30"
                  aria-label="Kader puanı artır"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Physical Stress */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Fiziksel Stres
                </span>
                {extraPhysicalStress > 0 && (
                  <span className="text-[10px] text-amber-300 font-bold">+{extraPhysicalStress} Kart</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: physicalBoxCount }).map((_, idx) => {
                  const marked = !!character.physicalStress[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => togglePhysicalStress(idx)}
                      className={`flex-1 min-h-[44px] rounded-xl border flex flex-col items-center justify-center font-mono font-black text-sm transition-all cursor-pointer active:scale-95 ${
                        marked
                          ? 'bg-rose-950 border-rose-500 text-rose-200 shadow-rose-500/30 shadow-md ring-1 ring-rose-500'
                          : 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-emerald-400'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      <span className="text-[10px]">{marked ? '✕' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Mental Stress */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  Zihinsel Stres
                </span>
                {extraMentalStress > 0 && (
                  <span className="text-[10px] text-amber-300 font-bold">+{extraMentalStress} Kart</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: mentalBoxCount }).map((_, idx) => {
                  const marked = !!character.mentalStress[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleMentalStress(idx)}
                      className={`flex-1 min-h-[44px] rounded-xl border flex flex-col items-center justify-center font-mono font-black text-sm transition-all cursor-pointer active:scale-95 ${
                        marked
                          ? 'bg-purple-950 border-purple-500 text-purple-200 shadow-purple-500/30 shadow-md ring-1 ring-purple-500'
                          : 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-cyan-400'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      <span className="text-[10px]">{marked ? '✕' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick-Tap Skills Grid (Designed for Instant Touch Rolls) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Dices className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Hızlı Beceri Zar Masası (d20 + Bonus)
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Beceriye dokununca 20'lik zar (d20) beceri ve kart bonuslarıyla anında atılır.
                  </p>
                </div>
              </div>
            </div>

            {/* Grid of active skills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {DEFAULT_FATE_SKILLS.map((skillName) => {
                const baseValue = character.skills[skillName] || 0;
                const cardBonus = skillBonuses[skillName] || 0;
                const totalValue = baseValue + cardBonus;

                if (baseValue === 0 && cardBonus === 0) return null;

                return (
                  <button
                    key={skillName}
                    type="button"
                    onClick={() => onQuickRoll(character.name, skillName, baseValue, cardBonus)}
                    className="p-3 rounded-xl bg-zinc-950/90 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/60 transition-all flex items-center justify-between group active:scale-[0.97] cursor-pointer shadow-sm text-left"
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-emerald-300 truncate">
                        {skillName}
                      </p>
                      {cardBonus > 0 && (
                        <span className="text-[10px] text-amber-400 font-semibold block">
                          +{cardBonus} Kart
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-black text-sm shrink-0">
                      +{totalValue}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column: Aspects & Consequences (Left) | Assigned Cards (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Aspects & Consequences (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Active Aspects */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg">
                <h3 className="text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Yönler (Aspects)
                </h3>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-amber-500/30">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Ana Konsept (High Concept)
                    </span>
                    <p className="text-xs font-semibold text-zinc-100 mt-0.5">{character.highConcept}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-rose-500/30">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                      Bela (Trouble)
                    </span>
                    <p className="text-xs font-medium text-zinc-200 mt-0.5">{character.trouble}</p>
                  </div>

                  {character.aspects.map((asp, idx) => (
                    <div key={asp.id || idx} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        {asp.label}
                      </span>
                      <p className="text-xs text-zinc-200 mt-0.5">{asp.value || '— Tanımlanmadı —'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consequences */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg">
                <h3 className="text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  Sonuçlar & Yaralar (Consequences)
                </h3>
                <div className="space-y-2">
                  {character.consequences.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                      <span className="text-xs font-mono font-bold text-amber-400 whitespace-nowrap min-w-[70px]">
                        {c.type}
                      </span>
                      <input
                        type="text"
                        value={c.aspect}
                        onChange={(e) => handleConsequenceChange(i, e.target.value)}
                        placeholder="Yara / Sonuç yönü..."
                        className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
                      />
                      {c.aspect && (
                        <button
                          type="button"
                          onClick={() => handleConsequenceChange(i, '')}
                          className="text-zinc-500 hover:text-rose-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Assigned Cards & Relics (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Aktif Kartlarım ({assignedCards.length})
                    </h3>
                  </div>
                  {isGM && (
                    <button
                      type="button"
                      onClick={() => setIsAssignDrawerOpen(true)}
                      className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Kart Ata</span>
                    </button>
                  )}
                </div>

                {assignedCards.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-zinc-950 border border-dashed border-zinc-800">
                    <Sparkles className="w-6 h-6 text-zinc-600 mx-auto mb-1.5" />
                    <p className="text-xs text-zinc-400">
                      Bu karaktere henüz özel yetenek veya yadigar kartı atanmadı.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {assignedCards.map((card) => (
                      <CardItem
                        key={card.id}
                        card={card}
                        isGM={isGM}
                        compact={true}
                        onAssignToggle={() => onUnassignCard(card.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Stunts / Nitelikler */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg">
                <h3 className="text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Stuntlar & Nitelikler
                </h3>
                <div className="space-y-2">
                  {character.stunts.map((st) => (
                    <div key={st.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <h4 className="text-xs font-bold text-amber-300">{st.name}</h4>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{st.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* DETAYLI GÖRÜNÜM (FULL EDITABLE CHARACTER SHEET) */
        /* ------------------------------------------------------------- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column: Aspects, Skills, Stress, Consequences (7 cols) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {/* Aspects Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Yönler (Aspects)
                </h2>
                {isGM && (
                  <button
                    type="button"
                    onClick={() => setIsEditingAspects(!isEditingAspects)}
                    className="text-xs text-zinc-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingAspects ? 'Tamamla' : 'Düzenle'}</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    Ana Konsept (High Concept)
                  </span>
                  {isEditingAspects ? (
                    <input
                      type="text"
                      value={character.highConcept}
                      onChange={(e) => onUpdateCharacter({ ...character, highConcept: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white mt-1"
                    />
                  ) : (
                    <span className="text-sm text-zinc-100 font-semibold">{character.highConcept}</span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-rose-500/30">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                    Bela (Trouble)
                  </span>
                  {isEditingAspects ? (
                    <input
                      type="text"
                      value={character.trouble}
                      onChange={(e) => onUpdateCharacter({ ...character, trouble: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white mt-1"
                    />
                  ) : (
                    <span className="text-sm text-zinc-100 font-medium">{character.trouble}</span>
                  )}
                </div>

                {character.aspects.map((asp, idx) => (
                  <div key={asp.id || idx} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      {asp.label}
                    </span>
                    {isEditingAspects ? (
                      <input
                        type="text"
                        value={asp.value}
                        onChange={(e) => {
                          const next = [...character.aspects];
                          next[idx] = { ...next[idx], value: e.target.value };
                          onUpdateCharacter({ ...character, aspects: next });
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white mt-1"
                      />
                    ) : (
                      <span className="text-sm text-zinc-200">{asp.value || '— Tanımlanmadı —'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Section with Auto-Calculated Card Bonuses */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Beceriler & Otomatik Kart Bonusları
                  </h2>
                </div>
                {isGM && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSkills(!isEditingSkills)}
                    className="text-xs text-zinc-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingSkills ? 'Tamamla' : 'Becerileri Düzenle'}</span>
                  </button>
                )}
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEFAULT_FATE_SKILLS.map((skillName) => {
                  const baseValue = character.skills[skillName] || 0;
                  const cardBonus = skillBonuses[skillName] || 0;
                  const totalValue = baseValue + cardBonus;

                  if (baseValue === 0 && cardBonus === 0 && !isEditingSkills) {
                    return null;
                  }

                  return (
                    <div
                      key={skillName}
                      onClick={() => {
                        if (!isEditingSkills) {
                          onQuickRoll(character.name, skillName, baseValue, cardBonus);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        isEditingSkills
                          ? 'bg-zinc-950 border-zinc-800'
                          : 'bg-zinc-950/80 hover:bg-zinc-800/80 border-zinc-800/80 hover:border-emerald-500/50 cursor-pointer group shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="font-semibold text-xs sm:text-sm text-zinc-200 group-hover:text-emerald-300 transition-colors truncate">
                          {skillName}
                        </span>
                        {cardBonus > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 shrink-0">
                            +{cardBonus}
                          </span>
                        )}
                      </div>

                      {isEditingSkills ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...character.skills, [skillName]: Math.max(0, baseValue - 1) };
                              onUpdateCharacter({ ...character, skills: next });
                            }}
                            className="p-1 rounded bg-zinc-800 text-zinc-300 text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs text-white">
                            +{baseValue}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...character.skills, [skillName]: baseValue + 1 };
                              onUpdateCharacter({ ...character, skills: next });
                            }}
                            className="p-1 rounded bg-zinc-800 text-zinc-300 text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs sm:text-sm">
                            +{totalValue}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stress & Consequences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Physical Stress */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Fiziksel Stres
                  </span>
                  {extraPhysicalStress > 0 && (
                    <span className="text-[10px] text-amber-300 font-semibold">
                      +{extraPhysicalStress} Kart
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {Array.from({ length: physicalBoxCount }).map((_, idx) => {
                    const marked = !!character.physicalStress[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => togglePhysicalStress(idx)}
                        className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center font-mono font-bold text-sm transition-all cursor-pointer ${
                          marked
                            ? 'bg-rose-900/80 border-rose-500 text-rose-200 shadow-rose-500/30 shadow-md'
                            : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-emerald-400'
                        }`}
                      >
                        <span>{idx + 1}</span>
                        <span className="text-[8px]">{marked ? 'X' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mental Stress */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    Zihinsel Stres
                  </span>
                  {extraMentalStress > 0 && (
                    <span className="text-[10px] text-amber-300 font-semibold">
                      +{extraMentalStress} Kart
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {Array.from({ length: mentalBoxCount }).map((_, idx) => {
                    const marked = !!character.mentalStress[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleMentalStress(idx)}
                        className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center font-mono font-bold text-sm transition-all cursor-pointer ${
                          marked
                            ? 'bg-purple-900/80 border-purple-500 text-purple-200 shadow-purple-500/30 shadow-md'
                            : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-cyan-400'
                        }`}
                      >
                        <span>{idx + 1}</span>
                        <span className="text-[8px]">{marked ? 'X' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Consequences */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg">
              <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Sonuçlar / Yaralar (Consequences)
              </h3>
              <div className="space-y-2">
                {character.consequences.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    <span className="text-xs font-mono font-bold text-amber-400 whitespace-nowrap min-w-[70px]">
                      {c.type}
                    </span>
                    <input
                      type="text"
                      value={c.aspect}
                      onChange={(e) => handleConsequenceChange(i, e.target.value)}
                      placeholder="Yara / Sonuç yönü yazın..."
                      className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
                    />
                    {c.aspect && (
                      <button
                        type="button"
                        onClick={() => handleConsequenceChange(i, '')}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Assigned Special Cards & Stunts (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* Active Assigned Cards Panel */}
            <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Aktif Kartlar ({assignedCards.length})
                    </h3>
                  </div>
                </div>

                {isGM && (
                  <button
                    type="button"
                    onClick={() => setIsAssignDrawerOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Kart Ata</span>
                  </button>
                )}
              </div>

              {assignedCards.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-zinc-950 border border-dashed border-zinc-800">
                  <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">
                    Bu karaktere henüz özel yetenek veya yadigar kartı aktarılmadı.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {assignedCards.map((card) => (
                    <CardItem
                      key={card.id}
                      card={card}
                      isGM={isGM}
                      onAssignToggle={() => onUnassignCard(card.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Stunts / Nitelikler */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Stuntlar & Nitelikler
              </h3>
              <div className="space-y-2.5">
                {character.stunts.map((st) => (
                  <div key={st.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                    <h4 className="text-xs font-bold text-amber-300">{st.name}</h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{st.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Modal to Assign an unassigned card to this character */}
      {isAssignDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                {character.name} İçin Kart Seç
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Aşağıdaki boşta duran özel yetenek ve yadigar kartlarından birini seçerek bu karaktere aktarın.
            </p>

            {unassignedCards.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-950 rounded-xl">
                GM havuzunda boşta kart kalmadı. "Özel Kartlar" sekmesinden yeni kart tasarlayabilirsiniz.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {unassignedCards.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {c.imageUrl && (
                        <img src={c.imageUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                        <span className="text-[10px] text-zinc-400 block truncate">{c.subtitle || c.type}</span>
                        {c.bonuses && c.bonuses.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {c.bonuses.map((b, i) => (
                              <span key={i} className="text-[10px] text-amber-300 font-mono">
                                +{b.value} {b.targetSkill || b.type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onAssignCard(c.id, character.id);
                        sfx.playCardAssignSound();
                        setIsAssignDrawerOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Ata
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
