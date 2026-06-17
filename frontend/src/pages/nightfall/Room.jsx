import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';

export default function NightfallRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(240);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const scrollRef = useRef(null);
  const [players] = useState([
    { id: 'p1', name: 'You', isMe: true },
    { id: 'p2', name: 'Maren' },
    { id: 'p3', name: 'Castillo' },
    { id: 'p4', name: 'Yusuf' },
    { id: 'p5', name: 'Reeves' },
  ]);
  const [messages, setMessages] = useState([
    { from: 'Maren', text: 'Did anyone else notice Reeves hasn\'t blinked once?' },
    { from: 'Castillo', text: 'I was watching the fire, not Reeves' },
    { from: 'Yusuf', text: 'we don\'t have time to be paranoid about blinking' },
  ]);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); navigate(`/nightfall/${id}/daybreak`); return 0; }
        return s - 1;
      });
    }, 1000);
    // socket.on('message', (m) => setMessages(prev => [...prev, m]));
    return () => clearInterval(t);
  }, [id, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const send = () => {
    if (!message.trim()) return;
    setMessages(m => [...m, { from: 'You', text: message }]);
    // socket.emit('group_message', { roomId: id, text: message });
    setMessage('');
  };

  const castVote = (playerId) => {
    setSelected(playerId);
    // socket.emit('vote', { roomId: id, target: playerId });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <nav className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c20]">
        <span className="text-gray-50 font-medium text-sm">
          <span className="text-amber-400">Nightfall</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#2a1a10] text-amber-300 px-3 py-1 rounded-full">Settlement {id}</span>
          <span className={`text-lg font-medium tabular-nums ${timeLeft < 30 ? 'text-red-400' : 'text-gray-200'}`}>
            {fmt(timeLeft)}
          </span>
        </div>
      </nav>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-[#1c1c20]">
        {players.map(p => (
          <button
            key={p.id}
            onClick={() => !p.isMe && castVote(p.id)}
            disabled={p.isMe}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg shrink-0 ${
              selected === p.id ? 'bg-[#2a1410] border border-red-700' : 'border border-transparent'
            } ${!p.isMe && 'hover:bg-[#15151a]'}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium ${
              p.isMe ? 'bg-[#1a1a2e] text-purple-300' : 'bg-[#2a1f10] text-amber-300'
            }`}>
              {p.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[10px] text-gray-400">{p.isMe ? 'You' : p.name}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[75%] ${m.from === 'You' ? 'self-end' : 'self-start'}`}>
            {m.from !== 'You' && <p className="text-[10px] text-gray-500 mb-0.5 px-1">{m.from}</p>}
            <div className={`text-xs px-3 py-2 rounded-lg ${
              m.from === 'You' ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-200'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 text-[11px] text-gray-600 border-t border-[#1c1c20]">
        {selected ? `Vote cast against ${players.find(p => p.id === selected)?.name}. Tap another to change.` : 'Tap a player above to vote against them'}
      </div>

      <div className="p-3 border-t border-[#1c1c20] flex gap-2">
        <input
          className="flex-1 bg-[#111114] border border-[#232328] rounded-lg px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-purple-600"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Speak to the settlement..."
        />
        <button onClick={send} className="bg-purple-600 text-white px-4 rounded-lg hover:bg-purple-700">
          →
        </button>
      </div>
    </div>
  );
}