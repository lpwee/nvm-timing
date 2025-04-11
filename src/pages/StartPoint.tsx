import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewRunner } from '../utils/firebaseUtils';

function StartPoint() {
  const [runnerNames, setRunnerNames] = useState<string[]>(["", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Update a specific runner name
  const updateRunnerName = (index: number, name: string) => {
    const newRunnerNames = [...runnerNames];
    newRunnerNames[index] = name;
    setRunnerNames(newRunnerNames);
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
      const runnerIds = await Promise.all(promises);
      
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
    <div className="container">
      <h1>Start Point</h1>
      
      {message && (
        <div className="message">
          {message}
        </div>
      )}
      
      <form onSubmit={handleStartRunners}>
        <div className="runners-form">
          {runnerNames.map((name, index) => (
            <div key={index} className="form-group">
              <label htmlFor={`runner-${index}`}>Runner {index + 1}:</label>
              <input
                type="text"
                id={`runner-${index}`}
                value={name}
                onChange={(e) => updateRunnerName(index, e.target.value)}
                disabled={isLoading}
                placeholder="Enter runner name (optional)"
              />
            </div>
          ))}
        </div>
        
        <div className="button-group">
          <button 
            type="submit" 
            className="start-button"
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : 'Start All Runners'}
          </button>
        </div>
      </form>
      
      <div className="navigation-links">
        <a href="/end-point">End Point</a>
        <a href="/results">Results</a>
      </div>
    </div>
  );
}

export default StartPoint;
