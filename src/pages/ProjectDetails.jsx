import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getArguments, postArgument } from '../services/taskService.js';
import { fetchComments, postComment } from '../services/projectService.js';
import CommentThread from '../components/CommentThread.jsx';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [newArg, setNewArg] = useState({ content: '', stance: 'pro' });
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Fix: Wrapping in useCallback ensures it doesn't get recreated on every render
  const fetchData = useCallback(async () => {
    try {
      const [argsData, commentsData] = await Promise.all([
        getArguments(id),
        fetchComments(id)
      ]);
      console.log('API Results:', { argsData, commentsData });
      
      setTasks(Array.isArray(argsData) ? argsData : (argsData?.data || []));
      setComments(Array.isArray(commentsData) ? commentsData : (commentsData?.data || []));
    } catch (err) {
      console.error('FetchData Exception:', err);
      toast.error('Failed to load project details: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitArg = async (e) => {
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

  const handlePostTopLevelComment = async () => {
    if (!newCommentText.trim()) return;
    try {
      await postComment(id, newCommentText);
      toast.success('Comment posted!');
      setNewCommentText('');
      fetchData(); // Refresh all comments
    } catch (err) {
      toast.error('Error posting comment');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0c111c] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium">Loading Debate Arena...</p>
      </div>
    </div>
  );

  // Extract Top-Level comments (those without a parent)
  const topLevelComments = comments.filter(c => !c.parentComment);

  return (
    <div className="min-h-screen bg-[#0c111c] text-white p-6 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Main Debate Area */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-xl">
          <h1 className="text-3xl font-extrabold mb-6 text-white line-clamp-2 leading-tight">Debate Arena</h1>
          <form onSubmit={handleSubmitArg} className="flex flex-col gap-4">
            <textarea
              className="w-full p-4 bg-[#1e293b] text-white rounded-xl border border-gray-700 outline-none focus:border-blue-500 focus:bg-[#1e293b]/80 transition-all resize-none h-32"
              placeholder="State your argument clearly..."
              value={newArg.content}
              onChange={(e) => setNewArg({ ...newArg, content: e.target.value })}
              required
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2 p-1 bg-gray-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setNewArg({ ...newArg, stance: 'pro' })}
                  className={`px-6 py-2 rounded-md font-bold text-sm transition-colors ${newArg.stance === 'pro' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  PRO
                </button>
                <button
                  type="button"
                  onClick={() => setNewArg({ ...newArg, stance: 'con' })}
                  className={`px-6 py-2 rounded-md font-bold text-sm transition-colors ${newArg.stance === 'con' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  CON
                </button>
              </div>
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 w-full sm:w-auto">
                Post Argument
              </button>
            </div>
          </form>
        </div>

        {/* Arguments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-green-400 border-b-2 border-green-500/30 pb-3 flex items-center gap-2">
              <span className="bg-green-500/20 p-2 rounded-lg">🛡️</span> PRO Arguments
            </h2>
            {tasks.filter(t => t.stance === 'pro').map(task => (
              <div key={task._id} className="bg-[#111827]/60 p-5 rounded-xl border border-green-900/40 hover:border-green-500/50 transition-colors">
                <p className="text-gray-200 text-lg leading-relaxed">{task.content}</p>
                <p className="text-sm text-green-500 mt-4 font-bold">— {task.user?.name}</p>
              </div>
            ))}
            {tasks.filter(t => t.stance === 'pro').length === 0 && (
              <p className="text-gray-600 italic">No points raised for PRO yet.</p>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-red-400 border-b-2 border-red-500/30 pb-3 flex items-center gap-2">
              <span className="bg-red-500/20 p-2 rounded-lg">⚔️</span> CON Arguments
            </h2>
            {tasks.filter(t => t.stance === 'con').map(task => (
              <div key={task._id} className="bg-[#111827]/60 p-5 rounded-xl border border-red-900/40 hover:border-red-500/50 transition-colors">
                <p className="text-gray-200 text-lg leading-relaxed">{task.content}</p>
                <p className="text-sm text-red-500 mt-4 font-bold">— {task.user?.name}</p>
              </div>
            ))}
            {tasks.filter(t => t.stance === 'con').length === 0 && (
              <p className="text-gray-600 italic">No points raised for CON yet.</p>
            )}
          </div>
        </div>

        {/* General Discussion / Nested Comments Section */}
        <div className="mt-16 pt-12 border-t border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6">General Discussion</h2>
          
          {/* Top Level Comment Input */}
          <div className="flex gap-4 mb-8">
            <img src={`https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff`} className="w-10 h-10 rounded-full" alt="avatar" />
            <div className="flex-1">
              <textarea
                className="w-full bg-[#1e293b] border border-gray-700 text-white rounded-xl p-4 min-h-[100px] outline-none focus:border-blue-500 transition-colors"
                placeholder="What are your thoughts on this debate...?"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={handlePostTopLevelComment}
                  disabled={!newCommentText.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>

          {/* Render Comment Threads */}
          <div className="space-y-4 ml-4">
            {topLevelComments.map(comment => (
              <CommentThread 
                key={comment._id}
                comment={comment}
                allComments={comments}
                projectId={id}
                onReplyPosted={fetchData} 
              />
            ))}
            {comments.length === 0 && (
              <div className="text-center py-10 bg-gray-800/20 rounded-xl border border-gray-800 border-dashed">
                <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectDetails;