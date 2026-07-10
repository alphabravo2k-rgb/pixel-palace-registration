import { migrateToV2 } from './v2';

export const CURRENT_SCHEMA_VERSION = 2;

const MIGRATIONS = {
  1: migrateToV2
};

/**
 * Runs migration functions iteratively until the formData matches the current schema version.
 * 
 * @param {object} formData - Form payload
 * @param {string|number} fromVersion - Initial version of saved form payload
 * @returns {object} Migrated form payload
 */
export const runSchemaMigrations = (formData, fromVersion) => {
  if (!formData) return null;
  let data = { ...formData };
  let version = parseInt(String(fromVersion || '1').replace('v', ''), 10) || 1;

  while (version < CURRENT_SCHEMA_VERSION) {
    const migration = MIGRATIONS[version];
    if (!migration) break;
    data = migration(data);
    version++;
  }
  return data;
};
