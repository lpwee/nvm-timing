import { Timestamp } from "firebase/firestore";

// Runner interface
export interface Runner {
  name: string;
  startTime: Timestamp | number | object; // Can be Firestore Timestamp, number (milliseconds), or ServerValue.TIMESTAMP
  endtime: Timestamp | number | object | null; // Can be Firestore Timestamp, number (milliseconds), ServerValue.TIMESTAMP, or null
}

// Helper function to get current server timestamp for Realtime Database
export const getServerTimestamp = () => {
  return {
    '.sv': 'timestamp'
  };
};

// Helper function to convert Firestore Timestamp to milliseconds for Realtime Database
export const timestampToMillis = (timestamp: Timestamp): number => {
  return timestamp.toMillis();
};

// Race Timing Analysis System Data Structures

// TimingRecord represents a single timing point record from CSV
export interface TimingRecord {
  invalid: boolean;
  id: string;
  device_id: string;
  bib_number: string;
  transponder: string;
  time: number;
  contest_name: string;
  timing_point: string; // 'START' or 'FINISH'
  order_id: string;
  hits: number;
  rssi: number;
  utc_time: Date;
}

// RaceAttempt represents a paired start and finish for a single racer
export interface RaceAttempt {
  bib_number: string;
  start_time: number;
  finish_time: number | null;
  duration: number | null;
  status: 'COMPLETED' | 'DNF' | 'INVALID_TOO_FAST' | 'INVALID_TOO_SLOW';
  session_id: string;
}

// ParticipantSummary provides aggregate statistics for a participant
export interface ParticipantSummary {
  bib_number: string;
  completed_races: RaceAttempt[];
  dnf_count: number;
  best_time: number | null;
  average_time: number | null;
  consistency_score: number;
}

// Session represents a logical grouping of race attempts
export interface Session {
  id: string;
  name: string;
  start_time: number;
  end_time: number;
  contest_name: string;
  records: TimingRecord[];
}

// AnalysisConfig provides configuration parameters for the analysis
export interface AnalysisConfig {
  max_reasonable_race_time: number; // in seconds
  min_reasonable_race_time: number; // in seconds
  session_gap_threshold: number; // in seconds
  pairing_tolerance: number; // in seconds
  duplicate_threshold: number; // in seconds
}

// Default configuration values
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  max_reasonable_race_time: 300.0, // 5 minutes
  min_reasonable_race_time: 1.0,   // 1 second
  session_gap_threshold: 600.0,    // 10 minutes between sessions
  pairing_tolerance: 10.0,         // Max time diff for start/finish pairing
  duplicate_threshold: 0.5         // Ignore readings within 0.5s
};
