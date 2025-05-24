import { useState } from 'react';
import { createNewRunner } from '../utils/firebaseUtils';

function StartPoint() {
  const [runnerNames, setRunnerNames] = useState<string[]>(["", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update a specific runner name
  const updateRunnerName = (index: number, name: string) => {
    const newRunnerNames = [...runnerNames];
    newRunnerNames[index] = name;
    setRunnerNames(newRunnerNames);
  };

  // Handle submission of a single runner
  const handleStartSingleRunner = async (index: number) => {
    const runnerName = runnerNames[index].trim();
    
    if (runnerName === "") {
      setMessage("Please enter a runner name");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createNewRunner(runnerName);
      setMessage(`Runner "${runnerName}" started successfully!`);
      
      // Only clear the submitted runner's input
      const newRunnerNames = [...runnerNames];
      newRunnerNames[index] = "";
      setRunnerNames(newRunnerNames);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error starting runner:", error);
      setMessage("Failed to start runner. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle form submission to create multiple runners
  const handleStartRunners = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty runner names
    const validRunnerNames = runnerNames.filter(name => name.trim() !== "");
    
    if (validRunnerNames.length === 0) {
      setMessage("Please enter at least one runner name");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create all runners with the same timestamp
      const promises = validRunnerNames.map(name => createNewRunner(name));
      await Promise.all(promises);
      
      setMessage(`${validRunnerNames.length} runner(s) started successfully!`);
      setRunnerNames(["", "", "", "", ""]); // Clear all inputs
      setIsLoading(false);
    } catch (error) {
      console.error("Error starting runners:", error);
      setMessage("Failed to start runners. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-3 bg-white rounded-lg shadow-sm">
      <h1 className="text-center text-purple-700 text-lg font-bold mb-2 pb-1 relative">
        Start Point
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-purple-500 rounded"></span>
      </h1>
      
      {message && (
        <div className="mb-2 p-1.5 rounded bg-purple-100 border-l-4 border-purple-500 text-purple-700 text-xs animate-fadeIn">
          {message}
        </div>
      )}
      
      <form onSubmit={handleStartRunners} className="w-full mb-2">
        <div className="flex flex-col gap-1 w-full">
          {runnerNames.map((name, index) => (
            <div key={index} className="mb-1 text-left">
              <label 
                htmlFor={`runner-${index}`}
                className="block mb-1 font-semibold text-gray-700 text-xs"
              >
                Runner {index + 1}:
              </label>
              <div className="flex gap-1 w-full items-center">
                <input
                  type="text"
                  id={`runner-${index}`}
                  value={name}
                  onChange={(e) => updateRunnerName(index, e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter runner name (optional)"
                  className="w-full min-w-0 flex-1 p-1 text-xs border border-gray-200 rounded bg-gray-50 text-gray-900 shadow-sm transition-all focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-300 disabled:opacity-70 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button 
                  type="button" 
                  onClick={() => handleStartSingleRunner(index)}
                  disabled={isLoading || name.trim() === ""}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded text-xs font-semibold shadow-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                >
                  Submit
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-3 mb-1">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-purple-700 hover:bg-purple-800 text-white py-1.5 px-4 rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Starting...' : 'Start All Runners'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StartPoint;
