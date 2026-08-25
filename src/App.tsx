import React, { useState, useEffect } from 'react';
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
import { hasModulePermission, getAccessibleModules } from './utils/rbac';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = StorageService.getAuthSession();
    return session.isLoggedIn;
  });

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

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

  // Active Session & Operating Warehouse (Single Warehouse Mode)
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getCurrentUser());
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

  // Role Switcher Demo Helper
  const handleSwitchUserRole = (role: UserRole) => {
    const matchingUser = users.find(u => u.role === role) || {
      ...currentUser,
      role,
      name: `${currentUser.name.split(' ')[0]} (${role})`,
    };
    setCurrentUser(matchingUser);
    StorageService.saveCurrentUser(matchingUser);
    StorageService.addActivityLog({
      userId: matchingUser.id,
      userName: matchingUser.name,
      userRole: role,
      action: 'Switched User Role',
      module: 'Auth',
      details: `Active role switched to ${role} for demo testing`,
    });
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
    StorageService.saveGateEntries(updated);

    StorageService.addActivityLog({
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
    const updated = gateEntries.map(g => {
      if (g.id === id) {
        return {
          ...g,
          status,
          dockNumber: dockNumber || g.dockNumber,
          dockAllocatedTime: dockNumber ? new Date().toISOString() : g.dockAllocatedTime,
        };
      }
      return g;
    });

    setGateEntries(updated);
    StorageService.saveGateEntries(updated);

    const target = gateEntries.find(g => g.id === id);
    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `Updated Inward Status to ${status}`,
      module: 'Inward',
      details: `${target?.gatePassNumber || id} updated to ${status} ${dockNumber ? `at ${dockNumber}` : ''}`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  // Add Return Batch (Format: DD-account reference - serial no 0101, e.g. 22-BV-0101)
  const handleAddBatch = (
    batchData: Omit<ReturnBatch, 'id' | 'batchNumber' | 'totalScanned' | 'remarksBreakdown' | 'createdAt'>
  ): ReturnBatch => {
    const today = new Date();
    const dayStr = String(today.getDate()).padStart(2, '0'); // e.g. "22"
    
    // Find client code / reference (e.g. BV, NYK, MME, BOAT, SUG)
    const client = clients.find(c => c.id === batchData.clientId);
    const clientRef = (client?.code || 'ACC').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();

    // Calculate serial number for this client (0101, 0102, ...)
    const clientExistingBatches = batches.filter(b => b.clientId === batchData.clientId);
    const serialNumber = String(101 + clientExistingBatches.length).padStart(4, '0'); // e.g. "0101"

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
    StorageService.saveReturnBatches(updated);

    StorageService.addActivityLog({
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

  // Barcode Gun Item Scan with Duplicate Check
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
      id: `item-${Date.now()}`,
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
    StorageService.saveScannedItems(updatedItems);

    const updatedBatches = batches.map(b => {
      if (b.id === batchId) {
        const newBreakdown = { ...b.remarksBreakdown };
        newBreakdown[remark] = (newBreakdown[remark] || 0) + 1;
        return {
          ...b,
          totalScanned: b.totalScanned + 1,
          remarksBreakdown: newBreakdown,
        };
      }
      return b;
    });

    setBatches(updatedBatches);
    StorageService.saveReturnBatches(updatedBatches);

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Scanned AWB Barcode',
      module: targetBatch.batchType === 'B2B Return' ? 'B2B' : 'RTO',
      details: `Scanned AWB #${trackingNumber} [${remark}] in ${targetBatch.batchNumber}`,
    });
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

    const updatedItems = scannedItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          trackingNumber: newTracking,
          orderNumber: `ORD-${newTracking.slice(-6)}`,
          remark: newRemark,
        };
      }
      return item;
    });
    setScannedItems(updatedItems);
    StorageService.saveScannedItems(updatedItems);

    if (oldRemark !== newRemark) {
      const updatedBatches = batches.map(b => {
        if (b.id === targetItem.batchId) {
          const breakdown = { ...b.remarksBreakdown };
          breakdown[oldRemark] = Math.max(0, (breakdown[oldRemark] || 1) - 1);
          breakdown[newRemark] = (breakdown[newRemark] || 0) + 1;
          return {
            ...b,
            remarksBreakdown: breakdown,
          };
        }
        return b;
      });
      setBatches(updatedBatches);
      StorageService.saveReturnBatches(updatedBatches);
    }

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Updated Scanned AWB',
      module: 'RTO',
      details: `Edited AWB ${oldTracking} -> ${newTracking} [${newRemark}]`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  // Delete Scanned Return Item from Batch
  const handleDeleteItem = (itemId: string) => {
    const targetItem = scannedItems.find(i => i.id === itemId);
    if (!targetItem) return;

    const updatedItems = scannedItems.filter(i => i.id !== itemId);
    setScannedItems(updatedItems);
    StorageService.saveScannedItems(updatedItems);

    const updatedBatches = batches.map(b => {
      if (b.id === targetItem.batchId) {
        const breakdown = { ...b.remarksBreakdown };
        breakdown[targetItem.remark] = Math.max(0, (breakdown[targetItem.remark] || 1) - 1);
        return {
          ...b,
          totalScanned: Math.max(0, b.totalScanned - 1),
          remarksBreakdown: breakdown,
        };
      }
      return b;
    });
    setBatches(updatedBatches);
    StorageService.saveReturnBatches(updatedBatches);

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Removed Scanned AWB',
      module: 'RTO',
      details: `Removed AWB ${targetItem.trackingNumber} [${targetItem.remark}] from batch`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  // Close Return Batch
  const handleCloseBatch = (
    batchId: string,
    driverName: string,
    driverMobile: string,
    supervisorSigner: string
  ) => {
    const updatedBatches = batches.map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          status: 'Closed' as const,
          closedAt: new Date().toISOString(),
          driverName,
          driverMobile,
          supervisorSigner,
          driverSignature: 'SIGNED',
        };
      }
      return b;
    });

    setBatches(updatedBatches);
    StorageService.saveReturnBatches(updatedBatches);

    const closed = batches.find(b => b.id === batchId);
    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Closed Return Batch',
      module: 'RTO',
      details: `Closed batch ${closed?.batchNumber} with ${closed?.totalScanned} items and courier handover sign-off`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  // Audit Operations Handlers
  const handleSelectAuditorId = (id: string) => {
    setActiveAuditorId(id);
    StorageService.saveActiveAuditorId(id);
  };

  const handleAddAuditRecord = (record: Omit<AuditRecord, 'id' | 'scannedAt'>) => {
    const newRec = StorageService.addAuditRecord(record);
    setAuditRecords(StorageService.getAuditRecords());

    // Dynamically register or activate scanning gun in real-time
    if (record.auditorDeviceId) {
      const existing = auditorDevices.find(d => d.id === record.auditorDeviceId);
      let updatedDevices: AuditorDevice[];
      if (!existing) {
        const newDevice: AuditorDevice = {
          id: record.auditorDeviceId,
          name: `Scanner Gun (${record.auditorDeviceId})`,
          assignedPerson: record.auditorName || currentUser.name,
          zone: record.location ? `Zone ${record.location.slice(0, 3)}` : 'Floor',
          status: 'Active',
          batteryPercent: 100,
          lastActiveAt: 'Just now',
        };
        updatedDevices = [...auditorDevices, newDevice];
      } else {
        updatedDevices = auditorDevices.map(d =>
          d.id === record.auditorDeviceId
            ? { ...d, status: 'Active' as const, lastActiveAt: 'Just now' }
            : d
        );
      }
      setAuditorDevices(updatedDevices);
      StorageService.saveAuditorDevices(updatedDevices);
    }

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Scanned Audit Item',
      module: 'Audit',
      details: `Device ${record.auditorDeviceId} scanned SKU ${record.skuCode} (Qty ${record.quantity}) at Loc ${record.location}`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  const handleDeleteAuditRecord = (id: string) => {
    const updated = auditRecords.filter(r => r.id !== id);
    setAuditRecords(updated);
    StorageService.saveAuditRecords(updated);
  };

  const handleUpdateAuditorDevices = (devices: AuditorDevice[]) => {
    setAuditorDevices(devices);
    StorageService.saveAuditorDevices(devices);
  };

  // Master Data Operations (Add, Update, Delete, Hold)
  const handleAddMasterRecord = (category: string, record: any) => {
    if (category === 'companies') {
      const updated = [...companies, record];
      setCompanies(updated);
      StorageService.saveCompanies(updated);
    } else if (category === 'warehouses') {
      const updated = [...warehouses, record];
      setWarehouses(updated);
      StorageService.saveWarehouses(updated);
    } else if (category === 'clients') {
      const updated = [...clients, record];
      setClients(updated);
      StorageService.saveClients(updated);
    } else if (category === 'couriers') {
      const updated = [...couriers, record];
      setCouriers(updated);
      StorageService.saveCouriers(updated);
    } else if (category === 'skus') {
      const updated = [...skus, record];
      setSKUs(updated);
      StorageService.saveSKUs(updated);
    } else if (category === 'users') {
      const updated = [...users, record];
      setUsers(updated);
      StorageService.saveUsers(updated);
    } else if (category === 'drivers') {
      const updated = [...drivers, record];
      setDrivers(updated);
      StorageService.saveDrivers(updated);
    } else if (category === 'vehicle_types') {
      const updated = [...vehicleTypes, record];
      setVehicleTypes(updated);
      StorageService.saveVehicleTypes(updated);
    } else if (category === 'return_reasons') {
      const updated = [...returnReasons, record];
      setReturnReasons(updated);
      StorageService.saveReturnReasons(updated);
    }

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Added Master Record',
      module: 'Masters',
      details: `Added new ${category} record: ${record.name || record.code || record.skuCode || record.label}`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  const handleUpdateMasterRecord = (category: string, id: string, updatedRecord: any) => {
    if (category === 'companies') {
      const updated = companies.map(c => (c.id === id ? { ...c, ...updatedRecord } : c));
      setCompanies(updated);
      StorageService.saveCompanies(updated);
    } else if (category === 'warehouses') {
      const updated = warehouses.map(w => (w.id === id ? { ...w, ...updatedRecord } : w));
      setWarehouses(updated);
      StorageService.saveWarehouses(updated);
    } else if (category === 'clients') {
      const updated = clients.map(c => (c.id === id ? { ...c, ...updatedRecord } : c));
      setClients(updated);
      StorageService.saveClients(updated);
    } else if (category === 'couriers') {
      const updated = couriers.map(cr => (cr.id === id ? { ...cr, ...updatedRecord } : cr));
      setCouriers(updated);
      StorageService.saveCouriers(updated);
    } else if (category === 'skus') {
      const updated = skus.map(s => (s.id === id ? { ...s, ...updatedRecord } : s));
      setSKUs(updated);
      StorageService.saveSKUs(updated);
    } else if (category === 'users') {
      const updated = users.map(u => (u.id === id ? { ...u, ...updatedRecord } : u));
      setUsers(updated);
      StorageService.saveUsers(updated);
    } else if (category === 'drivers') {
      const updated = drivers.map(d => (d.id === id ? { ...d, ...updatedRecord } : d));
      setDrivers(updated);
      StorageService.saveDrivers(updated);
    } else if (category === 'vehicle_types') {
      const updated = vehicleTypes.map(v => (v.id === id ? { ...v, ...updatedRecord } : v));
      setVehicleTypes(updated);
      StorageService.saveVehicleTypes(updated);
    } else if (category === 'return_reasons') {
      const updated = returnReasons.map(r => (r.id === id ? { ...r, ...updatedRecord } : r));
      setReturnReasons(updated);
      StorageService.saveReturnReasons(updated);
    }

    StorageService.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Updated Master Record',
      module: 'Masters',
      details: `Updated ${category} record ID ${id}`,
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
      const updated = couriers.filter(cr => cr.id !== id);
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
      action: 'Deleted Master Record',
      module: 'Masters',
      details: `Deleted ${category} record ID ${id}`,
    });
    setLogs(StorageService.getActivityLogs());
  };

  const handleToggleHoldMasterRecord = (category: string, id: string) => {
    let newStatus: 'Active' | 'On Hold' = 'Active';

    if (category === 'companies') {
      const updated = companies.map(c => {
        if (c.id === id) {
          const toggled = c.status === 'Active' ? 'On Hold' : 'Active';
          newStatus = toggled as any;
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
          newStatus = toggled as any;
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
          newStatus = toggled as any;
          return { ...c, status: toggled as any };
        }
        return c;
      });
      setClients(updated);
      StorageService.saveClients(updated);
    } else if (category === 'couriers') {
      const updated = couriers.map(cr => {
        if (cr.id === id) {
          const toggled = cr.status === 'Active' ? 'On Hold' : 'Active';
          newStatus = toggled as any;
          return { ...cr, status: toggled as any };
        }
        return cr;
      });
      setCouriers(updated);
      StorageService.saveCouriers(updated);
    } else if (category === 'skus') {
      const updated = skus.map(s => {
        if (s.id === id) {
          const toggled = s.status === 'Active' ? 'On Hold' : 'Active';
          newStatus = toggled as any;
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
  const handleUniversalSelectResult = (type: 'inward' | 'rto', id: string) => {
    if (type === 'inward') {
      setActiveTab('inward');
    } else {
      setActiveTab('returns_rto');
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
      setActiveTab(accessible[0] || 'dashboard');
    }
  }, [currentUser, activeTab]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setUsers(StorageService.getUsers());
    setIsAuthenticated(true);
    const accessible = getAccessibleModules(user);
    if (!accessible.includes(activeTab)) {
      setActiveTab(accessible[0] || 'dashboard');
    }
  };

  const handleLogout = () => {
    StorageService.clearAuthSession();
    setIsAuthenticated(false);
  };

  // If user is not authenticated, render the dedicated Login & Team Credential Page
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        users={users}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B141E] text-[#FFFFFF] font-sans selection:bg-[#635BFF] selection:text-white flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        onSwitchUserRole={handleSwitchUserRole}
        warehouses={warehouses}
        activeWarehouseId={activeWarehouseId}
        onSelectWarehouse={handleSelectWarehouse}
        onOpenUniversalSearch={() => setIsUniversalSearchOpen(true)}
        onOpenSupabaseHub={() => setActiveTab('supabase_hub')}
        supabaseStatus={supabaseConfig.connectedStatus}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dual Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          openBatchCount={openBatchCount}
          pendingGateEntriesCount={pendingGateEntriesCount}
          auditCount={auditRecords.length}
          activeWarehouseCode={activeWarehouse?.code || 'WH-MAIN-01'}
          currentUser={currentUser}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content View Container */}
        <main className="flex-1 overflow-y-auto bg-[#0B141E]">
          {activeTab === 'dashboard' && (
            <DashboardView
              warehouse={activeWarehouse}
              clients={clients}
              gateEntries={gateEntries}
              batches={batches}
              scannedItems={scannedItems}
              auditorDevices={auditorDevices}
              auditRecords={auditRecords}
              logs={logs}
              onNavigateTab={tab => setActiveTab(tab)}
              onOpenNewGateEntryModal={() => setIsNewGateEntryModalOpen(true)}
              onOpenNewBatchModal={() => setIsNewBatchModalOpen(true)}
            />
          )}

          {activeTab === 'inward' && (
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

          {activeTab === 'returns_rto' && (
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

          {activeTab === 'returns_b2b' && (
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

          {activeTab === 'audit' && (
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

          {activeTab === 'masters' && (
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

          {activeTab === 'reports' && (
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

          {activeTab === 'supabase_hub' && (
            <SupabaseNetlifyHub
              config={supabaseConfig}
              onSaveConfig={handleSaveSupabaseConfig}
            />
          )}
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
}

