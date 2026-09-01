import { getSupabase, isSupabaseConfigured } from './supabase';
import { StorageService } from './storage';
import { SyncService } from './syncService';
import { mapDbToScannedItem, mapDbToReturnBatch, mapDbToGateEntry, mapDbToActivityLog } from './dbService';

export function startRealtimeSync() {
  if (!isSupabaseConfigured()) return;
  const client = getSupabase();
  if (!client) return;

  const channel = client
    .channel('emiza-global-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scanned_return_items' }, (payload) => {
      const items = StorageService.getScannedItems();
      if (payload.eventType === 'INSERT') {
        const newItem = mapDbToScannedItem(payload.new);
        if (!items.find(i => i.id === newItem.id)) {
          StorageService.saveScannedItems([newItem, ...items]);
          SyncService.broadcast('ITEM_SCANNED', { item: newItem, source: 'realtime' });
        }
      } else if (payload.eventType === 'UPDATE') {
        const updated = mapDbToScannedItem(payload.new);
        const idx = items.findIndex(i => i.id === updated.id);
        if (idx >= 0) { items[idx] = updated; StorageService.saveScannedItems([...items]); }
      } else if (payload.eventType === 'DELETE') {
        const id = payload.old.id;
        StorageService.saveScannedItems(items.filter(i => i.id !== id));
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'return_batches' }, (payload) => {
      const batches = StorageService.getReturnBatches();
      if (payload.eventType === 'INSERT') {
        const newBatch = mapDbToReturnBatch(payload.new);
        if (!batches.find(b => b.id === newBatch.id)) {
          StorageService.saveReturnBatches([newBatch, ...batches]);
          SyncService.broadcast('BATCH_CREATED', { batch: newBatch, source: 'realtime' });
        }
      } else if (payload.eventType === 'UPDATE') {
        const updated = mapDbToReturnBatch(payload.new);
        const idx = batches.findIndex(b => b.id === updated.id);
        if (idx >= 0) { batches[idx] = updated; StorageService.saveReturnBatches([...batches]); }
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inward_gate_entries' }, (payload) => {
      const entries = StorageService.getGateEntries();
      if (payload.eventType === 'INSERT') {
        const newEntry = mapDbToGateEntry(payload.new);
        if (!entries.find(e => e.id === newEntry.id)) {
          StorageService.saveGateEntries([newEntry, ...entries]);
          SyncService.broadcast('GATE_ENTRY_CREATED', { entry: newEntry, source: 'realtime' });
        }
      } else if (payload.eventType === 'UPDATE') {
        const updated = mapDbToGateEntry(payload.new);
        const idx = entries.findIndex(e => e.id === updated.id);
        if (idx >= 0) { entries[idx] = updated; StorageService.saveGateEntries([...entries]); }
      }
    })
    .subscribe((status) => {
      console.log('[Realtime] Subscription status:', status);
    });

  return () => { client.removeChannel(channel); };
}
