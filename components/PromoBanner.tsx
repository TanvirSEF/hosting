'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/routing';
import { X, Zap, Tag } from 'lucide-react';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Use ResizeObserver for more accurate height syncing
  useEffect(() => {
    if (!bannerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = isVisible ? entry.target.clientHeight : 0;
        document.documentElement.style.setProperty('--banner-height', `${h}px`);
      }
    });

    observer.observe(bannerRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Force immediate height update
    document.documentElement.style.setProperty('--banner-height', '0px');
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('Webblymagic10%').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={bannerRef}
        className="promo-banner fixed top-0 right-0 left-0 z-[70] w-full"
      >
        <div className="promo-shimmer" aria-hidden="true" />

        <div className="relative flex items-center justify-center gap-2 px-3 py-2.5 text-center sm:gap-4 sm:px-10 sm:py-3.5">
          {/* Badge (Desktop only) */}
          <div className="promo-badge hidden items-center gap-1.5 rounded-full px-2.5 py-1 lg:flex">
            <Zap className="h-3 w-3 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Special</span>
          </div>

          {/* Headline */}
          <p className="whitespace-nowrap text-[12px] font-bold text-white sm:text-sm md:text-base">
            <span className="text-yellow-300">10% OFF</span>{' '}
            Hosting Services
          </p>

          <span className="h-3 w-px bg-white/30" aria-hidden="true" />

          {/* Code pill */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="promo-code-chip group relative"
            >
              <span className="font-mono text-[11px] font-bold tracking-wider sm:text-xs">Webblymagic10%</span>
              <span className={`promo-copy-hint ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {copied ? '✓' : 'Copy'}
              </span>
            </button>
          </div>

          <Link
            href="/order/hosting?plan=1"
            className="promo-cta-btn text-[11px] font-black sm:text-xs"
          >
            Claim Now
          </Link>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white sm:right-4"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>

        <style>{`
          :root { --banner-height: 0px; }

          .promo-banner {
            background: linear-gradient(90deg, #6d28d9 0%, #8b5cf6 30%, #a855f7 60%, #7c3aed 100%);
            background-size: 200% 100%;
            animation: promoBgShift 6s ease infinite;
          }

          @keyframes promoBgShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .promo-shimmer {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              105deg,
              transparent 30%,
              rgba(255, 255, 255, 0.08) 50%,
              transparent 70%
            );
            background-size: 200% 100%;
            animation: shimmer 3s linear infinite;
            pointer-events: none;
          }

          @keyframes shimmer {
            from { background-position: -200% 0; }
            to   { background-position:  200% 0; }
          }

          .promo-badge {
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.25);
            color: white;
            backdrop-filter: blur(4px);
            animation: promoPulse 2.5s ease-in-out infinite;
          }

          @keyframes promoPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
            50%       { box-shadow: 0 0 0 4px rgba(255,255,255,0); }
          }

          .promo-code-chip {
            position: relative;
            display: inline-flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.15);
            border: 1px dashed rgba(255, 255, 255, 0.4);
            border-radius: 4px;
            padding: 1px 6px;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
          }

          .promo-code-chip:hover { 
            background: rgba(255, 255, 255, 0.25);
            border-style: solid;
          }

          .promo-copy-hint {
            position: absolute;
            bottom: calc(100% + 4px);
            left: 50%;
            transform: translateX(-50%);
            background: #000;
            color: #fff;
            font-size: 8px;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 2px;
            pointer-events: none;
            transition: opacity 0.2s;
            z-index: 100;
          }

          .promo-cta-btn {
            display: inline-flex;
            align-items: center;
            padding: 3px 8px;
            border-radius: 4px;
            background: #facc15;
            color: #4c1d95;
            white-space: nowrap;
            transition: all 0.2s;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          }

          .promo-cta-btn:hover {
            background: white;
            transform: translateY(-1px);
          }
        `}</style>
      </div>

      <div 
        style={{ height: 'var(--banner-height, 0px)' }} 
        aria-hidden="true" 
      />
    </>
  );
}
