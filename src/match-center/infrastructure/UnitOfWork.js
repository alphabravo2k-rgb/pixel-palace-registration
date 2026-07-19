/**
 * Concrete Unit of Work Transaction Manager
 */
import { UnitOfWork } from '../application/UnitOfWork.js';
import { Logger } from '../shared/kernel/Logger.js';

export class InMemoryUnitOfWork extends UnitOfWork {
  constructor() {
    super();
    this.inTransaction = false;
  }

  async begin() {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress.');
    }
    this.inTransaction = true;
    Logger.debug('UnitOfWork: Transaction boundary started.');
  }

  async commit() {
    if (!this.inTransaction) {
      throw new Error('No active transaction to commit.');
    }
    this.inTransaction = false;
    Logger.debug('UnitOfWork: Transaction boundary successfully committed.');
  }

  async rollback() {
    this.inTransaction = false;
    Logger.warn('UnitOfWork: Transaction boundary rolled back due to failure.');
  }

  async execute(workFn) {
    await this.begin();
    try {
      const result = await workFn();
      await this.commit();
      return result;
    } catch (err) {
      await this.rollback();
      throw err;
    }
  }
}

// Export single shared platform instance
export const platformUnitOfWork = new InMemoryUnitOfWork();
