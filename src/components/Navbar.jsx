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

  return (
    <nav className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-blue-400">
          <MessageSquare size={28} />
          <span>EchoChamber</span>
        </Link>

        {user ? (
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
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-300 hover:text-white font-medium transition">Login</Link>
            <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;