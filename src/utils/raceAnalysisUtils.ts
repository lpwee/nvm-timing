import { 
  TimingRecord, 
  RaceAttempt, 
  ParticipantSummary, 
  Session, 
  AnalysisConfig, 
  DEFAULT_ANALYSIS_CONFIG 
} from '../models/dataStructures';

/**
 * Parse CSV data into TimingRecord objects
 * @param csvContent The CSV content as a string
 * @returns Array of TimingRecord objects
 */
export function parseCSV(csvContent: string): TimingRecord[] {
  const records: TimingRecord[] = [];
  
  // Split the CSV content into lines
  const lines = csvContent.split('\n');
  
  // Skip the header line and process each data line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const columns = line.split(',');
    
    // Expected format: 
    // RD_Invalid, RD_ID, RD_DeviceID, RD_Bib, RD_Transponder, RD_Time, Contest.Name, 
    // RD_TimingPoint, RD_OrderID, RD_Hits, RD_RSSI, RD_UTCTime
    if (columns.length >= 12) {
      const record: TimingRecord = {
        invalid: columns[0].trim() === '1', // 0 = valid, 1 = invalid
        id: columns[1].trim(),
        device_id: columns[2].trim(),
        bib_number: columns[3].trim(),
        transponder: columns[4].trim(),
        time: parseFloat(columns[5].trim()),
        contest_name: columns[6].trim(),
        timing_point: columns[7].trim().toUpperCase(),
        order_id: columns[8].trim(),
        hits: parseInt(columns[9].trim(), 10),
        rssi: parseInt(columns[10].trim(), 10),
        utc_time: new Date(columns[11].trim())
      };
      
      // Only add valid records (must have bib number and valid timing point)
      if (
        record.bib_number && 
        (record.timing_point === 'START' || record.timing_point === 'FINISH') &&
        !record.invalid
      ) {
        records.push(record);
      }
    }
  }
  
  return records;
}

/**
 * Remove duplicate timing records based on threshold
 * @param records Array of TimingRecord objects
 * @param config Analysis configuration
 * @returns Filtered array of TimingRecord objects
 */
export function removeDuplicates(
  records: TimingRecord[], 
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): TimingRecord[] {
  // Sort records by bib number, timing point, and time
  const sortedRecords = [...records].sort((a, b) => {
    if (a.bib_number !== b.bib_number) {
      return a.bib_number.localeCompare(b.bib_number);
    }
    if (a.timing_point !== b.timing_point) {
      return a.timing_point.localeCompare(b.timing_point);
    }
    return a.time - b.time;
  });
  
  const filteredRecords: TimingRecord[] = [];
  
  for (let i = 0; i < sortedRecords.length; i++) {
    // Always keep the first record
    if (i === 0) {
      filteredRecords.push(sortedRecords[i]);
      continue;
    }
    
    const current = sortedRecords[i];
    const previous = sortedRecords[i - 1];
    
    // Check if this is a duplicate (same bib, same timing point, within threshold)
    const isDuplicate = 
      current.bib_number === previous.bib_number &&
      current.timing_point === previous.timing_point &&
      Math.abs(current.time - previous.time) < config.duplicate_threshold;
    
    if (!isDuplicate) {
      filteredRecords.push(current);
    }
  }
  
  return filteredRecords;
}

/**
 * Detect sessions based on time gaps and contest name changes
 * @param records Array of TimingRecord objects
 * @param config Analysis configuration
 * @returns Array of Session objects
 */
export function detectSessions(
  records: TimingRecord[], 
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): Session[] {
  if (records.length === 0) {
    return [];
  }
  
  // Sort records by time
  const sortedRecords = [...records].sort((a, b) => a.time - b.time);
  
  const sessions: Session[] = [];
  let currentSessionRecords: TimingRecord[] = [sortedRecords[0]];
  let currentContestName = sortedRecords[0].contest_name;
  
  for (let i = 1; i < sortedRecords.length; i++) {
    const current = sortedRecords[i];
    const previous = sortedRecords[i - 1];
    
    // Check if we should start a new session
    const timeGap = current.time - previous.time;
    const contestChanged = current.contest_name !== currentContestName;
    const dateChanged = 
      current.utc_time.toDateString() !== previous.utc_time.toDateString();
    
    if (timeGap > config.session_gap_threshold || contestChanged || dateChanged) {
      // Create a new session from the accumulated records
      const sessionStartTime = currentSessionRecords[0].time;
      const sessionEndTime = currentSessionRecords[currentSessionRecords.length - 1].time;
      
      sessions.push({
        id: `session_${sessions.length + 1}`,
        name: `Session ${sessions.length + 1}`,
        start_time: sessionStartTime,
        end_time: sessionEndTime,
        contest_name: currentContestName,
        records: [...currentSessionRecords]
      });
      
      // Start a new session
      currentSessionRecords = [current];
      currentContestName = current.contest_name;
    } else {
      // Add to current session
      currentSessionRecords.push(current);
    }
  }
  
  // Add the last session
  if (currentSessionRecords.length > 0) {
    const sessionStartTime = currentSessionRecords[0].time;
    const sessionEndTime = currentSessionRecords[currentSessionRecords.length - 1].time;
    
    sessions.push({
      id: `session_${sessions.length + 1}`,
      name: `Session ${sessions.length + 1}`,
      start_time: sessionStartTime,
      end_time: sessionEndTime,
      contest_name: currentContestName,
      records: [...currentSessionRecords]
    });
  }
  
  return sessions;
}

/**
 * Group records by bib number
 * @param records Array of TimingRecord objects
 * @returns Object with bib numbers as keys and arrays of TimingRecord objects as values
 */
function groupByBib(records: TimingRecord[]): Record<string, TimingRecord[]> {
  const groups: Record<string, TimingRecord[]> = {};
  
  for (const record of records) {
    if (!groups[record.bib_number]) {
      groups[record.bib_number] = [];
    }
    groups[record.bib_number].push(record);
  }
  
  return groups;
}

/**
 * Pair start and finish records using sequential pairing
 * @param starts Array of start TimingRecord objects
 * @param finishes Array of finish TimingRecord objects
 * @param sessionId Session ID
 * @returns Array of RaceAttempt objects
 */
function sequentialPairing(
  starts: TimingRecord[], 
  finishes: TimingRecord[], 
  sessionId: string
): RaceAttempt[] {
  const attempts: RaceAttempt[] = [];
  
  // Sort by time
  const sortedStarts = [...starts].sort((a, b) => a.time - b.time);
  const sortedFinishes = [...finishes].sort((a, b) => a.time - b.time);
  
  // Pair each start with the next available finish
  let finishIndex = 0;
  
  for (const start of sortedStarts) {
    // Find the next finish that occurs after this start
    let matchedFinish: TimingRecord | null = null;
    
    while (finishIndex < sortedFinishes.length) {
      const finish = sortedFinishes[finishIndex];
      
      if (finish.time > start.time) {
        matchedFinish = finish;
        finishIndex++;
        break;
      }
      
      finishIndex++;
    }
    
    // Create a race attempt
    const attempt: RaceAttempt = {
      bib_number: start.bib_number,
      start_time: start.time,
      finish_time: matchedFinish ? matchedFinish.time : null,
      duration: matchedFinish ? matchedFinish.time - start.time : null,
      status: matchedFinish ? 'COMPLETED' : 'DNF',
      session_id: sessionId
    };
    
    attempts.push(attempt);
  }
  
  // Handle orphaned finishes (finishes without a corresponding start)
  while (finishIndex < sortedFinishes.length) {
    const finish = sortedFinishes[finishIndex];
    
    // Create a race attempt with an estimated start time
    // (this is a special case for late start detection)
    const attempt: RaceAttempt = {
      bib_number: finish.bib_number,
      start_time: finish.time - 60, // Assume 1 minute race time
      finish_time: finish.time,
      duration: 60, // 1 minute
      status: 'INVALID_TOO_FAST', // Mark as invalid
      session_id: sessionId
    };
    
    attempts.push(attempt);
    finishIndex++;
  }
  
  return attempts;
}

/**
 * Pair start and finish records using proximity-based pairing
 * @param starts Array of start TimingRecord objects
 * @param finishes Array of finish TimingRecord objects
 * @param sessionId Session ID
 * @param config Analysis configuration
 * @returns Array of RaceAttempt objects
 */
function proximityPairing(
  starts: TimingRecord[], 
  finishes: TimingRecord[], 
  sessionId: string,
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): RaceAttempt[] {
  const attempts: RaceAttempt[] = [];
  
  // Sort by time
  const sortedStarts = [...starts].sort((a, b) => a.time - b.time);
  const availableFinishes = [...finishes].sort((a, b) => a.time - b.time);
  
  // For each start, find the closest valid finish
  for (const start of sortedStarts) {
    let bestFinishIndex = -1;
    let bestTimeDiff = Infinity;
    
    // Find the finish with the smallest time difference that's after the start
    for (let i = 0; i < availableFinishes.length; i++) {
      const finish = availableFinishes[i];
      
      // Only consider finishes that occur after the start
      if (finish.time > start.time) {
        const timeDiff = finish.time - start.time;
        
        // Check if this is a better match than what we've found so far
        if (timeDiff < bestTimeDiff) {
          bestTimeDiff = timeDiff;
          bestFinishIndex = i;
        }
      }
    }
    
    // Create a race attempt
    const attempt: RaceAttempt = {
      bib_number: start.bib_number,
      start_time: start.time,
      finish_time: bestFinishIndex >= 0 ? availableFinishes[bestFinishIndex].time : null,
      duration: bestFinishIndex >= 0 ? availableFinishes[bestFinishIndex].time - start.time : null,
      status: bestFinishIndex >= 0 ? 'COMPLETED' : 'DNF',
      session_id: sessionId
    };
    
    attempts.push(attempt);
    
    // Remove the used finish from the available finishes
    if (bestFinishIndex >= 0) {
      availableFinishes.splice(bestFinishIndex, 1);
    }
  }
  
  // Handle orphaned finishes (finishes without a corresponding start)
  for (const finish of availableFinishes) {
    // Create a race attempt with an estimated start time
    const attempt: RaceAttempt = {
      bib_number: finish.bib_number,
      start_time: finish.time - 60, // Assume 1 minute race time
      finish_time: finish.time,
      duration: 60, // 1 minute
      status: 'INVALID_TOO_FAST', // Mark as invalid
      session_id: sessionId
    };
    
    attempts.push(attempt);
  }
  
  return attempts;
}

/**
 * Check if there are ambiguous pairs in the race attempts
 * @param attempts Array of RaceAttempt objects
 * @returns True if there are ambiguous pairs, false otherwise
 */
function hasAmbiguousPairs(attempts: RaceAttempt[]): boolean {
  // Count the number of completed attempts per bib number
  const completedCounts: Record<string, number> = {};
  
  for (const attempt of attempts) {
    if (attempt.status === 'COMPLETED') {
      if (!completedCounts[attempt.bib_number]) {
        completedCounts[attempt.bib_number] = 0;
      }
      completedCounts[attempt.bib_number]++;
    }
  }
  
  // Check if any bib number has multiple completed attempts
  for (const bib in completedCounts) {
    if (completedCounts[bib] > 1) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate race durations and update status
 * @param attempts Array of RaceAttempt objects
 * @param config Analysis configuration
 * @returns Array of validated RaceAttempt objects
 */
function validateRaceDurations(
  attempts: RaceAttempt[], 
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): RaceAttempt[] {
  return attempts.map(attempt => {
    // Clone the attempt to avoid modifying the original
    const validated = { ...attempt };
    
    if (validated.duration === null) {
      validated.status = 'DNF';
    } else if (validated.duration < config.min_reasonable_race_time) {
      validated.status = 'INVALID_TOO_FAST';
    } else if (validated.duration > config.max_reasonable_race_time) {
      validated.status = 'INVALID_TOO_SLOW';
    } else {
      validated.status = 'COMPLETED';
    }
    
    return validated;
  });
}

/**
 * Pair starts and finishes for a session
 * @param session Session object
 * @param config Analysis configuration
 * @returns Array of RaceAttempt objects
 */
export function pairStartsAndFinishes(
  session: Session, 
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
): RaceAttempt[] {
  // Group records by bib number
  const bibGroups = groupByBib(session.records);
  
  let allAttempts: RaceAttempt[] = [];
  
  // Process each bib number separately
  for (const bib in bibGroups) {
    const records = bibGroups[bib];
    
    // Split into starts and finishes
    const starts = records.filter(r => r.timing_point === 'START');
    const finishes = records.filter(r => r.timing_point === 'FINISH');
    
    // Strategy 1: Sequential pairing (most common)
    let attempts = sequentialPairing(starts, finishes, session.id);
    
    // Strategy 2: Proximity-based pairing (for complex cases)
    if (hasAmbiguousPairs(attempts)) {
      attempts = proximityPairing(starts, finishes, session.id, config);
    }
    
    // Strategy 3: Duration-based validation
    const validatedAttempts = validateRaceDurations(attempts, config);
    
    allAttempts = [...allAttempts, ...validatedAttempts];
  }
  
  return allAttempts;
}

/**
 * Generate participant summaries from race attempts
 * @param attempts Array of RaceAttempt objects
 * @returns Array of ParticipantSummary objects
 */
export function generateParticipantSummaries(attempts: RaceAttempt[]): ParticipantSummary[] {
  // Group attempts by bib number
  const bibGroups: Record<string, RaceAttempt[]> = {};
  
  for (const attempt of attempts) {
    if (!bibGroups[attempt.bib_number]) {
      bibGroups[attempt.bib_number] = [];
    }
    bibGroups[attempt.bib_number].push(attempt);
  }
  
  const summaries: ParticipantSummary[] = [];
  
  // Process each bib number
  for (const bib in bibGroups) {
    const bibAttempts = bibGroups[bib];
    
    // Count completed and DNF attempts
    const completedAttempts = bibAttempts.filter(a => a.status === 'COMPLETED');
    const dnfCount = bibAttempts.filter(a => a.status === 'DNF').length;
    
    // Calculate best and average times
    let bestTime: number | null = null;
    let totalTime = 0;
    let validTimeCount = 0;
    
    for (const attempt of completedAttempts) {
      if (attempt.duration !== null) {
        if (bestTime === null || attempt.duration < bestTime) {
          bestTime = attempt.duration;
        }
        totalTime += attempt.duration;
        validTimeCount++;
      }
    }
    
    const averageTime = validTimeCount > 0 ? totalTime / validTimeCount : null;
    
    // Calculate consistency score (standard deviation as a percentage of average)
    let consistencyScore = 100; // Perfect score by default
    
    if (validTimeCount >= 2 && averageTime !== null) {
      let sumSquaredDiffs = 0;
      
      for (const attempt of completedAttempts) {
        if (attempt.duration !== null) {
          const diff = attempt.duration - averageTime;
          sumSquaredDiffs += diff * diff;
        }
      }
      
      const variance = sumSquaredDiffs / validTimeCount;
      const stdDev = Math.sqrt(variance);
      
      // Convert to a 0-100 score (lower std dev = higher score)
      // 0% variation = 100 score, 20% variation = 0 score
      const variationPercent = (stdDev / averageTime) * 100;
      consistencyScore = Math.max(0, 100 - (variationPercent * 5));
    }
    
    // Create the summary
    const summary: ParticipantSummary = {
      bib_number: bib,
      completed_races: completedAttempts,
      dnf_count: dnfCount,
      best_time: bestTime,
      average_time: averageTime,
      consistency_score: consistencyScore
    };
    
    summaries.push(summary);
  }
  
  // Sort by best time (fastest first)
  return summaries.sort((a, b) => {
    if (a.best_time === null && b.best_time === null) return 0;
    if (a.best_time === null) return 1;
    if (b.best_time === null) return -1;
    return a.best_time - b.best_time;
  });
}

/**
 * Process CSV data and generate race analysis
 * @param csvContent The CSV content as a string
 * @param config Analysis configuration
 * @returns Object containing sessions, attempts, and participant summaries
 */
export function analyzeRaceData(
  csvContent: string, 
  config: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG
) {
  // Parse CSV data
  const records = parseCSV(csvContent);
  
  // Remove duplicates
  const uniqueRecords = removeDuplicates(records, config);
  
  // Detect sessions
  const sessions = detectSessions(uniqueRecords, config);
  
  // Pair starts and finishes for each session
  let allAttempts: RaceAttempt[] = [];
  
  for (const session of sessions) {
    const sessionAttempts = pairStartsAndFinishes(session, config);
    allAttempts = [...allAttempts, ...sessionAttempts];
  }
  
  // Generate participant summaries
  const summaries = generateParticipantSummaries(allAttempts);
  
  return {
    sessions,
    attempts: allAttempts,
    summaries
  };
}
