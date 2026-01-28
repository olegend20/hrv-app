import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HabitEntry } from '@/types';

interface HabitState {
  entries: HabitEntry[];
  hasHydrated: boolean;
  addEntry: (entry: Omit<HabitEntry, 'id'>) => HabitEntry;
  updateEntry: (id: string, updates: Partial<HabitEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntryByDate: (date: string) => HabitEntry | undefined;
  getEntriesInRange: (startDate: string, endDate: string) => HabitEntry[];
  getEntryById: (id: string) => HabitEntry | undefined;
  clearEntries: () => void;
  setHasHydrated: (state: boolean) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      entries: [],
      hasHydrated: false,

      addEntry: (entryData: Omit<HabitEntry, 'id'>) => {
        const entry: HabitEntry = {
          ...entryData,
          id: generateId(),
        };

        // Check if entry for this date already exists
        const existingIndex = get().entries.findIndex(
          (e) => e.date === entry.date
        );

        if (existingIndex >= 0) {
          // Update existing entry
          const newEntries = [...get().entries];
          newEntries[existingIndex] = { ...newEntries[existingIndex], ...entry };
          set({ entries: newEntries });
          return newEntries[existingIndex];
        } else {
          // Add new entry
          set({ entries: [...get().entries, entry] });
          return entry;
        }
      },

      updateEntry: (id: string, updates: Partial<HabitEntry>) => {
        set({
          entries: get().entries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        });
      },

      deleteEntry: (id: string) => {
        set({
          entries: get().entries.filter((entry) => entry.id !== id),
        });
      },

      getEntryByDate: (date: string) => {
        return get().entries.find((entry) => entry.date === date);
      },

      getEntriesInRange: (startDate: string, endDate: string) => {
        return get()
          .entries.filter(
            (entry) => entry.date >= startDate && entry.date <= endDate
          )
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      getEntryById: (id: string) => {
        return get().entries.find((entry) => entry.id === id);
      },

      clearEntries: () => {
        set({ entries: [] });
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state });
      },
    }),
    {
      name: 'hrv-habit-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Helper function to calculate streak
export function calculateStreak(entries: HabitEntry[]): number {
  if (entries.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Sort entries by date descending
  const sortedEntries = [...entries].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  // Check if today is logged
  const hasToday = sortedEntries[0]?.date === todayStr;
  if (!hasToday) {
    // Check if yesterday is logged (streak can still count if today not done yet)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (sortedEntries[0]?.date !== yesterdayStr) {
      return 0;
    }
  }

  // Count consecutive days
  let streak = 0;
  let expectedDate = hasToday ? today : new Date(today.setDate(today.getDate() - 1));

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    const expectedStr = expectedDate.toISOString().split('T')[0];

    if (entry.date === expectedStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (entry.date < expectedStr) {
      // Gap in dates, streak ends
      break;
    }
  }

  return streak;
}

// Helper to get dates with entries
export function getDatesWithEntries(entries: HabitEntry[]): Set<string> {
  return new Set(entries.map((e) => e.date));
}
