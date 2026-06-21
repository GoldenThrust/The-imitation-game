import StoryIntro from "./components/StoryIntro";
import { baseUrl } from "./constants";

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-[#0a0a0c] rounded-3xl p-10 relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-75 h-75 bg-purple-500 opacity-[0.08] rounded-full" />

        <header className="relative z-10 flex flex-col items-center mb-6">
          <img src="./icon.svg" className="w-44 h-10 mb-3" alt="" />
          <p className="text-purple-400 text-[11px] tracking-[3px] font-medium mb-1">YEAR 3026</p>
          <h1 className="text-2xl font-medium text-gray-50">The Imitation Games</h1>
        </header>

        <div className="relative z-10 bg-[#111114] border border-[#232328] rounded-xl px-6 py-7 min-h-40 flex items-center justify-center mb-6">
          <StoryIntro storyKey="home" />
        </div>

        <div className="h-px bg-[#1c1c20] w-full mb-6 relative z-10" />

        <p className="text-center text-gray-500 text-xs italic mb-6 relative z-10 leading-relaxed">
          Choose your game mode and test your wits against the machines in a battle of deception, deduction, and survival.
        </p>

        <nav className="relative z-10 grid grid-cols-2 gap-3">
          <a
            href={`${baseUrl}/api/room?type=eyefold`}
            className="bg-[#111114] border border-[#232328] hover:border-purple-700 hover:bg-[#15151a] rounded-xl p-4 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1a1a2e] text-purple-300 flex items-center justify-center  mb-2.5">
              <img src="./eyefold.svg" className="w-5 h-10 mb-3" alt=""  />
            </div>
            <p className="text-sm font-medium text-gray-50 mb-0.5">Eyefold</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Train against captive Quanbit. Learn to spot the flaws in their mimicry.
            </p>
            <span className="inline-block text-[10px] text-purple-300 bg-[#1a1a2e] px-2 py-0.5 rounded-full mt-2">
              3 players
            </span>
          </a>

          <a
            href={`${baseUrl}/api/room?type=nightfall`}
            className="bg-[#111114] border border-[#232328] hover:border-purple-700 hover:bg-[#15151a] rounded-xl p-4 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1a1a2e] text-purple-300 flex items-center justify-center mb-2.5">
              <img src="./nightfall.svg" className="w-5 h-10 mb-3" alt="Nightfall" />
            </div>
            <p className="text-sm font-medium text-gray-50 mb-0.5">Nightfall</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              The sun has set. Find the synthetic imposter before they find you.
            </p>
            <span className="inline-block text-[10px] text-purple-300 bg-[#1a1a2e] px-2 py-0.5 rounded-full mt-2">
              Group · imposter
            </span>
          </a>
        </nav>
      </div>
    </div>
  );
}