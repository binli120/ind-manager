/**
 * Inspect Excel Template Structure
 * 
 * This script inspects the Excel file to understand its structure.
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

function inspectExcel() {
  console.log('='.repeat(80));
  console.log('EXCEL TEMPLATE INSPECTION');
  console.log('='.repeat(80));
  console.log('');

  const excelPath = path.join(__dirname, '../../template_2.6.2_poc.xlsx');
  
  try {
    const fileContent = fs.readFileSync(excelPath);
    const workbook = XLSX.read(fileContent, { type: 'buffer' });
    
    console.log(`Workbook Info:`);
    console.log(`  Sheet Count: ${workbook.SheetNames.length}`);
    console.log(`  Sheet Names: ${workbook.SheetNames.join(', ')}\n`);

    // Inspect each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log('='.repeat(80));
      console.log(`SHEET ${index + 1}: ${sheetName}`);
      console.log('='.repeat(80));
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Get sheet range
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      console.log(`\nRange: ${worksheet['!ref']}`);
      console.log(`Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}\n`);
      
      // Convert to JSON with different options
      console.log('--- Raw Data (first 20 rows) ---');
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      rawData.slice(0, 20).forEach((row, i) => {
        if (row.some(cell => cell !== '')) {
          console.log(`Row ${i + 1}:`, JSON.stringify(row));
        }
      });
      
      console.log('\n--- As Objects (first 10 rows) ---');
      const objData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      objData.slice(0, 10).forEach((row, i) => {
        console.log(`Row ${i + 1}:`, JSON.stringify(row));
      });
      
      console.log('\n');
    });

  } catch (error) {
    console.error('Error inspecting Excel:', error);
  }
}

inspectExcel();
