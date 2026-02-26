import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getArguments, postArgument } from '../services/taskService.js';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [newArg, setNewArg] = useState({ content: '', stance: 'pro' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const data = await getArguments(id);
      setTasks(data);
    } catch (err) {
      toast.error('Failed to load arguments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await postArgument({ ...newArg, project: id });
      toast.success('Argument posted!');
      setNewArg({ ...newArg, content: '' });
      fetchData();
    } catch (err) {
      toast.error('Error posting argument');
    }
  };

  if (loading) return <div className="text-white p-10">Loading debate...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700">
          <h1 className="text-3xl font-bold mb-4 text-blue-400">Join the Conversation</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              className="w-full p-3 bg-gray-700 rounded border border-gray-600 outline-none focus:border-blue-500"
              placeholder="Your perspective..."
              value={newArg.content}
              onChange={(e) => setNewArg({ ...newArg, content: e.target.value })}
              required
            />
            <div className="flex justify-between items-center">
              <select 
                className="bg-gray-700 p-2 rounded border border-gray-600"
                value={newArg.stance}
                onChange={(e) => setNewArg({ ...newArg, stance: e.target.value })}
              >
                <option value="pro">Pro</option>
                <option value="con">Con</option>
              </select>
              <button className="bg-blue-600 hover:bg-blue-700 px-8 py-2 rounded font-bold">Post</button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-green-400 border-b border-green-400 pb-2">PRO</h2>
            {tasks.filter(t => t.stance === 'pro').map(task => (
              <div key={task._id} className="bg-green-900/20 p-4 rounded border border-green-900/50">
                <p className="text-gray-200">{task.content}</p>
                <p className="text-xs text-green-500 mt-2">— {task.user?.name}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-red-400 border-b border-red-400 pb-2">CON</h2>
            {tasks.filter(t => t.stance === 'con').map(task => (
              <div key={task._id} className="bg-red-900/20 p-4 rounded border border-red-900/50">
                <p className="text-gray-200">{task.content}</p>
                <p className="text-xs text-red-500 mt-2">— {task.user?.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;