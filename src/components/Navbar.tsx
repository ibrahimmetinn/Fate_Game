import React, { useState } from 'react';
import {
  Shield,
  Dices,
  Layers,
  Users,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Menu,
  X,
  Settings,
  Flame,
  LogIn,
  LogOut,
  Crown,
  Calendar,
  Compass,
  Skull,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'characters'
  | 'cards'
  | 'npcs'
  | 'timeline'
  | 'regions'
  | 'gm_notes'
  | 'scene';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isGM: boolean;
  onToggleGM: () => void;
  onOpenDiceRoller: () => void;
  currentLocation: string;
  onExportCampaign: () => void;
  onImportCampaign: () => void;
  onResetCampaign: () => void;
  characterCount: number;
  cardCount: number;
  npcCount: number;
  notesCount: number;
  timelineCount?: number;
  regionCount?: number;
  killCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isGM,
  onToggleGM,
  onOpenDiceRoller,
  currentLocation,
  onExportCampaign,
  onImportCampaign,
  onResetCampaign,
  characterCount,
  cardCount,
  npcCount,
  notesCount,
  timelineCount,
  regionCount,
  killCount,
}) => {
  const { currentUser, userProfile, loginWithGoogle, logout, adminGmEmail } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const handleLoginClick = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-white tracking-wider">
                  FATE CORE
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold">
                  GM SUITE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block truncate max-w-[200px]">
                📍 {currentLocation}
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => onTabChange('characters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'characters'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Karakterler ({characterCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Özel Kartlar ({cardCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('npcs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'npcs'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>NPC'ler ({npcCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Zaman Çizelgesi & Zaferler {timelineCount !== undefined ? `(${timelineCount})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('regions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'regions'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bölgeler & Harita {regionCount !== undefined ? `(${regionCount})` : ''}</span>
            </button>

            {isGM && (
              <button
                type="button"
                onClick={() => onTabChange('gm_notes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'gm_notes'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Gizli Notlar ({notesCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onTabChange('scene')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'scene'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Sahne</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Quick d20 Dice Roller Trigger */}
            <button
              type="button"
              onClick={onOpenDiceRoller}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            >
              <Dices className="w-4 h-4" />
              <span className="hidden sm:inline">d20 ZAR AT</span>
            </button>

            {/* GM Mode Toggle (if GM user) */}
            {isGM && (
              <button
                type="button"
                onClick={onToggleGM}
                className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isGM
                    ? 'bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-sm shadow-purple-500/20'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
                title="Game Master / Yönetici Yetkisi Açık"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden lg:inline">GM / Admin</span>
              </button>
            )}

            {/* User Profile / Google Sign-In */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 cursor-pointer transition-all"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Kullanıcı'}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-amber-500/50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                    </div>
                  )}
                  <div className="text-left hidden xl:block pr-1">
                    <p className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </p>
                    <span className={`text-[10px] font-semibold ${isGM ? 'text-amber-400' : 'text-zinc-400'}`}>
                      {isGM ? '👑 Game Master' : '🎮 Oyuncu'}
                    </span>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl z-50 space-y-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Avatar"
                          className="w-10 h-10 rounded-lg object-cover ring-2 ring-amber-500/50"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base">
                          {currentUser.displayName?.[0] || 'U'}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">
                          {currentUser.displayName || 'Kullanıcı'}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">{currentUser.email}</p>
                        <span
                          className={`inline-flex items-center gap-1 mt-0.5 text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isGM
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {isGM ? '👑 Game Master (Admin)' : '🎮 Oyuncu'}
                        </span>
                      </div>
                    </div>

                    {isGM && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-tight">
                        ✨ Game Master ayrıcalıkları aktif. Gizli notları, NPC'leri ve tüm kartları yönetebilirsiniz.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLoginClick}
                disabled={isLoggingIn}
                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>{isLoggingIn ? 'Giriş Yapılıyor...' : 'Gmail ile Giriş'}</span>
              </button>
            )}

            {/* Settings & Backup Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                title="Kampanya Ayarları & Yedek"
              >
                <Settings className="w-4 h-4" />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-2xl z-50 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Bulut & Yedekleme
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onExportCampaign();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>JSON Yedek İndir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onImportCampaign();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>JSON Yedek Yükle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Örnek Fate senaryosu verilerini yeniden yüklemek istiyor musunuz?')) {
                        onResetCampaign();
                      }
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/50 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Örnek Senaryoyu Sıfırla</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-zinc-800 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                onTabChange('characters');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'characters' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-300'
              }`}
            >
              <Users className="w-4 h-4" /> Karakterler ({characterCount})
            </button>
            <button
              type="button"
              onClick={() => {
                onTabChange('cards');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'cards' ? 'bg-purple-600 text-white' : 'text-zinc-300'
              }`}
            >
              <Layers className="w-4 h-4" /> Özel Kartlar ({cardCount})
            </button>
            <button
              type="button"
              onClick={() => {
                onTabChange('npcs');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'npcs' ? 'bg-orange-600 text-white' : 'text-zinc-300'
              }`}
            >
              <Shield className="w-4 h-4" /> NPC'ler ({npcCount})
            </button>
            <button
              type="button"
              onClick={() => {
                onTabChange('timeline');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'timeline' ? 'bg-indigo-600 text-white' : 'text-zinc-300'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-400" /> Zaman Çizelgesi & Zaferler {timelineCount !== undefined ? `(${timelineCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => {
                onTabChange('regions');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'regions' ? 'bg-cyan-600 text-white' : 'text-zinc-300'
              }`}
            >
              <Compass className="w-4 h-4 text-cyan-400" /> Bölgeler & Harita {regionCount !== undefined ? `(${regionCount})` : ''}
            </button>
            {isGM && (
              <button
                type="button"
                onClick={() => {
                  onTabChange('gm_notes');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                  activeTab === 'gm_notes' ? 'bg-red-600 text-white' : 'text-zinc-300'
                }`}
              >
                <Lock className="w-4 h-4" /> Gizli Notlar ({notesCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onTabChange('scene');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'scene' ? 'bg-amber-600 text-white' : 'text-zinc-300'
              }`}
            >
              <MapPin className="w-4 h-4" /> Sahne & Karşılaşma
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
