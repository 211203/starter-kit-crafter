
import { SalesClient } from '@/types/sales';

export const fetchGoogleSheetsData = async (sheetId: string): Promise<SalesClient[]> => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }
    
    // Parse header row to get column indices
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(col => col.replace(/"/g, '').trim());
    
    console.log('CSV Headers found:', headers);
    
    // Find column indices by header name (case-insensitive)
    const getColumnIndex = (headerName: string): number => {
      const index = headers.findIndex(h => h.toLowerCase() === headerName.toLowerCase());
      if (index === -1) {
        console.warn(`Header "${headerName}" not found in CSV. Available headers:`, headers);
      }
      return index;
    };
    
    const firstNameIndex = getColumnIndex('firstName') !== -1 ? getColumnIndex('firstName') : getColumnIndex('first name');
    const lastNameIndex = getColumnIndex('lastName') !== -1 ? getColumnIndex('lastName') : getColumnIndex('last name');
    const emailIndex = getColumnIndex('email');
    const phoneIndex = getColumnIndex('phoneNo') !== -1 ? getColumnIndex('phoneNo') : getColumnIndex('phone');
    const sourceIndex = getColumnIndex('source');
    
    console.log('Column mapping:', {
      firstNameIndex,
      lastNameIndex,
      emailIndex,
      phoneIndex,
      sourceIndex
    });
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    return dataLines.map((line, index) => {
      const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
      
      return {
        id: `row_${index}`,
        user_id: '', // Not used for Google Sheets data
        firstName: firstNameIndex !== -1 ? (columns[firstNameIndex] || '') : '',
        lastName: lastNameIndex !== -1 ? (columns[lastNameIndex] || '') : '',
        email: emailIndex !== -1 ? (columns[emailIndex] || '') : '',
        phoneNo: phoneIndex !== -1 ? (columns[phoneIndex] || '') : '',
        source: sourceIndex !== -1 ? (columns[sourceIndex] || '') : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }).filter(client => client.email); // Filter out rows without email
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
};
