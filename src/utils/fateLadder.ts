import { FateRarity, SpecialCard, Character } from '../types/fate';

export interface LadderStep {
  value: number;
  adjectiveTr: string;
  adjectiveEn: string;
  color: string;
}

export const FATE_LADDER: LadderStep[] = [
  { value: 8, adjectiveTr: 'Efsanevi (+8)', adjectiveEn: 'Legendary', color: 'text-amber-400 font-bold' },
  { value: 7, adjectiveTr: 'Epik (+7)', adjectiveEn: 'Epic', color: 'text-purple-400 font-bold' },
  { value: 6, adjectiveTr: 'Muazzam (+6)', adjectiveEn: 'Fantastic', color: 'text-cyan-400 font-bold' },
  { value: 5, adjectiveTr: 'Kusursuz (+5)', adjectiveEn: 'Superb', color: 'text-blue-400 font-bold' },
  { value: 4, adjectiveTr: 'Harika (+4)', adjectiveEn: 'Great', color: 'text-emerald-400 font-bold' },
  { value: 3, adjectiveTr: 'İyi (+3)', adjectiveEn: 'Good', color: 'text-green-400 font-semibold' },
  { value: 2, adjectiveTr: 'Makul (+2)', adjectiveEn: 'Fair', color: 'text-lime-400' },
  { value: 1, adjectiveTr: 'Ortalama (+1)', adjectiveEn: 'Average', color: 'text-yellow-300' },
  { value: 0, adjectiveTr: 'Vasat (0)', adjectiveEn: 'Mediocre', color: 'text-slate-300' },
  { value: -1, adjectiveTr: 'Kötü (-1)', adjectiveEn: 'Poor', color: 'text-orange-400' },
  { value: -2, adjectiveTr: 'Berbat (-2)', adjectiveEn: 'Terrible', color: 'text-rose-500 font-semibold' },
  { value: -3, adjectiveTr: 'Felaket (-3)', adjectiveEn: 'Abysmal', color: 'text-red-600 font-bold' },
  { value: -4, adjectiveTr: 'Kritik Felaket (-4)', adjectiveEn: 'Catastrophic', color: 'text-red-700 font-extrabold' },
];

export function getLadderAdjective(value: number): string {
  if (value >= 8) return 'Efsanevi (+8 ve üzeri)';
  if (value <= -4) return 'Kritik Felaket (-4 ve altı)';
  const match = FATE_LADDER.find(step => step.value === value);
  return match ? match.adjectiveTr : `${value >= 0 ? '+' : ''}${value}`;
}

export const DEFAULT_FATE_SKILLS: string[] = [
  'Dövüş',
  'Atıcılık',
  'Atletizm',
  'Aldatma',
  'İrade',
  'Fizik',
  'Farkındalık',
  'Gizlilik',
  'Soruşturma',
  'Bilgi',
  'Kışkırtma',
  'İkna',
  'Temaslar',
  'Hırsızlık',
  'Zanaat',
  'Sürüş',
  'Kaynaklar',
  'Empati',
];

export const RARITY_CONFIG: Record<
  FateRarity,
  {
    nameTr: string;
    bgGradient: string;
    cardBorder: string;
    badgeBg: string;
    badgeText: string;
    glowShadow: string;
    accentColor: string;
    icon: string;
  }
> = {
  common: {
    nameTr: 'Yaygın (Common)',
    bgGradient: 'from-slate-800 via-slate-900 to-zinc-950',
    cardBorder: 'border-slate-500/50 hover:border-slate-400',
    badgeBg: 'bg-slate-700/80 border border-slate-500/50 text-slate-200',
    badgeText: 'text-slate-300',
    glowShadow: 'shadow-slate-500/10',
    accentColor: 'text-slate-300',
    icon: 'Shield',
  },
  uncommon: {
    nameTr: 'Sıradışı (Uncommon)',
    bgGradient: 'from-emerald-950 via-teal-900/80 to-zinc-950',
    cardBorder: 'border-emerald-500/60 hover:border-emerald-400',
    badgeBg: 'bg-emerald-900/80 border border-emerald-500/60 text-emerald-200',
    badgeText: 'text-emerald-300',
    glowShadow: 'shadow-emerald-500/20 shadow-lg',
    accentColor: 'text-emerald-400',
    icon: 'Sparkles',
  },
  rare: {
    nameTr: 'Nadir (Rare)',
    bgGradient: 'from-blue-950 via-indigo-950 to-zinc-950',
    cardBorder: 'border-blue-500/70 hover:border-blue-400',
    badgeBg: 'bg-blue-900/80 border border-blue-400/60 text-blue-200',
    badgeText: 'text-blue-300',
    glowShadow: 'shadow-blue-500/25 shadow-xl',
    accentColor: 'text-blue-400',
    icon: 'Gem',
  },
  epic: {
    nameTr: 'Epik (Epic)',
    bgGradient: 'from-purple-950 via-fuchsia-950/80 to-zinc-950',
    cardBorder: 'border-purple-500/80 hover:border-fuchsia-400',
    badgeBg: 'bg-purple-900/80 border border-purple-400/70 text-purple-200',
    badgeText: 'text-purple-300',
    glowShadow: 'shadow-purple-500/30 shadow-xl',
    accentColor: 'text-purple-400',
    icon: 'Zap',
  },
  legendary: {
    nameTr: 'Efsanevi (Legendary)',
    bgGradient: 'from-amber-950 via-orange-950/80 to-zinc-950',
    cardBorder: 'border-amber-400 hover:border-yellow-300',
    badgeBg: 'bg-amber-900/90 border border-amber-400 text-amber-100',
    badgeText: 'text-amber-300 font-bold',
    glowShadow: 'shadow-amber-500/40 shadow-2xl',
    accentColor: 'text-amber-400',
    icon: 'Crown',
  },
  mythic: {
    nameTr: 'Mitik (Mythic)',
    bgGradient: 'from-rose-950 via-red-950/80 to-zinc-950',
    cardBorder: 'border-rose-500 hover:border-pink-400 animate-pulse',
    badgeBg: 'bg-gradient-to-r from-rose-700 to-red-600 border border-rose-300 text-white font-black',
    badgeText: 'text-rose-300 font-black tracking-wider',
    glowShadow: 'shadow-rose-500/50 shadow-2xl',
    accentColor: 'text-rose-400',
    icon: 'Flame',
  },
};

/**
 * Calculates all active card bonuses for a given character
 */
export function calculateCharacterCardBonuses(
  characterId: string,
  allCards: SpecialCard[]
): {
  skillBonuses: Record<string, number>;
  extraPhysicalStress: number;
  extraMentalStress: number;
  extraFatePoints: number;
  assignedCards: SpecialCard[];
} {
  const assignedCards = allCards.filter(c => c.assignedCharacterId === characterId);
  const skillBonuses: Record<string, number> = {};
  let extraPhysicalStress = 0;
  let extraMentalStress = 0;
  let extraFatePoints = 0;

  for (const card of assignedCards) {
    if (!card.bonuses) continue;
    for (const bonus of card.bonuses) {
      if (bonus.type === 'skill' && bonus.targetSkill) {
        skillBonuses[bonus.targetSkill] = (skillBonuses[bonus.targetSkill] || 0) + bonus.value;
      } else if (bonus.type === 'physical_stress') {
        extraPhysicalStress += bonus.value;
      } else if (bonus.type === 'mental_stress') {
        extraMentalStress += bonus.value;
      } else if (bonus.type === 'fate_point') {
        extraFatePoints += bonus.value;
      }
    }
  }

  return {
    skillBonuses,
    extraPhysicalStress,
    extraMentalStress,
    extraFatePoints,
    assignedCards,
  };
}

/**
 * Computes base stress track boxes for Fate Core
 * Standard: 2 boxes.
 * Physique / Will: +1 at level 1-2 (3 boxes), +2 at level 3-4 (4 boxes), +extra minor consequence at level 5+
 */
export function calculateStressBoxesCount(
  skillLevel: number,
  cardBonus = 0
): number {
  let boxes = 2; // base
  if (skillLevel >= 1 && skillLevel <= 2) {
    boxes = 3;
  } else if (skillLevel >= 3) {
    boxes = 4;
  }
  return Math.max(1, boxes + cardBonus);
}
