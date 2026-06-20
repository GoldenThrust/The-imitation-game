const players = Math.floor(Math.random() * 10) + 1;

const AIinRoom = Math.floor(players * (Math.random() * 0.3));

const human = players - AIinRoom;

console.log(`Players: ${players}, AI in Room: ${AIinRoom}, Human: ${human}`);

console.log()
