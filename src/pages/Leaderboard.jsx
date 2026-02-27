import { useEffect, useState } from 'react';
import { getLeaderboard } from '../services/authService';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaders(data);
      } catch (error) {
        console.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0c111c] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium tracking-wide">Loading Rankings...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0c111c] text-white overflow-hidden relative pb-20 pt-10">
      
      {/* Premium Background Glow Effects */}
      <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-full mb-6 border border-blue-500/20">
            <Trophy size={48} className="text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Hall of Fame
          </h1>
          <p className="text-gray-400 font-medium text-lg max-w-2xl mx-auto">
            The most influential minds on EchoChamber. Earn reputation points by launching debates and sharing valuable perspectives that the community upvotes.
          </p>
        </div>

        {/* Podium for Top 3 */}
        {leaders.length >= 3 && (
          <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-16 mt-8 h-64">
            {/* Rank 2 - Silver */}
            <div className="order-2 md:order-1 flex flex-col items-center flex-1 z-10">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-4 border-gray-400 shadow-[0_0_20px_rgba(156,163,175,0.4)]">
                  <span className="text-2xl font-bold text-gray-300">#2</span>
                </div>
              </div>
              <p className="font-bold text-lg text-white mb-1 line-clamp-1">{leaders[1]?.name}</p>
              <p className="text-gray-400 font-semibold mb-3 flex items-center gap-1">
                <TrendingUp size={14} className="text-blue-400" /> {leaders[1]?.reputationScore} Rep
              </p>
              <div className="w-full bg-gradient-to-t from-gray-900 to-gray-800 h-32 rounded-t-xl border border-gray-700/50 flexjustify-center pt-4">
              </div>
            </div>

            {/* Rank 1 - Gold */}
            <div className="order-1 md:order-2 flex flex-col items-center flex-1 transform -translate-y-8 z-20">
              <div className="relative mb-4">
                <div className="absolute -top-6 -right-6 text-yellow-500 animate-bounce">
                  <Medal size={32} />
                </div>
                <div className="w-20 h-20 rounded-full bg-yellow-900/40 flex items-center justify-center border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                  <span className="text-3xl font-extrabold text-yellow-400">#1</span>
                </div>
              </div>
              <p className="font-extrabold text-xl text-yellow-400 mb-1 line-clamp-1">{leaders[0]?.name}</p>
              <p className="text-yellow-600/80 font-bold mb-3 flex items-center gap-1">
                <TrendingUp size={16} className="text-yellow-500" /> {leaders[0]?.reputationScore} Rep
              </p>
              <div className="w-full bg-gradient-to-t from-yellow-900/40 to-yellow-800/20 h-40 rounded-t-xl border border-yellow-700/50">
              </div>
            </div>

            {/* Rank 3 - Bronze */}
            <div className="order-3 md:order-3 flex flex-col items-center flex-1 z-0">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-orange-950/40 flex items-center justify-center border-4 border-orange-700 shadow-[0_0_20px_rgba(194,65,12,0.4)]">
                  <span className="text-2xl font-bold text-orange-500">#3</span>
                </div>
              </div>
              <p className="font-bold text-lg text-white mb-1 line-clamp-1">{leaders[2]?.name}</p>
              <p className="text-gray-400 font-semibold mb-3 flex items-center gap-1">
                <TrendingUp size={14} className="text-blue-400" /> {leaders[2]?.reputationScore} Rep
              </p>
              <div className="w-full bg-gradient-to-t from-orange-950/30 to-orange-900/20 h-24 rounded-t-xl border border-orange-800/50 flex justify-center pt-4">
              </div>
            </div>
          </div>
        )}

        {/* List for the rest of the ranks */}
        <div className="bg-[#111827]/60 backdrop-blur-xl border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          {leaders.slice(3).map((user, index) => (
            <div 
              key={user._id} 
              className="flex items-center justify-between p-6 border-b border-gray-800/50 hover:bg-[#1e293b]/50 transition-colors group"
            >
              <div className="flex items-center gap-6">
                <div className="text-gray-500 font-bold text-2xl w-8 text-center group-hover:text-blue-400 transition-colors">
                  #{index + 4}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg group-hover:text-blue-300 transition-colors">{user.name}</h3>
                  <p className="text-gray-500 text-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#0f172a] px-4 py-2 rounded-xl border border-gray-800">
                <Award size={18} className="text-purple-400" />
                <span className="font-extrabold text-white">{user.reputationScore}</span>
                <span className="text-gray-500 text-sm font-medium">Rep</span>
              </div>
            </div>
          ))}

          {leaders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 font-medium">No rep scores found yet. Start voting!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Leaderboard;
