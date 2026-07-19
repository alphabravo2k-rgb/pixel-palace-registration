/**
 * Application Command Dispatcher
 */
import { Logger } from '../shared/kernel/Logger.js';
import { ValidationFailureError } from '../shared/kernel/Errors.js';

export class CommandDispatcher {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Registers a handler function for a specific command class or type.
   * @param {string} commandType The class name or string type of the command
   * @param {Function} handler Callback receives (command) and executes use case
   */
  register(commandType, handler) {
    if (this.handlers.has(commandType)) {
      Logger.warn(`Overwriting duplicate command handler registration for: ${commandType}`);
    }
    this.handlers.set(commandType, handler);
    Logger.debug(`Command handler registered for: ${commandType}`);
  }

  /**
   * Dispatches a command to its registered handler.
   * @param {DomainCommand} command
   * @returns {Promise<any>} Result returned by the handler
   */
  async dispatch(command) {
    if (!command || !command.type) {
      throw new ValidationFailureError('Invalid command object: type property is required.');
    }

    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new ValidationFailureError(`No command handler registered for command: ${command.type}`);
    }

    Logger.info(`Dispatching command: ${command.type}`, { correlationId: command.correlationId });
    try {
      return await handler(command);
    } catch (err) {
      Logger.error(`Command execution failed: ${command.type} - ${err.message}`, {
        correlationId: command.correlationId,
        error: err,
      });
      throw err;
    }
  }
}

// Export single shared platform instance
export const platformCommandDispatcher = new CommandDispatcher();
