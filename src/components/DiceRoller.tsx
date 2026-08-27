import React, { useState, useEffect } from 'react';
import { DiceRollOutcome, Character, NPC, PolyhedralDieType } from '../types/fate';
import { DEFAULT_FATE_SKILLS } from '../utils/fateLadder';
import { sfx } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Dices,
  Sparkles,
  Flame,
  Plus,
  Minus,
  RotateCcw,
  History,
  Volume2,
  VolumeX,
  EyeOff,
  X,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DiceRollerProps {
  characters: Character[];
  npcs: NPC[];
  initialRollerName?: string;
  initialSkillName?: string;
  initialSkillBonus?: number;
  initialCardBonus?: number;
  onRollComplete?: (outcome: DiceRollOutcome) => void;
  rollHistory: DiceRollOutcome[];
  onClearHistory?: () => void;
  isGM?: boolean;
  onClose?: () => void;
}

const DIE_PRESETS: { type: PolyhedralDieType; label: string; sides: number; iconText: string }[] = [
  { type: 'd20', label: 'd20 (Ana Zar)', sides: 20, iconText: 'D20' },
  { type: 'd8', label: 'd8 (Silah/Hasar)', sides: 8, iconText: 'D8' },
  { type: 'd6', label: 'd6', sides: 6, iconText: 'D6' },
  { type: 'd10', label: 'd10', sides: 10, iconText: 'D10' },
  { type: 'd12', label: 'd12', sides: 12, iconText: 'D12' },
  { type: 'd4', label: 'd4', sides: 4, iconText: 'D4' },
  { type: 'd100', label: 'd100 (%)', sides: 100, iconText: '%' },
  { type: '4dF', label: '4dF (Fate)', sides: 0, iconText: 'Fate' },
];

export const DiceRoller: React.FC<DiceRollerProps> = ({
  characters,
  npcs,
  initialRollerName = '',
  initialSkillName = '',
  initialSkillBonus = 0,
  initialCardBonus = 0,
  onRollComplete,
  rollHistory,
  onClearHistory,
  isGM = true,
  onClose,
}) => {
  const [selectedDieType, setSelectedDieType] = useState<PolyhedralDieType>('d20');
  const [diceCount, setDiceCount] = useState<number>(1);
  const [rollerName, setRollerName] = useState<string>(
    initialRollerName || (characters[0]?.name ?? 'Game Master')
  );
  const [selectedSkill, setSelectedSkill] = useState<string>(initialSkillName || '');
  const [skillBonus, setSkillBonus] = useState<number>(initialSkillBonus);
  const [cardBonus, setCardBonus] = useState<number>(initialCardBonus);
  const [customModifier, setCustomModifier] = useState<number>(0);
  const [fatePointInvokes, setFatePointInvokes] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Rolling state
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [currentRolls, setCurrentRolls] = useState<number[]>([20]);
  const [lastOutcome, setLastOutcome] = useState<DiceRollOutcome | null>(null);

  // Sync initial props
  useEffect(() => {
    if (initialRollerName) {
      setRollerName(initialRollerName);
    }
  }, [initialRollerName]);

  useEffect(() => {
    if (initialSkillName !== undefined) {
      setSelectedSkill(initialSkillName);
      setSkillBonus(initialSkillBonus);
      setCardBonus(initialCardBonus);
    }
  }, [initialSkillName, initialSkillBonus, initialCardBonus]);

  const handleRollerChange = (name: string) => {
    setRollerName(name);
    const pc = characters.find((c) => c.name === name);
    if (pc && selectedSkill) {
      setSkillBonus(pc.skills[selectedSkill] || 0);
    }
  };

  const handleSkillSelect = (skill: string) => {
    setSelectedSkill(skill);
    const pc = characters.find((c) => c.name === rollerName);
    const npc = npcs.find((n) => n.name === rollerName);
    if (pc) {
      setSkillBonus(pc.skills[skill] || 0);
    } else if (npc) {
      setSkillBonus(npc.skills[skill] || 0);
    }
  };

  const rollDie = (sides: number): number => {
    if (sides === 0) {
      // 4dF (Fate die: -1, 0, 1)
      return Math.floor(Math.random() * 3) - 1;
    }
    return Math.floor(Math.random() * sides) + 1;
  };

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);

    if (soundEnabled) {
      sfx.playDiceRoll();
    }

    const preset = DIE_PRESETS.find((p) => p.type === selectedDieType) || DIE_PRESETS[0];
    const count = selectedDieType === '4dF' ? 4 : diceCount;

    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      const animatedRolls = Array.from({ length: count }, () => rollDie(preset.sides));
      setCurrentRolls(animatedRolls);

      if (ticks >= 7) {
        clearInterval(interval);
        const finalRolls = Array.from({ length: count }, () => rollDie(preset.sides));
        setCurrentRolls(finalRolls);
        finalizeRoll(finalRolls, preset.type, count);
        setIsRolling(false);
      }
    }, 55);
  };

  const finalizeRoll = (rolls: number[], type: PolyhedralDieType, count: number) => {
    const diceTotal = rolls.reduce((sum, r) => sum + r, 0);
    const fpBonus = fatePointInvokes * 2;
    const finalTotal = diceTotal + skillBonus + cardBonus + customModifier + fpBonus;

    const isNat20 = type === 'd20' && count === 1 && rolls[0] === 20;
    const isNat1 = type === 'd20' && count === 1 && rolls[0] === 1;

    if (isNat20) {
      if (soundEnabled) sfx.playSuccessSound();
      try {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.65 },
        });
      } catch {}
    }

    const outcome: DiceRollOutcome = {
      id: `roll-${Date.now()}`,
      timestamp: Date.now(),
      rollerName: rollerName || 'Karakter',
      diceType: type === '4dF' ? '4dF' : `${count}${type}`,
      rolls,
      diceTotal,
      skillName: selectedSkill || undefined,
      skillBonus,
      cardBonuses: cardBonus,
      additionalModifier: customModifier,
      fatePointBonus: fpBonus,
      finalTotal,
      isNat20,
      isNat1,
    };

    setLastOutcome(outcome);
    if (onRollComplete) {
      onRollComplete(outcome);
    }
  };

  return (
    <div
      id="polyhedral-dice-roller"
      className="bg-zinc-900 border border-zinc-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-white max-w-xl w-full mx-auto max-h-[92vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
            <Dices className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-base sm:text-lg text-white">
              Hızlı Zar Masası
            </h2>
            <p className="text-[11px] text-zinc-400">
              d20 Ana Zar & Çoklu Zar Seçimi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              sfx.setMuted(!next);
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Die Type Selector Bar (d20, d8, d6, d10, etc.) */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Zar Tipi Seçin:
          </label>
          {selectedDieType !== '4dF' && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-zinc-400 mr-1">Adet:</span>
              <button
                type="button"
                onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center font-mono font-bold text-xs text-amber-300">
                {diceCount}
              </span>
              <button
                type="button"
                onClick={() => setDiceCount(Math.min(10, diceCount + 1))}
                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {DIE_PRESETS.map((preset) => {
            const isSelected = selectedDieType === preset.type;
            const isD20 = preset.type === 'd20';
            return (
              <button
                key={preset.type}
                type="button"
                onClick={() => {
                  setSelectedDieType(preset.type);
                  if (preset.type === '4dF') setDiceCount(4);
                  else if (diceCount > 6) setDiceCount(1);
                }}
                className={`py-2 px-1 rounded-xl text-center font-black transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isSelected
                    ? isD20
                      ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30 scale-105 border-2 border-amber-300'
                      : 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30 scale-105 border-2 border-emerald-300'
                    : 'bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="text-xs sm:text-sm font-mono">{preset.iconText}</span>
                {isD20 && !isSelected && (
                  <span className="text-[9px] text-amber-400 font-normal">Ana</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Roller & Skill Selectors (Auto-referenced, zero-friction) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-zinc-400">
              🎯 Referans Alınan (Zar Atan)
            </label>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
              Otomatik Aktif
            </span>
          </div>
          <select
            value={rollerName}
            onChange={(e) => handleRollerChange(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <optgroup label="Oyuncular">
              {characters.map((c) => (
                <option key={c.id} value={c.name}>
                  👤 {c.name}
                </option>
              ))}
            </optgroup>
            {npcs.length > 0 && (
              <optgroup label="NPC & Karşılaşmalar">
                {npcs.map((n) => (
                  <option key={n.id} value={n.name}>
                    🎭 {n.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Game Master">
              <option value="Game Master">🎲 Game Master</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
            Beceri Bonusu (Opsiyonel)
          </label>
          <select
            value={selectedSkill}
            onChange={(e) => handleSkillSelect(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="">-- Düz Zar (+0) --</option>
            {DEFAULT_FATE_SKILLS.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dice Animation Canvas / Display Box */}
      <div className="p-3 rounded-2xl bg-gradient-to-b from-zinc-950 to-black border border-zinc-800 shadow-inner flex flex-col items-center justify-center my-2">
        <div className="flex items-center justify-center gap-2 flex-wrap min-h-[64px] py-1">
          {currentRolls.map((val, idx) => (
            <motion.div
              key={idx}
              animate={
                isRolling
                  ? {
                      rotate: [0, 90, 180, 270, 360],
                      scale: [1, 1.2, 0.9, 1.1, 1],
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 0.35 }}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all shadow-lg select-none ${
                selectedDieType === 'd20' && val === 20
                  ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-amber-500/40 ring-2 ring-amber-400 ring-offset-2 ring-offset-black'
                  : selectedDieType === 'd20' && val === 1
                  ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-rose-500/40'
                  : 'bg-zinc-800/90 border-zinc-600 text-white'
              }`}
            >
              <span className="font-mono font-black text-xl sm:text-2xl">
                {selectedDieType === '4dF' ? (val === 1 ? '+' : val === -1 ? '-' : '0') : val}
              </span>
              <span className="text-[9px] text-zinc-400 uppercase">
                {selectedDieType === '4dF' ? 'Fate' : selectedDieType}
              </span>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-zinc-400 mt-1 font-mono">
          Zar Toplamı:{' '}
          <span className="font-bold text-white text-sm">
            {currentRolls.reduce((a, b) => a + b, 0)}
          </span>{' '}
          ({selectedDieType === '4dF' ? '4dF' : `${diceCount}${selectedDieType}`})
        </p>
      </div>

      {/* Touch-Friendly Modifiers Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
        {/* Skill Bonus */}
        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-1.5 flex flex-col items-center">
          <span className="text-[10px] text-zinc-400">Beceri</span>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              type="button"
              onClick={() => setSkillBonus(skillBonus - 1)}
              className="w-7 h-7 rounded-lg bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-bold text-xs text-emerald-400 w-6 text-center">
              {skillBonus >= 0 ? `+${skillBonus}` : skillBonus}
            </span>
            <button
              type="button"
              onClick={() => setSkillBonus(skillBonus + 1)}
              className="w-7 h-7 rounded-lg bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card Bonus */}
        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-1.5 flex flex-col items-center">
          <span className="text-[10px] text-amber-300 flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" /> Kart
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              type="button"
              onClick={() => setCardBonus(Math.max(0, cardBonus - 1))}
              className="w-7 h-7 rounded-lg bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-bold text-xs text-amber-300 w-6 text-center">
              +{cardBonus}
            </span>
            <button
              type="button"
              onClick={() => setCardBonus(cardBonus + 1)}
              className="w-7 h-7 rounded-lg bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Custom / Situation Mod */}
        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-1.5 flex flex-col items-center">
          <span className="text-[10px] text-zinc-400">Durumsal (+/-)</span>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              type="button"
              onClick={() => setCustomModifier(customModifier - 1)}
              className="w-7 h-7 rounded-lg bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-bold text-xs text-cyan-300 w-6 text-center">
              {customModifier >= 0 ? `+${customModifier}` : customModifier}
            </span>
            <button
              type="button"
              onClick={() => setCustomModifier(customModifier + 1)}
              className="w-7 h-7 rounded-lg bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Fate Point Invokes (+2) */}
        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-1.5 flex flex-col items-center">
          <span className="text-[10px] text-purple-300 flex items-center gap-0.5">
            <Flame className="w-2.5 h-2.5" /> Invoke (+2)
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              type="button"
              onClick={() => setFatePointInvokes(Math.max(0, fatePointInvokes - 1))}
              className="w-7 h-7 rounded-lg bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-bold text-xs text-purple-300 w-6 text-center">
              {fatePointInvokes * 2 > 0 ? `+${fatePointInvokes * 2}` : '0'}
            </span>
            <button
              type="button"
              onClick={() => setFatePointInvokes(fatePointInvokes + 1)}
              className="w-7 h-7 rounded-lg bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Big Roll Action Button */}
      <button
        type="button"
        onClick={handleRoll}
        disabled={isRolling}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-zinc-950 font-black text-base shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
        <span>
          {isRolling
            ? 'Zar Yuvarlanıyor...'
            : `${selectedDieType === '4dF' ? '4dF' : `${diceCount}${selectedDieType}`} ZARINI AT!`}
        </span>
      </button>

      {/* Last Result Clean Box (No complicated text, pure result & math) */}
      <AnimatePresence>
        {lastOutcome && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 p-3.5 rounded-2xl border ${
              lastOutcome.isNat20
                ? 'bg-amber-950/70 border-amber-400 shadow-amber-500/30 shadow-xl ring-1 ring-amber-400'
                : lastOutcome.isNat1
                ? 'bg-rose-950/70 border-rose-500 shadow-rose-500/30 shadow-xl'
                : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold block">
                  {lastOutcome.rollerName} • {lastOutcome.diceType} {lastOutcome.skillName ? `(${lastOutcome.skillName})` : ''}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    Sonuç:{' '}
                    <span className="text-amber-300 font-mono">
                      {lastOutcome.finalTotal}
                    </span>
                  </span>
                </div>
              </div>

              {lastOutcome.isNat20 && (
                <span className="px-3 py-1 rounded-full bg-amber-500 text-zinc-950 text-xs font-black shadow-md flex items-center gap-1 animate-bounce">
                  <Sparkles className="w-3.5 h-3.5" /> DOĞAL 20 (KRİTİK!)
                </span>
              )}
              {lastOutcome.isNat1 && (
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black shadow-md flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> DOĞAL 1 (KRİTİK HATA)
                </span>
              )}
            </div>

            {/* Quick Math Breakdown */}
            <div className="mt-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-300 flex flex-wrap gap-1.5 items-center font-mono">
              <span>
                Zar ({lastOutcome.rolls.join(' + ')}) = {lastOutcome.diceTotal}
              </span>
              {lastOutcome.skillBonus !== 0 && (
                <span>+ Beceri ({lastOutcome.skillBonus > 0 ? `+${lastOutcome.skillBonus}` : lastOutcome.skillBonus})</span>
              )}
              {lastOutcome.cardBonuses > 0 && (
                <span className="text-amber-300 font-semibold">+ Kart (+{lastOutcome.cardBonuses})</span>
              )}
              {lastOutcome.additionalModifier !== 0 && (
                <span>+ Durumsal ({lastOutcome.additionalModifier > 0 ? `+${lastOutcome.additionalModifier}` : lastOutcome.additionalModifier})</span>
              )}
              {(lastOutcome.fatePointBonus ?? 0) > 0 && (
                <span className="text-purple-300 font-semibold">+ Invoke (+{lastOutcome.fatePointBonus})</span>
              )}
              <span className="font-bold text-white text-sm">= {lastOutcome.finalTotal}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {rollHistory.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-semibold">
              <History className="w-3 h-3" /> Son Zarlar ({rollHistory.length})
            </span>
            {onClearHistory && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                Temizle
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {rollHistory.slice(0, 5).map((rh) => (
              <div
                key={rh.id}
                className="px-2 py-1 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs flex items-center justify-between text-zinc-300"
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span className="font-semibold text-white truncate">{rh.rollerName}</span>
                  <span className="text-zinc-500 text-[10px]">
                    [{rh.diceType || 'd20'}{rh.skillName ? ` - ${rh.skillName}` : ''}]
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono shrink-0">
                  <span className="text-zinc-400 text-[10px]">
                    ({rh.rolls ? rh.rolls.join('+') : rh.diceTotal})
                  </span>
                  <span className="font-bold text-amber-300 text-xs">
                    = {rh.finalTotal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
