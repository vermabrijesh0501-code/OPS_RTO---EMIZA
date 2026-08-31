import { supabase, isSupabaseConfigured } from './supabase';
import {
  ReturnBatch,
  ScannedReturnItem,
  InwardGateEntry,
  ActivityLog,
  ReturnRemarkType,
} from '../types';
import { StorageService } from './storage';
import { SyncService } from './syncService';

export function mapDbToScannedItem(row: any): ScannedReturnItem {
  return {
    id: row.id,
    batchId: row.batch_id || row.batchId,
    trackingNumber: row.tracking_number || row.trackingNumber,
    orderNumber: row.order_number || row.orderNumber || `ORD-${(row.tracking_number || row.trackingNumber || '').slice(-6)}`,
    skuCode: row.sku_code || row.skuCode || '',
    productName: row.product_name || row.productName || '',
    remark: (row.remark || row.qc_condition || row.qcCondition || 'Good') as ReturnRemarkType,
    photoUrl: row.photo_url || row.photoUrl,
    scannedAt: row.scanned_at || row.scannedAt || new Date().toISOString(),
    scannedBy: row.scanned_by || row.scannedBy || '',
    scannedByName: row.scanned_by_name || row.scannedByName || 'Operator',
  };
}

export function mapScannedItemToDb(item: ScannedReturnItem): Record<string, any> {
  return {
    id: item.id,
    batch_id: item.batchId,
    tracking_number: item.trackingNumber,
    order_number: item.orderNumber || `ORD-${item.trackingNumber.slice(-6)}`,
    sku_code: item.skuCode || null,
    product_name: item.productName || null,
    remark: item.remark,
    photo_url: item.photoUrl || null,
    scanned_at: item.scannedAt,
    scanned_by: item.scannedBy,
    scanned_by_name: item.scannedByName,
  };
}

export function mapDbToReturnBatch(row: any): ReturnBatch {
  return {
    id: row.id,
    batchNumber: row.batch_number || row.batchNumber,
    batchType: (row.batch_type || row.batchType || 'RTO/B2C') as 'RTO/B2C' | 'B2B Return',
    warehouseId: row.warehouse_id || row.warehouseId,
    clientId: row.client_id || row.clientId,
    courierId: row.courier_id || row.courierId,
    status: (row.status || 'Open') as 'Open' | 'Closed',
    dockNumber: row.dock_number || row.dockNumber || 'Dock 01',
    expectedCount: row.expected_count ?? row.expectedCount ?? 0,
    totalScanned: row.total_scanned ?? row.totalScanned ?? 0,
    remarksBreakdown: row.remarks_breakdown || row.remarksBreakdown || {},
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    closedAt: row.closed_at || row.closedAt,
    createdBy: row.created_by || row.createdBy || '',
    createdByName: row.created_by_name || row.createdByName || '',
    driverName: row.driver_name || row.driverName,
    driverMobile: row.driver_mobile || row.driverMobile,
    driverSignature: row.driver_signature || row.driverSignature,
    supervisorSigner: row.supervisor_signer || row.supervisorSigner,
    notes: row.notes,
  };
}

export function mapReturnBatchToDb(batch: ReturnBatch): Record<string, any> {
  return {
    id: batch.id,
    batch_number: batch.batchNumber,
    batch_type: batch.batchType,
    warehouse_id: batch.warehouseId,
    client_id: batch.clientId,
    courier_id: batch.courierId,
    status: batch.status,
    dock_number: batch.dockNumber || null,
    expected_count: batch.expectedCount || 0,
    total_scanned: batch.totalScanned || 0,
    remarks_breakdown: batch.remarksBreakdown || {},
    created_at: batch.createdAt,
    closed_at: batch.closedAt || null,
    created_by: batch.createdBy,
    created_by_name: batch.createdByName || null,
    driver_name: batch.driverName || null,
    driver_mobile: batch.driverMobile || null,
    driver_signature: batch.driverSignature || null,
    supervisor_signer: batch.supervisorSigner || null,
    notes: batch.notes || null,
  };
}

export function mapDbToGateEntry(row: any): InwardGateEntry {
  return {
    id: row.id,
    gatePassNumber: row.gate_pass_number || row.gatePassNumber,
    warehouseId: row.warehouse_id || row.warehouseId,
    companyId: row.company_id || row.companyId || 'comp-emiza',
    clientId: row.client_id || row.clientId,
    courierId: row.courier_id || row.courierId,
    vehicleNumber: row.vehicle_number || row.vehicleNumber,
    vehicleTypeId: row.vehicle_type_id || row.vehicleTypeId || 'vt-eicher',
    driverName: row.driver_name || row.driverName,
    driverMobile: row.driver_mobile || row.driverMobile,
    driverLicense: row.driver_license || row.driverLicense || '',
    invoiceChallanNumber: row.invoice_challan_number || row.invoiceChallanNumber || '',
    invoiceValue: row.invoice_value ?? row.invoiceValue ?? 0,
    expectedBoxCount: row.expected_box_count ?? row.expectedBoxCount ?? 0,
    receivedBoxCount: row.received_box_count ?? row.receivedBoxCount ?? 0,
    dockNumber: row.dock_number || row.dockNumber,
    status: (row.status || 'Arrived') as any,
    entryTime: row.entry_time || row.entryTime || new Date().toISOString(),
    dockAllocatedTime: row.dock_allocated_time || row.dockAllocatedTime,
    unloadingEndTime: row.unloading_end_time || row.unloadingEndTime,
    remarks: row.remarks || '',
    createdBy: row.created_by || row.createdBy || '',
  };
}

export function mapGateEntryToDb(entry: InwardGateEntry): Record<string, any> {
  return {
    id: entry.id,
    gate_pass_number: entry.gatePassNumber,
    warehouse_id: entry.warehouseId,
    company_id: entry.companyId,
    client_id: entry.clientId,
    courier_id: entry.courierId,
    vehicle_number: entry.vehicleNumber,
    vehicle_type_id: entry.vehicleTypeId,
    driver_name: entry.driverName,
    driver_mobile: entry.driverMobile,
    driver_license: entry.driverLicense || null,
    invoice_challan_number: entry.invoiceChallanNumber || null,
    invoice_value: entry.invoiceValue || 0,
    expected_box_count: entry.expectedBoxCount || 0,
    received_box_count: entry.receivedBoxCount || 0,
    dock_number: entry.dockNumber || null,
    status: entry.status,
    entry_time: entry.entryTime,
    dock_allocated_time: entry.dockAllocatedTime || null,
    unloading_end_time: entry.unloadingEndTime || null,
    remarks: entry.remarks || null,
    created_by: entry.createdBy,
  };
}

export function mapDbToActivityLog(row: any): ActivityLog {
  return {
    id: row.id,
    timestamp: row.timestamp || row.created_at || new Date().toISOString(),
    userId: row.user_id || row.userId,
    userName: row.user_name || row.userName,
    userRole: row.user_role || row.userRole,
    action: row.action,
    module: row.module,
    details: row.details,
  };
}

export function mapActivityLogToDb(log: ActivityLog): Record<string, any> {
  return {
    id: log.id,
    timestamp: log.timestamp,
    user_id: log.userId,
    user_name: log.userName,
    user_role: log.userRole,
    action: log.action,
    module: log.module,
    details: log.details,
  };
}

type WriteResult = { error: any | null; data?: any };

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T extends WriteResult>(operation: () => Promise<T>, label: string, attempts = 3): Promise<T> {
  let last: T | null = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await operation();
      if (!result.error) return result;
      last = result;
      if (attempt < attempts) await sleep(350 * attempt);
    } catch (error) {
      if (attempt === attempts) throw error;
      await sleep(350 * attempt);
    }
  }
  throw new Error(`[${label}] ${last?.error?.message || last?.error?.details || 'Supabase write failed after retries'}`);
}

async function persistOrThrow(label: string, operation: () => Promise<WriteResult>): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Cloud write was blocked to prevent local-only production data.');
  }
  try {
    await withRetry(operation, label);
  } catch (error: any) {
    const message = error?.message || `${label} failed`;
    console.error(`[DBService] ${message}`, error);
    SyncService.broadcast('SYNC_ERROR', { operation: label, message, timestamp: new Date().toISOString() });
    throw error;
  }
}

function saveCaches(
  batches?: ReturnBatch[],
  items?: ScannedReturnItem[],
  gates?: InwardGateEntry[]
) {
  if (batches) StorageService.saveReturnBatches(batches);
  if (items) StorageService.saveScannedItems(items);
  if (gates) StorageService.saveGateEntries(gates);
}

export const DBService = {
  async fetchAllData(): Promise<{
    batches: ReturnBatch[];
    scannedItems: ScannedReturnItem[];
    gateEntries: InwardGateEntry[];
    logs: ActivityLog[];
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Production data cannot be loaded from a local-only source.');
    }

    try {
      const [batchesRes, itemsRes, gateRes, logsRes] = await Promise.all([
        supabase.from('return_batches').select('*').order('created_at', { ascending: false }),
        supabase.from('scanned_return_items').select('*').order('scanned_at', { ascending: false }),
        supabase.from('inward_gate_entries').select('*').order('entry_time', { ascending: false }),
        supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100),
      ]);

      const errors = [batchesRes.error, itemsRes.error, gateRes.error, logsRes.error].filter(Boolean);
      if (errors.length) throw new Error(errors.map((e: any) => e.message).join(' | '));

      const batches = (batchesRes.data || []).map(mapDbToReturnBatch);
      const scannedItems = (itemsRes.data || []).map(mapDbToScannedItem);
      const gateEntries = (gateRes.data || []).map(mapDbToGateEntry);
      const logs = (logsRes.data || []).map(mapDbToActivityLog);

      saveCaches(batches, scannedItems, gateEntries);
      return { batches, scannedItems, gateEntries, logs };
    } catch (error: any) {
      console.error('[DBService] Initial cloud sync failed:', error);
      SyncService.broadcast('SYNC_ERROR', {
        operation: 'initial_sync',
        message: error?.message || 'Unable to load Supabase data',
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  async recordScanItem(item: ScannedReturnItem, updatedBatch: ReturnBatch, allUpdatedItems: ScannedReturnItem[], allUpdatedBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const createdLog = logData ? StorageService.addActivityLog(logData) : undefined;
    try {
      // Upsert makes retries idempotent and prevents duplicate scans after transient failures.
      await persistOrThrow('record scan item', () => supabase.from('scanned_return_items').upsert(mapScannedItemToDb(item), { onConflict: 'id' }));
      await persistOrThrow('update scan batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(updatedBatch), { onConflict: 'id' }));
      if (createdLog) await persistOrThrow('write activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(createdLog), { onConflict: 'id' }));
      saveCaches(allUpdatedBatches, allUpdatedItems);
      SyncService.broadcast('ITEM_SCANNED', { item, batch: updatedBatch, allScannedItems: allUpdatedItems, allBatches: allUpdatedBatches, log: createdLog });
    } catch (error) {
      if (createdLog) StorageService.addActivityLog({ userId: createdLog.userId, userName: createdLog.userName, userRole: createdLog.userRole, action: 'Cloud write failed', module: createdLog.module, details: `record scan item failed for ${item.trackingNumber}` });
      throw error;
    }
  },

  async updateScanItem(itemId: string, updatedItem: ScannedReturnItem, updatedBatch: ReturnBatch, allUpdatedItems: ScannedReturnItem[], allUpdatedBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const createdLog = logData ? StorageService.addActivityLog(logData) : undefined;
    await persistOrThrow('update scan item', () => supabase.from('scanned_return_items').upsert(mapScannedItemToDb(updatedItem), { onConflict: 'id' }));
    await persistOrThrow('update scan batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(updatedBatch), { onConflict: 'id' }));
    if (createdLog) await persistOrThrow('write activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(createdLog), { onConflict: 'id' }));
    saveCaches(allUpdatedBatches, allUpdatedItems);
    SyncService.broadcast('ITEM_UPDATED', { itemId, item: updatedItem, batch: updatedBatch, allScannedItems: allUpdatedItems, allBatches: allUpdatedBatches, log: createdLog });
  },

  async deleteScanItem(itemId: string, batchId: string, updatedBatch: ReturnBatch, allUpdatedItems: ScannedReturnItem[], allUpdatedBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const createdLog = logData ? StorageService.addActivityLog(logData) : undefined;
    await persistOrThrow('delete scan item', () => supabase.from('scanned_return_items').delete().eq('id', itemId));
    await persistOrThrow('update deleted-item batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(updatedBatch), { onConflict: 'id' }));
    if (createdLog) await persistOrThrow('write activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(createdLog), { onConflict: 'id' }));
    saveCaches(allUpdatedBatches, allUpdatedItems);
    SyncService.broadcast('ITEM_DELETED', { itemId, batchId, batch: updatedBatch, allScannedItems: allUpdatedItems, allBatches: allUpdatedBatches, log: createdLog });
  },

  async createBatch(newBatch: ReturnBatch, allUpdatedBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const createdLog = logData ? StorageService.addActivityLog(logData) : undefined;
    await persistOrThrow('create return batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(newBatch), { onConflict: 'id' }));
    if (createdLog) await persistOrThrow('write activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(createdLog), { onConflict: 'id' }));
    saveCaches(allUpdatedBatches);
    SyncService.broadcast('BATCH_CREATED', { batch: newBatch, allBatches: allUpdatedBatches, log: createdLog });
  },

  async closeBatch(batchId: string, updatedBatch: ReturnBatch, allUpdatedBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const createdLog = logData ? StorageService.addActivityLog(logData) : undefined;
    await persistOrThrow('close return batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(updatedBatch), { onConflict: 'id' }));
    if (createdLog) await persistOrThrow('write activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(createdLog), { onConflict: 'id' }));
    saveCaches(allUpdatedBatches);
    SyncService.broadcast('BATCH_CLOSED', { batchId, batch: updatedBatch, allBatches: allUpdatedBatches, log: createdLog });
  },

  async createGateEntry(newEntry: InwardGateEntry, allUpdatedEntries: InwardGateEntry[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const createdLog = logData ? StorageService.addActivityLog(logData) : undefined;
    await persistOrThrow('create gate entry', () => supabase.from('inward_gate_entries').upsert(mapGateEntryToDb(newEntry), { onConflict: 'id' }));
    if (createdLog) await persistOrThrow('write activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(createdLog), { onConflict: 'id' }));
    saveCaches(undefined, undefined, allUpdatedEntries);
    SyncService.broadcast('GATE_ENTRY_CREATED', { entry: newEntry, allGateEntries: allUpdatedEntries, log: createdLog });
  },

  async updateGateEntry(id: string, updatedEntry: InwardGateEntry, allUpdatedEntries: InwardGateEntry[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const createdLog = logData ? StorageService.addActivityLog(logData) : undefined;
    await persistOrThrow('update gate entry', () => supabase.from('inward_gate_entries').upsert(mapGateEntryToDb(updatedEntry), { onConflict: 'id' }));
    if (createdLog) await persistOrThrow('write activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(createdLog), { onConflict: 'id' }));
    saveCaches(undefined, undefined, allUpdatedEntries);
    SyncService.broadcast('GATE_ENTRY_UPDATED', { id, entry: updatedEntry, allGateEntries: allUpdatedEntries, log: createdLog });
  },
};
