import { useState, useEffect } from 'react';
import { getAllRunners, calculateDuration, deleteRunner } from '../utils/firebaseUtils';
import type { Runner } from '../models/dataStructures';

interface RunnerWithId extends Runner {
  id: string;
  duration: number | null;
}

function Results() {
  const [runners, setRunners] = useState<RunnerWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    runnerId: string | null;
    runnerName: string | null;
  }>({
    isOpen: false,
    runnerId: null,
    runnerName: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to fetch all runners
  const fetchRunners = async () => {
    setIsLoading(true);
      try {
        const runnersData = await getAllRunners();
        
        // Convert the object to an array with IDs and calculate durations
        const runnersArray = Object.entries(runnersData).map(([id, runner]) => {
          const startTimeValue = typeof runner.startTime === 'object' && runner.startTime !== null 
            ? (runner.startTime as any).timestamp || 0 
            : Number(runner.startTime);
            
          const endTimeValue = typeof runner.endtime === 'object' && runner.endtime !== null 
            ? (runner.endtime as any).timestamp || null 
            : runner.endtime !== null ? Number(runner.endtime) : null;
          
          return {
            ...runner,
            id,
            duration: calculateDuration(startTimeValue, endTimeValue)
          };
        });
        
        // Sort by duration (finished runners first, then by fastest time)
        const sortedRunners = runnersArray.sort((a, b) => {
          // If both have durations, sort by duration (fastest first)
          if (a.duration !== null && b.duration !== null) {
            return a.duration - b.duration;
          }
          
          // If only one has a duration, put the one with a duration first
          if (a.duration !== null) return -1;
          if (b.duration !== null) return 1;
          
          // If neither has a duration, sort by start time (most recent first)
          const aStartTime = typeof a.startTime === 'object' ? (a.startTime as any).timestamp : Number(a.startTime);
          const bStartTime = typeof b.startTime === 'object' ? (b.startTime as any).timestamp : Number(b.startTime);
          return bStartTime - aStartTime;
        });
        
        setRunners(sortedRunners);
      } catch (err) {
        console.error('Error fetching runners:', err);
        setError('Failed to load runners. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
  // Set up polling to refresh the runners list
  useEffect(() => {
    // Load runners immediately
    fetchRunners();
    
    // Set up interval to refresh every 3 seconds
    const interval = setInterval(() => {
      fetchRunners();
    }, 3000);
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Handle delete button click
  const handleDeleteClick = (runnerId: string, runnerName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      runnerId,
      runnerName
    });
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.runnerId) return;
    
    setIsDeleting(true);
    
    try {
      const success = await deleteRunner(deleteConfirmation.runnerId);
      if (success) {
        // Refresh the runners list
        await fetchRunners();
      } else {
        setError('Failed to delete runner. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting runner:', err);
      setError('Failed to delete runner. Please try again.');
    } finally {
      setIsDeleting(false);
      // Close the confirmation dialog
      setDeleteConfirmation({
        isOpen: false,
        runnerId: null,
        runnerName: null
      });
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      runnerId: null,
      runnerName: null
    });
  };

  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp: number | object | null): string => {
    if (!timestamp) return 'N/A';
    
    const timeValue = typeof timestamp === 'object' 
      ? (timestamp as any).timestamp || 0 
      : Number(timestamp);
      
    return new Date(timeValue).toLocaleString();
  };

  // Format duration in seconds to readable format
  const formatDuration = (duration: number | null): string => {
    if (duration === null) return 'In progress';
    
    // Format as minutes:seconds.milliseconds
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const milliseconds = Math.floor((duration % 1) * 100);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container results-container">
      <h1>Results</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {isLoading ? (
        <div className="loading">Loading results...</div>
      ) : (
        <>
          {runners.length === 0 ? (
            <div className="no-results">No runners found. Start a new runner to see results.</div>
          ) : (
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runners.map(runner => (
                    <tr key={runner.id} className={runner.duration === null ? 'in-progress' : ''}>
                      <td>{runner.name}</td>
                      <td>{formatTimestamp(runner.startTime)}</td>
                      <td>{formatTimestamp(runner.endtime)}</td>
                      <td>{formatDuration(runner.duration)}</td>
                      <td>
                        <button 
                          type="button" 
                          className="delete-button"
                          onClick={() => handleDeleteClick(runner.id, runner.name)}
                          disabled={isDeleting}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="button-group">
            <button 
              type="button" 
              className="start-button"
              onClick={() => {
                // This will be handled by the parent App component
                // which will switch to the Start tab
                const tabButton = document.querySelector('.tab:first-child') as HTMLButtonElement;
                if (tabButton) tabButton.click();
              }}
            >
              Start New Runner
            </button>
          </div>
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete runner "{deleteConfirmation.runnerName}"?</p>
            <p>This action cannot be undone.</p>
            <div className="confirmation-buttons">
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="delete-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default Results;
