import React, { useState } from 'react';
import {
  TimelineEntry,
  KillRecord,
  Character,
  NPC,
  MilestoneType,
  TargetCategory,
} from '../types/fate';
import { ImageFocalControl } from './ImageFocalControl';
import {
  Calendar,
  Skull,
  Trophy,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Swords,
  HeartCrack,
  Compass,
  Award,
  Filter,
  CheckCircle2,
  ChevronRight,
  Shield,
  MapPin,
  Flame,
  Search,
  Eye,
  Crosshair,
  User,
  Users,
  ImageIcon,
  Upload,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimelineManagerProps {
  timeline: TimelineEntry[];
  killRecords: KillRecord[];
  characters: Character[];
  npcs: NPC[];
  locations: string[];
  currentLocation: string;
  isGM: boolean;
  onSaveTimelineEntry: (entry: TimelineEntry) => void;
  onDeleteTimelineEntry: (id: string) => void;
  onSaveKillRecord: (record: KillRecord) => void;
  onDeleteKillRecord: (id: string) => void;
}

export const TimelineManager: React.FC<TimelineManagerProps> = ({
  timeline,
  killRecords,
  characters,
  npcs,
  locations,
  currentLocation,
  isGM,
  onSaveTimelineEntry,
  onDeleteTimelineEntry,
  onSaveKillRecord,
  onDeleteKillRecord,
}) => {
  // Main view switch: 'timeline' (Aşamalar & Hikaye) or 'kills' (Öldürülenler & Zaferler Hafızası)
  const [subTab, setSubTab] = useState<'timeline' | 'kills'>('timeline');

  // Filters for Timeline
  const [selectedCharFilter, setSelectedCharFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filters for Kill Records
  const [killCharFilter, setKillCharFilter] = useState<string>('all');
  const [killCategoryFilter, setKillCategoryFilter] = useState<string>('all');
  const [killSearch, setKillSearch] = useState<string>('');

  // Modals state
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState<boolean>(false);
  const [editingTimelineEntry, setEditingTimelineEntry] = useState<TimelineEntry | null>(null);

  const [isKillModalOpen, setIsKillModalOpen] = useState<boolean>(false);
  const [editingKillRecord, setEditingKillRecord] = useState<KillRecord | null>(null);

  // Timeline Form State
  const [tlTitle, setTlTitle] = useState<string>('');
  const [tlPhase, setTlPhase] = useState<string>('');
  const [tlType, setTlType] = useState<MilestoneType>('phase');
  const [tlDate, setTlDate] = useState<string>('');
  const [tlLocation, setTlLocation] = useState<string>(currentLocation);
  const [tlCharIds, setTlCharIds] = useState<string[]>([]);
  const [tlDescription, setTlDescription] = useState<string>('');
  const [tlOutcome, setTlOutcome] = useState<string>('');
  const [tlTags, setTlTags] = useState<string>('');
  const [tlImageUrl, setTlImageUrl] = useState<string>('');
  const [tlImagePosition, setTlImagePosition] = useState<string>('50% 50%');
  const [tlImageScale, setTlImageScale] = useState<number>(1);
  const [tlGmOnly, setTlGmOnly] = useState<boolean>(false);

  // Kill Form State
  const [killSlayerId, setKillSlayerId] = useState<string>('group');
  const [killTargetName, setKillTargetName] = useState<string>('');
  const [killTargetTitle, setKillTargetTitle] = useState<string>('');
  const [killTargetCategory, setKillTargetCategory] = useState<TargetCategory>('monster');
  const [killLocation, setKillLocation] = useState<string>(currentLocation);
  const [killSession, setKillSession] = useState<string>('Oturum 1');
  const [killBlow, setKillBlow] = useState<string>('');
  const [killLoot, setKillLoot] = useState<string>('');
  const [killNotes, setKillNotes] = useState<string>('');
  const [killAvatarUrl, setKillAvatarUrl] = useState<string>('');
  const [killAvatarPosition, setKillAvatarPosition] = useState<string>('50% 50%');
  const [killAvatarScale, setKillAvatarScale] = useState<number>(1);

  // Open Timeline Modal (New or Edit)
  const handleOpenTimelineModal = (entry?: TimelineEntry) => {
    if (entry) {
      setEditingTimelineEntry(entry);
      setTlTitle(entry.title);
      setTlPhase(entry.phaseOrSession);
      setTlType(entry.type);
      setTlDate(entry.date || '');
      setTlLocation(entry.location || currentLocation);
      setTlCharIds(entry.characterIds || []);
      setTlDescription(entry.description);
      setTlOutcome(entry.outcomeOrReward || '');
      setTlTags(entry.tags ? entry.tags.join(', ') : '');
      setTlImageUrl(entry.imageUrl || '');
      setTlImagePosition(entry.imagePosition || '50% 50%');
      setTlImageScale(entry.imageScale || 1);
      setTlGmOnly(entry.gmOnly || false);
    } else {
      setEditingTimelineEntry(null);
      setTlTitle('');
      setTlPhase(`Oturum ${timeline.length + 1}`);
      setTlType('significant_milestone');
      setTlDate(new Date().toLocaleDateString('tr-TR'));
      setTlLocation(currentLocation);
      setTlCharIds(characters.map((c) => c.id)); // Default: all characters
      setTlDescription('');
      setTlOutcome('');
      setTlTags('Kilometre Taşı, Macera');
      setTlImageUrl('');
      setTlImagePosition('50% 50%');
      setTlImageScale(1);
      setTlGmOnly(false);
    }
    setIsTimelineModalOpen(true);
  };

  const handleSaveTimelineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tlTitle.trim()) return;

    const charNames = tlCharIds
      .map((id) => characters.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[];

    const newEntry: TimelineEntry = {
      id: editingTimelineEntry ? editingTimelineEntry.id : `tl-${Date.now()}`,
      title: tlTitle.trim(),
      phaseOrSession: tlPhase.trim() || 'Genel Aşama',
      type: tlType,
      date: tlDate.trim() || undefined,
      timestamp: editingTimelineEntry ? editingTimelineEntry.timestamp : Date.now(),
      characterIds: tlCharIds,
      characterNames: charNames.length > 0 ? charNames : ['Tüm Grup'],
      location: tlLocation.trim() || currentLocation,
      description: tlDescription.trim(),
      outcomeOrReward: tlOutcome.trim() || undefined,
      tags: tlTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      imageUrl: tlImageUrl.trim() || undefined,
      imagePosition: tlImagePosition,
      imageScale: tlImageScale,
      gmOnly: tlGmOnly,
    };

    onSaveTimelineEntry(newEntry);
    setIsTimelineModalOpen(false);
  };

  // Open Kill Modal (New or Edit)
  const handleOpenKillModal = (record?: KillRecord) => {
    if (record) {
      setEditingKillRecord(record);
      setKillSlayerId(record.slayerCharacterId);
      setKillTargetName(record.targetName);
      setKillTargetTitle(record.targetTitle || '');
      setKillTargetCategory(record.targetCategory);
      setKillLocation(record.location);
      setKillSession(record.sessionOrDate);
      setKillBlow(record.finishingBlow || '');
      setKillLoot(record.lootOrReward || '');
      setKillNotes(record.notes || '');
      setKillAvatarUrl(record.targetAvatarUrl || '');
      setKillAvatarPosition(record.targetAvatarPosition || '50% 50%');
      setKillAvatarScale(record.targetAvatarScale || 1);
    } else {
      setEditingKillRecord(null);
      setKillSlayerId(characters[0]?.id || 'group');
      setKillTargetName('');
      setKillTargetTitle('');
      setKillTargetCategory('monster');
      setKillLocation(currentLocation);
      setKillSession(`Oturum ${timeline.length || 1}`);
      setKillBlow('');
      setKillLoot('');
      setKillNotes('');
      setKillAvatarUrl('');
      setKillAvatarPosition('50% 50%');
      setKillAvatarScale(1);
    }
    setIsKillModalOpen(true);
  };

  // Quick import from an existing defeated NPC
  const handleImportFromNPC = (npc: NPC) => {
    setEditingKillRecord(null);
    setKillSlayerId('group');
    setKillTargetName(npc.name);
    setKillTargetTitle(npc.title || npc.highConcept);
    setKillTargetCategory(
      npc.category === 'main' ? 'boss' : npc.category === 'supporting' ? 'supporting' : 'nameless'
    );
    setKillLocation(npc.location || currentLocation);
    setKillSession(`Oturum ${timeline.length || 1}`);
    setKillBlow('Kritik hamle ile etkisiz hale getirildi.');
    setKillLoot('');
    setKillNotes(npc.notes || 'NPC Paneli üzerinden zafer hafızasına aktarıldı.');
    setKillAvatarUrl(npc.avatarUrl || '');
    setKillAvatarPosition(npc.avatarPosition || '50% 50%');
    setKillAvatarScale(npc.avatarScale || 1);
    setIsKillModalOpen(true);
  };

  const handleSaveKillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!killTargetName.trim()) return;

    let slayerName = 'Tüm Grup (Ortak Zafer)';
    if (killSlayerId !== 'group') {
      const foundChar = characters.find((c) => c.id === killSlayerId);
      if (foundChar) slayerName = foundChar.name;
    }

    const newRecord: KillRecord = {
      id: editingKillRecord ? editingKillRecord.id : `kill-${Date.now()}`,
      slayerCharacterId: killSlayerId,
      slayerCharacterName: slayerName,
      targetName: killTargetName.trim(),
      targetTitle: killTargetTitle.trim() || undefined,
      targetCategory: killTargetCategory,
      targetAvatarUrl: killAvatarUrl.trim() || undefined,
      targetAvatarPosition: killAvatarPosition,
      targetAvatarScale: killAvatarScale,
      location: killLocation.trim() || currentLocation,
      sessionOrDate: killSession.trim() || 'Oturum 1',
      timestamp: editingKillRecord ? editingKillRecord.timestamp : Date.now(),
      finishingBlow: killBlow.trim() || undefined,
      lootOrReward: killLoot.trim() || undefined,
      notes: killNotes.trim() || undefined,
    };

    onSaveKillRecord(newRecord);
    setIsKillModalOpen(false);
  };

  // Helper type badges & icons
  const getMilestoneBadge = (type: MilestoneType) => {
    switch (type) {
      case 'phase':
        return {
          label: 'Macera Safhası / Bölüm',
          color: 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300',
          icon: <Compass className="w-3.5 h-3.5" />,
        };
      case 'major_milestone':
        return {
          label: 'Büyük Kilometre Taşı (Refresh & Stunt)',
          color: 'bg-purple-950/80 border-purple-500/50 text-purple-300',
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
        };
      case 'significant_milestone':
        return {
          label: 'Önemli Kilometre Taşı (+1 Beceri)',
          color: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          icon: <Award className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'minor_milestone':
        return {
          label: 'Küçük Kilometre Taşı (Yön Değişimi)',
          color: 'bg-blue-950/80 border-blue-500/50 text-blue-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />,
        };
      case 'combat_victory':
        return {
          label: 'Büyük Zafer & Boss Savaşı',
          color: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
          icon: <Trophy className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'kill':
        return {
          label: 'Düşman İtlafı / Av',
          color: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
          icon: <Skull className="w-3.5 h-3.5 text-rose-400" />,
        };
      case 'tragedy':
        return {
          label: 'Yara, Travma & Ağır Sonuç',
          color: 'bg-red-950/80 border-red-500/50 text-red-300',
          icon: <HeartCrack className="w-3.5 h-3.5 text-red-400" />,
        };
      case 'discovery':
        return {
          label: 'Kadim Keşif & Gizem',
          color: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
        };
      case 'title_item':
        return {
          label: 'Unvan & Efsanevi Yadigar',
          color: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300',
          icon: <Shield className="w-3.5 h-3.5 text-yellow-400" />,
        };
      default:
        return {
          label: 'Dönüm Noktası',
          color: 'bg-zinc-900 border-zinc-700 text-zinc-300',
          icon: <Calendar className="w-3.5 h-3.5" />,
        };
    }
  };

  const getCategoryBadge = (cat: TargetCategory) => {
    switch (cat) {
      case 'boss':
        return { label: 'BÜYÜK BOSS', color: 'bg-purple-950/90 border-purple-500 text-purple-300' };
      case 'main':
        return { label: 'ANA DÜŞMAN', color: 'bg-red-950/90 border-red-500 text-red-300' };
      case 'supporting':
        return { label: 'DESTEK / ELİT', color: 'bg-amber-950/90 border-amber-500 text-amber-300' };
      case 'monster':
      case 'beast':
        return { label: 'CANAVAR / YARATIK', color: 'bg-rose-950/90 border-rose-500 text-rose-300' };
      case 'nameless':
        return { label: 'MİNYON / SÜRÜ', color: 'bg-zinc-900 border-zinc-700 text-zinc-400' };
      default:
        return { label: 'HEDEF', color: 'bg-zinc-900 border-zinc-700 text-zinc-300' };
    }
  };

  // Filtered timeline entries
  const filteredTimeline = timeline.filter((entry) => {
    if (!isGM && entry.gmOnly) return false;
    if (selectedCharFilter !== 'all') {
      if (!entry.characterIds || !entry.characterIds.includes(selectedCharFilter)) {
        return false;
      }
    }
    if (selectedTypeFilter !== 'all' && entry.type !== selectedTypeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = entry.title.toLowerCase().includes(q);
      const matchDesc = entry.description.toLowerCase().includes(q);
      const matchLoc = entry.location?.toLowerCase().includes(q);
      const matchTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLoc && !matchTags) return false;
    }
    return true;
  });

  // Filtered kill records
  const filteredKills = killRecords.filter((rec) => {
    if (killCharFilter !== 'all') {
      if (rec.slayerCharacterId !== killCharFilter) return false;
    }
    if (killCategoryFilter !== 'all' && rec.targetCategory !== killCategoryFilter) {
      return false;
    }
    if (killSearch.trim()) {
      const q = killSearch.toLowerCase();
      const matchName = rec.targetName.toLowerCase().includes(q);
      const matchTitle = rec.targetTitle?.toLowerCase().includes(q);
      const matchBlow = rec.finishingBlow?.toLowerCase().includes(q);
      const matchLoc = rec.location.toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchBlow && !matchLoc) return false;
    }
    return true;
  });

  // Kill stats calculation
  const totalKills = killRecords.length;
  const bossKills = killRecords.filter((k) => k.targetCategory === 'boss' || k.targetCategory === 'main').length;

  return (
    <div id="timeline-manager-container" className="space-y-6">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 text-white shadow-lg shadow-purple-600/30">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-wide">
                KAMPANYA ZAMAN ÇİZELGESİ & ZAFER HAFIZASI
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Safhalar & Mezarlık
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Karakterlerin geçtiği tüm aşamalar, kilometre taşları, büyük zaferler ve alt edilen düşmanların hafızası
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => setSubTab('timeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subTab === 'timeline'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Zaman Çizelgesi & Aşamalar ({timeline.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('kills')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subTab === 'kills'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Skull className="w-3.5 h-3.5 text-rose-300" />
              <span>Öldürülenler Hafızası ({killRecords.length})</span>
            </button>
          </div>

          {subTab === 'timeline' ? (
            <button
              type="button"
              onClick={() => handleOpenTimelineModal()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Aşama Ekle</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenKillModal()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 cursor-pointer transition-all active:scale-95"
            >
              <Skull className="w-4 h-4" />
              <span>Yeni Zafer / İtlaf Kaydet</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUB-VIEW 1: TIMELINE & MILESTONES (ZAMAN ÇİZELGESİ) */}
      {/* ============================================================ */}
      {subTab === 'timeline' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                Filtrele:
              </span>

              {/* Character Filter */}
              <select
                value={selectedCharFilter}
                onChange={(e) => setSelectedCharFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Tüm Karakterler / Grup</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Milestone Type Filter */}
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Tüm Aşama Türleri</option>
                <option value="phase">Macera Safhaları (Phases)</option>
                <option value="major_milestone">Büyük Kilometre Taşları</option>
                <option value="significant_milestone">Önemli Kilometre Taşları (+1 Beceri)</option>
                <option value="minor_milestone">Küçük Kilometre Taşları (Yön)</option>
                <option value="combat_victory">Büyük Zaferler</option>
                <option value="kill">Düşman İtlafı / Av</option>
                <option value="tragedy">Yara & Travmalar (Consequences)</option>
                <option value="discovery">Kadim Keşifler</option>
                <option value="title_item">Unvan & Yadigar Kazanımları</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Aşama, başlık veya etiket ara..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Timeline Node Stream */}
          {filteredTimeline.length === 0 ? (
            <div className="p-12 text-center bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl">
              <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-300">Henüz Kayıtlı Bir Aşama Bulunamadı</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Karakterlerinizin kazandığı kilometre taşlarını, atlattığı macera safhalarını veya trajedilerini kaydetmek için yukarıdaki butonu kullanın.
              </p>
              <button
                type="button"
                onClick={() => handleOpenTimelineModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                İlk Aşamayı Kaydet
              </button>
            </div>
          ) : (
            <div className="relative pl-6 md:pl-8 space-y-8 before:absolute before:left-3 md:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-zinc-800">
              {filteredTimeline.map((entry, idx) => {
                const badge = getMilestoneBadge(entry.type);

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    className="relative group"
                  >
                    {/* Node Dot / Milestone Icon on the left line */}
                    <div className="absolute -left-6 md:-left-8 top-3 -translate-x-1/2 w-7 h-7 rounded-xl bg-zinc-900 border-2 border-indigo-500 text-indigo-300 shadow-md flex items-center justify-center z-10">
                      {badge.icon}
                    </div>

                    {/* Timeline Event Card */}
                    <div className="p-5 bg-zinc-950/90 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl shadow-lg transition-all space-y-4">
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border flex items-center gap-1.5 ${badge.color}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-300">
                            {entry.phaseOrSession}
                          </span>

                          {entry.date && (
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-500" />
                              {entry.date}
                            </span>
                          )}

                          {entry.location && (
                            <span className="text-xs text-amber-300/90 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {entry.location}
                            </span>
                          )}
                        </div>

                        {/* GM / Edit Controls */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenTimelineModal(entry)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-300 border border-zinc-800 cursor-pointer"
                            title="Aşamayı Düzenle"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteTimelineEntry(entry.id)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 border border-zinc-800 cursor-pointer"
                            title="Aşamayı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Main Title & Image Layout */}
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        {entry.imageUrl && (
                          <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                            <img
                              src={entry.imageUrl}
                              alt={entry.title}
                              referrerPolicy="no-referrer"
                              style={{
                                objectPosition: entry.imagePosition || '50% 50%',
                                transform: entry.imageScale ? `scale(${entry.imageScale})` : undefined,
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 space-y-2.5">
                          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                            {entry.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                            {entry.description}
                          </p>

                          {/* Outcome / Reward Box */}
                          {entry.outcomeOrReward && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-200">
                              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-300">Gelişim & Sonuç: </span>
                                <span>{entry.outcomeOrReward}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Footer: Characters & Tags */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-900 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 flex items-center gap-1 font-semibold">
                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                            İlgili Karakterler:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.characterNames && entry.characterNames.length > 0 ? (
                              entry.characterNames.map((name, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-[11px]"
                                >
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-500 italic">Tüm Sefer Grubu</span>
                            )}
                          </div>
                        </div>

                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((t, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-VIEW 2: KILL RECORDS / DEFEATED MEMORY (ÖLDÜRÜLENLER HAFIZASI) */}
      {/* ============================================================ */}
      {subTab === 'kills' && (
        <div className="space-y-6">
          {/* Kill Trophy Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-950 border border-rose-500/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  TOPLAM ALT EDİLEN DÜŞMAN
                </span>
                <Skull className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">{totalKills}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Sefer boyunca itlaf edilen hedefler</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-950/40 via-zinc-900 to-zinc-950 border border-purple-500/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  ALT EDİLEN BOSS / ANA DÜŞMAN
                </span>
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">{bossKills}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Büyük tehditlerin sonu</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  KAHRAMAN AV SIRALAMASI
                </span>
                <Swords className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {characters.map((c) => {
                  const count = killRecords.filter((k) => k.slayerCharacterId === c.id).length;
                  return (
                    <span
                      key={c.id}
                      className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 font-bold"
                    >
                      {c.name.split(' ')[0]}: <span className="text-amber-400">{count}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter Bar for Kills */}
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-rose-400" />
                Filtrele:
              </span>

              {/* Slayer Character Filter */}
              <select
                value={killCharFilter}
                onChange={(e) => setKillCharFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
              >
                <option value="all">Tüm Öldürenler</option>
                <option value="group">Tüm Grup / Ortak Zafer</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Target Category Filter */}
              <select
                value={killCategoryFilter}
                onChange={(e) => setKillCategoryFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
              >
                <option value="all">Tüm Düşman Türleri</option>
                <option value="boss">Boss / Baş Düşman</option>
                <option value="main">Ana Düşman</option>
                <option value="supporting">Destek / Elit Savaşçı</option>
                <option value="monster">Canavar / Yaratık</option>
                <option value="beast">Yırtıcı Hayvan</option>
                <option value="nameless">Minyon / Ayak Takımı</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={killSearch}
                onChange={(e) => setKillSearch(e.target.value)}
                placeholder="Düşman, vuruş veya lokasyon ara..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Quick Import from Defeated NPCs Box (if any) */}
          {npcs.some((n) => n.status === 'defeated') && (
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Skull className="w-4 h-4 text-rose-400" />
                <span>NPC Panelinde yenilmiş olarak işaretlenen düşmanlar var:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {npcs
                  .filter((n) => n.status === 'defeated')
                  .map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleImportFromNPC(n)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Bu NPC'yi Öldürülenler Hafızasına Aktar"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{n.name} (Hafızaya Al)</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Kill Cards Grid */}
          {filteredKills.length === 0 ? (
            <div className="p-12 text-center bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl">
              <Skull className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-300">Kayıtlı Düşman Zaferi Bulunamadı</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Karakterlerinizin alt ettiği canavarları, suikastle öldürülen düşmanları veya boss zaferlerini hafızaya ekleyin.
              </p>
              <button
                type="button"
                onClick={() => handleOpenKillModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <Skull className="w-4 h-4" />
                İlk Düşman İtlafını Kaydet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredKills.map((rec) => {
                const catBadge = getCategoryBadge(rec.targetCategory);

                return (
                  <div
                    key={rec.id}
                    className="p-4 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 group transition-all"
                  >
                    <div className="space-y-3">
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 shrink-0 relative">
                            {rec.targetAvatarUrl ? (
                              <img
                                src={rec.targetAvatarUrl}
                                alt={rec.targetName}
                                referrerPolicy="no-referrer"
                                style={{
                                  objectPosition: rec.targetAvatarPosition || '50% 50%',
                                  transform: rec.targetAvatarScale ? `scale(${rec.targetAvatarScale})` : undefined,
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                <Skull className="w-7 h-7 text-rose-500/70" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          </div>

                          <div>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${catBadge.color}`}
                            >
                              {catBadge.label}
                            </span>
                            <h4 className="text-base font-bold text-white leading-tight mt-1">
                              {rec.targetName}
                            </h4>
                            {rec.targetTitle && (
                              <p className="text-xs text-zinc-400 line-clamp-1">{rec.targetTitle}</p>
                            )}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenKillModal(rec)}
                            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteKillRecord(rec.id)}
                            className="p-1 rounded-lg bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-zinc-800 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Slayer & Location Box */}
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-500 font-semibold flex items-center gap-1">
                            <Swords className="w-3 h-3 text-amber-400" />
                            Öldüren:
                          </span>
                          <span className="font-bold text-amber-300">{rec.slayerCharacterName}</span>
                        </div>

                        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                          <span className="flex items-center gap-1 text-zinc-500">
                            <MapPin className="w-3 h-3 text-zinc-400" />
                            Lokasyon:
                          </span>
                          <span className="truncate max-w-[140px]">{rec.location}</span>
                        </div>

                        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                          <span className="flex items-center gap-1 text-zinc-500">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            Oturum:
                          </span>
                          <span>{rec.sessionOrDate}</span>
                        </div>
                      </div>

                      {/* Finishing Blow (Son Darbe / Ölüm Şekli) */}
                      {rec.finishingBlow && (
                        <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1 text-xs">
                          <span className="font-bold text-rose-300 flex items-center gap-1">
                            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                            Son Darbe / Ölüm Anı:
                          </span>
                          <p className="text-zinc-300 text-[11px] italic leading-relaxed">
                            "{rec.finishingBlow}"
                          </p>
                        </div>
                      )}

                      {/* Loot / Ganimet & Reward */}
                      {rec.lootOrReward && (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-300">Ganimet: </span>
                            <span className="text-[11px]">{rec.lootOrReward}</span>
                          </div>
                        </div>
                      )}

                      {/* Memory Notes */}
                      {rec.notes && (
                        <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                          {rec.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TIMELINE ENTRY MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isTimelineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">
                    {editingTimelineEntry ? 'Aşamayı Düzenle' : 'Yeni Macera Aşaması / Kilometre Taşı Ekle'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimelineModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTimelineSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Title & Phase */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Aşama / Olay Başlığı *</label>
                    <input
                      type="text"
                      required
                      value={tlTitle}
                      onChange={(e) => setTlTitle(e.target.value)}
                      placeholder="Örn: Çan Kulesi Baskını & Taş Golem Zaferi"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Oturum / Safha İsmi *</label>
                    <input
                      type="text"
                      required
                      value={tlPhase}
                      onChange={(e) => setTlPhase(e.target.value)}
                      placeholder="Örn: Safha 2: Çan Kulesi (Oturum 3)"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Milestone Type & In-Game Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Aşama / Milestone Türü</label>
                    <select
                      value={tlType}
                      onChange={(e) => setTlType(e.target.value as MilestoneType)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="phase">Macera Safhası (Phase)</option>
                      <option value="major_milestone">Büyük Kilometre Taşı (Major)</option>
                      <option value="significant_milestone">Önemli Kilometre Taşı (+1 Beceri)</option>
                      <option value="minor_milestone">Küçük Kilometre Taşı (Yön)</option>
                      <option value="combat_victory">Büyük Zafer & Boss</option>
                      <option value="kill">Düşman İtlafı / Av</option>
                      <option value="tragedy">Yara / Ağır Sonuç (Consequence)</option>
                      <option value="discovery">Kadim Keşif</option>
                      <option value="title_item">Unvan & Yadigar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Oyun İçi / Gerçek Tarih</label>
                    <input
                      type="text"
                      value={tlDate}
                      onChange={(e) => setTlDate(e.target.value)}
                      placeholder="Örn: 3. Hafta - Kan Ayı"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Lokasyon / Bölge</label>
                    <input
                      type="text"
                      value={tlLocation}
                      onChange={(e) => setTlLocation(e.target.value)}
                      placeholder="Örn: Karanlık Çan Kulesi"
                      list="locations-datalist"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                    <datalist id="locations-datalist">
                      {locations.map((loc, i) => (
                        <option key={i} value={loc} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Character Involvement Selection */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">
                    İlgili Karakterler (Çoklu Seçim)
                  </label>
                  <div className="flex flex-wrap gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                    {characters.map((c) => {
                      const isSelected = tlCharIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setTlCharIds(tlCharIds.filter((id) => id !== c.id));
                            } else {
                              setTlCharIds([...tlCharIds, c.id]);
                            }
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <User className="w-3 h-3" />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Story Description */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Olayın & Aşamanın Anlatısı *</label>
                  <textarea
                    required
                    rows={3}
                    value={tlDescription}
                    onChange={(e) => setTlDescription(e.target.value)}
                    placeholder="Bu aşamada neler yaşandı? Kahramanlar hangi engelleri aştı?"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Outcome / Reward */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Sonuç, Ödül veya Karakter Gelişimi (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={tlOutcome}
                    onChange={(e) => setTlOutcome(e.target.value)}
                    placeholder="Örn: +1 Zanaat Becerisi, Rünik Kalkan Kartı açıldı, Ağır Yara (-6) alındı."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Image Upload & Focal Point */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Görsel (Cihazdan Yükle veya URL)
                  </label>
                  <div className="space-y-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="relative w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {tlImageUrl ? (
                          <>
                            <img
                              src={tlImageUrl}
                              alt="Aşama Görseli"
                              referrerPolicy="no-referrer"
                              style={{
                                objectPosition: tlImagePosition,
                                transform: `scale(${tlImageScale})`,
                              }}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setTlImageUrl('')}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <ImageIcon className="w-6 h-6 text-zinc-600" />
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cihazdan Fotoğraf Seç</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (uploadEvent) => {
                                  if (uploadEvent.target?.result) {
                                    setTlImageUrl(uploadEvent.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <input
                          type="url"
                          value={tlImageUrl}
                          onChange={(e) => setTlImageUrl(e.target.value)}
                          placeholder="Veya görsel linki (https://...)"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {tlImageUrl && (
                      <div className="pt-2 border-t border-zinc-800">
                        <ImageFocalControl
                          imageUrl={tlImageUrl}
                          position={tlImagePosition}
                          scale={tlImageScale}
                          onChangePosition={setTlImagePosition}
                          onChangeScale={setTlImageScale}
                          label="Aşama Görseli Kadraj & Odak Noktası"
                          previewShape="banner"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Etiketler (Virgülle ayırın)</label>
                  <input
                    type="text"
                    value={tlTags}
                    onChange={(e) => setTlTags(e.target.value)}
                    placeholder="Örn: Kilometre Taşı, Boss, Kule, Zafer"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsTimelineModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
                  >
                    {editingTimelineEntry ? 'Güncellemeyi Kaydet' : 'Aşamayı Ekle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* KILL RECORD MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isKillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Skull className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-white text-base">
                    {editingKillRecord ? 'Düşman İtlafını Düzenle' : 'Karakterin Öldürdüğü Düşmanı Hafızaya Al'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKillModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveKillSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Slayer Character & Target Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">
                      Öldüren / Son Darbeyi Vuran Karakter *
                    </label>
                    <select
                      value={killSlayerId}
                      onChange={(e) => setKillSlayerId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500 font-semibold"
                    >
                      <option value="group">⚔️ Tüm Grup (Ortak Zafer)</option>
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          👤 {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">
                      Öldürülen Düşman / Canavar İsmi *
                    </label>
                    <input
                      type="text"
                      required
                      value={killTargetName}
                      onChange={(e) => setKillTargetName(e.target.value)}
                      placeholder="Örn: Gölge Tazısı Alfa, Malakar"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Target Title & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Düşman Unvanı / Açıklaması</label>
                    <input
                      type="text"
                      value={killTargetTitle}
                      onChange={(e) => setKillTargetTitle(e.target.value)}
                      placeholder="Örn: Tarikat Komutanı, Orman Canavarı"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Tehdit Seviyesi / Türü</label>
                    <select
                      value={killTargetCategory}
                      onChange={(e) => setKillTargetCategory(e.target.value as TargetCategory)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="boss">👑 BÜYÜK BOSS</option>
                      <option value="main">🔥 Ana Düşman</option>
                      <option value="supporting">🛡️ Destek / Elit Savaşçı</option>
                      <option value="monster">🐺 Canavar / Yaratık</option>
                      <option value="beast">🐾 Yırtıcı Hayvan</option>
                      <option value="nameless">👥 Minyon / Sürü</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Lokasyon / Oturum</label>
                    <input
                      type="text"
                      value={killLocation}
                      onChange={(e) => setKillLocation(e.target.value)}
                      placeholder="Örn: Gölge Ormanı & Harabeler"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Finishing Blow (Son Darbe / Nasıl Öldürüldü?) */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Ölüm Anı / Son Darbe (Nasıl Öldürüldü?) *
                  </label>
                  <textarea
                    rows={2}
                    value={killBlow}
                    onChange={(e) => setKillBlow(e.target.value)}
                    placeholder="Örn: 4dF +3 Dövüş zarıyla rünik balyozunu doğrudan kafasına indirdi veya gölge büyüsüyle kule penceresinden fırlattı."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 leading-relaxed"
                  />
                </div>

                {/* Loot or Reward */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Düşen Ganimet / Kazanılan Ödül (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={killLoot}
                    onChange={(e) => setKillLoot(e.target.value)}
                    placeholder="Örn: Kadim Rün Taşı, +200 Altın, Özel Kart: Alev Hançeri"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Target Avatar & Focal Control */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Düşman Görseli (Cihazdan Yükle veya URL)
                  </label>
                  <div className="space-y-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="relative w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {killAvatarUrl ? (
                          <>
                            <img
                              src={killAvatarUrl}
                              alt="Düşman Görseli"
                              referrerPolicy="no-referrer"
                              style={{
                                objectPosition: killAvatarPosition,
                                transform: `scale(${killAvatarScale})`,
                              }}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setKillAvatarUrl('')}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <Skull className="w-6 h-6 text-zinc-600" />
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cihazdan Fotoğraf Seç</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (uploadEvent) => {
                                  if (uploadEvent.target?.result) {
                                    setKillAvatarUrl(uploadEvent.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <input
                          type="url"
                          value={killAvatarUrl}
                          onChange={(e) => setKillAvatarUrl(e.target.value)}
                          placeholder="Veya görsel bağlantısı (https://...)"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    {killAvatarUrl && (
                      <div className="pt-2 border-t border-zinc-800">
                        <ImageFocalControl
                          imageUrl={killAvatarUrl}
                          position={killAvatarPosition}
                          scale={killAvatarScale}
                          onChangePosition={setKillAvatarPosition}
                          onChangeScale={setKillAvatarScale}
                          label="Düşman Görseli Kadraj & Odak Noktası"
                          previewShape="square"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Memory Notes */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Zafer Hafızası & GM Notu (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={killNotes}
                    onChange={(e) => setKillNotes(e.target.value)}
                    placeholder="Örn: Bu zafer grubun şehirde kahraman ilan edilmesini sağladı."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsKillModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer transition-all active:scale-95"
                  >
                    {editingKillRecord ? 'Güncellemeyi Kaydet' : 'Zaferi Hafızaya Ekle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
