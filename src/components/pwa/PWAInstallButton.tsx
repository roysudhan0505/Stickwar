import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { StickwarButton } from '../ui/StickwarButton';
import { sound } from '../../utils/audio';

interface PWAInstallButtonProps {
  variant?: 'banner' | 'button' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    sound.playClick();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General browser tip if beforeinstallprompt not yet triggered
      alert('To install Stickwar:\n• Chrome/Edge: Click the install icon in your address bar or browser menu.\n• Safari/iOS: Tap Share > Add to Home Screen.');
    }
  };

  if (variant === 'banner') {
    if (bannerDismissed) return null;

    return (
      <>
        <div
          className={`bg-gradient-to-r from-[#16213E] to-[#1A1A2E] border-2 border-[#FFD60A] p-3 rounded-2xl flex items-center justify-between gap-3 shadow-[4px_4px_0px_#000000] relative ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD60A] text-[#1A1A2E] flex items-center justify-center font-comic text-xl flex-shrink-0 shadow-[2px_2px_0px_#000000]">
              <Download className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-comic text-lg text-[#FFD60A] leading-tight">
                INSTALL STICKWAR APP
              </h4>
              <p className="font-tech text-xs text-[#F1F1F1]/80">
                Play offline at 60 FPS • Fullscreen combat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <StickwarButton
              variant="accent"
              size="sm"
              onClick={handleInstallClick}
              className="py-1 px-3 text-xs"
            >
              {isIOS ? 'INSTALL (iOS)' : 'INSTALL'}
            </StickwarButton>

            <button
              onClick={() => {
                sound.playClick();
                setBannerDismissed(true);
              }}
              className="text-white/40 hover:text-white p-1"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* iOS Install Instructions Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#16213E] border-2 border-[#FFD60A] p-5 shadow-[6px_6px_0px_#000000] space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-comic text-2xl text-[#FFD60A]">
                  INSTALL ON IPHONE / IPAD
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 font-tech text-sm text-[#F1F1F1]/90">
                <div className="flex items-start gap-3 bg-[#1A1A2E] p-3 rounded-xl border border-white/10">
                  <div className="w-7 h-7 rounded-lg bg-[#E63946] flex items-center justify-center flex-shrink-0 text-white font-bold">
                    1
                  </div>
                  <div>
                    <span>Tap the </span>
                    <strong className="text-[#FFD60A] inline-flex items-center gap-1">
                      <Share className="w-4 h-4" /> Share
                    </strong>
                    <span> button in the Safari bottom toolbar.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#1A1A2E] p-3 rounded-xl border border-white/10">
                  <div className="w-7 h-7 rounded-lg bg-[#E63946] flex items-center justify-center flex-shrink-0 text-white font-bold">
                    2
                  </div>
                  <div>
                    <span>Scroll down the menu and choose </span>
                    <strong className="text-[#FFD60A] inline-flex items-center gap-1">
                      <PlusSquare className="w-4 h-4" /> Add to Home Screen
                    </strong>
                    <span>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#1A1A2E] p-3 rounded-xl border border-white/10">
                  <div className="w-7 h-7 rounded-lg bg-[#E63946] flex items-center justify-center flex-shrink-0 text-white font-bold">
                    3
                  </div>
                  <div>
                    <span>Tap </span>
                    <strong className="text-[#06D6A0]">Add</strong>
                    <span> in the top right to launch Stickwar anytime in full-screen!</span>
                  </div>
                </div>
              </div>

              <StickwarButton
                variant="accent"
                fullWidth
                size="md"
                onClick={() => setShowIOSGuide(false)}
              >
                GOT IT, WARRIOR!
              </StickwarButton>
            </div>
          </div>
        )}
      </>
    );
  }

  // Compact or Button variant
  return (
    <>
      <StickwarButton
        variant="accent"
        size={variant === 'compact' ? 'sm' : 'md'}
        icon={<Smartphone className="w-4 h-4" />}
        onClick={handleInstallClick}
        className={className}
      >
        {isIOS ? 'Install (iOS)' : 'Install App'}
      </StickwarButton>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#16213E] border-2 border-[#FFD60A] p-5 shadow-[6px_6px_0px_#000000] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-comic text-2xl text-[#FFD60A]">
                INSTALL ON IPHONE / IPAD
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-tech text-sm text-[#F1F1F1]/90">
              <div className="flex items-start gap-3 bg-[#1A1A2E] p-3 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-[#E63946] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  1
                </div>
                <div>
                  <span>Tap Safari's </span>
                  <strong className="text-[#FFD60A] inline-flex items-center gap-1">
                    <Share className="w-4 h-4" /> Share
                  </strong>
                  <span> button.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#1A1A2E] p-3 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-[#E63946] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  2
                </div>
                <div>
                  <span>Select </span>
                  <strong className="text-[#FFD60A] inline-flex items-center gap-1">
                    <PlusSquare className="w-4 h-4" /> Add to Home Screen
                  </strong>
                  <span>.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#1A1A2E] p-3 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-[#E63946] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  3
                </div>
                <div>
                  <span>Tap </span>
                  <strong className="text-[#06D6A0]">Add</strong>
                  <span> to launch Stickwar in native fullscreen.</span>
                </div>
              </div>
            </div>

            <StickwarButton
              variant="accent"
              fullWidth
              size="md"
              onClick={() => setShowIOSGuide(false)}
            >
              UNDERSTOOD
            </StickwarButton>
          </div>
        </div>
      )}
    </>
  );
};
