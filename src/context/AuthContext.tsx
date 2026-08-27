import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, syncUserToFirestore, signInWithGoogle, logoutUser, ADMIN_GM_EMAIL, seedDatabaseIfEmpty } from '../lib/firebase';
import { UserProfile } from '../types/fate';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isGM: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  adminGmEmail: string;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  isGM: false,
  loginWithGoogle: async () => {},
  logout: async () => {},
  adminGmEmail: ADMIN_GM_EMAIL,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial seed
    seedDatabaseIfEmpty();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await syncUserToFirestore(user);
          setUserProfile(profile);
        } catch (e) {
          console.error('Error syncing user profile:', e);
          const isGM = (user.email && user.email.toLowerCase() === ADMIN_GM_EMAIL.toLowerCase()) || false;
          setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Oyuncu',
            photoURL: user.photoURL,
            role: isGM ? 'gm' : 'player',
            createdAt: Date.now(),
            lastLogin: Date.now(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const profile = await signInWithGoogle();
      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUserProfile(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isGM =
    userProfile?.role === 'gm' ||
    (currentUser?.email && currentUser.email.toLowerCase() === ADMIN_GM_EMAIL.toLowerCase()) ||
    false;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isGM,
        loginWithGoogle: handleLogin,
        logout: handleLogout,
        adminGmEmail: ADMIN_GM_EMAIL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
