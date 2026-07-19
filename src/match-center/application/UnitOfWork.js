/**
 * Unit of Work Transaction Boundary Contract
 */

export class UnitOfWork {
  /**
   * Starts a transaction boundary.
   */
  async begin() {
    throw new Error('UnitOfWork.begin not implemented.');
  }

  /**
   * Commits the active transaction boundary.
   */
  async commit() {
    throw new Error('UnitOfWork.commit not implemented.');
  }

  /**
   * Rolls back the active transaction boundary on failure.
   */
  async rollback() {
    throw new Error('UnitOfWork.rollback not implemented.');
  }

  /**
   * Executes a callback within a managed transaction boundary.
   * @param {Function} workFn async callback
   */
  async execute(workFn) {
    throw new Error('UnitOfWork.execute not implemented.');
  }
}
