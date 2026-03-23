import { useEffect, useState } from 'react';
import { getProjects, voteProject } from '../services/projectService.js';
import { getDuels, createDuel, getDuelHistory } from '../services/duelService.js';
import { Link, useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Search, Filter, Plus, Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const [projects, setProjects] = useState([]);
  const [duels, setDuels] = useState([]);
  const [duelHistory, setDuelHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingDuel, setIsCreatingDuel] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("hot"); // hot, new, top

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProjects(searchTerm, filter);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filter]);

  // Real-time WebSockets logic for Dashboard Feedback
  useEffect(() => {
    if (!socket) return;

    const handleProjectVoted = ({ projectId, upvotes, downvotes }) => {
      setProjects(currentProjects => 
        currentProjects.map(p => 
          p._id === projectId 
            ? { ...p, upvotes, downvotes } 
            : p
        )
      );
    };

    socket.on('project_voted', handleProjectVoted);

    return () => {
      socket.off('project_voted', handleProjectVoted);
    };
  }, [socket]);

  const fetchProjects = async (search, filterType) => {
    try {
      const promises = [
         getProjects({ search, sortBy: filterType }),
         getDuels()
      ];
      if (user) {
         promises.push(getDuelHistory());
      }
      
      const results = await Promise.all(promises);
      setProjects(results[0]);
      setDuels(results[1]);
      if (user && results[2]) {
         setDuelHistory(results[2]);
      }
    } catch (error) {
      toast.error('Failed to load debates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDuel = async () => {
    if (!user) {
      toast.error('You must be logged in to duel');
      navigate('/login');
      return;
    }
    const topic = window.prompt("What do you want to debate? (e.g. 'React is better than Angular')");
    if (!topic || !topic.trim()) return;

    try {
      setIsCreatingDuel(true);
      const newDuel = await createDuel(topic);
      navigate(`/duel/${newDuel._id}`);
    } catch (err) {
      toast.error('Failed to create duel match');
    } finally {
      setIsCreatingDuel(false);
    }
  };

  const handleVote = async (projectId, currentUpvotes = [], currentDownvotes = []) => {
    if (!user) {
      toast.error('You must be logged in to vote');
      navigate('/login');
      return;
    }

    const hasUpvoted = currentUpvotes.includes(user?._id || user?.id);
    const voteType = hasUpvoted ? 'remove' : 'upvote';

    setProjects(currentProjects => 
      currentProjects.map(p => {
        if (p._id !== projectId) return p;
        let newUpvotes = [...(p.upvotes || [])];
        let newDownvotes = [...(p.downvotes || [])];

        if (voteType === 'upvote') {
          newUpvotes.push(user?._id || user?.id);
          newDownvotes = newDownvotes.filter(id => id !== (user?._id || user?.id));
        } else if (voteType === 'remove') {
          newUpvotes = newUpvotes.filter(id => id !== (user?._id || user?.id));
        }

        return { ...p, upvotes: newUpvotes, downvotes: newDownvotes };
      })
    );

    try {
      await voteProject(projectId, voteType);
      // Removed fetchProjects() since WebSockets handles the real-time vote distribution securely!
    } catch (error) {
      toast.error('Failed to register vote. Reverting...');
      fetchProjects(); 
    }
  };

  const handleDownvote = async (projectId, currentUpvotes = [], currentDownvotes = []) => {
    if (!user) {
      toast.error('You must be logged in to vote');
      navigate('/login');
      return;
    }

    const hasDownvoted = currentDownvotes.includes(user?._id || user?.id);
    const voteType = hasDownvoted ? 'remove' : 'downvote';

    setProjects(currentProjects => 
      currentProjects.map(p => {
        if (p._id !== projectId) return p;
        let newUpvotes = [...(p.upvotes || [])];
        let newDownvotes = [...(p.downvotes || [])];

        if (voteType === 'downvote') {
          newDownvotes.push(user?._id || user?.id);
          newUpvotes = newUpvotes.filter(id => id !== (user?._id || user?.id));
        } else if (voteType === 'remove') {
          newDownvotes = newDownvotes.filter(id => id !== (user?._id || user?.id));
        }

        return { ...p, upvotes: newUpvotes, downvotes: newDownvotes };
      })
    );

    try {
      await voteProject(projectId, voteType);
      // Removed fetchProjects() since WebSockets handles the real-time vote distribution securely!
    } catch (error) {
      toast.error('Failed to register vote. Reverting...');
      fetchProjects(); 
    }
  };

  // Client-side filtering logic (simulated until backend supports query strings)
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (filter === 'top') {
      const aScore = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
      const bScore = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
      return bScore - aScore;
    }
    // Default newest (simulated)
    return 0; 
  });

  if (loading) return (
    <div className="min-h-screen bg-[#0c111c] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium tracking-wide">Connecting to EchoChamber...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0c111c] text-white overflow-hidden relative pb-20">
      
      {/* Premium Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Live Discussions
            </h1>
            <p className="text-gray-400 font-medium text-lg">Join the debate. Vote on ideas. Shape the future.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleCreateDuel}
              disabled={isCreatingDuel}
              className="group flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-black transition-all transform hover:-translate-y-0.5 shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50"
            >
              <Swords size={20} className="transition-transform group-hover:scale-110" />
              <span>1v1 Duel Match</span>
            </button>
            <Link 
              to="/leaderboard" 
              className="group flex items-center gap-2 bg-[#1e293b] hover:bg-gray-800 border border-gray-700 text-white px-5 py-3 rounded-xl font-bold hover:border-purple-500 transition-all transform hover:-translate-y-0.5"
            >
              <span className="text-xl">🏆</span>
              <span className="group-hover:text-purple-400 transition-colors">Leaderboard</span>
            </Link>
            {user ? (
              <Link 
                to="/create-project" 
                className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-0.5"
              >
                <Plus size={20} className="transition-transform group-hover:rotate-90" />
                <span>Launch Debate</span>
              </Link>
            ) : (
              <button 
                onClick={() => {
                  toast.error('You must be logged in to launch a debate');
                  navigate('/login');
                }}
                className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-0.5"
              >
                <Plus size={20} className="transition-transform group-hover:rotate-90" />
                <span>Launch Debate</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 p-4 rounded-2xl mb-10 flex flex-col md:flex-row gap-4 shadow-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search active debates..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e293b] text-white placeholder-gray-500 pl-12 pr-4 py-3 rounded-xl border-2 border-transparent focus:border-blue-500/50 focus:bg-[#1e293b] outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="appearance-none bg-[#1e293b] text-white pl-4 pr-10 py-3 rounded-xl border-2 border-transparent focus:border-blue-500/50 outline-none cursor-pointer transition-all disabled:opacity-50"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="hot">🔥 Trending</option>
              <option value="new">⏰ Newest</option>
              <option value="top">⭐ Top Rated</option>
            </select>
            <div className="bg-[#1e293b] flex items-center justify-center px-4 rounded-xl border border-gray-800 text-gray-400">
              <Filter size={18} />
            </div>
          </div>
        </div>

        {/* Active Duels Banner (If any) */}
        {duels.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <span className="text-red-500">⚔️</span> Live Dueling Arena
            </h2>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x">
               {duels.map(duel => (
                 <Link to={`/duel/${duel._id}`} key={duel._id} className="min-w-[300px] shrink-0 bg-gradient-to-br from-red-950/40 to-[#111827] border border-red-900/50 p-5 rounded-xl hover:border-red-500/50 transition-colors snap-start flex flex-col group relative overflow-hidden">
                    {/* Background pulse effect for active */}
                    {duel.status === 'active' && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/20 rounded-full blur-xl pointer-events-none animate-pulse"></div>}
                    
                    <div className="flex justify-between items-center mb-3">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border 
                          ${duel.status === 'waiting' ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 
                            duel.status === 'active' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-orange-500/10 text-orange-500 border-orange-500/30'}
                       `}>
                          {duel.status === 'waiting' ? 'Open Challenge' : duel.status}
                       </span>
                    </div>
                    <h3 className="font-bold text-lg mb-4 text-white group-hover:text-red-400 line-clamp-2">{duel.topic}</h3>
                    
                    <div className="mt-auto flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                       <div className="flex flex-col text-center w-[40%]">
                          <span className="text-xs text-red-400 font-bold truncate">{duel.challenger?.name?.split(' ')[0] || 'Unknown'}</span>
                       </div>
                       <span className="text-gray-600 font-black italic text-sm">VS</span>
                       <div className="flex flex-col text-center w-[40%]">
                          {duel.defender ? (
                            <span className="text-xs text-blue-400 font-bold truncate">{duel.defender?.name?.split(' ')[0] || 'Unknown'}</span>
                          ) : (
                            <span className="text-xs text-gray-500 font-bold italic truncate">Waiting...</span>
                          )}
                       </div>
                    </div>
                 </Link>
               ))}
            </div>
          </div>
        )}

        {/* Duel History Banner (If any) */}
        {user && duelHistory.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <span className="text-purple-500">📜</span> My Duel History
            </h2>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x">
               {duelHistory.map(duel => {
                 const isChallenger = duel.challenger._id === user?._id || duel.challenger._id === user?.id;
                 const opponent = isChallenger ? duel.defender : duel.challenger;
                 let outcome = 'DRAW';
                 let borderColor = 'border-gray-600/50';
                 let textColor = 'text-gray-400';
                 let bgGradient = 'from-gray-900/40';
                 
                 if (duel.winner) {
                    if (duel.winner === user?._id || duel.winner === user?.id) {
                       outcome = 'VICTORY';
                       borderColor = 'border-green-500/50';
                       textColor = 'text-green-400';
                       bgGradient = 'from-green-950/40';
                    } else {
                       outcome = 'DEFEAT';
                       borderColor = 'border-red-500/50';
                       textColor = 'text-red-400';
                       bgGradient = 'from-red-950/40';
                    }
                 }

                 return (
                 <div key={duel._id} className={`min-w-[300px] shrink-0 bg-gradient-to-br ${bgGradient} to-[#111827] border ${borderColor} p-5 rounded-xl transition-colors snap-start flex flex-col group relative overflow-hidden`}>
                    <div className="flex justify-between items-center mb-3">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${borderColor} ${textColor} bg-[#111827]`}>
                          {outcome}
                       </span>
                       <span className="text-xs text-gray-500 font-bold">{new Date(duel.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-4 text-white line-clamp-2">{duel.topic}</h3>
                    
                    <div className="mt-auto flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                       <span className="text-xs text-gray-400 font-bold">vs {opponent?.name || 'Unknown'}</span>
                       <span className="text-xs text-gray-500 font-bold">
                          {isChallenger ? duel.challengerPoints?.length || 0 : duel.defenderPoints?.length || 0} pts fired
                       </span>
                    </div>
                 </div>
                 );
               })}
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const upvotes = project.upvotes || [];
            const downvotes = project.downvotes || [];
            const score = upvotes.length - downvotes.length;
            const hasUpvoted = upvotes.includes(user?._id || user?.id);
            const hasDownvoted = downvotes.includes(user?._id || user?.id);

            return (
              <div key={project._id} className="group relative bg-[#111827]/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] hover:-translate-y-1 flex flex-col h-full">
                
                {/* Status Badge */}
                <div className="absolute top-6 right-6 flex gap-2">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-500/20">
                    Active
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pr-20">
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>
                </div>
                
                {/* Footer Section (Author & Vote & Action) */}
                <div className="mt-auto pt-5 border-t border-gray-800/60 flex items-center justify-between">
                  
                  {/* Premium Vote Buttons */}
                  <div className="flex items-center gap-1 bg-[#0f172a] rounded-lg p-1 border border-gray-800/80">
                    <button 
                      onClick={() => handleVote(project._id, upvotes, downvotes)}
                      className={`p-2 rounded-md transition-all duration-200 ${hasUpvoted ? 'bg-blue-500/20 text-blue-400 shadow-inner' : 'text-gray-500 hover:bg-gray-800 hover:text-blue-400'}`}
                    >
                      <ThumbsUp size={16} fill={hasUpvoted ? "currentColor" : "none"} strokeWidth={hasUpvoted ? 2.5 : 2} />
                    </button>
                    <span className={`w-8 text-center font-bold text-sm ${score > 0 ? 'text-blue-400' : score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {score}
                    </span>
                    <button 
                      onClick={() => handleDownvote(project._id, upvotes, downvotes)}
                      className={`p-2 rounded-md transition-all duration-200 ${hasDownvoted ? 'bg-red-500/20 text-red-500 shadow-inner' : 'text-gray-500 hover:bg-gray-800 hover:text-red-400'}`}
                    >
                      <ThumbsDown size={16} fill={hasDownvoted ? "currentColor" : "none"} strokeWidth={hasDownvoted ? 2.5 : 2} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      By {project.creator?.name?.split(' ')[0] || 'Anon'}
                      {project.creator?.reputationScore !== undefined && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold" title="Total Reputation Points">
                          ⭐ {project.creator.reputationScore}
                        </span>
                      )}
                    </span>
                    <Link 
                      to={`/project/${project._id}`} 
                      className="flex items-center gap-1 text-sm font-bold text-white bg-gray-800 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors border border-gray-700 hover:border-transparent"
                    >
                      Discuss &rarr;
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
        
        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-20 bg-[#111827]/50 rounded-2xl border border-gray-800 border-dashed">
            <Search className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-300 mb-2">No debates found</h3>
            <p className="text-gray-500">Try adjusting your search filters or start a new debate.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;