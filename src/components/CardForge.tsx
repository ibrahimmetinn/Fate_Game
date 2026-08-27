import React, { useState, useRef } from 'react';
import { SpecialCard, FateRarity, StatBonus, Character, NPC } from '../types/fate';
import { CardItem } from './CardItem';
import { ImageFocalControl } from './ImageFocalControl';
import { RARITY_CONFIG, DEFAULT_FATE_SKILLS } from '../utils/fateLadder';
import { sfx } from '../utils/sound';
import {
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  UserCheck,
  Search,
  Filter,
  Check,
  X,
  Zap,
  Tag,
  BookOpen,
  Users,
  Skull,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CardForgeProps {
  cards: SpecialCard[];
  characters: Character[];
  npcs?: NPC[];
  onSaveCard: (card: SpecialCard) => void;
  onDeleteCard: (cardId: string) => void;
  onAssignCard: (cardId: string, characterId: string | null) => void;
  isGM?: boolean;
}

const PRESET_IMAGES = [
  { label: 'Gölge Büyüsü', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80' },
  { label: 'Rünik Kalkan', url: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&auto=format&fit=crop&q=80' },
  { label: 'Alev Bıçağı', url: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Kadim Muska', url: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600&auto=format&fit=crop&q=80' },
  { label: 'Kozmik Zihin', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80' },
  { label: 'Siber Kristal', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80' },
  { label: 'Ejderha Kalbi', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80' },
  { label: 'Yıldırım Asası', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80' },
];

export const CardForge: React.FC<CardForgeProps> = ({
  cards,
  characters,
  npcs = [],
  onSaveCard,
  onDeleteCard,
  onAssignCard,
  isGM = true,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRarity, setSelectedRarity] = useState<FateRarity | 'all'>('all');
  const [selectedAssignFilter, setSelectedAssignFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [assignModalCard, setAssignModalCard] = useState<SpecialCard | null>(null);
  const [assignTab, setAssignTab] = useState<'all' | 'characters' | 'npcs'>('all');

  // Form State for Designing/Editing Card
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formSubtitle, setFormSubtitle] = useState<string>('');
  const [formRarity, setFormRarity] = useState<FateRarity>('rare');
  const [formType, setFormType] = useState<SpecialCard['type']>('Yetenek');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formImagePosition, setFormImagePosition] = useState<string>('50% 50%');
  const [formImageScale, setFormImageScale] = useState<number>(1);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formRuleEffect, setFormRuleEffect] = useState<string>('');
  const [formBonuses, setFormBonuses] = useState<StatBonus[]>([]);
  const [formTags, setFormTags] = useState<string>('Yetenek, Büyü');
  const [formAssignedId, setFormAssignedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setEditingCardId(null);
    setFormName('');
    setFormSubtitle('');
    setFormRarity('rare');
    setFormType('Yetenek');
    setFormImageUrl(PRESET_IMAGES[0].url);
    setFormImagePosition('50% 50%');
    setFormImageScale(1);
    setFormDescription('');
    setFormRuleEffect('');
    setFormBonuses([
      { id: `b-${Date.now()}`, type: 'skill', targetSkill: 'Dövüş', value: 2, description: 'Temel Ustalık' },
    ]);
    setFormTags('Yetenek, Büyü');
    setFormAssignedId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditModal = (card: SpecialCard) => {
    setEditingCardId(card.id);
    setFormName(card.name);
    setFormSubtitle(card.subtitle || '');
    setFormRarity(card.rarity);
    setFormType(card.type);
    setFormImageUrl(card.imageUrl || '');
    setFormImagePosition(card.imagePosition || '50% 50%');
    setFormImageScale(card.imageScale || 1);
    setFormDescription(card.description || '');
    setFormRuleEffect(card.ruleEffect || '');
    setFormBonuses(card.bonuses ? JSON.parse(JSON.stringify(card.bonuses)) : []);
    setFormTags(card.tags ? card.tags.join(', ') : '');
    setFormAssignedId(card.assignedCharacterId);
    setIsFormOpen(true);
  };

  const handleDuplicate = (card: SpecialCard) => {
    const newCard: SpecialCard = {
      ...card,
      id: `card-${Date.now()}`,
      name: `${card.name} (Kopya)`,
      assignedCharacterId: null, // resets assignment for cloned copy
      assignedCharacterName: undefined,
      assignedTargetType: undefined,
      createdAt: Date.now(),
    };
    onSaveCard(newCard);
    sfx.playSuccessSound();
  };

  // Image file upload handler (converts file to base64 URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Bonus Builders
  const addBonus = () => {
    const newBonus: StatBonus = {
      id: `bonus-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'skill',
      targetSkill: 'Dövüş',
      value: 1,
      description: '',
    };
    setFormBonuses([...formBonuses, newBonus]);
  };

  const updateBonus = (index: number, updated: Partial<StatBonus>) => {
    const next = [...formBonuses];
    next[index] = { ...next[index], ...updated };
    setFormBonuses(next);
  };

  const removeBonus = (index: number) => {
    setFormBonuses(formBonuses.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const assignedChar = characters.find((c) => c.id === formAssignedId);
    const assignedNPC = npcs.find((n) => n.id === formAssignedId);

    const cardData: SpecialCard = {
      id: editingCardId || `card-${Date.now()}`,
      name: formName.trim(),
      subtitle: formSubtitle.trim(),
      rarity: formRarity,
      type: formType,
      imageUrl: formImageUrl.trim() || undefined,
      imagePosition: formImagePosition || '50% 50%',
      imageScale: formImageScale || 1,
      description: formDescription.trim(),
      ruleEffect: formRuleEffect.trim(),
      bonuses: formBonuses,
      assignedCharacterId: formAssignedId,
      assignedCharacterName: assignedChar ? assignedChar.name : (assignedNPC ? assignedNPC.name : undefined),
      assignedTargetType: assignedChar ? 'character' : (assignedNPC ? 'npc' : undefined),
      tags: formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: editingCardId ? Date.now() : Date.now(),
    };

    onSaveCard(cardData);
    sfx.playCardAssignSound();
    setIsFormOpen(false);
  };

  // Live preview card object
  const previewChar = characters.find((c) => c.id === formAssignedId);
  const previewNPC = npcs.find((n) => n.id === formAssignedId);
  const previewCard: SpecialCard = {
    id: 'preview',
    name: formName || 'Örnek Kart Başlığı',
    subtitle: formSubtitle || 'Nadirlik & Yetenek Başlığı',
    rarity: formRarity,
    type: formType,
    imageUrl: formImageUrl || PRESET_IMAGES[0].url,
    imagePosition: formImagePosition,
    imageScale: formImageScale,
    description: formDescription || 'Bu kartın oluşturduğu hikayesel açıklama ve atmosferik anlatı buraya gelecektir.',
    ruleEffect: formRuleEffect || 'Karaktere +2 Dövüş ve 1 Serbest Üstünlük Invoke sağlar.',
    bonuses: formBonuses,
    assignedCharacterId: formAssignedId,
    assignedCharacterName: previewChar?.name || previewNPC?.name,
    assignedTargetType: previewChar ? 'character' : (previewNPC ? 'npc' : undefined),
    tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
    createdAt: Date.now(),
  };

  // Filter cards
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.ruleEffect?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.tags && card.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesRarity = selectedRarity === 'all' || card.rarity === selectedRarity;

    const matchesAssign =
      selectedAssignFilter === 'all' ||
      (selectedAssignFilter === 'assigned' && !!card.assignedCharacterId) ||
      (selectedAssignFilter === 'unassigned' && !card.assignedCharacterId);

    return matchesSearch && matchesRarity && matchesAssign;
  });

  return (
    <div id="fate-card-forge" className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Özel Kart & Yetenek Tasarım Atölyesi (Card Forge)
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Nadirlik seviyelerine göre otomatik renklenen, fotoğraflı ve istatistiklere otomatik bonus aktaran kartlar.
              </p>
            </div>
          </div>
        </div>

        {isGM && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Özel Kart Tasarla</span>
          </button>
        )}
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kart ara (isim, etki, etiket)..."
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Rarity and Assignment Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Rarity Select */}
          <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as FateRarity | 'all')}
              className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Tüm Nadirlikler ({cards.length})</option>
              <option value="common">Yaygın (Common)</option>
              <option value="uncommon">Sıradışı (Uncommon)</option>
              <option value="rare">Nadir (Rare)</option>
              <option value="epic">Epik (Epic)</option>
              <option value="legendary">Efsanevi (Legendary)</option>
              <option value="mythic">Mitik (Mythic)</option>
            </select>
          </div>

          {/* Assignment Filter */}
          <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedAssignFilter}
              onChange={(e) => setSelectedAssignFilter(e.target.value as 'all' | 'assigned' | 'unassigned')}
              className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="assigned">Karaktere Atanmış</option>
              <option value="unassigned">Boşta (GM Kasasında)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Card Grid */}
      {filteredCards.length === 0 ? (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-300">Henüz Eşleşen Kart Bulunamadı</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1">
            Filtreleri temizleyebilir veya yeni bir özel yetenek/yadigar kartı tasarlayabilirsiniz.
          </p>
          {isGM && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>İlk Kartı Oluştur</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              isGM={isGM}
              onEdit={() => openEditModal(card)}
              onDelete={(id) => onDeleteCard(id)}
              onDuplicate={() => handleDuplicate(card)}
              onAssignToggle={() => setAssignModalCard(card)}
            />
          ))}
        </div>
      )}

      {/* Quick Assign Modal */}
      <AnimatePresence>
        {assignModalCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  Kartı Ata / Aktar (Oyuncu veya NPC)
                </h3>
                <button
                  type="button"
                  onClick={() => setAssignModalCard(null)}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                {assignModalCard.imageUrl && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-zinc-700">
                    <img
                      src={assignModalCard.imageUrl}
                      alt={assignModalCard.name}
                      style={{
                        objectPosition: assignModalCard.imagePosition || '50% 50%',
                        transform: assignModalCard.imageScale ? `scale(${assignModalCard.imageScale})` : undefined,
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-white text-sm">{assignModalCard.name}</h4>
                  <p className="text-xs text-zinc-400">{assignModalCard.subtitle || assignModalCard.type}</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-3">
                Bu kartı bir karaktere veya NPC'ye atadığınızda, karttaki tüm beceri ve stres bonusları ilgili kişinin profiline ve zar atışlarına{' '}
                <span className="text-amber-300 font-semibold">otomatik olarak yansıtılacaktır</span>.
              </p>

              {/* Target Category Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-3">
                <button
                  type="button"
                  onClick={() => setAssignTab('all')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    assignTab === 'all' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tümü ({characters.length + npcs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAssignTab('characters')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    assignTab === 'characters' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Oyuncular ({characters.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignTab('npcs')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    assignTab === 'npcs' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Skull className="w-3 h-3" />
                  <span>NPC'ler ({npcs.length})</span>
                </button>
              </div>

              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                {/* Unassign / Leave in GM Vault */}
                <button
                  type="button"
                  onClick={() => {
                    onAssignCard(assignModalCard.id, null);
                    setAssignModalCard(null);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    !assignModalCard.assignedCharacterId
                      ? 'bg-zinc-800 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>📦 Boşta Bırak (GM Kasası / Henüz Kimseye Atanmadı)</span>
                  {!assignModalCard.assignedCharacterId && <Check className="w-4 h-4 text-amber-400" />}
                </button>

                {/* Characters List */}
                {(assignTab === 'all' || assignTab === 'characters') && characters.length > 0 && (
                  <div className="space-y-1.5">
                    {assignTab === 'all' && (
                      <span className="text-[10px] uppercase font-bold text-zinc-500 px-1">Oyuncular</span>
                    )}
                    {characters.map((char) => {
                      const isCurrent = assignModalCard.assignedCharacterId === char.id;
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => {
                            onAssignCard(assignModalCard.id, char.id);
                            setAssignModalCard(null);
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                              : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {char.avatarUrl ? (
                              <img
                                src={char.avatarUrl}
                                alt={char.name}
                                style={{
                                  objectPosition: char.avatarPosition || '50% 50%',
                                  transform: char.avatarScale ? `scale(${char.avatarScale})` : undefined,
                                }}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">
                                👤
                              </span>
                            )}
                            <div>
                              <div className="text-white font-bold">{char.name}</div>
                              <div className="text-[10px] text-zinc-400">{char.highConcept}</div>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* NPCs List */}
                {(assignTab === 'all' || assignTab === 'npcs') && npcs.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {assignTab === 'all' && (
                      <span className="text-[10px] uppercase font-bold text-orange-400/80 px-1">
                        NPC & Karşılaşmalar / Düşmanlar
                      </span>
                    )}
                    {npcs.map((npc) => {
                      const isCurrent = assignModalCard.assignedCharacterId === npc.id;
                      return (
                        <button
                          key={npc.id}
                          type="button"
                          onClick={() => {
                            onAssignCard(assignModalCard.id, npc.id);
                            setAssignModalCard(null);
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-orange-950/60 border-orange-500 text-orange-200'
                              : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {npc.avatarUrl ? (
                              <img
                                src={npc.avatarUrl}
                                alt={npc.name}
                                style={{
                                  objectPosition: npc.avatarPosition || '50% 50%',
                                  transform: npc.avatarScale ? `scale(${npc.avatarScale})` : undefined,
                                }}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-orange-950/80 text-orange-400 flex items-center justify-center text-[10px]">
                                🎭
                              </span>
                            )}
                            <div>
                              <div className="text-white font-bold flex items-center gap-1.5">
                                <span>{npc.name}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-500/30 font-normal">
                                  {npc.category === 'main' ? 'Boss' : npc.category === 'supporting' ? 'Destek' : 'Minyon'}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-400">{npc.highConcept || npc.title}</div>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-orange-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Card Full Modal with Realtime Preview */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl my-auto text-white"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      {editingCardId ? 'Özel Kartı Düzenle' : 'Yeni Özel Kart Tasarla'}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Nadirlik ve görseli seçin, otomatik bonusları tanımlayın.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid: Form Controls Left | Realtime Live Preview Right */}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form Settings (7 cols) */}
                  <div className="lg:col-span-7 space-y-4 max-h-[68vh] overflow-y-auto pr-2">
                    {/* Name & Subtitle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Kart İsmi *
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Örn: Gölge Adımı, Rünik Titanyum Kalkan..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Alt Başlık / Tür
                        </label>
                        <input
                          type="text"
                          value={formSubtitle}
                          onChange={(e) => setFormSubtitle(e.target.value)}
                          placeholder="Örn: Kadim Gölge Sanatı..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Rarity & Card Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Nadirlik Seviyesi (Otomatik Tema)
                        </label>
                        <select
                          value={formRarity}
                          onChange={(e) => setFormRarity(e.target.value as FateRarity)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                        >
                          <option value="common">⚪ Yaygın (Common)</option>
                          <option value="uncommon">🟢 Sıradışı (Uncommon)</option>
                          <option value="rare">🔵 Nadir (Rare)</option>
                          <option value="epic">🟣 Epik (Epic)</option>
                          <option value="legendary">🟡 Efsanevi (Legendary)</option>
                          <option value="mythic">🔴 Mitik (Mythic)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Kart Kategorisi
                        </label>
                        <select
                          value={formType}
                          onChange={(e) => setFormType(e.target.value as SpecialCard['type'])}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="Yetenek">Yetenek</option>
                          <option value="Eşya / Yadigar">Eşya / Yadigar</option>
                          <option value="Boon / Lütuf">Boon / Lütuf</option>
                          <option value="Unvan">Unvan</option>
                          <option value="Stunt">Stunt</option>
                          <option value="Büyü">Büyü</option>
                        </select>
                      </div>
                    </div>

                    {/* Image Upload & Presets */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                          Kart Görseli / Fotoğraf
                        </label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" /> Cihazdan Fotoğraf Yükle
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="Görsel URL'si yapıştırın veya yukarıdan dosya yükleyin..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />

                      {/* Preset Image Thumbnails */}
                      <div className="flex items-center gap-1.5 overflow-x-auto py-2 mt-1">
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">Hazır Galeriden Seç:</span>
                        {PRESET_IMAGES.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFormImageUrl(img.url)}
                            className={`w-7 h-7 rounded border shrink-0 overflow-hidden transition-all ${
                              formImageUrl === img.url ? 'ring-2 ring-purple-400 border-white' : 'border-zinc-700 opacity-60 hover:opacity-100'
                            }`}
                            title={img.label}
                          >
                            <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      {/* Image Framing & Focal Control */}
                      {formImageUrl && (
                        <div className="mt-2">
                          <ImageFocalControl
                            imageUrl={formImageUrl}
                            position={formImagePosition}
                            scale={formImageScale}
                            onChangePosition={setFormImagePosition}
                            onChangeScale={setFormImageScale}
                            label="Kart Görseli Kadrajı & Odak Alanı"
                            previewShape="card"
                          />
                        </div>
                      )}
                    </div>

                    {/* Description & Rule Effect */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Hikaye / Açıklama (Lore)
                      </label>
                      <textarea
                        rows={2}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Bu yeteneğin veya yadigarın efsanesi, hikayesi..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Kural Etkisi (Mekanik Açıklama)
                      </label>
                      <textarea
                        rows={2}
                        value={formRuleEffect}
                        onChange={(e) => setFormRuleEffect(e.target.value)}
                        placeholder="Örn: Karanlıkta Gizlilik savunmalarında +2 ve Stil İle Başarıda 2 Stres hasarı..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Stat Bonuses Builder (Otomatik İstatistik Bonusları) */}
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" /> Otomatik İstatistik Bonusları
                          </h4>
                          <p className="text-[11px] text-zinc-400">
                            Karaktere atandığında otomatik eklenen bonuslar
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addBonus}
                          className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Bonus Ekle
                        </button>
                      </div>

                      <div className="space-y-2">
                        {formBonuses.length === 0 ? (
                          <p className="text-xs text-zinc-500 italic py-1">
                            Henüz otomatik bonus eklenmedi. (Yukarıdaki 'Bonus Ekle' butonunu kullanabilirsiniz)
                          </p>
                        ) : (
                          formBonuses.map((bonus, index) => (
                            <div
                              key={bonus.id || index}
                              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-2 flex-wrap"
                            >
                              <select
                                value={bonus.type}
                                onChange={(e) =>
                                  updateBonus(index, {
                                    type: e.target.value as StatBonus['type'],
                                  })
                                }
                                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                              >
                                <option value="skill">Beceriye +Bonus</option>
                                <option value="physical_stress">Fiziksel Stres Kutusu</option>
                                <option value="mental_stress">Zihinsel Stres Kutusu</option>
                                <option value="fate_point">Kader Puanı</option>
                                <option value="refresh">Yenileme (Refresh)</option>
                                <option value="custom">Özel</option>
                              </select>

                              {bonus.type === 'skill' && (
                                <select
                                  value={bonus.targetSkill || 'Dövüş'}
                                  onChange={(e) => updateBonus(index, { targetSkill: e.target.value })}
                                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-amber-300 font-semibold focus:outline-none"
                                >
                                  {DEFAULT_FATE_SKILLS.map((sk) => (
                                    <option key={sk} value={sk}>
                                      {sk}
                                    </option>
                                  ))}
                                </select>
                              )}

                              <div className="flex items-center gap-1">
                                <span className="text-xs text-zinc-400">Değer:</span>
                                <input
                                  type="number"
                                  value={bonus.value}
                                  onChange={(e) => updateBonus(index, { value: Number(e.target.value) })}
                                  className="w-14 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono font-bold"
                                />
                              </div>

                              <input
                                type="text"
                                value={bonus.description || ''}
                                onChange={(e) => updateBonus(index, { description: e.target.value })}
                                placeholder="Not / Etiket"
                                className="flex-1 min-w-[100px] bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                              />

                              <button
                                type="button"
                                onClick={() => removeBonus(index)}
                                className="p-1 rounded bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Assignment & Tags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Başlangıçta Ata (Oyuncu veya NPC)
                        </label>
                        <select
                          value={formAssignedId || ''}
                          onChange={(e) => setFormAssignedId(e.target.value ? e.target.value : null)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="">-- Boşta (GM Kasası) --</option>
                          <optgroup label="Oyuncular">
                            {characters.map((c) => (
                              <option key={c.id} value={c.id}>
                                👤 {c.name}
                              </option>
                            ))}
                          </optgroup>
                          {npcs.length > 0 && (
                            <optgroup label="NPC & Karşılaşmalar / Düşmanlar">
                              {npcs.map((n) => (
                                <option key={n.id} value={n.id}>
                                  🎭 {n.name} ({n.category === 'main' ? 'Boss' : n.category === 'supporting' ? 'Destek' : 'Minyon'})
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Etiketler (Virgülle ayırın)
                        </label>
                        <input
                          type="text"
                          value={formTags}
                          onChange={(e) => setFormTags(e.target.value)}
                          placeholder="Büyü, Ateş, Kılıç..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Realtime Card Preview (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-start border-t lg:border-t-0 lg:border-l border-zinc-800 pt-4 lg:pt-0 lg:pl-6">
                    <span className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                      Canlı Kart Önizlemesi
                    </span>
                    <div className="w-full max-w-[320px]">
                      <CardItem card={previewCard} isGM={false} />
                    </div>
                    <p className="text-[11px] text-zinc-500 text-center mt-3">
                      Kartın rengi, efektleri ve parıltısı seçilen <span className="text-amber-400 font-semibold">{RARITY_CONFIG[formRarity].nameTr}</span> nadirliğine göre otomatik belirlenmektedir.
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingCardId ? 'Değişiklikleri Kaydet' : 'Kartı Oluştur & Kaydet'}</span>
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
