import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDuelById, joinDuel, submitDuelPoint, castDuelVote } from '../services/duelService.js';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const DuelArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  
  const [duel, setDuel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pointText, setPointText] = useState('');
  
  // Ref for auto-scrolling
  const challengerScrollRef = useRef(null);
  const defenderScrollRef = useRef(null);

  useEffect(() => {
    fetchDuel();
  }, [id]);

  useEffect(() => {
    if (!socket || !duel) return;

    socket.emit('join_duel', id);

    // Socket Event: When opponent accepts challenge
    const handleDuelStarted = (updatedDuel) => {
      setDuel(updatedDuel);
      if (updatedDuel.challenger._id === user?._id || updatedDuel.defender._id === user?._id) {
        toast.success("The Duel has started! Type fast!");
      }
    };

    // Socket Event: Server ticking the clock down
    const handleTimerTick = ({ phase, timeRemaining }) => {
      setDuel(prev => ({ ...prev, status: phase, timeRemaining }));
    };

    // Socket Event: Server moving us between Active -> Voting -> Finished
    const handlePhaseChange = ({ status, timeRemaining, winner }) => {
      setDuel(prev => ({ ...prev, status, timeRemaining: timeRemaining || 0, winner }));
      if (status === 'voting') {
        toast('Time is up! The audience is now voting.', { icon: '⏱️' });
      }
      if (status === 'finished') {
        toast.success('The Duel is over!');
      }
    };

    // Socket Event: Opponent fired a point
    const handlePointAdded = ({ side, text }) => {
      setDuel(prev => {
        const key = side === 'challenger' ? 'challengerPoints' : 'defenderPoints';
        return {
          ...prev,
          [key]: [...(prev[key] || []), { text, timestamp: new Date() }]
        };
      });
      // Auto-scroll logic attached downstream via effect
    };

    socket.on('duel_started', handleDuelStarted);
    socket.on('duel_timer_tick', handleTimerTick);
    socket.on('duel_phase_change', handlePhaseChange);
    socket.on('duel_point_added', handlePointAdded);

    return () => {
      socket.off('duel_started', handleDuelStarted);
      socket.off('duel_timer_tick', handleTimerTick);
      socket.off('duel_phase_change', handlePhaseChange);
      socket.off('duel_point_added', handlePointAdded);
    };
  }, [socket, id, duel?._id, user?._id]);

  // Auto-scroll feeds when new points arrive
  useEffect(() => {
    if (challengerScrollRef.current) challengerScrollRef.current.scrollTop = challengerScrollRef.current.scrollHeight;
    if (defenderScrollRef.current) defenderScrollRef.current.scrollTop = defenderScrollRef.current.scrollHeight;
  }, [duel?.challengerPoints, duel?.defenderPoints]);

  const fetchDuel = async () => {
    try {
      const data = await getDuelById(id);
      setDuel(data);
    } catch (error) {
      toast.error('Duel not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handeAcceptDuel = async () => {
    if (!user) {
      toast.error('Log in to accept duels');
      navigate('/login');
      return;
    }
    try {
      await joinDuel(id);
      // Socket 'duel_started' will update state
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join');
    }
  };

  const handleFirePoint = async (e) => {
    e.preventDefault();
    if (!pointText.trim() || duel.status !== 'active') return;
    try {
      await submitDuelPoint(id, pointText);
      setPointText('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit point');
    }
  };

  const handleSpectatorVote = async (side) => {
    if (!user) {
      toast.error('Log in to vote on this duel');
      return;
    }
    try {
      await castDuelVote(id, side);
      toast.success(`Vote cast for ${side === 'challenger' ? duel.challenger.name : duel.defender.name}!`);
      // Optimistic update of UI to hide buttons
      setDuel(prev => {
        const newVotes = { ...prev.votes };
        if (side === 'challenger') {
           newVotes.challengerVotes = [...(newVotes.challengerVotes || []), user._id];
        } else {
           newVotes.defenderVotes = [...(newVotes.defenderVotes || []), user._id];
        }
        return { ...prev, votes: newVotes };
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Vote failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0c111c] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium tracking-wide">Entering the Arena...</p>
      </div>
    </div>
  );

  const isParticipant = user && (user._id === duel.challenger._id || user._id === duel?.defender?._id);
  const isSpectator = user && !isParticipant;
  
  // Format MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const hasVoted = user && duel.votes && (
    (duel.votes.challengerVotes?.includes(user._id)) || 
    (duel.votes.defenderVotes?.includes(user._id))
  );

  return (
    <div className="min-h-screen bg-[#06090f] text-white flex flex-col h-screen overflow-hidden">
      
      {/* Top Banner & Timer */}
      <div className="bg-[#111827] border-b border-gray-800 p-4 shrink-0 flex items-center justify-between relative shadow-2xl z-20">
        <div>
           <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-red-500/20 mr-4">
            Live Duel
           </span>
           <span className="font-bold text-gray-300">{duel.topic}</span>
        </div>

        {/* Massive Sync Clock */}
        <div className={`absolute left-1/2 -translate-x-1/2 text-5xl font-black tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]
          ${duel.status === 'active' ? 'text-white' : duel.status === 'voting' ? 'text-orange-400' : 'text-gray-500'}
        `}>
          {duel.status === 'waiting' && 'PENDING'}
          {duel.status === 'active' && formatTime(duel.timeRemaining)}
          {duel.status === 'voting' && formatTime(duel.timeRemaining)}
          {duel.status === 'finished' && 'OVER'}
        </div>

        <div>
           {duel.status === 'voting' && <span className="text-orange-400 font-bold animate-pulse">VOTING PHASE</span>}
           {duel.status === 'finished' && <span className="text-gray-400 font-bold">MATCH FINISHED</span>}
        </div>
      </div>

      {/* 50/50 Arena Split */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Waiting Overlay */}
        {duel.status === 'waiting' && (
          <div className="absolute inset-0 z-50 bg-[#06090f]/80 backdrop-blur-md flex flex-col items-center justify-center">
            <h2 className="text-4xl font-black mb-4">Waiting for an opponent...</h2>
            {user && user._id !== duel.challenger._id ? (
              <button 
                onClick={handeAcceptDuel}
                className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-transform hover:scale-105"
              >
                Accept Challenge
              </button>
            ) : (
              <p className="text-gray-400 italic">You challenged the arena. Waiting for someone brave enough.</p>
            )}
          </div>
        )}

        {/* Finished Overlay */}
        {duel.status === 'finished' && (
          <div className="absolute inset-0 z-50 bg-[#06090f]/90 backdrop-blur-xl flex flex-col items-center justify-center">
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2">
              {duel.winner ? (duel.winner === duel.challenger._id ? duel.challenger.name : duel.defender.name) + " WINS!" : "DRAW!"}
            </h2>
            <p className="text-xl text-gray-300">The audience has spoken.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-8 px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold">Return to Dashboard</button>
          </div>
        )}

        {/* LEFT COMPARTMENT: Challenger (Red) */}
        <div className="w-1/2 flex flex-col border-r-4 border-gray-900 bg-gradient-to-b from-red-950/20 to-[#06090f]">
          <div className="p-4 border-b border-red-900/30 flex justify-between items-center bg-red-900/10">
            <h3 className="font-black text-red-500 text-xl">{duel.challenger.name}</h3>
            {duel.status === 'voting' && isSpectator && !hasVoted && (
              <button onClick={() => handleSpectatorVote('challenger')} className="bg-red-600 hover:bg-red-500 px-4 py-1.5 rounded-lg font-bold shadow-lg animate-pulse">Vote Red</button>
            )}
            {duel.status === 'finished' && duel.winner === duel.challenger._id && <span className="text-yellow-400 font-black">WINNER</span>}
          </div>
          <div ref={challengerScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
             {duel.challengerPoints?.map((p, i) => (
                <div key={i} className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl text-gray-200">
                  {p.text}
                </div>
             ))}
          </div>
        </div>

        {/* RIGHT COMPARTMENT: Defender (Blue) */}
        <div className="w-1/2 flex flex-col border-l-4 border-gray-900 bg-gradient-to-b from-blue-950/20 to-[#06090f]">
           <div className="p-4 border-b border-blue-900/30 flex justify-between items-center bg-blue-900/10">
            <h3 className="font-black text-blue-500 text-xl">{duel?.defender?.name || '???'}</h3>
            {duel.status === 'voting' && isSpectator && !hasVoted && (
              <button onClick={() => handleSpectatorVote('defender')} className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg font-bold shadow-lg animate-pulse">Vote Blue</button>
            )}
            {duel.status === 'finished' && duel?.winner && duel.winner !== duel.challenger._id && <span className="text-yellow-400 font-black">WINNER</span>}
          </div>
          <div ref={defenderScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
             {duel.defenderPoints?.map((p, i) => (
                <div key={i} className="bg-blue-950/40 border border-blue-900/50 p-4 rounded-xl text-gray-200">
                  {p.text}
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Controller Deck (Only visible and active during 'active' phase for participants) */}
      <div className={`p-6 bg-[#111827] border-t border-gray-800 shrink-0 transition-all duration-500
        ${duel.status === 'active' && isParticipant ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-50 hidden'}
      `}>
        <form onSubmit={handleFirePoint} className="max-w-4xl mx-auto flex gap-4">
           {/* Color code input depending on who is typing */}
           <input
             type="text"
             value={pointText}
             onChange={e => setPointText(e.target.value)}
             className={`flex-1 bg-gray-900 text-white p-4 rounded-xl border-2 outline-none text-lg transition-colors
               ${user?._id === duel.challenger._id ? 'focus:border-red-500 border-red-900/50' : 'focus:border-blue-500 border-blue-900/50'}
             `}
             placeholder="Type your argument quickly..."
             autoFocus
           />
           <button 
             type="submit"
             disabled={!pointText.trim() || duel.status !== 'active'}
             className={`px-10 font-black text-xl rounded-xl transition-all shadow-lg text-white disabled:opacity-50
               ${user?._id === duel.challenger._id ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'}
             `}
           >
             FIRE!
           </button>
        </form>
      </div>

    </div>
  );
};

export default DuelArena;
