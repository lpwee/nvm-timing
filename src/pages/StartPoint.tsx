import { useState } from 'react';
import { createNewRunner } from '../utils/firebaseUtils';

function StartPoint() {
  const [bibNumbers, setBibNumbers] = useState<string[]>(["", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update a specific bib number
  const updateBibNumber = (index: number, bib: string) => {
    // Convert to uppercase and remove spaces
    const formattedBib = bib.toUpperCase().replace(/\s+/g, '');
    
    const newBibNumbers = [...bibNumbers];
    newBibNumbers[index] = formattedBib;
    setBibNumbers(newBibNumbers);
  };

  // Handle registration of a single bib number
  const handleRegisterSingleBib = async (index: number) => {
    const bibNumber = bibNumbers[index].trim();
    
    if (bibNumber === "") {
      setMessage("Please enter a bib number");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createNewRunner(bibNumber);
      setMessage(`Bib #${bibNumber} registered successfully!`);
      
      // Only clear the submitted bib number input
      const newBibNumbers = [...bibNumbers];
      newBibNumbers[index] = "";
      setBibNumbers(newBibNumbers);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error registering bib number:", error);
      setMessage("Failed to register bib number. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle form submission to register multiple bib numbers
  const handleRegisterAllBibs = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty bib numbers
    const validBibNumbers = bibNumbers.filter(bib => bib.trim() !== "");
    
    if (validBibNumbers.length === 0) {
      setMessage("Please enter at least one bib number");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create all runners with the same timestamp
      const promises = validBibNumbers.map(bib => createNewRunner(bib));
      await Promise.all(promises);
      
      setMessage(`${validBibNumbers.length} bib number(s) registered successfully!`);
      setBibNumbers(["", "", "", "", ""]); // Clear all inputs
      setIsLoading(false);
    } catch (error) {
      console.error("Error registering bib numbers:", error);
      setMessage("Failed to register bib numbers. Please try again.");
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
      
      <form onSubmit={handleRegisterAllBibs} className="w-full mb-2">
        <div className="flex flex-col gap-1 w-full">
          {bibNumbers.map((bib, index) => (
            <div key={index} className="mb-1 text-left">
              <label 
                htmlFor={`bib-${index}`}
                className="block mb-1 font-semibold text-gray-700 text-xs"
              >
                Runner {index + 1}:
              </label>
              <div className="flex gap-1 w-full items-center">
                <input
                  type="text"
                  id={`bib-${index}`}
                  value={bib}
                  onChange={(e) => updateBibNumber(index, e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter Runner Bib Number"
                  className="w-full min-w-0 flex-1 p-1 text-xs border border-gray-200 rounded bg-gray-50 text-gray-900 shadow-sm transition-all focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-300 disabled:opacity-70 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button 
                  type="button" 
                  onClick={() => handleRegisterSingleBib(index)}
                  disabled={isLoading || bib.trim() === ""}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded text-xs font-semibold shadow-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                >
                  Register
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
            {isLoading ? 'Registering...' : 'Register All Bib Numbers'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StartPoint;
