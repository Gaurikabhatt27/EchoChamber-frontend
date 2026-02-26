import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-blue-400">
          <MessageSquare size={28} />
          <span>EchoChamber</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-gray-300 hover:text-white transition">Dashboard</Link>
          <Link to="/create-project" className="text-gray-300 hover:text-white transition">New Debate</Link>
          
          <div className="flex items-center gap-4 border-l border-gray-600 pl-6">
            <span className="text-sm text-gray-400">Hi, <span className="text-blue-400 font-medium">{user.name}</span></span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition text-sm font-semibold"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;