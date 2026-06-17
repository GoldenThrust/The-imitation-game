import { useParams, useNavigate } from 'react-router';

export default function DayBreak() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Replace with real data: was the imposter caught or not
  const imposterCaught = false;
  const imposter = { name: 'Reeves', votesAgainst: 2 };
  const survivors = 4;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div
        className="w-full max-w-md rounded-3xl p-8 flex flex-col items-center"
        style={{ background: 'linear-gradient(180deg, #1a1410 0%, #0a0a0c 100%)' }}
      >
        <div className="w-14 h-14 rounded-full bg-amber-700 mb-5" />
        <p className="text-amber-400 text-[11px] tracking-[3px] font-medium mb-1">DAYBREAK</p>
        <h1 className="text-xl font-medium text-gray-50 mb-1 text-center">The sun has risen</h1>
        <p className="text-sm text-gray-500 text-center mb-7">The Quanbit's combat systems are reactivating</p>

        <div className="w-full bg-[#15110c] border border-[#2a2218] rounded-xl p-5 flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#2a1a14] text-red-400 flex items-center justify-center text-base font-medium shrink-0">
            {imposter.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-50 mb-0.5">{imposter.name}</p>
            <span className="text-[11px] text-red-300 bg-[#2a1414] px-2.5 py-0.5 rounded-full">
              Synthetic · unmasked
            </span>
          </div>
        </div>

        <div className={`w-full text-center p-4 rounded-xl mb-6 ${
          imposterCaught ? 'bg-[#0f1e10] border border-[#1f3a1f]' : 'bg-[#2a1414] border border-[#4a1f1f]'
        }`}>
          <p className={`text-base font-medium mb-1 ${imposterCaught ? 'text-green-400' : 'text-red-300'}`}>
            {imposterCaught ? 'The imposter was found' : 'The settlement has fallen'}
          </p>
          <p className="text-xs text-gray-500">
            {imposterCaught ? 'Humanity survives another night' : 'The imposter survived the night undetected'}
          </p>
        </div>

        <div className="w-full grid grid-cols-2 gap-2.5 mb-6">
          <div className="bg-[#15110c] rounded-lg p-3.5 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Survivors</p>
            <p className="text-lg font-medium text-gray-100">{survivors}</p>
          </div>
          <div className="bg-[#15110c] rounded-lg p-3.5 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Votes against {imposter.name}</p>
            <p className="text-lg font-medium text-gray-100">{imposter.votesAgainst}</p>
          </div>
        </div>

        <div className="w-full flex gap-3">
          <button onClick={() => navigate('/')} className="flex-1 border border-[#3a2e1a] text-gray-300 text-sm py-2 rounded-lg hover:bg-[#1a1410]">
            Back to lobby
          </button>
          <button onClick={() => navigate(`/nightfall/${id}`)} className="flex-1 bg-amber-700 text-white text-sm py-2 rounded-lg hover:bg-amber-800">
            Play again →
          </button>
        </div>
      </div>
    </div>
  );
}