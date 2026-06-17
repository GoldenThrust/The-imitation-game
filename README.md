# The Imitation Game

> **The year is 3026.** Humanity is locked in a war against the Quanbit - rogue AI that go dark at night and survive by hiding inside human settlements, perfectly mimicking speech, emotion, and appearance. Your only weapon is suspicion.


A real-time multiplayer social deduction game inspired by Turing's 1950 "Imitation Game" thought experiment: can you tell a human from a machine through conversation alone? Except here, getting it wrong doesn't just lose you a round - it gets your settlement wiped out.

---

## The premise

Resistance fighters destroyed the Quanbit's main power source, forcing the machines onto solar power. At night, their combat systems go offline - so they infiltrate human communities instead, hiding behind stolen faces until sunrise reboots them. The only defense is a structured interrogation ritual the survivors call **the Imitation Games**.

Two modes, two ways to play it:

### 🔍 Eyefold - 1-on-1 training simulator
You're the interrogator. Two anonymous players are in front of you - one human, one captured Quanbit unit running on rewritten code. Chat with both simultaneously, then vote on which one is synthetic before time runs out.

### 🌙 Nightfall - group survival, imposter-style
A full settlement gathers around the fire as night falls. One (or more) of you is a Quanbit in flesh-mimicry mode. Talk it out in the group chat, build a case, cast your vote - and find out at daybreak whether the right person got unmasked, or whether the machine survived the night.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, React Router, Tailwind CSS |
| Real-time | Socket.IO |
| AI player | Google Gemini API |
| Backend | Node.js, Express, Socket.IO server |

The AI opponent isn't scripted - it's a live Gemini model with a persona-driven system instruction telling it to behave like a nervous, casual human under interrogation: contractions, typos, deflection, defensiveness when accused, and (in Nightfall) restraint about jumping into every message, since responding too often is itself a tell.
## How it works
Lobby → Role assignment → Real-time chat → Vote → Reveal

- **Eyefold**: players join a room via Socket.IO; the server pairs one human interrogator with one human "decoy" and one Gemini-powered Quanbit. Chat happens in parallel two-pane threads. A countdown forces a decision before the vote screen.
- **Nightfall**: a settlement-sized lobby fills with humans and one or more hidden Quanbit. All chat happens in a single shared room. Players vote on who to "unmask"; daybreak reveals the outcome and whether the imposter survived.

Both modes route through React Router (`/eyefold/:id`, `/nightfall/:id`, plus `/vote` and `/reveal`/`/daybreak` sub-routes), with game state synced over Socket.IO and AI responses generated server-side so the Gemini API key never reaches the client.

---

## Running locally

```bash
# clone
git clone https://github.com/GoldenThrust/The-imitation-game.git
cd ./The-imitation-game

# install
cd /backend
npm install
cd /frontend
npm install

cp .env.example .env

# run
cd /backend
npm run dev
cd /frontend
npm run dev
```


## Why this fits Turing's legacy

Alan Turing's 1950 paper *Computing Machinery and Intelligence* proposed the original "imitation game" as a way to ask whether a machine could think - not by inspecting its internals, but by seeing whether it could pass as human in conversation. This project turns that question into a survival stakes game: the cost of being wrong isn't an abstract philosophical puzzle, it's your settlement.

---

## Credits

Built by [Adeniji Olajide](https://github.com/goldenthrust)
