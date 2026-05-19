'use client';

import { useEffect, useState } from 'react';

export default function AnimatedHeroSVG() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1006 651"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Animation Definitions */}
      <defs>
        {/* Gradient for data flow */}
        <linearGradient id="dataFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8C52FF" stopOpacity="0">
            <animate
              attributeName="offset"
              values="-0.5;1.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="25%" stopColor="#8C52FF" stopOpacity="1">
            <animate
              attributeName="offset"
              values="-0.25;1.75"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#5CE1E6" stopOpacity="1">
            <animate
              attributeName="offset"
              values="0;2"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="75%" stopColor="#8C52FF" stopOpacity="1">
            <animate
              attributeName="offset"
              values="0.25;2.25"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#8C52FF" stopOpacity="0">
            <animate
              attributeName="offset"
              values="0.5;2.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* Glow filter for data pulses */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle glow for servers */}
        <filter id="serverGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Wire gradients */}
        <linearGradient id="wireGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2D1B59" />
          <stop offset="50%" stopColor="#8C52FF" />
          <stop offset="100%" stopColor="#2D1B59" />
        </linearGradient>

        <linearGradient id="wireGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1B4D59" />
          <stop offset="50%" stopColor="#5CE1E6" />
          <stop offset="100%" stopColor="#1B4D59" />
        </linearGradient>

        {/* Data packet gradient */}
        <radialGradient id="dataPacket" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#8C52FF" />
          <stop offset="100%" stopColor="#8C52FF" stopOpacity="0" />
        </radialGradient>

        {/* Server gradients with enhanced colors */}
        <linearGradient id="serverGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5CE1E6" />
          <stop offset="100%" stopColor="#3A9CA0" />
        </linearGradient>

        <linearGradient id="serverGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8C52FF" />
          <stop offset="100%" stopColor="#5A35A3" />
        </linearGradient>
      </defs>

      {/* CSS Animations embedded in the SVG */}
      <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                
                @keyframes floatSlow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
                
                @keyframes floatDelayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                
                @keyframes pulseFast {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }
                
                @keyframes dataFlow1 {
                    0% { stroke-dashoffset: 100; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { stroke-dashoffset: -100; opacity: 0; }
                }
                
                @keyframes dataFlow2 {
                    0% { stroke-dashoffset: 80; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { stroke-dashoffset: -80; opacity: 0; }
                }
                
                @keyframes movePacket {
                    0% { offset-distance: 0%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { offset-distance: 100%; opacity: 0; }
                }
                
                @keyframes serverPulse {
                    0%, 100% { filter: brightness(1); }
                    50% { filter: brightness(1.15); }
                }
                
                @keyframes ledBlink {
                    0%, 40%, 60%, 100% { opacity: 1; }
                    45%, 55% { opacity: 0.3; }
                }
                
                @keyframes scaleBreath {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                
                .server-block-1 {
                    animation: float 4s ease-in-out infinite, serverPulse 3s ease-in-out infinite;
                }
                
                .server-block-2 {
                    animation: floatSlow 5s ease-in-out infinite 0.5s, serverPulse 3.5s ease-in-out infinite;
                }
                
                .server-block-3 {
                    animation: floatDelayed 4.5s ease-in-out infinite 1s, serverPulse 4s ease-in-out infinite;
                }
                
                .computer-block {
                    animation: floatSlow 6s ease-in-out infinite, scaleBreath 4s ease-in-out infinite;
                }
                
                .data-wire {
                    stroke-dasharray: 10 15;
                    animation: dataFlow1 2s linear infinite;
                }
                
                .data-wire-2 {
                    stroke-dasharray: 8 12;
                    animation: dataFlow2 1.8s linear infinite 0.3s;
                }
                
                .data-wire-3 {
                    stroke-dasharray: 12 18;
                    animation: dataFlow1 2.2s linear infinite 0.6s;
                }
                
                .led-indicator {
                    animation: ledBlink 1.5s ease-in-out infinite;
                }
                
                .led-indicator-2 {
                    animation: ledBlink 1.2s ease-in-out infinite 0.3s;
                }
                
                .pulse-ring {
                    animation: pulseFast 2s ease-in-out infinite;
                }
            `}</style>

      {/* === NETWORK WIRES / DATA PATHS === */}
      {/* Main connection lines with data flow animation */}

      {/* Wire 1 - Top horizontal connection */}
      <path
        d="M514.334 512.311C506.927 512.311 499.507 510.434 492.777 506.655L472.614 495.336C467.985 492.736 464.972 488.025 464.556 482.732C464.139 477.439 466.377 472.314 470.541 469.022L562.743 396.138L402.183 308.815"
        stroke="url(#wireGradient1)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M514.334 512.311C506.927 512.311 499.507 510.434 492.777 506.655L472.614 495.336C467.985 492.736 464.972 488.025 464.556 482.732C464.139 477.439 466.377 472.314 470.541 469.022L562.743 396.138L402.183 308.815"
        stroke="#8C52FF"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        className="data-wire"
        filter="url(#glow)"
      />

      {/* Wire 2 - Right side vertical connection */}
      <path
        d="M748.773 386.549L693.124 354.593L695.227 350.931L749.857 382.302C758.267 381.896 765.018 374.873 765.018 366.391V186.797H769.241V366.393"
        stroke="url(#wireGradient2)"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M748.773 386.549L693.124 354.593L695.227 350.931L749.857 382.302C758.267 381.896 765.018 374.873 765.018 366.391V186.797H769.241V366.393"
        stroke="#5CE1E6"
        strokeWidth="3"
        fill="none"
        className="data-wire-2"
        filter="url(#glow)"
      />

      {/* Wire 3 - Left side connection */}
      <path
        d="M384.223 460.644L282.653 406.117L284.65 402.398L383.65 455.546L422.999 421.297"
        stroke="url(#wireGradient1)"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M384.223 460.644L282.653 406.117L284.65 402.398L383.65 455.546L422.999 421.297"
        stroke="#8C52FF"
        strokeWidth="3"
        fill="none"
        className="data-wire-3"
        filter="url(#glow)"
      />

      {/* Wire 4 - Bottom long connection */}
      <path
        d="M434.152 607.62C424.453 607.621 414.761 605.149 405.966 600.214L314.164 548.699C297.343 539.26 276.828 539.894 260.621 550.355L233.978 568.921"
        stroke="url(#wireGradient2)"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M434.152 607.62C424.453 607.621 414.761 605.149 405.966 600.214L314.164 548.699C297.343 539.26 276.828 539.894 260.621 550.355L233.978 568.921"
        stroke="#5CE1E6"
        strokeWidth="3"
        fill="none"
        className="data-wire"
        filter="url(#glow)"
      />

      {/* === DATA PACKETS (moving dots along paths) === */}
      {/* These create the visual of data transferring through wires */}

      {/* Data packets floating animation */}
      <g className="pulse-ring">
        <circle cx="550" cy="400" r="4" fill="#8C52FF" filter="url(#glow)">
          <animate
            attributeName="cx"
            values="550;450;350;450;550"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="400;380;400;420;400"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      <g className="pulse-ring">
        <circle cx="700" cy="350" r="3" fill="#5CE1E6" filter="url(#glow)">
          <animate
            attributeName="cy"
            values="350;250;180;250;350"
            dur="3.5s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      <g className="pulse-ring">
        <circle cx="350" cy="450" r="3.5" fill="#8C52FF" filter="url(#glow)">
          <animate
            attributeName="cx"
            values="350;400;450;400;350"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="450;430;450;470;450"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* === SERVER BLOCKS - Right side === */}
      {/* Server Stack Group 1 - Top right servers with floating animation */}
      <g className="server-block-1" style={{ transformOrigin: '860px 220px' }}>
        {/* Server cylinder top */}
        <ellipse
          cx="857"
          cy="190"
          rx="22"
          ry="55"
          fill="url(#serverGrad1)"
          opacity="0.9"
        />
        <ellipse cx="857" cy="218" rx="22" ry="55" fill="url(#serverGrad1)" />

        {/* LED indicators */}
        <circle
          cx="850"
          cy="200"
          r="2"
          fill="#00FF88"
          className="led-indicator"
        />
        <circle
          cx="856"
          cy="200"
          r="2"
          fill="#00FF88"
          className="led-indicator-2"
        />
        <circle
          cx="862"
          cy="200"
          r="2"
          fill="#FFAA00"
          className="led-indicator"
        />
      </g>

      <g className="server-block-2" style={{ transformOrigin: '812px 190px' }}>
        <ellipse
          cx="811"
          cy="163"
          rx="22"
          ry="55"
          fill="url(#serverGrad2)"
          opacity="0.9"
        />
        <ellipse cx="811" cy="191" rx="22" ry="55" fill="url(#serverGrad2)" />

        <circle
          cx="805"
          cy="175"
          r="2"
          fill="#00FF88"
          className="led-indicator-2"
        />
        <circle
          cx="811"
          cy="175"
          r="2"
          fill="#00FF88"
          className="led-indicator"
        />
        <circle
          cx="817"
          cy="175"
          r="2"
          fill="#5CE1E6"
          className="led-indicator-2"
        />
      </g>

      <g className="server-block-3" style={{ transformOrigin: '766px 163px' }}>
        <ellipse
          cx="766"
          cy="136"
          rx="22"
          ry="55"
          fill="url(#serverGrad1)"
          opacity="0.9"
        />
        <ellipse cx="766" cy="163" rx="22" ry="55" fill="url(#serverGrad1)" />

        <circle
          cx="760"
          cy="150"
          r="2"
          fill="#00FF88"
          className="led-indicator"
        />
        <circle
          cx="766"
          cy="150"
          r="2"
          fill="#FFAA00"
          className="led-indicator-2"
        />
        <circle
          cx="772"
          cy="150"
          r="2"
          fill="#00FF88"
          className="led-indicator"
        />
      </g>

      {/* === COMPUTER/MONITOR BLOCKS === */}
      {/* Left Computer Block */}
      <g className="computer-block" style={{ transformOrigin: '470px 245px' }}>
        {/* Computer base shape */}
        <ellipse
          cx="468"
          cy="245"
          rx="52"
          ry="27"
          fill="#DAEEF0"
          opacity="0.95"
        />

        {/* Screen overlay with glow */}
        <ellipse
          cx="468"
          cy="225"
          rx="45"
          ry="22"
          fill="url(#serverGrad2)"
          opacity="0.85"
        >
          <animate
            attributeName="opacity"
            values="0.85;0.95;0.85"
            dur="2s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* Screen content lines (animated) */}
        <rect
          x="440"
          y="218"
          width="30"
          height="2"
          rx="1"
          fill="#FFFFFF"
          opacity="0.6"
        >
          <animate
            attributeName="width"
            values="30;45;30"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </rect>
        <rect
          x="440"
          y="224"
          width="40"
          height="2"
          rx="1"
          fill="#FFFFFF"
          opacity="0.4"
        >
          <animate
            attributeName="width"
            values="40;25;40"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </rect>
        <rect
          x="440"
          y="230"
          width="25"
          height="2"
          rx="1"
          fill="#5CE1E6"
          opacity="0.7"
        >
          <animate
            attributeName="width"
            values="25;35;25"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
      </g>

      {/* Right Computer Block */}
      <g
        className="computer-block"
        style={{ transformOrigin: '407px 290px', animationDelay: '0.5s' }}
      >
        <ellipse
          cx="407"
          cy="290"
          rx="52"
          ry="27"
          fill="#DAEEF0"
          opacity="0.95"
        />

        <ellipse
          cx="407"
          cy="270"
          rx="45"
          ry="22"
          fill="url(#serverGrad2)"
          opacity="0.85"
        >
          <animate
            attributeName="opacity"
            values="0.85;0.95;0.85"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </ellipse>

        <rect
          x="380"
          y="263"
          width="35"
          height="2"
          rx="1"
          fill="#FFFFFF"
          opacity="0.6"
        >
          <animate
            attributeName="width"
            values="35;20;35"
            dur="1.7s"
            repeatCount="indefinite"
          />
        </rect>
        <rect
          x="380"
          y="269"
          width="28"
          height="2"
          rx="1"
          fill="#8C52FF"
          opacity="0.7"
        >
          <animate
            attributeName="width"
            values="28;40;28"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </rect>
        <rect
          x="380"
          y="275"
          width="32"
          height="2"
          rx="1"
          fill="#FFFFFF"
          opacity="0.4"
        >
          <animate
            attributeName="width"
            values="32;42;32"
            dur="1.9s"
            repeatCount="indefinite"
          />
        </rect>
      </g>

      {/* === ISOMETRIC PLATFORM SHAPES === */}
      {/* Platform 1 */}
      <g
        className="server-block-1"
        style={{ transformOrigin: '639px 526px', animationDelay: '0.2s' }}
      >
        <path
          d="M639.627 526.591L532.236 464.589L608.76 420.408L716.151 482.41L639.627 526.591Z"
          fill="url(#serverGrad1)"
          opacity="0.9"
        />
      </g>

      {/* Platform 2 */}
      <g
        className="server-block-2"
        style={{ transformOrigin: '721px 464px', animationDelay: '0.4s' }}
      >
        <path
          d="M721.627 464.591L614.236 402.589L690.76 358.408L798.151 420.41L721.627 464.591Z"
          fill="url(#serverGrad2)"
          opacity="0.9"
        />
      </g>

      {/* Platform 3 */}
      <g
        className="server-block-3"
        style={{ transformOrigin: '827px 527px', animationDelay: '0.6s' }}
      >
        <path
          d="M827.627 527.591L720.236 465.589L796.76 421.408L904.151 483.41L827.627 527.591Z"
          fill="url(#serverGrad1)"
          opacity="0.9"
        />
      </g>

      {/* Additional isometric platforms */}
      <g className="computer-block" style={{ transformOrigin: '427px 635px' }}>
        <path
          d="M427.782 635.485L349.577 588.744L401.27 556.892L481.693 605.04L427.782 635.485Z"
          fill="url(#serverGrad2)"
          opacity="0.85"
        />
      </g>

      <g className="server-block-2" style={{ transformOrigin: '462px 416px' }}>
        <path
          d="M462.782 416.484L384.577 369.744L436.27 337.892L516.693 386.04L462.782 416.484Z"
          fill="url(#serverGrad1)"
          opacity="0.85"
        />
      </g>

      <g className="server-block-1" style={{ transformOrigin: '514px 305px' }}>
        <path
          d="M514.782 305.484L436.577 258.744L488.27 226.892L568.693 275.04L514.782 305.484Z"
          fill="url(#serverGrad2)"
          opacity="0.85"
        />
      </g>

      {/* === DOCUMENT/WINDOW BLOCK with realistic animation === */}
      {/* Main document panel */}
      <g className="computer-block" style={{ transformOrigin: '310px 480px' }}>
        {/* Base panel */}
        <path
          d="M291.608 552.921L171.001 482.799C166.696 480.12 167.322 480.067 167.322 474.381L251.535 427.045C254.223 425.493 257.535 425.493 260.223 427.045C260.223 427.045 388.715 496.42 388.715 499.295C388.715 504.42 388.718 505.015 385.647 506.608L306.105 552.89C301.629 555.5 296.096 555.512 291.608 552.921Z"
          fill="#D5DBF2"
          opacity="0.95"
        />

        {/* Top panel (header) */}
        <path
          d="M291.49 548.423L168.976 477.683C166.664 476.348 166.664 473.012 168.976 471.677L252.735 423.449C255.424 421.897 256.501 422.189 259.189 423.742L387.577 497.854C389.356 498.882 388.923 500.147 387.149 501.183L305.986 548.392C301.511 551.002 295.978 551.014 291.49 548.423Z"
          fill="white"
          opacity="0.98"
        />

        {/* Progress bars / content lines with animation */}
        <g opacity="0.9">
          {/* Row 1 */}
          <rect x="250" y="433" width="6" height="5" rx="1" fill="#8C52FF">
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </rect>
          <rect x="259" y="433" width="6" height="5" rx="1" fill="#8C52FF">
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </rect>
          <rect x="268" y="433" width="6" height="5" rx="1" fill="#8C52FF">
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </rect>

          {/* Additional content dots */}
          <rect x="277" y="438" width="6" height="5" rx="1" fill="#8C52FF">
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </rect>
          <rect x="286" y="443" width="6" height="5" rx="1" fill="#8C52FF">
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="1.4s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
      </g>

      {/* === ADDITIONAL VISUAL ELEMENTS === */}

      {/* Floating particles */}
      <g filter="url(#glow)">
        <circle r="3" fill="#8C52FF">
          <animate
            attributeName="cx"
            values="200;250;300;250;200"
            dur="8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="300;280;300;320;300"
            dur="8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0.8;0.3"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r="2" fill="#5CE1E6">
          <animate
            attributeName="cx"
            values="600;650;700;650;600"
            dur="7s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="500;480;500;520;500"
            dur="7s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.4;0.9;0.4"
            dur="3.5s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r="2.5" fill="#8C52FF">
          <animate
            attributeName="cx"
            values="800;820;840;820;800"
            dur="6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="400;390;400;410;400"
            dur="6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Connection pulse rings */}
      <g opacity="0.5">
        <circle
          cx="468"
          cy="245"
          r="60"
          stroke="#8C52FF"
          strokeWidth="1"
          fill="none"
        >
          <animate
            attributeName="r"
            values="60;80;60"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.1;0.5"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx="407"
          cy="290"
          r="55"
          stroke="#5CE1E6"
          strokeWidth="1"
          fill="none"
        >
          <animate
            attributeName="r"
            values="55;75;55"
            dur="3.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.1;0.5"
            dur="3.5s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Small detail elements that give life */}
      <g className="pulse-ring">
        <rect
          x="850"
          y="310"
          width="15"
          height="3"
          rx="1.5"
          fill="#8C52FF"
          opacity="0.7"
        />
        <rect
          x="845"
          y="315"
          width="20"
          height="3"
          rx="1.5"
          fill="#5CE1E6"
          opacity="0.5"
        />
      </g>

      {/* Bottom decorative platforms */}
      <g className="server-block-3" style={{ transformOrigin: '145px 631px' }}>
        <path
          d="M145.403 631.453L63.8525 586.309L159.143 531.294L240.693 576.437L145.403 631.453Z"
          fill="url(#serverGrad1)"
          opacity="0.8"
        />
      </g>

      <g className="server-block-1" style={{ transformOrigin: '921px 650px' }}>
        <path
          d="M921.633 650.929L811.677 587.446L896.036 535.133L1005.99 598.617L921.633 650.929Z"
          fill="url(#serverGrad2)"
          opacity="0.8"
        />
      </g>

      {/* Final data flow accent lines */}
      <line
        x1="150"
        y1="550"
        x2="250"
        y2="500"
        stroke="#8C52FF"
        strokeWidth="2"
        opacity="0.3"
        className="data-wire"
      />
      <line
        x1="850"
        y1="550"
        x2="950"
        y2="600"
        stroke="#5CE1E6"
        strokeWidth="2"
        opacity="0.3"
        className="data-wire-2"
      />
    </svg>
  );
}
