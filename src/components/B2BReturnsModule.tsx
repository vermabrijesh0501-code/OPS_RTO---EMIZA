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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-purple-400" /> B2B Store & Distributor Returns
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Commercial bulk returns, pallet verification, debit note reconciliation, and store dispatch returns.
          </p>
        </div>

        <button
          onClick={onOpenNewBatchModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Create B2B Return Batch
        </button>
      </div>

      {/* Filter */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search B2B Batch Number, Debit Note, Store Code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
        />
      </div>

      {/* B2B Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
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
                className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl shadow-lg transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm">{batch.batchNumber}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      batch.status === 'Open'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client Store:</span>
                    <strong className="text-white">{client ? client.name : 'BoAt Audio'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Carrier / Courier:</span>
                    <strong className="text-slate-200">{courier ? courier.name : 'BlueDart'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pallets / Cartons:</span>
                    <strong className="text-purple-400">{batch.totalScanned} / {batch.expectedCount || 30} Verified</strong>
                  </div>
                </div>

                {batch.notes && (
                  <div className="p-2.5 bg-slate-800/80 rounded-xl text-[11px] text-slate-400 italic">
                    "{batch.notes}"
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Created: {new Date(batch.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportCSV(batch)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title="Export CSV Manifest"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => generateBatchPDF(batch, items, activeWarehouse, client, courier)}
                      className="p-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all"
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
