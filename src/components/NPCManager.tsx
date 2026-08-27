import React, { useState } from 'react';
import { NPC, Stunt, SpecialCard } from '../types/fate';
import { DEFAULT_FATE_SKILLS, calculateCharacterCardBonuses, RARITY_CONFIG } from '../utils/fateLadder';
import { ImageFocalControl } from './ImageFocalControl';
import { sfx } from '../utils/sound';
import {
  Users,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Dices,
  Shield,
  Brain,
  Eye,
  EyeOff,
  Search,
  Filter,
  Swords,
  Skull,
  HeartHandshake,
  Check,
  X,
  History,
  Sparkles,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NPCManagerProps {
  npcs: NPC[];
  locations: string[];
  currentCampaignLocation: string;
  allCards?: SpecialCard[];
  onSaveNPC: (npc: NPC) => void;
  onDeleteNPC: (npcId: string) => void;
  onQuickRoll: (rollerName: string, skillName: string, skillBonus: number, cardBonus: number) => void;
  onAddLocation?: (locationName: string) => void;
  isGM?: boolean;
}

export const NPCManager: React.FC<NPCManagerProps> = ({
  npcs,
  locations,
  currentCampaignLocation,
  allCards = [],
  onSaveNPC,
  onDeleteNPC,
  onQuickRoll,
  onAddLocation,
  isGM = true,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'nameless' | 'supporting' | 'main'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNpcId, setEditingNpcId] = useState<string | null>(null);

  // Quick Location Switcher state for an NPC
  const [locationSwitcherNPC, setLocationSwitcherNPC] = useState<NPC | null>(null);
  const [customNewLocation, setCustomNewLocation] = useState<string>('');

  // Form State for creating/editing NPC
  const [formName, setFormName] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<NPC['category']>('supporting');
  const [formLocation, setFormLocation] = useState<string>(currentCampaignLocation || locations[0] || 'Eski Liman Hanı');
  const [formAvatarUrl, setFormAvatarUrl] = useState<string>('');
  const [formAvatarPosition, setFormAvatarPosition] = useState<string>('50% 50%');
  const [formAvatarScale, setFormAvatarScale] = useState<number>(1);
  const [formHighConcept, setFormHighConcept] = useState<string>('');
  const [formTrouble, setFormTrouble] = useState<string>('');
  const [formAspects, setFormAspects] = useState<string>('');
  const [formSkills, setFormSkills] = useState<Record<string, number>>({ 'Dövüş': 3, 'Farkındalık': 2 });
  const [formStunts, setFormStunts] = useState<Stunt[]>([]);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formGmSecrets, setFormGmSecrets] = useState<string>('');
  const [formStatus, setFormStatus] = useState<NPC['status']>('active');

  const openCreateModal = () => {
    setEditingNpcId(null);
    setFormName('');
    setFormTitle('');
    setFormCategory('supporting');
    setFormLocation('Bilinmiyor');
    setFormAvatarUrl('https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&auto=format&fit=crop&q=80');
    setFormAvatarPosition('50% 50%');
    setFormAvatarScale(1);
    setFormHighConcept('');
    setFormTrouble('');
    setFormAspects('');
    setFormSkills({ 'Dövüş': 3, 'Farkındalık': 2 });
    setFormStunts([]);
    setFormNotes('');
    setFormGmSecrets('');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (npc: NPC) => {
    setEditingNpcId(npc.id);
    setFormName(npc.name);
    setFormTitle(npc.title || '');
    setFormCategory(npc.category);
    setFormLocation(npc.location || 'Bilinmiyor');
    setFormAvatarUrl(npc.avatarUrl || '');
    setFormAvatarPosition(npc.avatarPosition || '50% 50%');
    setFormAvatarScale(npc.avatarScale || 1);
    setFormHighConcept(npc.highConcept);
    setFormTrouble(npc.trouble || '');
    setFormAspects(npc.aspects ? npc.aspects.join(', ') : '');
    setFormSkills({ ...npc.skills });
    setFormStunts(npc.stunts ? JSON.parse(JSON.stringify(npc.stunts)) : []);
    setFormNotes(npc.notes || '');
    setFormGmSecrets(npc.gmSecrets || '');
    setFormStatus(npc.status);
    setIsModalOpen(true);
  };

  const handleDuplicate = (npc: NPC) => {
    const clone: NPC = {
      ...npc,
      id: `npc-${Date.now()}`,
      name: `${npc.name} (Kopya)`,
    };
    onSaveNPC(clone);
    sfx.playSuccessSound();
  };

  const handleQuickLocationUpdate = (npc: NPC, newLoc: string) => {
    if (!newLoc || newLoc === npc.location) return;
    const prevs = npc.previousLocations || [];
    const updated: NPC = {
      ...npc,
      location: newLoc,
      previousLocations: [npc.location, ...prevs.filter(l => l !== npc.location)].slice(0, 5),
    };
    onSaveNPC(updated);
    sfx.playSuccessSound();
    setLocationSwitcherNPC(null);
    setCustomNewLocation('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const charName = formName.trim() || `NPC #${npcs.length + 1}`;
    const charHighConcept = formHighConcept.trim() || 'Bilinmiyor / Belirlenmedi';
    const charLocation = formLocation.trim() || 'Bilinmiyor';

    const existingNpc = npcs.find((n) => n.id === editingNpcId);
    const prevLocations = existingNpc?.previousLocations || [];
    if (existingNpc && existingNpc.location !== charLocation && !prevLocations.includes(existingNpc.location)) {
      prevLocations.unshift(existingNpc.location);
    }

    const npcData: NPC = {
      id: editingNpcId || `npc-${Date.now()}`,
      name: charName,
      title: formTitle.trim(),
      category: formCategory,
      location: charLocation,
      previousLocations: prevLocations.slice(0, 5),
      avatarUrl: formAvatarUrl.trim() || undefined,
      avatarPosition: formAvatarPosition,
      avatarScale: formAvatarScale,
      highConcept: charHighConcept,
      trouble: formTrouble.trim() || undefined,
      aspects: formAspects
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      skills: formSkills,
      stunts: formStunts,
      stress: existingNpc?.stress || {
        physical: [false, false, false],
        mental: [false, false],
      },
      consequences: existingNpc?.consequences || [],
      notes: formNotes.trim(),
      gmSecrets: formGmSecrets.trim(),
      isInEncounter: existingNpc?.isInEncounter ?? true,
      status: formStatus,
    };

    onSaveNPC(npcData);
    setIsModalOpen(false);
  };

  const toggleStress = (npc: NPC, type: 'physical' | 'mental', index: number) => {
    const stressObj = { ...npc.stress };
    const list = [...stressObj[type]];
    list[index] = !list[index];
    stressObj[type] = list;
    onSaveNPC({ ...npc, stress: stressObj });
  };

  const toggleInEncounter = (npc: NPC) => {
    onSaveNPC({ ...npc, isInEncounter: !npc.isInEncounter });
  };

  // Filter NPCs
  const filteredNpcs = npcs.filter((npc) => {
    const matchesSearch =
      npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.highConcept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (npc.title && npc.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || npc.category === categoryFilter;
    const matchesLocation = locationFilter === 'all' || npc.location === locationFilter;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div id="fate-npc-manager" className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              NPC Yönetim Paneli
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Konumları dinamik güncellenebilen, becerileri ve GM sırları yönetilen NPC & Boss takip sistemi.
            </p>
          </div>
        </div>

        {isGM && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni NPC Ekle</span>
          </button>
        )}
      </div>

      {/* Search & Location/Category Filters */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="NPC ara (isim, konum, konsept)..."
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Location Filter */}
          <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Tüm Konumlar</option>
              <option value="Bilinmiyor">❓ Bilinmiyor / Boşta</option>
              {locations
                .filter((l) => l !== 'Bilinmiyor')
                .map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Tüm Kategoriler ({npcs.length})</option>
              <option value="main">Ana Boss / Liderler</option>
              <option value="supporting">Destekleyici NPC'ler</option>
              <option value="nameless">Minyonlar / İsimsiz</option>
            </select>
          </div>
        </div>
      </div>

      {/* NPC Grid Cards */}
      {filteredNpcs.length === 0 ? (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-300">Eşleşen NPC Bulunamadı</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1">
            Filtreleri temizleyebilir veya yeni bir NPC oluşturabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredNpcs.map((npc) => {
            const { skillBonuses, extraPhysicalStress, extraMentalStress, assignedCards } =
              calculateCharacterCardBonuses(npc.id, allCards);

            return (
              <motion.div
                key={npc.id}
                layout
                className={`bg-zinc-900 border rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between ${
                  npc.category === 'main'
                    ? 'border-red-500/40 bg-gradient-to-b from-zinc-900 to-red-950/20'
                    : npc.category === 'supporting'
                    ? 'border-amber-500/30'
                    : 'border-zinc-800'
                }`}
              >
                <div>
                  {/* Top Bar: Location Switcher & Category Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-zinc-800/80">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Category Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          npc.category === 'main'
                            ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                            : npc.category === 'supporting'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/50'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {npc.category === 'main' && '👑 Ana Boss / Lider'}
                        {npc.category === 'supporting' && '🎭 Destekleyici NPC'}
                        {npc.category === 'nameless' && '⚔️ Minyon'}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                          npc.status === 'active'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/30'
                            : npc.status === 'allied'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-600/30'
                            : npc.status === 'defeated'
                            ? 'bg-zinc-950 text-zinc-500 border border-zinc-800'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-600/30'
                        }`}
                      >
                        {npc.status === 'active' && 'Aktif'}
                        {npc.status === 'allied' && 'Müttefik'}
                        {npc.status === 'defeated' && 'Yenildi'}
                        {npc.status === 'hidden' && 'Gizli'}
                      </span>
                    </div>

                    {/* Dynamic Location Quick Switcher Button */}
                    <button
                      type="button"
                      onClick={() => setLocationSwitcherNPC(npc)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="NPC Konumunu Güncelle"
                    >
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      <span className="truncate max-w-[140px]">{npc.location}</span>
                    </button>
                  </div>

                  {/* NPC Identity & Portrait */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700 shrink-0">
                      {npc.avatarUrl ? (
                        <img
                          src={npc.avatarUrl}
                          alt={npc.name}
                          style={{
                            objectPosition: npc.avatarPosition || '50% 50%',
                            transform: npc.avatarScale ? `scale(${npc.avatarScale})` : undefined,
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                        {npc.name}
                      </h3>
                      {npc.title && <p className="text-xs text-zinc-400 font-medium italic">{npc.title}</p>}
                      <p className="text-xs font-semibold text-amber-300 mt-1">★ {npc.highConcept}</p>
                      {npc.trouble && <p className="text-xs text-rose-400 italic">⚡ {npc.trouble}</p>}
                    </div>
                  </div>

                  {/* Previous Encounter Locations trail */}
                  {npc.previousLocations && npc.previousLocations.length > 0 && (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                      <History className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="text-zinc-500">Önceki Karşılaşmalar:</span>
                      {npc.previousLocations.map((loc, i) => (
                        <span key={i} className="text-zinc-300 flex items-center gap-1">
                          {loc} {i < npc.previousLocations.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-zinc-600" />}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Assigned Special Cards Section */}
                  {assignedCards.length > 0 && (
                    <div className="mb-3 p-2.5 rounded-xl bg-purple-950/20 border border-purple-800/40">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-400" />
                          Kuşanılan Özel Kartlar ({assignedCards.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {assignedCards.map((card) => {
                          const rConfig = RARITY_CONFIG[card.rarity];
                          return (
                            <div
                              key={card.id}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border bg-zinc-950 ${rConfig.cardBorder}`}
                              title={card.description}
                            >
                              {card.imageUrl && (
                                <img
                                  src={card.imageUrl}
                                  alt={card.name}
                                  style={{
                                    objectPosition: card.imagePosition || '50% 50%',
                                    transform: card.imageScale ? `scale(${card.imageScale})` : undefined,
                                  }}
                                  className="w-4 h-4 rounded object-cover"
                                />
                              )}
                              <span className={rConfig.accentColor}>{card.name}</span>
                              {card.bonuses && card.bonuses.length > 0 && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/60 text-purple-200 font-mono">
                                  {card.bonuses.map((b) => (b.type === 'skill' ? `${b.targetSkill} +${b.value}` : `+${b.value} ${b.type}`)).join(', ')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Skills & 1-Click Dice Roller Buttons */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Beceriler (Zar atmak için tıklayın)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(npc.skills).map(([sk, rawVal]) => {
                        const val = Number(rawVal) || 0;
                        const cardBonus = skillBonuses[sk] || 0;
                        const totalBonus = val + cardBonus;

                        return (
                          <button
                            key={sk}
                            type="button"
                            onClick={() => onQuickRoll(npc.name, sk, val, cardBonus)}
                            className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700/80 hover:border-orange-500/60 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer group"
                          >
                            <Dices className="w-3 h-3 text-orange-400 group-hover:rotate-45 transition-transform" />
                            <span>{sk}</span>
                            <span className="font-mono font-bold text-amber-400">+{val}</span>
                            {cardBonus > 0 && (
                              <span className="text-[10px] text-purple-300 font-mono font-bold bg-purple-950/80 px-1 rounded border border-purple-500/30">
                                +{cardBonus} Kart
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stunts */}
                  {npc.stunts && npc.stunts.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {npc.stunts.map((st) => (
                        <div key={st.id} className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs">
                          <span className="font-bold text-amber-300">{st.name}: </span>
                          <span className="text-zinc-300">{st.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stress Tracks */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-bold block mb-1">
                        Fiziksel Stres {extraPhysicalStress > 0 && <span className="text-purple-300">(+{extraPhysicalStress} Kart)</span>}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {npc.stress.physical.map((marked, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleStress(npc, 'physical', idx)}
                            className={`w-7 h-7 rounded-lg border text-xs font-mono font-bold transition-colors ${
                              marked
                                ? 'bg-rose-900 border-rose-500 text-rose-200'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-bold block mb-1">
                        Zihinsel Stres {extraMentalStress > 0 && <span className="text-purple-300">(+{extraMentalStress} Kart)</span>}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {npc.stress.mental.map((marked, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleStress(npc, 'mental', idx)}
                            className={`w-7 h-7 rounded-lg border text-xs font-mono font-bold transition-colors ${
                              marked
                                ? 'bg-purple-900 border-purple-500 text-purple-200'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* GM Secrets Box (Only visible in GM Mode) */}
                  {isGM && npc.gmSecrets && (
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-600/40 text-xs mb-3">
                      <div className="flex items-center gap-1 text-purple-300 font-bold mb-1">
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>GM Gizli Bilgisi & Zayıflığı:</span>
                      </div>
                      <p className="text-zinc-300 italic">{npc.gmSecrets}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleInEncounter(npc)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      npc.isInEncounter
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-600/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>{npc.isInEncounter ? 'Karşılaşmada Aktif' : 'Pasif / Yedek'}</span>
                  </button>

                  {isGM && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(npc)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        title="NPC'yi Klonla"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(npc)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNPC(npc.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Location Switcher Modal */}
      <AnimatePresence>
        {locationSwitcherNPC && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  {locationSwitcherNPC.name} Konumunu Taşı
                </h3>
                <button
                  type="button"
                  onClick={() => setLocationSwitcherNPC(null)}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-3">
                Mevcut Konum: <span className="font-bold text-amber-300">{locationSwitcherNPC.location}</span>
              </p>

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => handleQuickLocationUpdate(locationSwitcherNPC, 'Bilinmiyor')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    locationSwitcherNPC.location === 'Bilinmiyor'
                      ? 'bg-orange-950/60 border-orange-500 text-orange-200'
                      : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <span>❓ Bilinmiyor / Boşta (Konumsuz)</span>
                  {locationSwitcherNPC.location === 'Bilinmiyor' && <Check className="w-4 h-4 text-orange-400" />}
                </button>
                {locations
                  .filter((l) => l !== 'Bilinmiyor')
                  .map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => handleQuickLocationUpdate(locationSwitcherNPC, loc)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        locationSwitcherNPC.location === loc
                          ? 'bg-orange-950/60 border-orange-500 text-orange-200'
                          : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span>📍 {loc}</span>
                      {locationSwitcherNPC.location === loc && <Check className="w-4 h-4 text-orange-400" />}
                    </button>
                  ))}
              </div>

              {/* Add and assign to brand new custom location */}
              <div className="pt-3 border-t border-zinc-800">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Yeni Konum Oluştur & Taşı:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customNewLocation}
                    onChange={(e) => setCustomNewLocation(e.target.value)}
                    placeholder="Örn: Gizli Zindan 2. Kat..."
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    disabled={!customNewLocation.trim()}
                    onClick={() => {
                      if (onAddLocation && customNewLocation.trim()) {
                        onAddLocation(customNewLocation.trim());
                      }
                      handleQuickLocationUpdate(locationSwitcherNPC, customNewLocation.trim());
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold"
                  >
                    Taşı
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full NPC Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl my-auto text-white"
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      {editingNpcId ? 'NPC Düzenle' : 'Yeni NPC / Karakter Ekle'}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Konumunu, becerilerini ve GM sırlarını belirleyin.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <p className="text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                  💡 <strong>Hızlı & Esnek:</strong> Konum veya detay seçmek zorunda değilsiniz. Boş bırakırsanız <em>Bilinmiyor / Boşta</em> olarak kaydedilir ve oyun akışında tek tıkla konum atayabilirsiniz.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">NPC İsmi (Opsiyonel)</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Örn: Lord Malakar (Boşsa: NPC #X)"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Unvan / Rol (Opsiyonel)</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Örn: Gölge Tarikatı Baş Rahibi..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Kategori</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as NPC['category'])}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="main">👑 Ana Boss / Lider</option>
                      <option value="supporting">🎭 Destekleyici NPC</option>
                      <option value="nameless">⚔️ Minyon / İsimsiz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Konum (Opsiyonel)</label>
                    <select
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
                    >
                      <option value="Bilinmiyor">❓ Bilinmiyor / Boşta (Konumsuz)</option>
                      {locations
                        .filter((l) => l !== 'Bilinmiyor')
                        .map((loc) => (
                          <option key={loc} value={loc}>
                            📍 {loc}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Durum</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as NPC['status'])}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="active">Aktif</option>
                      <option value="allied">Müttefik</option>
                      <option value="defeated">Yenildi</option>
                      <option value="hidden">Gizli</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Ana Konsept (High Concept - Opsiyonel)</label>
                    <input
                      type="text"
                      value={formHighConcept}
                      onChange={(e) => setFormHighConcept(e.target.value)}
                      placeholder="Bilinmiyor (Örn: Ruh Dokuyucusu)"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Bela (Trouble - Opsiyonel)</label>
                    <input
                      type="text"
                      value={formTrouble}
                      onChange={(e) => setFormTrouble(e.target.value)}
                      placeholder="Bilinmiyor (Örn: Ölümsüzlük Ritüeli)"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Avatar with Device File Upload & URL & Focal Positioning */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    NPC Görseli / Avatar (Cihazdan Yükle veya URL)
                  </label>
                  <div className="space-y-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* Thumbnail Preview */}
                      <div className="relative w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {formAvatarUrl ? (
                          <>
                            <img
                              src={formAvatarUrl}
                              alt="NPC Avatar"
                              referrerPolicy="no-referrer"
                              style={{
                                objectPosition: formAvatarPosition,
                                transform: `scale(${formAvatarScale})`,
                              }}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setFormAvatarUrl('')}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                              title="Görseli Kaldır"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <ImageIcon className="w-6 h-6 text-zinc-600" />
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        {/* Device File Upload Input */}
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 hover:text-orange-200 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cihazdan Görsel Seç / Yükle</span>
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
                                    setFormAvatarUrl(uploadEvent.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {/* Optional URL Input */}
                        <input
                          type="url"
                          value={formAvatarUrl}
                          onChange={(e) => setFormAvatarUrl(e.target.value)}
                          placeholder="Veya görsel URL'si yapıştırın (https://...)"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Image Focal & Zoom Controls */}
                    {formAvatarUrl && (
                      <div className="pt-2 border-t border-zinc-800">
                        <ImageFocalControl
                          imageUrl={formAvatarUrl}
                          position={formAvatarPosition}
                          scale={formAvatarScale}
                          onChangePosition={setFormAvatarPosition}
                          onChangeScale={setFormAvatarScale}
                          label="NPC Görsel Odak Noktası & Kadraj Ayarı"
                          previewShape="square"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Ek Yönler (Virgülle ayırın)</label>
                  <input
                    type="text"
                    value={formAspects}
                    onChange={(e) => setFormAspects(e.target.value)}
                    placeholder="Gölge Muhafızları Her Yerde, Acımasız Manipülasyon Ustası..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Skills quick picker */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <span className="text-xs font-bold text-amber-300 block mb-2">Beceriler (Skills)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEFAULT_FATE_SKILLS.slice(0, 12).map((sk) => {
                      const val = formSkills[sk] || 0;
                      return (
                        <div key={sk} className="flex items-center justify-between bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-xs">
                          <span>{sk}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const next = { ...formSkills };
                                if (val <= 1) delete next[sk];
                                else next[sk] = val - 1;
                                setFormSkills(next);
                              }}
                              className="w-5 h-5 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-amber-400 w-4 text-center">
                              {val}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormSkills({ ...formSkills, [sk]: val + 1 });
                              }}
                              className="w-5 h-5 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GM Secrets Box */}
                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
                    <EyeOff className="w-3.5 h-3.5" />
                    GM Gizli Notları & Taktik Sırları (Oyuncular Göremez)
                  </label>
                  <textarea
                    rows={2}
                    value={formGmSecrets}
                    onChange={(e) => setFormGmSecrets(e.target.value)}
                    placeholder="Bu NPC'nin gerçek hedefi, zayıf noktası, gizli ittifakları..."
                    className="w-full bg-purple-950/30 border border-purple-700/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 cursor-pointer"
                  >
                    {editingNpcId ? 'Değişiklikleri Kaydet' : 'NPC Oluştur'}
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
