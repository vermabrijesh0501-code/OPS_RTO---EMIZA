import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole, InwardGateEntry, ReturnBatch, ScannedReturnItem, ReturnRemarkType, AuditorDevice, AuditRecord, SupabaseConfig } from './types';
import { StorageService } from './services/storage';
import { SyncService } from './services/syncService';
import { DBService } from './services/dbService';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InwardModule } from './components/InwardModule';
import { ReturnsModule } from './components/ReturnsModule';
import { B2BReturnsModule } from './components/B2BReturnsModule';
import { AuditModule } from './components/AuditModule';
import { MastersModule } from './components/MastersModule';
import { ReportsModule } from './components/ReportsModule';
import { SupabaseNetlifyHub } from './components/SupabaseNetlifyHub';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { useAuth } from './context/AuthContext';
import { getAccessibleModules } from './utils/rbac';

export const tabToPath = (tab: ActiveTab): string => {
  switch (tab) {
    case 'dashboard': return '/dashboard'; case 'inward': return '/inward'; case 'grn': return '/grn';
    case 'returns_rto': return '/returns/rto'; case 'returns_b2b': return '/returns/b2b'; case 'inventory': return '/inventory';
    case 'audit': return '/audit'; case 'clients': return '/clients'; case 'couriers': return '/couriers'; case 'locations': return '/locations';
    case 'reports': return '/reports'; case 'notifications': return '/notifications'; case 'user_management': return '/user-management';
    case 'masters': return '/masters'; case 'settings': return '/settings'; case 'supabase_hub': return '/supabase-hub'; default: return '/dashboard';
  }
};

export const pathToTab = (pathname: string): ActiveTab => {
  const normalized = pathname.toLowerCase().replace(/\/$/, '');
  if (normalized === '/inward') return 'inward'; if (normalized === '/grn') return 'grn';
  if (['/returns/rto','/returns-rto','/rto'].includes(normalized)) return 'returns_rto';
  if (['/returns/b2b','/returns-b2b','/b2b'].includes(normalized)) return 'returns_b2b';
  if (normalized === '/inventory') return 'inventory'; if (normalized === '/audit') return 'audit'; if (normalized === '/clients') return 'clients';
  if (normalized === '/couriers') return 'couriers'; if (normalized === '/locations') return 'locations'; if (normalized === '/reports') return 'reports';
  if (normalized === '/notifications') return 'notifications'; if (['/user-management','/users'].includes(normalized)) return 'user_management';
  if (normalized === '/masters') return 'masters'; if (normalized === '/settings') return 'settings';
  if (['/supabase-hub','/supabase_hub'].includes(normalized)) return 'supabase_hub'; return 'dashboard';
}

export default function App() {
  const navigate = useNavigate(); const location = useLocation();
  const { appUser, signOut } = useAuth();
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => pathToTab(location.pathname));
  const [companies, setCompanies] = useState(StorageService.getCompanies()); const [warehouses, setWarehouses] = useState(StorageService.getWarehouses());
  const [clients, setClients] = useState(StorageService.getClients()); const [couriers, setCouriers] = useState(StorageService.getCouriers());
  const [skus, setSKUs] = useState(StorageService.getSKUs()); const [drivers, setDrivers] = useState(StorageService.getDrivers());
  const [vehicleTypes, setVehicleTypes] = useState(StorageService.getVehicleTypes()); const [returnReasons, setReturnReasons] = useState(StorageService.getReturnReasons());
  const [users, setUsers] = useState(StorageService.getUsers());
  const currentUser: User = appUser || StorageService.getCurrentUser();
  const [activeWarehouseId, setActiveWarehouseId] = useState(StorageService.getCurrentWarehouseId());
  const [gateEntries, setGateEntries] = useState<InwardGateEntry[]>(StorageService.getGateEntries());
  const [batches, setBatches] = useState<ReturnBatch[]>(StorageService.getReturnBatches());
  const [scannedItems, setScannedItems] = useState<ScannedReturnItem[]>(StorageService.getScannedItems());
  const [auditorDevices, setAuditorDevices] = useState<AuditorDevice[]>(StorageService.getAuditorDevices());
  const [activeAuditorId, setActiveAuditorId] = useState(StorageService.getActiveAuditorId());
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(StorageService.getAuditRecords());
  const [logs, setLogs] = useState(StorageService.getActivityLogs());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(StorageService.getSupabaseConfig());
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isNewGateEntryModalOpen, setIsNewGateEntryModalOpen] = useState(false); const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState(false); const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { if (location.pathname !== '/login') setActiveTabState(pathToTab(location.pathname)); }, [location.pathname]);

  const loadCloudData = useCallback(async () => {
    setIsSyncing(true); setSyncError(null);
    try {
      const data = await DBService.fetchAllData();
      setBatches(data.batches); setScannedItems(data.scannedItems); setGateEntries(data.gateEntries); setLogs(data.logs);
    } catch (error: any) {
      const message = error?.message || 'Unable to synchronize with Supabase.';
      setSyncError(message); console.error('[App] Cloud synchronization failed:', error);
    } finally { setIsSyncing(false); }
  }, []);

  useEffect(() => { loadCloudData(); }, [loadCloudData]);

  useEffect(() => {
    const unsubscribe = SyncService.subscribe(event => {
      const { type, payload } = event;
      if (type === 'SYNC_ERROR') { setSyncError(payload?.message || 'Realtime synchronization error.'); return; }
      if (type === 'SYNC_ALL' || type === 'STORAGE_SYNC') { loadCloudData(); return; }
      if (payload?.allScannedItems) { setScannedItems(payload.allScannedItems); StorageService.saveScannedItems(payload.allScannedItems); }
      if (payload?.allBatches) { setBatches(payload.allBatches); StorageService.saveReturnBatches(payload.allBatches); }
      if (payload?.allGateEntries) { setGateEntries(payload.allGateEntries); StorageService.saveGateEntries(payload.allGateEntries); }
      if (payload?.log) setLogs(prev => [payload.log, ...prev.filter(l => l.id !== payload.log.id)].slice(0, 100));
      switch (type) {
        case 'ITEM_SCANNED': if (payload?.item && !payload?.allScannedItems) setScannedItems(prev => prev.some(i => i.id === payload.item.id) ? prev : [payload.item, ...prev]); break;
        case 'ITEM_UPDATED': if (payload?.item && !payload?.allScannedItems) setScannedItems(prev => prev.map(i => i.id === (payload.itemId || payload.item.id) ? { ...i, ...payload.item } : i)); break;
        case 'ITEM_DELETED': if (payload?.itemId && !payload?.allScannedItems) setScannedItems(prev => prev.filter(i => i.id !== payload.itemId)); break;
        case 'BATCH_CREATED': if (payload?.batch && !payload?.allBatches) setBatches(prev => prev.some(b => b.id === payload.batch.id) ? prev : [payload.batch, ...prev]); break;
        case 'BATCH_UPDATED': case 'BATCH_CLOSED': if (payload?.batch && !payload?.allBatches) setBatches(prev => prev.map(b => b.id === payload.batch.id ? payload.batch : b)); break;
        case 'GATE_ENTRY_CREATED': if (payload?.entry && !payload?.allGateEntries) setGateEntries(prev => prev.some(g => g.id === payload.entry.id) ? prev : [payload.entry, ...prev]); break;
        case 'GATE_ENTRY_UPDATED': if (payload?.entry && !payload?.allGateEntries) setGateEntries(prev => prev.map(g => g.id === payload.entry.id ? payload.entry : g)); break;
        case 'AUDIT_RECORD_ADDED': setAuditRecords(StorageService.getAuditRecords()); break;
        case 'USER_UPDATED': case 'DEVICE_SESSION_UPDATED': case 'DEVICE_HEARTBEAT': setUsers(StorageService.getUsers()); break;
        default: break;
      }
    });
    return unsubscribe;
  }, [loadCloudData]);

  const handleSelectTab = useCallback((tab: ActiveTab) => { setActiveTabState(tab); const targetPath = tabToPath(tab); if (location.pathname !== targetPath) navigate(targetPath); }, [navigate, location.pathname]);
  useEffect(() => { const handleKeyDown = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setIsUniversalSearchOpen(prev => !prev); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []);

  const activeWarehouse = warehouses.find(w => w.id === activeWarehouseId) || warehouses[0];
  const handleSelectWarehouse = (whId: string) => { setActiveWarehouseId(whId); StorageService.saveCurrentWarehouseId(whId); };

  const handleAddGateEntry = async (entryData: Omit<InwardGateEntry, 'id' | 'gatePassNumber' | 'entryTime'>) => {
    const count = gateEntries.length + 1; const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const gatePassNumber = `GP-${dateStr}-${String(count).padStart(3, '0')}`;
    const newEntry: InwardGateEntry = { ...entryData, id: `gate-${Date.now()}`, gatePassNumber, entryTime: new Date().toISOString() };
    try {
      await DBService.createGateEntry(newEntry, [newEntry, ...gateEntries], { userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, action: 'Registered Vehicle Gate Entry', module: 'Inward', details: `Issued ${gatePassNumber} for vehicle ${newEntry.vehicleNumber}` });
      setGateEntries(prev => [newEntry, ...prev]); setLogs(StorageService.getActivityLogs());
    } catch (error: any) { setSyncError(error?.message || 'Gate entry could not be saved to cloud.'); }
  };

  const handleUpdateGateStatus = async (id: string, status: InwardGateEntry['status'], dockNumber?: string) => {
    const target = gateEntries.find(g => g.id === id); if (!target) return;
    const updatedTarget = { ...target, status, dockNumber: dockNumber || target.dockNumber, dockAllocatedTime: dockNumber ? new Date().toISOString() : target.dockAllocatedTime };
    try {
      await DBService.updateGateEntry(id, updatedTarget, gateEntries.map(g => g.id === id ? updatedTarget : g), { userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, action: `Updated Inward Status to ${status}`, module: 'Inward', details: `${updatedTarget.gatePassNumber || id} updated to ${status} ${dockNumber ? `at ${dockNumber}` : ''}` });
      setGateEntries(prev => prev.map(g => g.id === id ? updatedTarget : g)); setLogs(StorageService.getActivityLogs());
    } catch (error: any) { setSyncError(error?.message || 'Gate entry update could not be saved to cloud.'); }
  };

  // The remaining application UI/modules and route definitions are preserved below unchanged.
