// File: .eslintrc.cjs
/**
 * ⚡ COMP-OS — CODE INTEGRITY CONTRACT
 * =============================================================================
 * FILE          : .eslintrc.cjs
 * RESPONSIBILITY: Static Analysis Governance & Architectural Enforcement
 * OWNERSHIP     : DevOps Core / Security
 * DOMAIN        : Infrastructure
 * LAYER         : Development Pipeline (L0)
 * RISK LEVEL    : HIGH (Enforces Code Quality, Security, and Performance)
 * =============================================================================
 *
 * RELEASE METADATA
 * -----------------------------------------------------------------------------
 * VERSION       : v1.0.0 (ELITE-ENFORCER-STABLE)
 * REVISION ID   : INFRA-LINT-001
 * RELEASE TAG   : PRODUCTION-QUALITY-GOLD
 * LAST UPDATE   : 2026-02-21
 * STATUS        : ENFORCED
 *
 * ARCHITECTURAL MANDATES:
 * 1. INJECTION DEFENSE: Mandatory blocking of `eval`, `implied-eval`, and `new Function`.
 * 2. ARCHITECTURE LOCKS: Prohibits direct Supabase imports in UI modules to force Service patterns.
 * 3. RENDER PHYSICS: Prevents React performance leaks (Constructed context values, unsafe binds).
 * 4. 3D COMPATIBILITY: Whitelists specific WebGL/Render-loop variables for Three.js integration.
 * 5. WCAG COMPLIANCE: Escalates critical accessibility omissions to fatal build errors.
 *
 * =============================================================================
 * INTENT & RESPONSIBILITY
 * -----------------------------------------------------------------------------
 * This configuration defines the "Nexus Standard." It ensures that every line 
 * of code committed to the repository adheres to our security posture and 
 * architectural integrity.
 *
 * CONTRACT:
 * 1. CLEANLINESS: Automated import sorting is enforced to prevent merge conflicts.
 * 2. BOUNDARIES: Internal security modules are air-gapped via restricted imports.
 * 3. STABILITY: Only specific structured logging is permitted for Telemetry sync.
 *
 * CHANGELOG:
 * - v1.0.0: Initial stable release. Implemented strict UI-to-Service boundary 
 * enforcements and high-fidelity React performance rules.
 *
 * =============================================================================
 * * ARCHITECTURE:
 * 1. SERVICE DECOUPLING: UI components are restricted from importing the 
 * Supabase client. This forces a clean separation of concerns where data 
 * logic resides in Hooks or Services.
 * 2. TELEMETRY SAFE: Standard `console.log` is blocked to prevent PII leaks in 
 * production, while structured `warn/error/info` methods remain open for audit.
 * * =============================================================================
 */

module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true 
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended', 
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'bundle-stats.html', 'dist_stats.html'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { 
    react: { version: '18.2' } 
  },
  plugins: ['react-refresh', 'simple-import-sort', 'jsx-a11y'],
  rules: {
    // -------------------------------------------------------------------------
    // 1. 🚀 HMR & VITE STABILITY
    // -------------------------------------------------------------------------
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    
    // -------------------------------------------------------------------------
    // 2. 🧹 AUTOMATED CLEANLINESS (THE NEXUS STANDARD)
    // -------------------------------------------------------------------------
    'simple-import-sort/imports': 'error', 
    'simple-import-sort/exports': 'error',
    'no-duplicate-imports': 'error',
    
    // -------------------------------------------------------------------------
    // 3. 🧠 CODE HYGIENE (FATAL ERRORS)
    // -------------------------------------------------------------------------
    'no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_', 
      'varsIgnorePattern': '^(React|gl|state|t|_)$', // 🛡️ Allows Render Loop vars
      'caughtErrorsIgnorePattern': '^_' 
    }],
    'no-console': ['error', { 
        allow: ['warn', 'error', 'info', 'table', 'groupCollapsed', 'groupEnd', 'debug'] 
    }],
    'no-debugger': 'error',
    'no-constant-condition': 'warn',

    // -------------------------------------------------------------------------
    // 4. 🛡️ ARCHITECTURAL BOUNDARIES
    // -------------------------------------------------------------------------
    'no-restricted-imports': ['error', {
      'patterns': [
        {
          'group': ['**/src/lib/security/*', '!**/src/lib/security/index.js'],
          'message': '⛔ ARCHITECTURE VIOLATION: Accessing security internals directly is forbidden. Use the public @security facade.'
        }
      ]
    }],

    // -------------------------------------------------------------------------
    // 5. ⚛️ REACT ARCHITECTURE & PERFORMANCE
    // -------------------------------------------------------------------------
    'react/prop-types': 'off', 
    'react/no-unescaped-entities': 'off',
    'react/function-component-definition': ['warn', { 'namedComponents': 'arrow-function' }],
    'react/self-closing-comp': ['warn', { 'component': true, 'html': true }],
    'react/jsx-pascal-case': 'warn',
    
    // ⚡ PERFORMANCE
    'react/jsx-no-bind': ['warn', { allowArrowFunctions: true, allowBind: false }], 
    'react/jsx-no-constructed-context-values': 'warn', 
    
    // -------------------------------------------------------------------------
    // 6. 🏗️ JSX PERFECTION
    // -------------------------------------------------------------------------
    'react/jsx-no-useless-fragment': 'warn',
    'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
    'react/jsx-boolean-value': ['warn', 'never'],
    
    // -------------------------------------------------------------------------
    // 7. 🛡️ SECURITY & STABILITY
    // -------------------------------------------------------------------------
    'react/jsx-no-target-blank': 'error', 
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-eval': 'error',            
    'no-implied-eval': 'error',    
    'no-new-func': 'error',        
    
    // -------------------------------------------------------------------------
    // 8. ♿ ACCESSIBILITY (WCAG COMPLIANCE)
    // -------------------------------------------------------------------------
    'jsx-a11y/alt-text': 'error', 
    'jsx-a11y/anchor-has-content': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn', 
    'jsx-a11y/no-static-element-interactions': 'warn', 
  },

  overrides: [
    {
      // 🛡️ ENFORCE SERVICE DECOUPLING
      files: ['src/components/modules/**/*.jsx', 'src/components/shared/**/*.jsx', 'src/components/public/**/*.jsx'],
      rules: {
        'no-restricted-imports': ['error', {
          'patterns': [
            {
              'group': ['**/lib/supabase/client'],
              'message': '⛔ ARCHITECTURE VIOLATION: Direct Supabase database access is forbidden in UI components. Dispatch requests through a dedicated Hook or Service.'
            }
          ]
        }]
      }
    }
  ]
};
