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

/**
 * Universal safe browser file download utility
 * Prevents URL revocation before download starts, works inside iframes and sandboxes
 */
export const triggerDownload = (blob: Blob, filename: string) => {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();

    // Delay revocation to ensure browser processes the download
    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    }, 2000);
  } catch (err) {
    console.error('triggerDownload error:', err);
  }
};

/**
 * Generates and downloads a real, genuine Excel (.xlsx) workbook with branding, summary cards, and data
 */
export const downloadStyledExcel = ({
  title,
  subtitle,
  systemName,
  filename,
  headers,
  data,
  summaryCards = [],
}: ExportExcelOptions) => {
  try {
    const dateStr = new Date().toLocaleString();
    const branding = getActiveSystemBranding();
    const currentBrandName = (systemName || branding.appName || 'BBL DM System').trim();
    const currentSubtitle = subtitle || `${currentBrandName} Data Export`;

    const sheetRows: any[][] = [];

    // Title Banner Row
    sheetRows.push([`${currentBrandName.toUpperCase()} | ${title.toUpperCase()}`]);
    sheetRows.push([`${currentSubtitle} • Exported on: ${dateStr}`]);
    sheetRows.push([]); // blank separator

    // Summary Cards Row if available
    if (summaryCards && summaryCards.length > 0) {
      const summaryLabels: string[] = [];
      const summaryValues: (string | number)[] = [];
      summaryCards.forEach((c) => {
        summaryLabels.push(c.label, '');
        summaryValues.push(c.value, '');
      });
      sheetRows.push(summaryLabels);
      sheetRows.push(summaryValues);
      sheetRows.push([]); // blank separator
    }

    // Main Table Headers
    sheetRows.push(headers);

    // Main Table Rows
    data.forEach((row) => {
      sheetRows.push(
        row.map((cell) => {
          if (cell === null || cell === undefined) return '';
          return cell;
        })
      );
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);

    // Auto-fit column widths
    const colWidths = headers.map((h, colIndex) => {
      let maxLen = h ? String(h).length : 10;
      data.forEach((row) => {
        const val = row[colIndex];
        if (val !== undefined && val !== null) {
          const len = String(val).length;
          if (len > maxLen) maxLen = len;
        }
      });
      return { wch: Math.min(45, Math.max(14, maxLen + 3)) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    const sheetName = title.slice(0, 31).replace(/[\\/?*[\]]/g, '') || 'Report';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Ensure safe .xlsx filename
    let safeFilename = filename;
    if (safeFilename.endsWith('.xls')) {
      safeFilename = safeFilename.replace(/\.xls$/, '.xlsx');
    } else if (!safeFilename.endsWith('.xlsx')) {
      safeFilename = `${safeFilename}.xlsx`;
    }

    // Write real XLSX buffer and trigger safe download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    triggerDownload(blob, safeFilename);
  } catch (err) {
    console.error('Error in downloadStyledExcel:', err);
    throw err;
  }
};
