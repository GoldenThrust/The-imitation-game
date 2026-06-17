import { useParams, useNavigate } from 'react-router';

export default function EyefoldReveal() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Replace with real data from socket/state: who was AI, whether the player guessed right
  const correct = true;
  const aiPlayer = 'B';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-[#0a0a0c] rounded-3xl p-7 flex flex-col gap-4">
        <div className="text-center py-1">
          <h2 className={`text-xl font-medium ${correct ? 'text-purple-300' : 'text-red-400'}`}>
            {correct ? 'You spotted the Quanbit' : 'The machine fooled you'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Player {aiPlayer} was synthetic. {correct ? '+2 points' : 'No points awarded'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-l-2 border-green-500 pl-3 bg-[#111114] border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-[#0f1e10] text-green-400 flex items-center justify-center text-xs font-medium">A</div>
              <div>
                <div className="text-xs font-medium text-gray-200">Player A</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0f1e10] text-green-400">Human</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Casual language, typos, contractions — classic human.</p>
          </div>
          <div className="border-l-2 border-purple-500 pl-3 bg-[#111114] border border-[#232328] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-[#1a1a2e] text-purple-300 flex items-center justify-center text-xs font-medium">B</div>
              <div>
                <div className="text-xs font-medium text-gray-200">Player B</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a2e] text-purple-300">Quanbit</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Too structured. Real humans rarely speak this neatly.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/')} className="flex-1 border border-[#232328] text-gray-300 text-sm py-2 rounded-lg hover:bg-[#111114]">
            Back to lobby
          </button>
          <button onClick={() => navigate(`/eyefold/${id}`)} className="flex-1 bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700">
            Train again →
          </button>
        </div>
      </div>
    </div>
  );
}