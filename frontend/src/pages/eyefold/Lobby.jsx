import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { io } from "socket.io-client";

import StoryIntro from "../components/StoryIntro";
import { baseUrl } from "../constants";

export default function EyefoldLobby() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const { id: roomId } = useParams();
  const navigate = useNavigate();

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

    socket.on("player:left", () => {
      // console.log("player left");
      navigate(
        `/eyefold/${roomId}/reveal?reason=${encodeURIComponent(
          "player left"
        )}`
      );
    });

    socket.on("game:started", ()=> navigate(`/eyefold/room/${roomId}?id=${id}`));

    // socket.on("disconnect", reason => {
    //   console.log("Socket disconnected:", reason);
    // });

    return () => {
      socket.removeAllListeners();
    };
  }, [roomId, id, navigate]);

  // useEffect(() => {
  //   if (players.length >= 3) {
      
  //   }
  // }, [players, navigate, roomId, id])

  const slots = [
    ...players,
    ...Array(Math.max(3 - players.length, 0)).fill(null),
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-[#0a0a0c] rounded-3xl p-8">
        <p className="text-purple-400 text-[11px] tracking-[3px] font-medium text-center mb-1">
          THE EYEFOLD
        </p>

        <h1 className="text-xl font-medium text-gray-50 text-center mb-6">
          Waiting for trainees to arrive
        </h1>

        <div className="flex gap-2.5 mb-6">
          {slots.map((player, index) => (
            <div
              key={index}
              className={`flex-1 rounded-xl p-4 flex flex-col items-center gap-1.5 min-h-22.5 justify-center ${player
                  ? "bg-[#111114] border border-[#232328]"
                  : "bg-[#111114] border border-dashed border-[#2a2a30]"
                }`}
            >
              {player ? (
                <>
                  <div className="w-8.5 h-8.5 rounded-full bg-[#1a1a2e] text-purple-300 flex items-center justify-center text-xs font-medium">
                    {player.id === id
                      ? "YO"
                      : player.id?.slice(-2)?.toUpperCase() ?? "--"}
                  </div>

                  <p className="text-xs font-medium text-gray-200 truncate text-[9px] w-full text-center px-5">
                    {player.id === id ? "You" : player.id.slice(-6)
                      + "...."}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    Connected
                  </p>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 border-2 border-[#2a2a30] border-t-purple-400 rounded-full animate-spin" />

                  <p className="text-xs font-medium text-gray-500">
                    Searching...
                  </p>

                  <p className="text-[10px] text-gray-600">
                    Quanbit unit
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#111114] border border-[#232328] rounded-xl px-6 py-6 min-h-32.5 flex items-center justify-center mb-4">
          <StoryIntro storyKey="eyefold" loop />
        </div>

        <p className="text-center text-[11px] text-gray-600">
          {players.length} of 3 trainees ready · simulator will start
          automatically
        </p>
      </div>
    </div>
  );
}