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
  const [toast, setToast] = useState(null);
  const [eliminated, setEliminated] = useState(false);
  const [eliminationReason, setEliminationReason] = useState(null);

  const scrollRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const showToast = useCallback((text) => {
    clearTimeout(toastTimeoutRef.current);
    setToast(text);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

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

        // if the server already considers us eliminated (e.g. on a refresh
        // mid-spectate), restore that state instead of pretending we're live
        const me = data.players.find(p => p.id === myId);
        if (me?.eliminated) {
          setEliminated(true);
          setEliminationReason(me.eliminationReason ?? 'voted out');
        }
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
      showToast(`${player.name ?? player.id} joined the settlement`);
    });

    socket.on("player:left", playerId => {
      setPlayers(prev => {
        const left = prev.find(p => p.id === playerId);
        if (left) showToast(`${left.name ?? left.id} left the settlement`);
        return prev.filter(p => p.id !== playerId);
      });
    });

    socket.on("message:receive", msg => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("vote:cast", ({ voterId, targetId }) => {
      if (voterId === myId) {
        setSelected(targetId);
      } else {
        const voter = players.find(p => p.id === voterId);
        const target = players.find(p => p.id === targetId);
        showToast(`${voter?.name ?? voterId} voted against ${target?.name ?? targetId}`);
      }
    });

    // Kicked players stay in the room as a spectator instead of being
    // routed away — they keep watching the live chat and vote tally,
    // but lose the ability to speak or vote themselves.
    socket.on("player:kicked", ({ playerId, reason }) => {
      if (playerId === myId) {
        setEliminated(true);
        setEliminationReason(reason ?? 'voted out');
        setSelected(null);
      } else {
        setPlayers(prev => {
          const kicked = prev.find(p => p.id === playerId);
          if (kicked) showToast(`${kicked.name ?? kicked.id} was eliminated`);
          return prev.map(p => p.id === playerId ? { ...p, eliminated: true } : p);
        });
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
      clearTimeout(toastTimeoutRef.current);
    };
  }, [roomId, myId, navigate, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(() => {
    if (eliminated) return; // guard against any path that could still call this
    const text = message.trim();
    if (!text || !socketRef.current) return;

    socketRef.current.emit('message:send', {
      roomId,
      from: myId,
      to: roomId,
      text,
    });

    setMessage('');
  }, [message, roomId, myId, eliminated]);

  const castVote = useCallback((playerId) => {
    if (eliminated) return; // eliminated players are observers only
    if (!socketRef.current) return;
    socketRef.current.emit('vote:cast', {
      roomId,
      voterId: myId,
      targetId: playerId,
    });
  }, [roomId, myId, eliminated]);

  const selectedPlayer = players.find(p => p.id === selected);

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-[#1c1c20] border border-[#2a2a30] text-gray-200 text-xs px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

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

      {eliminated && (
        <div className="bg-[#2a1414] border-b border-[#4a1f1f] px-4 py-2.5 flex items-center gap-2">
          <i className="ti ti-ghost-2 text-red-300 text-base shrink-0" />
          <p className="text-xs text-red-200 leading-snug">
            <span className="font-medium text-red-100">You were eliminated</span> ({eliminationReason}). You can watch the rest of the round, but you can no longer vote or chat.
          </p>
        </div>
      )}

      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-[#1c1c20]">
        {players.map(p => {
          const isSelf = p.isMe;
          const disabled = isSelf || eliminated || p.eliminated;
          return (
            <button
              key={p.id}
              onClick={() => !disabled && castVote(p.id)}
              disabled={disabled}
              className={`relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg shrink-0 w-14 ${
                selected === p.id ? 'bg-[#2a1410] border border-red-700' : 'border border-transparent'
              } ${!disabled && 'hover:bg-[#15151a]'} ${(eliminated || p.eliminated) && !isSelf ? 'opacity-40' : ''} ${isSelf ? 'opacity-45' : ''}`}
            >
              {(isSelf && eliminated) && (
                <span className="absolute -top-0.5 right-1 text-red-400 text-[11px]">
                  <i className="ti ti-skull" />
                </span>
              )}
              {(!isSelf && p.eliminated) && (
                <span className="absolute -top-0.5 right-1 text-red-400 text-[11px]">
                  <i className="ti ti-skull" />
                </span>
              )}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium ${
                isSelf ? 'bg-[#1c1c20] text-gray-500' : 'bg-[#2a1f10] text-amber-300'
              }`}>
                {(p.id).slice(-2).toUpperCase()}
              </div>
              <span className="text-[10px] text-gray-400">{isSelf ? 'You' : p.id}</span>
            </button>
          );
        })}
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
        {eliminated
          ? 'You are spectating. Voting and chat are disabled.'
          : selected
            ? `Vote cast against ${selectedPlayer?.name ?? selected}. Tap another to change.`
            : 'Tap a player above to vote against them'}
      </div>

      <div className="p-3 border-t border-[#1c1c20] flex gap-2">
        {eliminated ? (
          <div className="flex-1 bg-[#0e0e10] border border-[#1c1c20] rounded-lg px-3 py-2.5 text-sm text-gray-600">
            You can no longer speak in this settlement
          </div>
        ) : (
          <input
            className="flex-1 bg-[#111114] border border-[#232328] rounded-lg px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-purple-600"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Speak to the settlement..."
          />
        )}
        <button
          onClick={send}
          disabled={eliminated}
          className={`px-4 rounded-lg ${
            eliminated ? 'bg-[#1c1c20] text-gray-600 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          →
        </button>
      </div>
    </div>
  );
}