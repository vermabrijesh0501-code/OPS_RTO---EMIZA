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

  // Active Device
  const currentDevice =
    auditorDevices.find(d => d.id === activeAuditorId) || auditorDevices[0];

  // Scan Form Fields
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.find(c => c.id === 'cli-bellavita')?.id || clients[0]?.id || ''
  );
  const [skuInput, setSkuInput] = useState('');
  const [eanInput, setEanInput] = useState('');
  const [productNameInput, setProductNameInput] = useState('');
  const [locationInput, setLocationInput] = useState('A-01-02-B');
  const [quantityInput, setQuantityInput] = useState<number>(1);
  const [batchNumberInput, setBatchNumberInput] = useState('BV-BAT-2026-A1');
  const [mfgDateInput, setMfgDateInput] = useState('2026-01-15');
  const [expDateInput, setExpDateInput] = useState('2028-01-14');
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

  // Audio Beep for Scan Confirmation
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before user interaction
    }
  };

  // Auto Master Lookup when SKU or EAN changes
  const handleSkuChange = (val: string) => {
    setSkuInput(val);
    const matched = skus.find(
      s =>
        s.skuCode.toLowerCase() === val.trim().toLowerCase() ||
        s.skuCode.toLowerCase().includes(val.trim().toLowerCase())
    );
    if (matched) {
      setEanInput(matched.eanBarcode);
      setProductNameInput(matched.name);
      if (matched.clientId) setSelectedClientId(matched.clientId);
    }
  };

  const handleEanChange = (val: string) => {
    setEanInput(val);
    const matched = skus.find(
      s =>
        s.eanBarcode === val.trim() ||
        s.eanBarcode.toLowerCase().includes(val.trim().toLowerCase())
    );
    if (matched) {
      setSkuInput(matched.skuCode);
      setProductNameInput(matched.name);
      if (matched.clientId) setSelectedClientId(matched.clientId);
    }
  };

  // Quick Preset Selector from Master
  const handleSelectMasterSku = (sku: SKU) => {
    setSkuInput(sku.skuCode);
    setEanInput(sku.eanBarcode);
    setProductNameInput(sku.name);
    setSelectedClientId(sku.clientId);
  };

  // Submit Audit Scan
  const handleSaveScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuInput && !eanInput) {
      alert('Please enter or scan a SKU Code or EAN Barcode.');
      return;
    }
    if (!locationInput.trim()) {
      alert('Please enter a location (e.g. A-01-02-B).');
      return;
    }
    if (quantityInput <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    const clientObj = clients.find(c => c.id === selectedClientId);
    const clientName = clientObj ? clientObj.name : 'General Inventory';

    const newRec: Omit<AuditRecord, 'id' | 'scannedAt'> = {
      auditorDeviceId: currentDevice.id,
      auditorName: currentDevice.assignedPerson || currentDevice.name,
      clientId: selectedClientId,
      clientName,
      mode: scanMode,
      skuCode: skuInput || 'UNKNOWN-SKU',
      eanBarcode: eanInput || 'N/A',
      productName: productNameInput || (skuInput ? `Item: ${skuInput}` : 'Scanned Inventory Item'),
      location: locationInput.toUpperCase().trim(),
      quantity: Number(quantityInput),
      qcStatus: qcStatusInput,
      notes: notesInput,
      ...(scanMode === 'WITH_BATCH'
        ? {
            batchNumber: batchNumberInput || 'BATCH-DEFAULT',
            mfgDate: mfgDateInput,
            expDate: expDateInput,
          }
        : {}),
    };

    onAddAuditRecord(newRec);
    playBeep();

    setLastScannedSuccess(
      `✓ Scanned: ${newRec.skuCode} (Qty: ${newRec.quantity}) at Loc ${newRec.location} [Device: ${currentDevice.id}]`
    );
    setTimeout(() => setLastScannedSuccess(null), 4000);

    // Reset quick fields while keeping location
    setQuantityInput(1);
    setNotesInput('');
  };

  // Filtered Records
  const filteredRecords = auditRecords.filter(rec => {
    if (selectedDeviceFilter !== 'ALL' && rec.auditorDeviceId !== selectedDeviceFilter) return false;
    if (selectedClientFilter !== 'ALL' && rec.clientId !== selectedClientFilter) return false;
    if (selectedModeFilter !== 'ALL' && rec.mode !== selectedModeFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        rec.skuCode.toLowerCase().includes(term) ||
        rec.eanBarcode.toLowerCase().includes(term) ||
        rec.productName.toLowerCase().includes(term) ||
        rec.location.toLowerCase().includes(term) ||
        rec.auditorDeviceId.toLowerCase().includes(term) ||
        rec.auditorName.toLowerCase().includes(term) ||
        (rec.batchNumber && rec.batchNumber.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // Calculate Metrics
  const totalAuditedQuantity = filteredRecords.reduce((acc, r) => acc + r.quantity, 0);
  const uniqueLocations = new Set(filteredRecords.map(r => r.location)).size;
  const uniqueSKUs = new Set(filteredRecords.map(r => r.skuCode)).size;
  const withBatchCount = filteredRecords.filter(r => r.mode === 'WITH_BATCH').length;
  const withoutBatchCount = filteredRecords.filter(r => r.mode === 'WITHOUT_BATCH').length;

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No audit records to export.');
      return;
    }

    const headers = [
      'Record ID',
      'Scan Timestamp',
      'Auditor Device ID',
      'Auditor Name',
      'Account / Client',
      'Audit Mode',
      'SKU Code',
      'EAN Barcode',
      'Product Name',
      'Location',
      'Quantity',
      'Batch Number',
      'MFG Date',
      'EXP Date',
      'QC Status',
      'Notes',
    ];

    const rows = filteredRecords.map(r => [
      r.id,
      r.scannedAt,
      r.auditorDeviceId,
      `"${r.auditorName}"`,
      `"${r.clientName}"`,
      r.mode,
      `"${r.skuCode}"`,
      `"${r.eanBarcode}"`,
      `"${r.productName.replace(/"/g, '""')}"`,
      `"${r.location}"`,
      r.quantity,
      `"${r.batchNumber || ''}"`,
      r.mfgDate || '',
      r.expDate || '',
      r.qcStatus || 'Good',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `EMIZA_Audit_CycleCount_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Scan className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Audit & Cycle Count System
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Multi-Gun Sync Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time physical inventory counting supporting 10-15 scanner devices, auto EAN resolution, and batch expiry tracking.
          </p>
        </div>

        {/* Active Device Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-indigo-500/40 rounded-xl px-3 py-2">
            <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold leading-none">
                Active Scanning Gun / ID
              </div>
              <select
                value={activeAuditorId}
                onChange={e => onSelectAuditorId(e.target.value)}
                className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer mt-0.5"
              >
                {auditorDevices.map(d => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.id} • {d.assignedPerson} ({d.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setIsDeviceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" /> Manage Devices ({auditorDevices.length})
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" /> Export Master CSV
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400">Total Scanned Qty</span>
          <div className="text-2xl font-black text-white mt-1">{totalAuditedQuantity}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{filteredRecords.length} Scan Entries</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400">Locations Covered</span>
          <div className="text-2xl font-black text-blue-400 mt-1">{uniqueLocations}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Racks, Bays & Pallets</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400">Unique SKUs</span>
          <div className="text-2xl font-black text-indigo-400 mt-1">{uniqueSKUs}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across All Accounts</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400">With Batch Scans</span>
          <div className="text-2xl font-black text-purple-400 mt-1">{withBatchCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Batch + MFG/EXP Tracked</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400">Without Batch Scans</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{withoutBatchCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Fast SKU / EAN Scans</div>
        </div>
      </div>

      {/* Main Split: Left = Scan Gun Interface, Right = Real-time Central Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Live Gun Scanner */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-400" />
                  Scanner Console
                </h2>
                <div className="text-[11px] text-slate-400">
                  Operated by <span className="text-white font-bold">{currentDevice.assignedPerson}</span> ({currentDevice.id})
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setScanMode('WITH_BATCH')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    scanMode === 'WITH_BATCH'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  With Batch
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('WITHOUT_BATCH')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    scanMode === 'WITHOUT_BATCH'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Without Batch
                </button>
              </div>
            </div>

            {/* Scan Success Toast */}
            {lastScannedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{lastScannedSuccess}</span>
              </div>
            )}

            {/* Active Mode Description */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300">
              {scanMode === 'WITH_BATCH' ? (
                <div className="flex items-center gap-2 text-blue-300">
                  <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    <strong>Batch Inventory Mode:</strong> Captures SKU, Auto EAN Barcode, Location, Batch No, MFG Date, EXP Date & Quantity.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-indigo-300">
                  <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    <strong>Without Batch Mode:</strong> Fast scan capturing only SKU or EAN Barcode, Location & Quantity.
                  </span>
                </div>
              )}
            </div>

            {/* Quick Catalog Barcode Presets (Bella Vita & Others) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span>Quick Master SKU / EAN Presets:</span>
                <span className="text-[10px] text-blue-400">Click to Auto-Fill</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {skus.slice(0, 6).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectMasterSku(s)}
                    className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-indigo-400" />
                    <span className="font-bold text-white">{s.skuCode}</span>
                    <span className="text-slate-400">({s.eanBarcode.slice(-4)})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveScan} className="space-y-3.5">
              {/* Account / Client */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Account / Client:
                </label>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
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
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    SKU Code:
                  </label>
                  <input
                    type="text"
                    value={skuInput}
                    onChange={e => handleSkuChange(e.target.value)}
                    placeholder="e.g. BV-WHITE-OUD-100"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    EAN Barcode (Auto-Matched):
                  </label>
                  <input
                    type="text"
                    value={eanInput}
                    onChange={e => handleEanChange(e.target.value)}
                    placeholder="e.g. 8906105610014"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Name Display */}
              {productNameInput && (
                <div className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Product:</span>
                  <span className="font-semibold text-white truncate max-w-[280px]">{productNameInput}</span>
                </div>
              )}

              {/* Location & Quantity (In Both Modes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> Bin / Rack Location:
                  </label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                    placeholder="e.g. A-01-02-B or LOC-05"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:border-amber-500 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Audited Quantity:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantityInput(q => Math.max(1, q - 1))}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantityInput}
                      onChange={e => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-center text-white focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantityInput(q => q + 1)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* WITH_BATCH Specific Fields */}
              {scanMode === 'WITH_BATCH' && (
                <div className="p-3 bg-slate-950/70 border border-blue-500/20 rounded-xl space-y-3">
                  <div className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Batch & Expiry Parameters
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Batch Number:
                    </label>
                    <input
                      type="text"
                      value={batchNumberInput}
                      onChange={e => setBatchNumberInput(e.target.value)}
                      placeholder="e.g. BV-BAT-2026-A1"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-blue-500 focus:outline-none uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        MFG Date:
                      </label>
                      <input
                        type="date"
                        value={mfgDateInput}
                        onChange={e => setMfgDateInput(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        EXP Date:
                      </label>
                      <input
                        type="date"
                        value={expDateInput}
                        onChange={e => setExpDateInput(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* QC Status & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Item Condition / QC:
                  </label>
                  <select
                    value={qcStatusInput}
                    onChange={e => setQcStatusInput(e.target.value as typeof qcStatusInput)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Good">Good Condition</option>
                    <option value="Damage">Damage / Packaging Defect</option>
                    <option value="Expired">Near Expiry / Expired</option>
                    <option value="QC Check Required">QC Check Required</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Auditor Remarks / Notes:
                  </label>
                  <input
                    type="text"
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                    placeholder="Optional remarks..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" /> Save Scan to Master Records
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 Cols): Consolidated Real-Time Master Audit Records */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Consolidated Audit Records (All Devices)
                </h2>
                <div className="text-[11px] text-slate-400">
                  Showing {filteredRecords.length} scans from 15 connected guns
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search SKU, EAN, Location..."
                  className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none w-full sm:w-56"
                />
              </div>
            </div>

            {/* Quick Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Filter Device */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                  Filter by Gun / Device:
                </label>
                <select
                  value={selectedDeviceFilter}
                  onChange={e => setSelectedDeviceFilter(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Devices (15 Guns)</option>
                  {auditorDevices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.id} • {d.assignedPerson}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Client */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                  Filter by Account:
                </label>
                <select
                  value={selectedClientFilter}
                  onChange={e => setSelectedClientFilter(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
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
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                  Filter Mode:
                </label>
                <select
                  value={selectedModeFilter}
                  onChange={e => setSelectedModeFilter(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Modes</option>
                  <option value="WITH_BATCH">With Batch Details</option>
                  <option value="WITHOUT_BATCH">Without Batch (Quick)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[520px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-extrabold sticky top-0 z-10">
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
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No audit records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-indigo-400">{rec.auditorDeviceId}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                            {rec.auditorName}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {new Date(rec.scannedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white flex items-center gap-1">
                            {rec.skuCode}
                            {rec.mode === 'WITH_BATCH' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/20 text-blue-300">
                                Batch
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-700 text-slate-300">
                                Quick
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            EAN: {rec.eanBarcode}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {rec.clientName}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                          {rec.location}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span className="font-black text-sm text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {rec.quantity}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          {rec.mode === 'WITH_BATCH' && rec.batchNumber ? (
                            <div>
                              <div className="font-mono text-[11px] text-purple-300 font-bold">
                                {rec.batchNumber}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                EXP: {rec.expDate || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No Batch Req</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.qcStatus === 'Good'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : rec.qcStatus === 'Damage'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {rec.qcStatus || 'Good'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onDeleteAuditRecord(rec.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">
                  Auditor Devices & Multi-Scanner Fleet (10-15 Guns)
                </h3>
              </div>
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
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
                      ? 'bg-indigo-900/30 border-indigo-500'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-white">{d.id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        d.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {d.status} ({d.batteryPercent}%)
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-1">{d.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                    <span>{d.assignedPerson}</span>
                    <span className="text-indigo-300 font-mono">{d.zone}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Gun Form */}
            <form onSubmit={handleCreateDevice} className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                Add New Scanner ID / Gun
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Device ID:
                  </label>
                  <input
                    type="text"
                    value={newDeviceId}
                    onChange={e => setNewDeviceId(e.target.value)}
                    placeholder="e.g. AUD-16"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Device Description:
                  </label>
                  <input
                    type="text"
                    value={newDeviceName}
                    onChange={e => setNewDeviceName(e.target.value)}
                    placeholder="e.g. Scanner 16 - High Bay"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Assigned Person / Operator:
                  </label>
                  <input
                    type="text"
                    value={newDevicePerson}
                    onChange={e => setNewDevicePerson(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Warehouse Zone:
                  </label>
                  <input
                    type="text"
                    value={newDeviceZone}
                    onChange={e => setNewDeviceZone(e.target.value)}
                    placeholder="e.g. Zone C - Mezzanine"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
                >
                  Register Device Gun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
