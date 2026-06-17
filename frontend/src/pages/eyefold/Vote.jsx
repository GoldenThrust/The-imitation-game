import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';

export default function EyefoldVote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const submit = () => {
    if (!selected) return;
    // socket.emit('vote', { roomId: id, vote: selected });
    navigate(`/eyefold/${id}/reveal`);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <p className="text-purple-400 text-[11px] tracking-[3px] font-medium mb-2">TIME'S UP</p>
          <h2 className="text-xl font-medium text-gray-50 mb-1">Who is the Quanbit?</h2>
          <p className="text-sm text-gray-500">Choose the trainee you think is synthetic</p>
        </div>
        {['A', 'B'].map(p => (
          <button
            key={p}
            onClick={() => setSelected(p)}
            className={`w-full text-left rounded-xl p-4 transition-all bg-[#111114] ${
              selected === p ? 'border-2 border-purple-500' : 'border border-[#232328] hover:border-[#3a3a42]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1a1a2e] text-purple-300 flex items-center justify-center font-medium text-sm">
                {p}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-100">Player {p}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {p === 'A' ? '"lol just coffee tbh, was running late"' : '"I had a nutritious breakfast consisting of oatmeal..."'}
                </div>
              </div>
              {selected === p && <span className="text-purple-400 text-lg">✓</span>}
            </div>
          </button>
        ))}
        <button
          onClick={submit}
          disabled={!selected}
          className={`py-2.5 rounded-lg text-sm font-medium ${
            selected ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-[#1c1c20] text-gray-600 cursor-not-allowed'
          }`}
        >
          Submit vote
        </button>
      </div>
    </div>
  );
}