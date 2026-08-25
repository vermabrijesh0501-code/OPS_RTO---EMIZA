import React, { useState } from 'react';
import { Search, X, Truck, RotateCcw, Package, Building2, ChevronRight } from 'lucide-react';
import { InwardGateEntry, ReturnBatch, ScannedReturnItem, Client, Courier } from '../types';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateEntries: InwardGateEntry[];
  batches: ReturnBatch[];
  scannedItems: ScannedReturnItem[];
  clients: Client[];
  couriers: Courier[];
  onSelectResult: (type: 'inward' | 'rto', id: string) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  gateEntries,
  batches,
  scannedItems,
  clients,
  couriers,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedGate = q
    ? gateEntries.filter(
        g =>
          g.gatePassNumber.toLowerCase().includes(q) ||
          g.vehicleNumber.toLowerCase().includes(q) ||
          g.driverName.toLowerCase().includes(q) ||
          g.invoiceChallanNumber.toLowerCase().includes(q)
      )
    : [];

  const matchedBatches = q
    ? batches.filter(
        b =>
          b.batchNumber.toLowerCase().includes(q) ||
          b.batchType.toLowerCase().includes(q) ||
          (b.notes && b.notes.toLowerCase().includes(q))
      )
    : [];

  const matchedItems = q
    ? scannedItems.filter(
        i =>
          i.trackingNumber.toLowerCase().includes(q) ||
          (i.orderNumber && i.orderNumber.toLowerCase().includes(q)) ||
          (i.skuCode && i.skuCode.toLowerCase().includes(q))
      )
    : [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4 z-50">
      <div className="bg-[#121E2B] border border-[#1E2C3D] rounded-[12px] w-full max-w-2xl overflow-hidden shadow-2xl space-y-3">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 p-4 border-b border-[#1E2C3D] bg-[#0B141E]">
          <Search className="w-5 h-5 text-[#635BFF] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Universal Search across AWB #, Vehicle #, Gate Pass, Batch #, Order #..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-[#FFFFFF] font-semibold text-sm focus:outline-none placeholder-[#6C7D93]"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-[8px] text-[#8FA0B5] hover:text-[#FFFFFF] hover:bg-[#182738] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {!query ? (
            <div className="text-center py-8 text-[#8FA0B5]">
              Type any tracking number, vehicle plate, gate pass, or client name to search instantly.
            </div>
          ) : matchedGate.length === 0 && matchedBatches.length === 0 && matchedItems.length === 0 ? (
            <div className="text-center py-8 text-[#8FA0B5]">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Gate Passes */}
              {matchedGate.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-[#8FA0B5] uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#00BDD6]" /> Inward Gate Passes ({matchedGate.length})
                  </div>
                  {matchedGate.map(g => (
                    <div
                      key={g.id}
                      onClick={() => {
                        onSelectResult('inward', g.id);
                        onClose();
                      }}
                      className="p-3 rounded-[10px] bg-[#182738] border border-[#1E2C3D] hover:border-[#635BFF]/60 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-extrabold text-[#FFFFFF]">{g.gatePassNumber} • {g.vehicleNumber}</div>
                        <div className="text-[10px] text-[#8FA0B5]">Driver: {g.driverName} • {g.expectedBoxCount} Cartons</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#00BDD6]/15 text-[#00BDD6] border border-[#00BDD6]/30">
                        {g.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Batches */}
              {matchedBatches.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-[#8FA0B5] uppercase tracking-wider flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-[#635BFF]" /> Return Batches ({matchedBatches.length})
                  </div>
                  {matchedBatches.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        onSelectResult('rto', b.id);
                        onClose();
                      }}
                      className="p-3 rounded-[10px] bg-[#182738] border border-[#1E2C3D] hover:border-[#635BFF]/60 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-extrabold text-[#FFFFFF]">{b.batchNumber}</div>
                        <div className="text-[10px] text-[#8FA0B5]">{b.batchType} • {b.totalScanned} Items Scanned</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#635BFF]/20 text-[#635BFF] border border-[#635BFF]/40">
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Scanned Tracking Barcodes */}
              {matchedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-[#8FA0B5] uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#00BDD6]" /> Scanned Tracking Numbers ({matchedItems.length})
                  </div>
                  {matchedItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectResult('rto', item.batchId);
                        onClose();
                      }}
                      className="p-3 rounded-[10px] bg-[#182738] border border-[#1E2C3D] hover:border-[#00BDD6]/60 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-mono font-bold text-[#00BDD6] text-sm">{item.trackingNumber}</div>
                        <div className="text-[10px] text-[#8FA0B5]">Order: {item.orderNumber || 'N/A'} • Scanned By: {item.scannedByName}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#FFC107]/15 text-[#FFC107] border border-[#FFC107]/30">
                        {item.remark}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
