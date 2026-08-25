import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  QrCode,
  Plus,
  Search,
  CheckCircle2,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  Clock,
  Printer,
  Zap,
  List,
  Edit2,
  Trash2,
  Check,
  Building,
  Truck,
  PenTool,
  Save,
  Undo2,
  ArrowLeft,
  FileText,
  Eye,
  Calendar,
  UserCheck,
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
import { generateBatchPDF, generateWarehouseBatchesSummaryPDF } from '../utils/pdfGenerator';
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
  onUpdateItem?: (itemId: string, updates: { trackingNumber?: string; remark?: ReturnRemarkType }) => void;
  onDeleteItem?: (itemId: string) => void;
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
  onUpdateItem,
  onDeleteItem,
  onCloseBatch,
  isOpenCreateModal,
  onCloseCreateModal,
}) => {
  // Top Tabs: 'open_batch' | 'closed_batch' | 'reports'
  const [activeMainTab, setActiveMainTab] = useState<'open_batch' | 'closed_batch' | 'reports'>('open_batch');

  // Sub-view in Open Batch: 'scan' (default) | 'create' | 'close'
  const [openBatchView, setOpenBatchView] = useState<'scan' | 'create' | 'close'>('scan');

  // Active batch selected for scanning station
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  // Device / Handheld Terminal (HHT / PDA / Phone) Fullscreen Mode
  const [isDeviceMode, setIsDeviceMode] = useState(false);

  // Live Date/Time
  const [liveDateTime, setLiveDateTime] = useState<string>(new Date().toLocaleString());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDateTime(new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // NEW BATCH FORM STATE
  const [newBatchClient, setNewBatchClient] = useState(clients[0]?.id || '');
  const [newBatchCourier, setNewBatchCourier] = useState(couriers[0]?.id || '');
  const [newBatchChannel, setNewBatchChannel] = useState<'D2C Return' | 'B2C Return' | 'Marketplace Return' | 'Customer RTO'>('B2C Return');
  const [newBatchExpected, setNewBatchExpected] = useState<number>(50);
  const [newBatchNotes, setNewBatchNotes] = useState('');

  // SCANNER GUN & AWB SCAN STATE
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedRemark, setSelectedRemark] = useState<ReturnRemarkType>('Good');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Item Edit & Delete Modal States
  const [editingItem, setEditingItem] = useState<ScannedReturnItem | null>(null);
  const [editAwbValue, setEditAwbValue] = useState('');
  const [editRemarkValue, setEditRemarkValue] = useState<ReturnRemarkType>('Good');
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // CLOSED BATCH DETAIL INSPECTION MODAL STATE
  const [selectedClosedBatch, setSelectedClosedBatch] = useState<ReturnBatch | null>(null);
  const [closedBatchItemSearch, setClosedBatchItemSearch] = useState('');

  // CLOSE BATCH & SIGN HANDOVER STATE
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [supervisorSigner, setSupervisorSigner] = useState(currentUser.name);
  const [handoverSignatureStatus, setHandoverSignatureStatus] = useState<'Pending' | 'Signed'>('Pending');
  const [handoverNotes, setHandoverNotes] = useState('');

  // Filter Search
  const [batchSearchQuery, setBatchSearchQuery] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);

  // Filter open & closed batches for current warehouse
  const warehouseBatches = batches.filter(b => b.warehouseId === activeWarehouse.id);
  const openBatches = warehouseBatches.filter(b => b.status === 'Open');
  const closedBatches = warehouseBatches.filter(b => b.status === 'Closed');

  // Auto-select first open batch if none selected
  useEffect(() => {
    if (!activeBatchId && openBatches.length > 0) {
      setActiveBatchId(openBatches[0].id);
      setOpenBatchView('scan');
    } else if (openBatches.length === 0) {
      setOpenBatchView('create');
    }
  }, [openBatches.length, activeBatchId]);

  // Keep scanner input focused when active
  useEffect(() => {
    if (activeMainTab === 'open_batch' && openBatchView === 'scan' && activeBatchId && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeBatchId, activeMainTab, openBatchView]);

  // Handle external modal trigger from Header/Sidebar
  useEffect(() => {
    if (isOpenCreateModal) {
      setActiveMainTab('open_batch');
      setOpenBatchView('create');
      onCloseCreateModal();
    }
  }, [isOpenCreateModal, onCloseCreateModal]);

  const activeBatch = batches.find(b => b.id === activeBatchId);
  const activeBatchItems = scannedItems.filter(i => i.batchId === activeBatchId);
  // Latest 10 Scanned AWBs
  const latest10ScannedItems = [...activeBatchItems].reverse().slice(0, 10);

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
      // Audio fallback
    }
  };

  // Compute auto-generated batch code in DD-AccountReference-SerialNo format
  const getAutoBatchCode = (clientId: string) => {
    const today = new Date();
    const dayStr = String(today.getDate()).padStart(2, '0');
    const selectedClient = clients.find(c => c.id === clientId);
    const clientRef = (selectedClient?.code || 'ACC').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
    const clientExistingBatches = batches.filter(b => b.clientId === clientId);
    const serialNo = String(101 + clientExistingBatches.length).padStart(4, '0');
    return `${dayStr}-${clientRef}-${serialNo}`;
  };

  // CREATE NEW BATCH SUBMIT
  const handleCreateBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch = onAddBatch({
      batchType: newBatchChannel === 'D2C Return' ? 'RTO/B2C' : 'RTO/B2C',
      warehouseId: activeWarehouse.id,
      clientId: newBatchClient,
      courierId: newBatchCourier,
      status: 'Open',
      expectedCount: newBatchExpected,
      notes: `${newBatchChannel} | ${newBatchNotes}`,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
    });

    setActiveBatchId(newBatch.id);
    setOpenBatchView('scan');
    setNewBatchNotes('');
    setLastScanResult({
      success: true,
      msg: `Batch ${newBatch.batchNumber} created.`,
    });
  };

  // SCAN ITEM SUBMIT
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const codeToScan = barcodeInput.trim().toUpperCase();
    if (!activeBatchId || !codeToScan) return;

    const result = onScanItem(activeBatchId, codeToScan, selectedRemark);

    setLastScanResult({ success: result.success, msg: result.message });
    playBeep(result.success);

    // Haptic vibration feedback for mobile/handheld
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

  // EDIT AWB ITEM SUBMIT
  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (onUpdateItem) {
      onUpdateItem(editingItem.id, {
        trackingNumber: editAwbValue,
        remark: editRemarkValue,
      });
    }
    setEditingItem(null);
    setLastScanResult({
      success: true,
      msg: `AWB updated to ${editAwbValue.toUpperCase()} [${editRemarkValue}]`,
    });
  };

  // REMOVE AWB ITEM SUBMIT
  const handleConfirmDeleteItem = () => {
    if (!deletingItemId) return;
    if (onDeleteItem) {
      onDeleteItem(deletingItemId);
    }
    setDeletingItemId(null);
    setLastScanResult({
      success: true,
      msg: 'AWB removed from batch.',
    });
  };

  // SIGN HANDOVER & CLOSE BATCH
  const handleConfirmCloseBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatch) return;

    onCloseBatch(activeBatch.id, driverName, driverMobile, supervisorSigner);

    // Auto generate & download PDF manifest
    const batchItems = scannedItems.filter(i => i.batchId === activeBatch.id);
    const client = clients.find(c => c.id === activeBatch.clientId);
    const courier = couriers.find(cr => cr.id === activeBatch.courierId);

    generateBatchPDF(
      { ...activeBatch, status: 'Closed', driverName, driverMobile, supervisorSigner },
      batchItems,
      activeWarehouse,
      client,
      courier
    );

    setDriverName('');
    setDriverMobile('');
    setHandoverSignatureStatus('Pending');
    setActiveMainTab('closed_batch');
  };

  // Download Batch PDF Manifest
  const handleDownloadBatchPDF = (batch: ReturnBatch) => {
    const items = scannedItems.filter(i => i.batchId === batch.id);
    const client = clients.find(c => c.id === batch.clientId);
    const courier = couriers.find(cr => cr.id === batch.courierId);
    generateBatchPDF(batch, items, activeWarehouse, client, courier);
  };

  // 7 QC Conditions List
  const remarksList: { key: ReturnRemarkType; label: string; color: string; activeColor: string }[] = [
    { key: 'Good', label: '1. Good', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', activeColor: 'bg-emerald-600 text-white border-emerald-400 shadow-md' },
    { key: 'Damage', label: '2. Damage', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', activeColor: 'bg-rose-600 text-white border-rose-400 shadow-md' },
    { key: 'Open Box', label: '3. Open Box', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', activeColor: 'bg-amber-600 text-white border-amber-400 shadow-md' },
    { key: 'Wrong Product', label: '4. Wrong Product', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', activeColor: 'bg-purple-600 text-white border-purple-400 shadow-md' },
    { key: 'Short Qty', label: '5. Short Qty', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', activeColor: 'bg-orange-600 text-white border-orange-400 shadow-md' },
    { key: 'Missing Product', label: '6. Missing Product', color: 'bg-red-500/10 text-red-400 border-red-500/30', activeColor: 'bg-red-600 text-white border-red-400 shadow-md' },
    { key: 'Others', label: '7. Others', color: 'bg-slate-500/10 text-slate-300 border-slate-500/30', activeColor: 'bg-slate-600 text-white border-slate-400 shadow-md' },
  ];

  // Signature pad drawing helpers
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawingSig(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    setHandoverSignatureStatus('Signed');
  };

  const handleStopDraw = () => {
    setIsDrawingSig(false);
  };

  const handleClearSig = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHandoverSignatureStatus('Pending');
  };

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
          setActiveBatchId(batch.id);
          setOpenBatchView('close');
        }}
        onExitDeviceMode={() => setIsDeviceMode(false)}
      />
    );
  }

  return (
    <div className="p-2 sm:p-5 space-y-3 sm:space-y-4 max-w-[1680px] mx-auto w-full">
      {/* MODULE HEADER */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5 sm:pb-3">
        <div className="min-w-0">
          <h1 className="text-sm sm:text-xl font-bold text-white flex items-center gap-1.5 sm:gap-2 truncate">
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
            <span className="truncate">RTO / Returns Station</span>
          </h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-create-batch-header"
            onClick={() => {
              setActiveMainTab('open_batch');
              setOpenBatchView('create');
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] sm:text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Create Batch</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>
      </div>

      {/* 3 TOP TABS */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          id="tab-open-batch"
          onClick={() => {
            setActiveMainTab('open_batch');
            if (openBatches.length > 0 && openBatchView !== 'create') {
              setOpenBatchView('scan');
            }
          }}
          className={`px-2.5 sm:px-4 py-2 rounded-lg font-semibold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMainTab === 'open_batch'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Open Batch ({openBatches.length})</span>
          {openBatches.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          )}
        </button>

        <button
          id="tab-closed-batch"
          onClick={() => setActiveMainTab('closed_batch')}
          className={`px-2.5 sm:px-4 py-2 rounded-lg font-semibold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMainTab === 'closed_batch'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Closed Batch ({closedBatches.length})</span>
        </button>

        <button
          id="tab-report-manifest"
          onClick={() => setActiveMainTab('reports')}
          className={`px-2.5 sm:px-4 py-2 rounded-lg font-semibold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMainTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">Report & Manifest</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OPEN BATCH                                        */}
      {/* ======================================================== */}
      {activeMainTab === 'open_batch' && (
        <div className="space-y-3.5">
          {/* VIEW A: CREATE NEW BATCH FORM */}
          {openBatchView === 'create' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl max-w-3xl mx-auto space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" /> New Return Batch
                </h2>
                {openBatches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenBatchView('scan')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>

              {/* Batch Code Preview */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">
                    Batch Code
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
                    {getAutoBatchCode(newBatchClient)}
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-400">
                  {liveDateTime}
                </div>
              </div>

              <form onSubmit={handleCreateBatchSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Account Name */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Account Name *
                    </label>
                    <select
                      value={newBatchClient}
                      onChange={e => setNewBatchClient(e.target.value)}
                      className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer text-xs"
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Courier */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Courier Partner *
                    </label>
                    <select
                      value={newBatchCourier}
                      onChange={e => setNewBatchCourier(e.target.value)}
                      className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer text-xs"
                    >
                      {couriers.map(cr => (
                        <option key={cr.id} value={cr.id}>
                          {cr.name} ({cr.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Channel */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Channel *
                    </label>
                    <select
                      value={newBatchChannel}
                      onChange={e => setNewBatchChannel(e.target.value as any)}
                      className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer text-xs"
                    >
                      <option value="B2C Return">B2C Return</option>
                      <option value="D2C Return">D2C Return</option>
                      <option value="Marketplace Return">Marketplace Return (Amazon / Flipkart / Myntra)</option>
                      <option value="Customer RTO">Customer RTO (Undelivered / Refused)</option>
                    </select>
                  </div>

                  {/* Expected Count */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Expected Shipments (Optional)</label>
                    <input
                      type="number"
                      min={1}
                      value={newBatchExpected}
                      onChange={e => setNewBatchExpected(Number(e.target.value))}
                      className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 font-mono focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Batch Notes</label>
                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={newBatchNotes}
                    onChange={e => setNewBatchNotes(e.target.value)}
                    className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  {openBatches.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setOpenBatchView('scan')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium text-xs"
                    >
                      Cancel
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Create & Start Scanning</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW B: ACTIVE SCANNING WORKBENCH */}
          {openBatchView === 'scan' && (
            <div className="space-y-3">
              {activeBatch ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
                  {/* Active Batch Sleek Compact Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-800/80 p-2 sm:p-2.5 rounded-lg border border-slate-700/80">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold font-mono text-white tracking-wide whitespace-nowrap bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700/60">
                        {activeBatch.batchNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 truncate max-w-[120px] sm:max-w-[180px]">
                        {clients.find(c => c.id === activeBatch.clientId)?.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 truncate max-w-[120px] sm:max-w-[180px]">
                        {couriers.find(cr => cr.id === activeBatch.courierId)?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono hidden md:inline ml-1">
                        {new Date(activeBatch.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
                      {openBatches.length > 1 && (
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                          <span className="text-slate-400">Batch:</span>
                          <select
                            value={activeBatchId || ''}
                            onChange={e => setActiveBatchId(e.target.value)}
                            className="bg-slate-850 border border-slate-700 text-white text-[10px] sm:text-[11px] rounded px-1.5 py-0.5 font-mono focus:outline-none cursor-pointer"
                          >
                            {openBatches.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.batchNumber} ({b.totalScanned})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/70">
                        <span className="text-[9px] text-slate-400 uppercase font-semibold">Scanned:</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono leading-none">{activeBatch.totalScanned}</span>
                      </div>

                      <button
                        onClick={() => setOpenBatchView('close')}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Close Batch</span>
                      </button>
                    </div>
                  </div>

                  {/* SCANNING WORKBENCH */}
                  <div className="bg-slate-950 border border-indigo-500/30 p-2.5 sm:p-3 rounded-xl shadow-md space-y-2">
                    {/* Barcode Scan Box */}
                    <form onSubmit={handleBarcodeSubmit} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                          <QrCode className="w-3 h-3 text-indigo-400" />
                          AWB / Order Barcode
                        </label>
                        <span className="text-[9px] sm:text-[10px] text-emerald-400 font-medium">
                          Laser Gun Ready (Auto-Enter)
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          ref={barcodeInputRef}
                          type="text"
                          autoFocus
                          placeholder="Scan barcode with gun or type AWB..."
                          value={barcodeInput}
                          onChange={e => setBarcodeInput(e.target.value)}
                          className="w-full bg-slate-900 text-emerald-300 placeholder:text-slate-600 pl-2.5 pr-16 py-1.5 sm:py-2 rounded-lg text-xs font-mono font-medium border border-indigo-500/60 focus:outline-none focus:border-emerald-400 shadow-inner"
                        />
                        <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
                          {barcodeInput && (
                            <button
                              type="button"
                              onClick={() => {
                                setBarcodeInput('');
                                barcodeInputRef.current?.focus();
                              }}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="submit"
                            className="h-full px-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-[11px] rounded shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3 h-3" /> SCAN
                          </button>
                        </div>
                      </div>

                      {/* Scan Feedback Message */}
                      {lastScanResult && (
                        <div
                          className={`p-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in duration-150 ${
                            lastScanResult.success
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {lastScanResult.success ? (
                            <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="w-3 h-3 shrink-0 text-rose-400" />
                          )}
                          <span className="truncate">{lastScanResult.msg}</span>
                        </div>
                      )}

                      {/* Condition Selection in compact grid */}
                      <div className="pt-0.5">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                            QC Condition / Status
                          </label>
                          <span className="text-[10px] text-indigo-400 font-medium">
                            Active: <strong className="text-white">{selectedRemark}</strong>
                          </span>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                          {remarksList.map(rm => (
                            <button
                              type="button"
                              key={rm.key}
                              onClick={() => {
                                setSelectedRemark(rm.key);
                                barcodeInputRef.current?.focus();
                              }}
                              className={`py-1 px-1 rounded text-[10px] font-medium border transition-all text-center truncate cursor-pointer ${
                                selectedRemark === rm.key
                                  ? `${rm.activeColor} ring-1 ring-white/40 scale-[1.01]`
                                  : `${rm.color} hover:bg-slate-800/80`
                              }`}
                            >
                              {rm.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </form>

                    {/* RECENT SCANNED AWBS (LATEST 10 DISPLAY) */}
                    <div className="pt-1.5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                          <List className="w-3 h-3 text-indigo-400" />
                          Latest 10 Scanned AWBs
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {activeBatchItems.length} Total in Batch
                        </span>
                      </div>

                      {latest10ScannedItems.length === 0 ? (
                        <div className="bg-slate-900/60 rounded-lg p-2.5 text-center text-slate-500 text-[11px] border border-dashed border-slate-800">
                          No items scanned in this batch yet. Scan AWB barcode above.
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-0.5">
                          {latest10ScannedItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg px-2 py-1 flex items-center justify-between gap-1.5 text-xs transition-all"
                            >
                              {/* AWB & Timestamp */}
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 font-mono text-[9px] font-medium flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-mono font-bold text-white text-[11px] sm:text-xs tracking-wide truncate">
                                  {item.trackingNumber}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono shrink-0 hidden sm:inline">
                                  {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>

                              {/* Condition Badge & Actions */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium ${
                                    item.remark === 'Good'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : item.remark === 'Damage' || item.remark === 'Missing Product'
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {item.remark}
                                </span>

                                <div className="flex items-center gap-0.5 pl-1 border-l border-slate-800">
                                  <button
                                    onClick={() => {
                                      setEditingItem(item);
                                      setEditAwbValue(item.trackingNumber);
                                      setEditRemarkValue(item.remark);
                                    }}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition-all cursor-pointer"
                                    title="Edit AWB"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>

                                  <button
                                    onClick={() => setDeletingItemId(item.id)}
                                    className="p-1 rounded bg-slate-800 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 transition-all cursor-pointer"
                                    title="Delete AWB"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FULL SCANNED TABLE & EXPORT */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        All Items in Batch ({activeBatchItems.length})
                      </h3>
                      <button
                        onClick={() => handleDownloadBatchPDF(activeBatch)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" /> PDF Manifest
                      </button>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-850 text-slate-400 uppercase font-semibold text-[10px] sticky top-0">
                          <tr>
                            <th className="px-2.5 py-1.5">#</th>
                            <th className="px-2.5 py-1.5">AWB</th>
                            <th className="px-2.5 py-1.5">Condition</th>
                            <th className="px-2.5 py-1.5">Scanned Time</th>
                            <th className="px-2.5 py-1.5">User</th>
                            <th className="px-2.5 py-1.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                          {activeBatchItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-2.5 py-4 text-center text-slate-500 text-xs">
                                No items scanned yet.
                              </td>
                            </tr>
                          ) : (
                            activeBatchItems.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-slate-800/50">
                                <td className="px-2.5 py-1 font-mono text-slate-500">{idx + 1}</td>
                                <td className="px-2.5 py-1 font-mono font-medium text-white">{item.trackingNumber}</td>
                                <td className="px-2.5 py-1">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-medium ${
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
                                <td className="px-2.5 py-1 text-slate-400 font-mono">
                                  {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                                <td className="px-2.5 py-1 text-slate-400">{item.scannedByName}</td>
                                <td className="px-2.5 py-1 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingItem(item);
                                        setEditAwbValue(item.trackingNumber);
                                        setEditRemarkValue(item.remark);
                                      }}
                                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white"
                                      title="Edit AWB"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingItemId(item.id)}
                                      className="p-1 rounded bg-slate-800 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200"
                                      title="Delete AWB"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-3">
                  <p className="text-xs">No active open batch.</p>
                  <button
                    onClick={() => setOpenBatchView('create')}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer"
                  >
                    + Create New Batch
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW C: CLOSE BATCH & SIGN HANDOVER */}
          {openBatchView === 'close' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" /> Close Batch & Handover
                </h2>
                <button
                  type="button"
                  onClick={() => setOpenBatchView('scan')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>

              {activeBatch ? (
                <form onSubmit={handleConfirmCloseBatch} className="space-y-5 text-xs">
                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Batch Code</div>
                      <div className="text-sm font-mono font-bold text-indigo-400 truncate mt-0.5">{activeBatch.batchNumber}</div>
                    </div>

                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Total Scanned</div>
                      <div className="text-sm font-mono font-bold text-emerald-400 truncate mt-0.5">{activeBatch.totalScanned} Items</div>
                    </div>

                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Account</div>
                      <div className="text-sm font-medium text-white truncate mt-0.5">
                        {clients.find(c => c.id === activeBatch.clientId)?.name}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Courier</div>
                      <div className="text-sm font-medium text-white truncate mt-0.5">
                        {couriers.find(cr => cr.id === activeBatch.courierId)?.name}
                      </div>
                    </div>
                  </div>

                  {/* Courier Handover Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Courier Driver / Rep Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Driver Name"
                        value={driverName}
                        onChange={e => setDriverName(e.target.value)}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-400 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Courier Driver Mobile *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mobile Number"
                        value={driverMobile}
                        onChange={e => setDriverMobile(e.target.value)}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-mono focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Supervisor Name
                      </label>
                      <input
                        type="text"
                        required
                        value={supervisorSigner}
                        onChange={e => setSupervisorSigner(e.target.value)}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-medium focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Bag seal or remarks"
                        value={handoverNotes}
                        onChange={e => setHandoverNotes(e.target.value)}
                        className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Digital Signature Pad */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-medium flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                        Driver Signature *
                      </label>
                      <div className="flex items-center gap-2">
                        {handoverSignatureStatus === 'Signed' && (
                          <span className="text-[10px] text-emerald-400 font-medium">✓ Signed</span>
                        )}
                        <button
                          type="button"
                          onClick={handleClearSig}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <Undo2 className="w-3 h-3" /> Clear
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-700 rounded-xl p-1 flex items-center justify-center">
                      <canvas
                        ref={sigCanvasRef}
                        width={600}
                        height={120}
                        onMouseDown={handleStartDraw}
                        onMouseMove={handleDraw}
                        onMouseUp={handleStopDraw}
                        onMouseLeave={handleStopDraw}
                        onTouchStart={handleStartDraw}
                        onTouchMove={handleDraw}
                        onTouchEnd={handleStopDraw}
                        className="w-full h-[120px] bg-slate-950 cursor-crosshair rounded-lg touch-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setOpenBatchView('scan')}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Scanning
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Close Batch & Download Manifest</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  Select an open batch first.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CLOSED BATCH                                      */}
      {/* ======================================================== */}
      {activeMainTab === 'closed_batch' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" /> Closed Batches ({closedBatches.length})
              </h2>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search batches..."
                value={batchSearchQuery}
                onChange={e => setBatchSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-xs text-slate-200 p-2 rounded-lg border border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
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
                      No closed batches.
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
                        <tr
                          key={b.id}
                          onClick={() => {
                            setSelectedClosedBatch(b);
                            setClosedBatchItemSearch('');
                          }}
                          className="hover:bg-slate-800/80 cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3 font-mono font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{b.batchNumber}</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-white">{client?.name}</td>
                          <td className="px-4 py-3 text-slate-400">{courier?.name}</td>
                          <td className="px-4 py-3 font-bold text-emerald-400">{b.totalScanned} Items</td>
                          <td className="px-4 py-3 text-slate-300">
                            {b.driverName ? `${b.driverName} (${b.driverMobile || 'Signed'})` : 'Supervisor Verified'}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {b.closedAt ? new Date(b.closedAt).toLocaleString() : new Date(b.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedClosedBatch(b);
                                  setClosedBatchItemSearch('');
                                }}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-medium text-[11px] flex items-center gap-1 border border-slate-700 shadow cursor-pointer"
                                title="View Batch Details & AWBs"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-400" /> View
                              </button>
                              <button
                                onClick={() => handleDownloadBatchPDF(b)}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] flex items-center gap-1 shadow cursor-pointer"
                                title="Download Return Batch PDF Manifest"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>PDF Manifest</span>
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

      {/* ======================================================== */}
      {/* TAB 3: REPORT & MANIFEST                                 */}
      {/* ======================================================== */}
      {activeMainTab === 'reports' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> Return Reports & Audit Manifests
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
              <div className="text-xs text-slate-400 font-medium uppercase">Total Batches</div>
              <div className="text-2xl font-bold text-white">{warehouseBatches.length}</div>
              <div className="text-[11px] text-slate-400">{openBatches.length} Open • {closedBatches.length} Closed</div>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
              <div className="text-xs text-slate-400 font-medium uppercase">Total Scanned Items</div>
              <div className="text-2xl font-bold text-emerald-400">
                {warehouseBatches.reduce((sum, b) => sum + b.totalScanned, 0)}
              </div>
              <div className="text-[11px] text-slate-400">Across {clients.length} Accounts</div>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
              <div className="text-xs text-slate-400 font-medium uppercase">Warehouse Hub</div>
              <div className="text-2xl font-bold text-indigo-400">{activeWarehouse.code}</div>
              <div className="text-[11px] text-slate-400">{activeWarehouse.city}</div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 flex justify-end">
            <button
              onClick={() => {
                generateWarehouseBatchesSummaryPDF(warehouseBatches, activeWarehouse, clients, couriers);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Download Warehouse Batches PDF Report
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: EDIT AWB ITEM MODAL                             */}
      {/* ======================================================== */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" /> Edit Scanned AWB
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">AWB / Tracking Number *</label>
                <input
                  type="text"
                  required
                  value={editAwbValue}
                  onChange={e => setEditAwbValue(e.target.value)}
                  className="w-full bg-slate-800 text-emerald-400 p-2.5 rounded-xl border border-slate-700 font-mono font-medium uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Condition (QC Status) *</label>
                <select
                  value={editRemarkValue}
                  onChange={e => setEditRemarkValue(e.target.value as ReturnRemarkType)}
                  className="w-full bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="Good">1. Good</option>
                  <option value="Damage">2. Damage</option>
                  <option value="Open Box">3. Open Box</option>
                  <option value="Wrong Product">4. Wrong Product</option>
                  <option value="Short Qty">5. Short Qty</option>
                  <option value="Missing Product">6. Missing Product</option>
                  <option value="Others">7. Others</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DELETE AWB CONFIRMATION                         */}
      {/* ======================================================== */}
      {deletingItemId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Remove AWB?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This will deduct 1 unit from total count.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeletingItemId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md shadow-rose-600/30"
              >
                Yes, Remove AWB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CLOSED BATCH DETAILS & SCAN ITEMS VIEWER        */}
      {/* ======================================================== */}
      {selectedClosedBatch && (() => {
        const batchItems = scannedItems.filter(i => i.batchId === selectedClosedBatch.id);
        const filteredItems = batchItems.filter(i =>
          !closedBatchItemSearch ||
          i.trackingNumber.toLowerCase().includes(closedBatchItemSearch.toLowerCase()) ||
          i.remark.toLowerCase().includes(closedBatchItemSearch.toLowerCase()) ||
          (i.scannedByName && i.scannedByName.toLowerCase().includes(closedBatchItemSearch.toLowerCase()))
        );
        const client = clients.find(c => c.id === selectedClosedBatch.clientId);
        const courier = couriers.find(cr => cr.id === selectedClosedBatch.courierId);

        // Remark breakdown counts
        const breakdownCounts: Record<string, number> = {};
        batchItems.forEach(i => {
          breakdownCounts[i.remark] = (breakdownCounts[i.remark] || 0) + 1;
        });

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
              {/* MODAL HEADER */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <Lock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold font-mono text-white">
                        {selectedClosedBatch.batchNumber}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Closed
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="text-white font-medium">{client?.name}</span>
                      <span>•</span>
                      <span className="text-indigo-300 font-mono">{courier?.name}</span>
                      <span>•</span>
                      <span className="text-slate-400">{activeWarehouse.name} ({activeWarehouse.code})</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedClosedBatch(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* METRICS & HANDOVER SUMMARY */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Scanned</div>
                    <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                      {selectedClosedBatch.totalScanned} <span className="text-xs font-normal text-slate-400">Items</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Closed Timestamp</div>
                    <div className="text-xs font-medium text-white mt-1">
                      {selectedClosedBatch.closedAt ? new Date(selectedClosedBatch.closedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Driver / Rep</div>
                    <div className="text-xs font-medium text-white mt-1 truncate">
                      {selectedClosedBatch.driverName || 'Supervisor Verified'}
                    </div>
                    {selectedClosedBatch.driverMobile && (
                      <div className="text-[10px] text-slate-400 font-mono">{selectedClosedBatch.driverMobile}</div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Supervisor Signoff</div>
                    <div className="text-xs font-medium text-white mt-1 truncate">
                      {selectedClosedBatch.supervisorSigner || 'Verified'}
                    </div>
                  </div>
                </div>

                {/* REMARKS BREAKDOWN */}
                {Object.keys(breakdownCounts).length > 0 && (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      QC Conditions Breakdown:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(breakdownCounts).map(([remark, count]) => (
                        <span
                          key={remark}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                            remark === 'Good'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : remark === 'Damage' || remark === 'Missing Product'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {remark}: <strong className="font-mono text-white ml-1">{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* SCANNED AWBs LIST TABLE */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <List className="w-3.5 h-3.5 text-indigo-400" />
                      Scanned Parcels in Batch ({batchItems.length})
                    </h4>

                    <div className="w-full sm:w-60">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search AWB or condition..."
                          value={closedBatchItemSearch}
                          onChange={e => setClosedBatchItemSearch(e.target.value)}
                          className="w-full bg-slate-800 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-slate-400 uppercase font-semibold text-[10px] sticky top-0">
                        <tr>
                          <th className="px-3 py-2 w-12 text-center">#</th>
                          <th className="px-3 py-2">AWB / Tracking Number</th>
                          <th className="px-3 py-2">Condition (QC)</th>
                          <th className="px-3 py-2">Scanned At</th>
                          <th className="px-3 py-2">Operator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                              {batchItems.length === 0 ? 'No items in this batch.' : 'No items match your search.'}
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-800/40">
                              <td className="px-3 py-2 text-center text-slate-500 font-mono text-[10px]">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-white text-xs">
                                {item.trackingNumber}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.remark === 'Good'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : item.remark === 'Damage' || item.remark === 'Missing Product'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {item.remark}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">
                                {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                              <td className="px-3 py-2 text-slate-400 text-[11px]">
                                {item.scannedByName || 'Staff'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateBatchPDF(selectedClosedBatch, batchItems, activeWarehouse, client, courier)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Download PDF Manifest</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClosedBatch(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
