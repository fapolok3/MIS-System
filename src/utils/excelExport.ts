import * as XLSX from 'xlsx';

export interface ExportExcelOptions {
  title: string;
  subtitle?: string;
  systemName?: string;
  filename: string;
  headers: string[];
  data: (string | number | boolean | null | undefined)[][];
  summaryCards?: { label: string; value: string | number }[];
}

/**
 * Format 24-hour time string (HH:MM or HH:MM:SS) to 12-hour format with AM/PM (e.g. 02:30 PM)
 */
export const format12HourTime = (timeStr?: string | null): string => {
  if (!timeStr || !timeStr.trim() || timeStr === '-') return '';
  const trimmed = timeStr.trim();
  if (/am|pm/i.test(trimmed)) return trimmed;

  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const rawHours = parseInt(parts[0], 10);
    const rawMinutes = parseInt(parts[1], 10);
    if (!isNaN(rawHours) && !isNaN(rawMinutes)) {
      const period = rawHours >= 12 ? 'PM' : 'AM';
      const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
      const paddedHours = String(hours12).padStart(2, '0');
      const paddedMinutes = String(rawMinutes).padStart(2, '0');
      return `${paddedHours}:${paddedMinutes} ${period}`;
    }
  }
  return trimmed;
};

/**
 * Retrieve the active system branding configured in Settings / localStorage
 */
export const getActiveSystemBranding = (): { appName: string; tagline: string } => {
  let appName = 'BBL DM System';
  let tagline = 'Enterprise Management Suite';

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appName && typeof parsed.appName === 'string' && parsed.appName.trim()) {
          appName = parsed.appName.trim();
        }
        if (parsed.tagline && typeof parsed.tagline === 'string' && parsed.tagline.trim()) {
          tagline = parsed.tagline.trim();
        }
      }
    } catch (e) {
      console.warn('Could not read appSettings for Excel export:', e);
    }
  }

  return { appName, tagline };
};

export const downloadStyledExcel = ({
  title,
  subtitle,
  systemName,
  filename,
  headers,
  data,
  summaryCards = [],
}: ExportExcelOptions) => {
  const dateStr = new Date().toLocaleString();
  const branding = getActiveSystemBranding();
  
  const currentBrandName = (systemName || branding.appName || 'BBL DM System').trim();
  const currentSubtitle = subtitle || `${currentBrandName} Data Export`;

  // Construct styled HTML table format for rich Excel styling (fonts, colors, borders, badges)
  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Sheet1</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; color: #0f172a; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #64748b !important; }
    </style>
  </head>
  <body>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; border: 1px solid #475569; width: 100%;">
      <!-- TITLE BANNER -->
      <tr>
        <td colspan="${headers.length}" style="background-color: #0f172a; color: #ffffff; font-size: 14pt; font-weight: bold; text-align: left; padding: 10px 12px; border: 1px solid #0f172a;">
          🏢 ${currentBrandName.toUpperCase()} &nbsp;|&nbsp; ${title.toUpperCase()}
        </td>
      </tr>
      <tr>
        <td colspan="${headers.length}" style="background-color: #1e293b; color: #cbd5e1; font-size: 9.5pt; text-align: left; padding: 6px 12px; border: 1px solid #1e293b;">
          ${currentSubtitle} &nbsp;•&nbsp; Exported on: ${dateStr}
        </td>
      </tr>
      <tr><td colspan="${headers.length}" style="height: 10px; border: none;"></td></tr>
  `;

  // SUMMARY CARDS SECTION
  if (summaryCards.length > 0) {
    html += `<tr>`;
    summaryCards.forEach((card) => {
      html += `<td colspan="2" style="background-color: #e2e8f0; color: #1e293b; font-size: 9pt; font-weight: bold; text-align: center; border: 1px solid #64748b; padding: 6px 8px;">${card.label}</td>`;
    });
    html += `</tr><tr>`;
    summaryCards.forEach((card) => {
      html += `<td colspan="2" style="background-color: #ffffff; color: #3730a3; font-size: 11pt; font-weight: bold; text-align: center; border: 1px solid #64748b; padding: 6px 8px;">${card.value}</td>`;
    });
    html += `</tr><tr><td colspan="${headers.length}" style="height: 12px; border: none;"></td></tr>`;
  }

  // TABLE HEADERS
  html += `<tr>`;
  headers.forEach((header) => {
    html += `<th style="background-color: #1e1b4b; color: #ffffff; font-weight: bold; font-size: 9.5pt; text-align: center; padding: 8px 10px; border: 1px solid #475569;">${header}</th>`;
  });
  html += `</tr>`;

  // TABLE ROWS
  data.forEach((row, rowIndex) => {
    const bg = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
    html += `<tr>`;
    row.forEach((cell, cellIndex) => {
      const cellVal = cell === null || cell === undefined ? '' : String(cell);
      const uppercaseVal = cellVal.toUpperCase().trim();

      const borderStyle = 'border: 1px solid #64748b; padding: 6px 10px; font-size: 9.5pt; vertical-align: middle;';

      // Check status coloring
      if (
        ['LIVE', 'ACTIVE', 'COMPLETED', 'RESOLVED'].includes(uppercaseVal)
      ) {
        html += `<td style="background-color: #dcfce7; color: #14532d; font-weight: bold; text-align: center; ${borderStyle}">${cellVal}</td>`;
      } else if (
        ['OFFLINE', 'CRITICAL', 'CLOSED', 'INACTIVE'].includes(uppercaseVal)
      ) {
        html += `<td style="background-color: #fee2e2; color: #7f1d1d; font-weight: bold; text-align: center; ${borderStyle}">${cellVal}</td>`;
      } else if (
        ['MAINTENANCE', 'WORKING', 'ASSIGNED', 'ONGOING', 'OPEN', 'PENDING'].includes(uppercaseVal)
      ) {
        html += `<td style="background-color: #fef3c7; color: #78350f; font-weight: bold; text-align: center; ${borderStyle}">${cellVal}</td>`;
      } else if (
        // Code/ID columns or center alignment
        cellIndex === 0 || // SL
        /^[A-Z0-9\-]{4,}$/.test(cellVal) || // Device ID, SIM, SOL, Ticket No, PO No
        cellVal.startsWith('SOL-') ||
        cellVal.startsWith('INV-') ||
        cellVal.startsWith('PO-')
      ) {
        html += `<td style="background-color: ${bg}; color: #0f172a; font-family: 'Consolas', 'Courier New', monospace; font-weight: bold; text-align: center; ${borderStyle}">${cellVal}</td>`;
      } else if (typeof cell === 'number' || /^\$?\d+(\.\d+)?$/.test(cellVal)) {
        html += `<td style="background-color: ${bg}; color: #0f172a; text-align: right; ${borderStyle}">${cellVal}</td>`;
      } else {
        html += `<td style="background-color: ${bg}; color: #0f172a; text-align: left; ${borderStyle}">${cellVal}</td>`;
      }
    });
    html += `</tr>`;
  });

  // FOOTER
  html += `
    </table>
  </body>
  </html>
  `;

  // Create blob and download as .xls / .xlsx
  const blob = new Blob(['\ufeff' + html], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFilename = filename.endsWith('.xls') || filename.endsWith('.xlsx')
    ? filename
    : `${filename}.xls`;

  link.setAttribute('href', url);
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
