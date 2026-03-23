import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import ProjectDetails from './pages/ProjectDetails';
import Leaderboard from './pages/Leaderboard';
import Navbar from './components/Navbar';
import DuelArena from './pages/DuelArena';

function App() {
    return (
    <Router>
      <Toaster position="top-center" />
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route 
          path="/dashboard" 
          element={<Dashboard />} 
        />

        <Route 
          path="/create-project" 
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/project/:id" 
          element={<ProjectDetails />} 
        />

        <Route 
          path="/leaderboard" 
          element={<Leaderboard />} 
        />

        <Route 
          path="/duel/:id" 
          element={<DuelArena />} 
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;