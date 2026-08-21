import ExcelJS from 'exceljs';
import { DayRecord, DayType, Settings, Holiday } from '../models/types';
import {
  getMonthName,
  getMonthShortName,
  getDaysInMonth,
  formatDateIso,
  parseDateIso,
  createDateForExcel,
} from '../utils/dates';
import { formatMinutesToDecimalHours } from '../utils/formatting';

export interface ExcelExportOptions {
  year: number;
  month: number; // 0-indexed
  settings: Settings;
  dayRecordsMap: Map<string, DayRecord>;
  holidaysMap: Map<string, Holiday>;
}

export async function generateTimesheetWorkbook(options: ExcelExportOptions): Promise<ExcelJS.Workbook> {
  const { year, month, settings, dayRecordsMap, holidaysMap } = options;

  const monthName = getMonthName(month); // e.g. "August"
  const monthShort = getMonthShortName(month); // e.g. "Aug"
  const yearShort = year.toString().slice(-2); // e.g. "26"

  const workbook = new ExcelJS.Workbook();
  workbook.creator = settings.userName || 'WorkLog Assistant';
  workbook.created = new Date();

  // Create single worksheet named after the selected month
  const worksheet = workbook.addWorksheet(monthName, {
    views: [{ showGridLines: true }],
  });

  // 1. Column Definitions & Widths according to specification
  worksheet.columns = [
    { key: 'date', width: 17.7 },
    { key: 'client', width: 16.5 },
    { key: 'project', width: 12.2 },
    { key: 'job', width: 12.0 },
    { key: 'workItem', width: 29.8 },
    { key: 'hours', width: 7.2 },
    { key: 'hoursHhMm', width: 13.7 },
    { key: 'description', width: 79.2 },
  ];

  // Thin border style definition
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  // 2. Header Row (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.values = [
    'Date',
    'Client Name',
    'Project Name',
    'Job Name',
    'Work Item',
    'Hour(s)',
    'Hours(HH:MM)',
    'Description',
  ];
  headerRow.height = 26;

  // Header styling: Calibri 11pt bold, pale golden/yellow fill (#FFF2CC)
  headerRow.eachCell((cell, colNumber) => {
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FF000000' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' }, // Pale golden/yellow Excel Accent 4 60% tint
    };
    cell.border = thinBorder;
    cell.alignment = {
      vertical: 'middle',
      horizontal: colNumber === 1 || colNumber === 5 || colNumber === 6 || colNumber === 7 ? 'center' : 'left',
      wrapText: true,
    };
  });

  // 3. Body Rows (Row 2 to N+1)
  const daysInMonth = getDaysInMonth(year, month);
  let totalCalculatedHours = 0;

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const rowNumber = dayNum + 1; // Row 2 is day 1
    const dateIso = formatDateIso(year, month, dayNum);
    const dayRecord = dayRecordsMap.get(dateIso);
    const holiday = holidaysMap.get(dateIso);
    const excelDate = createDateForExcel(dateIso);

    const row = worksheet.getRow(rowNumber);

    if (dayRecord && dayRecord.type === DayType.WORKING) {
      // Normal Working Day Row
      const client = dayRecord.entries[0]?.client || settings.defaultClient || 'Evolver';
      const project = dayRecord.entries[0]?.project || settings.defaultProject || 'ARIA';
      const job = dayRecord.entries[0]?.job || settings.defaultJob || 'Development';

      // Tickets collection
      const ticketsSet = new Set<string>();
      for (const entry of dayRecord.entries) {
        if (entry.tickets) {
          for (const t of entry.tickets) ticketsSet.add(t);
        }
      }
      const workItem = Array.from(ticketsSet).join(', ');

      // Decimal hours
      const hoursDecimal = formatMinutesToDecimalHours(dayRecord.hoursMinutes);
      totalCalculatedHours += hoursDecimal;

      // Description
      let descriptionText = '';
      if (dayRecord.entries.length > 0) {
        descriptionText = dayRecord.entries
          .map((e) => e.description)
          .filter(Boolean)
          .join('\n');
      } else if (dayRecord.notes) {
        descriptionText = dayRecord.notes;
      }

      row.values = [
        excelDate,
        client,
        project,
        job,
        workItem,
        hoursDecimal > 0 ? hoursDecimal : 0,
        '', // Hours(HH:MM) normally blank
        descriptionText,
      ];

      // Format Date cell in column A
      const cellA = row.getCell(1);
      cellA.numFmt = 'dd/mmm/yyyy';
      cellA.alignment = { vertical: 'middle', horizontal: 'center' };

      // Styling for all cells in working row
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF000000' } };
        cell.border = thinBorder;

        if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else if (colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0.##';
        } else if (colNumber === 8) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });

      // Dynamic row height calculation based on description lines and length
      const descLines = descriptionText.split('\n').length;
      const descLength = descriptionText.length;
      if (descLines > 3 || descLength > 200) {
        row.height = Math.min(100, Math.max(45, descLines * 18));
      } else if (descLines > 1 || descLength > 80) {
        row.height = 36;
      } else {
        row.height = 22;
      }
    } else {
      // Non-Working Row: Weekend, Personal Leave, Sick Leave, Company Holiday, Other
      let specialText = 'Weekend';
      const dayType = dayRecord ? dayRecord.type : DayType.WEEKEND;

      if (dayType === DayType.PERSONAL_LEAVE) {
        specialText = 'Personal Leave';
      } else if (dayType === DayType.SICK_LEAVE) {
        specialText = 'Sick Leave';
      } else if (dayType === DayType.COMPANY_HOLIDAY) {
        specialText = holiday ? `Company Holiday - ${holiday.name}` : 'Company Holiday';
      } else if (dayType === DayType.OTHER) {
        specialText = dayRecord?.notes || 'Other Leave';
      } else {
        specialText = 'Weekend';
      }

      row.values = [excelDate, specialText];

      // Format Date in A
      const cellA = row.getCell(1);
      cellA.numFmt = 'dd/mmm/yyyy';
      cellA.font = { name: 'Calibri', size: 11, color: { argb: 'FF000000' } };
      cellA.alignment = { vertical: 'middle', horizontal: 'center' };
      cellA.border = thinBorder;

      // Merge B:H
      worksheet.mergeCells(`B${rowNumber}:H${rowNumber}`);

      // Style merged B:H
      for (let col = 2; col <= 8; col++) {
        const cell = row.getCell(col);
        cell.border = thinBorder;
        cell.font = {
          name: 'Calibri',
          size: 11,
          color: { argb: 'FFFF0000' }, // RED text for non-working special days
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };
      }

      row.height = 20; // Compact height
    }
  }

  // 4. Total Row (Row N+2)
  const totalRowNumber = daysInMonth + 2;
  const lastDataRowNumber = daysInMonth + 1;
  const totalRow = worksheet.getRow(totalRowNumber);

  // Set total label & formula
  const totalLabel = `Total Hours Worked in ${monthShort}${yearShort}`;
  totalRow.getCell(1).value = totalLabel;
  totalRow.getCell(6).value = {
    formula: `SUM(F2:F${lastDataRowNumber})`,
    result: totalCalculatedHours,
  };

  // Merge A:E for the total row
  worksheet.mergeCells(`A${totalRowNumber}:E${totalRowNumber}`);

  // Total row styling: Light blue fill #BDD7EE, bold font
  for (let col = 1; col <= 8; col++) {
    const cell = totalRow.getCell(col);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFBDD7EE' }, // Light blue fill #BDD7EE
    };
    cell.border = thinBorder;
    cell.font = {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FF000000' },
    };

    if (col >= 1 && col <= 5) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (col === 6) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.numFmt = '#,##0.##';
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }
  totalRow.height = 24;

  return workbook;
}

/**
 * Generates and triggers browser download of the Excel file
 */
export async function downloadTimesheetExcel(options: ExcelExportOptions): Promise<void> {
  const workbook = await generateTimesheetWorkbook(options);
  const buffer = await workbook.xlsx.writeBuffer();

  const monthName = getMonthName(options.month);
  const userName = options.settings.userName || 'Yoosuf';
  const filename = `Timesheet-${userName}-${monthName}-${options.year}.xlsx`;

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  triggerFileDownload(blob, filename);
}

function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
