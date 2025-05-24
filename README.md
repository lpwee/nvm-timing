# NVM Timing System

A comprehensive race timing and analysis system for tracking runner start and finish times, with advanced analysis capabilities.

## Features

- **Start Point**: Register runners with bib numbers and record their start times
- **End Point**: Record finish times for active runners
- **Results**: View and export race results
- **Race Timing Analysis**: Advanced analysis of race timing data from CSV files

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Usage

### Basic Timing

1. **Start Point**: Register runners by entering their bib numbers and clicking "Register"
2. **End Point**: Record finish times by clicking "Stop" next to a runner's name
3. **Results**: View race results, including duration and status

### Race Timing Analysis

The Race Timing Analysis feature allows you to analyze CSV files containing race timing data. It can:

- Detect multiple sessions based on time gaps and contest names
- Pair start and finish times for each participant
- Handle edge cases like DNFs, late starts, and timing system glitches
- Generate participant summaries with statistics

#### CSV Format

The system expects CSV files in the following format:

```
RD_Invalid,RD_ID,RD_DeviceID,RD_Bib,RD_Transponder,RD_Time,Contest.Name,RD_TimingPoint,RD_OrderID,RD_Hits,RD_RSSI,RD_UTCTime
0,1,T-22701,1,1,43902.7,,START,169931,1,-68,2025-04-10T12:11:42+02:00
0,2,T-22702,1,1,43925.3,,FINISH,169931,6,-49,2025-04-10T12:12:05+02:00
```

Where:
- `RD_Invalid`: Flag indicating if the record is invalid (0 = valid, 1 = invalid)
- `RD_ID`: Unique identifier for the record
- `RD_DeviceID`: Device ID that recorded the timing point
- `RD_Bib`: Runner's bib number
- `RD_Transponder`: Transponder ID
- `RD_Time`: Timestamp in seconds
- `Contest.Name`: Name of the race/contest
- `RD_TimingPoint`: Either "START" or "FINISH"
- `RD_OrderID`: Order identifier
- `RD_Hits`: Number of hits
- `RD_RSSI`: Signal strength
- `RD_UTCTime`: UTC timestamp

#### Analysis Configuration

You can customize the analysis with the following parameters:

- **Min Reasonable Race Time**: Minimum valid race duration (in seconds)
- **Max Reasonable Race Time**: Maximum valid race duration (in seconds)
- **Session Gap Threshold**: Time gap (in seconds) that indicates a new session
- **Pairing Tolerance**: Maximum time difference for pairing start/finish records
- **Duplicate Threshold**: Time threshold for identifying duplicate records

#### Sample Data

A sample CSV file (`sample-race-data.csv`) is included in the repository for testing the analysis feature.

## Development

### Project Structure

- `src/models/`: Data structures and interfaces
- `src/pages/`: React components for each page
- `src/utils/`: Utility functions for Firebase and race analysis

### Key Files

- `dataStructures.ts`: Defines data structures for the application
- `firebaseUtils.ts`: Firebase integration for storing and retrieving data
- `raceAnalysisUtils.ts`: Utilities for analyzing race timing data

## License

This project is licensed under the MIT License - see the LICENSE file for details.
