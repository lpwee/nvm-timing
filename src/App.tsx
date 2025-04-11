import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import StartPoint from './pages/StartPoint';
import EndPoint from './pages/EndPoint';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/start-point" element={<StartPoint />} />
        <Route path="/end-point" element={<EndPoint />} />
        <Route path="/results" element={<Results />} />
        <Route path="/" element={<Navigate to="/start-point" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
