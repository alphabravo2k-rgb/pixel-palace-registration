// File: tailwind.config.js
/**
 * ⚡ COMP-OS — VISUAL ENGINE CONTRACT
 * =============================================================================
 * FILE          : tailwind.config.js
 * RESPONSIBILITY: Global Style Dictionary & Design Token Governance
 * OWNERSHIP     : Frontend Core / UX Design
 * DOMAIN        : Visuals & Theming
 * LAYER         : Infrastructure (L0)
 * RISK LEVEL    : CRITICAL (Foundation for Global Brand Identity)
 * =============================================================================
 *
 * RELEASE METADATA
 * -----------------------------------------------------------------------------
 * VERSION       : v1.0.0 (NEXUS-ARCHITECT-STABLE)
 * REVISION ID   : INFRA-TW-001
 * RELEASE TAG   : PRODUCTION-VISUAL-GOLD
 * LAST UPDATE   : 2026-02-20
 * STATUS        : ENFORCED
 *
 * ARCHITECTURAL MANDATES:
 * 1. GPU ACCELERATION: Enforces 3D transforms (`translate3d`) for 60FPS UI.
 * 2. SOVEREIGN ASSETS: Inlines critical textures (Noise) to avoid network latency.
 * 3. DYNAMIC SAFELISTING: Prevents purge of database-driven status/role classes.
 * 4. RESPONSIVE SCALE: Supports displays from "Watch" (xs) to "Ultra" (4k).
 *
 * =============================================================================
 * INTENT & RESPONSIBILITY
 * -----------------------------------------------------------------------------
 * This is the authoritative source for all "Visual Logic." It defines the 
 * physics of animations, the semantic meaning of colors, and the fluid
 * constraints of typography across all system modules.
 *
 * CONTRACT:
 * 1. PERSISTENCE: Dynamic classes for Status/Roles MUST be safelisted.
 * 2. FLUIDITY: Typography must use `clamp()` for consistent multi-device scale.
 * 3. PERFORMANCE: Heavy visual utilities (Blurs/Gradients) must use L0 plugins.
 *
 * CHANGELOG:
 * - v1.0.0: Initial stable release. Implemented fluid spacing engine and 
 * high-fidelity HUD typography presets.
 *
 * =============================================================================
 * DEPENDENCY GRAPH
 * -----------------------------------------------------------------------------
 * Plugins:
 * - @tailwindcss/typography (Editorial Content)
 * - tailwind-scrollbar (Global UI feel)
 * - tailwindcss-animate (Transition physics)
 * * Fonts:
 * - Teko/Impact (Display)
 * - Rajdhani/Eurostile (HUD/Technical)
 *
 * =============================================================================
 * * ARCHITECTURE:
 * 1. CINEMATIC GLASS: Implements a dual-layer backdrop-blur strategy for 
 * tactical panels and high-density information HUDs.
 * 2. MASKING ENGINE: Provides hardware-accelerated linear gradients for 
 * list-fading and overflow masking without layout shifts.
 * * =============================================================================
 */

const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

const VISUAL_ENGINE_VERSION = '"v7.4.0-NEXUS-OMNI"';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  /**
   * 🛡️ OPTIMIZED SAFELIST AUTHORITY
   * - Crucial for dynamic, database-driven class injection.
   * - Explicitly allows 'before/after' variants for complex HUD indicators.
   */
  safelist: [
    {
      pattern: /(bg|text|border|ring|stroke|fill|shadow)-(status|brand|role)-(win|loss|draw|active|glow|dim|highlight|dispute|live|elo|offline|master|ceo|director|tech|head|senior|integrity|admin|organizer|referee|caster|streamer|captain|player|guest)/,
      variants: ['hover', 'group-hover', 'data-[state=active]', 'before', 'after'], 
    },
    {
      pattern: /(stroke|fill)-(status)-(win|loss|draw|active)/, 
    },
    // Cinematic & HUD Criticals
    'animate-glitch',
    'animate-scanline',
    'animate-enter',
    'perspective-1000',
    'backface-hidden',
    'rotate-y-12',
  ],

  theme: {
    // 🛡️ DEVICE CONTRACT: From Watch to Wall
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
      '3xl': '1920px', 
      '4xl': '2560px', 
      'ultra': '3840px', 
    },

    extend: {
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
        '20': 'repeat(20, minmax(0, 1fr))',
        '24': 'repeat(24, minmax(0, 1fr))', 
      },

      fontSize: {
        'fluid-xs': 'clamp(0.7rem, 0.6vw + 0.5rem, 0.8rem)',
        'fluid-base': 'clamp(0.9rem, 0.8vw + 0.7rem, 1.1rem)',
        'fluid-xl': 'clamp(1.25rem, 2vw + 1rem, 2.5rem)',
        'fluid-7xl': 'clamp(3rem, 8vw + 1rem, 8rem)',
        'hud-xs': ['0.65rem', { lineHeight: '1', letterSpacing: '0.05em' }],
        'hud-sm': ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.05em' }],
      },

      spacing: {
        'fluid-sm': 'clamp(0.5rem, 1vw, 1rem)',
        'fluid-md': 'clamp(1rem, 2vw, 2rem)',
        'fluid-lg': 'clamp(2rem, 4vw, 4rem)',
        'header': '4rem', 
      },

      colors: {
        bg: {
          DEFAULT: '#020202',
          panel: '#09090b',  
          surface: '#121214',
          elevated: '#18181b', 
          overlay: 'rgba(2, 2, 2, 0.85)',
          glass: 'rgba(9, 9, 11, 0.6)',
        },

        brand: {
          DEFAULT: 'rgb(var(--brand-rgb, 111 45 189) / <alpha-value>)',
          dim: 'rgb(var(--brand-dim-rgb, 88 28 135) / <alpha-value>)',
          glow: 'rgb(var(--brand-glow-rgb, 168 85 247) / <alpha-value>)',
          accent: '#c026d3', 
        },

        tactical: {
          DEFAULT: '#27272a',
          active: '#3f3f46',  
          highlight: '#52525b', 
          muted: '#71717a',   
          faint: '#a1a1aa',   
        },

        status: {
          win: '#87db20',    
          loss: '#ef4444',   
          draw: '#eab308',   
          active: '#3b82f6', 
          dispute: '#f97316',
          live: '#ff0044',   
          elo: '#6366f1',    
          offline: '#3f3f46',
        },

        role: {
          master: '#eab308',
          ceo: '#facc15',
          director: '#fbbf24',
          tech: '#22d3ee',
          head: '#ef4444',
          senior: '#f87171',
          integrity: '#a855f7',
          admin: '#fca5a5',
          organizer: '#60a5fa',
          referee: '#fb923c',
          caster: '#ec4899',
          streamer: '#c084fc',
          captain: '#4ade80',
          player: '#d1d5db',
          guest: '#71717a',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        display: ['Teko', 'Impact', 'sans-serif'],
        hud: ['Rajdhani', 'Eurostile', 'sans-serif'],
      },

      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100', 
        max: '9999', 
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
        'vignette': 'radial-gradient(circle at center, transparent 0%, rgba(2,2,2,0.8) 100%)',
        // 🛡️ NOISE CDN ELIMINATION: SVG embedded directly to guarantee instant LCP & zero CORS issues
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },

      boxShadow: {
        neon: '0 0 20px -5px rgb(var(--brand-rgb, 111 45 189) / 0.5)',
        'neon-strong': '0 0 40px -10px rgb(var(--brand-rgb, 111 45 189) / 0.8)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'glass-inset': 'inset 0 0 20px rgba(255,255,255,0.02)',
        'hud-border': '0 0 0 1px rgba(255,255,255,0.1)',
        'neon-purple': '0 0 25px -5px rgba(111, 45, 189, 0.6)',
        'neon-lime': '0 0 25px -5px rgba(135, 219, 32, 0.5)',
      },

      transitionTimingFunction: {
        'cinematic': 'cubic-bezier(0.4, 0, 0.2, 1)', 
        'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
        'expo': 'cubic-bezier(0.19, 1, 0.22, 1)', 
      },

      animation: {
        breathe: 'breathe 4s cubic-bezier(0.4,0,0.6,1) infinite',
        glitch: 'glitch 0.4s cubic-bezier(.25,.46,.45,.94) infinite',
        scanline: 'scanline 8s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        enter: 'enter 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'spin-slow': 'spin 12s linear infinite',
      },

      // 🛡️ GPU ACCELERATION: Enforcing `translate3d` over standard translate
      keyframes: {
        breathe: {
          '0%,100%': { transform: 'scale(1) translateZ(0)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.005) translateZ(0)', filter: 'brightness(1.15)' },
        },
        glitch: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '20%': { transform: 'translate3d(-2px, 2px, 0)' },
          '40%': { transform: 'translate3d(-2px, -2px, 0)' },
          '60%': { transform: 'translate3d(2px, 2px, 0)' },
          '80%': { transform: 'translate3d(2px, -2px, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        float: {
          '0%,100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -6px, 0)' },
        },
        scanline: {
          '0%': { transform: 'translate3d(0, -100%, 0)', opacity: '0.05' },
          '100%': { transform: 'translate3d(0, 100%, 0)', opacity: '0.05' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        enter: {
          '0%': { opacity: '0', transform: 'scale(0.95) translate3d(0, 10px, 0)' },
          '100%': { opacity: '1', transform: 'scale(1) translate3d(0, 0, 0)' },
        },
      },

      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.tactical.muted'),
            '--tw-prose-headings': theme('colors.white'),
            '--tw-prose-links': theme('colors.brand.glow'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-code': theme('colors.brand.accent'),
            '--tw-prose-pre-bg': theme('colors.bg.surface'),
            '--tw-prose-quote-borders': theme('colors.brand.DEFAULT'),
          },
        },
      }),
    },
  },

  plugins: [
    require('tailwind-scrollbar')({ nocompatible: false }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    require('tailwindcss-animate'),

    /**
     * 🕵️ VISUAL GOVERNANCE & CINEMATIC UTILITIES
     */
    plugin(function ({ addBase, addUtilities, theme }) {
      addBase({
        ':root': {
          '--visual-engine-version': VISUAL_ENGINE_VERSION,
          '--color-bg-app': theme('colors.bg.DEFAULT'),
        },
        '::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '::-webkit-scrollbar-track': {
          background: theme('colors.bg.DEFAULT'),
        },
        '::-webkit-scrollbar-thumb': {
          background: theme('colors.tactical.active'),
          borderRadius: '3px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: theme('colors.tactical.highlight'),
        },
      });

      addUtilities({
        // 🔮 CINEMATIC GLASS
        '.glass-panel': {
          background: 'rgba(9, 9, 11, 0.7)',
          'backdrop-filter': 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
        '.glass-hard': {
          background: 'rgba(5, 5, 5, 0.85)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
        
        // 🌚 MASKING ENGINE
        '.mask-fade-b': {
          'mask-image': 'linear-gradient(to bottom, black 80%, transparent 100%)',
          '-webkit-mask-image': 'linear-gradient(to bottom, black 80%, transparent 100%)',
        },
        '.mask-fade-x': {
          'mask-image': 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          '-webkit-mask-image': 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        },

        // 📐 PERSPECTIVE ORIGINS (Dynamic 3D)
        '.origin-center-top': { 'perspective-origin': '50% 0%' },
        '.origin-center-bottom': { 'perspective-origin': '50% 100%' },

        // 💡 FX UTILITIES
        '.text-glow': {
          'text-shadow': '0 0 12px rgb(var(--brand-glow-rgb,168 85 247)/0.6)',
        },
        '.text-neon': {
           'text-shadow': '0 0 10px rgb(var(--brand-glow-rgb,168 85 247)/0.8)',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
          '-webkit-backface-visibility': 'hidden',
        },
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.content-auto': {
          'content-visibility': 'auto',
        },
        '.clip-path-slant': {
           'clip-path': 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)',
        },
      });
    }),
  ],
};
