import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArguments, postArgument } from '../services/taskService.js';
import { fetchComments, postComment, analyzeDebate } from '../services/projectService.js';
import CommentThread from '../components/CommentThread.jsx';
import DebateAnalytics from '../components/DebateAnalytics.jsx';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const [tasks, setTasks] = useState([]);
  const [newArg, setNewArg] = useState({ content: '', stance: 'pro' });
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  
  // AI Analyzer State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  // Real-time WebSockets listeners
  useEffect(() => {
    if (!socket) return;

    // Join the specific project room
    socket.emit('join_project', id);

    // Listen for new arguments
    const handleNewArgument = (newArgument) => {
      setTasks(prev => {
        // Prevent duplicates
        if (prev.some(t => t._id === newArgument._id)) return prev;
        return [...prev, newArgument];
      });
      if (newArgument.user?._id !== user?.id) {
        toast('New argument posted!', { icon: '📣' });
      }
    };

    // Listen for new comments
    const handleNewComment = (newComment) => {
      setComments(prev => {
        // Prevent duplicates
        if (prev.some(c => c._id === newComment._id)) return prev;
        return [...prev, newComment];
      });
      if (newComment.author?._id !== user?.id) {
        toast('New comment added!', { icon: '💬' });
      }
    };

    socket.on('new_argument', handleNewArgument);
    socket.on('new_comment', handleNewComment);

    return () => {
      socket.off('new_argument', handleNewArgument);
      socket.off('new_comment', handleNewComment);
    };
  }, [socket, id, user]);

  const handleSubmitArg = async (e) => {
    e.preventDefault();
    try {
      await postArgument({ ...newArg, project: id });
      // We don't need a success toast here because we'll get one locally from the component state instantly,
      // and we removed the fetchData() call since the socket handles the list update!
      setNewArg({ ...newArg, content: '' });
    } catch (err) {
      toast.error('Error posting argument');
    }
  };

  const handlePostTopLevelComment = async () => {
    if (!newCommentText.trim()) return;
    try {
      await postComment(id, newCommentText);
      // Socket handles the update, so we just clear the input text.
      setNewCommentText('');
    } catch (err) {
      toast.error('Error posting comment');
    }
  };

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      const result = await analyzeDebate(id);
      setAnalysisResult(result.analysis);
      toast.success('Debate Analysis Complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to analyze debate.');
    } finally {
      setIsAnalyzing(false);
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
          
          {user ? (
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
          ) : (
            <div className="bg-[#1e293b]/50 border border-gray-700 p-8 rounded-xl text-center">
              <h3 className="text-xl font-bold text-white mb-2">Join the Conversation</h3>
              <p className="text-gray-400 mb-6">Log in or create an account to share your arguments and vote on points.</p>
              <Link to="/login" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25">
                Log In to Debate
              </Link>
            </div>
          )}
          
          {/* AI Analysis Button & Results */}
          <div className="mt-6 border-t border-gray-800 pt-6">
            <button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || tasks.length === 0}
              className={`w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold transition-all shadow-lg text-white
                ${tasks.length === 0 ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/25'}
              `}
            >
              {isAnalyzing ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analyzing...</>
              ) : (
                <>🤖 Analyze Debate with AI</>
              )}
            </button>
            
            {analysisResult && (
              <div className="mt-6 p-8 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl relative overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none"></div>
                
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6 flex items-center justify-center gap-3 tracking-wide">
                  <span>🤖</span> AI VERDICT <span>✨</span>
                </h3>
                
                {/* Score Cards */}
                <div className="flex justify-between items-center mb-6 px-4">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">PRO</span>
                    <span className="text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                      {analysisResult.proPercentage}%
                    </span>
                  </div>
                  
                  <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center bg-gray-800/50">
                    <span className="text-gray-500 font-bold italic">VS</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">CON</span>
                    <span className="text-4xl font-black text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">
                      {analysisResult.conPercentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-4 rounded-full bg-gray-800 flex overflow-hidden mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 relative" 
                    style={{ width: `${analysisResult.proPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                  <div 
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 relative" 
                    style={{ width: `${analysisResult.conPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10"></div>
                  </div>
                </div>

                {/* Short Reason */}
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/50 relative z-10">
                  <p className="text-gray-300 text-lg leading-relaxed text-center font-medium italic">
                    "{analysisResult.shortReason}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Debate Analytics Dashboard */}
        <DebateAnalytics tasks={tasks} comments={comments} />

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
          
          {user && (
            <div className="flex gap-4 mb-8">
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0D8ABC&color=fff`} className="w-10 h-10 rounded-full" alt="avatar" />
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
          )}

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