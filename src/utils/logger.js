/**
 * PIXEL PALACE - System Terminal Logger
 * Replaces standard console.log with formatted, cyberpunk-themed console logs.
 */

const baseStyles = 'padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;';

export const Terminal = {
  log: (module, message, data = null) => {
    const styles = `${baseStyles} background: #27272a; color: #a1a1aa; border: 1px solid #3f3f46;`;
    console.log(`%c[${module}]%c ${message}`, styles, 'color: #d4d4d8; font-family: monospace;', data ? data : '');
  },
  
  network: (message, data = null) => {
    const styles = `${baseStyles} background: rgba(0, 240, 255, 0.1); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);`;
    console.log(`%c[NETWORK]%c ${message}`, styles, 'color: #00f0ff; font-family: monospace;', data ? data : '');
  },

  success: (message, data = null) => {
    const styles = `${baseStyles} background: rgba(0, 255, 128, 0.1); color: #00ff80; border: 1px solid rgba(0, 255, 128, 0.3); box-shadow: 0 0 10px rgba(0, 255, 128, 0.2);`;
    console.log(`%c[SUCCESS]%c ${message}`, styles, 'color: #00ff80; font-family: monospace;', data ? data : '');
  },

  warn: (message, data = null) => {
    const styles = `${baseStyles} background: rgba(255, 215, 0, 0.1); color: #ffd700; border: 1px solid rgba(255, 215, 0, 0.3); box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);`;
    console.warn(`%c[WARNING]%c ${message}`, styles, 'color: #ffd700; font-family: monospace;', data ? data : '');
  },

  error: (module, message, error = null) => {
    const styles = `${baseStyles} background: rgba(255, 0, 85, 0.1); color: #ff0055; border: 1px solid rgba(255, 0, 85, 0.3); box-shadow: 0 0 10px rgba(255, 0, 85, 0.2);`;
    console.error(`%c[${module}_ERR]%c ${message}`, styles, 'color: #ff0055; font-family: monospace;', error ? error : '');
  },

  boot: () => {
    const styles = `${baseStyles} background: #000; color: #fff; border: 1px solid #fff; padding: 4px 12px; font-size: 14px;`;
    console.log(`%c⚡ PIXEL PALACE OS v3.0 INITIALIZED`, styles);
  }
};
