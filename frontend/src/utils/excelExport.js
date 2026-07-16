import * as XLSX from 'xlsx';

/**
 * Exports data array to a proper Excel (.xlsx) file
 * @param {Array<any>} data - Raw data array of items
 * @param {Array<string>} headers - List of readable column headers
 * @param {Function} rowMapper - Function mapping each item to an array of cell values
 * @param {string} fileName - Base name of the exported file
 * @param {string} [sheetName='Sheet1'] - Name of the worksheet tab
 */
export const exportToExcel = (data, headers, rowMapper, fileName, sheetName = 'Sheet1') => {
  const rows = data.map(item => rowMapper(item));
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-fit column widths based on longest string
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length;
    rows.forEach(row => {
      const val = row[colIdx];
      const valStr = val !== null && val !== undefined ? String(val) : '';
      if (valStr.length > maxLen) maxLen = valStr.length;
    });
    return { wch: Math.min(50, maxLen + 3) }; // Cap width to 50 characters
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
