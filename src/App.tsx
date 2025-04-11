import { useState } from 'react';
import './App.css';
import StartPoint from './pages/StartPoint';
import EndPoint from './pages/EndPoint';
import Results from './pages/Results';

function App() {
  const [activeTab, setActiveTab] = useState<'start' | 'end' | 'results'>('start');

  return (
    <div className="app-container">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'start' ? 'active' : ''}`}
          onClick={() => setActiveTab('start')}
        >
          Start Point
        </button>
        <button 
          className={`tab ${activeTab === 'end' ? 'active' : ''}`}
          onClick={() => setActiveTab('end')}
        >
          End Point
        </button>
        <button 
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'start' && <StartPoint />}
        {activeTab === 'end' && <EndPoint />}
        {activeTab === 'results' && <Results />}
      </div>
    </div>
  );
}

export default App;
