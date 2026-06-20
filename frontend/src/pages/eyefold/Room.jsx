import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { baseUrl } from '../constants';
import { io } from 'socket.io-client';

export default function EyefoldRoom() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(180);

  const [players, setPlayers] = useState([]);
  const [chats, setChats] = useState({});
  const [drafts, setDrafts] = useState({});

  const [searchParams] = useSearchParams();
  const { id: roomId } = useParams();
  const socketRef = useRef(null);
  const myId = searchParams.get("id");

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); navigate(`/eyefold/${roomId}/vote?id=${myId}`); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [roomId, navigate, myId]);

  // Fetch existing players
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch(
          `${baseUrl}/game-room/${roomId}?id=${myId}`
        );

        const data = await response.json();

        const timeLeft = (data.game.duration * 1000) - (Date.now() - (new Date(data.game.startAt)));

        setTimeLeft(Math.floor(timeLeft / 1000));

        setPlayers(prev => {
          const newPlayers = data.players.filter(
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
      setChats({});
      setDrafts({});
    };
  }, [roomId, myId, navigate]);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const setMessage = useCallback((playerId, value) => {
    setDrafts(prev => ({ ...prev, [playerId]: value }));
  }, []);

  const send = useCallback((playerId) => {
    const text = (drafts[playerId] || '').trim();
    if (!text) return;

    // optimistic local append
    setChats(prev => ({
      ...prev,
      [playerId]: [...(prev[playerId] || []), { from: 'me', text }],
    }));
    setDrafts(prev => ({ ...prev, [playerId]: '' }));

    socketRef.current?.emit('message:send', {
      from: myId,
      to: playerId,
      text,
    });
  }, [drafts, myId]);

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
      if (!player?.id) return;
      setPlayers(prev => {
        const exists = prev.some(p => p.id === player.id);
        if (exists) return prev;
        return [...prev, player];
      });
    });

    socket.on("message:receive", ({ from, to, text }) => {
      const otherId = from === myId ? to : from;
      setChats(prev => ({
        ...prev,
        [otherId]: [...(prev[otherId] || []), { from, text }],
      }));
    });

    socket.on("player:left", () => {
      console.log("player left");

      navigate(
        `/eyefold/${roomId}/reveal?reason=${encodeURIComponent("player left")}`
      );
    });

    socket.on("disconnect", reason => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [roomId, myId, navigate]);

  const otherPlayers = players.filter(p => p.id !== myId);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <nav className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c20]">
        <span className="text-gray-50 font-medium text-sm">
          The <span className="text-purple-400">Eyefold</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#1a1a2e] text-purple-300 px-3 py-1 rounded-full">Room {roomId}</span>
          <span className={`text-lg font-medium tabular-nums ${timeLeft < 30 ? 'text-red-400' : 'text-gray-200'}`}>
            {fmt(timeLeft)}
          </span>
        </div>
      </nav>
      <div className="px-4 py-2.5 bg-[#0e0e10] border-b border-[#1c1c20] text-xs text-gray-500">
        Chat with both trainees. Spot the synthetic before time runs out.
      </div>
      <div className="flex-1 grid grid-cols-2 divide-x divide-[#1c1c20]">
        {otherPlayers.map(p => (
          <div key={p.id} className="flex flex-col">
            <div className="px-4 py-3 border-b border-[#1c1c20] flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1a1a2e] text-purple-300 flex items-center justify-center text-xs font-medium">
                {p.id.slice(-2).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-200">Player {p.id.reverse()}</span>
            </div>
            <div className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto min-h-48">
              {(chats[p.id] || []).map((m, i) => (
                <div
                  key={i}
                  className={`text-xs px-3 py-2 rounded-lg max-w-[80%] ${m.from === 'me' ? 'self-end bg-[#1c1c20] text-gray-200' : 'bg-[#1a1a2e] text-gray-300'
                    }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-[#1c1c20] flex gap-2">
              <input
                className="flex-1 bg-[#111114] border border-[#232328] rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-purple-600"
                value={drafts[p.id.reverse()] || ''}
                onChange={e => setMessage(p.id, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(p.id)}
                placeholder={`Message Player ${p.id}...`}
              />
              <button onClick={() => send(p.id)} className="bg-purple-600 text-white text-xs px-3 rounded-lg hover:bg-purple-700">
                →
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* <div className="px-4 py-3 border-t border-[#1c1c20] flex justify-end">
        <button
          onClick={() => navigate(`/eyefold/${roomId}/vote`)}
          className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700"
        >
          End chat & vote →
        </button>
      </div> */}
    </div>
  );
}