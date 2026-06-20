import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { baseUrl } from '../constants';

export default function DayBreak() {
  const [searchParams] = useSearchParams();
  const { id: roomId } = useParams();
  const myId = searchParams.get("id");
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [allImpostersCaught, setAllImpostersCaught] = useState(false);
  const [imposters, setImposters] = useState([]);
  const [survivorCount, setSurvivorCount] = useState(0);
  const [players, setPlayers] = useState([]);

  // Fetch existing players
  useEffect(() => {
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
        setLoaded(true);
      } catch (error) {
        navigate("/");
        console.error("Error fetching players:", error);
      }
    }

    fetchPlayers();

    return () => {
      setPlayers([]);
      setLoaded(false);
    };
  }, [roomId, myId, navigate]);

  useEffect(() => {
    if (!loaded) return;
    const run = () => {
      const quanbits = players.filter((p) => p.role === "Quanbit");
      const survivingHumans = players.filter((p) => p.role === "Human" && !p.eliminated);
  
      setAllImpostersCaught(quanbits.length === 0);
      setImposters(quanbits);
      setSurvivorCount(survivingHumans.length);
    }

    run();
  }, [players, loaded]);

  const unmaskedCount = imposters.filter(i => i.eliminated).length;
  const totalImposters = imposters.length;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div
        className="w-full max-w-md rounded-3xl p-8 flex flex-col items-center"
        style={{ background: 'linear-gradient(180deg, #1a1410 0%, #0a0a0c 65%)' }}
      >
        <div
          className="w-16 h-16 rounded-full mb-5"
          style={{ background: 'radial-gradient(circle at 35% 35%, #EF9F27, #854F0B)' }}
        />
        <p className="text-amber-400 text-[11px] tracking-[3px] font-medium mb-1">DAYBREAK</p>
        <h1 className="text-xl font-medium text-gray-50 mb-1 text-center">The sun has risen</h1>
        <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
          The Quanbit's combat systems are reactivating. Here's who made it through the night.
        </p>

        {imposters.map((imposter) => (
          <div
            key={imposter.id}
            className="w-full bg-[#15110c] border border-[#2a2218] rounded-xl p-5 flex items-center gap-3.5 mb-2.5"
          >
            <div className="w-12 h-12 rounded-full bg-[#2a1a14] text-red-400 flex items-center justify-center text-base font-medium shrink-0">
              {imposter.id.slice(-2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-50 mb-0.5">{imposter.name ?? imposter.id}</p>
              <span className="text-[11px] text-red-300 bg-[#2a1414] px-2.5 py-0.5 rounded-full">
                {imposter.eliminated ? 'Synthetic · unmasked' : 'Synthetic · escaped detection'}
              </span>
            </div>
          </div>
        ))}

        <div className={`w-full text-center p-4 rounded-xl mt-3.5 mb-6 ${allImpostersCaught ? 'bg-[#0f1e10] border border-[#1f3a1f]' : 'bg-[#2a1414] border border-[#4a1f1f]'
          }`}>
          <p className={`text-base font-medium mb-1 ${allImpostersCaught ? 'text-green-400' : 'text-red-300'}`}>
            {allImpostersCaught ? 'The imposter was found' : 'The settlement has fallen'}
          </p>
          <p className="text-xs text-gray-500">
            {allImpostersCaught
              ? 'Humanity survives another night'
              : totalImposters > 0
                ? `${imposters.find(i => !i.eliminated)?.name ?? 'The imposter'} survived the night undetected`
                : 'The imposter survived the night undetected'}
          </p>
        </div>

        <div className="w-full grid grid-cols-2 gap-2.5 mb-6">
          <div className="bg-[#15110c] rounded-lg p-3.5 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Survivors</p>
            <p className="text-lg font-medium text-gray-100">{survivorCount}</p>
          </div>
          <div className="bg-[#15110c] rounded-lg p-3.5 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Imposters unmasked</p>
            <p className="text-lg font-medium text-gray-100">{unmaskedCount} / {totalImposters}</p>
          </div>
        </div>

        <div className="w-full flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 border border-[#3a2e1a] text-gray-300 text-sm py-2 rounded-lg hover:bg-[#1a1410]"
          >
            Back to lobby
          </button>
          <button
            onClick={() => window.location.href = 'http://localhost:3000/room?type=nightfall'}
            className="flex-1 bg-amber-700 text-white text-sm py-2 rounded-lg hover:bg-amber-800"
          >
            Play again →
          </button>
        </div>
      </div>
    </div>
  );
}