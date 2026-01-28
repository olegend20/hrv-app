import Papa from 'papaparse';
import { HRVReading } from '@/types';

interface WhoopCsvRow {
  'Cycle start time'?: string;
  'Heart rate variability (ms)'?: string;
  'Resting heart rate (bpm)'?: string;
  'Recovery score'?: string;
  [key: string]: string | undefined;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function parseDate(dateString: string): string | null {
  if (!dateString) return null;

  // Handle format: "2024-01-15 06:30:00" or "2024-01-15T06:30:00"
  const date = new Date(dateString.replace(' ', 'T'));

  if (isNaN(date.getTime())) {
    return null;
  }

  // Return YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

export interface ParseResult {
  readings: HRVReading[];
  errors: string[];
  skippedRows: number;
}

export function parseWhoopCsv(csvContent: string): ParseResult {
  const result: ParseResult = {
    readings: [],
    errors: [],
    skippedRows: 0,
  };

  const parsed = Papa.parse<WhoopCsvRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    result.errors = parsed.errors.map((e) => `Row ${e.row}: ${e.message}`);
  }

  const seenDates = new Set<string>();

  for (const row of parsed.data) {
    const date = parseDate(row['Cycle start time'] || '');
    const hrv = parseNumber(row['Heart rate variability (ms)']);
    const restingHR = parseNumber(row['Resting heart rate (bpm)']);
    const recoveryScore = parseNumber(row['Recovery score']);

    // Skip rows without valid date or HRV
    if (!date || hrv === null) {
      result.skippedRows++;
      continue;
    }

    // Skip duplicate dates (keep first occurrence)
    if (seenDates.has(date)) {
      result.skippedRows++;
      continue;
    }
    seenDates.add(date);

    const reading: HRVReading = {
      id: generateId(),
      date,
      hrvMs: hrv,
      restingHR: restingHR ?? 0,
      recoveryScore: recoveryScore ?? undefined,
      source: 'whoop_csv',
      rawData: { ...row },
    };

    result.readings.push(reading);
  }

  // Sort by date ascending
  result.readings.sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

export function validateWhoopCsv(csvContent: string): { valid: boolean; error?: string } {
  const firstLine = csvContent.split('\n')[0];

  const requiredColumns = [
    'Cycle start time',
    'Heart rate variability (ms)',
  ];

  for (const col of requiredColumns) {
    if (!firstLine.includes(col)) {
      return {
        valid: false,
        error: `Missing required column: "${col}". Please ensure you're using a WHOOP physiological cycles export.`,
      };
    }
  }

  return { valid: true };
}
