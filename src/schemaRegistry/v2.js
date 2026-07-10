export const migrateToV2 = (v1Data) => {
  const v2Data = { ...v1Data };
  // V1 form schema had some fields that we standardise or keep.
  // E.g. setting version schemas or default fields.
  return v2Data;
};
