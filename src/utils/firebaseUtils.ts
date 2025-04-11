import { database } from "../../firebaseConfig";
import { ref, set, push, update, get } from "firebase/database";
import { Timestamp } from "firebase/firestore";
import type { Runner } from "../models/dataStructures";
import { getServerTimestamp, timestampToMillis } from "../models/dataStructures";

// Create a new runner with server timestamp for startTime
export async function createNewRunner(name: string): Promise<string> {
  const newRunner: Runner = {
    name,
    startTime: getServerTimestamp(),
    endtime: null // Will be updated when the runner finishes
  };
  
  // Generate a unique ID for the runner
  const runnersRef = ref(database, 'timings');
  const newRunnerRef = push(runnersRef);
  const runnerId = newRunnerRef.key;
  
  if (!runnerId) {
    throw new Error('Failed to generate runner ID');
  }
  
  await writeRunnerData(runnerId, newRunner);
  return runnerId;
}

// Write runner data to the database
export async function writeRunnerData(runnerId: string, runner: Runner): Promise<void> {
  const runnerRef = ref(database, `timings/${runnerId}`);
  
  // Convert Timestamp objects to milliseconds if needed
  const runnerData = {
    ...runner,
    startTime: runner.startTime instanceof Timestamp ? 
      timestampToMillis(runner.startTime) : runner.startTime,
    endtime: runner.endtime instanceof Timestamp ? 
      timestampToMillis(runner.endtime) : runner.endtime
  };
  
  try {
    await set(runnerRef, runnerData);
    console.log("Runner data saved successfully!");
  } catch (error) {
    console.error("Error writing runner data:", error);
    throw error;
  }
}

// Update a runner's end time
export async function updateRunnerEndTime(runnerId: string): Promise<boolean> {
  const runnerRef = ref(database, `timings/${runnerId}`);
  
  try {
    await update(runnerRef, {
      endtime: getServerTimestamp()
    });
    console.log("Runner end time updated successfully!");
    return true;
  } catch (error) {
    console.error("Error updating runner end time:", error);
    return false;
  }
}

// Get all runners
export async function getAllRunners(): Promise<{ [key: string]: Runner }> {
  const runnersRef = ref(database, 'timings');
  
  try {
    const snapshot = await get(runnersRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error("Error getting runners:", error);
    throw error;
  }
}

// Delete a runner
export async function deleteRunner(runnerId: string): Promise<boolean> {
  const runnerRef = ref(database, `timings/${runnerId}`);
  
  try {
    await set(runnerRef, null);
    console.log("Runner deleted successfully!");
    return true;
  } catch (error) {
    console.error("Error deleting runner:", error);
    return false;
  }
}

// Calculate duration in seconds between startTime and endtime
export function calculateDuration(startTime: number, endtime: number | null): number | null {
  if (!endtime) return null;
  
  // Convert to seconds and round to 2 decimal places
  return Math.round((endtime - startTime) / 10) / 100;
}
