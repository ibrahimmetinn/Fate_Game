import React, { useState } from 'react';
import {
  RegionZone,
  RegionType,
  DangerLevel,
  Character,
  NPC,
  TimelineEntry,
  KillRecord,
} from '../types/fate';
import { ImageFocalControl } from './ImageFocalControl';
import {
  MapPin,
  Compass,
  Plus,
  Trash2,
  Edit,
  Eye,
  Lock,
  Users,
  Shield,
  Skull,
  Flame,
  AlertTriangle,
  Castle,
  Trees,
  Landmark,
  Building,
  Sparkles,
  Search,
  Filter,
  Check,
  ArrowRight,
  ChevronRight,
  ImageIcon,
  Upload,
  X,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegionManagerProps {
  regions: RegionZone[];
  characters: Character[];
  npcs: NPC[];
  timeline: TimelineEntry[];
  killRecords: KillRecord[];
  currentLocation: string;
  isGM: boolean;
  onSaveRegion: (region: RegionZone) => void;
  onDeleteRegion: (id: string) => void;
  onSetCurrentLocation: (locationName: string) => void;
  onMoveCharacterToRegion?: (characterId: string, locationName: string) => void;
  onMoveNPCToRegion?: (npcId: string, locationName: string) => void;
}

export const RegionManager: React.FC<RegionManagerProps> = ({
  regions,
  characters,
  npcs,
  timeline,
  killRecords,
  currentLocation,
  isGM,
  onSaveRegion,
  onDeleteRegion,
  onSetCurrentLocation,
  onMoveCharacterToRegion,
  onMoveNPCToRegion,
}) => {
  // Selected Region for full-detail inspection / screen
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(
    regions[0]?.id || null
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDanger, setFilterDanger] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Edit / Create Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingRegion, setEditingRegion] = useState<RegionZone | null>(null);

  // Form Fields
  const [regName, setRegName] = useState<string>('');
  const [regType, setRegType] = useState<RegionType>('wilderness');
  const [regDanger, setRegDanger] = useState<DangerLevel>('cautious');
  const [regSummary, setRegSummary] = useState<string>('');
  const [regDescription, setRegDescription] = useState<string>('');
  const [regAspects, setRegAspects] = useState<string[]>([]);
  const [newAspectInput, setNewAspectInput] = useState<string>('');
  const [regSubLocations, setRegSubLocations] = useState<string[]>([]);
  const [newSubLocationInput, setNewSubLocationInput] = useState<string>('');
  const [regConnected, setRegConnected] = useState<string[]>([]);
  const [newConnectedInput, setNewConnectedInput] = useState<string>('');
  const [regGmSecrets, setRegGmSecrets] = useState<string>('');
  const [regImageUrl, setRegImageUrl] = useState<string>('');
  const [regImagePosition, setRegImagePosition] = useState<string>('50% 50%');
  const [regImageScale, setRegImageScale] = useState<number>(1);

  // Transfer modals / interactive triggers
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);

  // Helper type icons & labels
  const getRegionTypeMeta = (type: RegionType) => {
    switch (type) {
      case 'city':
        return { label: 'Şehir / Yerleşim', icon: <Building className="w-3.5 h-3.5" />, color: 'text-blue-400' };
      case 'dungeon':
        return { label: 'Zindan / Kule / Mahzen', icon: <Layers className="w-3.5 h-3.5" />, color: 'text-purple-400' };
      case 'ruins':
        return { label: 'Antik Harabeler & Mabed', icon: <Landmark className="w-3.5 h-3.5" />, color: 'text-amber-400' };
      case 'wilderness':
        return { label: 'Vahşi Doğa / Orman / Dağ', icon: <Trees className="w-3.5 h-3.5" />, color: 'text-emerald-400' };
      case 'tavern':
        return { label: 'Han & Taverna', icon: <Compass className="w-3.5 h-3.5" />, color: 'text-yellow-400' };
      case 'castle':
        return { label: 'Kale / Hisar / Saray', icon: <Castle className="w-3.5 h-3.5" />, color: 'text-red-400' };
      case 'mystic':
        return { label: 'Mistik Boyut / Sunak', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-cyan-400' };
      case 'haven':
        return { label: 'Güvenli Sığınak', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-green-400' };
      default:
        return { label: 'Bölge', icon: <MapPin className="w-3.5 h-3.5" />, color: 'text-zinc-400' };
    }
  };

  const getDangerMeta = (danger: DangerLevel) => {
    switch (danger) {
      case 'peaceful':
        return { label: 'Huzurlu / Güvenli', color: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' };
      case 'cautious':
        return { label: 'Temkinli / Dikkat', color: 'bg-amber-950/80 border-amber-500/50 text-amber-300' };
      case 'dangerous':
        return { label: 'Tehlikeli / Düşman Bölgesi', color: 'bg-orange-950/80 border-orange-500/50 text-orange-300' };
      case 'deadly':
        return { label: 'ÖLÜMCÜL / BOSS ALANI', color: 'bg-red-950/90 border-red-500 text-red-300 font-bold animate-pulse' };
      default:
        return { label: 'Bilinmiyor', color: 'bg-zinc-900 border-zinc-700 text-zinc-300' };
    }
  };

  // Open edit or create modal
  const handleOpenEditModal = (region?: RegionZone) => {
    if (region) {
      setEditingRegion(region);
      setRegName(region.name);
      setRegType(region.type);
      setRegDanger(region.dangerLevel);
      setRegSummary(region.summary || '');
      setRegDescription(region.description || '');
      setRegAspects(region.aspects || []);
      setRegSubLocations(region.subLocations || []);
      setRegConnected(region.connectedLocations || []);
      setRegGmSecrets(region.gmSecrets || '');
      setRegImageUrl(region.imageUrl || '');
      setRegImagePosition(region.imagePosition || '50% 50%');
      setRegImageScale(region.imageScale || 1);
    } else {
      setEditingRegion(null);
      setRegName('');
      setRegType('wilderness');
      setRegDanger('cautious');
      setRegSummary('');
      setRegDescription('');
      setRegAspects(['Yoğun Sis & Çamur', 'Yankılanan Ayak Sesleri']);
      setRegSubLocations(['Ana Giriş', 'Merkez Alanı']);
      setRegConnected([currentLocation]);
      setRegGmSecrets('');
      setRegImageUrl('');
      setRegImagePosition('50% 50%');
      setRegImageScale(1);
    }
    setNewAspectInput('');
    setNewSubLocationInput('');
    setNewConnectedInput('');
    setIsEditModalOpen(true);
  };

  const handleSaveRegionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    const newRegion: RegionZone = {
      id: editingRegion ? editingRegion.id : `reg-${Date.now()}`,
      name: regName.trim(),
      type: regType,
      dangerLevel: regDanger,
      imageUrl: regImageUrl.trim() || undefined,
      imagePosition: regImagePosition,
      imageScale: regImageScale,
      summary: regSummary.trim(),
      description: regDescription.trim(),
      aspects: regAspects.filter(Boolean),
      subLocations: regSubLocations.filter(Boolean),
      connectedLocations: regConnected.filter(Boolean),
      gmSecrets: regGmSecrets.trim() || undefined,
      createdAt: editingRegion ? editingRegion.createdAt : Date.now(),
    };

    onSaveRegion(newRegion);
    setSelectedRegionId(newRegion.id);
    setIsEditModalOpen(false);
  };

  // Add tag-like arrays
  const handleAddAspect = () => {
    if (newAspectInput.trim()) {
      setRegAspects([...regAspects, newAspectInput.trim()]);
      setNewAspectInput('');
    }
  };

  const handleAddSubLocation = () => {
    if (newSubLocationInput.trim()) {
      setRegSubLocations([...regSubLocations, newSubLocationInput.trim()]);
      setNewSubLocationInput('');
    }
  };

  const handleAddConnected = () => {
    if (newConnectedInput.trim()) {
      setRegConnected([...regConnected, newConnectedInput.trim()]);
      setNewConnectedInput('');
    }
  };

  // Filtered regions
  const filteredRegions = regions.filter((r) => {
    if (filterDanger !== 'all' && r.dangerLevel !== filterDanger) return false;
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchAspect = r.aspects?.some((a) => a.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchAspect) return false;
    }
    return true;
  });

  const selectedRegion = regions.find((r) => r.id === selectedRegionId) || filteredRegions[0] || null;

  // Characters in selected region
  const charsInRegion = selectedRegion
    ? characters.filter((c) => (c.location || 'Bilinmiyor') === selectedRegion.name)
    : [];

  // NPCs in selected region
  const npcsInRegion = selectedRegion
    ? npcs.filter((n) => (n.location || 'Bilinmiyor') === selectedRegion.name)
    : [];

  // Timeline events in selected region
  const timelineInRegion = selectedRegion
    ? timeline.filter((t) => t.location === selectedRegion.name)
    : [];

  // Kills in selected region
  const killsInRegion = selectedRegion
    ? killRecords.filter((k) => k.location === selectedRegion.name)
    : [];

  return (
    <div id="region-manager-container" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-wide">
                BÖLGELER & DÜNYA MEKAN YÖNETİCİSİ
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {regions.length} Bölge Kayıtlı
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Kampanya evrenindeki tüm şehirleri, zindanları, harabeleri ve bölgeleri ayrı ekranlarda düzenleyin, yönlerini ve sakinlerini yönetin
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => handleOpenEditModal()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Bölge / Mekan Oluştur</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Filtrele:
          </span>

          {/* Region Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Tüm Mekan Türleri</option>
            <option value="city">Şehir / Yerleşim</option>
            <option value="dungeon">Zindan / Kule / Mahzen</option>
            <option value="ruins">Antik Harabeler</option>
            <option value="wilderness">Vahşi Doğa / Orman</option>
            <option value="tavern">Han & Taverna</option>
            <option value="castle">Kale / Hisar</option>
            <option value="mystic">Mistik Mabed</option>
            <option value="haven">Güvenli Sığınak</option>
          </select>

          {/* Danger Level Filter */}
          <select
            value={filterDanger}
            onChange={(e) => setFilterDanger(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Tüm Tehlike Dereceleri</option>
            <option value="peaceful">Huzurlu / Güvenli</option>
            <option value="cautious">Temkinli / Dikkat</option>
            <option value="dangerous">Tehlikeli</option>
            <option value="deadly">Ölümcül / Boss</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Bölge adı veya yön ara..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Two-Column Layout: Regions Navigator + Detailed Region Inspector Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Regions List Cards (4 cols on lg) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              BÖLGELER LİSTESİ ({filteredRegions.length})
            </span>
            <span className="text-[11px] text-zinc-500">Seçmek için karta tıklayın</span>
          </div>

          {filteredRegions.length === 0 ? (
            <div className="p-8 text-center bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl">
              <MapPin className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">Kriterlere uygun bölge bulunamadı.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
              {filteredRegions.map((region) => {
                const isSelected = selectedRegion?.id === region.id;
                const isCurrent = currentLocation === region.name;
                const typeMeta = getRegionTypeMeta(region.type);
                const dangerMeta = getDangerMeta(region.dangerLevel);

                const cCount = characters.filter((c) => c.location === region.name).length;
                const nCount = npcs.filter((n) => n.location === region.name).length;

                return (
                  <div
                    key={region.id}
                    onClick={() => setSelectedRegionId(region.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3.5 items-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/60 to-zinc-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                        : 'bg-zinc-950/90 hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Region Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 relative">
                      {region.imageUrl ? (
                        <img
                          src={region.imageUrl}
                          alt={region.name}
                          referrerPolicy="no-referrer"
                          style={{
                            objectPosition: region.imagePosition || '50% 50%',
                            transform: region.imageScale ? `scale(${region.imageScale})` : undefined,
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          {typeMeta.icon}
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-black text-[9px] shadow">
                          BURADASINIZ
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-bold ${typeMeta.color} flex items-center gap-1`}>
                          {typeMeta.icon}
                          <span>{typeMeta.label}</span>
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border ${dangerMeta.color}`}>
                          {region.dangerLevel.toUpperCase()}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate leading-tight">
                        {region.name}
                      </h4>

                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {region.summary || region.description || 'Açıklama girilmedi.'}
                      </p>

                      {/* Character & NPC badges */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Users className="w-3 h-3 text-amber-400" />
                          <span>{cCount} Karakter</span>
                        </span>
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Shield className="w-3 h-3 text-orange-400" />
                          <span>{nCount} NPC</span>
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-zinc-600'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Region Screen / Inspector (7 cols on lg) */}
        <div className="lg:col-span-7">
          {selectedRegion ? (
            <motion.div
              key={selectedRegion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl space-y-6"
            >
              {/* Region Hero Banner */}
              <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-inner">
                {selectedRegion.imageUrl ? (
                  <img
                    src={selectedRegion.imageUrl}
                    alt={selectedRegion.name}
                    referrerPolicy="no-referrer"
                    style={{
                      objectPosition: selectedRegion.imagePosition || '50% 50%',
                      transform: selectedRegion.imageScale ? `scale(${selectedRegion.imageScale})` : undefined,
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                    <Compass className="w-16 h-16 opacity-30" />
                    <span className="text-xs text-zinc-500 mt-2">Bölge Görseli Eklenmedi</span>
                  </div>
                )}

                {/* Dark Gradient Overlay for Typography */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

                {/* Top Action Floating Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedRegion)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 border border-zinc-700/80 shadow-lg cursor-pointer backdrop-blur-sm transition-all"
                  >
                    <Edit className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Bölgeyi Düzenle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteRegion(selectedRegion.id)}
                    className="p-1.5 rounded-xl bg-zinc-900/90 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-zinc-700/80 shadow-lg cursor-pointer backdrop-blur-sm"
                    title="Bölgeyi Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Floating Title on Banner */}
                <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border flex items-center gap-1 ${
                        getRegionTypeMeta(selectedRegion.type).color
                      } bg-black/60 backdrop-blur-sm border-zinc-700`}
                    >
                      {getRegionTypeMeta(selectedRegion.type).icon}
                      <span>{getRegionTypeMeta(selectedRegion.type).label}</span>
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                        getDangerMeta(selectedRegion.dangerLevel).color
                      }`}
                    >
                      {getDangerMeta(selectedRegion.dangerLevel).label}
                    </span>

                    {currentLocation === selectedRegion.name ? (
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-amber-500 text-zinc-950 shadow flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        SEFERİN ŞU ANKİ KONUMU
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSetCurrentLocation(selectedRegion.name)}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-zinc-900/90 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 border border-amber-500/40 shadow cursor-pointer transition-all flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        Grubu Buraya Taşı
                      </button>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                    {selectedRegion.name}
                  </h3>
                </div>
              </div>

              {/* Summary & Description */}
              <div className="space-y-3">
                {selectedRegion.summary && (
                  <p className="text-xs sm:text-sm font-semibold text-cyan-300/90 italic bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/20">
                    "{selectedRegion.summary}"
                  </p>
                )}

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {selectedRegion.description || 'Bu bölge hakkında henüz detaylı açıklama girilmemiş.'}
                </p>
              </div>

              {/* Region Aspects (Bölge Yönleri) */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    BÖLGE YÖNLERİ & ÇEVRESEL KOŞULLAR (ASPECTS)
                  </h4>
                  <span className="text-[11px] text-zinc-500">Zarlarda Invoke edilebilir</span>
                </div>

                {selectedRegion.aspects && selectedRegion.aspects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedRegion.aspects.map((asp, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{asp}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Bölgeye özel yön atanmadı.</p>
                )}
              </div>

              {/* Sub-Locations & Connected Routes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sub-Locations */}
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    ALT MEKANLAR & ODALAR
                  </h4>
                  {selectedRegion.subLocations && selectedRegion.subLocations.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedRegion.subLocations.map((sub, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2"
                        >
                          <ChevronRight className="w-3 h-3 text-indigo-400" />
                          <span>{sub}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">Alt mekan belirtilmedi.</p>
                  )}
                </div>

                {/* Connected Routes */}
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    KOMŞU YOLLAR & BAĞLANTILAR
                  </h4>
                  {selectedRegion.connectedLocations && selectedRegion.connectedLocations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRegion.connectedLocations.map((conn, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-cyan-300 flex items-center gap-1 font-medium"
                        >
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{conn}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">Bağlantılı yol tanımlanmadı.</p>
                  )}
                </div>
              </div>

              {/* GM Secrets (Visible in GM mode) */}
              {isGM && selectedRegion.gmSecrets && (
                <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5" />
                    <span>GM GİZLİ MEKAN BİLGİLERİ & SIRLAR</span>
                  </div>
                  <p className="text-xs text-red-200 leading-relaxed whitespace-pre-line">
                    {selectedRegion.gmSecrets}
                  </p>
                </div>
              )}

              {/* Entities in this Region (Live Characters and NPCs) */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>ŞU AN BU BÖLGEDE BULUNANLAR</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Characters */}
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Oyuncu Karakterleri ({charsInRegion.length})
                    </span>
                    {charsInRegion.length > 0 ? (
                      <div className="space-y-1.5">
                        {charsInRegion.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700">
                                {c.avatarUrl ? (
                                  <img
                                    src={c.avatarUrl}
                                    alt={c.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                                    {c.name[0]}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-white">{c.name}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">Kader: {c.fatePoints}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">Bu bölgede karakter yok.</p>
                    )}
                  </div>

                  {/* NPCs */}
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Müttefik & Düşman NPC'ler ({npcsInRegion.length})
                    </span>
                    {npcsInRegion.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {npcsInRegion.map((n) => (
                          <div
                            key={n.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700">
                                {n.avatarUrl ? (
                                  <img
                                    src={n.avatarUrl}
                                    alt={n.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                                    {n.name[0]}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white block leading-tight">{n.name}</span>
                                <span className="text-[10px] text-zinc-500">{n.category.toUpperCase()}</span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                n.status === 'defeated'
                                  ? 'bg-rose-950 text-rose-300'
                                  : n.status === 'allied'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : 'bg-zinc-900 text-zinc-400'
                              }`}
                            >
                              {n.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">Bu bölgede NPC bulunmuyor.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Historical Timeline & Kills in this region */}
              {(timelineInRegion.length > 0 || killsInRegion.length > 0) && (
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3 pt-3">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    <span>BU BÖLGEDE GEÇMİŞTE YAŞANANLAR & ZAFERLER</span>
                  </h4>

                  <div className="space-y-2">
                    {timelineInRegion.map((tl) => (
                      <div
                        key={tl.id}
                        className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">{tl.title}</span>
                          <span className="text-[10px] text-zinc-500">{tl.phaseOrSession}</span>
                        </div>
                        <span className="text-[10px] text-indigo-300 font-semibold">{tl.type}</span>
                      </div>
                    ))}

                    {killsInRegion.map((k) => (
                      <div
                        key={k.id}
                        className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-rose-200 flex items-center gap-1.5">
                            <Skull className="w-3 h-3 text-rose-400" />
                            {k.targetName} ({k.slayerCharacterName} tarafından itlaf edildi)
                          </span>
                          <span className="text-[10px] text-zinc-400 italic">"{k.finishingBlow}"</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">{k.sessionOrDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="p-12 text-center bg-zinc-950/60 border border-dashed border-zinc-800 rounded-2xl">
              <Compass className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-300">Bir Bölge Seçin veya Yeni Oluşturun</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Sol taraftaki listeden bir mekan seçerek detaylarını inceleyebilir veya yeni bir bölge tanımlayabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* REGION EDIT / CREATE MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">
                    {editingRegion ? 'Bölgeyi / Mekanı Düzenle' : 'Yeni Bölge / Mekan Oluştur'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRegionSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Name & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Bölge / Mekan Adı *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Örn: Gölge Ormanı & Harabeler"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Mekan Türü</label>
                    <select
                      value={regType}
                      onChange={(e) => setRegType(e.target.value as RegionType)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="city">🏰 Şehir / Yerleşim Yeri</option>
                      <option value="dungeon">⛓️ Zindan / Kule / Mahzen</option>
                      <option value="ruins">🏛️ Antik Harabeler & Tapınak</option>
                      <option value="wilderness">🌲 Vahşi Doğa / Orman / Dağ</option>
                      <option value="tavern">🍺 Han & Taverna</option>
                      <option value="castle">⚔️ Kale / Hisar / Saray</option>
                      <option value="mystic">✨ Mistik Boyut / Sunak</option>
                      <option value="haven">🛡️ Güvenli Sığınak</option>
                    </select>
                  </div>
                </div>

                {/* Danger Level & Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Tehlike Derecesi</label>
                    <select
                      value={regDanger}
                      onChange={(e) => setRegDanger(e.target.value as DangerLevel)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="peaceful">🟢 Huzurlu / Güvenli</option>
                      <option value="cautious">🟡 Temkinli / Dikkatli Olunmalı</option>
                      <option value="dangerous">🟠 Tehlikeli / Düşman Bölgesi</option>
                      <option value="deadly">🔴 ÖLÜMCÜL / BOSS BÖLGESİ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Kısa Tanıtım / Atmosfer</label>
                    <input
                      type="text"
                      value={regSummary}
                      onChange={(e) => setRegSummary(e.target.value)}
                      placeholder="Örn: Güneş ışığının girmediği sisli harabeler"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Detaylı Bölge Anlatısı</label>
                  <textarea
                    rows={3}
                    value={regDescription}
                    onChange={(e) => setRegDescription(e.target.value)}
                    placeholder="Bölgenin coğrafi yapısı, havası, kokusu, mimarisi ve tehlikeleri hakkında detaylar..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                {/* Region Image & Focal Positioning */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Bölge Görseli (Cihazdan Yükle veya URL)
                  </label>
                  <div className="space-y-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="relative w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {regImageUrl ? (
                          <>
                            <img
                              src={regImageUrl}
                              alt="Bölge Görseli"
                              referrerPolicy="no-referrer"
                              style={{
                                objectPosition: regImagePosition,
                                transform: `scale(${regImageScale})`,
                              }}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setRegImageUrl('')}
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
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold cursor-pointer transition-colors">
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
                                    setRegImageUrl(uploadEvent.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <input
                          type="url"
                          value={regImageUrl}
                          onChange={(e) => setRegImageUrl(e.target.value)}
                          placeholder="Veya görsel URL'si (https://...)"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {regImageUrl && (
                      <div className="pt-2 border-t border-zinc-800">
                        <ImageFocalControl
                          imageUrl={regImageUrl}
                          position={regImagePosition}
                          scale={regImageScale}
                          onChangePosition={setRegImagePosition}
                          onChangeScale={setRegImageScale}
                          label="Bölge Görseli Kadraj & Odak Ayarı"
                          previewShape="banner"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Region Aspects (Bölge Yönleri) */}
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Bölge Yönleri / Aspects (Fate Zar Mekaniği)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAspectInput}
                      onChange={(e) => setNewAspectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAspect();
                        }
                      }}
                      placeholder="Yeni yön yazın (Örn: Gözcü Kuleleri Tetikte) ve ekleyin"
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddAspect}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                    >
                      Ekle
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {regAspects.map((asp, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{asp}</span>
                        <button
                          type="button"
                          onClick={() => setRegAspects(regAspects.filter((_, idx) => idx !== i))}
                          className="hover:text-rose-400 cursor-pointer ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sub-locations & Connected */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Sub-locations */}
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Alt Mekanlar / Odalar</label>
                    <div className="flex gap-1.5 mb-2">
                      <input
                        type="text"
                        value={newSubLocationInput}
                        onChange={(e) => setNewSubLocationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubLocation();
                          }
                        }}
                        placeholder="Örn: Kaçakçı Bodrumu"
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubLocation}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {regSubLocations.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => setRegSubLocations(regSubLocations.filter((_, idx) => idx !== i))}
                            className="hover:text-rose-400 cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Connected Locations */}
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Komşu Yollar / Geçitler</label>
                    <div className="flex gap-1.5 mb-2">
                      <input
                        type="text"
                        value={newConnectedInput}
                        onChange={(e) => setNewConnectedInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddConnected();
                          }
                        }}
                        placeholder="Örn: Liman Hanı"
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddConnected}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {regConnected.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-cyan-300 flex items-center gap-1"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() => setRegConnected(regConnected.filter((_, idx) => idx !== i))}
                            className="hover:text-rose-400 cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* GM Secrets */}
                {isGM && (
                  <div>
                    <label className="block text-red-300 font-semibold mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-red-400" />
                      GM Gizli Bilgileri / Mekan Sırları (Sadece GM Görür)
                    </label>
                    <textarea
                      rows={2}
                      value={regGmSecrets}
                      onChange={(e) => setRegGmSecrets(e.target.value)}
                      placeholder="Oyuncuların henüz bilmediği gizli geçitler, tuzaklar veya NPC planları..."
                      className="w-full bg-zinc-950 border border-red-500/40 rounded-lg px-3 py-2 text-red-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 leading-relaxed"
                    />
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
                  >
                    İptal
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 cursor-pointer transition-all active:scale-95"
                  >
                    {editingRegion ? 'Bölge Güncellemesini Kaydet' : 'Bölgeyi Oluştur'}
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
