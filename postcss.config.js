// File: postcss.config.js
/**
 * ⚡ COMP-OS — VISUAL PROCESSING CONTRACT
 * =============================================================================
 * FILE          : postcss.config.js
 * RESPONSIBILITY: AST Transformation & CSS Compilation Pipeline
 * OWNERSHIP     : Frontend Core / DevOps
 * DOMAIN        : Infrastructure
 * LAYER         : Build System (L0)
 * RISK LEVEL    : HIGH (Governs Global CSS Integrity)
 * =============================================================================
 *
 * RELEASE METADATA
 * -----------------------------------------------------------------------------
 * VERSION       : v1.0.0 (ELITE-PIPELINE-STABLE)
 * REVISION ID   : INFRA-CSS-001
 * RELEASE TAG   : PRODUCTION-PIPELINE-GOLD
 * LAST UPDATE   : 2026-02-20
 * STATUS        : ENFORCED
 *
 * FEATURES:
 * - Deterministic Import: Resolves dependency trees via 'postcss-import'.
 * - Nesting Isolation: Decouples Tailwind nesting from standard CSS rules.
 * - Preset-Env Polyfilling: Enables modern spec usage with stage-3 safety.
 * - Hardware Prefixing: Automated vendor injection via Autoprefixer.
 * - Critical Safeguards: Disables identifier reduction to protect animations.
 *
 * =============================================================================
 * INTENT & RESPONSIBILITY
 * -----------------------------------------------------------------------------
 * This configuration defines the post-processing logic for the visual engine. 
 * It acts as the "Babel for CSS," translating modern syntax and Tailwind 
 * directives into optimized, cross-browser compatible artifacts.
 *
 * CONTRACT:
 * 1. PROTECT: Z-index and Keyframe identifiers must remain immutable.
 * 2. OPTIMIZE: Production builds must use cssnano with safe-mode enabled.
 * 3. COMPATIBILITY: Browser prefixes must align with the global Browserslist.
 *
 * CHANGELOG:
 * - v1.0.0: Initial stable release. Implemented strict keyframe preservation 
 * to support complex HUD glitch and scanline animations.
 *
 * =============================================================================
 * DEPENDENCY GRAPH
 * -----------------------------------------------------------------------------
 * Core:
 * - tailwindcss (Utility Generation)
 * - autoprefixer (Compatibility Layer)
 * * Optimization:
 * - cssnano (Minification Engine)
 * - postcss-preset-env (Future Spec Support)
 *
 * =============================================================================
 * * ARCHITECTURE:
 * 1. PRESERVATION MANDATE: Standard minifiers often mangle @keyframes names to 
 * save bytes. This config explicitly disables `reduceIdents` to ensure 
 * cinematic animations linked via Tailwind strings do not break.
 * 2. STACKING INTEGRITY: `zindex` optimization is disabled to prevent PostCSS 
 * from re-calculating the strictly defined HUD layer hierarchy.
 * * =============================================================================
 */

export default {
  plugins: {
    // 🔗 1. IMPORT GOVERNANCE
    // Allows @import in CSS. Must run first to resolve dependency trees.
    'postcss-import': {},

    // 🏗️ 2. NESTING SUPPORT
    // Essential for component encapsulation and clean CSS architecture.
    'tailwindcss/nesting': 'postcss-nesting',
    
    // 🌊 3. TAILWIND CORE
    // Generates the utility classes based on the tailwind.config.js definitions.
    tailwindcss: {},

    // 🔮 4. MODERN CSS POLYFILLS
    // Translates modern specs to target browser baselines.
    'postcss-preset-env': {
      stage: 3, 
      features: {
        // 🛡️ CRITICAL: Disabled to prevent AST collision with tailwindcss/nesting
        'nesting-rules': false, 
        'custom-media-queries': true,
      },
    },

    // 🛡️ 5. BROWSER COMPATIBILITY
    // Automatically injects vendor prefixes (-webkit-, -moz-) based on Browserslist.
    autoprefixer: {},

    // ⚡ 6. INDUSTRIAL MINIFICATION (Production Only)
    // Strips whitespace and optimizes output for Edge delivery.
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: [
          'default',
          {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            discardDuplicates: true,
            
            // 🛡️ CRITICAL SAFEGUARDS 🛡️
            // These optimizations are explicitly DISABLED to prevent visual corruption.
            
            // PRESERVES KEYFRAMES: Essential for 'animate-glitch', 'animate-scanline'
            reduceIdents: false, 
            
            // PRESERVES STACKING: Essential for strict HUD Z-index architecture
            zindex: false, 
          },
        ],
      },
    } : {}),
  },
}
