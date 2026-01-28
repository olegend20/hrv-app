// HRV Benchmarks by age and gender (RMSSD in milliseconds)
// Based on population studies - p25, p50, p75 percentiles

export type AgeBracket = '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+';
export type Gender = 'male' | 'female' | 'other';

export interface Benchmark {
  p25: number;
  p50: number;
  p75: number;
}

export const HRV_BENCHMARKS: Record<Gender, Record<AgeBracket, Benchmark>> = {
  male: {
    '18-25': { p25: 50, p50: 78, p75: 100 },
    '26-35': { p25: 40, p50: 60, p75: 80 },
    '36-45': { p25: 35, p50: 48, p75: 65 },
    '46-55': { p25: 30, p50: 40, p75: 55 },
    '56-65': { p25: 25, p50: 35, p75: 48 },
    '65+': { p25: 20, p50: 30, p75: 42 },
  },
  female: {
    '18-25': { p25: 45, p50: 70, p75: 90 },
    '26-35': { p25: 38, p50: 55, p75: 75 },
    '36-45': { p25: 32, p50: 45, p75: 60 },
    '46-55': { p25: 28, p50: 38, p75: 52 },
    '56-65': { p25: 24, p50: 33, p75: 45 },
    '65+': { p25: 20, p50: 28, p75: 40 },
  },
  // For 'other', use average of male and female
  other: {
    '18-25': { p25: 47, p50: 74, p75: 95 },
    '26-35': { p25: 39, p50: 57, p75: 77 },
    '36-45': { p25: 33, p50: 46, p75: 62 },
    '46-55': { p25: 29, p50: 39, p75: 53 },
    '56-65': { p25: 24, p50: 34, p75: 46 },
    '65+': { p25: 20, p50: 29, p75: 41 },
  },
};

export function getAgeBracket(age: number): AgeBracket {
  if (age < 26) return '18-25';
  if (age < 36) return '26-35';
  if (age < 46) return '36-45';
  if (age < 56) return '46-55';
  if (age < 66) return '56-65';
  return '65+';
}

export function getBenchmark(age: number, gender: Gender): Benchmark {
  const bracket = getAgeBracket(age);
  return HRV_BENCHMARKS[gender][bracket];
}
