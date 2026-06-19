import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { baseUrl } from '../constants';
import { io } from 'socket.io-client';

export default function EyefoldVote() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const myId = searchParams.get("id");
  const { id: roomId } = useParams();

  const [players, setPlayers] = useState([]);
  const socketRef = useRef(null);

  const submit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch(`${baseUrl}/game-room/${roomId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: myId, votedFor: selected }),
      });

      const data = await response.json();

      // server tells us the outcome — pass it forward via navigation state
      navigate(`/eyefold/${roomId}/reveal`, {
        state: {
          votedFor: selected,
          quanbitId: data.quanbitId,
          correct: data.quanbitId === selected,
          players,
        },
      });
    } catch (error) {
      console.error("Error submitting vote:", error);
      setSubmitting(false);
    }
  };

  // Fetch existing players
  useEffect(() => {
    localStorage.setItem("room", `${roomId}-${myId}`);

    async function fetchPlayers() {
      try {
        const response = await fetch(
          `${baseUrl}/game-room/${roomId}?id=${myId}`
        );

        const data = await response.json();

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
    };
  }, [roomId, myId, navigate]);

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
        return [...prev, player];
      });
    });

    socket.on("player:left", () => {
      navigate(
        `/eyefold/${roomId}/reveal?reason=${encodeURIComponent("player left")}`
      );
    });

    socket.on("game:started", () => navigate(`/eyefold/room/${roomId}?id=${myId}`));

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
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <p className="text-purple-400 text-[11px] tracking-[3px] font-medium mb-2">TIME'S UP</p>
          <h2 className="text-xl font-medium text-gray-50 mb-1">Who is the Quanbit?</h2>
          <p className="text-sm text-gray-500">Choose the trainee you think is synthetic</p>
        </div>
        {otherPlayers.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`w-full text-left rounded-xl p-4 transition-all bg-[#111114] ${
              selected === p.id ? 'border-2 border-purple-500' : 'border border-[#232328] hover:border-[#3a3a42]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1a1a2e] text-purple-300 flex items-center justify-center font-medium text-sm">
                {p.id.slice(-2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-100">Player {p.id}</div>
              </div>
              {selected === p.id && <span className="text-purple-400 text-lg">✓</span>}
            </div>
          </button>
        ))}
        <button
          onClick={submit}
          disabled={!selected || submitting}
          className={`py-2.5 rounded-lg text-sm font-medium ${
            selected && !submitting ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-[#1c1c20] text-gray-600 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit vote'}
        </button>
      </div>
    </div>
  );
}