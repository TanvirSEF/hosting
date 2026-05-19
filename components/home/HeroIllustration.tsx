'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

export default function HeroIllustration() {
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState('.online');
  const cycleCount = useRef(0);

  const searchText = 'yourcompanyname';
  const extensions = ['.online', '.com', '.io', '.net', '.org'];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Typing animation
  useEffect(() => {
    if (!mounted) return;

    let index = 0;
    let timeoutId: NodeJS.Timeout;

    const typeNextChar = () => {
      if (index <= searchText.length) {
        setTypedText(searchText.slice(0, index));
        index++;
        timeoutId = setTimeout(typeNextChar, 100);
      } else {
        // After typing is done, show dropdown briefly
        timeoutId = setTimeout(() => {
          setIsDropdownOpen(true);
          timeoutId = setTimeout(() => {
            setIsDropdownOpen(false);
            // Reset and start again after a delay
            timeoutId = setTimeout(() => {
              setTypedText('');
              index = 0;
              cycleCount.current = (cycleCount.current + 1) % extensions.length;
              setSelectedExtension(extensions[cycleCount.current]);
              typeNextChar();
            }, 1500);
          }, 2000);
        }, 500);
      }
    };

    typeNextChar();

    return () => clearTimeout(timeoutId);
  }, [mounted]);

  return (
    <div className="relative h-full w-full">
      {/* Main Hero SVG Illustration */}
      <div
        className={`h-full w-full transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        <Image
          src="https://pub-36186a09bf9045098760abadf24720aa.r2.dev/public/images/home/hero-illustration.svg"
          alt="Hero Illustration"
          width={1006}
          height={651}
          className="h-auto w-full"
          priority
        />
      </div>

      {/* Animated Search Box Overlay */}
      <div
        className={`absolute top-[8%] right-[12%] left-[12%] transition-all duration-500 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
        style={{ maxWidth: '420px' }}
      >
        {/* Search box container */}
        <div className="relative overflow-visible rounded-full border border-white/20 bg-white/95 shadow-2xl shadow-purple-500/20 backdrop-blur-md">
          <div className="flex items-center px-4 py-3">
            {/* Search icon */}
            <svg
              className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Typing text area */}
            <div className="flex min-w-0 flex-1 items-center">
              <span className="truncate text-sm font-medium tracking-wide text-gray-700">
                {typedText}
                <span className="animate-pulse text-[#8C52FF]">|</span>
              </span>
            </div>

            {/* Domain dropdown */}
            <div className="relative ml-2 flex-shrink-0">
              <div className="flex cursor-default items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                <span>{selectedExtension}</span>
                <svg
                  className={`h-3 w-3 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Dropdown menu */}
              <div
                className={`absolute top-full right-0 z-10 mt-2 w-24 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl transition-all duration-300 ${isDropdownOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'}`}
              >
                {extensions.map((ext) => (
                  <div
                    key={ext}
                    className={`cursor-default px-3 py-2 text-xs transition-colors ${ext === selectedExtension ? 'bg-purple-100 font-medium text-[#8C52FF]' : 'text-gray-600 hover:bg-purple-50'}`}
                  >
                    {ext}
                  </div>
                ))}
              </div>
            </div>

            {/* Search button */}
            <button className="ml-3 flex-shrink-0 cursor-default rounded-full bg-gradient-to-r from-[#8C52FF] to-[#7B42FF] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/30">
              Search
            </button>
          </div>
        </div>

        {/* Decorative glow behind search box */}
        <div
          className="absolute -inset-4 -z-10 animate-pulse rounded-full bg-gradient-to-r from-[#8C52FF]/20 to-[#5CE1E6]/20 blur-xl"
          style={{ animationDuration: '3s' }}
        />
      </div>

      {/* Floating decorative dots */}
      <div
        className="absolute top-[20%] right-[10%] h-3 w-3 animate-ping rounded-full bg-[#5CE1E6]"
        style={{ animationDuration: '2s' }}
      />
      <div
        className="absolute top-[40%] right-[5%] h-2 w-2 animate-ping rounded-full bg-[#8C52FF]"
        style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
      />
      <div
        className="absolute bottom-[30%] left-[5%] h-2.5 w-2.5 animate-ping rounded-full bg-[#5CE1E6]"
        style={{ animationDuration: '3s', animationDelay: '1s' }}
      />
    </div>
  );
}
