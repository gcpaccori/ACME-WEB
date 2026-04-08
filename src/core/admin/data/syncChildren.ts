export interface SyncCollectionInput<TRecord extends { id?: string | null }> {
  current: TRecord[];
  existingIds: string[];
  getRecordId: (record: TRecord) => string | null | undefined;
}

export interface SyncCollectionPlan<TRecord> {
  keepIds: string[];
  deleteIds: string[];
  createRecords: TRecord[];
  updateRecords: TRecord[];
}

export function buildSyncCollectionPlan<TRecord extends { id?: string | null }>({
  current,
  existingIds,
  getRecordId,
}: SyncCollectionInput<TRecord>): SyncCollectionPlan<TRecord> {
  const keepIds = current.map((record) => getRecordId(record)).filter(Boolean) as string[];
  const keepSet = new Set(keepIds);

  return {
    keepIds,
    deleteIds: existingIds.filter((id) => !keepSet.has(id)),
    createRecords: current.filter((record) => !getRecordId(record)),
    updateRecords: current.filter((record) => Boolean(getRecordId(record))),
  };
}
