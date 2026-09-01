import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  UserRole,
  InwardGateEntry,
  ReturnBatch,
  ScannedReturnItem,
  ReturnRemarkType,
  AuditorDevice,
  AuditRecord,
  SupabaseConfig,
} from './types';
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
import { SettingsModule } from './components/SettingsModule';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { useAuth } from './context/AuthContext';
import { getAccessibleModules } from './utils/rbac';

// Tab to URL Route Path helper
export const tabToPath = (tab: ActiveTab): string => {
  switch (tab) {
    case 'dashboard':
      return '/dashboard';
    case 'inward':
      return '/inward';
    case 'grn':
      return '/grn';
    case 'returns_rto':
      return '/returns/rto';
    case 'returns_b2b':
      return '/returns/b2b';
    case 'inventory':
      return '/inventory';
    case 'audit':
      return '/audit';
    case 'clients':
      return '/clients';
    case 'couriers':
      return '/couriers';
    case 'locations':
      return '/locations';
    case 'reports':
      return '/reports';
    case 'notifications':
      return '/notifications';
    case 'user_management':
      return '/user-management';
    case 'masters':
      return '/masters';
    case 'settings':
      return '/settings';
    case 'supabase_hub':
      return '/supabase-hub';
    default:
      return '/dashboard';
  }
};

// URL Route Path to Tab helper
export const pathToTab = (pathname: string): ActiveTab => {
  const normalized = pathname.toLowerCase().replace(/\/$/, '');
  if (normalized === '/inward') return 'inward';
  if (normalized === '/grn') return 'grn';
  if (normalized === '/returns/rto' || normalized === '/returns-rto' || normalized === '/rto') return 'returns_rto';
  if (normalized === '/returns/b2b' || normalized === '/returns-b2b' || normalized === '/b2b') return 'returns_b2b';
  if (normalized === '/inventory') return 'inventory';
  if (normalized === '/audit') return 'audit';
  if (normalized === '/clients') return 'clients';
  if (normalized === '/couriers') return 'couriers';
  if (normalized === '/locations') return 'locations';
  if (normalized === '/reports') return 'reports';
  if (normalized === '/notifications') return 'notifications';
  if (normalized === '/user-management' || normalized === '/users') return 'user_management';
  if (normalized === '/masters') return 'masters';
  if (normalized === '/settings') return 'settings';
  if (normalized === '/supabase-hub' || normalized === '/supabase_hub') return 'supabase_hub';
  return 'dashboard';
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appUser, signOut, switchUserRole: authSwitchUserRole } = useAuth();

  // Navigation & View State derived from URL
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => pathToTab(location.pathname));

  // Master State
  const [companies, setCompanies] = useState(StorageService.getCompanies());
  const [warehouses, setWarehouses] = useState(StorageService.getWarehouses());
  const [clients, setClients] = useState(StorageService.getClients());
  const [couriers, setCouriers] = useState(StorageService.getCouriers());
  const [skus, setSKUs] = useState(StorageService.getSKUs());
  const [drivers, setDrivers] = useState(StorageService.getDrivers());
  const [vehicleTypes, setVehicleTypes] = useState(StorageService.getVehicleTypes());
  const [returnReasons, setReturnReasons] = useState(StorageService.getReturnReasons());
  const [users, setUsers] = useState(StorageService.getUsers());

  // Active Session & Operating Warehouse
  const currentUser: User = appUser || StorageService.getCurrentUser();
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(StorageService.getCurrentWarehouseId());

  // Operations State
  const [gateEntries, setGateEntries] = useState<InwardGateEntry[]>(StorageService.getGateEntries());
  const [batches, setBatches] = useState<ReturnBatch[]>(StorageService.getReturnBatches());
  const [scannedItems, setScannedItems] = useState<ScannedReturnItem[]>(StorageService.getScannedItems());
  const [auditorDevices, setAuditorDevices] = useState<AuditorDevice[]>(StorageService.getAuditorDevices());
  const [activeAuditorId, setActiveAuditorId] = useState<string>(StorageService.getActiveAuditorId());
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(StorageService.getAuditRecords());
  const [logs, setLogs] = useState(StorageService.getActivityLogs());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(StorageService.getSupabaseConfig());

  // Modal Controls
  const [isNewGateEntryModalOpen, setIsNewGateEntryModalOpen] = useState(false);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync activeTab when URL pathname changes
  useEffect(() => {
    if (location.pathname !== '/login') {
      const derived = pathToTab(location.pathname);
      setActiveTabState(derived);
    }
  }, [location.pathname]);

  // Fetch initial cloud state from Supabase if connected
  useEffect(() => {
    DBService.fetchAllData().then(data => {
      if (data.batches && data.batches.length > 0) setBatches(data.batches);
      if (data.scannedItems && data.scannedItems.length > 0) setScannedItems(data.scannedItems);
      if (data.gateEntries && data.gateEntries.length > 0) setGateEntries(data.gateEntries);
      if (data.logs && data.logs.length > 0) setLogs(data.logs);
    });
  }, []);

  // Real-time Cross-Device Synchronization Subscriber
  useEffect(() => {
    const unsubscribe = SyncService.subscribe(event => {
      const { type, payload } = event;

      // If full array state is passed in payload, apply immediately
      if (payload?.allScannedItems) {
        setScannedItems(payload.allScannedItems);
        StorageService.saveScannedItems(payload.allScannedItems);
      }
      if (payload?.allBatches) {
        setBatches(payload.allBatches);
        StorageService.saveReturnBatches(payload.allBatches);
      }
      if (payload?.allGateEntries) {
        setGateEntries(payload.allGateEntries);
        StorageService.saveGateEntries(payload.allGateEntries);
      }
      if (payload?.log) {
        setLogs(prev => [payload.log, ...prev.filter(l => l.id !== payload.log.id)].slice(0, 100));
      }

      switch (type) {
        case 'ITEM_SCANNED': {
          if (payload?.item && !payload?.allScannedItems) {
            setScannedItems(prev => {
              const exists = prev.some(i => i.id === payload.item.id || (i.batchId === payload.item.batchId && i.trackingNumber === payload.item.trackingNumber));
              if (exists) return prev;
              const next = [payload.item, ...prev];
              StorageService.saveScannedItems(next);
              return next;
            });
            if (payload?.batch) {
              setBatches(prev => {
                const next = prev.map(b => b.id === payload.batch.id ? payload.batch : b);
                StorageService.saveReturnBatches(next);
                return next;
              });
            }
          }
          break;
        }

        case 'ITEM_UPDATED': {
          if (payload?.item && !payload?.allScannedItems) {
            setScannedItems(prev => {
              const next = prev.map(i => i.id === (payload.itemId || payload.item.id) ? { ...i, ...payload.item } : i);
              StorageService.saveScannedItems(next);
              return next;
            });
            if (payload?.batch) {
              setBatches(prev => {
                const next = prev.map(b => b.id === payload.batch.id ? payload.batch : b);
                StorageService.saveReturnBatches(next);
                return next;
              });
            }
          }
          break;
        }

        case 'ITEM_DELETED': {
          if (payload?.itemId && !payload?.allScannedItems) {
            setScannedItems(prev => {
              const next = prev.filter(i => i.id !== payload.itemId);
              StorageService.saveScannedItems(next);
              return next;
            });
            if (payload?.batch) {
              setBatches(prev => {
                const next = prev.map(b => b.id === payload.batch.id ? payload.batch : b);
                StorageService.saveReturnBatches(next);
                return next;
              });
            }
          }
          break;
        }

        case 'BATCH_CREATED': {
          if (payload?.batch && !payload?.allBatches) {
            setBatches(prev => {
              if (prev.some(b => b.id === payload.batch.id)) return prev;
              const next = [payload.batch, ...prev];
              StorageService.saveReturnBatches(next);
              return next;
            });
          }
          break;
        }

        case 'BATCH_UPDATED':
        case 'BATCH_CLOSED': {
          if (payload?.batch && !payload?.allBatches) {
            setBatches(prev => {
              const next = prev.map(b => b.id === payload.batch.id ? payload.batch : b);
              StorageService.saveReturnBatches(next);
              return next;
            });
          }
          break;
        }

        case 'GATE_ENTRY_CREATED': {
          if (payload?.entry && !payload?.allGateEntries) {
            setGateEntries(prev => {
              if (prev.some(g => g.id === payload.entry.id)) return prev;
              const next = [payload.entry, ...prev];
              StorageService.saveGateEntries(next);
              return next;
            });
          }
          break;
        }

        case 'GATE_ENTRY_UPDATED': {
          if (payload?.entry && !payload?.allGateEntries) {
            setGateEntries(prev => {
              const next = prev.map(g => g.id === payload.entry.id ? payload.entry : g);
              StorageService.saveGateEntries(next);
              return next;
            });
          }
          break;
        }

        case 'AUDIT_RECORD_ADDED':
          setAuditRecords(StorageService.getAuditRecords());
          break;

        case 'USER_UPDATED':
        case 'DEVICE_SESSION_UPDATED':
        case 'DEVICE_HEARTBEAT':
          setUsers(StorageService.getUsers());
          break;

        case 'SYNC_ALL':
        case 'STORAGE_SYNC':
          DBService.fetchAllData().then(data => {
            if (data.batches) setBatches(data.batches);
            if (data.scannedItems) setScannedItems(data.scannedItems);
            if (data.gateEntries) setGateEntries(data.gateEntries);
            if (data.logs) setLogs(data.logs);
          });
          break;

        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Navigate tab function that updates URL and state
  const handleSelectTab = useCallback(
    (tab: ActiveTab) => {
      setActiveTabState(tab);
      const targetPath = tabToPath(tab);
      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    },
    [navigate, location.pathname]
  );

  // Keyboard shortcut Ctrl+K for Universal Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsUniversalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeWarehouse = warehouses.find(w => w.id === activeWarehouseId) || warehouses[0];

  // Role Switcher Persona Helper
  const handleSwitchUserRole = (role: UserRole) => {
    authSwitchUserRole(role);
    setLogs(StorageService.getActivityLogs());
  };

  // Select Operating Warehouse
  const handleSelectWarehouse = (whId: string) => {
    setActiveWarehouseId(whId);
    StorageService.saveCurrentWarehouseId(whId);
  };

  // Add Gate Entry
  const handleAddGateEntry = (entryData: Omit<InwardGateEntry, 'id' | 'gatePassNumber' | 'entryTime'>) => {
    const count = gateEntries.length + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const gatePassNumber = `GP-${dateStr}-${String(count).padStart(3, '0')}`;

    const newEntry: InwardGateEntry = {
      ...entryData,
      id: `gate-${Date.now()}`,
      gatePassNumber,
      entryTime: new Date().toISOString(),
    };

    const updated = [newEntry, ...gateEntries];
    setGateEntries(updated);

    DBService.createGateEntry(newEntry, updated, {
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Registered Vehicle Gate Entry',
      module: 'Inward',
      details: `Issued ${gatePassNumber} for vehicle ${newEntry.vehicleNumber}`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  // Update Gate Status
  const handleUpdateGateStatus = (id: string, status: InwardGateEntry['status'], dockNumber?: string) => {
    let updatedTarget: InwardGateEntry | undefined;
    const updated = gateEntries.map(g => {
      if (g.id === id) {
        updatedTarget = {
          ...g,
          status,
          dockNumber: dockNumber || g.dockNumber,
          dockAllocatedTime: dockNumber ? new Date().toISOString() : g.dockAllocatedTime,
        };
        return updatedTarget;
      }
      return g;
    });

    setGateEntries(updated);

    if (updatedTarget) {
      DBService.updateGateEntry(id, updatedTarget, updated, {
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: `Updated Inward Status to ${status}`,
        module: 'Inward',
        details: `${updatedTarget.gatePassNumber || id} updated to ${status} ${dockNumber ? `at ${dockNumber}` : ''}`,
      });
    }
    setLogs(StorageService.getActivityLogs());
  };

  // Add Return Batch (Format: DD-account reference - serial no 0101, e.g. 22-BV-0101)
  const handleAddBatch = (
    batchData: Omit<ReturnBatch, 'id' | 'batchNumber' | 'totalScanned' | 'remarksBreakdown' | 'createdAt'>
  ): ReturnBatch => {
    const today = new Date();
    const dayStr = String(today.getDate()).padStart(2, '0');
    
    // Find client code / reference (e.g. BV, NYK, MME, BOAT, SUG)
    const client = clients.find(c => c.id === batchData.clientId);
    const clientRef = (client?.code || 'ACC').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();

    // Calculate serial number for this client (0101, 0102, ...)
    const clientExistingBatches = batches.filter(b => b.clientId === batchData.clientId);
    const serialNumber = String(101 + clientExistingBatches.length).padStart(4, '0');

    const batchNumber = `${dayStr}-${clientRef}-${serialNumber}`;

    const newBatch: ReturnBatch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      batchNumber,
      totalScanned: 0,
      remarksBreakdown: {
        Good: 0,
        Damage: 0,
        'Open Box': 0,
        'Wrong Product': 0,
        'Short Qty': 0,
        'Missing Product': 0,
        Others: 0,
      },
      createdAt: new Date().toISOString(),
    };

    const updated = [newBatch, ...batches];
    setBatches(updated);

    DBService.createBatch(newBatch, updated, {
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Initialized Return Batch',
      module: batchData.batchType === 'B2B Return' ? 'B2B' : 'RTO',
      details: `Created batch ${batchNumber} for ${client?.name || clientRef}`,
    });
    setLogs(StorageService.getActivityLogs());

    return newBatch;
  };

  // Barcode Gun Item Scan with Duplicate Check & Cross-Device Live Sync
  const handleScanItem = (
    batchId: string,
    trackingNumber: string,
    remark: ReturnRemarkType,
    photoUrl?: string
  ): { success: boolean; message: string; item?: ScannedReturnItem } => {
    const isDuplicateInBatch = scannedItems.some(
      i => i.batchId === batchId && i.trackingNumber.toUpperCase() === trackingNumber.toUpperCase()
    );

    if (isDuplicateInBatch) {
      return {
        success: false,
        message: `DUPLICATE DETECTED: Barcode ${trackingNumber} was ALREADY scanned in this batch!`,
      };
    }

    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch) return { success: false, message: 'Batch not found.' };

    const newItem: ScannedReturnItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      batchId,
      trackingNumber,
      orderNumber: `ORD-${trackingNumber.slice(-6)}`,
      remark,
      photoUrl,
      scannedAt: new Date().toISOString(),
      scannedBy: currentUser.id,
      scannedByName: currentUser.name,
    };

    const updatedItems = [newItem, ...scannedItems];
    setScannedItems(updatedItems);

    let updatedTargetBatch: ReturnBatch = targetBatch;
    const updatedBatches = batches.map(b => {
      if (b.id === batchId) {
        const newBreakdown = { ...b.remarksBreakdown };
        newBreakdown[remark] = (newBreakdown[remark] || 0) + 1;
        updatedTargetBatch = {
          ...b,
          totalScanned: b.totalScanned + 1,
          remarksBreakdown: newBreakdown,
        };
        return updatedTargetBatch;
      }
      return b;
    });

    setBatches(updatedBatches);

    // Persist to Cloud & Broadcast to all authorized devices
    DBService.recordScanItem(
      newItem,
      updatedTargetBatch,
      updatedItems,
      updatedBatches,
      {
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Scanned AWB Barcode',
        module: targetBatch.batchType === 'B2B Return' ? 'B2B' : 'RTO',
        details: `Scanned AWB #${trackingNumber} [${remark}] in ${targetBatch.batchNumber}`,
      }
    );
    setLogs(StorageService.getActivityLogs());

    return {
      success: true,
      message: `SCANNED SUCCESSFULLY: AWB ${trackingNumber} recorded as [${remark}]`,
      item: newItem,
    };
  };

  // Update Scanned Return Item (AWB / Remark condition)
  const handleUpdateItem = (
    itemId: string,
    updates: { trackingNumber?: string; remark?: ReturnRemarkType }
  ) => {
    const targetItem = scannedItems.find(i => i.id === itemId);
    if (!targetItem) return;

    const oldRemark = targetItem.remark;
    const newRemark = updates.remark || oldRemark;
    const oldTracking = targetItem.trackingNumber;
    const newTracking = updates.trackingNumber ? updates.trackingNumber.trim().toUpperCase() : oldTracking;

    let updatedItem: ScannedReturnItem = {
      ...targetItem,
      trackingNumber: newTracking,
      remark: newRemark,
    };

    const updatedItems = scannedItems.map(item => {
      if (item.id === itemId) {
        return updatedItem;
      }
      return item;
    });

    setScannedItems(updatedItems);

    let updatedTargetBatch = batches.find(b => b.id === targetItem.batchId)!;
    let updatedBatches = batches;

    if (oldRemark !== newRemark) {
      updatedBatches = batches.map(b => {
        if (b.id === targetItem.batchId) {
          const newBreakdown = { ...b.remarksBreakdown };
          newBreakdown[oldRemark] = Math.max(0, (newBreakdown[oldRemark] || 1) - 1);
          newBreakdown[newRemark] = (newBreakdown[newRemark] || 0) + 1;
          updatedTargetBatch = {
            ...b,
            remarksBreakdown: newBreakdown,
          };
          return updatedTargetBatch;
        }
        return b;
      });
      setBatches(updatedBatches);
    }

    DBService.updateScanItem(
      itemId,
      updatedItem,
      updatedTargetBatch,
      updatedItems,
      updatedBatches,
      {
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Edited Scanned Item',
        module: 'RTO',
        details: `Updated item AWB to ${newTracking} [${newRemark}]`,
      }
    );
    setLogs(StorageService.getActivityLogs());
  };

  // Delete Scanned Return Item
  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = scannedItems.find(i => i.id === itemId);
    if (!itemToDelete) return;

    const updatedItems = scannedItems.filter(i => i.id !== itemId);
    setScannedItems(updatedItems);

    let updatedTargetBatch = batches.find(b => b.id === itemToDelete.batchId)!;
    const updatedBatches = batches.map(b => {
      if (b.id === itemToDelete.batchId) {
        const newBreakdown = { ...b.remarksBreakdown };
        newBreakdown[itemToDelete.remark] = Math.max(0, (newBreakdown[itemToDelete.remark] || 1) - 1);
        updatedTargetBatch = {
          ...b,
          totalScanned: Math.max(0, b.totalScanned - 1),
          remarksBreakdown: newBreakdown,
        };
        return updatedTargetBatch;
      }
      return b;
    });

    setBatches(updatedBatches);

    DBService.deleteScanItem(
      itemId,
      itemToDelete.batchId,
      updatedTargetBatch,
      updatedItems,
      updatedBatches,
      {
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Deleted Scanned AWB',
        module: 'RTO',
        details: `Removed AWB #${itemToDelete.trackingNumber} from batch`,
      }
    );
    setLogs(StorageService.getActivityLogs());
  };

  // Close Return Batch with Driver/Supervisor Acknowledgement
  const handleCloseBatch = (
    batchId: string,
    signData: {
      driverName: string;
      driverMobile: string;
      driverSignature: string;
      supervisorSigner: string;
      notes?: string;
    }
  ) => {
    let closedTargetBatch: ReturnBatch | undefined;
    const updated = batches.map(b => {
      if (b.id === batchId) {
        closedTargetBatch = {
          ...b,
          status: 'Closed' as const,
          closedAt: new Date().toISOString(),
          driverName: signData.driverName,
          driverMobile: signData.driverMobile,
          driverSignature: signData.driverSignature,
          supervisorSigner: signData.supervisorSigner,
          notes: signData.notes,
        };
        return closedTargetBatch;
      }
      return b;
    });

    setBatches(updated);

    if (closedTargetBatch) {
      DBService.closeBatch(batchId, closedTargetBatch, updated, {
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Closed & Reconciled Return Batch',
        module: closedTargetBatch.batchType === 'B2B Return' ? 'B2B' : 'RTO',
        details: `Batch ${closedTargetBatch.batchNumber || batchId} closed with ${closedTargetBatch.totalScanned || 0} units. Driver: ${signData.driverName}`,
      });
    }
    setLogs(StorageService.getActivityLogs());
  };

  // Audit Guns & Physical Inventory Management
  const handleSelectAuditorId = (id: string) => {
    setActiveAuditorId(id);
    StorageService.saveActiveAuditorId(id);
  };

  const handleAddAuditRecord = (record: Omit<AuditRecord, 'id' | 'scannedAt'>): AuditRecord => {
    const newRecord = StorageService.addAuditRecord(record);
    setAuditRecords(StorageService.getAuditRecords());

    setAuditorDevices(prev =>
      prev.map(d =>
        d.id === record.auditorDeviceId
          ? { ...d, lastActiveAt: new Date().toISOString(), status: 'Active' }
          : d
      )
    );

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Audited Inventory SKU',
      module: 'Audit',
      details: `Gun ${record.auditorDeviceId} scanned ${record.quantity} units of SKU ${record.skuCode} at ${record.location}`,
    });
    setLogs(StorageService.getActivityLogs());

    return newRecord;
  };

  const handleDeleteAuditRecord = (id: string) => {
    const current = StorageService.getAuditRecords();
    const target = current.find(r => r.id === id);
    const updated = current.filter(r => r.id !== id);
    StorageService.saveAuditRecords(updated);
    setAuditRecords(updated);

    if (target) {
      StorageService.addActivityLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Deleted Audit Scan Record',
        module: 'Audit',
        details: `Deleted scan record for SKU ${target.skuCode} at ${target.location}`,
      });
      setLogs(StorageService.getActivityLogs());
    }
  };

  const handleUpdateAuditorDevices = (devices: AuditorDevice[]) => {
    setAuditorDevices(devices);
    StorageService.saveAuditorDevices(devices);
  };

  // Master Data Add/Update/Delete/Toggle Handlers
  const handleAddMasterRecord = (category: string, record: any) => {
    const id = `${category.slice(0, 3)}-${Date.now()}`;
    const newRecord = { ...record, id, status: 'Active' };

    if (category === 'companies') {
      const updated = [newRecord, ...companies];
      setCompanies(updated);
      StorageService.saveCompanies(updated);
    } else if (category === 'warehouses') {
      const updated = [newRecord, ...warehouses];
      setWarehouses(updated);
      StorageService.saveWarehouses(updated);
    } else if (category === 'clients') {
      const updated = [newRecord, ...clients];
      setClients(updated);
      StorageService.saveClients(updated);
    } else if (category === 'couriers') {
      const updated = [newRecord, ...couriers];
      setCouriers(updated);
      StorageService.saveCouriers(updated);
    } else if (category === 'skus') {
      const updated = [newRecord, ...skus];
      setSKUs(updated);
      StorageService.saveSKUs(updated);
    } else if (category === 'users') {
      const updated = [newRecord, ...users];
      setUsers(updated);
      StorageService.saveUsers(updated);
    } else if (category === 'drivers') {
      const updated = [newRecord, ...drivers];
      setDrivers(updated);
      StorageService.saveDrivers(updated);
    } else if (category === 'vehicle_types') {
      const updated = [newRecord, ...vehicleTypes];
      setVehicleTypes(updated);
      StorageService.saveVehicleTypes(updated);
    } else if (category === 'return_reasons') {
      const updated = [newRecord, ...returnReasons];
      setReturnReasons(updated);
      StorageService.saveReturnReasons(updated);
    }

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `Created Master Entry in ${category}`,
      module: 'Masters',
      details: `Added new ${category} record: ${record.name || record.code || record.label || record.typeName || record.skuCode}`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  const handleUpdateMasterRecord = (category: string, id: string, updates: any) => {
    if (category === 'companies') {
      const updated = companies.map(c => (c.id === id ? { ...c, ...updates } : c));
      setCompanies(updated);
      StorageService.saveCompanies(updated);
    } else if (category === 'warehouses') {
      const updated = warehouses.map(w => (w.id === id ? { ...w, ...updates } : w));
      setWarehouses(updated);
      StorageService.saveWarehouses(updated);
    } else if (category === 'clients') {
      const updated = clients.map(c => (c.id === id ? { ...c, ...updates } : c));
      setClients(updated);
      StorageService.saveClients(updated);
    } else if (category === 'couriers') {
      const updated = couriers.map(c => (c.id === id ? { ...c, ...updates } : c));
      setCouriers(updated);
      StorageService.saveCouriers(updated);
    } else if (category === 'skus') {
      const updated = skus.map(s => (s.id === id ? { ...s, ...updates } : s));
      setSKUs(updated);
      StorageService.saveSKUs(updated);
    } else if (category === 'users') {
      const updated = users.map(u => (u.id === id ? { ...u, ...updates } : u));
      setUsers(updated);
      StorageService.saveUsers(updated);
    } else if (category === 'drivers') {
      const updated = drivers.map(d => (d.id === id ? { ...d, ...updates } : d));
      setDrivers(updated);
      StorageService.saveDrivers(updated);
    } else if (category === 'vehicle_types') {
      const updated = vehicleTypes.map(v => (v.id === id ? { ...v, ...updates } : v));
      setVehicleTypes(updated);
      StorageService.saveVehicleTypes(updated);
    } else if (category === 'return_reasons') {
      const updated = returnReasons.map(r => (r.id === id ? { ...r, ...updates } : r));
      setReturnReasons(updated);
      StorageService.saveReturnReasons(updated);
    }

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `Updated Master Entry in ${category}`,
      module: 'Masters',
      details: `Modified record ID ${id}`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  const handleDeleteMasterRecord = (category: string, id: string) => {
    if (category === 'companies') {
      const updated = companies.filter(c => c.id !== id);
      setCompanies(updated);
      StorageService.saveCompanies(updated);
    } else if (category === 'warehouses') {
      const updated = warehouses.filter(w => w.id !== id);
      setWarehouses(updated);
      StorageService.saveWarehouses(updated);
    } else if (category === 'clients') {
      const updated = clients.filter(c => c.id !== id);
      setClients(updated);
      StorageService.saveClients(updated);
    } else if (category === 'couriers') {
      const updated = couriers.filter(c => c.id !== id);
      setCouriers(updated);
      StorageService.saveCouriers(updated);
    } else if (category === 'skus') {
      const updated = skus.filter(s => s.id !== id);
      setSKUs(updated);
      StorageService.saveSKUs(updated);
    } else if (category === 'users') {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      StorageService.saveUsers(updated);
    } else if (category === 'drivers') {
      const updated = drivers.filter(d => d.id !== id);
      setDrivers(updated);
      StorageService.saveDrivers(updated);
    } else if (category === 'vehicle_types') {
      const updated = vehicleTypes.filter(v => v.id !== id);
      setVehicleTypes(updated);
      StorageService.saveVehicleTypes(updated);
    } else if (category === 'return_reasons') {
      const updated = returnReasons.filter(r => r.id !== id);
      setReturnReasons(updated);
      StorageService.saveReturnReasons(updated);
    }

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `Deleted Master Entry in ${category}`,
      module: 'Masters',
      details: `Removed record ID ${id}`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  const handleToggleHoldMasterRecord = (category: string, id: string, newStatus: string) => {
    if (category === 'companies') {
      const updated = companies.map(c => {
        if (c.id === id) {
          const toggled = c.status === 'Active' ? 'On Hold' : 'Active';
          return { ...c, status: toggled as any };
        }
        return c;
      });
      setCompanies(updated);
      StorageService.saveCompanies(updated);
    } else if (category === 'warehouses') {
      const updated = warehouses.map(w => {
        if (w.id === id) {
          const toggled = w.status === 'Active' ? 'On Hold' : 'Active';
          return { ...w, status: toggled as any };
        }
        return w;
      });
      setWarehouses(updated);
      StorageService.saveWarehouses(updated);
    } else if (category === 'clients') {
      const updated = clients.map(c => {
        if (c.id === id) {
          const toggled = c.status === 'Active' ? 'On Hold' : 'Active';
          return { ...c, status: toggled as any };
        }
        return c;
      });
      setClients(updated);
      StorageService.saveClients(updated);
    } else if (category === 'couriers') {
      const updated = couriers.map(c => {
        if (c.id === id) {
          const toggled = c.status === 'Active' ? 'On Hold' : 'Active';
          return { ...c, status: toggled as any };
        }
        return c;
      });
      setCouriers(updated);
      StorageService.saveCouriers(updated);
    } else if (category === 'skus') {
      const updated = skus.map(s => {
        if (s.id === id) {
          const toggled = s.status === 'Active' ? 'On Hold' : 'Active';
          return { ...s, status: toggled as any };
        }
        return s;
      });
      setSKUs(updated);
      StorageService.saveSKUs(updated);
    } else if (category === 'users') {
      const updated = users.map(u => {
        if (u.id === id) {
          const toggled = u.status === 'Active' ? 'Inactive' : 'Active';
          return { ...u, status: toggled as any };
        }
        return u;
      });
      setUsers(updated);
      StorageService.saveUsers(updated);
    } else if (category === 'drivers') {
      const updated = drivers.map(d => {
        if (d.id === id) {
          const toggled = d.status === 'Active' ? 'On Hold' : 'Active';
          return { ...d, status: toggled as any };
        }
        return d;
      });
      setDrivers(updated);
      StorageService.saveDrivers(updated);
    } else if (category === 'vehicle_types') {
      const updated = vehicleTypes.map(v => {
        if (v.id === id) {
          const toggled = v.status === 'Active' ? 'On Hold' : 'Active';
          return { ...v, status: toggled as any };
        }
        return v;
      });
      setVehicleTypes(updated);
      StorageService.saveVehicleTypes(updated);
    } else if (category === 'return_reasons') {
      const updated = returnReasons.map(r => {
        if (r.id === id) {
          const toggled = r.status === 'Active' ? 'On Hold' : 'Active';
          return { ...r, status: toggled as any };
        }
        return r;
      });
      setReturnReasons(updated);
      StorageService.saveReturnReasons(updated);
    }

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `Toggled Hold Status for ${category}`,
      module: 'Masters',
      details: `Record ID ${id} is now ${newStatus}`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  // Save Supabase Config
  const handleSaveSupabaseConfig = (cfg: SupabaseConfig) => {
    setSupabaseConfig(cfg);
    StorageService.saveSupabaseConfig(cfg);
  };

  // Navigation shortcut helper
  const handleUniversalSelectResult = (type: 'inward' | 'rto') => {
    if (type === 'inward') {
      handleSelectTab('inward');
    } else {
      handleSelectTab('returns_rto');
    }
  };

  const openBatchCount = batches.filter(
    b => b.warehouseId === activeWarehouse.id && b.status === 'Open'
  ).length;

  const pendingGateEntriesCount = gateEntries.filter(
    g => g.warehouseId === activeWarehouse.id && g.status !== 'Completed'
  ).length;

  // Auto-switch tab if current user loses permission for activeTab
  useEffect(() => {
    if (!currentUser) return;
    const accessible = getAccessibleModules(currentUser);
    if (!accessible.includes(activeTab)) {
      handleSelectTab(accessible[0] || 'dashboard');
    }
  }, [currentUser, activeTab, handleSelectTab]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  // Primary Protected Warehouse Layout Wrapper
  const renderAppLayout = (viewTab: ActiveTab) => (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B131E] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#123B5D] selection:text-white flex flex-col w-full max-w-full overflow-x-hidden transition-colors">
      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        onSwitchUserRole={handleSwitchUserRole}
        warehouses={warehouses}
        activeWarehouseId={activeWarehouseId}
        onSelectWarehouse={handleSelectWarehouse}
        onOpenUniversalSearch={() => setIsUniversalSearchOpen(true)}
        onOpenSupabaseHub={() => handleSelectTab('supabase_hub')}
        supabaseStatus={supabaseConfig.connectedStatus}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
        activeTab={viewTab}
        onPrimaryAction={() => {
          if (viewTab === 'dashboard' || viewTab === 'inward' || viewTab === 'grn') {
            setIsNewGateEntryModalOpen(true);
          } else if (viewTab === 'returns_rto' || viewTab === 'returns_b2b') {
            setIsNewBatchModalOpen(true);
          } else if (viewTab === 'inventory' || viewTab === 'audit') {
            handleSelectTab('inventory');
          } else {
            setIsNewGateEntryModalOpen(true);
          }
        }}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Left Sidebar Navigation */}
        <Sidebar
          activeTab={viewTab}
          onSelectTab={handleSelectTab}
          openBatchCount={openBatchCount}
          pendingGateEntriesCount={pendingGateEntriesCount}
          auditCount={auditRecords.length}
          activeWarehouseCode={activeWarehouse?.code || 'WH-MAIN-01'}
          activeWarehouseName={activeWarehouse?.name || 'Bhiwandi Central Hub'}
          currentUser={currentUser}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
          onOpenUniversalSearch={() => setIsUniversalSearchOpen(true)}
        />

        {/* Main Content View Container */}
        <main className="flex-1 overflow-y-auto bg-[#070D18] min-h-[calc(100vh-53px)] transition-colors">
          <div className="p-3 sm:p-5 lg:p-6 max-w-[1600px] mx-auto w-full">
            {viewTab === 'dashboard' && (
              <DashboardView
                warehouse={activeWarehouse}
                allWarehouses={warehouses}
                companies={companies}
                clients={clients}
                gateEntries={gateEntries}
                batches={batches}
                scannedItems={scannedItems}
                auditorDevices={auditorDevices}
                auditRecords={auditRecords}
                logs={logs}
                currentUser={currentUser}
                onNavigateTab={tab => handleSelectTab(tab)}
                onOpenNewGateEntryModal={() => setIsNewGateEntryModalOpen(true)}
                onOpenNewBatchModal={() => setIsNewBatchModalOpen(true)}
                onSelectWarehouse={handleSelectWarehouse}
              />
            )}

            {(viewTab === 'inward' || viewTab === 'grn') && (
              <InwardModule
                currentUser={currentUser}
                activeWarehouse={activeWarehouse}
                gateEntries={gateEntries}
                clients={clients}
                couriers={couriers}
                vehicleTypes={vehicleTypes}
                onAddGateEntry={handleAddGateEntry}
                onUpdateGateStatus={handleUpdateGateStatus}
                isOpenCreateModal={isNewGateEntryModalOpen}
                onCloseCreateModal={() => setIsNewGateEntryModalOpen(!isNewGateEntryModalOpen)}
              />
            )}

            {viewTab === 'returns_rto' && (
              <ReturnsModule
                currentUser={currentUser}
                activeWarehouse={activeWarehouse}
                batches={batches}
                scannedItems={scannedItems}
                clients={clients}
                couriers={couriers}
                onAddBatch={handleAddBatch}
                onScanItem={handleScanItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onCloseBatch={handleCloseBatch}
                isOpenCreateModal={isNewBatchModalOpen}
                onCloseCreateModal={() => setIsNewBatchModalOpen(!isNewBatchModalOpen)}
              />
            )}

            {viewTab === 'returns_b2b' && (
              <B2BReturnsModule
                currentUser={currentUser}
                activeWarehouse={activeWarehouse}
                batches={batches}
                scannedItems={scannedItems}
                clients={clients}
                couriers={couriers}
                onOpenNewBatchModal={() => setIsNewBatchModalOpen(true)}
              />
            )}

            {(viewTab === 'audit' || viewTab === 'inventory') && (
              <AuditModule
                clients={clients}
                skus={skus}
                auditorDevices={auditorDevices}
                auditRecords={auditRecords}
                activeAuditorId={activeAuditorId}
                onSelectAuditorId={handleSelectAuditorId}
                onAddAuditRecord={handleAddAuditRecord}
                onDeleteAuditRecord={handleDeleteAuditRecord}
                onUpdateAuditorDevices={handleUpdateAuditorDevices}
              />
            )}

            {(viewTab === 'masters' ||
              viewTab === 'clients' ||
              viewTab === 'couriers' ||
              viewTab === 'locations' ||
              viewTab === 'user_management') && (
              <MastersModule
                companies={companies}
                warehouses={warehouses}
                clients={clients}
                couriers={couriers}
                skus={skus}
                users={users}
                drivers={drivers}
                vehicleTypes={vehicleTypes}
                returnReasons={returnReasons}
                onAddMasterRecord={handleAddMasterRecord}
                onUpdateMasterRecord={handleUpdateMasterRecord}
                onDeleteMasterRecord={handleDeleteMasterRecord}
                onToggleHoldMasterRecord={handleToggleHoldMasterRecord}
              />
            )}

            {(viewTab === 'reports' || viewTab === 'notifications') && (
              <ReportsModule
                activeWarehouse={activeWarehouse}
                gateEntries={gateEntries}
                batches={batches}
                scannedItems={scannedItems}
                clients={clients}
                couriers={couriers}
                users={users}
              />
            )}

            {(viewTab === 'supabase_hub' || viewTab === 'settings') && (
              <SettingsModule
                config={supabaseConfig}
                onSaveConfig={handleSaveSupabaseConfig}
              />
            )}
          </div>
        </main>
      </div>

      {/* Universal Search Modal (Ctrl+K) */}
      <UniversalSearchModal
        isOpen={isUniversalSearchOpen}
        onClose={() => setIsUniversalSearchOpen(false)}
        gateEntries={gateEntries}
        batches={batches}
        scannedItems={scannedItems}
        clients={clients}
        couriers={couriers}
        onSelectResult={handleUniversalSelectResult}
      />
    </div>
  );

  return (
    <Routes>
      {/* 1. Public Route: Login Page */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* 2. Protected Internal Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {renderAppLayout('dashboard')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/inward"
        element={
          <ProtectedRoute>
            {renderAppLayout('inward')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/grn"
        element={
          <ProtectedRoute>
            {renderAppLayout('grn')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/returns/rto"
        element={
          <ProtectedRoute>
            {renderAppLayout('returns_rto')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/returns-rto"
        element={<Navigate to="/returns/rto" replace />}
      />

      <Route
        path="/rto"
        element={<Navigate to="/returns/rto" replace />}
      />

      <Route
        path="/returns/b2b"
        element={
          <ProtectedRoute>
            {renderAppLayout('returns_b2b')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/returns-b2b"
        element={<Navigate to="/returns/b2b" replace />}
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            {renderAppLayout('inventory')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            {renderAppLayout('audit')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            {renderAppLayout('clients')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/couriers"
        element={
          <ProtectedRoute>
            {renderAppLayout('couriers')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/locations"
        element={
          <ProtectedRoute>
            {renderAppLayout('locations')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            {renderAppLayout('reports')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            {renderAppLayout('notifications')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-management"
        element={
          <ProtectedRoute>
            {renderAppLayout('user_management')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={<Navigate to="/user-management" replace />}
      />

      <Route
        path="/masters"
        element={
          <ProtectedRoute>
            {renderAppLayout('masters')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            {renderAppLayout('settings')}
          </ProtectedRoute>
        }
      />

      <Route
        path="/supabase-hub"
        element={
          <ProtectedRoute>
            {renderAppLayout('supabase_hub')}
          </ProtectedRoute>
        }
      />

      {/* 3. Wildcard Catch-All -> Redirects to /dashboard */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}
