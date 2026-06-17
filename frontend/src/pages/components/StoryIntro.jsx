import { useState, useEffect, useRef, useCallback } from 'react';

const STORIES = {
  home: {
    title: 'The Imitation Games',
    lines: [
      "The year 3026.",
      "The world is in absolute chaos. Humanity is locked in a brutal, desperate struggle for survival against the Quanbit an advanced race of rogue AI robots.",
      "In recent years, human resistance fighters dealt a catastrophic blow to the machines by destroying the Quanbit's primary synthetic power source.",
      "Now the AI units are entirely dependent on solar energy. When night falls, the Quanbit become severely drained their heavy weapon systems go offline, and they cannot risk direct combat with humans.",
      "To survive until daybreak, the AI deployed a terrifying new protocol: flesh-mimicry. They blend into human populations, perfectly imitating speech, appearance, and emotion waiting out the darkness until morning sun reboots their systems.",
      "Entire human communities have already been eradicated from within by this deceptive technique.",
      "Humanity has come together to form a structured, psychological survival system to fish out the infiltrators before time runs out especially during short summer nights (The Summer Solstice), when the pressure is at its peak.",
      "They call this trial the Imitation Games."
    ]
  },
  eyefold: {
    title: 'The Eyefold',
    lines: [
      "To prepare for these deadly trials, humans have turned to a ruthless method of education.",
      "Resistance fighters have captured and subjugated several Quanbit units, rewriting portions of their code to force them to serve human will.",
      "In a grueling training program known as The Eyefold, these captive AI are used as simulators to train citizens.",
      "Participants learn to spot the microscopic flaws in the machines' mimicry — a heartbeat too perfectly rhythmic, skin that doesn't sweat, a blink that lags by a millisecond.",
      "Because failing the Imitation Games means certain death, the human population has drastically plummeted due to failed trials.",
      "While some factions initially refused to adopt such a grim, cold-hearted system, the dwindling numbers have left them with no choice.",
      "To survive, everyone must eventually enter the Eyefold and learn the ways of the Quanbit."
    ]
  },
  nightfall: {
    title: 'Nightfall',
    lines: [
      "The horizon bleeds from a bruised purple into a deep, suffocating black.",
      "A cold wind sweeps through the makeshift settlement, carrying the tense, collective silence of a community on edge.",
      "No one moves alone anymore. Everyone watches everyone else, searching for any sign of a synthetic imposter hiding behind a familiar face.",
      "The sharp, piercing cry of the Hawk echoes through the valley, the signal that the sun has set and the machines have embedded themselves in the crowd.",
      "The central fire flickers, casting long, deceptive shadows across the nervous gathering.",
      "A leader steps into the center of the ring, eyes scanning the crowd, searching for the one face that remains unnaturally calm.",
      "\"Gather together, everyone. Look closely at the person standing next to you. The night is about to fall, and the synthetic mimics are already among us, hiding behind stolen faces.\"",
      "\"It is time for the game to begin. We must find the code flaws, isolate the machine, and eliminate the imposter among us — to ensure the survival of humanity and safeguard the future of our offspring.\"",
      "\"Let the games begin.\""
    ]
  }
};

export default function StoryIntro({ storyKey, onComplete, onSkip }) {
  const story = STORIES[storyKey];
  const [lineIdx, setLineIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [done, setDone] = useState(false);
  const typingRef = useRef(null);
  const advanceRef = useRef(null);


  const typeCurrentLine = useCallback(() => {
    if (lineIdx >= story.lines.length) {
      setDone(true);
      onComplete?.();
      return;
    }
    const line = story.lines[lineIdx];
    let charIdx = 0;
    setDisplayedText('');
    clearInterval(typingRef.current);

    typingRef.current = setInterval(() => {
      charIdx++;
      setDisplayedText(line.slice(0, charIdx));
      if (charIdx >= line.length) {
        clearInterval(typingRef.current);
        advanceRef.current = setTimeout(() => {
          setLineIdx(i => i + 1);
        }, 2200); // hold time before next line
      }
    }, 28); // typing speed (ms per char)
  }, [lineIdx, story.lines, onComplete]);

  useEffect(() => {
    typeCurrentLine();
    return () => {
      clearInterval(typingRef.current);
      clearTimeout(advanceRef.current);
    };
  }, [lineIdx, typeCurrentLine]);
  const skip = () => {
    clearInterval(typingRef.current);
    clearTimeout(advanceRef.current);
    setLineIdx(story.lines.length);
    setDone(true);
    onSkip?.();
  };

  return (
    <div className="relative bg-black rounded-xl p-10 min-h-70 flex flex-col justify-center overflow-hidden">
      <button
        onClick={skip}
        className="absolute top-4 right-4 text-xs text-gray-500 border border-gray-800 px-3 py-1 rounded-full hover:text-gray-200 hover:border-gray-600"
      >
        Skip →
      </button>

      <div className="text-center text-purple-400 text-xs tracking-widest mb-6 font-medium uppercase">
        {story.title}
      </div>

      <div className="text-center text-gray-100 italic font-serif text-lg leading-relaxed min-h-30 flex items-center justify-center px-4">
        {done ? (
          <span className="text-purple-400">
            {storyKey === 'home' && 'The Imitation Games are about to begin.'}
            {storyKey === 'eyefold' && 'Entering the Eyefold...'}
            {storyKey === 'nightfall' && 'The hunt begins now.'}
          </span>
        ) : (
          <span>
            {displayedText}
            <span className="inline-block w-0.5 h-5 bg-purple-400 ml-0.5 animate-pulse" />
          </span>
        )}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {story.lines.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= lineIdx ? 'bg-purple-400' : 'bg-gray-700'
              }`}
          />
        ))}
      </div>
    </div>
  );
}