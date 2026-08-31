import { supabase, isSupabaseConfigured } from './supabase';
import { ReturnBatch, ScannedReturnItem, InwardGateEntry, ActivityLog, ReturnRemarkType } from '../types';
import { StorageService } from './storage';
import { SyncService } from './syncService';

export function mapDbToScannedItem(row: any): ScannedReturnItem { return { id: row.id, batchId: row.batch_id || row.batchId, trackingNumber: row.tracking_number || row.trackingNumber, orderNumber: row.order_number || row.orderNumber || `ORD-${(row.tracking_number || row.trackingNumber || '').slice(-6)}`, skuCode: row.sku_code || row.skuCode || '', productName: row.product_name || row.productName || '', remark: (row.remark || row.qc_condition || row.qcCondition || 'Good') as ReturnRemarkType, photoUrl: row.photo_url || row.photoUrl, scannedAt: row.scanned_at || row.scannedAt || new Date().toISOString(), scannedBy: row.scanned_by || row.scannedBy || '', scannedByName: row.scanned_by_name || row.scannedByName || 'Operator' }; }
export function mapScannedItemToDb(item: ScannedReturnItem): Record<string, any> { return { id: item.id, batch_id: item.batchId, tracking_number: item.trackingNumber, order_number: item.orderNumber || `ORD-${item.trackingNumber.slice(-6)}`, sku_code: item.skuCode || null, product_name: item.productName || null, remark: item.remark, photo_url: item.photoUrl || null, scanned_at: item.scannedAt, scanned_by: item.scannedBy, scanned_by_name: item.scannedByName }; }
export function mapDbToReturnBatch(row: any): ReturnBatch { return { id: row.id, batchNumber: row.batch_number || row.batchNumber, batchType: (row.batch_type || row.batchType || 'RTO/B2C') as any, warehouseId: row.warehouse_id || row.warehouseId, clientId: row.client_id || row.clientId, courierId: row.courier_id || row.courierId, status: (row.status || 'Open') as any, dockNumber: row.dock_number || row.dockNumber || 'Dock 01', expectedCount: row.expected_count ?? row.expectedCount ?? 0, totalScanned: row.total_scanned ?? row.totalScanned ?? 0, remarksBreakdown: row.remarks_breakdown || row.remarksBreakdown || {}, createdAt: row.created_at || row.createdAt || new Date().toISOString(), closedAt: row.closed_at || row.closedAt, createdBy: row.created_by || row.createdBy || '', createdByName: row.created_by_name || row.createdByName || '', driverName: row.driver_name || row.driverName, driverMobile: row.driver_mobile || row.driverMobile, driverSignature: row.driver_signature || row.driverSignature, supervisorSigner: row.supervisor_signer || row.supervisorSigner, notes: row.notes }; }
export function mapReturnBatchToDb(batch: ReturnBatch): Record<string, any> { return { id: batch.id, batch_number: batch.batchNumber, batch_type: batch.batchType, warehouse_id: batch.warehouseId, client_id: batch.clientId, courier_id: batch.courierId, status: batch.status, dock_number: batch.dockNumber || null, expected_count: batch.expectedCount || 0, total_scanned: batch.totalScanned || 0, remarks_breakdown: batch.remarksBreakdown || {}, created_at: batch.createdAt, closed_at: batch.closedAt || null, created_by: batch.createdBy, created_by_name: batch.createdByName || null, driver_name: batch.driverName || null, driver_mobile: batch.driverMobile || null, driver_signature: batch.driverSignature || null, supervisor_signer: batch.supervisorSigner || null, notes: batch.notes || null }; }
export function mapDbToGateEntry(row: any): InwardGateEntry { return { id: row.id, gatePassNumber: row.gate_pass_number || row.gatePassNumber, warehouseId: row.warehouse_id || row.warehouseId, companyId: row.company_id || row.companyId || 'comp-emiza', clientId: row.client_id || row.clientId, courierId: row.courier_id || row.courierId, vehicleNumber: row.vehicle_number || row.vehicleNumber, vehicleTypeId: row.vehicle_type_id || row.vehicleTypeId || 'vt-eicher', driverName: row.driver_name || row.driverName, driverMobile: row.driver_mobile || row.driverMobile, driverLicense: row.driver_license || row.driverLicense || '', invoiceChallanNumber: row.invoice_challan_number || row.invoiceChallanNumber || '', invoiceValue: row.invoice_value ?? row.invoiceValue ?? 0, expectedBoxCount: row.expected_box_count ?? row.expectedBoxCount ?? 0, receivedBoxCount: row.received_box_count ?? row.receivedBoxCount ?? 0, dockNumber: row.dock_number || row.dockNumber, status: (row.status || 'Arrived') as any, entryTime: row.entry_time || row.entryTime || new Date().toISOString(), dockAllocatedTime: row.dock_allocated_time || row.dockAllocatedTime, unloadingEndTime: row.unloading_end_time || row.unloadingEndTime, remarks: row.remarks || '', createdBy: row.created_by || row.createdBy || '' }; }
export function mapGateEntryToDb(entry: InwardGateEntry): Record<string, any> { return { id: entry.id, gate_pass_number: entry.gatePassNumber, warehouse_id: entry.warehouseId, company_id: entry.companyId, client_id: entry.clientId, courier_id: entry.courierId, vehicle_number: entry.vehicleNumber, vehicle_type_id: entry.vehicleTypeId, driver_name: entry.driverName, driver_mobile: entry.driverMobile, driver_license: entry.driverLicense || null, invoice_challan_number: entry.invoiceChallanNumber || null, invoice_value: entry.invoiceValue || 0, expected_box_count: entry.expectedBoxCount || 0, received_box_count: entry.receivedBoxCount || 0, dock_number: entry.dockNumber || null, status: entry.status, entry_time: entry.entryTime, dock_allocated_time: entry.dockAllocatedTime || null, unloading_end_time: entry.unloadingEndTime || null, remarks: entry.remarks || null, created_by: entry.createdBy }; }
export function mapDbToActivityLog(row: any): ActivityLog { return { id: row.id, timestamp: row.timestamp || row.created_at || new Date().toISOString(), userId: row.user_id || row.userId, userName: row.user_name || row.userName, userRole: row.user_role || row.userRole, action: row.action, module: row.module, details: row.details }; }
export function mapActivityLogToDb(log: ActivityLog): Record<string, any> { return { id: log.id, timestamp: log.timestamp, user_id: log.userId, user_name: log.userName, user_role: log.userRole, action: log.action, module: log.module, details: log.details }; }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function withRetry(operation: () => Promise<any>, label: string, attempts = 3): Promise<any> {
  let last: any;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await operation();
      if (!result?.error) return result;
      last = result.error;
      if (attempt < attempts) await sleep(300 * attempt);
    } catch (error) {
      last = error;
      if (attempt < attempts) await sleep(300 * attempt); else throw error;
    }
  }
  throw new Error(`[${label}] ${last?.message || last?.details || 'Supabase write failed after retries'}`);
}
async function persist(label: string, operation: () => Promise<any>): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured. Cloud write blocked.');
  try { await withRetry(operation, label); }
  catch (error: any) { const message = error?.message || `${label} failed`; console.error(`[DBService] ${message}`, error); SyncService.broadcast('SYNC_ERROR', { operation: label, message, timestamp: new Date().toISOString() }); throw error; }
}
function cache(b?: ReturnBatch[], i?: ScannedReturnItem[], g?: InwardGateEntry[]) { if (b) StorageService.saveReturnBatches(b); if (i) StorageService.saveScannedItems(i); if (g) StorageService.saveGateEntries(g); }

export const DBService = {
  async fetchAllData() {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.');
    try {
      const [b, i, g, l] = await Promise.all([
        supabase.from('return_batches').select('*').order('created_at', { ascending: false }),
        supabase.from('scanned_return_items').select('*').order('scanned_at', { ascending: false }),
        supabase.from('inward_gate_entries').select('*').order('entry_time', { ascending: false }),
        supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100),
      ]);
      const errors = [b.error, i.error, g.error, l.error].filter(Boolean);
      if (errors.length) throw new Error(errors.map((e: any) => e.message).join(' | '));
      const batches = (b.data || []).map(mapDbToReturnBatch), scannedItems = (i.data || []).map(mapDbToScannedItem), gateEntries = (g.data || []).map(mapDbToGateEntry), logs = (l.data || []).map(mapDbToActivityLog);
      cache(batches, scannedItems, gateEntries); return { batches, scannedItems, gateEntries, logs };
    } catch (error: any) { SyncService.broadcast('SYNC_ERROR', { operation: 'initial_sync', message: error?.message || 'Unable to load Supabase data' }); throw error; }
  },
  async recordScanItem(item: ScannedReturnItem, batch: ReturnBatch, allItems: ScannedReturnItem[], allBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const log = logData ? StorageService.addActivityLog(logData) : undefined;
    await persist('scan item', () => supabase.from('scanned_return_items').upsert(mapScannedItemToDb(item), { onConflict: 'id' }));
    await persist('scan batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(batch), { onConflict: 'id' }));
    if (log) await persist('scan activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(log), { onConflict: 'id' }));
    cache(allBatches, allItems); SyncService.broadcast('ITEM_SCANNED', { item, batch, allScannedItems: allItems, allBatches, log });
  },
  async updateScanItem(itemId: string, item: ScannedReturnItem, batch: ReturnBatch, allItems: ScannedReturnItem[], allBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const log = logData ? StorageService.addActivityLog(logData) : undefined;
    await persist('update scan item', () => supabase.from('scanned_return_items').upsert(mapScannedItemToDb(item), { onConflict: 'id' }));
    await persist('update scan batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(batch), { onConflict: 'id' }));
    if (log) await persist('update activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(log), { onConflict: 'id' }));
    cache(allBatches, allItems); SyncService.broadcast('ITEM_UPDATED', { itemId, item, batch, allScannedItems: allItems, allBatches, log });
  },
  async deleteScanItem(itemId: string, batchId: string, batch: ReturnBatch, allItems: ScannedReturnItem[], allBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const log = logData ? StorageService.addActivityLog(logData) : undefined;
    await persist('delete scan item', () => supabase.from('scanned_return_items').delete().eq('id', itemId));
    await persist('delete item batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(batch), { onConflict: 'id' }));
    if (log) await persist('delete activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(log), { onConflict: 'id' }));
    cache(allBatches, allItems); SyncService.broadcast('ITEM_DELETED', { itemId, batchId, batch, allScannedItems: allItems, allBatches, log });
  },
  async createBatch(batch: ReturnBatch, allBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const log = logData ? StorageService.addActivityLog(logData) : undefined;
    await persist('create return batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(batch), { onConflict: 'id' }));
    if (log) await persist('create batch activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(log), { onConflict: 'id' }));
    cache(allBatches); SyncService.broadcast('BATCH_CREATED', { batch, allBatches, log });
  },
  async closeBatch(batchId: string, batch: ReturnBatch, allBatches: ReturnBatch[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const log = logData ? StorageService.addActivityLog(logData) : undefined;
    await persist('close return batch', () => supabase.from('return_batches').upsert(mapReturnBatchToDb(batch), { onConflict: 'id' }));
    if (log) await persist('close batch activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(log), { onConflict: 'id' }));
    cache(allBatches); SyncService.broadcast('BATCH_CLOSED', { batchId, batch, allBatches, log });
  },
  async createGateEntry(entry: InwardGateEntry, allEntries: InwardGateEntry[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const log = logData ? StorageService.addActivityLog(logData) : undefined;
    await persist('create gate entry', () => supabase.from('inward_gate_entries').upsert(mapGateEntryToDb(entry), { onConflict: 'id' }));
    if (log) await persist('gate entry activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(log), { onConflict: 'id' }));
    cache(undefined, undefined, allEntries); SyncService.broadcast('GATE_ENTRY_CREATED', { entry, allGateEntries: allEntries, log });
  },
  async updateGateEntry(id: string, entry: InwardGateEntry, allEntries: InwardGateEntry[], logData?: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const log = logData ? StorageService.addActivityLog(logData) : undefined;
    await persist('update gate entry', () => supabase.from('inward_gate_entries').upsert(mapGateEntryToDb(entry), { onConflict: 'id' }));
    if (log) await persist('update gate activity log', () => supabase.from('activity_logs').upsert(mapActivityLogToDb(log), { onConflict: 'id' }));
    cache(undefined, undefined, allEntries); SyncService.broadcast('GATE_ENTRY_UPDATED', { id, entry, allGateEntries: allEntries, log });
  },
};