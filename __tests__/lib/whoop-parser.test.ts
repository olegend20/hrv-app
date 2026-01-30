import { parseWhoopCsv, validateWhoopCsv } from '@/lib/whoop/parser';

describe('WHOOP CSV Parser', () => {
  describe('validateWhoopCsv', () => {
    it('should validate correct WHOOP CSV format', () => {
      const validCsv = `Cycle start time,Heart rate variability (ms),Resting heart rate (bpm)
2024-01-01T00:00:00.000Z,45.5,58`;

      const result = validateWhoopCsv(validCsv);
      expect(result.valid).toBe(true);
    });

    it('should reject CSV without required headers', () => {
      const invalidCsv = `Date,Value
2024-01-01,45`;

      const result = validateWhoopCsv(invalidCsv);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cycle start time');
    });

    it('should reject empty CSV', () => {
      const result = validateWhoopCsv('');
      expect(result.valid).toBe(false);
    });
  });

  describe('parseWhoopCsv', () => {
    it('should parse valid WHOOP CSV data', () => {
      const csv = `Cycle start time,Heart rate variability (ms),Resting heart rate (bpm)
2024-01-01T00:00:00.000Z,45.5,58
2024-01-02T00:00:00.000Z,48.2,56`;

      const result = parseWhoopCsv(csv);

      expect(result.readings).toHaveLength(2);
      expect(result.readings[0].hrvMs).toBe(45.5);
      expect(result.readings[0].date).toBe('2024-01-01');
      expect(result.readings[1].hrvMs).toBe(48.2);
      expect(result.skippedRows).toBe(0);
    });

    it('should skip rows with missing HRV data', () => {
      const csv = `Cycle start time,Heart rate variability (ms),Resting heart rate (bpm)
2024-01-01T00:00:00.000Z,45.5,58
2024-01-02T00:00:00.000Z,,56
2024-01-03T00:00:00.000Z,50.1,57`;

      const result = parseWhoopCsv(csv);

      expect(result.readings).toHaveLength(2);
      expect(result.skippedRows).toBe(1);
    });

    it('should handle multiple CSV files data', () => {
      const csv1 = `Cycle start time,Heart rate variability (ms),Resting heart rate (bpm)
2024-01-01T00:00:00.000Z,45.5,58`;

      const csv2 = `Cycle start time,Heart rate variability (ms),Resting heart rate (bpm)
2024-01-02T00:00:00.000Z,48.2,56`;

      const result1 = parseWhoopCsv(csv1);
      const result2 = parseWhoopCsv(csv2);

      const allReadings = [...result1.readings, ...result2.readings];
      expect(allReadings).toHaveLength(2);
    });
  });
});
