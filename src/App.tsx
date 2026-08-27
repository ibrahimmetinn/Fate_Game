import React, { useState, useEffect, useRef } from 'react';
import {
  CampaignState,
  Character,
  SpecialCard,
  NPC,
  GMNote,
  SceneAspect,
  DiceRollOutcome,
  TimelineEntry,
  KillRecord,
  RegionZone,
} from './types/fate';
import { INITIAL_CAMPAIGN_STATE } from './data/defaultCampaign';
import { Navbar, ActiveTab } from './components/Navbar';
import { CharacterList } from './components/CharacterList';
import { CharacterSheet } from './components/CharacterSheet';
import { CardForge } from './components/CardForge';
import { NPCManager } from './components/NPCManager';
import { TimelineManager } from './components/TimelineManager';
import { RegionManager } from './components/RegionManager';
import { GMSecretNotes } from './components/GMSecretNotes';
import { SceneTracker } from './components/SceneTracker';
import { DiceRoller } from './components/DiceRoller';
import { sfx } from './utils/sound';
import {
  ChevronLeft,
  Crown,
  Sparkles,
  Shield,
  Lock,
  Users,
  LogIn,
  Wifi,
  Dices,
  Layers,
  MapPin,
  Flame,
  User,
  Zap,
  Calendar,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  subscribeToCampaign,
  updateCampaignState,
  subscribeToCharacters,
  saveCharacterToDb,
  deleteCharacterFromDb,
  subscribeToSpecialCards,
  saveSpecialCardToDb,
  deleteSpecialCardFromDb,
  subscribeToNPCs,
  saveNPCToDb,
  deleteNPCFromDb,
  subscribeToGMNotes,
  saveGMNoteToDb,
  deleteGMNoteFromDb,
  subscribeToDiceRolls,
  saveDiceRollToDb,
  clearAllDiceRollsFromDb,
  subscribeToTimeline,
  saveTimelineEntryToDb,
  deleteTimelineEntryFromDb,
  subscribeToKillRecords,
  saveKillRecordToDb,
  deleteKillRecordFromDb,
  subscribeToRegions,
  saveRegionToDb,
  deleteRegionFromDb,
} from './lib/firebase';

function MainAppContent() {
  const { currentUser, userProfile, isGM, loginWithGoogle, adminGmEmail } = useAuth();

  // Campaign State synced with Firebase Firestore
  const [campaign, setCampaign] = useState<CampaignState>(INITIAL_CAMPAIGN_STATE);
  const [activeTab, setActiveTab] = useState<ActiveTab>('characters');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  // Pre-filled dice roller params when triggered
  const [rollerParams, setRollerParams] = useState<{
    rollerName: string;
    skillName: string;
    skillBonus: number;
    cardBonus: number;
  }>({
    rollerName: '',
    skillName: '',
    skillBonus: 0,
    cardBonus: 0,
  });

  const fileImportRef = useRef<HTMLInputElement | null>(null);

  // -------------------------------------------------------------
  // FIRESTORE REAL-TIME SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    setIsSyncing(true);

    // 1. Subscribe to Campaign global state (location & scene aspects)
    const unsubCampaign = subscribeToCampaign((data) => {
      setCampaign((prev) => ({
        ...prev,
        currentLocation: data.currentLocation,
        locationsList: data.locationsList,
        sceneAspects: data.sceneAspects,
      }));
    });

    // 2. Subscribe to Characters
    const unsubChars = subscribeToCharacters((chars) => {
      if (chars.length > 0) {
        setCampaign((prev) => ({ ...prev, characters: chars }));
      }
      setIsSyncing(false);
    });

    // 3. Subscribe to Special Cards
    const unsubCards = subscribeToSpecialCards((cards) => {
      if (cards.length > 0) {
        setCampaign((prev) => ({ ...prev, specialCards: cards }));
      }
    });

    // 4. Subscribe to NPCs
    const unsubNPCs = subscribeToNPCs((npcs) => {
      if (npcs.length > 0) {
        setCampaign((prev) => ({ ...prev, npcs }));
      }
    });

    // 5. Subscribe to GM Notes (Only available for GM)
    const unsubNotes = subscribeToGMNotes((notes) => {
      setCampaign((prev) => ({ ...prev, gmNotes: notes }));
    });

    // 6. Subscribe to Real-time Shared Dice Rolls
    const unsubRolls = subscribeToDiceRolls((rolls) => {
      setCampaign((prev) => ({ ...prev, rollHistory: rolls }));
    });

    // 7. Subscribe to Timeline Entries
    const unsubTimeline = subscribeToTimeline((entries) => {
      if (entries.length > 0) {
        setCampaign((prev) => ({ ...prev, timeline: entries }));
      }
    });

    // 8. Subscribe to Kill Records / Defeated Memory
    const unsubKills = subscribeToKillRecords((records) => {
      if (records.length > 0) {
        setCampaign((prev) => ({ ...prev, killRecords: records }));
      }
    });

    // 9. Subscribe to World Regions
    const unsubRegions = subscribeToRegions((regs) => {
      if (regs.length > 0) {
        setCampaign((prev) => ({ ...prev, regions: regs }));
      }
    });

    return () => {
      unsubCampaign();
      unsubChars();
      unsubCards();
      unsubNPCs();
      unsubNotes();
      unsubRolls();
      unsubTimeline();
      unsubKills();
      unsubRegions();
    };
  }, []);

  // Default character selection
  useEffect(() => {
    if (!selectedCharacterId && campaign.characters.length > 0) {
      setSelectedCharacterId(campaign.characters[0].id);
    }
  }, [campaign.characters, selectedCharacterId]);

  // Dice roll trigger
  const handleQuickRoll = (
    rollerName: string,
    skillName: string,
    skillBonus: number,
    cardBonus: number
  ) => {
    setRollerParams({
      rollerName: rollerName || (currentUser?.displayName || 'Oyuncu'),
      skillName,
      skillBonus,
      cardBonus,
    });
    setIsDiceRollerOpen(true);
  };

  const handleRollComplete = async (outcome: DiceRollOutcome) => {
    const enhancedOutcome: DiceRollOutcome = {
      ...outcome,
      rollerName: outcome.rollerName || currentUser?.displayName || 'Oyuncu',
    };
    try {
      await saveDiceRollToDb(enhancedOutcome);
    } catch (e) {
      console.error('Error saving roll to Firestore:', e);
      setCampaign((prev) => ({
        ...prev,
        rollHistory: [enhancedOutcome, ...prev.rollHistory].slice(0, 30),
      }));
    }
  };

  const handleClearRollHistory = async () => {
    try {
      await clearAllDiceRollsFromDb(campaign.rollHistory);
    } catch (e) {
      console.error('Error clearing rolls:', e);
      setCampaign((prev) => ({ ...prev, rollHistory: [] }));
    }
  };

  // Card Forge Handlers
  const handleSaveCard = async (card: SpecialCard) => {
    try {
      await saveSpecialCardToDb(card);
    } catch (e) {
      console.error('Save card error:', e);
    }
    setCampaign((prev) => {
      const exists = prev.specialCards.some((c) => c.id === card.id);
      const nextCards = exists
        ? prev.specialCards.map((c) => (c.id === card.id ? card : c))
        : [card, ...prev.specialCards];
      return { ...prev, specialCards: nextCards };
    });
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteSpecialCardFromDb(cardId);
    } catch (e) {
      console.error('Delete card error:', e);
    }
    setCampaign((prev) => ({
      ...prev,
      specialCards: prev.specialCards.filter((c) => c.id !== cardId),
    }));
  };

  const handleAssignCard = async (cardId: string, characterId: string | null) => {
    const targetChar = campaign.characters.find((c) => c.id === characterId);
    const targetNpc = campaign.npcs.find((n) => n.id === characterId);
    const existingCard = campaign.specialCards.find((c) => c.id === cardId);
    if (!existingCard) return;

    const assignedName = targetChar ? targetChar.name : targetNpc ? targetNpc.name : undefined;
    const assignedTargetType = targetChar ? 'character' : targetNpc ? 'npc' : undefined;

    const updatedCard: SpecialCard = {
      ...existingCard,
      assignedCharacterId: characterId,
      assignedCharacterName: assignedName,
      assignedTargetType: assignedTargetType,
    };

    try {
      await saveSpecialCardToDb(updatedCard);
    } catch (e) {
      console.error('Assign card error:', e);
    }

    setCampaign((prev) => ({
      ...prev,
      specialCards: prev.specialCards.map((c) => (c.id === cardId ? updatedCard : c)),
    }));
    sfx.playCardAssignSound();
  };

  // Character Handlers
  const handleSaveCharacter = async (char: Character) => {
    try {
      await saveCharacterToDb(char);
    } catch (e) {
      console.error('Save character error:', e);
    }
    setCampaign((prev) => {
      const exists = prev.characters.some((c) => c.id === char.id);
      const nextChars = exists
        ? prev.characters.map((c) => (c.id === char.id ? char : c))
        : [...prev.characters, char];
      return { ...prev, characters: nextChars };
    });
  };

  const handleDeleteCharacter = async (charId: string) => {
    try {
      await deleteCharacterFromDb(charId);
    } catch (e) {
      console.error('Delete character error:', e);
    }
    setCampaign((prev) => ({
      ...prev,
      characters: prev.characters.filter((c) => c.id !== charId),
      specialCards: prev.specialCards.map((c) =>
        c.assignedCharacterId === charId
          ? { ...c, assignedCharacterId: null, assignedCharacterName: undefined }
          : c
      ),
    }));
    if (selectedCharacterId === charId) {
      setSelectedCharacterId(null);
    }
  };

  // NPC Handlers
  const handleSaveNPC = async (npc: NPC) => {
    try {
      await saveNPCToDb(npc);
    } catch (e) {
      console.error('Save NPC error:', e);
    }
    setCampaign((prev) => {
      const exists = prev.npcs.some((n) => n.id === npc.id);
      const nextNpcs = exists ? prev.npcs.map((n) => (n.id === npc.id ? npc : n)) : [...prev.npcs, npc];
      return { ...prev, npcs: nextNpcs };
    });
  };

  const handleDeleteNPC = async (npcId: string) => {
    try {
      await deleteNPCFromDb(npcId);
    } catch (e) {
      console.error('Delete NPC error:', e);
    }
    setCampaign((prev) => ({
      ...prev,
      npcs: prev.npcs.filter((n) => n.id !== npcId),
      specialCards: prev.specialCards.map((c) =>
        c.assignedCharacterId === npcId
          ? { ...c, assignedCharacterId: null, assignedCharacterName: undefined, assignedTargetType: undefined }
          : c
      ),
    }));
  };

  // GM Note Handlers
  const handleSaveNote = async (note: GMNote) => {
    try {
      await saveGMNoteToDb(note);
    } catch (e) {
      console.error('Save note error:', e);
    }
    setCampaign((prev) => {
      const exists = prev.gmNotes.some((n) => n.id === note.id);
      const nextNotes = exists ? prev.gmNotes.map((n) => (n.id === note.id ? note : n)) : [note, ...prev.gmNotes];
      return { ...prev, gmNotes: nextNotes };
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteGMNoteFromDb(noteId);
    } catch (e) {
      console.error('Delete note error:', e);
    }
    setCampaign((prev) => ({
      ...prev,
      gmNotes: prev.gmNotes.filter((n) => n.id !== noteId),
    }));
  };

  // -------------------------------------------------------------
  // TIMELINE & MILESTONE HANDLERS
  // -------------------------------------------------------------
  const handleSaveTimelineEntry = async (entry: TimelineEntry) => {
    try {
      await saveTimelineEntryToDb(entry);
    } catch (e) {
      console.error('Save timeline entry error:', e);
    }
    setCampaign((prev) => {
      const currentTl = prev.timeline || [];
      const exists = currentTl.some((t) => t.id === entry.id);
      const nextTl = exists
        ? currentTl.map((t) => (t.id === entry.id ? entry : t))
        : [entry, ...currentTl];
      return { ...prev, timeline: nextTl };
    });
  };

  const handleDeleteTimelineEntry = async (entryId: string) => {
    try {
      await deleteTimelineEntryFromDb(entryId);
    } catch (e) {
      console.error('Delete timeline entry error:', e);
    }
    setCampaign((prev) => ({
      ...prev,
      timeline: (prev.timeline || []).filter((t) => t.id !== entryId),
    }));
  };

  // -------------------------------------------------------------
  // KILL RECORD & DEFEATED MEMORY HANDLERS
  // -------------------------------------------------------------
  const handleSaveKillRecord = async (record: KillRecord) => {
    try {
      await saveKillRecordToDb(record);
    } catch (e) {
      console.error('Save kill record error:', e);
    }
    setCampaign((prev) => {
      const currentKills = prev.killRecords || [];
      const exists = currentKills.some((k) => k.id === record.id);
      const nextKills = exists
        ? currentKills.map((k) => (k.id === record.id ? record : k))
        : [record, ...currentKills];
      return { ...prev, killRecords: nextKills };
    });
  };

  const handleDeleteKillRecord = async (recordId: string) => {
    try {
      await deleteKillRecordFromDb(recordId);
    } catch (e) {
      console.error('Delete kill record error:', e);
    }
    setCampaign((prev) => ({
      ...prev,
      killRecords: (prev.killRecords || []).filter((k) => k.id !== recordId),
    }));
  };

  // -------------------------------------------------------------
  // REGION & WORLD ZONE HANDLERS
  // -------------------------------------------------------------
  const handleSaveRegion = async (region: RegionZone) => {
    try {
      await saveRegionToDb(region);
      // Also ensure it is in locationsList if not already
      if (!campaign.locationsList.includes(region.name)) {
        await handleAddLocation(region.name);
      }
    } catch (e) {
      console.error('Save region error:', e);
    }
    setCampaign((prev) => {
      const currentRegions = prev.regions || [];
      const exists = currentRegions.some((r) => r.id === region.id);
      const nextRegions = exists
        ? currentRegions.map((r) => (r.id === region.id ? region : r))
        : [...currentRegions, region];
      return { ...prev, regions: nextRegions };
    });
  };

  const handleDeleteRegion = async (regionId: string) => {
    try {
      await deleteRegionFromDb(regionId);
    } catch (e) {
      console.error('Delete region error:', e);
    }
    setCampaign((prev) => ({
      ...prev,
      regions: (prev.regions || []).filter((r) => r.id !== regionId),
    }));
  };

  // Move character or NPC to region
  const handleMoveCharacterToRegion = async (charId: string, locationName: string) => {
    const char = campaign.characters.find((c) => c.id === charId);
    if (char) {
      const updated = { ...char, location: locationName };
      await handleSaveCharacter(updated);
    }
  };

  const handleMoveNPCToRegion = async (npcId: string, locationName: string) => {
    const npc = campaign.npcs.find((n) => n.id === npcId);
    if (npc) {
      const updated = { ...npc, location: locationName };
      await handleSaveNPC(updated);
    }
  };

  // Location Handlers
  const handleAddLocation = async (newLoc: string) => {
    if (!campaign.locationsList.includes(newLoc)) {
      const updatedList = [...campaign.locationsList, newLoc];
      try {
        await updateCampaignState({ locationsList: updatedList });
      } catch (e) {
        console.error('Add location error:', e);
      }
      setCampaign((prev) => ({
        ...prev,
        locationsList: updatedList,
      }));
    }
  };

  const handleChangeLocation = async (newLoc: string) => {
    try {
      await updateCampaignState({ currentLocation: newLoc });
    } catch (e) {
      console.error('Change location error:', e);
    }
    setCampaign((prev) => ({ ...prev, currentLocation: newLoc }));
  };

  // Scene Aspects update
  const handleUpdateSceneAspects = async (aspects: SceneAspect[]) => {
    try {
      await updateCampaignState({ sceneAspects: aspects });
    } catch (e) {
      console.error('Update aspects error:', e);
    }
    setCampaign((prev) => ({ ...prev, sceneAspects: aspects }));
  };

  // Export / Import JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(campaign, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fate_campaign_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (parsed && parsed.characters && parsed.specialCards) {
            setCampaign(parsed);
            for (const c of parsed.characters) await saveCharacterToDb(c);
            for (const card of parsed.specialCards) await saveSpecialCardToDb(card);
            if (parsed.npcs) for (const n of parsed.npcs) await saveNPCToDb(n);
            if (parsed.timeline) for (const t of parsed.timeline) await saveTimelineEntryToDb(t);
            if (parsed.killRecords) for (const k of parsed.killRecords) await saveKillRecordToDb(k);
            if (parsed.regions) for (const r of parsed.regions) await saveRegionToDb(r);
            sfx.playSuccessSound();
            alert('Fate senaryosu başarıyla içe aktarıldı ve buluta kaydedildi!');
          }
        } catch (err) {
          alert('Geçersiz JSON formatı!');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetToDefaults = async () => {
    setCampaign(INITIAL_CAMPAIGN_STATE);
    setSelectedCharacterId(INITIAL_CAMPAIGN_STATE.characters[0]?.id || null);
    for (const c of INITIAL_CAMPAIGN_STATE.characters) await saveCharacterToDb(c);
    for (const card of INITIAL_CAMPAIGN_STATE.specialCards) await saveSpecialCardToDb(card);
    for (const n of INITIAL_CAMPAIGN_STATE.npcs) await saveNPCToDb(n);
    for (const t of INITIAL_CAMPAIGN_STATE.timeline) await saveTimelineEntryToDb(t);
    for (const k of INITIAL_CAMPAIGN_STATE.killRecords) await saveKillRecordToDb(k);
    for (const r of INITIAL_CAMPAIGN_STATE.regions) await saveRegionToDb(r);
    sfx.playSuccessSound();
  };

  const selectedCharacter = campaign.characters.find((c) => c.id === selectedCharacterId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950 w-full max-w-full overflow-x-hidden">
      {/* Hidden File Input for JSON import */}
      <input
        ref={fileImportRef}
        type="file"
        accept=".json"
        onChange={handleImportJSON}
        className="hidden"
      />

      {/* Main Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isGM={isGM}
        onToggleGM={() => {}}
        onOpenDiceRoller={() => {
          setRollerParams({
            rollerName: selectedCharacter?.name || (currentUser?.displayName || 'Game Master'),
            skillName: '',
            skillBonus: 0,
            cardBonus: 0,
          });
          setIsDiceRollerOpen(true);
        }}
        currentLocation={campaign.currentLocation}
        onExportCampaign={handleExportJSON}
        onImportCampaign={() => fileImportRef.current?.click()}
        onResetCampaign={handleResetToDefaults}
        characterCount={campaign.characters.length}
        cardCount={campaign.specialCards.length}
        npcCount={campaign.npcs.length}
        notesCount={campaign.gmNotes.length}
        timelineCount={campaign.timeline?.length || 0}
        regionCount={campaign.regions?.length || 0}
        killCount={campaign.killRecords?.length || 0}
      />

      {/* Role / Auth Header Info Banner (Mobile Compact) */}
      {!currentUser ? (
        <div className="bg-gradient-to-r from-amber-950/70 via-zinc-900 to-purple-950/70 border-b border-amber-500/20 py-2 px-3 sm:px-4 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-zinc-300 text-center sm:text-left">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
              </span>
              <span className="text-[11px] sm:text-xs">
                <strong>Canlı Bulut Masası:</strong> Oturuma katılıp karakterinizi yönetmek için Gmail ile giriş yapın.
              </span>
            </div>
            <button
              type="button"
              onClick={() => loginWithGoogle()}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Gmail ile Giriş</span>
            </button>
          </div>
        </div>
      ) : isGM ? (
        <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900 to-amber-950/40 border-b border-purple-500/20 py-1.5 px-3 sm:px-4 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-zinc-300 min-w-0">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-zinc-200 truncate text-[11px] sm:text-xs">
                <strong>{currentUser.displayName || currentUser.email}</strong> • <span className="text-amber-400 font-bold">Game Master (Admin)</span>
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Canlı Senkron
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-900 border-b border-zinc-800 py-1.5 px-3 sm:px-4 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-zinc-300 min-w-0">
              <Users className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">
                Oyuncu: <strong>{currentUser.displayName || currentUser.email}</strong>
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-zinc-500 shrink-0">Masa: {adminGmEmail.split('@')[0]}</span>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        {/* Character View */}
        {activeTab === 'characters' && (
          <div className="space-y-4 sm:space-y-6">
            {selectedCharacter ? (
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedCharacterId(null)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Tüm Karakterler</span>
                  </button>

                  {/* Character switcher pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                    {campaign.characters.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCharacterId(c.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                          c.id === selectedCharacterId
                            ? 'bg-amber-500 text-zinc-950 font-bold'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        👤 {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <CharacterSheet
                  character={selectedCharacter}
                  allCards={campaign.specialCards}
                  onUpdateCharacter={handleSaveCharacter}
                  onQuickRoll={handleQuickRoll}
                  onUnassignCard={(cardId) => handleAssignCard(cardId, null)}
                  onAssignCard={(cardId, charId) => handleAssignCard(cardId, charId)}
                  isGM={isGM}
                />
              </div>
            ) : (
              <CharacterList
                characters={campaign.characters}
                allCards={campaign.specialCards}
                selectedCharacterId={selectedCharacterId}
                onSelectCharacter={(id) => setSelectedCharacterId(id)}
                onSaveCharacter={handleSaveCharacter}
                onDeleteCharacter={handleDeleteCharacter}
                onQuickRoll={handleQuickRoll}
                isGM={isGM}
              />
            )}
          </div>
        )}

        {/* Special Cards (Card Forge) */}
        {activeTab === 'cards' && (
          <CardForge
            cards={campaign.specialCards}
            characters={campaign.characters}
            npcs={campaign.npcs}
            onSaveCard={handleSaveCard}
            onDeleteCard={handleDeleteCard}
            onAssignCard={handleAssignCard}
            isGM={isGM}
          />
        )}

        {/* NPC Management Panel */}
        {activeTab === 'npcs' && (
          <NPCManager
            npcs={campaign.npcs}
            locations={campaign.locationsList}
            currentCampaignLocation={campaign.currentLocation}
            allCards={campaign.specialCards}
            onSaveNPC={handleSaveNPC}
            onDeleteNPC={handleDeleteNPC}
            onQuickRoll={handleQuickRoll}
            onAddLocation={handleAddLocation}
            isGM={isGM}
          />
        )}

        {/* Timeline & Kill Memory Manager */}
        {activeTab === 'timeline' && (
          <TimelineManager
            timeline={campaign.timeline || []}
            killRecords={campaign.killRecords || []}
            characters={campaign.characters}
            npcs={campaign.npcs}
            locations={campaign.locationsList}
            currentLocation={campaign.currentLocation}
            isGM={isGM}
            onSaveTimelineEntry={handleSaveTimelineEntry}
            onDeleteTimelineEntry={handleDeleteTimelineEntry}
            onSaveKillRecord={handleSaveKillRecord}
            onDeleteKillRecord={handleDeleteKillRecord}
          />
        )}

        {/* Regions & World Zones Manager */}
        {activeTab === 'regions' && (
          <RegionManager
            regions={campaign.regions || []}
            characters={campaign.characters}
            npcs={campaign.npcs}
            timeline={campaign.timeline || []}
            killRecords={campaign.killRecords || []}
            currentLocation={campaign.currentLocation}
            isGM={isGM}
            onSaveRegion={handleSaveRegion}
            onDeleteRegion={handleDeleteRegion}
            onSetCurrentLocation={handleChangeLocation}
            onMoveCharacterToRegion={handleMoveCharacterToRegion}
            onMoveNPCToRegion={handleMoveNPCToRegion}
          />
        )}

        {/* GM Secret Notes (Only in GM Mode) */}
        {activeTab === 'gm_notes' && isGM && (
          <GMSecretNotes
            notes={campaign.gmNotes}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {/* Scene & Encounter Tracker */}
        {activeTab === 'scene' && (
          <SceneTracker
            currentLocation={campaign.currentLocation}
            locations={campaign.locationsList}
            onChangeLocation={handleChangeLocation}
            sceneAspects={campaign.sceneAspects}
            onUpdateAspects={handleUpdateSceneAspects}
            characters={campaign.characters}
            npcs={campaign.npcs}
            allCards={campaign.specialCards}
            onQuickRoll={handleQuickRoll}
            isGM={isGM}
          />
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE STICKY BOTTOM ACTION BAR (TOUCH FRIENDLY FOR PLAYERS) */}
      {/* ------------------------------------------------------------- */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 md:hidden flex items-center justify-around py-1.5 px-2 shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('characters')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'characters' ? 'text-amber-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Karakterim</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cards')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'cards' ? 'text-purple-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Kartlarım</span>
        </button>

        {/* Highlighted 4dF Dice Launcher in the center */}
        <button
          type="button"
          onClick={() => {
            setRollerParams({
              rollerName: selectedCharacter?.name || (currentUser?.displayName || 'Oyuncu'),
              skillName: '',
              skillBonus: 0,
              cardBonus: 0,
            });
            setIsDiceRollerOpen(true);
          }}
          className="flex flex-col items-center justify-center -mt-4 bg-gradient-to-tr from-amber-500 to-amber-600 text-zinc-950 p-2.5 rounded-2xl shadow-lg shadow-amber-500/40 border border-amber-300 active:scale-95 transition-transform cursor-pointer"
        >
          <Dices className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-tighter">ZAR AT</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scene')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'scene' ? 'text-cyan-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Sahne</span>
        </button>

        {isGM ? (
          <button
            type="button"
            onClick={() => setActiveTab('gm_notes')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'gm_notes' ? 'text-rose-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] mt-0.5">GM Notlar</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('npcs')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'npcs' ? 'text-orange-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Masa</span>
          </button>
        )}
      </nav>

      {/* Floating Modal / Drawer for Fate 4dF Dice Roller */}
      <AnimatePresence>
        {isDiceRollerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="w-full max-w-2xl my-auto"
            >
              <DiceRoller
                characters={campaign.characters}
                npcs={campaign.npcs}
                initialRollerName={rollerParams.rollerName}
                initialSkillName={rollerParams.skillName}
                initialSkillBonus={rollerParams.skillBonus}
                initialCardBonus={rollerParams.cardBonus}
                onRollComplete={handleRollComplete}
                rollHistory={campaign.rollHistory}
                onClearHistory={handleClearRollHistory}
                isGM={isGM}
                onClose={() => setIsDiceRollerOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 py-4 px-4 text-center text-xs text-zinc-600 hidden md:block">
        Fate Core Senaryo & d20 Zar Masası • Canlı Firestore Senkronizasyonu • Hızlı Çoklu Zar Seçimi • Pratik Mobil Arayüz
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
