import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  QrCode,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  Calendar,
  Layers,
  FileText,
  Clock,
  Printer,
  ChevronRight,
  ArrowRight,
  Smartphone,
  Camera,
  CameraOff,
  Vibrate,
  Zap,
  List,
} from 'lucide-react';
import {
  ReturnBatch,
  ScannedReturnItem,
  ReturnRemarkType,
  Warehouse,
  Client,
  Courier,
  User,
} from '../types';
import { generateBatchPDF } from '../utils/pdfGenerator';
import { downloadCSV } from '../utils/csvExporter';
import { HandheldScannerView } from './HandheldScannerView';

interface ReturnsModuleProps {
  currentUser: User;
  activeWarehouse: Warehouse;
  batches: ReturnBatch[];
  scannedItems: ScannedReturnItem[];
  clients: Client[];
  couriers: Courier[];
  onAddBatch: (batch: Omit<ReturnBatch, 'id' | 'batchNumber' | 'totalScanned' | 'remarksBreakdown' | 'createdAt'>) => ReturnBatch;
  onScanItem: (batchId: string, trackingNumber: string, remark: ReturnRemarkType, photoUrl?: string) => { success: boolean; message: string; item?: ScannedReturnItem };
  onCloseBatch: (batchId: string, driverName: string, driverMobile: string, supervisorSigner: string) => void;
  isOpenCreateModal: boolean;
  onCloseCreateModal: () => void;
}

export const ReturnsModule: React.FC<ReturnsModuleProps> = ({
  currentUser,
  activeWarehouse,
  batches,
  scannedItems,
  clients,
  couriers,
  onAddBatch,
  onScanItem,
  onCloseBatch,
  isOpenCreateModal,
  onCloseCreateModal,
}) => {
  // Navigation Tabs: 'open_batch' | 'closed_batch' | 'create_batch' | 'reports'
  const [activeSubTab, setActiveSubTab] = useState<'open_batch' | 'closed_batch' | 'create_batch' | 'reports'>('open_batch');

  // Device / Handheld Terminal (HHT / PDA / Phone) Fullscreen Ergonomic Mode
  const [isDeviceMode, setIsDeviceMode] = useState(false);

  // Active batch selected for scanning station
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  // Scanner Gun state (ONLY the 3 points requested: Date Auto, AWB/Order No, Conditions)
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedRemark, setSelectedRemark] = useState<ReturnRemarkType>('Good');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; msg: string } | null>(null);

  // New Batch Form State (Format: DD-account reference - serial no 0101)
  const [newBatchClient, setNewBatchClient] = useState(clients[0]?.id || '');
  const [newBatchCourier, setNewBatchCourier] = useState(couriers[0]?.id || '');
  const [newBatchExpected, setNewBatchExpected] = useState(50);
  const [newBatchNotes, setNewBatchNotes] = useState('');

  // Close Batch Modal state
  const [closingBatch, setClosingBatch] = useState<ReturnBatch | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [supervisorSigner, setSupervisorSigner] = useState(currentUser.name);

  // Search query
  const [batchSearchQuery, setBatchSearchQuery] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Filter open & closed batches
  const warehouseBatches = batches.filter(b => b.warehouseId === activeWarehouse.id);
  const openBatches = warehouseBatches.filter(b => b.status === 'Open');
  const closedBatches = warehouseBatches.filter(b => b.status === 'Closed');

  // Auto-select first open batch if none selected
  useEffect(() => {
    if (!activeBatchId && openBatches.length > 0) {
      setActiveBatchId(openBatches[0].id);
    }
  }, [openBatches, activeBatchId]);

  // Keep scanner input focused when active batch is open
  useEffect(() => {
    if (activeSubTab === 'open_batch' && activeBatchId && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeBatchId, activeSubTab]);

  // Handle external modal trigger from Header/Sidebar
  useEffect(() => {
    if (isOpenCreateModal) {
      setActiveSubTab('create_batch');
      onCloseCreateModal();
    }
  }, [isOpenCreateModal, onCloseCreateModal]);

  const activeBatch = batches.find(b => b.id === activeBatchId);
  const activeBatchItems = scannedItems.filter(i => i.batchId === activeBatchId);

  // Play audio beep feedback
  const playBeep = (isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio not permitted without interaction
    }
  };

  // Compute suggested batch number preview in DD-account_ref-0101 format
  const getBatchPreview = () => {
    const today = new Date();
    const dayStr = String(today.getDate()).padStart(2, '0');
    const selectedClient = clients.find(c => c.id === newBatchClient);
    const clientRef = (selectedClient?.code || 'ACC').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
    const clientExistingBatches = batches.filter(b => b.clientId === newBatchClient);
    const serialNo = String(101 + clientExistingBatches.length).padStart(4, '0');
    return `${dayStr}-${clientRef}-${serialNo}`;
  };

  // 1. SCAN HANDLER (Only AWB/Order No and Condition)
  const handleBarcodeSubmit = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const codeToScan = (customCode || barcodeInput).trim().toUpperCase();
    if (!activeBatchId || !codeToScan) return;

    const result = onScanItem(activeBatchId, codeToScan, selectedRemark);

    setLastScanResult({ success: result.success, msg: result.message });
    playBeep(result.success);

    // Haptic vibration feedback for mobile/handheld devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (result.success) {
          navigator.vibrate(80);
        } else {
          navigator.vibrate([150, 80, 150]);
        }
      } catch (err) {}
    }

    if (result.success) {
      setBarcodeInput('');
    }

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // 2. CREATE BATCH HANDLER
  const handleCreateBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch = onAddBatch({
      batchType: 'RTO/B2C',
      warehouseId: activeWarehouse.id,
      clientId: newBatchClient,
      courierId: newBatchCourier,
      status: 'Open',
      expectedCount: newBatchExpected,
      notes: newBatchNotes,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
    });

    setActiveBatchId(newBatch.id);
    setActiveSubTab('open_batch');
    setNewBatchNotes('');
  };

  // 3. CLOSE BATCH HANDLER
  const handleConfirmCloseBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingBatch) return;

    onCloseBatch(closingBatch.id, driverName, driverMobile, supervisorSigner);

    // Auto generate & download PDF manifest
    const batchItems = scannedItems.filter(i => i.batchId === closingBatch.id);
    const client = clients.find(c => c.id === closingBatch.clientId);
    const courier = couriers.find(cr => cr.id === closingBatch.courierId);

    generateBatchPDF(
      { ...closingBatch, status: 'Closed', driverName, driverMobile, supervisorSigner },
      batchItems,
      activeWarehouse,
      client,
      courier
    );

    setClosingBatch(null);
    setDriverName('');
    setDriverMobile('');
    setActiveSubTab('closed_batch');
  };

  // CSV Exporter
  const handleExportCSV = (batch: ReturnBatch) => {
    const items = scannedItems.filter(i => i.batchId === batch.id);
    const headers = ['#', 'Batch Number', 'AWB / Tracking #', 'Order #', 'Condition / Remark', 'Scan Timestamp', 'Scanned By'];
    const rows = items.map((item, idx) => [
      idx + 1,
      batch.batchNumber,
      item.trackingNumber,
      item.orderNumber || '',
      item.remark,
      new Date(item.scannedAt).toLocaleString(),
      item.scannedByName,
    ]);

    downloadCSV(`${batch.batchNumber}_ScanReport.csv`, headers, rows);
  };

  const remarksList: { key: ReturnRemarkType; label: string; color: string; activeColor: string }[] = [
    { key: 'Good', label: '1. Good (QC Pass)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', activeColor: 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30' },
    { key: 'Damage', label: '2. Damage', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', activeColor: 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30' },
    { key: 'Open Box', label: '3. Open Box', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', activeColor: 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30' },
    { key: 'Wrong Product', label: '4. Wrong Prod', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', activeColor: 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30' },
    { key: 'Short Qty', label: '5. Short Qty', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', activeColor: 'bg-orange-600 text-white border-orange-400 shadow-lg shadow-orange-600/30' },
    { key: 'Missing Product', label: '6. Missing Prod', color: 'bg-red-500/10 text-red-400 border-red-500/30', activeColor: 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30' },
    { key: 'Others', label: '7. Others', color: 'bg-slate-500/10 text-slate-300 border-slate-500/30', activeColor: 'bg-slate-600 text-white border-slate-400 shadow-lg shadow-slate-600/30' },
  ];

  if (isDeviceMode && activeBatch) {
    return (
      <HandheldScannerView
        activeBatch={activeBatch}
        batches={batches}
        scannedItems={scannedItems}
        clients={clients}
        couriers={couriers}
        activeWarehouse={activeWarehouse}
        currentUser={currentUser}
        onScanItem={onScanItem}
        onSelectBatch={(batchId) => setActiveBatchId(batchId)}
        onCloseBatchRequest={(batch) => {
          setIsDeviceMode(false);
          setClosingBatch(batch);
        }}
        onExitDeviceMode={() => setIsDeviceMode(false)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* MODULE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-indigo-400" /> RTO / B2C Returns Station
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standard Format <strong className="text-indigo-300">DD-Account-0101</strong> • 3-Point Fast Scanning (Date Auto, AWB/Order No, Conditions)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeBatch && (
            <button
              onClick={() => setIsDeviceMode(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              title="Switch to Mobile / PDA Handheld Terminal Scanning UI"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>📱 Device / PDA Mode</span>
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('create_batch')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Create New Batch
          </button>
        </div>
      </div>

      {/* TOP TABS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveSubTab('create_batch')}
          className={`px-4 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'create_batch'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Batch</span>
        </button>

        <button
          onClick={() => setActiveSubTab('open_batch')}
          className={`px-4 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'open_batch'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Unlock className="w-4 h-4 text-emerald-400" />
          <span>Open Batch ({openBatches.length})</span>
          {openBatches.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('closed_batch')}
          className={`px-4 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'closed_batch'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Close Batch ({closedBatches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Report & Manifest</span>
        </button>
      </div>

      {/* VIEW: CREATE NEW BATCH */}
      {activeSubTab === 'create_batch' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Create New Return Batch
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Standard Batch Format: <code className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-bold font-mono">DD - Account Reference - Serial No (0101)</code>
            </p>
          </div>

          {/* Live Batch Code Preview Box */}
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Generated Batch Number (Auto)</div>
              <div className="text-xl font-black font-mono text-white mt-0.5">{getBatchPreview()}</div>
            </div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold rounded-lg border border-indigo-500/30">
              Format: DD-ACC-0101
            </span>
          </div>

          <form onSubmit={handleCreateBatchSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Client / Account *</label>
              <select
                value={newBatchClient}
                onChange={e => setNewBatchClient(e.target.value)}
                className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 font-bold focus:outline-none focus:border-indigo-500"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Courier Partner *</label>
              <select
                value={newBatchCourier}
                onChange={e => setNewBatchCourier(e.target.value)}
                className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                {couriers.map(cr => (
                  <option key={cr.id} value={cr.id}>
                    {cr.name} ({cr.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Expected Shipments Count</label>
              <input
                type="number"
                min={1}
                value={newBatchExpected}
                onChange={e => setNewBatchExpected(Number(e.target.value))}
                className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 font-bold font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Batch Notes / Unload Details (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Morning van return lot..."
                value={newBatchNotes}
                onChange={e => setNewBatchNotes(e.target.value)}
                className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubTab('open_batch')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                Create Batch & Start Scanning <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW B: OPEN BATCH & FAST SCANNING STATION (Only 3 Points: Date Auto, AWB/Order No, Conditions) */}
      {activeSubTab === 'open_batch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4 cols): Active Open Batches */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Open Batches ({openBatches.length})
                </h2>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  title="Toggle Beep Audio"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search open batch..."
                  value={batchSearchQuery}
                  onChange={e => setBatchSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-700 focus:outline-none"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {openBatches.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs space-y-2">
                    <p>No open batches available.</p>
                    <button
                      onClick={() => setActiveSubTab('create_batch')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs"
                    >
                      + Create New Batch
                    </button>
                  </div>
                ) : (
                  openBatches
                    .filter(b => !batchSearchQuery || b.batchNumber.toLowerCase().includes(batchSearchQuery.toLowerCase()))
                    .map(batch => {
                      const isSelected = batch.id === activeBatchId;
                      const client = clients.find(c => c.id === batch.clientId);
                      const courier = couriers.find(cr => cr.id === batch.courierId);

                      return (
                        <div
                          key={batch.id}
                          onClick={() => setActiveBatchId(batch.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                              : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-white text-xs font-mono">{batch.batchNumber}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Open
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                            <span>{client?.name} • {courier?.name}</span>
                            <span className="font-black text-emerald-400">{batch.totalScanned} Scanned</span>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">{new Date(batch.createdAt).toLocaleDateString()}</span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setClosingBatch(batch);
                              }}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                              Close Batch & PDF
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): ULTRA FAST SCAN STATION (Exact 3 Points) */}
          <div className="lg:col-span-8 space-y-4">
            {activeBatch ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                {/* Active Batch Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono text-white">{activeBatch.batchNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {clients.find(c => c.id === activeBatch.clientId)?.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Courier: <strong className="text-slate-200">{couriers.find(cr => cr.id === activeBatch.courierId)?.name}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsDeviceMode(true)}
                      className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                      title="Switch to Mobile / PDA Handheld Ergonomic View"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>📱 Device Mode</span>
                    </button>

                    <div className="text-right border-l border-slate-700 pl-3">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total Scanned</div>
                      <div className="text-2xl font-black text-emerald-400 leading-none">{activeBatch.totalScanned}</div>
                    </div>

                    <button
                      onClick={() => setClosingBatch(activeBatch)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                      Close Batch & Sign
                    </button>
                  </div>
                </div>

                {/* THE STREAMLINED SCANNING INTERFACE */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-2 border-indigo-500/70 p-5 rounded-2xl shadow-2xl space-y-4">
                  {/* Point 1: AWB No or Order No */}
                  <form onSubmit={handleBarcodeSubmit} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                          <QrCode className="w-4 h-4 text-indigo-400 animate-pulse" />
                          AWB No or Order No *
                        </label>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          Ready for Laser Gun / Keyboard Scan
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          ref={barcodeInputRef}
                          type="text"
                          autoFocus
                          placeholder="Scan Barcode with Laser Gun or Enter AWB No..."
                          value={barcodeInput}
                          onChange={e => setBarcodeInput(e.target.value)}
                          className="w-full bg-slate-950 text-emerald-400 placeholder:text-slate-600 pl-4 pr-24 py-3 rounded-xl text-base font-mono font-black border-2 border-indigo-500/80 focus:outline-none focus:border-emerald-400 shadow-inner"
                        />
                        <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1.5">
                          {barcodeInput && (
                            <button
                              type="button"
                              onClick={() => {
                                setBarcodeInput('');
                                barcodeInputRef.current?.focus();
                              }}
                              className="p-1.5 text-slate-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="submit"
                            className="h-full px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Zap className="w-3.5 h-3.5" /> SCAN
                          </button>
                        </div>
                      </div>

                      {/* Quick Sample Presets */}
                      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px]">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">
                          Sample AWBs:
                        </span>
                        {['DEL-8839210', 'BD-5541908', 'SF-7729104', 'EK-9021844'].map(sample => (
                          <button
                            key={sample}
                            type="button"
                            onClick={() => handleBarcodeSubmit(undefined, sample)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[10px] font-bold border border-slate-700 whitespace-nowrap active:scale-95"
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scan Status Alert */}
                    {lastScanResult && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          lastScanResult.success
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {lastScanResult.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                        )}
                        <span>{lastScanResult.msg}</span>
                      </div>
                    )}

                    {/* Point 2: Small / Compact Conditions Selection */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Condition (QC Status):
                        </label>
                        <span className="text-[11px] font-bold text-indigo-400">
                          Selected: <strong className="text-white font-mono uppercase underline">{selectedRemark}</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                        {remarksList.map(rm => (
                          <button
                            type="button"
                            key={rm.key}
                            onClick={() => setSelectedRemark(rm.key)}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all text-center truncate ${
                              selectedRemark === rm.key
                                ? `${rm.activeColor} scale-[1.02] ring-1 ring-white/40`
                                : `${rm.color} hover:bg-slate-800/80`
                            }`}
                          >
                            {rm.key}
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>

                  {/* RECENT 5 SCANNED TRACKING IDs (LINE ITEMS) */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <List className="w-3.5 h-3.5 text-indigo-400" />
                        Recent 5 Scanned Tracking IDs:
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        {activeBatchItems.length} Total in Batch
                      </span>
                    </div>

                    {activeBatchItems.length === 0 ? (
                      <div className="bg-slate-950/60 rounded-xl p-3 text-center text-slate-500 text-xs border border-dashed border-slate-800">
                        No parcels scanned yet. Scan any AWB / Order No barcode to view recent line items.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {activeBatchItems.slice(-5).reverse().map((item, idx) => (
                          <div
                            key={item.id}
                            className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl px-3 py-2 flex items-center justify-between text-xs transition-all animate-in fade-in"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-mono font-black text-white text-xs tracking-wide">
                                  {item.trackingNumber}
                                </span>
                                <span className="text-[10px] text-slate-500 ml-2 font-mono">
                                  {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  item.remark === 'Good'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : item.remark === 'Damage' || item.remark === 'Missing Product'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {item.remark}
                              </span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">
                                by {item.scannedByName}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SCANNED ITEMS TABLE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Scanned Items in this Batch ({activeBatchItems.length})
                    </h3>
                    <button
                      onClick={() => handleExportCSV(activeBatch)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel CSV
                    </button>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5">#</th>
                          <th className="px-3 py-2.5">AWB / Order No</th>
                          <th className="px-3 py-2.5">Condition</th>
                          <th className="px-3 py-2.5">Date & Time (Auto)</th>
                          <th className="px-3 py-2.5">Scanned By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {activeBatchItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                              No items scanned yet. Point barcode gun or type AWB / Order No above.
                            </td>
                          </tr>
                        ) : (
                          activeBatchItems.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-800/50">
                              <td className="px-3 py-2 font-mono text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-2 font-mono font-bold text-white">{item.trackingNumber}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.remark === 'Good'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : item.remark === 'Damage' || item.remark === 'Missing Product'
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {item.remark}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-400 font-mono">
                                {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                              <td className="px-3 py-2 text-slate-400">{item.scannedByName}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                Select an open batch or create a new batch to start scanning.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: CLOSED BATCHES */}
      {activeSubTab === 'closed_batch' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" /> Closed Batches & Manifests ({closedBatches.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Archived return batches with finalized driver handover signatures and PDF manifests.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search closed batches..."
                value={batchSearchQuery}
                onChange={e => setBatchSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-xs text-slate-200 p-2 rounded-lg border border-slate-700"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Client / Brand</th>
                  <th className="px-4 py-3">Courier</th>
                  <th className="px-4 py-3">Total Scanned</th>
                  <th className="px-4 py-3">Driver Sign-off</th>
                  <th className="px-4 py-3">Closed Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {closedBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No closed batches yet. Close an open batch after scanning to view here.
                    </td>
                  </tr>
                ) : (
                  closedBatches
                    .filter(b => !batchSearchQuery || b.batchNumber.toLowerCase().includes(batchSearchQuery.toLowerCase()))
                    .map(b => {
                      const client = clients.find(c => c.id === b.clientId);
                      const courier = couriers.find(cr => cr.id === b.courierId);
                      const items = scannedItems.filter(i => i.batchId === b.id);

                      return (
                        <tr key={b.id} className="hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-400">{b.batchNumber}</td>
                          <td className="px-4 py-3 font-bold text-white">{client?.name}</td>
                          <td className="px-4 py-3 text-slate-400">{courier?.name}</td>
                          <td className="px-4 py-3 font-bold text-emerald-400">{b.totalScanned} Items</td>
                          <td className="px-4 py-3 text-slate-300">
                            {b.driverName ? `${b.driverName} (${b.driverMobile || 'Signed'})` : 'Supervisor Verified'}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {b.closedAt ? new Date(b.closedAt).toLocaleString() : new Date(b.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => generateBatchPDF(b, items, activeWarehouse, client, courier)}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow"
                                title="Download PDF Manifest"
                              >
                                <Printer className="w-3.5 h-3.5" /> PDF
                              </button>
                              <button
                                onClick={() => handleExportCSV(b)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Export CSV"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW D: REPORT TAB */}
      {activeSubTab === 'reports' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> Return Batch Reports & Summary
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Download comprehensive 7-condition breakdown reports for all accounts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
              <div className="text-xs text-slate-400 font-bold uppercase">Total Batches</div>
              <div className="text-2xl font-black text-white">{warehouseBatches.length}</div>
              <div className="text-[11px] text-slate-400">{openBatches.length} Open • {closedBatches.length} Closed</div>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
              <div className="text-xs text-slate-400 font-bold uppercase">Total Scanned Items</div>
              <div className="text-2xl font-black text-emerald-400">
                {warehouseBatches.reduce((sum, b) => sum + b.totalScanned, 0)}
              </div>
              <div className="text-[11px] text-slate-400">Across {clients.length} Accounts</div>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
              <div className="text-xs text-slate-400 font-bold uppercase">Warehouse Hub</div>
              <div className="text-2xl font-black text-indigo-400">{activeWarehouse.code}</div>
              <div className="text-[11px] text-slate-400">{activeWarehouse.city}</div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 flex justify-end">
            <button
              onClick={() => {
                const headers = ['#', 'Batch Number', 'Client', 'Courier', 'Status', 'Total Scanned', 'Created At', 'Closed At'];
                const rows = warehouseBatches.map((b, idx) => [
                  idx + 1,
                  b.batchNumber,
                  clients.find(c => c.id === b.clientId)?.name || '',
                  couriers.find(cr => cr.id === b.courierId)?.name || '',
                  b.status,
                  b.totalScanned,
                  b.createdAt,
                  b.closedAt || '-',
                ]);
                downloadCSV(`Warehouse_${activeWarehouse.code}_BatchesReport.csv`, headers, rows);
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download Complete Warehouse Batches CSV
            </button>
          </div>
        </div>
      )}

      {/* CLOSE BATCH & COURIER HANDOVER MODAL */}
      {closingBatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" /> Close Batch & Sign Handover
              </h3>
              <button onClick={() => setClosingBatch(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Closing <strong className="text-white font-mono">{closingBatch.batchNumber}</strong> with <strong className="text-emerald-400">{closingBatch.totalScanned} scanned shipments</strong>.
            </p>

            <form onSubmit={handleConfirmCloseBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Courier Driver / Representative Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Vishwakarma"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Courier Driver Mobile *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 97654 32109"
                  value={driverMobile}
                  onChange={e => setDriverMobile(e.target.value)}
                  className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supervisor Signer</label>
                <input
                  type="text"
                  required
                  value={supervisorSigner}
                  onChange={e => setSupervisorSigner(e.target.value)}
                  className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 font-bold"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400">
                ✓ Auto generates official PDF Manifest and locks batch from further scanning.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClosingBatch(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-600/30"
                >
                  Close Batch & Download PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
