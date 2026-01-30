import { useHrvStore } from '@/stores/hrvStore';
import { HRVReading } from '@/types';

describe('HRV Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useHrvStore.setState({ readings: [] });
  });

  describe('importReadings', () => {
    it('should add a new HRV reading', () => {
      const reading: HRVReading = {
        id: 'test-1',
        date: '2024-01-01',
        hrvMs: 45.5,
        restingHR: 58,
        source: 'manual',
      };

      const count = useHrvStore.getState().importReadings([reading]);

      const readings = useHrvStore.getState().readings;
      expect(count).toBe(1);
      expect(readings).toHaveLength(1);
      expect(readings[0].hrvMs).toBe(45.5);
    });

    it('should not add duplicate readings for same date', () => {
      const reading1: HRVReading = {
        id: 'test-1',
        date: '2024-01-01',
        hrvMs: 45.5,
        restingHR: 58,
        source: 'manual',
      };

      const reading2: HRVReading = {
        id: 'test-2',
        date: '2024-01-01',
        hrvMs: 50.0,
        restingHR: 60,
        source: 'manual',
      };

      useHrvStore.getState().importReadings([reading1]);
      useHrvStore.getState().importReadings([reading2]);

      const readings = useHrvStore.getState().readings;
      expect(readings).toHaveLength(1);
      // Should keep the newer reading
      expect(readings[0].hrvMs).toBe(50.0);
    });

    it('should import multiple readings', () => {
      const readings: HRVReading[] = [
        {
          id: 'test-1',
          date: '2024-01-01',
          hrvMs: 45.5,
          restingHR: 58,
          source: 'whoop_csv',
        },
        {
          id: 'test-2',
          date: '2024-01-02',
          hrvMs: 48.2,
          restingHR: 56,
          source: 'whoop_csv',
        },
      ];

      const count = useHrvStore.getState().importReadings(readings);

      expect(count).toBe(2);
      expect(useHrvStore.getState().readings).toHaveLength(2);
    });

    it('should deduplicate readings by date', () => {
      const readings: HRVReading[] = [
        {
          id: 'test-1',
          date: '2024-01-01',
          hrvMs: 45.5,
          restingHR: 58,
          source: 'whoop_csv',
        },
        {
          id: 'test-2',
          date: '2024-01-01',
          hrvMs: 46.0,
          restingHR: 59,
          source: 'whoop_csv',
        },
      ];

      const count = useHrvStore.getState().importReadings(readings);

      expect(count).toBe(1);
      expect(useHrvStore.getState().readings).toHaveLength(1);
    });
  });

  describe('getReadingByDate', () => {
    it('should return reading for specific date', () => {
      const reading: HRVReading = {
        id: 'test-1',
        date: '2024-01-01',
        hrvMs: 45.5,
        restingHR: 58,
        source: 'manual',
      };

      useHrvStore.getState().importReadings([reading]);

      const found = useHrvStore.getState().getReadingByDate('2024-01-01');
      expect(found).toBeDefined();
      expect(found?.hrvMs).toBe(45.5);
    });

    it('should return undefined for non-existent date', () => {
      const found = useHrvStore.getState().getReadingByDate('2024-01-01');
      expect(found).toBeUndefined();
    });
  });
});
