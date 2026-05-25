/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ExcelJS from 'exceljs';
import { Schedule, ScheduleItem } from './types';
import { getEmployees, getShifts } from './db';

// Custom interface for user selected configurations
export interface ExportOptions {
  orientation: 'portrait' | 'landscape';
  includeShiftCode: boolean;
  includeShiftType: boolean;
  includeDayOff: boolean;
}

// Beautiful and compliant soft color palettes for departments
const DEPT_COLORS: { [key: string]: { headerBg: string; rowBg: string; text: string } } = {
  'im': { headerBg: 'CDE0F7', rowBg: 'F0F5FD', text: '1E3A8A' },
  'physical therapy': { headerBg: 'CCECE8', rowBg: 'EFF9F8', text: '0D9488' },
  'lab': { headerBg: 'FDE3A7', rowBg: 'FFF8E7', text: 'D97706' },
  'ent': { headerBg: 'BAE6FD', rowBg: 'F0F9FF', text: '0369A1' },
  'cardia': { headerBg: 'FECDD3', rowBg: 'FFF1F2', text: 'E11D48' },
  'obs/dyne': { headerBg: 'F5D0FE', rowBg: 'FDF4FF', text: 'C084FC' },
  'radiology': { headerBg: 'FED7AA', rowBg: 'FFF7ED', text: 'EA580C' },
  't2': { headerBg: 'E9D5FF', rowBg: 'FAF5FF', text: '7E22CE' },
  'dental': { headerBg: 'A7F3D0', rowBg: 'F0FDF4', text: '059669' },
  'urology/diabetic': { headerBg: 'A2EDDE', rowBg: 'EDFAF6', text: '047857' }
};

const DEFAULT_PALETTES = [
  { headerBg: 'E9D5FF', rowBg: 'FAF5FF', text: '7E22CE' },
  { headerBg: 'FBCFE8', rowBg: 'FDF2F8', text: '9D174D' },
  { headerBg: '99F6E4', rowBg: 'F0FDFA', text: '0F766E' },
  { headerBg: 'C7D2FE', rowBg: 'EEF2FF', text: '3730A3' },
  { headerBg: 'FED7AA', rowBg: 'FFF7ED', text: 'C2410C' },
  { headerBg: 'CBD5E1', rowBg: 'F8FAFC', text: '334155' }
];

export async function exportScheduleToExcel(
  schedule: Schedule,
  items: ScheduleItem[],
  options: ExportOptions
) {
  // 1. Validation before export
  const employees = getEmployees();
  const availableEmployees = employees.filter(e => e.isAvailable);
  const scheduledEmployeeIds = new Set(items.map(item => item.employeeId));
  
  const missingEmployees = availableEmployees.filter(emp => !scheduledEmployeeIds.has(emp.id));
  
  if (missingEmployees.length > 0) {
    alert("Cannot export. Some available employees are missing from the schedule.");
    return;
  }

  // 2. Load active shift reference maps
  const shifts = getShifts();

  // 3. Initialize ExcelJS Workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Week ${schedule.weekNumber}`);

  // Set default grid lines visibility
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 3, topLeftCell: 'A4', activeCell: 'A4', showGridLines: true }
  ];

  // Set page setup for perfect A4 fitting with selected orientation
  worksheet.pageSetup = {
    paperSize: 9, // A4 paper size
    orientation: options.orientation, // 'portrait' or 'landscape'
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0
  };

  // 4. Determine Dynamic Columns Configuration with proportional stretch to fit full A4 page width
  const rawColMappings = [
    { key: 'employeeName', header: 'Employee Name', alignment: 'left' as const, defaultWidth: options.orientation === 'portrait' ? 22 : 26 },
    { key: 'department', header: 'Department', alignment: 'left' as const, defaultWidth: options.orientation === 'portrait' ? 14 : 18 },
    ...(options.includeShiftCode ? [{ key: 'shiftCode', header: 'Shift Code', alignment: 'center' as const, defaultWidth: 11 }] : []),
    { key: 'startTime1', header: 'Start Time 1', alignment: 'center' as const, defaultWidth: options.orientation === 'portrait' ? 12 : 14 },
    { key: 'endTime1', header: 'End Time 1', alignment: 'center' as const, defaultWidth: options.orientation === 'portrait' ? 12 : 14 },
    { key: 'startTime2', header: 'Start Time 2', alignment: 'center' as const, defaultWidth: options.orientation === 'portrait' ? 12 : 14 },
    { key: 'endTime2', header: 'End Time 2', alignment: 'center' as const, defaultWidth: options.orientation === 'portrait' ? 12 : 14 },
    ...(options.includeShiftType ? [{ key: 'shiftType', header: 'Shift Type', alignment: 'center' as const, defaultWidth: 13 }] : []),
    ...(options.includeDayOff ? [{ key: 'dayOff', header: 'Weekly Day Off', alignment: 'center' as const, defaultWidth: 15 }] : [])
  ];

  // Target total column width to cover a full A4 page nicely without leaving empty space
  // A4 portrait covers ~78 units. A4 landscape covers ~110 units of column widths.
  const targetTotalWidth = options.orientation === 'portrait' ? 78 : 110;
  const currentTotal = rawColMappings.reduce((sum, col) => sum + col.defaultWidth, 0);

  const colMappings = rawColMappings.map(col => {
    // If the combined width of selected columns is less than the target A4 width,
    // we proportionally stretch them to fill the landscape/portrait layout perfectly!
    const widthFactor = currentTotal < targetTotalWidth ? (targetTotalWidth / currentTotal) : 1;
    return {
      ...col,
      width: Math.round(col.defaultWidth * widthFactor)
    };
  });

  const totalCols = colMappings.length;
  const endColLetter = String.fromCharCode(65 + totalCols - 1); // 'A' based plus offsets

  // 5. Create standard header title row
  const titleText = `WEEK ${schedule.weekNumber} | ${schedule.month.toUpperCase()} ${schedule.year} | START: ${schedule.startDate} TO END: ${schedule.endDate}`;
  worksheet.mergeCells(`A1:${endColLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = titleText;
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' } // Deep Royal Blue
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 42;

  // Spacer Row 2
  worksheet.getRow(2).height = 10;

  // 6. Styled Table Headers Row 3
  const headerRow = worksheet.getRow(3);
  headerRow.height = 32; // taller to guarantee clarity
  
  colMappings.forEach((mapping, i) => {
    const cellAddress = `${String.fromCharCode(65 + i)}3`;
    const cell = worksheet.getCell(cellAddress);
    cell.value = mapping.header;
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } }; // slightly larger font for extreme clarity
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' } // High-contrast Slate Dark Background
    };
    cell.alignment = { 
      vertical: 'middle', 
      horizontal: mapping.alignment,
      wrapText: true 
    };
    cell.border = {
      top: { style: 'medium', color: { argb: '1E293B' } },
      left: { style: 'thin', color: { argb: '334155' } },
      bottom: { style: 'medium', color: { argb: '1E293B' } },
      right: { style: 'thin', color: { argb: '334155' } }
    };
  });

  // 7. Group items by Department
  const groups: { [dept: string]: ScheduleItem[] } = {};
  for (const item of items) {
    if (!groups[item.department]) {
      groups[item.department] = [];
    }
    groups[item.department].push(item);
  }

  let currentRowNumber = 4;

  const defaultBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'CBD5E1' } },
    left: { style: 'thin', color: { argb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
    right: { style: 'thin', color: { argb: 'CBD5E1' } }
  };

  // Populate Groups with headers and styled listings
  for (const [deptName, deptItems] of Object.entries(groups)) {
    // Determine custom pastel style
    const norm = deptName.toLowerCase().trim();
    let palette = DEPT_COLORS[norm];
    if (!palette) {
      let hash = 0;
      for (let i = 0; i < norm.length; i++) {
        hash = norm.charCodeAt(i) + ((hash << 5) - hash);
      }
      palette = DEFAULT_PALETTES[Math.abs(hash) % DEFAULT_PALETTES.length];
    }

    // Add Department Divider Header Row
    worksheet.mergeCells(`A${currentRowNumber}:${endColLetter}${currentRowNumber}`);
    const deptHeaderCell = worksheet.getCell(`A${currentRowNumber}`);
    deptHeaderCell.value = `${deptName.toUpperCase()} (${deptItems.length} STAFF)`;
    deptHeaderCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: palette.text } };
    deptHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: palette.headerBg }
    };
    deptHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Style the merged range cell borders
    for (let c = 1; c <= totalCols; c++) {
      worksheet.getCell(currentRowNumber, c).border = defaultBorder;
    }
    worksheet.getRow(currentRowNumber).height = 28;
    currentRowNumber++;

    // Add Employee Listing rows
    for (const item of deptItems) {
      const dataRow = worksheet.getRow(currentRowNumber);
      dataRow.height = 24; // slightly taller rows for better legibility

      // Determine shift classification for Shift Time Coloring
      const matchedShift = shifts.find(s => s.code === item.shiftCode && s.shiftType === item.shiftType);
      let category = matchedShift?.category;
      
      // Robust detection fallback based on actual hours or code content
      if (!category) {
        const code = item.shiftCode.toUpperCase();
        if (code === 'Z' || code === 'RF' || item.startTime2 || item.endTime2) {
          category = 'split';
        } else if (['A', 'B', 'C', 'RA', 'RB', 'EA', 'EB'].includes(code)) {
          category = 'morning';
        } else if (item.startTime1 && item.startTime1.includes('PM')) {
          // e.g. 3:00 PM or 4:00 PM starts -> evening
          category = 'evening';
        } else if (item.startTime1 && (item.startTime1.includes('AM') || item.startTime1.startsWith('0') || item.startTime1.startsWith('1'))) {
          // e.g. 7:00 AM or 8:00 AM starts -> morning
          category = 'morning';
        } else {
          category = 'morning';
        }
      }

      // Beautiful customized high-contrast pastel colors matching the user picture style:
      // Morning Shift -> Vivid light sky-blue background + high-contrast legible navy text
      // Evening Shift -> Vibrant light grass-green background + high-contrast forest-green text
      // Split Shift   -> Lovely warm butterscotch/yellow background + high-contrast dark gold-brown text
      let shiftBg = '';
      let shiftText = '';
      if (category === 'morning') {
        shiftBg = '9BDCFC'; // Light sky-blue (matching photo)
        shiftText = '0F4C81'; // legible high-contrast blue/navy text
      } else if (category === 'evening') {
        shiftBg = 'A9D08E'; // Vibrant soft grass-green (matching photo)
        shiftText = '2D5A27'; // legible high-contrast dark forest green text
      } else if (category === 'split') {
        shiftBg = 'FFDF85'; // Soft warm gold
        shiftText = '7A5800'; // legible high-contrast warm brown text
      }

      // Build data values matching the dynamically selected colMappings structure
      const values: string[] = [];
      colMappings.forEach(col => {
        if (col.key === 'employeeName') values.push(item.employeeName);
        else if (col.key === 'department') values.push(item.department);
        else if (col.key === 'shiftCode') values.push(item.shiftCode);
        else if (col.key === 'startTime1') values.push(item.startTime1 || '-');
        else if (col.key === 'endTime1') values.push(item.endTime1 || '-');
        else if (col.key === 'startTime2') values.push(item.startTime2 || '-');
        else if (col.key === 'endTime2') values.push(item.endTime2 || '-');
        else if (col.key === 'shiftType') values.push(item.shiftType);
        else if (col.key === 'dayOff') values.push(item.dayOff);
      });

      dataRow.values = values;

      // Apply styling cell-by-cell
      for (let colIdx = 1; colIdx <= totalCols; colIdx++) {
        const cell = worksheet.getCell(currentRowNumber, colIdx);
        cell.border = defaultBorder;

        const currentMapping = colMappings[colIdx - 1];
        
        // Coloring applies to shift code, and all timing fields
        const isTimeCol = ['shiftCode', 'startTime1', 'endTime1', 'startTime2', 'endTime2'].includes(currentMapping.key);

        if (isTimeCol && shiftBg) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: shiftBg }
          };
          cell.font = {
            name: 'Segoe UI',
            size: 10.5,
            bold: true, // bold timings and codes for maximum clarity
            color: { argb: shiftText }
          };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: palette.rowBg }
          };
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: false,
            color: { argb: '1E293B' }
          };
        }

        // Horizontal alignments
        if (currentMapping.alignment === 'left') {
          cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }

      currentRowNumber++;
    }
  }

  // Add filters to row 3 columns (A3 to EndCol3)
  worksheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: currentRowNumber - 1, column: totalCols }
  };

  // Spacer row
  worksheet.getRow(currentRowNumber).height = 12;
  currentRowNumber++;

  // 8. Arabic Warning Footer (fitted across the customized column range)
  worksheet.mergeCells(`A${currentRowNumber}:${endColLetter}${currentRowNumber}`);
  const arabicCell = worksheet.getCell(`A${currentRowNumber}`);
  arabicCell.value = 'الرجاء من الموظفات الإلتزام بمواعيد العمل';
  arabicCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'C00000' } };
  arabicCell.alignment = { vertical: 'middle', horizontal: 'center' };
  
  for (let c = 1; c <= totalCols; c++) {
    const cell = worksheet.getCell(currentRowNumber, c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FCE4D6' } // Warm soft alert warning red color
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'F2DCDB' } },
      left: { style: 'thin', color: { argb: 'F2DCDB' } },
      bottom: { style: 'thin', color: { argb: 'F2DCDB' } },
      right: { style: 'thin', color: { argb: 'F2DCDB' } }
    };
  }
  worksheet.getRow(currentRowNumber).height = 36;

  // 9. Set explicit dynamically styled widths configuration to fit A4 perfectly
  colMappings.forEach((mapping, index) => {
    worksheet.getColumn(index + 1).width = mapping.width;
  });

  // 10. Write Workbook Buffer and Trigger Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const downloadUrl = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  
  const formattedFilename = `Employee_Schedule_Week_${schedule.weekNumber}_${schedule.month.toLowerCase()}_${schedule.year}.xlsx`;
  link.download = formattedFilename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
