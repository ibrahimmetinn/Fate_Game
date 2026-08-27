import React from 'react';
import { SpecialCard, FateRarity } from '../types/fate';
import { RARITY_CONFIG } from '../utils/fateLadder';
import { Sparkles, Shield, Gem, Zap, Crown, Flame, Plus, UserMinus, Edit3, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface CardItemProps {
  card: SpecialCard;
  onEdit?: (card: SpecialCard) => void;
  onDelete?: (cardId: string) => void;
  onDuplicate?: (card: SpecialCard) => void;
  onAssignToggle?: (card: SpecialCard) => void;
  isGM?: boolean;
  compact?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

const RarityIcons: Record<FateRarity, React.ComponentType<{ className?: string }>> = {
  common: Shield,
  uncommon: Sparkles,
  rare: Gem,
  epic: Zap,
  legendary: Crown,
  mythic: Flame,
};

export const CardItem: React.FC<CardItemProps> = ({
  card,
  onEdit,
  onDelete,
  onDuplicate,
  onAssignToggle,
  isGM = true,
  compact = false,
  selected = false,
  onSelect,
}) => {
  const rarityInfo = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.common;
  const RarityIcon = RarityIcons[card.rarity] || Shield;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      id={`card-${card.id}`}
      className={`relative group rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between bg-gradient-to-b ${rarityInfo.bgGradient} ${rarityInfo.cardBorder} ${rarityInfo.glowShadow} w-full max-w-full ${
        selected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 shadow-2xl' : ''
      } ${compact ? 'p-3 text-sm min-h-[auto]' : 'p-4 min-h-[340px]'}`}
    >
      {/* Top Banner / Rarity & Type */}
      <div className="w-full min-w-0">
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shrink-0 ${rarityInfo.badgeBg}`}>
              <RarityIcon className="w-3 h-3" />
              <span>{rarityInfo.nameTr.split(' ')[0]}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-black/40 border border-white/10 text-zinc-300 font-medium shrink-0">
              {card.type}
            </span>
          </div>

          {/* Assigned Status Pill */}
          {card.assignedCharacterId ? (
            <span
              title={`Atandığı Kişi: ${card.assignedCharacterName || 'Karakter'}`}
              className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 shrink-0 truncate max-w-[120px]"
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{card.assignedCharacterName || 'Aktif'}</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-800/80 border border-zinc-700 text-zinc-400 shrink-0">
              Boşta
            </span>
          )}
        </div>

        {/* Card Title & Subtitle */}
        <h3 className="font-bold text-white text-sm sm:text-base leading-tight tracking-wide group-hover:text-amber-200 transition-colors break-words">
          {card.name}
        </h3>
        {card.subtitle && (
          <p className="text-[11px] text-zinc-400 font-medium italic mt-0.5 mb-1.5 break-words">
            {card.subtitle}
          </p>
        )}

        {/* Card Artwork / Image (Omit or shrink in compact mode if desired) */}
        {card.imageUrl ? (
          <div className={`relative w-full rounded-xl overflow-hidden my-2 border border-white/10 bg-zinc-950/60 shadow-inner group/img ${compact ? 'h-24' : 'h-32 sm:h-36'}`}>
            <img
              src={card.imageUrl}
              alt={card.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
              style={{
                objectPosition: card.imagePosition || '50% 50%',
                transform: card.imageScale && card.imageScale !== 1 ? `scale(${card.imageScale})` : undefined,
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          </div>
        ) : null}

        {/* Stat Bonuses (Otomatik Eklenen Bonuslar) */}
        {card.bonuses && card.bonuses.length > 0 && (
          <div className="my-1.5 flex flex-wrap gap-1">
            {card.bonuses.map((bonus, idx) => (
              <span
                key={bonus.id || idx}
                className="px-2 py-0.5 rounded-lg bg-black/60 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                {bonus.type === 'skill' && `${bonus.value > 0 ? '+' : ''}${bonus.value} ${bonus.targetSkill}`}
                {bonus.type === 'physical_stress' && `+${bonus.value} Fiz. Stres`}
                {bonus.type === 'mental_stress' && `+${bonus.value} Zih. Stres`}
                {bonus.type === 'fate_point' && `+${bonus.value} Kader Puanı`}
                {bonus.type === 'refresh' && `+${bonus.value} Yenileme`}
                {bonus.type === 'custom' && `${bonus.value > 0 ? '+' : ''}${bonus.value} ${bonus.description || 'Özel'}`}
              </span>
            ))}
          </div>
        )}

        {/* Description & Rule Effect */}
        <div className="space-y-1 text-xs text-zinc-200 mt-1.5 break-words">
          {card.description && (
            <p className="text-zinc-300/90 leading-relaxed italic line-clamp-2">
              "{card.description}"
            </p>
          )}
          {card.ruleEffect && (
            <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-zinc-100 font-sans leading-snug text-[11px]">
              <strong className="text-amber-300 font-semibold">Etki: </strong>
              {card.ruleEffect}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer & Action Buttons (GM / Player) */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate max-w-[120px]">
          {card.tags && card.tags.slice(0, 2).map((t, i) => (
            <span key={i} className="text-zinc-400">#{t}</span>
          ))}
        </div>

        {isGM && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onAssignToggle && (
              <button
                type="button"
                onClick={() => onAssignToggle(card)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  card.assignedCharacterId
                    ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600/40'
                    : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/50'
                }`}
                title={card.assignedCharacterId ? 'Karakterden Geri Al' : 'Karaktere Ata'}
              >
                {card.assignedCharacterId ? (
                  <>
                    <UserMinus className="w-3 h-3" />
                    <span>Çıkar</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Ata</span>
                  </>
                )}
              </button>
            )}

            {onDuplicate && (
              <button
                type="button"
                onClick={() => onDuplicate(card)}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Klonla"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(card)}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Düzenle"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(card.id)}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-rose-900 text-zinc-400 hover:text-rose-200 transition-colors cursor-pointer"
                title="Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
