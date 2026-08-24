import { jsPDF } from 'jspdf';
import { ReturnBatch, ScannedReturnItem, InwardGateEntry, Warehouse, Client, Courier } from '../types';

export function generateBatchPDF(
  batch: ReturnBatch,
  items: ScannedReturnItem[],
  warehouse?: Warehouse,
  client?: Client,
  courier?: Courier
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background banner
  doc.setFillColor(15, 23, 42); // Dark Slate #0f172a
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EMIZA WAREHOUSE OPERATIONS', 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RETURN BATCH MANIFEST & HANDOVER SHEET', 14, 22);

  // Status badge on top right
  doc.setFillColor(batch.status === 'Closed' ? 34 : 234, batch.status === 'Closed' ? 197 : 179, batch.status === 'Closed' ? 94 : 8);
  doc.roundedRect(pageWidth - 45, 10, 32, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(batch.status.toUpperCase(), pageWidth - 38, 16);

  let y = 40;

  // Metadata Grid Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Batch Number:', 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.batchNumber, 50, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Batch Type:', 18, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.batchType, 50, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Created At:', 18, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(batch.createdAt).toLocaleString(), 50, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('Created By:', 18, y + 32);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.createdByName || 'Warehouse Staff', 50, y + 32);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text('Warehouse:', 110, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(warehouse ? `${warehouse.name} (${warehouse.code})` : batch.warehouseId, 138, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Client:', 110, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(client ? client.name : batch.clientId, 138, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Courier Partner:', 110, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(courier ? courier.name : batch.courierId, 138, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Scanned:', 110, y + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(`${batch.totalScanned} Items`, 138, y + 32);

  y += 46;

  // Remarks Breakdown Box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('REMARKS BREAKDOWN SUMMARY', 14, y);

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 14, 'FD');

  const remarksList = Object.entries(batch.remarksBreakdown || {});
  let rx = 18;
  doc.setFontSize(8);
  remarksList.forEach(([remark, count]) => {
    if (rx + 25 < pageWidth - 14) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`${remark}:`, rx, y + 9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`${count}`, rx + doc.getTextWidth(`${remark}: `) + 1, y + 9);
      rx += 32;
    }
  });

  y += 22;

  // Item Table Header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`SCANNED TRACKING LIST (${items.length} ITEMS)`, 14, y);

  y += 4;
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 17, y + 5.5);
  doc.text('Tracking / AWB #', 28, y + 5.5);
  doc.text('Order #', 80, y + 5.5);
  doc.text('Remark / Condition', 125, y + 5.5);
  doc.text('Scanned Time', 165, y + 5.5);

  y += 8;

  // Table rows
  items.forEach((item, index) => {
    if (y > 240) {
      doc.addPage();
      y = 20;

      // Repeat Table Header on new page
      doc.setFillColor(30, 41, 59);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('#', 17, y + 5.5);
      doc.text('Tracking / AWB #', 28, y + 5.5);
      doc.text('Order #', 80, y + 5.5);
      doc.text('Remark / Condition', 125, y + 5.5);
      doc.text('Scanned Time', 165, y + 5.5);
      y += 8;
    }

    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 7, pageWidth - 14, y + 7);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    doc.text(`${index + 1}`, 17, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(item.trackingNumber, 28, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(item.orderNumber || '-', 80, y + 4.5);

    // Color code remark
    if (item.remark === 'Good') {
      doc.setTextColor(22, 101, 52);
    } else if (item.remark === 'Damage' || item.remark === 'Missing Product') {
      doc.setTextColor(153, 27, 27);
    } else {
      doc.setTextColor(146, 64, 14);
    }
    doc.text(item.remark, 125, y + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.text(new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 165, y + 4.5);

    y += 7;
  });

  // Courier Handover Signature Block at bottom
  if (y > 220) {
    doc.addPage();
    y = 30;
  } else {
    y += 12;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('COURIER HANDOVER & ACKNOWLEDGEMENT SIGN-OFF', 18, y + 8);

  // Signature line 1
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Driver Name:', 18, y + 16);
  doc.text(batch.driverName || '__________________________', 42, y + 16);

  doc.text('Driver Mobile:', 18, y + 23);
  doc.text(batch.driverMobile || '__________________________', 42, y + 23);

  doc.line(18, y + 32, 85, y + 32);
  doc.text('Driver Signature & Date', 18, y + 35);

  // Signature line 2
  doc.text('Warehouse Supervisor:', 115, y + 16);
  doc.text(batch.supervisorSigner || batch.createdByName || '__________________________', 152, y + 16);

  doc.text('Handover Time:', 115, y + 23);
  doc.text(batch.closedAt ? new Date(batch.closedAt).toLocaleString() : new Date().toLocaleString(), 152, y + 23);

  doc.line(115, y + 32, 182, y + 32);
  doc.text('Warehouse Stamp & Signature', 115, y + 35);

  // Save PDF
  doc.save(`${batch.batchNumber}_Manifest.pdf`);
}

export function generateGatePassPDF(entry: InwardGateEntry, warehouse?: Warehouse, client?: Client, courier?: Courier) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EMIZA INWARD GATE ENTRY PASS', 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('VEHICLE UNLOADING & DOCK ALLOCATION PERMIT', 14, 22);

  let y = 40;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 55, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold'); doc.text('Gate Pass #:', 18, y + 10);
  doc.setFont('helvetica', 'normal'); doc.text(entry.gatePassNumber, 55, y + 10);

  doc.setFont('helvetica', 'bold'); doc.text('Vehicle Number:', 18, y + 18);
  doc.setFont('helvetica', 'normal'); doc.text(entry.vehicleNumber, 55, y + 18);

  doc.setFont('helvetica', 'bold'); doc.text('Driver Name:', 18, y + 26);
  doc.setFont('helvetica', 'normal'); doc.text(entry.driverName, 55, y + 26);

  doc.setFont('helvetica', 'bold'); doc.text('Driver Mobile:', 18, y + 34);
  doc.setFont('helvetica', 'normal'); doc.text(entry.driverMobile, 55, y + 34);

  doc.setFont('helvetica', 'bold'); doc.text('Driver License:', 18, y + 42);
  doc.setFont('helvetica', 'normal'); doc.text(entry.driverLicense || 'N/A', 55, y + 42);

  // Column 2
  doc.setFont('helvetica', 'bold'); doc.text('Warehouse:', 110, y + 10);
  doc.setFont('helvetica', 'normal'); doc.text(warehouse ? warehouse.name : entry.warehouseId, 140, y + 10);

  doc.setFont('helvetica', 'bold'); doc.text('Client:', 110, y + 18);
  doc.setFont('helvetica', 'normal'); doc.text(client ? client.name : entry.clientId, 140, y + 18);

  doc.setFont('helvetica', 'bold'); doc.text('Courier:', 110, y + 26);
  doc.setFont('helvetica', 'normal'); doc.text(courier ? courier.name : entry.courierId, 140, y + 26);

  doc.setFont('helvetica', 'bold'); doc.text('Dock Number:', 110, y + 34);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 99, 235);
  doc.text(entry.dockNumber || 'Unassigned', 140, y + 34);

  doc.setFont('helvetica', 'bold'); doc.setTextColor(51, 65, 85); doc.text('Invoice / Challan #:', 110, y + 42);
  doc.setFont('helvetica', 'normal'); doc.text(entry.invoiceChallanNumber || 'N/A', 140, y + 42);

  y += 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CARGO & VERIFICATION SUMMARY', 14, y);

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold'); doc.text('Expected Cartons:', 18, y + 8);
  doc.setFont('helvetica', 'normal'); doc.text(`${entry.expectedBoxCount} Cartons`, 55, y + 8);

  doc.setFont('helvetica', 'bold'); doc.text('Received Cartons:', 110, y + 8);
  doc.setFont('helvetica', 'normal'); doc.text(`${entry.receivedBoxCount} Cartons`, 145, y + 8);

  doc.setFont('helvetica', 'bold'); doc.text('Invoice Value (INR):', 18, y + 17);
  doc.setFont('helvetica', 'normal'); doc.text(`Rs. ${entry.invoiceValue.toLocaleString()}`, 55, y + 17);

  doc.setFont('helvetica', 'bold'); doc.text('Entry Timestamp:', 110, y + 17);
  doc.setFont('helvetica', 'normal'); doc.text(new Date(entry.entryTime).toLocaleString(), 145, y + 17);

  y += 35;

  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'S');

  doc.setFontSize(8);
  doc.text('Gate Security Sign: _______________________', 18, y + 12);
  doc.text('Driver Signature: _______________________', 115, y + 12);
  doc.text('Unloading Dock Supervisor: _______________________', 18, y + 22);
  doc.text('Date & Time: _______________________', 115, y + 22);

  doc.save(`${entry.gatePassNumber}_GatePass.pdf`);
}
