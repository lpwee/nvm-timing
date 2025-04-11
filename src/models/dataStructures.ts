import { Timestamp } from "firebase/firestore";
import { getDatabase, ref, set, onValue, DatabaseReference } from "firebase/database";

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
