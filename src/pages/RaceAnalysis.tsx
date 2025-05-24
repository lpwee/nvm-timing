import { useState, useRef, ChangeEvent } from 'react';
import { 
  analyzeRaceData, 
  parseCSV
} from '../utils/raceAnalysisUtils';
import { 
  RaceAttempt, 
  ParticipantSummary, 
  Session, 
  AnalysisConfig, 
  DEFAULT_ANALYSIS_CONFIG 
} from '../models/dataStructures';

function RaceAnalysis() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AnalysisConfig>(DEFAULT_ANALYSIS_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    sessions: Session[];
    attempts: RaceAttempt[];
    summaries: ParticipantSummary[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'sessions' | 'attempts'>('summary');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setError(null);
      setAnalysisResult(null);
    }
  };

  // Handle config change
  const handleConfigChange = (field: keyof AnalysisConfig, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setConfig({
        ...config,
        [field]: numValue
      });
    }
  };

  // Reset to default config
  const resetConfig = () => {
    setConfig(DEFAULT_ANALYSIS_CONFIG);
  };

  // Handle file upload and analysis
  const handleAnalyze = async () => {
    if (!csvFile) {
      setError('Please select a CSV file first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Read the file content
      const fileContent = await csvFile.text();
      
      // Analyze the data
      const result = analyzeRaceData(fileContent, config);
      
      setAnalysisResult(result);
      
      // Set the active session to the first one if available
      if (result.sessions.length > 0) {
        setActiveSessionId(result.sessions[0].id);
      }
    } catch (err) {
      console.error('Error analyzing CSV data:', err);
      setError('Failed to analyze the CSV file. Please check the file format and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Format time in seconds to readable format
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    
    // Format as minutes:seconds.milliseconds
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 100);
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Format date to readable format
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DNF':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INVALID_TOO_FAST':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'INVALID_TOO_SLOW':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 bg-white rounded-lg shadow-sm">
      <h1 className="text-center text-purple-700 text-lg font-bold mb-2 pb-1 relative">
        Race Timing Analysis
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-purple-500 rounded"></span>
      </h1>
      
      {/* File Upload Section */}
      <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p className="text-sm text-gray-600 mb-2">
            Upload a CSV file with race timing data
          </p>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            
            <button 
              type="button" 
              className="bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-4 rounded text-xs font-semibold shadow-sm transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </button>
            
            <button 
              type="button" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 px-4 rounded text-xs font-semibold shadow-sm transition-all"
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? 'Hide Config' : 'Show Config'}
            </button>
          </div>
          
          {csvFile && (
            <div className="mt-2 text-sm text-gray-600">
              Selected file: <span className="font-semibold">{csvFile.name}</span> ({(csvFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
      </div>
      
      {/* Configuration Section */}
      {showConfig && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Analysis Configuration</h3>
            <button 
              type="button" 
              className="text-xs text-purple-600 hover:text-purple-800"
              onClick={resetConfig}
            >
              Reset to Defaults
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Reasonable Race Time (seconds)
              </label>
              <input
                type="number"
                value={config.min_reasonable_race_time}
                onChange={(e) => handleConfigChange('min_reasonable_race_time', e.target.value)}
                className="w-full p-1.5 text-xs border border-gray-300 rounded bg-white text-gray-900 shadow-sm"
                min="0.1"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Reasonable Race Time (seconds)
              </label>
              <input
                type="number"
                value={config.max_reasonable_race_time}
                onChange={(e) => handleConfigChange('max_reasonable_race_time', e.target.value)}
                className="w-full p-1.5 text-xs border border-gray-300 rounded bg-white text-gray-900 shadow-sm"
                min="1"
                step="1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Session Gap Threshold (seconds)
              </label>
              <input
                type="number"
                value={config.session_gap_threshold}
                onChange={(e) => handleConfigChange('session_gap_threshold', e.target.value)}
                className="w-full p-1.5 text-xs border border-gray-300 rounded bg-white text-gray-900 shadow-sm"
                min="1"
                step="1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pairing Tolerance (seconds)
              </label>
              <input
                type="number"
                value={config.pairing_tolerance}
                onChange={(e) => handleConfigChange('pairing_tolerance', e.target.value)}
                className="w-full p-1.5 text-xs border border-gray-300 rounded bg-white text-gray-900 shadow-sm"
                min="0.1"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Duplicate Threshold (seconds)
              </label>
              <input
                type="number"
                value={config.duplicate_threshold}
                onChange={(e) => handleConfigChange('duplicate_threshold', e.target.value)}
                className="w-full p-1.5 text-xs border border-gray-300 rounded bg-white text-gray-900 shadow-sm"
                min="0.1"
                step="0.1"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 rounded bg-red-100 border-l-4 border-red-500 text-red-700 text-xs">
          {error}
        </div>
      )}
      
      {/* Analyze Button */}
      <div className="flex justify-center mb-4">
        <button 
          type="button" 
          className="bg-purple-700 hover:bg-purple-800 text-white py-2 px-6 rounded text-sm font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleAnalyze}
          disabled={!csvFile || isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Race Data'}
        </button>
      </div>
      
      {/* Results Section */}
      {analysisResult && (
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-2 px-4 text-sm font-medium border-b-2 ${
                  activeTab === 'summary'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium border-b-2 ${
                  activeTab === 'sessions'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('sessions')}
              >
                Sessions
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium border-b-2 ${
                  activeTab === 'attempts'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('attempts')}
              >
                Attempts
              </button>
            </nav>
          </div>
          
          {activeTab === 'summary' && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Participant Summaries</h3>
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Bib #</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Best Time</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Avg Time</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Completed</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">DNF</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Consistency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.summaries.map((summary, index) => (
                      <tr 
                        key={summary.bib_number} 
                        className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-3 py-2 text-gray-800 text-xs font-medium">{summary.bib_number}</td>
                        <td className="px-3 py-2 text-gray-800 text-xs">{formatTime(summary.best_time)}</td>
                        <td className="px-3 py-2 text-gray-800 text-xs">{formatTime(summary.average_time)}</td>
                        <td className="px-3 py-2 text-gray-800 text-xs">{summary.completed_races.length}</td>
                        <td className="px-3 py-2 text-gray-800 text-xs">{summary.dnf_count}</td>
                        <td className="px-3 py-2 text-xs">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${summary.consistency_score}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-600">{summary.consistency_score.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'sessions' && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Sessions</h3>
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Session Name</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Start Time</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">End Time</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Contest</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Records</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.sessions.map((session, index) => (
                      <tr 
                        key={session.id} 
                        className={`border-b hover:bg-gray-50 ${
                          session.id === activeSessionId 
                            ? 'bg-purple-50 relative before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-purple-400' 
                            : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-2 text-gray-800 text-xs font-medium">{session.name}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{formatDate(session.start_time)}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{formatDate(session.end_time)}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{session.contest_name}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{session.records.length}</td>
                        <td className="px-3 py-2">
                          <button 
                            type="button" 
                            className={`py-1 px-2 rounded text-xs font-semibold shadow-sm transition-all ${
                              session.id === activeSessionId
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => setActiveSessionId(session.id)}
                          >
                            {session.id === activeSessionId ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'attempts' && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">All Race Attempts</h3>
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Bib #</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Session</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Start Time</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Finish Time</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Duration</th>
                      <th className="px-3 py-2 font-semibold text-gray-600 border-b text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.attempts.map((attempt, index) => {
                      // Find the session name
                      const session = analysisResult.sessions.find(s => s.id === attempt.session_id);
                      
                      return (
                        <tr 
                          key={`${attempt.bib_number}-${index}`} 
                          className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="px-3 py-2 text-gray-800 text-xs font-medium">{attempt.bib_number}</td>
                          <td className="px-3 py-2 text-gray-600 text-xs">{session?.name || attempt.session_id}</td>
                          <td className="px-3 py-2 text-gray-600 text-xs">{formatDate(attempt.start_time)}</td>
                          <td className="px-3 py-2 text-gray-600 text-xs">
                            {attempt.finish_time ? formatDate(attempt.finish_time) : 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-gray-800 text-xs font-medium">
                            {formatTime(attempt.duration)}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadgeClass(attempt.status)}`}>
                              {attempt.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RaceAnalysis;
