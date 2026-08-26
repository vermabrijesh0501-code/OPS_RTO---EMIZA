import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  FileSpreadsheet,
  Download,
  Building2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { ReturnBatch, ScannedReturnItem, Warehouse, Client, Courier, User } from '../types';
import { downloadCSV } from '../utils/csvExporter';
import { generateBatchPDF } from '../utils/pdfGenerator';

interface B2BReturnsModuleProps {
  currentUser: User;
  activeWarehouse: Warehouse;
  batches: ReturnBatch[];
  scannedItems: ScannedReturnItem[];
  clients: Client[];
  couriers: Courier[];
  onOpenNewBatchModal: () => void;
}

export const B2BReturnsModule: React.FC<B2BReturnsModuleProps> = ({
  currentUser,
  activeWarehouse,
  batches,
  scannedItems,
  clients,
  couriers,
  onOpenNewBatchModal,
}) => {
  const b2bBatches = batches.filter(
    b => b.warehouseId === activeWarehouse.id && b.batchType === 'B2B Return'
  );

  const [searchQuery, setSearchQuery] = useState('');

  const filtered = b2bBatches.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.batchNumber.toLowerCase().includes(q) || (b.notes && b.notes.toLowerCase().includes(q));
  });

  const handleExportCSV = (batch: ReturnBatch) => {
    const items = scannedItems.filter(i => i.batchId === batch.id);
    const headers = ['#', 'B2B Batch #', 'Pallet / Carton AWB', 'Remark', 'Scanned At', 'Verified By'];
    const rows = items.map((i, idx) => [
      idx + 1,
      batch.batchNumber,
      i.trackingNumber,
      i.remark,
      new Date(i.scannedAt).toLocaleString(),
      i.scannedByName,
    ]);

    downloadCSV(`${batch.batchNumber}_B2B_Manifest.csv`, headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-purple-600 dark:text-purple-400" /> B2B Store & Distributor Returns
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Commercial bulk returns, pallet verification, debit note reconciliation, and store dispatch returns.
          </p>
        </div>

        <button
          onClick={onOpenNewBatchModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create B2B Return Batch
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-[#111D2C] p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 shadow-sm transition-colors">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search B2B Batch Number, Debit Note, Store Code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* B2B Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400 dark:text-slate-500 text-xs shadow-sm">
            No B2B return batches created for {activeWarehouse.code}. Click "Create B2B Return Batch" to initialize pallet batching.
          </div>
        ) : (
          filtered.map(batch => {
            const client = clients.find(c => c.id === batch.clientId);
            const courier = couriers.find(cr => cr.id === batch.courierId);
            const items = scannedItems.filter(i => i.batchId === batch.id);

            return (
              <div
                key={batch.id}
                className="bg-white dark:bg-[#111D2C] border border-slate-200/90 dark:border-slate-800 hover:border-purple-500/50 p-5 rounded-xl shadow-sm transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm font-mono">{batch.batchNumber}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      batch.status === 'Open'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50'
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Client Store:</span>
                    <strong className="text-slate-800 dark:text-white">{client ? client.name : 'BoAt Audio'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Carrier / Courier:</span>
                    <strong className="text-slate-700 dark:text-slate-200">{courier ? courier.name : 'BlueDart'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Pallets / Cartons:</span>
                    <strong className="text-purple-600 dark:text-purple-400">{batch.totalScanned} / {batch.expectedCount || 30} Verified</strong>
                  </div>
                </div>

                {batch.notes && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 italic border border-slate-100 dark:border-slate-700/50">
                    "{batch.notes}"
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Created: {new Date(batch.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportCSV(batch)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      title="Export CSV Manifest"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => generateBatchPDF(batch, items, activeWarehouse, client, courier)}
                      className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all cursor-pointer"
                      title="PDF Handover Sheet"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
