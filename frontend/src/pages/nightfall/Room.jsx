import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { baseUrl } from '../constants';
import { io } from 'socket.io-client';

export default function NightfallRoom() {
  const navigate = useNavigate();
  const { id: roomId } = useParams();
  const [searchParams] = useSearchParams();
  const myId = searchParams.get("id");

  const [timeLeft, setTimeLeft] = useState(240);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);

  const scrollRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Fetch existing players + compute real time remaining from server-authoritative start time
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch(
          `${baseUrl}/game-room/${roomId}?id=${myId}`
        );

        const data = await response.json();

        const remainingMs =
          (data.game.duration * 1000) - (Date.now() - new Date(data.game.startAt).getTime());
        setTimeLeft(Math.max(0, Math.floor(remainingMs / 1000)));

        setPlayers(prev => {
          const incoming = data.players.map(p => ({ ...p, isMe: p.id === myId }));
          const newPlayers = incoming.filter(
            player => !prev.some(p => p.id === player.id)
          );
          return [...prev, ...newPlayers];
        });
      } catch (error) {
        navigate("/");
        console.error("Error fetching players:", error);
      }
    }

    fetchPlayers();

    return () => {
      setPlayers([]);
      setMessages([]);
    };
  }, [roomId, myId, navigate]);

  // Countdown timer — purely local ticking, but seeded from real server time above
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          navigate(`/nightfall/${roomId}/daybreak`);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [roomId, navigate]);

  // Socket connection
  useEffect(() => {
    const socket = io(baseUrl, {
      withCredentials: true,
      query: {
        roomId: roomId,
        playerId: myId,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("player:joined", player => {
      setPlayers(prev => {
        const exists = prev.some(p => p.id === player.id);
        if (exists) return prev;
        return [...prev, { ...player, isMe: player.id === myId }];
      });
    });

    socket.on("player:left", playerId => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    socket.on("message:receive", msg => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("vote:cast", ({ voterId, targetId }) => {
      if (voterId === myId) {
        setSelected(targetId);
      }
    });

    socket.on("game:ended", () => {
      navigate(`/nightfall/${roomId}/daybreak`);
    });

    socket.on("disconnect", reason => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [roomId, myId, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(() => {
    const text = message.trim();
    if (!text || !socketRef.current) return;

    socketRef.current.emit('message:send', {
      roomId,
      from: myId,
      text,
    });

    setMessages(prev => [...prev, {msg: text, from: myId}]);
  }, [message, roomId, myId]);

  const castVote = useCallback((playerId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('vote:cast', {
      roomId,
      voterId: myId,
      targetId: playerId,
    });
  }, [roomId, myId]);
  const selectedPlayer = players.find(p => p.id === selected);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <nav className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c20]">
        <span className="text-gray-50 font-medium text-sm">
          <span className="text-amber-400">Nightfall</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#2a1a10] text-amber-300 px-3 py-1 rounded-full">Settlement {roomId}</span>
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
              {(p.id).slice(-2).toUpperCase()}
            </div>
            <span className="text-[10px] text-gray-400">{p.isMe ? 'You' : (p.id)}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
        {messages.map((m, i) => {
          const isMe = m.from === myId;
          const sender = players.find(p => p.id === m.from);
          return (
            <div key={m.id ?? i} className={`max-w-[75%] ${isMe ? 'self-end' : 'self-start'}`}>
              {!isMe && (
                <p className="text-[10px] text-gray-500 mb-0.5 px-1">
                  {sender?.name ?? m.from}
                </p>
              )}
              <div className={`text-xs px-3 py-2 rounded-lg ${
                isMe ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-200'
              }`}>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 text-[11px] text-gray-600 border-t border-[#1c1c20]">
        {selected
          ? `Vote cast against ${selectedPlayer?.name ?? selected}. Tap another to change.`
          : 'Tap a player above to vote against them'}
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