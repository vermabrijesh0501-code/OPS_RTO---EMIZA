import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  QrCode,
  Layers,
  Calendar,
  Package,
  MapPin,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Smartphone,
  Sparkles,
  RefreshCw,
  Trash2,
  SlidersHorizontal,
  FileSpreadsheet,
  Zap,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import {
  AuditRecord,
  AuditorDevice,
  AuditScanMode,
  Client,
  SKU,
} from '../types';
import { downloadCSV } from '../utils/csvExporter';

interface AuditModuleProps {
  clients: Client[];
  skus: SKU[];
  auditorDevices: AuditorDevice[];
  auditRecords: AuditRecord[];
  activeAuditorId: string;
  onSelectAuditorId: (id: string) => void;
  onAddAuditRecord: (record: Omit<AuditRecord, 'id' | 'scannedAt'>) => void;
  onDeleteAuditRecord: (id: string) => void;
  onUpdateAuditorDevices: (devices: AuditorDevice[]) => void;
}

export const AuditModule: React.FC<AuditModuleProps> = ({
  clients,
  skus,
  auditorDevices,
  auditRecords,
  activeAuditorId,
  onSelectAuditorId,
  onAddAuditRecord,
  onDeleteAuditRecord,
  onUpdateAuditorDevices,
}) => {
  // Active Mode: WITH_BATCH vs WITHOUT_BATCH
  const [scanMode, setScanMode] = useState<AuditScanMode>('WITH_BATCH');

  // Active Device with safe fallback
  const currentDevice =
    auditorDevices.find(d => d.id === activeAuditorId) ||
    auditorDevices[0] || {
      id: activeAuditorId || 'GUN-01',
      name: 'Scanner Gun 01',
      assignedPerson: 'Floor Operator',
      zone: 'Floor',
      status: 'Active' as const,
      batteryPercent: 100,
      lastActiveAt: 'Just now',
    };

  // Scan Form Fields (Clean defaults for real-time operations)
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.find(c => c.id === 'cli-bellavita')?.id || clients[0]?.id || ''
  );
  const [skuInput, setSkuInput] = useState('');
  const [eanInput, setEanInput] = useState('');
  const [productNameInput, setProductNameInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [quantityInput, setQuantityInput] = useState<number>(1);
  const [batchNumberInput, setBatchNumberInput] = useState('');
  const [mfgDateInput, setMfgDateInput] = useState('');
  const [expDateInput, setExpDateInput] = useState('');
  const [qcStatusInput, setQcStatusInput] = useState<'Good' | 'Damage' | 'Expired' | 'QC Check Required'>('Good');
  const [notesInput, setNotesInput] = useState('');

  // Scan Feedback & Animation
  const [lastScannedSuccess, setLastScannedSuccess] = useState<string | null>(null);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Table Filters
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<string>('ALL');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('ALL');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Manage Auditor Gun Modal
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDevicePerson, setNewDevicePerson] = useState('');
  const [newDeviceZone, setNewDeviceZone] = useState('');

  // Auto-Match EAN / SKU when typing
  const handleSkuChange = (val: string) => {
    setSkuInput(val);
    const matched = skus.find(
      s => s.skuCode.toLowerCase() === val.toLowerCase() && (!selectedClientId || s.clientId === selectedClientId)
    );
    if (matched) {
      setEanInput(matched.eanBarcode);
      setProductNameInput(matched.name);
      if (!selectedClientId) setSelectedClientId(matched.clientId);
    }
  };

  const handleEanChange = (val: string) => {
    setEanInput(val);
    const matched = skus.find(s => s.eanBarcode === val);
    if (matched) {
      setSkuInput(matched.skuCode);
      setProductNameInput(matched.name);
      if (matched.clientId) setSelectedClientId(matched.clientId);
    }
  };

  // Quick Preset Selection
  const handleSelectMasterSku = (sku: SKU) => {
    setSkuInput(sku.skuCode);
    setEanInput(sku.eanBarcode);
    setProductNameInput(sku.name);
    setSelectedClientId(sku.clientId);
    if (!locationInput) setLocationInput('A-01-01-A');
  };

  // Handle Scan Submit
  const handleSaveScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuInput && !eanInput) {
      alert('Please enter SKU Code or EAN Barcode to record the audit scan.');
      return;
    }
    if (!locationInput) {
      alert('Please specify the Bin / Rack / Pallet location.');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);

    onAddAuditRecord({
      mode: scanMode,
      auditorDeviceId: currentDevice.id,
      auditorName: currentDevice.assignedPerson || 'Floor Operator',
      clientId: selectedClientId,
      clientName: client?.name || 'General Inventory',
      skuCode: skuInput || 'SKU-UNLISTED',
      eanBarcode: eanInput || '8900000000000',
      productName: productNameInput || 'Audited Product',
      location: locationInput.toUpperCase().trim(),
      quantity: Number(quantityInput) || 1,
      batchNumber: scanMode === 'WITH_BATCH' ? batchNumberInput.toUpperCase().trim() : undefined,
      mfgDate: scanMode === 'WITH_BATCH' ? mfgDateInput : undefined,
      expDate: scanMode === 'WITH_BATCH' ? expDateInput : undefined,
      qcStatus: qcStatusInput,
      notes: notesInput.trim() || undefined,
    });

    setLastScannedSuccess(
      `✓ Scanned ${quantityInput}x ${skuInput || eanInput} at ${locationInput.toUpperCase()}`
    );
    setTimeout(() => setLastScannedSuccess(null), 3500);

    // Reset inputs for next fast scan
    setQuantityInput(1);
    setSkuInput('');
    setEanInput('');
    setProductNameInput('');
    setNotesInput('');
  };

  // Export CSV of Audited Inventory
  const handleExportCSV = () => {
    const headers = [
      'Record ID',
      'Mode',
      'Device ID',
      'Auditor Name',
      'Client / Account',
      'SKU Code',
      'EAN Barcode',
      'Product Name',
      'Location / Bin',
      'Quantity',
      'Batch Number',
      'MFG Date',
      'EXP Date',
      'QC Status',
      'Timestamp',
      'Notes',
    ];

    const rows = filteredRecords.map(r => [
      r.id,
      r.mode,
      r.auditorDeviceId,
      r.auditorName,
      r.clientName,
      r.skuCode,
      r.eanBarcode,
      r.productName || '',
      r.location,
      r.quantity,
      r.batchNumber || 'N/A',
      r.mfgDate || 'N/A',
      r.expDate || 'N/A',
      r.qcStatus || 'Good',
      new Date(r.scannedAt).toLocaleString(),
      r.notes || '',
    ]);

    downloadCSV(`EMIZA_Physical_Audit_Export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // Filtered Audit Records for Table
  const filteredRecords = auditRecords.filter(r => {
    if (selectedDeviceFilter !== 'ALL' && r.auditorDeviceId !== selectedDeviceFilter) return false;
    if (selectedClientFilter !== 'ALL' && r.clientId !== selectedClientFilter) return false;
    if (selectedModeFilter !== 'ALL' && r.mode !== selectedModeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.skuCode.toLowerCase().includes(q) ||
        r.eanBarcode.includes(q) ||
        r.location.toLowerCase().includes(q) ||
        (r.batchNumber && r.batchNumber.toLowerCase().includes(q)) ||
        r.auditorName.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate Metrics
  const totalAuditedQuantity = filteredRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const uniqueLocations = new Set(filteredRecords.map(r => r.location)).size;
  const uniqueSKUs = new Set(filteredRecords.map(r => r.skuCode)).size;
  const withBatchCount = filteredRecords.filter(r => r.mode === 'WITH_BATCH').length;
  const withoutBatchCount = filteredRecords.filter(r => r.mode === 'WITHOUT_BATCH').length;

  // Add new device
  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId.trim() || !newDeviceName.trim()) {
      alert('Please provide Device ID (e.g. AUD-16) and Device Name.');
      return;
    }
    const newDev: AuditorDevice = {
      id: newDeviceId.toUpperCase().trim(),
      name: newDeviceName.trim(),
      assignedPerson: newDevicePerson.trim() || 'Unassigned Operator',
      zone: newDeviceZone.trim() || 'General Floor',
      status: 'Active',
      batteryPercent: 100,
      lastActiveAt: 'Just now',
    };
    const updated = [...auditorDevices, newDev];
    onUpdateAuditorDevices(updated);
    setIsDeviceModalOpen(false);
    setNewDeviceId('');
    setNewDeviceName('');
    setNewDevicePerson('');
    setNewDeviceZone('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Banner & Device Switcher */}
      <div className="bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#123B5D] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
              <Scan className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Audit & Cycle Count System
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Multi-Gun Sync Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time physical inventory counting supporting 10-15 scanner devices, auto EAN resolution, and batch expiry tracking.
          </p>
        </div>

        {/* Active Device Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <Smartphone className="w-4 h-4 text-[#123B5D] dark:text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold leading-none">
                Active Scanning Gun / ID
              </div>
              <select
                value={activeAuditorId || currentDevice.id}
                onChange={e => onSelectAuditorId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer mt-0.5"
              >
                {auditorDevices.length === 0 ? (
                  <option value={currentDevice.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {currentDevice.id} • {currentDevice.assignedPerson} ({currentDevice.name})
                  </option>
                ) : (
                  auditorDevices.map(d => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {d.id} • {d.assignedPerson} ({d.name})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <button
            onClick={() => setIsDeviceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#123B5D] dark:text-blue-400" /> Manage Devices ({auditorDevices.length})
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Master CSV
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-xl shadow-xs transition-colors">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Scanned Qty</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalAuditedQuantity}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{filteredRecords.length} Scan Entries</div>
        </div>

        <div className="bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-xl shadow-xs transition-colors">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Locations Covered</span>
          <div className="text-2xl font-extrabold text-[#123B5D] dark:text-blue-400 mt-1">{uniqueLocations}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Racks, Bays & Pallets</div>
        </div>

        <div className="bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-xl shadow-xs transition-colors">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Unique SKUs</span>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{uniqueSKUs}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Across All Accounts</div>
        </div>

        <div className="bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-xl shadow-xs transition-colors">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">With Batch Scans</span>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{withBatchCount}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Batch + MFG/EXP Tracked</div>
        </div>

        <div className="bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-xl shadow-xs transition-colors">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Without Batch Scans</span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{withoutBatchCount}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Fast SKU / EAN Scans</div>
        </div>
      </div>

      {/* Main Split: Left = Scan Gun Interface, Right = Real-time Central Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Live Gun Scanner */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#123B5D] dark:text-blue-400" />
                  Scanner Console
                </h2>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Operated by <span className="text-slate-800 dark:text-white font-bold">{currentDevice.assignedPerson}</span> ({currentDevice.id})
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setScanMode('WITH_BATCH')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    scanMode === 'WITH_BATCH'
                      ? 'bg-[#123B5D] dark:bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  With Batch
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('WITHOUT_BATCH')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    scanMode === 'WITHOUT_BATCH'
                      ? 'bg-[#123B5D] dark:bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Without Batch
                </button>
              </div>
            </div>

            {/* Scan Success Toast */}
            {lastScannedSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{lastScannedSuccess}</span>
              </div>
            )}

            {/* Active Mode Description */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300">
              {scanMode === 'WITH_BATCH' ? (
                <div className="flex items-center gap-2 text-slate-800 dark:text-blue-300">
                  <Layers className="w-4 h-4 text-[#123B5D] dark:text-blue-400 shrink-0" />
                  <span>
                    <strong>Batch Inventory Mode:</strong> Captures SKU, Auto EAN Barcode, Location, Batch No, MFG Date, EXP Date & Quantity.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-800 dark:text-indigo-300">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    <strong>Without Batch Mode:</strong> Fast scan capturing only SKU or EAN Barcode, Location & Quantity.
                  </span>
                </div>
              )}
            </div>

            {/* Quick Catalog Barcode Presets (Bella Vita & Others) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Quick Master SKU / EAN Presets:</span>
                <span className="text-[10px] text-[#123B5D] dark:text-blue-400">Click to Auto-Fill</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {skus.slice(0, 6).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectMasterSku(s)}
                    className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-900 dark:text-white">{s.skuCode}</span>
                    <span className="text-slate-400 dark:text-slate-500">({s.eanBarcode.slice(-4)})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveScan} className="space-y-3.5">
              {/* Account / Client */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Account / Client:
                </label>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU & EAN Inputs (Auto Synchronized) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    SKU Code:
                  </label>
                  <input
                    type="text"
                    value={skuInput}
                    onChange={e => handleSkuChange(e.target.value)}
                    placeholder="e.g. BV-WHITE-OUD-100"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    EAN Barcode (Auto-Matched):
                  </label>
                  <input
                    type="text"
                    value={eanInput}
                    onChange={e => handleEanChange(e.target.value)}
                    placeholder="e.g. 8906105610014"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Name Display */}
              {productNameInput && (
                <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">Product:</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[280px]">{productNameInput}</span>
                </div>
              )}

              {/* Location & Quantity (In Both Modes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-500" /> Bin / Rack Location:
                  </label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                    placeholder="e.g. A-01-02-B or LOC-05"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 focus:border-amber-500 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Audited Quantity:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantityInput(q => Math.max(1, q - 1))}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantityInput}
                      onChange={e => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-extrabold text-center text-slate-900 dark:text-white focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantityInput(q => q + 1)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* WITH_BATCH Specific Fields */}
              {scanMode === 'WITH_BATCH' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-blue-200 dark:border-blue-500/20 rounded-xl space-y-3">
                  <div className="text-[11px] font-extrabold text-[#123B5D] dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Batch & Expiry Parameters
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Batch Number:
                    </label>
                    <input
                      type="text"
                      value={batchNumberInput}
                      onChange={e => setBatchNumberInput(e.target.value)}
                      placeholder="e.g. BV-BAT-2026-A1"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        MFG Date:
                      </label>
                      <input
                        type="date"
                        value={mfgDateInput}
                        onChange={e => setMfgDateInput(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        EXP Date:
                      </label>
                      <input
                        type="date"
                        value={expDateInput}
                        onChange={e => setExpDateInput(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* QC Status & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Item Condition / QC:
                  </label>
                  <select
                    value={qcStatusInput}
                    onChange={e => setQcStatusInput(e.target.value as typeof qcStatusInput)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Good">Good Condition</option>
                    <option value="Damage">Damage / Packaging Defect</option>
                    <option value="Expired">Near Expiry / Expired</option>
                    <option value="QC Check Required">QC Check Required</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Auditor Remarks / Notes:
                  </label>
                  <input
                    type="text"
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                    placeholder="Optional remarks..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#123B5D] hover:bg-[#184C77] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Save Scan to Master Records
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 Cols): Consolidated Real-Time Master Audit Records */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Consolidated Audit Records (All Devices)
                </h2>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Showing {filteredRecords.length} scans from connected guns
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search SKU, EAN, Location..."
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#123B5D] dark:focus:border-blue-500 focus:outline-none w-full sm:w-56"
                />
              </div>
            </div>

            {/* Quick Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Filter Device */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  Filter by Gun / Device:
                </label>
                <select
                  value={selectedDeviceFilter}
                  onChange={e => setSelectedDeviceFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Devices ({auditorDevices.length} Guns)</option>
                  {auditorDevices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.id} • {d.assignedPerson}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Client */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  Filter by Account:
                </label>
                <select
                  value={selectedClientFilter}
                  onChange={e => setSelectedClientFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Accounts</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Mode */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  Filter Mode:
                </label>
                <select
                  value={selectedModeFilter}
                  onChange={e => setSelectedModeFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Modes</option>
                  <option value="WITH_BATCH">With Batch Details</option>
                  <option value="WITHOUT_BATCH">Without Batch (Quick)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 max-h-[520px] overflow-y-auto shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Device / Auditor</th>
                    <th className="py-2.5 px-3">Account & SKU</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3">Batch / Expiry</th>
                    <th className="py-2.5 px-3 text-center">QC</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        No audit records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#123B5D] dark:text-indigo-400">{rec.auditorDeviceId}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                            {rec.auditorName}
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500">
                            {new Date(rec.scannedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            {rec.skuCode}
                            {rec.mode === 'WITH_BATCH' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                                Batch
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                Quick
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            EAN: {rec.eanBarcode}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                            {rec.clientName}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono font-bold text-amber-700 dark:text-amber-300">
                          {rec.location}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span className="font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {rec.quantity}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          {rec.mode === 'WITH_BATCH' && rec.batchNumber ? (
                            <div>
                              <div className="font-mono text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                                {rec.batchNumber}
                              </div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400">
                                EXP: {rec.expDate || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">No Batch Req</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.qcStatus === 'Good'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                : rec.qcStatus === 'Damage'
                                ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                            }`}
                          >
                            {rec.qcStatus || 'Good'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onDeleteAuditRecord(rec.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/40 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete scan entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Device Management Modal */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111D2C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#123B5D] dark:text-indigo-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Auditor Devices & Multi-Scanner Fleet
                </h3>
              </div>
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage all handheld scanner devices. Operators can pick any assigned gun ID during cycle counting to record real-time inventory scans.
            </p>

            {/* List of active devices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {auditorDevices.map(d => (
                <div
                  key={d.id}
                  onClick={() => {
                    onSelectAuditorId(d.id);
                    setIsDeviceModalOpen(false);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    d.id === activeAuditorId
                      ? 'bg-blue-50 dark:bg-indigo-900/30 border-[#123B5D] dark:border-indigo-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">{d.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      {d.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {d.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Assigned: {d.assignedPerson} • Zone: {d.zone}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Device Form */}
            <form onSubmit={handleCreateDevice} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#123B5D] dark:text-indigo-400" /> Provision New Scanner Gun
              </h4>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Device ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GUN-16"
                    value={newDeviceId}
                    onChange={e => setNewDeviceId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Device Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zebra TC26 Gun 16"
                    value={newDeviceName}
                    onChange={e => setNewDeviceName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Assigned Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh S."
                    value={newDevicePerson}
                    onChange={e => setNewDevicePerson(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Zone / Aisle</label>
                  <input
                    type="text"
                    placeholder="e.g. Zone B / Racks 01-10"
                    value={newDeviceZone}
                    onChange={e => setNewDeviceZone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#123B5D] hover:bg-[#184C77] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
