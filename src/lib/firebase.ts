import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import {
  Character,
  SpecialCard,
  NPC,
  GMNote,
  SceneAspect,
  DiceRollOutcome,
  UserProfile,
  UserRole,
  TimelineEntry,
  KillRecord,
  RegionZone,
} from '../types/fate';
import {
  INITIAL_CAMPAIGN_STATE,
  INITIAL_TIMELINE,
  INITIAL_KILL_RECORDS,
  INITIAL_REGIONS,
} from '../data/defaultCampaign';
import firebaseConfigJson from '../../firebase-applet-config.json';

export const ADMIN_GM_EMAIL = 'ibrahim.metin.data@gmail.com';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Use the specific firestoreDatabaseId from the config
export const auth = getAuth(app);
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Google Sign In
export async function signInWithGoogle(): Promise<UserProfile | null> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return await syncUserToFirestore(res.user);
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

// Sign Out
export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Sync user to Firestore and establish GM / Player role
export async function syncUserToFirestore(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const isConfiguredGM =
    (user.email && user.email.toLowerCase() === ADMIN_GM_EMAIL.toLowerCase()) || false;

  let role: UserRole = isConfiguredGM ? 'gm' : 'player';

  if (userSnap.exists()) {
    const existingData = userSnap.data() as UserProfile;
    // Always preserve or promote configured GM
    if (isConfiguredGM) {
      role = 'gm';
    } else if (existingData.role) {
      role = existingData.role;
    }

    const updatedProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Oyuncu',
      photoURL: user.photoURL || null,
      role,
      createdAt: existingData.createdAt || Date.now(),
      lastLogin: Date.now(),
    };

    await setDoc(userRef, updatedProfile, { merge: true });
    return updatedProfile;
  } else {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Oyuncu',
      photoURL: user.photoURL || null,
      role,
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };

    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

// -------------------------------------------------------------
// FIRESTORE REAL-TIME SUBSCRIPTIONS & DATABASE CRUD
// -------------------------------------------------------------

// Seed Database if empty
export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    const campRef = doc(db, 'campaigns', 'main');
    const campSnap = await getDoc(campRef);

    if (!campSnap.exists()) {
      console.log('Seeding initial campaign data into Firestore...');
      const batch = writeBatch(db);

      // 1. Campaign state
      batch.set(campRef, {
        title: INITIAL_CAMPAIGN_STATE.title,
        currentLocation: INITIAL_CAMPAIGN_STATE.currentLocation,
        locationsList: INITIAL_CAMPAIGN_STATE.locationsList,
        sceneAspects: INITIAL_CAMPAIGN_STATE.sceneAspects,
        updatedAt: Date.now(),
      });

      // 2. Characters
      for (const char of INITIAL_CAMPAIGN_STATE.characters) {
        const charRef = doc(db, 'characters', char.id);
        batch.set(charRef, char);
      }

      // 3. Special Cards
      for (const card of INITIAL_CAMPAIGN_STATE.specialCards) {
        const cardRef = doc(db, 'specialCards', card.id);
        batch.set(cardRef, card);
      }

      // 4. NPCs
      for (const npc of INITIAL_CAMPAIGN_STATE.npcs) {
        const npcRef = doc(db, 'npcs', npc.id);
        batch.set(npcRef, npc);
      }

      // 5. GM Notes
      for (const note of INITIAL_CAMPAIGN_STATE.gmNotes) {
        const noteRef = doc(db, 'gmNotes', note.id);
        batch.set(noteRef, note);
      }

      // 6. Timeline Entries
      for (const t of INITIAL_TIMELINE) {
        const tRef = doc(db, 'timeline', t.id);
        batch.set(tRef, t);
      }

      // 7. Kill Records
      for (const k of INITIAL_KILL_RECORDS) {
        const kRef = doc(db, 'killRecords', k.id);
        batch.set(kRef, k);
      }

      // 8. Regions
      for (const reg of INITIAL_REGIONS) {
        const regRef = doc(db, 'regions', reg.id);
        batch.set(regRef, reg);
      }

      await batch.commit();
      console.log('Database seeding finished successfully.');
    }
  } catch (err) {
    console.error('Error during database check/seed:', err);
  }
}

// Subscribe to Campaign Global State
export function subscribeToCampaign(
  callback: (data: {
    currentLocation: string;
    locationsList: string[];
    sceneAspects: SceneAspect[];
  }) => void
): Unsubscribe {
  const campRef = doc(db, 'campaigns', 'main');
  return onSnapshot(
    campRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          currentLocation: data.currentLocation || 'Demirhisar Kütüphanesi',
          locationsList: data.locationsList || ['Demirhisar Kütüphanesi'],
          sceneAspects: data.sceneAspects || [],
        });
      }
    },
    (err) => {
      console.warn('Campaign subscription notice:', err.message);
    }
  );
}

export async function updateCampaignState(data: {
  currentLocation?: string;
  locationsList?: string[];
  sceneAspects?: SceneAspect[];
}): Promise<void> {
  const campRef = doc(db, 'campaigns', 'main');
  await setDoc(campRef, { ...data, updatedAt: Date.now() }, { merge: true });
}

// Characters
export function subscribeToCharacters(callback: (chars: Character[]) => void): Unsubscribe {
  const charsCol = collection(db, 'characters');
  return onSnapshot(
    charsCol,
    (snap) => {
      const items: Character[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as Character);
      });
      callback(items);
    },
    (err) => console.warn('Characters sub error:', err.message)
  );
}

export async function saveCharacterToDb(char: Character): Promise<void> {
  const ref = doc(db, 'characters', char.id);
  await setDoc(ref, char, { merge: true });
}

export async function deleteCharacterFromDb(charId: string): Promise<void> {
  const ref = doc(db, 'characters', charId);
  await deleteDoc(ref);
}

// Special Cards
export function subscribeToSpecialCards(callback: (cards: SpecialCard[]) => void): Unsubscribe {
  const cardsCol = collection(db, 'specialCards');
  return onSnapshot(
    cardsCol,
    (snap) => {
      const items: SpecialCard[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as SpecialCard);
      });
      // Sort by creation time
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(items);
    },
    (err) => console.warn('Cards sub error:', err.message)
  );
}

export async function saveSpecialCardToDb(card: SpecialCard): Promise<void> {
  const ref = doc(db, 'specialCards', card.id);
  await setDoc(ref, card, { merge: true });
}

export async function deleteSpecialCardFromDb(cardId: string): Promise<void> {
  const ref = doc(db, 'specialCards', cardId);
  await deleteDoc(ref);
}

// NPCs
export function subscribeToNPCs(callback: (npcs: NPC[]) => void): Unsubscribe {
  const npcsCol = collection(db, 'npcs');
  return onSnapshot(
    npcsCol,
    (snap) => {
      const items: NPC[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as NPC);
      });
      callback(items);
    },
    (err) => console.warn('NPC sub error:', err.message)
  );
}

export async function saveNPCToDb(npc: NPC): Promise<void> {
  const ref = doc(db, 'npcs', npc.id);
  await setDoc(ref, npc, { merge: true });
}

export async function deleteNPCFromDb(npcId: string): Promise<void> {
  const ref = doc(db, 'npcs', npcId);
  await deleteDoc(ref);
}

// GM Notes
export function subscribeToGMNotes(callback: (notes: GMNote[]) => void): Unsubscribe {
  const notesCol = collection(db, 'gmNotes');
  return onSnapshot(
    notesCol,
    (snap) => {
      const items: GMNote[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as GMNote);
      });
      items.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
      callback(items);
    },
    (err) => {
      // If permission denied (for players), send empty array
      console.log('GM Notes access (restricted for players or not GM):', err.code);
      callback([]);
    }
  );
}

export async function saveGMNoteToDb(note: GMNote): Promise<void> {
  const ref = doc(db, 'gmNotes', note.id);
  await setDoc(ref, note, { merge: true });
}

export async function deleteGMNoteFromDb(noteId: string): Promise<void> {
  const ref = doc(db, 'gmNotes', noteId);
  await deleteDoc(ref);
}

// Real-Time Shared Dice Rolls
export function subscribeToDiceRolls(callback: (rolls: DiceRollOutcome[]) => void): Unsubscribe {
  const rollsCol = collection(db, 'diceRolls');
  const q = query(rollsCol, orderBy('timestamp', 'desc'), limit(30));
  return onSnapshot(
    q,
    (snap) => {
      const items: DiceRollOutcome[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as DiceRollOutcome);
      });
      callback(items);
    },
    (err) => console.warn('Dice rolls sub notice:', err.message)
  );
}

export async function saveDiceRollToDb(outcome: DiceRollOutcome): Promise<void> {
  const ref = doc(db, 'diceRolls', outcome.id);
  await setDoc(ref, outcome);
}

export async function clearAllDiceRollsFromDb(rolls: DiceRollOutcome[]): Promise<void> {
  const batch = writeBatch(db);
  for (const r of rolls) {
    const ref = doc(db, 'diceRolls', r.id);
    batch.delete(ref);
  }
  await batch.commit();
}

// -------------------------------------------------------------
// TIMELINE ENTRIES
// -------------------------------------------------------------
export function subscribeToTimeline(callback: (entries: TimelineEntry[]) => void): Unsubscribe {
  const colRef = collection(db, 'timeline');
  return onSnapshot(
    colRef,
    (snap) => {
      const items: TimelineEntry[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as TimelineEntry);
      });
      items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      callback(items);
    },
    (err) => console.warn('Timeline sub error:', err.message)
  );
}

export async function saveTimelineEntryToDb(entry: TimelineEntry): Promise<void> {
  const ref = doc(db, 'timeline', entry.id);
  await setDoc(ref, entry, { merge: true });
}

export async function deleteTimelineEntryFromDb(entryId: string): Promise<void> {
  const ref = doc(db, 'timeline', entryId);
  await deleteDoc(ref);
}

// -------------------------------------------------------------
// KILL RECORDS / DEFEATED MEMORY
// -------------------------------------------------------------
export function subscribeToKillRecords(callback: (records: KillRecord[]) => void): Unsubscribe {
  const colRef = collection(db, 'killRecords');
  return onSnapshot(
    colRef,
    (snap) => {
      const items: KillRecord[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as KillRecord);
      });
      items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      callback(items);
    },
    (err) => console.warn('KillRecords sub error:', err.message)
  );
}

export async function saveKillRecordToDb(record: KillRecord): Promise<void> {
  const ref = doc(db, 'killRecords', record.id);
  await setDoc(ref, record, { merge: true });
}

export async function deleteKillRecordFromDb(recordId: string): Promise<void> {
  const ref = doc(db, 'killRecords', recordId);
  await deleteDoc(ref);
}

// -------------------------------------------------------------
// REGIONS / WORLD ZONES
// -------------------------------------------------------------
export function subscribeToRegions(callback: (regions: RegionZone[]) => void): Unsubscribe {
  const colRef = collection(db, 'regions');
  return onSnapshot(
    colRef,
    (snap) => {
      const items: RegionZone[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as RegionZone);
      });
      items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      callback(items);
    },
    (err) => console.warn('Regions sub error:', err.message)
  );
}

export async function saveRegionToDb(region: RegionZone): Promise<void> {
  const ref = doc(db, 'regions', region.id);
  await setDoc(ref, region, { merge: true });
}

export async function deleteRegionFromDb(regionId: string): Promise<void> {
  const ref = doc(db, 'regions', regionId);
  await deleteDoc(ref);
}

