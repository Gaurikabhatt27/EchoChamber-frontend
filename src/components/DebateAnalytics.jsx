import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DebateAnalytics = ({ tasks, comments }) => {
  // 1. Calculate Argument Distribution
  const proCount = tasks.filter(t => t.stance === 'pro').length;
  const conCount = tasks.filter(t => t.stance === 'con').length;
  
  const argumentData = [
    { name: 'PRO Arguments', value: proCount },
    { name: 'CON Arguments', value: conCount }
  ];

  const ArgumentColors = ['#4ade80', '#f87171']; // Tailwind green-400 and red-400

  // 2. Calculate Engagement Distribution
  const topLevelCount = comments.filter(c => !c.parentComment).length;
  const replyCount = comments.filter(c => c.parentComment).length;

  const engagementData = [
    { name: 'Standalone Perspectives', value: topLevelCount },
    { name: 'Deep Replies', value: replyCount }
  ];

  const EngagementColors = ['#60a5fa', '#c084fc']; // Tailwind blue-400 and purple-400

  // Render a sleek dark mode custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-gray-700 p-3 rounded-xl shadow-xl">
          <p className="text-white font-bold">{`${payload[0].name}`}</p>
          <p className="text-gray-300">
            Total: <span className="font-extrabold text-[#38bdf8]">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // If there's NO data at all yet, return early to prevent weird blank charts
  if (tasks.length === 0 && comments.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#111827]/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-xl mt-12 mb-8">
      <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-8 flex items-center gap-3">
        <span>📊</span> Live Analytics Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Argument Distribution Chart */}
        {tasks.length > 0 && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-300 mb-2">Argument Split</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">Breakdown of positions taken in the Arena</p>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={argumentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {argumentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ArgumentColors[index % ArgumentColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-gray-300 font-medium ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-8 mt-4">
               <div className="text-center">
                  <span className="block text-2xl font-black text-green-400">{proCount}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">PRO</span>
               </div>
               <div className="text-center">
                  <span className="block text-2xl font-black text-red-400">{conCount}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">CON</span>
               </div>
            </div>
          </div>
        )}

        {/* Engagement Distribution Chart */}
        {comments.length > 0 && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-300 mb-2">Discussion Engagement</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">New thoughts vs Replies to others</p>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EngagementColors[index % EngagementColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-gray-300 font-medium ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-8 mt-4">
               <div className="text-center">
                  <span className="block text-2xl font-black text-blue-400">{topLevelCount}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Standalone</span>
               </div>
               <div className="text-center">
                  <span className="block text-2xl font-black text-purple-400">{replyCount}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Replies</span>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DebateAnalytics;
