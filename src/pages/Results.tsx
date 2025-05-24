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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-center text-purple-700 text-2xl font-bold mb-6 pb-2 relative">
        Results
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-purple-500 rounded"></span>
      </h1>
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 border-l-4 border-red-500 text-red-700 animate-fadeIn">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="py-12 text-center text-gray-500 italic bg-gray-50 rounded-lg shadow-inner">
          Loading results...
        </div>
      ) : (
        <>
          {runners.length === 0 ? (
            <div className="py-12 text-center text-gray-500 italic bg-gray-50 rounded-lg shadow-inner">
              No runners found. Start a new runner to see results.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b">Name</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b">Start Time</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b">End Time</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b">Duration</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runners.map(runner => (
                    <tr 
                      key={runner.id} 
                      className={`border-b hover:bg-gray-50 ${
                        runner.duration === null 
                          ? 'bg-purple-50 relative before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-purple-400' 
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-800">{runner.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{formatTimestamp(runner.startTime)}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{formatTimestamp(runner.endtime)}</td>
                      <td className={`px-4 py-3 font-medium ${runner.duration === null ? 'text-purple-600' : 'text-gray-800'}`}>
                        {formatDuration(runner.duration)}
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          type="button" 
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
          
          <div className="flex justify-center mt-8 mb-4">
            <button 
              type="button" 
              className="bg-purple-700 hover:bg-purple-800 text-white py-3 px-7 rounded-lg text-base font-semibold shadow-md transition-all transform hover:-translate-y-1"
              onClick={() => {
                // This will be handled by the parent App component
                // which will switch to the Start tab
                const tabButton = document.querySelector('button:first-child') as HTMLButtonElement;
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
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-md w-11/12 shadow-xl animate-scaleIn">
            <h3 className="text-xl font-bold text-red-600 mb-4">Confirm Delete</h3>
            <p className="text-gray-700 text-base mb-2">
              Are you sure you want to delete runner "{deleteConfirmation.runnerName}"?
            </p>
            <p className="text-gray-600 text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium transition-all"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded font-medium transition-all disabled:opacity-70"
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
