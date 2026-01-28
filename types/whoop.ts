/**
 * WHOOP API Response Types
 * Based on WHOOP API v1 documentation
 */

export interface WhoopCycleResponse {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  timezone_offset: string;
  score_state: 'SCORED' | 'PENDING' | 'UNSCORABLE';
  score: {
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  };
}

export interface WhoopRecoveryResponse {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: 'SCORED' | 'PENDING' | 'UNSCORABLE';
  score: {
    user_calibrating: boolean;
    recovery_score: number; // 0-100
    resting_heart_rate: number;
    hrv_rmssd_milli: number; // HRV in milliseconds
    spo2_percentage: number;
    skin_temp_celsius: number;
  };
}

export interface WhoopSleepResponse {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  timezone_offset: string;
  nap: boolean;
  score_state: 'SCORED' | 'PENDING' | 'UNSCORABLE';
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}

export interface WhoopWorkoutResponse {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  timezone_offset: string;
  sport_id: number;
  score_state: 'SCORED' | 'PENDING' | 'UNSCORABLE';
  score: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter: number;
    altitude_gain_meter: number;
    altitude_change_meter: number;
    zone_duration: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
}

export interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token: string | null;
}
