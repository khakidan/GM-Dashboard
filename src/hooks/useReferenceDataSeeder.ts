// src/hooks/useReferenceDataSeeder.ts

import {
  fetchSpreadsheetMetadata,
  batchUpdateSpreadsheet,
  updateSheetData,
  appendSheetData,
  fetchSheetData,
} from '../services/sheetsService';

export function useReferenceDataSeeder() {
  return {
    fetchSpreadsheetMetadata,
    batchUpdateSpreadsheet,
    updateSheetData,
    appendSheetData,
    fetchSheetData,
  };
}
