import { supabase, isSupabaseConfigured } from './supabase';
import {
  ReturnBatch,
  ScannedReturnItem,
  InwardGateEntry,
  ActivityLog,
  AuditRecord,
  ActiveDeviceSession,
  ReturnRemarkType,
  User,
} from '../types';
import { StorageService } from './storage';
import { SyncService, SyncMessage } from './syncService';

// Normalizers between TypeScript camelCase and PostgreSQL snake_case

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
    remarksBreakdown: row.remarks_breakdown || row.remarksBreakdown || {
      Good: 0,
      Damage: 0,
      'Open Box': 0,
      'Wrong Product': 0,
      'Short Qty': 0,
      'Missing Product': 0,
      Others: 0,
    },
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    closedAt: row.closed_at || row.closedAt,
    createdBy: row.created_by || row.createdBy || 'usr-super',
    createdByName: row.created_by_name || row.createdByName || 'Super Admin',
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
    expected_count: batch.expectedCount || 0,
    total_scanned: batch.totalScanned || 0,
    remarks_breakdown: batch.remarksBreakdown,
    created_at: batch.createdAt,
    closed_at: batch.closedAt || null,
    created_by: batch.createdBy,
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
    createdBy: row.created_by || row.createdBy || 'usr-super',
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

/**
 * DBService provides full Cloud database synchronization with local storage fallback
 * and real-time multi-device broadcasts.
 */
export const DBService = {
  // Fetch all initial data from Supabase if connected
  async fetchAllData(): Promise<{
    batches?: ReturnBatch[];
    scannedItems?: ScannedReturnItem[];
    gateEntries?: InwardGateEntry[];
    logs?: ActivityLog[];
  }> {
    if (!isSupabaseConfigured()) {
      return {
        batches: StorageService.getReturnBatches(),
        scannedItems: StorageService.getScannedItems(),
        gateEntries: StorageService.getGateEntries(),
        logs: StorageService.getActivityLogs(),
      };
    }

    try {
      const [batchesRes, itemsRes, gateRes, logsRes] = await Promise.allSettled([
        supabase.from('return_batches').select('*').order('created_at', { ascending: false }),
        supabase.from('scanned_return_items').select('*').order('scanned_at', { ascending: false }),
        supabase.from('inward_gate_entries').select('*').order('entry_time', { ascending: false }),
        supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(100),
      ]);

      const result: {
        batches?: ReturnBatch[];
        scannedItems?: ScannedReturnItem[];
        gateEntries?: InwardGateEntry[];
        logs?: ActivityLog[];
      } = {};

      if (batchesRes.status === 'fulfilled' && batchesRes.value.data && batchesRes.value.data.length > 0) {
        result.batches = batchesRes.value.data.map(mapDbToReturnBatch);
        StorageService.saveReturnBatches(result.batches);
      } else {
        result.batches = StorageService.getReturnBatches();
      }

      if (itemsRes.status === 'fulfilled' && itemsRes.value.data && itemsRes.value.data.length > 0) {
        result.scannedItems = itemsRes.value.data.map(mapDbToScannedItem);
        StorageService.saveScannedItems(result.scannedItems);
      } else {
        result.scannedItems = StorageService.getScannedItems();
      }

      if (gateRes.status === 'fulfilled' && gateRes.value.data && gateRes.value.data.length > 0) {
        result.gateEntries = gateRes.value.data.map(mapDbToGateEntry);
        StorageService.saveGateEntries(result.gateEntries);
      } else {
        result.gateEntries = StorageService.getGateEntries();
      }

      if (logsRes.status === 'fulfilled' && logsRes.value.data && logsRes.value.data.length > 0) {
        result.logs = logsRes.value.data.map(mapDbToActivityLog);
      } else {
        result.logs = StorageService.getActivityLogs();
      }

      return result;
    } catch (err) {
      console.warn('[DBService] Failed fetching remote data from Supabase, using storage cache:', err);
      return {
        batches: StorageService.getReturnBatches(),
        scannedItems: StorageService.getScannedItems(),
        gateEntries: StorageService.getGateEntries(),
        logs: StorageService.getActivityLogs(),
      };
    }
  },

  // Insert scanned item & update batch
  async recordScanItem(
    item: ScannedReturnItem,
    updatedBatch: ReturnBatch,
    allUpdatedItems: ScannedReturnItem[],
    allUpdatedBatches: ReturnBatch[],
    logData?: Omit<ActivityLog, 'id' | 'timestamp'>
  ): Promise<void> {
    // 1. Save to local storage for immediate offline/cache availability
    StorageService.saveScannedItems(allUpdatedItems);
    StorageService.saveReturnBatches(allUpdatedBatches);

    let createdLog: ActivityLog | undefined;
    if (logData) {
      createdLog = StorageService.addActivityLog(logData);
    }

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const itemRow = mapScannedItemToDb(item);
        const batchRow = mapReturnBatchToDb(updatedBatch);

        // Async write to Supabase
        Promise.allSettled([
          supabase.from('scanned_return_items').insert(itemRow),
          supabase.from('return_batches').upsert(batchRow, { onConflict: 'id' }),
          createdLog ? supabase.from('activity_logs').insert(mapActivityLogToDb(createdLog)) : Promise.resolve(),
        ]).catch(err => console.warn('[DBService] Supabase write error on scan:', err));
      } catch (e) {
        console.warn('[DBService] Supabase scan persistence error:', e);
      }
    }

    // 3. Broadcast to all other devices & tabs with full payload
    SyncService.broadcast('ITEM_SCANNED', {
      item,
      batch: updatedBatch,
      allScannedItems: allUpdatedItems,
      allBatches: allUpdatedBatches,
      log: createdLog,
    });
  },

  // Update item & recalculate batch
  async updateScanItem(
    itemId: string,
    updatedItem: ScannedReturnItem,
    updatedBatch: ReturnBatch,
    allUpdatedItems: ScannedReturnItem[],
    allUpdatedBatches: ReturnBatch[],
    logData?: Omit<ActivityLog, 'id' | 'timestamp'>
  ): Promise<void> {
    StorageService.saveScannedItems(allUpdatedItems);
    StorageService.saveReturnBatches(allUpdatedBatches);

    let createdLog: ActivityLog | undefined;
    if (logData) {
      createdLog = StorageService.addActivityLog(logData);
    }

    if (isSupabaseConfigured()) {
      try {
        const itemRow = mapScannedItemToDb(updatedItem);
        const batchRow = mapReturnBatchToDb(updatedBatch);

        Promise.allSettled([
          supabase.from('scanned_return_items').update(itemRow).eq('id', itemId),
          supabase.from('return_batches').upsert(batchRow, { onConflict: 'id' }),
          createdLog ? supabase.from('activity_logs').insert(mapActivityLogToDb(createdLog)) : Promise.resolve(),
        ]).catch(err => console.warn('[DBService] Supabase write error on update:', err));
      } catch (e) {
        console.warn('[DBService] Supabase item update error:', e);
      }
    }

    SyncService.broadcast('ITEM_UPDATED', {
      itemId,
      item: updatedItem,
      batch: updatedBatch,
      allScannedItems: allUpdatedItems,
      allBatches: allUpdatedBatches,
      log: createdLog,
    });
  },

  // Delete item & decrement batch
  async deleteScanItem(
    itemId: string,
    batchId: string,
    updatedBatch: ReturnBatch,
    allUpdatedItems: ScannedReturnItem[],
    allUpdatedBatches: ReturnBatch[],
    logData?: Omit<ActivityLog, 'id' | 'timestamp'>
  ): Promise<void> {
    StorageService.saveScannedItems(allUpdatedItems);
    StorageService.saveReturnBatches(allUpdatedBatches);

    let createdLog: ActivityLog | undefined;
    if (logData) {
      createdLog = StorageService.addActivityLog(logData);
    }

    if (isSupabaseConfigured()) {
      try {
        const batchRow = mapReturnBatchToDb(updatedBatch);

        Promise.allSettled([
          supabase.from('scanned_return_items').delete().eq('id', itemId),
          supabase.from('return_batches').upsert(batchRow, { onConflict: 'id' }),
          createdLog ? supabase.from('activity_logs').insert(mapActivityLogToDb(createdLog)) : Promise.resolve(),
        ]).catch(err => console.warn('[DBService] Supabase write error on delete:', err));
      } catch (e) {
        console.warn('[DBService] Supabase item delete error:', e);
      }
    }

    SyncService.broadcast('ITEM_DELETED', {
      itemId,
      batchId,
      batch: updatedBatch,
      allScannedItems: allUpdatedItems,
      allBatches: allUpdatedBatches,
      log: createdLog,
    });
  },

  // Create new return batch
  async createBatch(
    newBatch: ReturnBatch,
    allUpdatedBatches: ReturnBatch[],
    logData?: Omit<ActivityLog, 'id' | 'timestamp'>
  ): Promise<void> {
    StorageService.saveReturnBatches(allUpdatedBatches);

    let createdLog: ActivityLog | undefined;
    if (logData) {
      createdLog = StorageService.addActivityLog(logData);
    }

    if (isSupabaseConfigured()) {
      try {
        const batchRow = mapReturnBatchToDb(newBatch);
        Promise.allSettled([
          supabase.from('return_batches').insert(batchRow),
          createdLog ? supabase.from('activity_logs').insert(mapActivityLogToDb(createdLog)) : Promise.resolve(),
        ]).catch(err => console.warn('[DBService] Supabase write error on create batch:', err));
      } catch (e) {
        console.warn('[DBService] Supabase batch create error:', e);
      }
    }

    SyncService.broadcast('BATCH_CREATED', {
      batch: newBatch,
      allBatches: allUpdatedBatches,
      log: createdLog,
    });
  },

  // Close return batch
  async closeBatch(
    batchId: string,
    updatedBatch: ReturnBatch,
    allUpdatedBatches: ReturnBatch[],
    logData?: Omit<ActivityLog, 'id' | 'timestamp'>
  ): Promise<void> {
    StorageService.saveReturnBatches(allUpdatedBatches);

    let createdLog: ActivityLog | undefined;
    if (logData) {
      createdLog = StorageService.addActivityLog(logData);
    }

    if (isSupabaseConfigured()) {
      try {
        const batchRow = mapReturnBatchToDb(updatedBatch);
        Promise.allSettled([
          supabase.from('return_batches').update(batchRow).eq('id', batchId),
          createdLog ? supabase.from('activity_logs').insert(mapActivityLogToDb(createdLog)) : Promise.resolve(),
        ]).catch(err => console.warn('[DBService] Supabase write error on close batch:', err));
      } catch (e) {
        console.warn('[DBService] Supabase batch close error:', e);
      }
    }

    SyncService.broadcast('BATCH_CLOSED', {
      batchId,
      batch: updatedBatch,
      allBatches: allUpdatedBatches,
      log: createdLog,
    });
  },

  // Gate entry create
  async createGateEntry(
    newEntry: InwardGateEntry,
    allUpdatedEntries: InwardGateEntry[],
    logData?: Omit<ActivityLog, 'id' | 'timestamp'>
  ): Promise<void> {
    StorageService.saveGateEntries(allUpdatedEntries);

    let createdLog: ActivityLog | undefined;
    if (logData) {
      createdLog = StorageService.addActivityLog(logData);
    }

    if (isSupabaseConfigured()) {
      try {
        const entryRow = mapGateEntryToDb(newEntry);
        Promise.allSettled([
          supabase.from('inward_gate_entries').insert(entryRow),
          createdLog ? supabase.from('activity_logs').insert(mapActivityLogToDb(createdLog)) : Promise.resolve(),
        ]).catch(err => console.warn('[DBService] Supabase write error on gate entry create:', err));
      } catch (e) {
        console.warn('[DBService] Supabase gate entry create error:', e);
      }
    }

    SyncService.broadcast('GATE_ENTRY_CREATED', {
      entry: newEntry,
      allGateEntries: allUpdatedEntries,
      log: createdLog,
    });
  },

  // Gate entry update
  async updateGateEntry(
    id: string,
    updatedEntry: InwardGateEntry,
    allUpdatedEntries: InwardGateEntry[],
    logData?: Omit<ActivityLog, 'id' | 'timestamp'>
  ): Promise<void> {
    StorageService.saveGateEntries(allUpdatedEntries);

    let createdLog: ActivityLog | undefined;
    if (logData) {
      createdLog = StorageService.addActivityLog(logData);
    }

    if (isSupabaseConfigured()) {
      try {
        const entryRow = mapGateEntryToDb(updatedEntry);
        Promise.allSettled([
          supabase.from('inward_gate_entries').update(entryRow).eq('id', id),
          createdLog ? supabase.from('activity_logs').insert(mapActivityLogToDb(createdLog)) : Promise.resolve(),
        ]).catch(err => console.warn('[DBService] Supabase write error on gate entry update:', err));
      } catch (e) {
        console.warn('[DBService] Supabase gate entry update error:', e);
      }
    }

    SyncService.broadcast('GATE_ENTRY_UPDATED', {
      id,
      entry: updatedEntry,
      allGateEntries: allUpdatedEntries,
      log: createdLog,
    });
  },
};
