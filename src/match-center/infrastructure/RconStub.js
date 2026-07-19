/**
 * Infrastructure RCON Console Command Stub
 */
import { Logger } from '../shared/kernel/Logger.js';

export class RconStub {
  constructor(serverAddress, password) {
    this.serverAddress = serverAddress;
    this.password = password;
    this.connected = false;
  }

  async connect() {
    Logger.info(`RCON: Attempting connection to game server at ${this.serverAddress}`);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    Logger.info(`RCON: Connected successfully to ${this.serverAddress}`);
  }

  async disconnect() {
    this.connected = false;
    Logger.info(`RCON: Disconnected from ${this.serverAddress}`);
  }

  /**
   * Executes a raw game console command.
   * @param {string} cmdString
   * @returns {Promise<string>} Console response output log
   */
  async executeCommand(cmdString) {
    if (!this.connected) {
      await this.connect();
    }
    Logger.info(`RCON Command sent to server: [${cmdString}]`);
    
    // Simulate game server response logs
    if (cmdString.startsWith('mp_pause_match')) {
      return 'Console: Match pause requested... Match will pause at next round freeze time.';
    }
    if (cmdString.startsWith('mp_unpause_match')) {
      return 'Console: Match resume requested... Resuming match.';
    }
    if (cmdString.startsWith('mp_swapteams')) {
      return 'Console: Swapping teams side positions.';
    }
    return `Console: Executed command [${cmdString}] successfully.`;
  }

  async getHealth() {
    return {
      connected: this.connected,
      latencyMs: this.connected ? Math.floor(Math.random() * 15) + 5 : null,
    };
  }
}
