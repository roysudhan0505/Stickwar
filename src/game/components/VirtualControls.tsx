import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Zap, Swords } from 'lucide-react';
import { InputControls } from '../engine/types';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';

interface VirtualControlsProps {
  onControlsChange: (controls: InputControls) => void;
  specialCooldownPercent: number; // 0 (ready) to 1 (full cooldown)
  specialCooldownSeconds: number;
  comboStep: number;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onControlsChange,
  specialCooldownPercent,
  specialCooldownSeconds,
  comboStep,
}) => {
  const { state } = useGame();
  const buttonSizeSetting = state.player.settings.controlButtonSize || 'Medium';

  const [controls, setControls] = useState<InputControls>({
    left: false,
    right: false,
    jump: false,
    attack: false,
    special: false,
  });

  // Size mapping for responsive buttons (Small: 52px, Medium: 62px, Large: 72px)
  const sizeClass =
    buttonSizeSetting === 'Small'
      ? 'w-13 h-13 text-base'
      : buttonSizeSetting === 'Large'
      ? 'w-18 h-18 text-xl'
      : 'w-15 h-15 text-lg';

  const actionSizeClass =
    buttonSizeSetting === 'Small'
      ? 'w-14 h-14'
      : buttonSizeSetting === 'Large'
      ? 'w-19 h-19'
      : 'w-16 h-16';

  // Notify parent on controls change
  const updateControl = (key: keyof InputControls, value: boolean) => {
    setControls((prev) => {
      if (prev[key] === value) return prev;
      const next = { ...prev, [key]: value };
      onControlsChange(next);
      return next;
    });
  };

  // Bind Keyboard Listeners for Desktop Testing & Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture inputs if typing in an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        updateControl('left', true);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        updateControl('right', true);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        updateControl('jump', true);
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') {
        updateControl('attack', true);
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'x' || e.key === 'X') {
        updateControl('special', true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        updateControl('left', false);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        updateControl('right', false);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        updateControl('jump', false);
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') {
        updateControl('attack', false);
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'x' || e.key === 'X') {
        updateControl('special', false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-end p-4 pb-6 select-none touch-none">
      <div className="w-full flex items-end justify-between">
        {/* Left Side: Virtual D-Pad (Movement) */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Left Arrow Button */}
          <button
            id="btn-dpad-left"
            type="button"
            className={`${sizeClass} rounded-2xl bg-[#16213E]/85 border-2 ${
              controls.left ? 'border-[#FFD60A] bg-[#FFD60A]/20 scale-95' : 'border-white/30'
            } backdrop-blur-sm flex items-center justify-center text-white shadow-[3px_3px_0px_#000000] active:scale-95 transition-transform duration-75`}
            onPointerDown={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              updateControl('left', true);
              sound.vibrate(10);
            }}
            onPointerUp={() => updateControl('left', false)}
            onPointerLeave={() => updateControl('left', false)}
            onPointerCancel={() => updateControl('left', false)}
            aria-label="Move Left"
          >
            <ArrowLeft className="w-6 h-6 stroke-[3]" />
          </button>

          {/* Right Arrow Button */}
          <button
            id="btn-dpad-right"
            type="button"
            className={`${sizeClass} rounded-2xl bg-[#16213E]/85 border-2 ${
              controls.right ? 'border-[#FFD60A] bg-[#FFD60A]/20 scale-95' : 'border-white/30'
            } backdrop-blur-sm flex items-center justify-center text-white shadow-[3px_3px_0px_#000000] active:scale-95 transition-transform duration-75`}
            onPointerDown={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              updateControl('right', true);
              sound.vibrate(10);
            }}
            onPointerUp={() => updateControl('right', false)}
            onPointerLeave={() => updateControl('right', false)}
            onPointerCancel={() => updateControl('right', false)}
            aria-label="Move Right"
          >
            <ArrowRight className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Right Side: Action Cluster (Jump, Attack Combo, Special) */}
        <div className="flex items-end gap-3 pointer-events-auto relative">
          {/* Jump Button */}
          <button
            id="btn-action-jump"
            type="button"
            className={`${sizeClass} rounded-2xl bg-[#16213E]/85 border-2 ${
              controls.jump ? 'border-[#06D6A0] bg-[#06D6A0]/20 scale-95' : 'border-white/30'
            } backdrop-blur-sm flex flex-col items-center justify-center text-white shadow-[3px_3px_0px_#000000] active:scale-95 transition-transform duration-75`}
            onPointerDown={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              updateControl('jump', true);
              sound.vibrate(15);
            }}
            onPointerUp={() => updateControl('jump', false)}
            onPointerLeave={() => updateControl('jump', false)}
            onPointerCancel={() => updateControl('jump', false)}
            aria-label="Jump"
          >
            <ArrowUp className="w-6 h-6 stroke-[3] text-[#06D6A0]" />
            <span className="font-tech text-[9px] font-bold tracking-tight text-white/80">JUMP</span>
          </button>

          {/* Action Column: Special Ability (Above) + Attack Button (Below) */}
          <div className="flex flex-col items-center gap-2.5">
            {/* Special Ability Button with Cooldown Ring */}
            <div className="relative">
              <button
                id="btn-action-special"
                type="button"
                disabled={specialCooldownPercent > 0}
                className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#E63946] to-[#991B1B] border-2 ${
                  specialCooldownPercent > 0
                    ? 'border-white/20 opacity-60 cursor-not-allowed'
                    : 'border-[#FFD60A] shadow-[3px_3px_0px_#000000] animate-pulse'
                } backdrop-blur-sm flex flex-col items-center justify-center text-white active:scale-95 transition-transform duration-75`}
                onPointerDown={(e) => {
                  if (specialCooldownPercent > 0) return;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  updateControl('special', true);
                }}
                onPointerUp={() => updateControl('special', false)}
                onPointerLeave={() => updateControl('special', false)}
                onPointerCancel={() => updateControl('special', false)}
                aria-label="Special Ability"
              >
                <Zap className="w-5 h-5 text-[#FFD60A] fill-[#FFD60A]" />
                <span className="font-tech text-[8px] font-bold tracking-tight">SPECIAL</span>

                {/* Cooldown Number Overlay */}
                {specialCooldownSeconds > 0 && (
                  <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center font-comic text-sm text-[#FFD60A]">
                    {specialCooldownSeconds.toFixed(1)}s
                  </div>
                )}
              </button>
            </div>

            {/* Attack Button (Large Primary) */}
            <button
              id="btn-action-attack"
              type="button"
              className={`${actionSizeClass} rounded-2xl bg-gradient-to-br from-[#E63946] to-[#B91C1C] border-3 ${
                controls.attack ? 'border-[#FFD60A] scale-95 ring-2 ring-[#FFD60A]' : 'border-white'
              } flex flex-col items-center justify-center text-white shadow-[4px_4px_0px_#000000] active:scale-95 transition-transform duration-75 relative`}
              onPointerDown={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                updateControl('attack', true);
              }}
              onPointerUp={() => updateControl('attack', false)}
              onPointerLeave={() => updateControl('attack', false)}
              onPointerCancel={() => updateControl('attack', false)}
              aria-label="Attack"
            >
              <Swords className="w-7 h-7 text-[#FFD60A]" />
              <span className="font-comic text-xs tracking-wider">ATTACK</span>

              {/* Combo Step Pip Indicators */}
              <div className="absolute -top-2 flex items-center gap-1 bg-black/80 px-1.5 py-0.5 rounded-full border border-white/30">
                <div
                  className={`w-2 h-2 rounded-full ${
                    comboStep >= 1 ? 'bg-[#FFD60A]' : 'bg-white/20'
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full ${
                    comboStep >= 2 ? 'bg-[#FFD60A]' : 'bg-white/20'
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full ${
                    comboStep >= 3 ? 'bg-[#E63946]' : 'bg-white/20'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Keyboard Controls Legend Helper (Subtle bottom text) */}
      <div className="w-full text-center mt-2 pointer-events-none hidden sm:block">
        <span className="font-tech text-[11px] text-white/40 tracking-wider">
          KEYS: [A/D] Move • [W/SPACE] Jump • [J] Attack Combo • [K] Special Ability
        </span>
      </div>
    </div>
  );
};
