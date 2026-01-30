import { HRVReading } from '@/types';
import type {
  WhoopCycleResponse,
  WhoopRecoveryResponse,
  WhoopPaginatedResponse,
} from '@/types/whoop';
import { useWhoopAuthStore } from '@/stores/whoopAuthStore';
import { refreshWhoopToken } from './auth';

const WHOOP_API_BASE = 'https://api.prod.whoop.com/v1';

/**
 * Make authenticated request to WHOOP API with automatic token refresh
 */
async function whoopFetch<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`${WHOOP_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    const store = useWhoopAuthStore.getState();
    if (!store.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const newTokens = await refreshWhoopToken(store.refreshToken);
      store.setTokens(
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expires_in
      );

      // Retry with new token
      const retryResponse = await fetch(`${WHOOP_API_BASE}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${newTokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!retryResponse.ok) {
        throw new Error(
          `WHOOP API error: ${retryResponse.status} ${retryResponse.statusText}`
        );
      }

      return retryResponse.json();
    } catch (error) {
      // Refresh failed, clear tokens
      store.clearTokens();
      throw new Error('Authentication failed. Please reconnect to WHOOP.');
    }
  }

  if (!response.ok) {
    throw new Error(
      `WHOOP API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get a specific cycle by ID
 */
export async function getCycle(
  cycleId: number,
  accessToken: string
): Promise<WhoopCycleResponse> {
  return whoopFetch<WhoopCycleResponse>(`/cycle/${cycleId}`, accessToken);
}

/**
 * Get cycles within a date range
 */
export async function getCycles(
  startDate: string,
  endDate: string,
  accessToken: string
): Promise<WhoopCycleResponse[]> {
  const response = await whoopFetch<
    WhoopPaginatedResponse<WhoopCycleResponse>
  >(
    `/cycle?start=${startDate}&end=${endDate}`,
    accessToken
  );

  return response.records;
}

/**
 * Get recovery data for a specific cycle
 */
export async function getRecovery(
  cycleId: number,
  accessToken: string
): Promise<WhoopRecoveryResponse> {
  return whoopFetch<WhoopRecoveryResponse>(
    `/recovery/${cycleId}`,
    accessToken
  );
}

/**
 * Fetch HRV data from WHOOP for a date range and convert to HRVReading format
 */
export async function fetchWhoopHRVData(
  startDate: string,
  endDate: string,
  accessToken: string
): Promise<HRVReading[]> {
  try {
    // Get all cycles in the date range
    const cycles = await getCycles(startDate, endDate, accessToken);

    // Filter for scored cycles only
    const scoredCycles = cycles.filter((c) => c.score_state === 'SCORED');

    // Fetch recovery data for each cycle
    const hrvReadings: HRVReading[] = [];

    for (const cycle of scoredCycles) {
      try {
        const recovery = await getRecovery(cycle.id, accessToken);

        // Only include if recovery is scored and HRV is available
        if (
          recovery.score_state === 'SCORED' &&
          recovery.score.hrv_rmssd_milli > 0
        ) {
          const reading: HRVReading = {
            id: `whoop-${cycle.id}`,
            date: cycle.start.split('T')[0], // Extract date from ISO string
            hrvMs: recovery.score.hrv_rmssd_milli,
            restingHR: recovery.score.resting_heart_rate,
            recoveryScore: recovery.score.recovery_score,
            source: 'whoop_api',
          };

          hrvReadings.push(reading);
        }
      } catch (error) {
        console.error(`Failed to fetch recovery for cycle ${cycle.id}:`, error);
        // Continue with other cycles even if one fails
      }
    }

    // Sort by date
    hrvReadings.sort((a, b) => a.date.localeCompare(b.date));

    return hrvReadings;
  } catch (error) {
    console.error('Error fetching WHOOP HRV data:', error);
    throw error;
  }
}

/**
 * Fetch the latest HRV reading from WHOOP (last 7 days)
 */
export async function fetchLatestWhoopHRV(
  accessToken: string
): Promise<HRVReading | null> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const readings = await fetchWhoopHRVData(startDate, endDate, accessToken);

  return readings.length > 0 ? readings[readings.length - 1] : null;
}
