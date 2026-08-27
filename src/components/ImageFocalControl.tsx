import React, { useState, useRef } from 'react';
import { Target, ZoomIn, Move, Crosshair, Sparkles, User } from 'lucide-react';

interface ImageFocalControlProps {
  imageUrl: string;
  position?: string; // e.g. '50% 50%', 'center top', '50% 20%'
  scale?: number; // e.g. 1, 1.25
  onChangePosition: (pos: string) => void;
  onChangeScale?: (scale: number) => void;
  label?: string;
  previewShape?: 'circle' | 'card' | 'square';
}

const PRESET_POSITIONS = [
  { label: 'Yüz / Üst', icon: User, value: '50% 15%' },
  { label: 'Merkez', icon: Target, value: '50% 50%' },
  { label: 'Alt / Gövde', icon: Move, value: '50% 85%' },
  { label: 'Sol', icon: Crosshair, value: '20% 50%' },
  { label: 'Sağ', icon: Crosshair, value: '80% 50%' },
];

export const ImageFocalControl: React.FC<ImageFocalControlProps> = ({
  imageUrl,
  position = '50% 50%',
  scale = 1,
  onChangePosition,
  onChangeScale,
  label = 'Görsel Odak & Kadraj Ayarı',
  previewShape = 'square',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parse current X and Y percentage
  const parseCoordinates = (posStr: string): { x: number; y: number } => {
    if (!posStr) return { x: 50, y: 50 };
    if (posStr.includes('top')) return { x: 50, y: 15 };
    if (posStr.includes('bottom')) return { x: 50, y: 85 };
    if (posStr.includes('left')) return { x: 20, y: 50 };
    if (posStr.includes('right')) return { x: 80, y: 50 };
    
    const parts = posStr.split(' ');
    if (parts.length === 2) {
      const x = parseFloat(parts[0]) || 50;
      const y = parseFloat(parts[1]) || 50;
      return { x, y };
    }
    return { x: 50, y: 50 };
  };

  const coords = parseCoordinates(position);

  // Handle direct click on image to set focal point
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = Math.round(Math.max(0, Math.min(100, (clickX / rect.width) * 100)));
    const percentY = Math.round(Math.max(0, Math.min(100, (clickY / rect.height) * 100)));

    onChangePosition(`${percentX}% ${percentY}%`);
  };

  if (!imageUrl) return null;

  return (
    <div className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-200">{label}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline decoration-dotted"
        >
          {isOpen ? 'Basit Görünüme Dön' : 'Odak & Yakınlaştırmayı Ayarla'}
        </button>
      </div>

      {/* Quick 1-Click Presets */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] text-zinc-400 mr-1">Hızlı Odak:</span>
        {PRESET_POSITIONS.map((preset) => {
          const isSelected = position === preset.value;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChangePosition(preset.value)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <preset.icon className="w-3 h-3" />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Advanced Interactive Framing & Zoom Panel */}
      {isOpen && (
        <div className="pt-2 border-t border-zinc-800/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Interactive Click-to-Focus Canvas Preview */}
            <div>
              <p className="text-[10px] text-zinc-400 mb-1 flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-amber-400" />
                <span>Görsel üzerinde görünmesini istediğiniz noktaya <strong>tıklayın</strong>:</span>
              </p>
              <div
                ref={containerRef}
                onClick={handleImageClick}
                className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 cursor-crosshair group shadow-inner"
                title="Odaklamak istediğiniz alana tıklayın"
              >
                <img
                  src={imageUrl}
                  alt="Focus Picker"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: `${coords.x}% ${coords.y}%`,
                  }}
                />
                {/* Focal Target Crosshair Indicator */}
                <div
                  className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/30 flex items-center justify-center shadow-lg pointer-events-none transition-all duration-150"
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                >
                  <div className="w-1.5 h-1.5 bg-amber-300 rounded-full" />
                </div>
              </div>
            </div>

            {/* Target Live Mask Preview & Sliders */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {/* Live Preview Avatar/Card shape */}
                <div className="shrink-0 text-center">
                  <div
                    className={`overflow-hidden border-2 border-amber-500/60 bg-zinc-900 shadow-md ${
                      previewShape === 'circle'
                        ? 'w-14 h-14 rounded-full'
                        : previewShape === 'card'
                        ? 'w-16 h-20 rounded-xl'
                        : 'w-14 h-14 rounded-xl'
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt="Crop Result"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: position,
                        transform: `scale(${scale})`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">Önizleme</span>
                </div>

                {/* Coordinate Sliders */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Yatay (X): {coords.x}%</span>
                    <span>Dikey (Y): {coords.y}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={coords.x}
                    onChange={(e) => onChangePosition(`${e.target.value}% ${coords.y}%`)}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={coords.y}
                    onChange={(e) => onChangePosition(`${coords.x}% ${e.target.value}%`)}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Zoom / Scale Slider if supported */}
              {onChangeScale && (
                <div className="flex items-center gap-2 pt-1">
                  <ZoomIn className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                    Büyütme: {Math.round(scale * 100)}%
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={scale}
                    onChange={(e) => onChangeScale(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
