import { useState, useEffect } from 'react';
import { getAllRunners, calculateDuration, deleteRunner } from '../utils/firebaseUtils';
import type { Runner } from '../models/dataStructures';

interface BibNumberWithId extends Runner {
  id: string;
  duration: number | null;
}

function Results() {
  const [bibNumbers, setBibNumbers] = useState<BibNumberWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    bibId: string | null;
    bibNumber: string | null;
  }>({
    isOpen: false,
    bibId: null,
    bibNumber: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to fetch all bib numbers
  const fetchBibNumbers = async () => {
    setIsLoading(true);
      try {
        const bibData = await getAllRunners();
        
        // Convert the object to an array with IDs and calculate durations
        const bibArray = Object.entries(bibData).map(([id, bib]) => {
          const startTimeValue = typeof bib.startTime === 'object' && bib.startTime !== null 
            ? (bib.startTime as any).timestamp || 0 
            : Number(bib.startTime);
            
          const endTimeValue = typeof bib.endtime === 'object' && bib.endtime !== null 
            ? (bib.endtime as any).timestamp || null 
            : bib.endtime !== null ? Number(bib.endtime) : null;
          
          return {
            ...bib,
            id,
            duration: calculateDuration(startTimeValue, endTimeValue)
          };
        });
        
        // Sort by duration (finished runners first, then by fastest time)
        const sortedBibs = bibArray.sort((a, b) => {
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
        
        setBibNumbers(sortedBibs);
      } catch (err) {
        console.error('Error fetching bib numbers:', err);
        setError('Failed to load bib numbers. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
  // Set up polling to refresh the bib numbers list
  useEffect(() => {
    // Load bib numbers immediately
    fetchBibNumbers();
    
    // Set up interval to refresh every 3 seconds
    const interval = setInterval(() => {
      fetchBibNumbers();
    }, 3000);
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Handle delete button click
  const handleDeleteClick = (bibId: string, bibNumber: string) => {
    setDeleteConfirmation({
      isOpen: true,
      bibId,
      bibNumber
    });
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.bibId) return;
    
    setIsDeleting(true);
    
    try {
      const success = await deleteRunner(deleteConfirmation.bibId);
      if (success) {
        // Refresh the bib numbers list
        await fetchBibNumbers();
      } else {
        setError('Failed to delete bib number. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting bib number:', err);
      setError('Failed to delete bib number. Please try again.');
    } finally {
      setIsDeleting(false);
      // Close the confirmation dialog
      setDeleteConfirmation({
        isOpen: false,
        bibId: null,
        bibNumber: null
      });
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      bibId: null,
      bibNumber: null
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

  // Export results to CSV
  const exportToCSV = () => {
    // Create CSV header
    const csvHeader = ['Bib #', 'Start Time', 'End Time', 'Duration'].join(',');
    
    // Create CSV rows
    const csvRows = bibNumbers.map(bib => {
      const startTime = formatTimestamp(bib.startTime);
      const endTime = formatTimestamp(bib.endtime);
      const duration = formatDuration(bib.duration);
      
      return [
        // Escape quotes in the name to prevent CSV issues
        `"${bib.name.replace(/"/g, '""')}"`,
        `"${startTime}"`,
        `"${endTime}"`,
        `"${duration}"`
      ].join(',');
    });
    
    // Combine header and rows
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', `bib-results-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    // Add link to document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-3 bg-white rounded-lg shadow-sm">
      <h1 className="text-center text-purple-700 text-lg font-bold mb-2 pb-1 relative">
        Results
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-purple-500 rounded"></span>
      </h1>
      
      <div className="flex justify-center gap-3 mb-2">
        <button 
          type="button" 
          className="bg-purple-700 hover:bg-purple-800 text-white py-1.5 px-4 rounded text-xs font-semibold shadow-sm transition-all"
          onClick={() => {
            // This will be handled by the parent App component
            // which will switch to the Start tab
            const tabButton = document.querySelector('button:first-child') as HTMLButtonElement;
            if (tabButton) tabButton.click();
          }}
        >
          Register New Bib
        </button>
        
        {bibNumbers.length > 0 && (
          <button 
            type="button" 
            className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-4 rounded text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
            onClick={exportToCSV}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export to CSV
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-2 p-1.5 rounded bg-red-100 border-l-4 border-red-500 text-red-700 text-xs animate-fadeIn">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="py-6 text-center text-gray-500 italic bg-gray-50 rounded shadow-inner text-xs">
          Loading results...
        </div>
      ) : (
        <>
          {bibNumbers.length === 0 ? (
            <div className="py-6 text-center text-gray-500 italic bg-gray-50 rounded shadow-inner text-xs">
              No bib numbers found. Register a new bib to see results.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-2 font-semibold text-gray-600 border-b text-xs">Bib #</th>
                    <th className="px-2 py-2 font-semibold text-gray-600 border-b text-xs">Start Time</th>
                    <th className="px-2 py-2 font-semibold text-gray-600 border-b text-xs">End Time</th>
                    <th className="px-2 py-2 font-semibold text-gray-600 border-b text-xs">Duration</th>
                    <th className="px-2 py-2 font-semibold text-gray-600 border-b text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bibNumbers.map(bib => (
                    <tr 
                      key={bib.id} 
                      className={`border-b hover:bg-gray-50 ${
                        bib.duration === null 
                          ? 'bg-purple-50 relative before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-purple-400' 
                          : ''
                      }`}
                    >
                      <td className="px-2 py-1.5 text-gray-800 text-xs">{bib.name}</td>
                      <td className="px-2 py-1.5 text-gray-600 text-xs">{formatTimestamp(bib.startTime)}</td>
                      <td className="px-2 py-1.5 text-gray-600 text-xs">{formatTimestamp(bib.endtime)}</td>
                      <td className={`px-2 py-1.5 font-medium text-xs ${bib.duration === null ? 'text-purple-600' : 'text-gray-800'}`}>
                        {formatDuration(bib.duration)}
                      </td>
                      <td className="px-2 py-1.5">
                        <button 
                          type="button" 
                          className="bg-red-500 hover:bg-red-600 text-white py-0.5 px-2 rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={() => handleDeleteClick(bib.id, bib.name)}
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
          
          {/* Buttons moved to the top of the page */}
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg p-4 max-w-md w-11/12 shadow-md animate-scaleIn">
            <h3 className="text-lg font-bold text-red-600 mb-2">Confirm Delete</h3>
            <p className="text-gray-700 text-sm mb-1">
              Are you sure you want to delete bib #{deleteConfirmation.bibNumber}?
            </p>
            <p className="text-gray-600 text-xs mb-3">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded text-xs font-medium transition-all"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-xs font-medium transition-all disabled:opacity-70"
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
