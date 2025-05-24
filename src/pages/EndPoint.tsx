import { useState, useEffect } from 'react';
import { updateRunnerEndTime, getAllRunners, undoRunnerEndTime } from '../utils/firebaseUtils';
import type { Runner } from '../models/dataStructures';

interface RunnerWithId extends Runner {
  id: string;
}

interface LastEndedRunner {
  id: string;
  name: string;
  endTime: string;
}

function EndPoint() {
  const [activeRunners, setActiveRunners] = useState<RunnerWithId[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastEndedRunner, setLastEndedRunner] = useState<LastEndedRunner | null>(null);

  // Load all active runners
  const loadActiveRunners = async () => {
    try {
      const runnersData = await getAllRunners();
      
      // Convert the object to an array with IDs and filter for active runners (no endtime)
      const runnersArray = Object.entries(runnersData)
        .map(([id, runner]) => ({
          ...runner,
          id
        }))
        .filter(runner => {
          // If endtime is null or undefined, the runner is active
          return runner.endtime === null || runner.endtime === undefined;
        });
      
      setActiveRunners(runnersArray);
    } catch (error) {
      console.error("Error loading active runners:", error);
      setMessage("Failed to load active runners. Please try again.");
    }
  };

  // Set up polling to refresh the active runners list
  useEffect(() => {
    // Load active runners immediately
    loadActiveRunners();
    
    // Set up interval to refresh every 5 seconds
    const interval = window.setInterval(() => {
      loadActiveRunners();
    }, 5000);
    
    setRefreshInterval(interval);
    
    // Clean up interval on component unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Handle stopping the runner (updating end time)
  const handleStopRunner = async (runnerId: string, runnerName: string) => {
    setIsLoading(true);
    
    try {
      const success = await updateRunnerEndTime(runnerId);
      if (success) {
        const currentTime = new Date().toLocaleTimeString();
        setMessage(`Runner "${runnerName}" finished!`);
        setLastEndedRunner({
          id: runnerId,
          name: runnerName,
          endTime: currentTime
        });
        
        // Refresh the active runners list
        loadActiveRunners();
      } else {
        setMessage("Failed to update runner end time");
      }
    } catch (error) {
      console.error("Error stopping runner:", error);
      setMessage("Failed to stop runner. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle undoing the last ended runner
  const handleUndoLastEnded = async () => {
    if (!lastEndedRunner) return;
    
    setIsUndoing(true);
    
    try {
      const success = await undoRunnerEndTime(lastEndedRunner.id);
      if (success) {
        setMessage(`Undid end time for runner "${lastEndedRunner.name}"`);
        setLastEndedRunner(null);
        
        // Refresh the active runners list
        loadActiveRunners();
      } else {
        setMessage("Failed to undo runner end time");
      }
    } catch (error) {
      console.error("Error undoing runner end time:", error);
      setMessage("Failed to undo. Please try again.");
    } finally {
      setIsUndoing(false);
    }
  };

  // Format timestamp to readable time
  const formatTimestamp = (timestamp: number | object): string => {
    const timeValue = typeof timestamp === 'object' 
      ? (timestamp as any).timestamp || 0 
      : Number(timestamp);
      
    return new Date(timeValue).toLocaleTimeString();
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-xl shadow-md pb-16">
      <h1 className="text-center text-purple-700 text-xl font-bold mb-3 pb-2 relative">
        End Point
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-purple-500 rounded"></span>
      </h1>
      
      {message && (
        <div className="mb-3 p-2 rounded-lg bg-purple-100 border-l-4 border-purple-500 text-purple-700 text-sm animate-fadeIn">
          {message}
        </div>
      )}
      
      <div className="w-full mt-2">
        <h2 className="text-base font-semibold text-gray-700 mb-2">Active Runners</h2>
        
        {activeRunners.length === 0 ? (
          <div className="py-4 text-center text-gray-500 italic text-sm bg-gray-50 rounded-lg shadow-inner">
            No active runners at the moment
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeRunners.map(runner => (
              <div key={runner.id} className="flex justify-between items-center p-2 bg-purple-50 rounded-lg shadow-sm transition-all hover:shadow-md border-l-4 border-purple-400">
                <div className="text-left">
                  <h3 className="font-semibold text-purple-700">{runner.name}</h3>
                  <p className="text-gray-600 text-xs">Started: {formatTimestamp(runner.startTime)}</p>
                </div>
                <button 
                  type="button" 
                  className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-xs font-semibold shadow-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => handleStopRunner(runner.id, runner.name)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Stopping...' : 'Stop'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Persistent footer showing last ended runner with undo button */}
      {lastEndedRunner && (
        <div className="fixed bottom-0 left-0 right-0 bg-purple-700 text-white py-2 px-4 shadow-lg z-10">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div>
                <span className="font-semibold">Last Ended:</span> {lastEndedRunner.name}
              </div>
              <button
                type="button"
                className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                onClick={handleUndoLastEnded}
                disabled={isUndoing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                {isUndoing ? 'Undoing...' : 'Undo'}
              </button>
            </div>
            <div className="text-sm text-purple-200">
              {lastEndedRunner.endTime}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EndPoint;
