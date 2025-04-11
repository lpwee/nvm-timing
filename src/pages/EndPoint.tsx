import { useState, useEffect } from 'react';
import { updateRunnerEndTime, getAllRunners } from '../utils/firebaseUtils';
import type { Runner } from '../models/dataStructures';

interface RunnerWithId extends Runner {
  id: string;
}

function EndPoint() {
  const [activeRunners, setActiveRunners] = useState<RunnerWithId[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

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
        setMessage(`Runner "${runnerName}" finished!`);
        
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

  // Format timestamp to readable time
  const formatTimestamp = (timestamp: number | object): string => {
    const timeValue = typeof timestamp === 'object' 
      ? (timestamp as any).timestamp || 0 
      : Number(timestamp);
      
    return new Date(timeValue).toLocaleTimeString();
  };

  return (
    <div className="container">
      <h1>End Point</h1>
      
      {message && (
        <div className="message">
          {message}
        </div>
      )}
      
      <div className="active-runners-container">
        <h2>Active Runners</h2>
        
        {activeRunners.length === 0 ? (
          <div className="no-runners">No active runners at the moment</div>
        ) : (
          <div className="runners-list">
            {activeRunners.map(runner => (
              <div key={runner.id} className="runner-card">
                <div className="runner-details">
                  <h3>{runner.name}</h3>
                  <p>Started at: {formatTimestamp(runner.startTime)}</p>
                </div>
                <button 
                  type="button" 
                  className="stop-button"
                  onClick={() => handleStopRunner(runner.id, runner.name)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Stopping...' : 'Stop Runner'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EndPoint;
