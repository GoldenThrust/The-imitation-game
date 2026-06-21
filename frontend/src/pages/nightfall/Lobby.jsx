import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import StoryIntro from '../components/StoryIntro';
import { baseUrl } from '../constants';
import { io } from 'socket.io-client';

export default function NightfallLobby() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const minPlayers = 10;

  const [players, setPlayers] = useState([]);
  const socketRef = useRef(null);

  // Fetch existing players
  useEffect(() => {
    localStorage.setItem("room", `${roomId}-${id}`);

    async function fetchPlayers() {
      try {
        const response = await fetch(
          `${baseUrl}/api/game-room/${roomId}?id=${id}`
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
  }, [roomId, id, navigate]);

  // Socket connection
  useEffect(() => {
    const socket = io(baseUrl, {
      withCredentials: true,
      query: {
        roomId: roomId,
        playerId: id,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("player:joined", player => {
      setPlayers(prev => {
        const exists = prev.some(p => p.id === player.id);

        if (exists) {
          return prev;
        }

        return [...prev, player];
      });
    });

    socket.on("game:started", ()=> navigate(`/nightfall/room/${roomId}?id=${id}`));


    // socket.on("player:left", () => {
    //   navigate(
    //     `/eyefold/${roomId}/reveal?reason=${encodeURIComponent(
    //       "player left"
    //     )}`
    //   );
    // });

    socket.on("disconnect", reason => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [roomId, id, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-[#0a0a0c] rounded-3xl p-8">
        <p className="text-amber-400 text-[11px] tracking-[3px] font-medium text-center mb-1">NIGHTFALL</p>
        <h1 className="text-xl font-medium text-gray-50 text-center mb-1">The settlement gathers</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {players.length} of {minPlayers} survivors present
        </p>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {Array(minPlayers).fill(null).map((_, i) => {
            const p = players[i];
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 ${p ? 'bg-[#1a1410] border border-[#3a2e1a]' : 'bg-[#111114] border border-dashed border-[#2a2a30]'
                  }`}
              >
                {p ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-[#2a1f10] text-amber-300 flex items-center justify-center text-[10px] font-medium">
                      {p.id.slice(-2).toUpperCase()}
                    </div>
                    <p className="text-[9px] text-gray-300 truncate w-full text-center px-5">{p.id}</p>
                  </>
                ) : (
                  <div className="w-3.5 h-3.5 border-2 border-[#2a2a30] border-t-amber-500 rounded-full animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-[#111114] border border-[#232328] rounded-xl px-6 py-6 min-h-32.5 flex items-center justify-center mb-4">
          <StoryIntro storyKey="nightfall" loop />
        </div>

        <p className="text-center text-[11px] text-gray-600">
          Among you, some are not who they seem. The hunt begins when everyone arrives.
        </p>
      </div>
    </div>
  );
}