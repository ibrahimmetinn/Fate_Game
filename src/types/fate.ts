export type UserRole = 'gm' | 'player';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: number;
  lastLogin: number;
}

export type FateRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type SkillName = 
  | 'Dövüş' 
  | 'Atıcılık' 
  | 'Atletizm' 
  | 'Aldatma' 
  | 'İrade' 
  | 'Fizik' 
  | 'Farkındalık' 
  | 'Gizlilik' 
  | 'Soruşturma' 
  | 'Bilgi' 
  | 'Kışkırtma' 
  | 'İkna' 
  | 'Temaslar' 
  | 'Hırsızlık' 
  | 'Zanaat' 
  | 'Sürüş' 
  | 'Kaynaklar' 
  | 'Empati'
  | string;

export interface StatBonus {
  id: string;
  type: 'skill' | 'physical_stress' | 'mental_stress' | 'fate_point' | 'refresh' | 'custom';
  targetSkill?: string; // e.g. 'Dövüş', 'Atletizm'
  value: number; // e.g. +2, +1
  description?: string;
}

export interface SpecialCard {
  id: string;
  name: string;
  subtitle: string;
  rarity: FateRarity;
  imageUrl?: string;
  imagePosition?: string; // e.g. '50% 20%' or 'center top'
  imageScale?: number; // e.g. 1.0, 1.2
  type: 'Yetenek' | 'Eşya / Yadigar' | 'Unvan' | 'Boon / Lütuf' | 'Stunt' | 'Büyü';
  description: string;
  ruleEffect: string;
  bonuses: StatBonus[];
  assignedCharacterId: string | null; // target ID (Character or NPC ID), null if unassigned in GM reserve
  assignedCharacterName?: string;
  assignedTargetType?: 'character' | 'npc';
  createdAt: number;
  tags: string[];
}

export interface Aspect {
  id: string;
  label: 'Ana Konsept' | 'Bela' | 'Serbest Yön' | 'Geçmiş Yönü' | 'İlişki Yönü';
  value: string;
  invokedCount?: number;
}

export interface SkillEntry {
  name: string;
  baseLevel: number; // e.g. 4 (Harika), 3 (İyi)
}

export interface StressBox {
  index: number;
  value: number; // 1, 2, 3, 4
  marked: boolean;
}

export interface Consequence {
  type: 'Hafif (-2)' | 'Orta (-4)' | 'Ağır (-6)';
  severity: 2 | 4 | 6;
  aspect: string;
  used: boolean;
}

export interface Stunt {
  id: string;
  name: string;
  description: string;
}

export interface Character {
  id: string;
  name: string;
  playerName?: string;
  avatarUrl?: string;
  avatarPosition?: string; // e.g. '50% 20%'
  avatarScale?: number;
  location?: string; // Optional location / zone (e.g. 'Bilinmiyor', 'Liman Hanı')
  highConcept: string;
  trouble: string;
  aspects: Aspect[];
  skills: Record<string, number>; // e.g. { "Dövüş": 4, "Atletizm": 3 }
  fatePoints: number;
  refresh: number;
  physicalStress: boolean[]; // array of marked booleans
  mentalStress: boolean[];
  consequences: Consequence[];
  stunts: Stunt[];
  notes?: string;
  createdAt: number;
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  category: 'nameless' | 'supporting' | 'main'; // Minyon / Destek / Ana Karakter-Boss
  location: string;
  previousLocations: string[];
  avatarUrl?: string;
  avatarPosition?: string; // e.g. '50% 20%'
  avatarScale?: number;
  highConcept: string;
  trouble?: string;
  aspects: string[];
  skills: Record<string, number>;
  stunts: Stunt[];
  stress: {
    physical: boolean[];
    mental: boolean[];
  };
  consequences?: string[];
  notes: string;
  gmSecrets: string; // only visible to GM
  isInEncounter: boolean;
  status: 'active' | 'defeated' | 'allied' | 'hidden';
}

export interface GMNote {
  id: string;
  title: string;
  category: 'Ana Hikaye' | 'Karşılaşmalar' | 'NPC Planları' | 'İpuçları & Sırlar' | 'Ödül & Ganiset' | 'Hızlı Notlar';
  content: string;
  isPinned: boolean;
  tags: string[];
  updatedAt: number;
}

export interface SceneAspect {
  id: string;
  text: string;
  freeInvokes: number;
  zone?: string;
}

export type PolyhedralDieType = 'd20' | 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd100' | '4dF';

export interface DiceRollOutcome {
  id: string;
  timestamp: number;
  rollerName: string;
  diceType: string; // 'd20', '1d8', '2d6', '4dF' etc.
  rolls: number[]; // Array of rolled values e.g. [18] or [5, 7]
  diceTotal: number;
  skillName?: string;
  skillBonus: number;
  cardBonuses: number;
  additionalModifier: number;
  fatePointBonus?: number;
  finalTotal: number;
  isNat20?: boolean;
  isNat1?: boolean;
  notes?: string;
}

export type MilestoneType = 
  | 'phase' 
  | 'major_milestone' 
  | 'significant_milestone' 
  | 'minor_milestone' 
  | 'combat_victory' 
  | 'kill' 
  | 'tragedy' 
  | 'discovery' 
  | 'title_item';

export interface TimelineEntry {
  id: string;
  title: string;
  phaseOrSession: string; // e.g. "Oturum 1", "Safha 2: Gölge Kalesi Kuşatması"
  type: MilestoneType;
  date?: string; // in-game or real date string
  timestamp: number;
  characterIds: string[]; // which characters were involved
  characterNames: string[];
  location: string;
  description: string;
  outcomeOrReward?: string; // e.g. "+1 Beceri", "Karanlık Çan Yıkıldı", "Ağır Yara Alındı"
  imageUrl?: string;
  imagePosition?: string;
  imageScale?: number;
  tags?: string[];
  gmOnly?: boolean;
}

export type TargetCategory = 'nameless' | 'supporting' | 'main' | 'beast' | 'monster' | 'boss' | 'custom';

export interface KillRecord {
  id: string;
  slayerCharacterId: string; // character ID or 'group'
  slayerCharacterName: string;
  targetNpcId?: string;
  targetName: string;
  targetCategory: TargetCategory;
  targetTitle?: string;
  targetAvatarUrl?: string;
  targetAvatarPosition?: string;
  targetAvatarScale?: number;
  location: string;
  sessionOrDate: string;
  timestamp: number;
  finishingBlow?: string; // e.g. "4dF +4 Dövüş zarıyla kritik darbe", "Gölge Büyüsü Patlaması", "Uçuruma İterek"
  lootOrReward?: string; // e.g. "Kıyamet Kılıcı Kartı", "+300 Altın", "Şehir Kahramanı Unvanı"
  notes?: string; // GM or Player memory note
}

export type DangerLevel = 'peaceful' | 'cautious' | 'dangerous' | 'deadly';
export type RegionType = 'city' | 'dungeon' | 'ruins' | 'wilderness' | 'tavern' | 'castle' | 'mystic' | 'haven' | 'other';

export interface RegionZone {
  id: string;
  name: string;
  type: RegionType;
  dangerLevel: DangerLevel;
  imageUrl?: string;
  imagePosition?: string;
  imageScale?: number;
  summary: string;
  description: string;
  aspects: string[]; // Bölge Yönleri (örn. "Sürekli Kükreyen Rüzgarlar", "Gözcü Kuleleri")
  subLocations?: string[]; // Alt Mekanlar (örn. "Mahzen Katı", "Ana Kapı", "Arşiv")
  connectedLocations?: string[]; // Komşu yollar / geçitler
  gmSecrets?: string;
  isCurrentLocation?: boolean;
  createdAt: number;
}

export interface CampaignState {
  title: string;
  currentLocation: string;
  locationsList: string[];
  characters: Character[];
  specialCards: SpecialCard[];
  npcs: NPC[];
  gmNotes: GMNote[];
  sceneAspects: SceneAspect[];
  rollHistory: DiceRollOutcome[];
  timeline: TimelineEntry[];
  killRecords: KillRecord[];
  regions: RegionZone[];
}

