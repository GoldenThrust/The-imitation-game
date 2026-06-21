import { useNavigate, useLocation } from 'react-router';

export default function EyefoldReveal() {
  const navigate = useNavigate();
  const location = useLocation();

  // Pull the real result passed from the vote screen, with a safe fallback
  const { playerId, quanbitId, correct, players = [] } = location.state || {};

  const aiPlayer = players.find(p => p.id === quanbitId);
  const humanPlayers = players.filter(p => p.id !== quanbitId && p.id !== playerId);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-[#0a0a0c] rounded-3xl p-7 flex flex-col gap-4">
        <div className="text-center py-1">
          <h2 className={`text-xl font-medium ${correct ? 'text-purple-300' : 'text-red-400'}`}>
            {correct ? 'You spotted the Quanbit' : 'The machine fooled you'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {aiPlayer ? `Player ${aiPlayer.id} was synthetic.` : 'Result unavailable.'}{' '}
            {correct ? '+2 points' : 'No points awarded'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {humanPlayers.map(p => (
            <div key={p.id} className="border-l-2 border-green-500 pl-3 bg-[#111114] border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#0f1e10] text-green-400 flex items-center justify-center text-xs font-medium">
                  {p.id.slice(-2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-200">Player {p.id}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0f1e10] text-green-400">Human</span>
                </div>
              </div>
            </div>
          ))}

          {aiPlayer && (
            <div className="border-l-2 border-purple-500 pl-3 bg-[#111114] border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#1a1a2e] text-purple-300 flex items-center justify-center text-xs font-medium">
                  {aiPlayer.id.slice(-2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-200">Player {aiPlayer.id}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a2e] text-purple-300">Quanbit</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate('/')} className="flex-1 border border-[#232328] text-gray-300 text-sm py-2 rounded-lg hover:bg-[#111114]">
            Back to lobby
          </button>
          <a href="http://localhost:3000/room?type=eyefold" className="flex-1 bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700">
            Train again →
          </a>
        </div>
      </div>
    </div>
  );
}