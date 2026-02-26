import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginUser } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(formData);
      login(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Login to EchoChamber</h2>
        <input 
          type="email" placeholder="Email" required
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Password" required
          className="w-full p-3 mb-6 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition duration-200">
          Login
        </button>
        <p className="text-gray-400 mt-4 text-center">
          New here? <Link to="/register" className="text-green-400 hover:underline">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;