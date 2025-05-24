import { useState } from 'react';
import './App.css';
import StartPoint from './pages/StartPoint';
import EndPoint from './pages/EndPoint';
import Results from './pages/Results';

function App() {
  const [activeTab, setActiveTab] = useState<'start' | 'end' | 'results'>('start');

  return (
    <div className="flex flex-col w-full shadow-lg rounded-xl overflow-hidden bg-gray-100">
      <div className="flex justify-center border-b border-gray-200 bg-white py-2 sticky top-0 z-10">
        <button 
          className={`px-4 py-3 mx-1 font-semibold text-base transition-all border-b-3 ${
            activeTab === 'start' 
              ? 'text-purple-600 border-b-3 border-purple-500 bg-purple-50' 
              : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50 border-transparent'
          }`}
          onClick={() => setActiveTab('start')}
        >
          Start Point
        </button>
        <button 
          className={`px-4 py-3 mx-1 font-semibold text-base transition-all border-b-3 ${
            activeTab === 'end' 
              ? 'text-purple-600 border-b-3 border-purple-500 bg-purple-50' 
              : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50 border-transparent'
          }`}
          onClick={() => setActiveTab('end')}
        >
          End Point
        </button>
        <button 
          className={`px-4 py-3 mx-1 font-semibold text-base transition-all border-b-3 ${
            activeTab === 'results' 
              ? 'text-purple-600 border-b-3 border-purple-500 bg-purple-50' 
              : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50 border-transparent'
          }`}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
      </div>
      
      <div className="w-full p-4 md:p-6">
        {activeTab === 'start' && <StartPoint />}
        {activeTab === 'end' && <EndPoint />}
        {activeTab === 'results' && <Results />}
      </div>
    </div>
  );
}

export default App;
