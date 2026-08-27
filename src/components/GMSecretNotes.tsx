import React, { useState } from 'react';
import { GMNote } from '../types/fate';
import { FATE_LADDER } from '../utils/fateLadder';
import {
  Lock,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Search,
  BookOpen,
  HelpCircle,
  Sparkles,
  Check,
  X,
  FileText,
  ShieldAlert,
  Flame,
  Dices,
  Key,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GMSecretNotesProps {
  notes: GMNote[];
  onSaveNote: (note: GMNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export const GMSecretNotes: React.FC<GMSecretNotesProps> = ({
  notes,
  onSaveNote,
  onDeleteNote,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<GMNote['category'] | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<GMNote['category']>('Ana Hikaye');
  const [formContent, setFormContent] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('Sırlar');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);

  // Quick Scratchpad state
  const [scratchpad, setScratchpad] = useState<string>(() => {
    return localStorage.getItem('fate_gm_scratchpad') || 'Hızlı GM Notları:\n- Malakar 3. turda koruma kalkanını devreye sokar.\n- Oyuncular gizli geçidi fark ederse +2 invoke ver.';
  });

  const saveScratchpad = (val: string) => {
    setScratchpad(val);
    localStorage.setItem('fate_gm_scratchpad', val);
  };

  const openCreateModal = () => {
    setEditingNoteId(null);
    setFormTitle('');
    setFormCategory('Ana Hikaye');
    setFormContent('');
    setFormTags('Sırlar, Görev');
    setFormIsPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (note: GMNote) => {
    setEditingNoteId(note.id);
    setFormTitle(note.title);
    setFormCategory(note.category);
    setFormContent(note.content);
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setFormIsPinned(note.isPinned);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const noteData: GMNote = {
      id: editingNoteId || `note-${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      content: formContent.trim(),
      isPinned: formIsPinned,
      tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
      updatedAt: Date.now(),
    };

    onSaveNote(noteData);
    setIsModalOpen(false);
  };

  const togglePin = (note: GMNote) => {
    onSaveNote({ ...note, isPinned: !note.isPinned });
  };

  const filteredNotes = notes
    .filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesCat = selectedCategory === 'all' || n.category === selectedCategory;

      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div id="fate-gm-secret-notes" className="space-y-6">
      {/* Header with Secret Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-purple-950/60 to-zinc-900 border border-red-500/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Game Master Gizli Notlar & Kasa
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-red-900/80 border border-red-500/60 text-red-200 text-xs font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Yalnızca GM Görür
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Oyuncuların görmediği senaryo sırları, tuzaklar, NPC planları ve Fate kural başucu rehberi.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Gizli Not Yaz</span>
        </button>
      </div>

      {/* 2-Column: Notes Left (8 cols) | Cheat Sheet & Scratchpad Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Notes List & Filter */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Gizli notlarda ara..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['all', 'Ana Hikaye', 'Karşılaşmalar', 'NPC Planları', 'İpuçları & Sırlar', 'Ödül & Ganiset', 'Hızlı Notlar'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {cat === 'all' ? 'Tümü' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Cards */}
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
              <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-400">Henüz gizli not bulunmuyor.</p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-3 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                İlk Notu Oluştur
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  className={`bg-zinc-900 border rounded-2xl p-5 shadow-xl transition-all ${
                    note.isPinned ? 'border-amber-500/50 bg-gradient-to-r from-zinc-900 to-amber-950/20' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2 pb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      {note.isPinned && <Pin className="w-4 h-4 text-amber-400 fill-amber-400" />}
                      <h3 className="font-bold text-white text-base sm:text-lg">{note.title}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs border border-zinc-700">
                        {note.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePin(note)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          note.isPinned ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                        }`}
                        title={note.isPinned ? 'Sabitlemeyi Kaldır' : 'Başa Sabitle'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(note)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content (Formatted) */}
                  <div className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed space-y-1 font-sans">
                    {note.content}
                  </div>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center gap-1.5 flex-wrap">
                      {note.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right: GM Reference & Scratchpad (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick GM Scratchpad */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Anlık Karalama Defteri (Auto-Save)
            </h3>
            <textarea
              rows={6}
              value={scratchpad}
              onChange={(e) => saveScratchpad(e.target.value)}
              placeholder="Oyun esnasında aklınıza gelen anlık fikirler ve hızlı sırlar..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
            />
          </div>

          {/* Fate Core Ladder Reference Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              Fate Başarı Merdiveni (Ladder)
            </h3>
            <div className="space-y-1 text-xs">
              {FATE_LADDER.map((step) => (
                <div
                  key={step.value}
                  className="flex items-center justify-between py-1 px-2 rounded bg-zinc-950/60 border border-zinc-800/60"
                >
                  <span className={`font-bold ${step.color}`}>{step.adjectiveTr}</span>
                  <span className="text-zinc-500 text-[11px]">{step.adjectiveEn}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Four Actions Cheat Sheet */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl text-xs space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              4 Temel Fate Eylemi
            </h3>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <strong className="text-amber-300">Overcome (Engeli Aş): </strong>
              <span className="text-zinc-300">Engeli geç, tehlikeden kaçın veya problemi çöz.</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <strong className="text-cyan-300">Create Advantage (Üstünlük Yarat): </strong>
              <span className="text-zinc-300">Sahneye yön ekle veya var olan yöne serbest invoke kazan.</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <strong className="text-rose-400">Attack (Saldır): </strong>
              <span className="text-zinc-300">Hedefe stres ver veya yaralanma/sonuç aldır.</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
              <strong className="text-emerald-400">Defend (Savun): </strong>
              <span className="text-zinc-300">Saldırıya veya üstünlük yaratmaya karşı diren.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Note Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400" />
                  {editingNoteId ? 'Gizli Notu Düzenle' : 'Yeni GM Gizli Notu'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Not Başlığı *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Örn: Malakar'ın Gizli Zayıflığı, 3. Kat Tuzakları..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Kategori</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Ana Hikaye">Ana Hikaye</option>
                      <option value="Karşılaşmalar">Karşılaşmalar</option>
                      <option value="NPC Planları">NPC Planları</option>
                      <option value="İpuçları & Sırlar">İpuçları & Sırlar</option>
                      <option value="Ödül & Ganiset">Ödül & Ganiset</option>
                      <option value="Hızlı Notlar">Hızlı Notlar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Etiketler</label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="Boss, Zindan, İhanet..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Not İçeriği (Markdown / Metin)</label>
                  <textarea
                    rows={8}
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Sırlar, tuzaklar, diyalog ipuçları, zayıf noktalar..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-red-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                    />
                    <span>En başa sabitle</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30"
                    >
                      {editingNoteId ? 'Kaydet' : 'Notu Ekle'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
