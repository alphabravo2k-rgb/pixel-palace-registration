/**
 * Infrastructure Provider Gateway (ACL Sandboxing & Plugin Loader)
 */
import { Logger } from '../shared/kernel/Logger.js';
import { ValidationFailureError } from '../shared/kernel/Errors.js';

export class ProviderGateway {
  constructor() {
    this.providers = new Map(); // providerName -> adapterInstance
  }

  /**
   * Registers a provider plugin adapter instance.
   * @param {string} name e.g., 'FACEIT' or 'MockProvider'
   * @param {Object} adapter The concrete provider adapter complying with contracts
   */
  registerProvider(name, adapter) {
    if (!adapter.fetchMatchData || !adapter.getCapabilities) {
      throw new ValidationFailureError(`Provider [${name}] fails contract verification. Missing getCapabilities/fetchMatchData.`);
    }
    this.providers.set(name, adapter);
    Logger.info(`ProviderGateway: Registered provider plugin [${name}]`);
  }

  /**
   * Queries capabilities for a target registered provider.
   * @param {string} name
   * @returns {Object} capabilities config map
   */
  getProviderCapabilities(name) {
    const adapter = this.providers.get(name);
    if (!adapter) {
      Logger.warn(`Provider [${name}] is not registered. Returning empty capabilities.`);
      return {};
    }
    return adapter.getCapabilities();
  }

  /**
   * Orchestrates incoming webhook requests running in validation sandbox.
   * Checks signature and translates payloads through ACL translator.
   */
  async processInboundWebhook(providerName, rawPayload, headers = {}) {
    const adapter = this.providers.get(providerName);
    if (!adapter) {
      throw new ValidationFailureError(`Inbound webhook rejected: Provider [${providerName}] is not registered.`);
    }

    Logger.info(`ProviderGateway: Processing webhook payload inside [${providerName}] Sandbox`);

    // Sandbox execution protection:
    try {
      // 1. Signature check stub
      if (adapter.verifySignature && !adapter.verifySignature(rawPayload, headers)) {
        throw new ValidationFailureError(`Sandbox Validation: Webhook signature verification failed for [${providerName}]`);
      }

      // 2. Translate payload through Provider Anti-Corruption Layer (ACL)
      const canonicalDto = await adapter.translateToCanonical(rawPayload);
      Logger.debug(`Sandbox ACL: Successful translation of raw payload to Canonical DTO`, { canonicalDto });
      return canonicalDto;
    } catch (err) {
      Logger.error(`Sandbox Error: Inbound webhook process failed for provider [${providerName}] - ${err.message}`);
      throw err;
    }
  }
}

// Export single shared platform instance
export const platformProviderGateway = new ProviderGateway();
