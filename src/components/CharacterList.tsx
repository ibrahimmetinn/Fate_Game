import React, { useState } from 'react';
import { Character, SpecialCard } from '../types/fate';
import { calculateCharacterCardBonuses } from '../utils/fateLadder';
import { ImageFocalControl } from './ImageFocalControl';
import {
  UserPlus,
  User,
  Sparkles,
  Flame,
  Shield,
  Brain,
  Trash2,
  Copy,
  ChevronRight,
  Dices,
  Plus,
  X,
  Layers,
  MapPin,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CharacterListProps {
  characters: Character[];
  allCards: SpecialCard[];
  selectedCharacterId: string | null;
  onSelectCharacter: (charId: string) => void;
  onSaveCharacter: (char: Character) => void;
  onDeleteCharacter: (charId: string) => void;
  onQuickRoll: (rollerName: string, skillName: string, skillBonus: number, cardBonus: number) => void;
  isGM?: boolean;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  allCards,
  selectedCharacterId,
  onSelectCharacter,
  onSaveCharacter,
  onDeleteCharacter,
  onQuickRoll,
  isGM = true,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarPosition, setAvatarPosition] = useState<string>('50% 50%');
  const [avatarScale, setAvatarScale] = useState<number>(1);
  const [location, setLocation] = useState<string>('Bilinmiyor');
  const [highConcept, setHighConcept] = useState<string>('');
  const [trouble, setTrouble] = useState<string>('');
  const [refresh, setRefresh] = useState<number>(3);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const charName = name.trim() || `Karakter #${characters.length + 1}`;
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: charName,
      playerName: playerName.trim() || undefined,
      avatarUrl: avatarUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      avatarPosition: avatarPosition,
      avatarScale: avatarScale,
      location: location.trim() || 'Bilinmiyor',
      highConcept: highConcept.trim() || 'Bilinmiyor / Serbest',
      trouble: trouble.trim() || 'Bilinmiyor / Belirlenmedi',
      aspects: [
        { id: `a-${Date.now()}-1`, label: 'Serbest Yön', value: '' },
        { id: `a-${Date.now()}-2`, label: 'Geçmiş Yönü', value: '' },
        { id: `a-${Date.now()}-3`, label: 'İlişki Yönü', value: '' },
      ],
      skills: {
        'Dövüş': 3,
        'Atletizm': 2,
        'Farkındalık': 2,
        'İrade': 1,
        'Gizlilik': 1,
      },
      fatePoints: refresh || 3,
      refresh: refresh || 3,
      physicalStress: [false, false],
      mentalStress: [false, false],
      consequences: [
        { type: 'Hafif (-2)', severity: 2, aspect: '', used: false },
        { type: 'Orta (-4)', severity: 4, aspect: '', used: false },
        { type: 'Ağır (-6)', severity: 6, aspect: '', used: false },
      ],
      stunts: [
        { id: `st-${Date.now()}`, name: 'Özel Yetenek', description: 'Belirli bir durumda +2 bonus alır.' },
      ],
      createdAt: Date.now(),
    };

    onSaveCharacter(newChar);
    onSelectCharacter(newChar.id);
    setIsCreateModalOpen(false);

    // Reset inputs
    setName('');
    setPlayerName('');
    setAvatarUrl('');
    setAvatarPosition('50% 50%');
    setAvatarScale(1);
    setLocation('Bilinmiyor');
    setHighConcept('');
    setTrouble('');
  };

  const handleDuplicate = (char: Character) => {
    const clone: Character = {
      ...char,
      id: `char-${Date.now()}`,
      name: `${char.name} (Kopya)`,
      createdAt: Date.now(),
    };
    onSaveCharacter(clone);
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Character */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
          Oyuncu Karakterleri ({characters.length})
        </h2>
        {isGM && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Yeni Karakter Sayfası</span>
          </button>
        )}
      </div>

      {/* Grid of Character Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((char) => {
          const isSelected = selectedCharacterId === char.id;
          const { assignedCards, extraPhysicalStress, extraMentalStress } = calculateCharacterCardBonuses(
            char.id,
            allCards
          );

          return (
            <motion.div
              key={char.id}
              layout
              onClick={() => onSelectCharacter(char.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-zinc-900 to-amber-950/30 border-amber-500 ring-2 ring-amber-500/50 shadow-xl'
                  : 'bg-zinc-900/90 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700 shrink-0">
                      {char.avatarUrl ? (
                        <img
                          src={char.avatarUrl}
                          alt={char.name}
                          referrerPolicy="no-referrer"
                          style={{
                            objectPosition: char.avatarPosition || '50% 50%',
                            transform: char.avatarScale ? `scale(${char.avatarScale})` : undefined,
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{char.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {char.playerName && (
                          <span className="text-[10px] text-zinc-400">Oyuncu: {char.playerName}</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-950 text-orange-300 border border-orange-500/30 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-orange-400" />
                          <span>{char.location || 'Bilinmiyor'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 text-xs font-mono font-bold text-amber-400">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{char.fatePoints} FP</span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-amber-300 line-clamp-1 mb-1">
                  ★ {char.highConcept}
                </p>
                <p className="text-xs text-rose-400 italic line-clamp-1 mb-3">
                  ⚡ {char.trouble}
                </p>

                {/* Assigned Cards Pill */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-600/40 text-purple-300 text-[11px] font-semibold flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{assignedCards.length} Özel Kart Aktif</span>
                  </span>

                  {assignedCards.map((c) => (
                    <span
                      key={c.id}
                      className="px-1.5 py-0.5 rounded bg-zinc-950 text-[10px] text-zinc-300 border border-zinc-800 truncate max-w-[120px]"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickRoll(char.name, '', 0, 0);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zar At</span>
                </button>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {isGM && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(char)}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                        title="Klonla"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`${char.name} karakterini silmek istediğinize emin misiniz?`)) {
                            onDeleteCharacter(char.id);
                          }
                        }}
                        className="p-1 rounded bg-zinc-800 hover:bg-rose-950 text-zinc-500 hover:text-rose-300"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <span className="text-xs text-amber-400 font-bold ml-1 flex items-center">
                    Sayfayı Aç <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  Yeni Fate Karakter Sayfası Oluştur
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <p className="text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                  💡 <strong>Hızlı & Esnek:</strong> Tüm alanlar opsiyoneldir. Konum veya detay girmeden boş bırakabilir (varsayılan: <em>Bilinmiyor</em>), oyun esnasında dilediğiniz gibi doldurabilirsiniz.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Karakter İsmi (Opsiyonel)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Örn: Selin (Boşsa: Karakter #X)"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Oyuncu İsmi (Opsiyonel)</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Örn: Ayşe"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Konum / Bölge (Opsiyonel)</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Bilinmiyor / Boşta"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Kader Puanı (Refresh)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={refresh}
                      onChange={(e) => setRefresh(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Ana Konsept (High Concept - Opsiyonel)</label>
                  <input
                    type="text"
                    value={highConcept}
                    onChange={(e) => setHighConcept(e.target.value)}
                    placeholder="Bilinmiyor (Örn: Gölge Loncası Suikastçısı)"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Bela (Trouble - Opsiyonel)</label>
                  <input
                    type="text"
                    value={trouble}
                    onChange={(e) => setTrouble(e.target.value)}
                    placeholder="Bilinmiyor (Örn: Kan Parası)"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Avatar with Device File Upload & URL & Focal Positioning */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Avatar Görseli (Cihazdan Yükle veya URL)
                  </label>
                  <div className="space-y-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {avatarUrl ? (
                          <>
                            <img
                              src={avatarUrl}
                              alt="Avatar Preview"
                              referrerPolicy="no-referrer"
                              style={{
                                objectPosition: avatarPosition,
                                transform: `scale(${avatarScale})`,
                              }}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setAvatarUrl('')}
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
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold cursor-pointer transition-colors">
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
                                    setAvatarUrl(uploadEvent.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="Veya görsel URL'si (https://...)"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Interactive Focal Point & Scaling */}
                    {avatarUrl && (
                      <div className="pt-2 border-t border-zinc-800">
                        <ImageFocalControl
                          imageUrl={avatarUrl}
                          position={avatarPosition}
                          scale={avatarScale}
                          onChangePosition={setAvatarPosition}
                          onChangeScale={setAvatarScale}
                          label="Avatar Odak Noktası & Kadraj Ayarı"
                          previewShape="square"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-lg cursor-pointer"
                  >
                    Karakteri Oluştur
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
