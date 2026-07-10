import { runSchemaMigrations, CURRENT_SCHEMA_VERSION } from '../schemaRegistry';

export const SCHEMA_VERSION = `v${CURRENT_SCHEMA_VERSION}`;

/**
 * Migrates draft formData payload between schema versions.
 * Delegate to centralized schema registry.
 * 
 * @param {object} formData - Raw saved form data
 * @param {string} fromVersion - Original schema version
 * @returns {object} Migrated form data matching the current SCHEMA_VERSION
 */
export const migrateDraft = (formData, fromVersion) => {
  return runSchemaMigrations(formData, fromVersion);
};
