import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  AlertCircle,
  Copy,
  RefreshCw,
  FileText,
  Filter,
} from 'lucide-react';
import { Client, Company } from '../../types';
import { downloadCSV } from '../../utils/csvExporter';

interface AccountImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingClients: Client[];
  companies: Company[];
  onImportClients: (newClients: Client[], updatedClients: Client[]) => void;
}

interface ParsedAccountRow {
  rowNumber: number;
  rawName: string;
  rawCode: string;
  rawEmail: string;
  rawPhone: string;
  rawCategory: string;
  status: 'VALID' | 'DUP_IN_FILE' | 'DUP_IN_MASTER' | 'INVALID';
  validationMessage: string;
  cleanClient?: Client;
}

export const AccountImportModal: React.FC<AccountImportModalProps> = ({
  isOpen,
  onClose,
  existingClients,
  companies,
  onImportClients,
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedAccountRow[]>([]);
  const [filterView, setFilterView] = useState<'ALL' | 'VALID' | 'DUP' | 'INVALID'>('ALL');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImportComplete, setIsImportComplete] = useState(false);
  const [importSummary, setImportSummary] = useState<{ added: number; updated: number; skipped: number }>({
    added: 0,
    updated: 0,
    skipped: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const defaultCompanyId = companies[0]?.id || 'comp-1';

  // Download Sample Template CSV
  const handleDownloadSample = () => {
    const headers = ['Account Name', 'Account ID', 'Category', 'Email', 'Phone', 'Status'];
    const sampleRows = [
      ['Bella Vita Organic', 'CLI-BV', 'Personal Care', 'ops@bellavita.in', '+91 22 4000 0001', 'Active'],
      ['Nykaa E-Retail', 'CLI-NYK', 'Cosmetics', 'ops@nykaa.in', '+91 22 4000 0002', 'Active'],
      ['Imagine Marketing (boAt)', 'CLI-BOAT', 'Consumer Electronics', 'ops@boat.in', '+91 22 4000 0003', 'Active'],
      ['Sugar Cosmetics', 'CLI-SUG', 'Cosmetics', 'ops@sugarcosmetics.in', '+91 22 4000 0004', 'Active'],
      ['Honasa (Mamaearth)', 'CLI-MME', 'Personal Care', 'ops@mamaearth.in', '+91 22 4000 0005', 'Active'],
    ];
    downloadCSV('WOP-Emiza_Account_Master_Template.csv', headers, sampleRows);
  };

  // Parse raw table text (CSV, TSV, or Excel tab-separated)
  const parseRawContent = (content: string) => {
    const lines = content
      .split(/\r\n|\n|\r/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Determine delimiter (comma or tab or semicolon)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    // Extract headers
    const rawHeaders = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    let hasHeaderRow = false;

    let nameIdx = -1;
    let codeIdx = -1;
    let categoryIdx = -1;
    let emailIdx = -1;
    let phoneIdx = -1;

    // Detect header positions
    rawHeaders.forEach((h, idx) => {
      if (h.includes('accountname') || h.includes('clientname') || h.includes('brandname') || h === 'name' || h === 'account') {
        nameIdx = idx;
        hasHeaderRow = true;
      } else if (h.includes('accountid') || h.includes('clientid') || h.includes('accountcode') || h.includes('clientcode') || h === 'code' || h === 'id') {
        codeIdx = idx;
        hasHeaderRow = true;
      } else if (h.includes('cat') || h.includes('segment') || h.includes('industry')) {
        categoryIdx = idx;
        hasHeaderRow = true;
      } else if (h.includes('email') || h.includes('mail')) {
        emailIdx = idx;
        hasHeaderRow = true;
      } else if (h.includes('phone') || h.includes('contact') || h.includes('mobile')) {
        phoneIdx = idx;
        hasHeaderRow = true;
      }
    });

    // Fallback if no explicit header names found
    if (!hasHeaderRow) {
      nameIdx = 0;
      codeIdx = 1;
      categoryIdx = 2;
      emailIdx = 3;
      phoneIdx = 4;
    }

    const dataLines = hasHeaderRow ? lines.slice(1) : lines;
    const seenCodesInBatch = new Set<string>();
    const seenNamesInBatch = new Set<string>();

    const rows: ParsedAccountRow[] = [];

    dataLines.forEach((line, index) => {
      const cols = parseLine(line);
      if (cols.length === 0 || cols.every(c => !c)) return;

      const rawName = (nameIdx >= 0 && cols[nameIdx] !== undefined ? cols[nameIdx] : cols[0] || '').trim();
      const rawCode = (codeIdx >= 0 && cols[codeIdx] !== undefined ? cols[codeIdx] : cols[1] || '').trim().toUpperCase();
      const rawCategory = (categoryIdx >= 0 && cols[categoryIdx] !== undefined ? cols[categoryIdx] : cols[2] || 'General Merchandise').trim();
      const rawEmail = (emailIdx >= 0 && cols[emailIdx] !== undefined ? cols[emailIdx] : cols[3] || '').trim();
      const rawPhone = (phoneIdx >= 0 && cols[phoneIdx] !== undefined ? cols[phoneIdx] : cols[4] || '').trim();

      const normalizedCode = rawCode || (rawName ? `CLI-${rawName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')}` : '');
      const normalizedName = rawName;

      let status: ParsedAccountRow['status'] = 'VALID';
      let validationMessage = 'Ready for import';

      if (!normalizedName) {
        status = 'INVALID';
        validationMessage = 'Missing Account Name';
      } else if (!normalizedCode) {
        status = 'INVALID';
        validationMessage = 'Missing Account ID / Code';
      } else if (seenCodesInBatch.has(normalizedCode.toLowerCase())) {
        status = 'DUP_IN_FILE';
        validationMessage = `Duplicate Account ID "${normalizedCode}" in this file`;
      } else if (seenNamesInBatch.has(normalizedName.toLowerCase())) {
        status = 'DUP_IN_FILE';
        validationMessage = `Duplicate Account Name "${normalizedName}" in this file`;
      } else {
        // Check in existing Master
        const masterMatchByCode = existingClients.find(
          c => c.code.trim().toLowerCase() === normalizedCode.toLowerCase()
        );
        const masterMatchByName = existingClients.find(
          c => c.name.trim().toLowerCase() === normalizedName.toLowerCase()
        );

        if (masterMatchByCode) {
          status = 'DUP_IN_MASTER';
          validationMessage = `Account ID already exists in Master (${masterMatchByCode.name})`;
        } else if (masterMatchByName) {
          status = 'DUP_IN_MASTER';
          validationMessage = `Account Name already exists in Master (${masterMatchByName.code})`;
        }
      }

      if (status === 'VALID') {
        seenCodesInBatch.add(normalizedCode.toLowerCase());
        seenNamesInBatch.add(normalizedName.toLowerCase());
      }

      const cleanClient: Client = {
        id: `cli-${normalizedCode.toLowerCase().replace(/[^a-z0-9]/g, '') || Date.now()}`,
        companyId: defaultCompanyId,
        code: normalizedCode,
        name: normalizedName,
        email: rawEmail || `ops@${normalizedCode.toLowerCase()}.in`,
        phone: rawPhone || '+91 22 4000 0000',
        category: rawCategory || 'General Merchandise',
        status: 'Active',
      };

      rows.push({
        rowNumber: index + (hasHeaderRow ? 2 : 1),
        rawName,
        rawCode: normalizedCode,
        rawCategory,
        rawEmail,
        rawPhone,
        status,
        validationMessage,
        cleanClient,
      });
    });

    setParsedRows(rows);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      parseRawContent(text || '');
    };
    reader.readAsText(file);
  };

  // Paste Text Parse Handler
  const handlePasteParse = () => {
    if (!pasteText.trim()) return;
    setSelectedFileName('Pasted_Data_Table');
    parseRawContent(pasteText);
  };

  // Execute Import
  const handleExecuteImport = () => {
    setIsProcessing(true);
    try {
      const validRows = parsedRows.filter(r => r.status === 'VALID' && r.cleanClient);
      const dupMasterRows = parsedRows.filter(r => r.status === 'DUP_IN_MASTER' && r.cleanClient);

      const newClientsToInsert: Client[] = validRows.map(r => r.cleanClient!);
      const updatedClientsToUpsert: Client[] = [];

      let skippedCount = parsedRows.filter(r => r.status === 'INVALID' || r.status === 'DUP_IN_FILE').length;

      if (duplicateStrategy === 'update') {
        dupMasterRows.forEach(r => {
          if (!r.cleanClient) return;
          const existing = existingClients.find(
            c =>
              c.code.toLowerCase() === r.cleanClient!.code.toLowerCase() ||
              c.name.toLowerCase() === r.cleanClient!.name.toLowerCase()
          );
          if (existing) {
            updatedClientsToUpsert.push({
              ...existing,
              name: r.cleanClient.name,
              code: r.cleanClient.code,
              category: r.cleanClient.category || existing.category,
              email: r.cleanClient.email || existing.email,
              phone: r.cleanClient.phone || existing.phone,
            });
          } else {
            newClientsToInsert.push(r.cleanClient);
          }
        });
      } else {
        skippedCount += dupMasterRows.length;
      }

      onImportClients(newClientsToInsert, updatedClientsToUpsert);

      setImportSummary({
        added: newClientsToInsert.length,
        updated: updatedClientsToUpsert.length,
        skipped: skippedCount,
      });
      setIsImportComplete(true);
    } catch (err: any) {
      alert(`Import failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Modal
  const handleReset = () => {
    setParsedRows([]);
    setSelectedFileName(null);
    setPasteText('');
    setIsImportComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered rows for preview table
  const displayedRows = parsedRows.filter(r => {
    if (filterView === 'VALID') return r.status === 'VALID';
    if (filterView === 'DUP') return r.status === 'DUP_IN_FILE' || r.status === 'DUP_IN_MASTER';
    if (filterView === 'INVALID') return r.status === 'INVALID';
    return true;
  });

  const validCount = parsedRows.filter(r => r.status === 'VALID').length;
  const dupCount = parsedRows.filter(r => r.status === 'DUP_IN_FILE' || r.status === 'DUP_IN_MASTER').length;
  const invalidCount = parsedRows.filter(r => r.status === 'INVALID').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-card border border-theme rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-primary">
                Bulk Import Accounts & Brand Master
              </h2>
              <p className="text-xs text-secondary">
                Upload CSV/Excel or paste table to validate Account Name & Account ID records.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {isImportComplete ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Import Successfully Processed</h3>
                <p className="text-xs text-secondary mt-1">
                  Master accounts updated and synced across all system instances.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <div className="text-xl font-extrabold">{importSummary.added}</div>
                  <div className="text-[11px] font-semibold">New Accounts Added</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <div className="text-xl font-extrabold">{importSummary.updated}</div>
                  <div className="text-[11px] font-semibold">Accounts Updated</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-500 dark:text-slate-400">
                  <div className="text-xl font-extrabold">{importSummary.skipped}</div>
                  <div className="text-[11px] font-semibold">Duplicates/Invalid Skipped</div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-elevated hover:bg-elevated/80 border border-theme text-xs font-bold text-primary transition-colors cursor-pointer"
                >
                  Import More Files
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Done & View Accounts
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Controls: Template Download & Input Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-theme">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveInputMode('upload')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeInputMode === 'upload'
                        ? 'bg-[#8B5CF6] text-white shadow-xs'
                        : 'bg-elevated text-secondary hover:text-primary'
                    }`}
                  >
                    Upload CSV / Excel File
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInputMode('paste')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeInputMode === 'paste'
                        ? 'bg-[#8B5CF6] text-white shadow-xs'
                        : 'bg-elevated text-secondary hover:text-primary'
                    }`}
                  >
                    Paste Table / Excel Text
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template (.CSV)</span>
                </button>
              </div>

              {/* Input Area */}
              {activeInputMode === 'upload' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-theme hover:border-[#8B5CF6] bg-surface/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all hover:bg-surface flex flex-col items-center justify-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-primary">
                    {selectedFileName ? (
                      <span className="text-purple-600 dark:text-purple-400 font-mono">
                        Selected: {selectedFileName}
                      </span>
                    ) : (
                      'Click to browse or drop CSV / TSV file here'
                    )}
                  </div>
                  <p className="text-[11px] text-muted">
                    Supports columns: Account Name, Account ID / Code, Category, Email, Phone
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    placeholder={`Paste tabular data copied directly from Excel, Sheets or CSV...\nExample:\nAccount Name\tAccount ID\tCategory\nBella Vita Organic\tCLI-BV\tPersonal Care\nNykaa E-Retail\tCLI-NYK\tCosmetics`}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    className="w-full bg-elevated border border-theme rounded-xl p-3 text-xs font-mono text-primary placeholder:text-muted focus:outline-none focus:border-[#8B5CF6]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handlePasteParse}
                      disabled={!pasteText.trim()}
                      className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Parse & Validate Pasted Rows
                    </button>
                  </div>
                </div>
              )}

              {/* Validation Preview & Summary */}
              {parsedRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div
                      onClick={() => setFilterView('ALL')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        filterView === 'ALL'
                          ? 'bg-elevated border-purple-500/50 shadow-xs'
                          : 'bg-surface border-theme'
                      }`}
                    >
                      <div className="text-[10px] text-secondary font-semibold">Total Rows Parsed</div>
                      <div className="text-lg font-extrabold text-primary">{parsedRows.length}</div>
                    </div>

                    <div
                      onClick={() => setFilterView('VALID')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        filterView === 'VALID'
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs'
                          : 'bg-surface border-theme'
                      }`}
                    >
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready to Import
                      </div>
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {validCount}
                      </div>
                    </div>

                    <div
                      onClick={() => setFilterView('DUP')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        filterView === 'DUP'
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-xs'
                          : 'bg-surface border-theme'
                      }`}
                    >
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Duplicate Records
                      </div>
                      <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                        {dupCount}
                      </div>
                    </div>

                    <div
                      onClick={() => setFilterView('INVALID')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        filterView === 'INVALID'
                          ? 'bg-rose-500/10 border-rose-500/50 shadow-xs'
                          : 'bg-surface border-theme'
                      }`}
                    >
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Incomplete / Invalid
                      </div>
                      <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                        {invalidCount}
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Strategy Option */}
                  {dupCount > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Found {dupCount} duplicate accounts. Choose how to handle:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="dupStrategy"
                            checked={duplicateStrategy === 'skip'}
                            onChange={() => setDuplicateStrategy('skip')}
                          />
                          <span>Skip Duplicates</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="dupStrategy"
                            checked={duplicateStrategy === 'update'}
                            onChange={() => setDuplicateStrategy('update')}
                          />
                          <span>Update Existing</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-theme rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-elevated sticky top-0 z-10 text-[11px] text-secondary border-b border-theme">
                        <tr>
                          <th className="py-2 px-3 font-bold">#</th>
                          <th className="py-2 px-3 font-bold">Account Name</th>
                          <th className="py-2 px-3 font-bold">Account ID</th>
                          <th className="py-2 px-3 font-bold">Category</th>
                          <th className="py-2 px-3 font-bold">Validation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme">
                        {displayedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface/60 transition-colors">
                            <td className="py-2 px-3 text-muted font-mono text-[11px]">
                              {row.rowNumber}
                            </td>
                            <td className="py-2 px-3 font-semibold text-primary">
                              {row.rawName || <span className="text-rose-500 italic">Empty</span>}
                            </td>
                            <td className="py-2 px-3 font-mono text-purple-600 dark:text-purple-400 font-bold">
                              {row.rawCode || <span className="text-rose-500 italic">Empty</span>}
                            </td>
                            <td className="py-2 px-3 text-secondary">
                              {row.rawCategory || 'General'}
                            </td>
                            <td className="py-2 px-3">
                              {row.status === 'VALID' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Ready
                                </span>
                              )}
                              {row.status === 'DUP_IN_FILE' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1" title={row.validationMessage}>
                                  <AlertTriangle className="w-3 h-3" /> Duplicate in File
                                </span>
                              )}
                              {row.status === 'DUP_IN_MASTER' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-flex items-center gap-1" title={row.validationMessage}>
                                  <AlertTriangle className="w-3 h-3" /> Already in Master
                                </span>
                              )}
                              {row.status === 'INVALID' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1" title={row.validationMessage}>
                                  <AlertCircle className="w-3 h-3" /> {row.validationMessage}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isImportComplete && (
          <div className="p-4 border-t border-theme bg-surface flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={parsedRows.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-40"
            >
              Clear
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-elevated hover:bg-elevated/80 border border-theme text-xs font-bold text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing || (validCount === 0 && (duplicateStrategy === 'skip' || dupCount === 0))}
                className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Import {validCount + (duplicateStrategy === 'update' ? dupCount : 0)} Accounts
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
