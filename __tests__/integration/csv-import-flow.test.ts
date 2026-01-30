/**
 * Integration Test: Full CSV Import Flow
 * Tests the complete flow from file selection to data import
 */

import { parseWhoopCsv, validateWhoopCsv } from '@/lib/whoop/parser';
import { useHrvStore } from '@/stores/hrvStore';

describe('CSV Import Integration Flow', () => {
  beforeEach(() => {
    // Reset store
    useHrvStore.setState({ readings: [] });
  });

  it('should handle complete import flow for single file', () => {
    // 1. Simulate file content
    const csvContent = `Cycle start time,Heart rate variability (ms),Resting heart rate (bpm),Recovery score
2024-01-01T00:00:00.000Z,45.5,58,68
2024-01-02T00:00:00.000Z,48.2,56,72`;

    // 2. Validate CSV
    const validation = validateWhoopCsv(csvContent);
    expect(validation.valid).toBe(true);

    // 3. Parse CSV
    const parseResult = parseWhoopCsv(csvContent);
    expect(parseResult.readings).toHaveLength(2);

    // 4. Import to store
    const importedCount = useHrvStore.getState().importReadings(parseResult.readings);
    expect(importedCount).toBe(2);

    // 5. Verify data in store
    const storedReadings = useHrvStore.getState().readings;
    expect(storedReadings).toHaveLength(2);
    expect(storedReadings[0].hrvMs).toBe(45.5);
    expect(storedReadings[0].restingHR).toBe(58);
    expect(storedReadings[1].hrvMs).toBe(48.2);
  });

  it('should handle multiple CSV files import flow', () => {
    // Simulate 4 WHOOP CSV files
    const file1 = `Cycle start time,Heart rate variability (ms)
2024-01-01T00:00:00.000Z,45.5`;

    const file2 = `Cycle start time,Heart rate variability (ms)
2024-01-02T00:00:00.000Z,48.2`;

    const file3 = `Cycle start time,Heart rate variability (ms)
2024-01-03T00:00:00.000Z,50.1`;

    const file4 = `Cycle start time,Heart rate variability (ms)
2024-01-04T00:00:00.000Z,47.8`;

    const allFiles = [file1, file2, file3, file4];
    const allReadings: any[] = [];

    // Process each file
    allFiles.forEach((fileContent) => {
      const validation = validateWhoopCsv(fileContent);
      if (validation.valid) {
        const parseResult = parseWhoopCsv(fileContent);
        allReadings.push(...parseResult.readings);
      }
    });

    // Import all readings
    const importedCount = useHrvStore.getState().importReadings(allReadings);
    expect(importedCount).toBe(4);

    // Verify all data imported
    const storedReadings = useHrvStore.getState().readings;
    expect(storedReadings).toHaveLength(4);
  });

  it('should handle import flow with invalid data gracefully', () => {
    const csvWithInvalidRows = `Cycle start time,Heart rate variability (ms)
2024-01-01T00:00:00.000Z,45.5
2024-01-02T00:00:00.000Z,
2024-01-03T00:00:00.000Z,invalid
2024-01-04T00:00:00.000Z,47.8`;

    const validation = validateWhoopCsv(csvWithInvalidRows);
    expect(validation.valid).toBe(true);

    const parseResult = parseWhoopCsv(csvWithInvalidRows);

    // Should only get valid readings
    expect(parseResult.readings.length).toBeLessThan(4);
    expect(parseResult.skippedRows).toBeGreaterThan(0);

    // Import what we got
    const importedCount = useHrvStore.getState().importReadings(parseResult.readings);
    expect(importedCount).toBeGreaterThan(0);
  });

  it('should deduplicate readings from multiple files with overlapping dates', () => {
    const file1 = `Cycle start time,Heart rate variability (ms)
2024-01-01T00:00:00.000Z,45.5
2024-01-02T00:00:00.000Z,48.2`;

    const file2 = `Cycle start time,Heart rate variability (ms)
2024-01-02T00:00:00.000Z,48.5
2024-01-03T00:00:00.000Z,50.1`;

    const allReadings: any[] = [];

    [file1, file2].forEach((fileContent) => {
      const parseResult = parseWhoopCsv(fileContent);
      allReadings.push(...parseResult.readings);
    });

    const importedCount = useHrvStore.getState().importReadings(allReadings);

    // Should deduplicate 2024-01-02
    expect(importedCount).toBe(3);

    const storedReadings = useHrvStore.getState().readings;
    expect(storedReadings).toHaveLength(3);

    // Verify deduplication kept one entry for 2024-01-02
    const jan2Reading = storedReadings.find((r) => r.date === '2024-01-02');
    expect(jan2Reading).toBeDefined();
  });
});
