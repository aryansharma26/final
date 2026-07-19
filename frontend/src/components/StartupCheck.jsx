import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

const HEALTH_CHECK_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/health`;

export default function StartupCheck({ children }) {
  const [backendReady, setBackendReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let active = true;
    const startTime = Date.now();
    const MIN_SPLASH_TIME =20; // Enforce minimum 5s splash animation to avoid visual flicker

    const checkHealth = async () => {
      try {
        const response = await fetch(HEALTH_CHECK_URL);
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }
        const data = await response.json();
        if (data?.success && active) {
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, MIN_SPLASH_TIME - elapsedTime);

          setTimeout(() => {
            if (active) {
              setBackendReady(true);
              // Wait for the slide transition to complete before unmounting the splash overlay
              setTimeout(() => {
                if (active) setShowSplash(false);
              }, 800);
            }
          }, remainingTime);
        } else {
          throw new Error('Database connection or backend not fully ready');
        }
      } catch (err) {
        if (active) {
          setTimeout(checkHealth, 1000); // Retry after 1 second
        }
      }
    };

    checkHealth();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* Main app is rendered in the background once ready, allowing safe API calls and smooth cross-fade */}
      {backendReady && children}

      {showSplash && (
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none select-none">
          {/* Top Panel - Slides UP when backend is ready */}
          <div
            className={`absolute top-0 left-0 w-full h-[50.2%] bg-gray-50 transition-transform duration-150 ease-in-out ${
              backendReady ? '-translate-y-full' : 'translate-y-0'
            }`}
          />
          {/* Bottom Panel - Slides DOWN when backend is ready */}
          <div
            className={`absolute bottom-0 left-0 w-full h-[50.2%] bg-gray-50 transition-transform duration-150 ease-in-out ${
              backendReady ? 'translate-y-full' : 'translate-y-0'
            }`}
          />

          {/* Custom animations styles for EKG pulse and exit zoom */}
          <style>{`
            @keyframes ecg-pulse-left {
              0% {
                stroke-dashoffset: 540;
              }
              48% {
                stroke-dashoffset: 0;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }
            @keyframes ecg-pulse-right {
              0% {
                stroke-dashoffset: 540;
              }
              48% {
                stroke-dashoffset: 540;
              }
              96% {
                stroke-dashoffset: 0;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }
            @keyframes logo-heartbeat {
              0%, 44%, 60%, 100% {
                transform: scale(1);
              }
              48% {
                transform: scale(1.18);
              }
              52% {
                transform: scale(1.04);
              }
              56% {
                transform: scale(1.14);
              }
            }
            @keyframes exit-ecg-left {
              0% {
                transform: translateY(-50%) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(-50%) scaleX(1.3) scaleY(0.1);
                opacity: 0;
                filter: blur(4px);
              }
            }
            @keyframes exit-ecg-right {
              0% {
                transform: translateY(-50%) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(-50%) scaleX(1.3) scaleY(0.1);
                opacity: 0;
                filter: blur(4px);
              }
            }
            @keyframes exit-logo {
              0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
              30% {
                transform: translate(-50%, -50%) scale(1.25);
                opacity: 1;
              }
              100% {
                transform: translate(-50%, -50%) scale(0.7);
                opacity: 0;
                filter: blur(4px);
              }
            }
            .animate-ecg-left {
              stroke-dasharray: 45, 500;
              animation: ecg-pulse-left 2s linear infinite;
            }
            .animate-ecg-right {
              stroke-dasharray: 45, 500;
              animation: ecg-pulse-right 2s linear infinite;
            }
            .animate-logo-beat {
              animation: logo-heartbeat 2s ease-in-out infinite;
            }
            .exit-ecg-left-active {
              animation: exit-ecg-left 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            .exit-ecg-right-active {
              animation: exit-ecg-right 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            .exit-logo-active {
              animation: exit-logo 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
          `}</style>

          {/* EKG Content wrapper - fades out smoothly as panels slide apart */}
          <div
            className={`absolute inset-0 transition-opacity duration-150 ease-in-out ${
              backendReady ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* Left EKG Line */}
            <div
              className={`absolute left-0 right-[50%] mr-8 top-1/2 -translate-y-1/2 h-[100px] pointer-events-none select-none ${
                backendReady ? 'exit-ecg-left-active' : ''
              }`}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 500 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="glow-left" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Background trace line */}
                <path
                  d="M 0 50 L 350 50 L 360 50 L 365 55 L 370 40 L 375 80 L 382 10 L 389 90 L 394 50 L 500 50"
                  fill="none"
                  stroke="rgb(24, 83, 164)"
                  strokeOpacity="0.12"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Moving pulse line */}
                <path
                  d="M 0 50 L 350 50 L 360 50 L 365 55 L 370 40 L 375 80 L 382 10 L 389 90 L 394 50 L 500 50"
                  fill="none"
                  stroke="rgb(24, 83, 164)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-left)"
                  className="animate-ecg-left"
                />
              </svg>
            </div>

            {/* Center Box with EKG Logo (Aligned exactly at vertical center of EKG line) */}
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 ${
                backendReady ? 'exit-logo-active' : ''
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 animate-logo-beat">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                {/* Positioned absolutely so it doesn't push the blue box upwards */}
                <p className="absolute top-14 left-1/2 -translate-x-[45%] text-sm text-gray-500 font-medium select-none whitespace-nowrap">
                  Loading...
                </p>
              </div>
            </div>

            {/* Right EKG Line */}
            <div
              className={`absolute right-0 left-[50%] ml-8 top-1/2 -translate-y-1/2 h-[100px] pointer-events-none select-none ${
                backendReady ? 'exit-ecg-right-active' : ''
              }`}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 500 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="glow-right" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Background trace line */}
                <path
                  d="M 0 50 L 106 50 L 111 55 L 116 40 L 121 80 L 128 10 L 135 90 L 140 50 L 500 50"
                  fill="none"
                  stroke="rgb(24, 83, 164)"
                  strokeOpacity="0.12"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Moving pulse line */}
                <path
                  d="M 0 50 L 106 50 L 111 55 L 116 40 L 121 80 L 128 10 L 135 90 L 140 50 L 500 50"
                  fill="none"
                  stroke="rgb(24, 83, 164)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-right)"
                  className="animate-ecg-right"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
