import { useEffect, useState } from 'react';
import { getProjects } from '../services/projectService.js';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        toast.error('Failed to load debates');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <div className="text-white text-center mt-20">Loading Debates...</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-400">Live Echo Chambers</h1>
          <Link to="/create-project" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition">
            + Start New Debate
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition">
              <h3 className="text-xl font-bold mb-2">{project.title}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                  By: {project.creator?.name || 'Anonymous'}
                </span>
                <Link to={`/project/${project._id}`} className="text-blue-400 font-semibold hover:underline">
                  Join Debate →
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {projects.length === 0 && (
          <p className="text-center text-gray-500 mt-10">No active debates. Why not start one?</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;