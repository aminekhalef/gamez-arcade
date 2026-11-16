export const PACO = 1;
export const BID_FACES = [2, 3, 4, 5, 6];
const ROLL_FACES = [PACO, ...BID_FACES];

export function startGame(random = Math.random) {
  return startRound({
    round: 0,
    players: ['You', 'Sofia', 'Mateo', 'Luna'].map((name, id) => ({
      id, name, count: 5, playedPalifico: false, roll: []
    }))
  }, 0, false, random);
}

function startRound(game, turn, palifico, random) {
  return {
    ...game,
    round: game.round + 1,
    turn,
    palifico,
    bid: null,
    result: null,
    players: game.players.map(player => ({
      ...player,
      roll: Array.from({ length: player.count }, () => ROLL_FACES[Math.floor(random() * ROLL_FACES.length)])
    }))
  };
}

export function nextSeat(game, seat) {
  for (let offset = 1; offset <= game.players.length; offset++) {
    const id = (seat + offset) % game.players.length;
    if (game.players[id].count > 0) return id;
  }
}

export function diceInPlay(game) {
  return game.players.reduce((sum, player) => sum + player.count, 0);
}

export function minimumBid(game, face) {
  const { bid, palifico } = game;
  if (!BID_FACES.includes(face) || game.result) return Infinity;
  if (!bid) return 1;
  if (palifico && face !== bid.face && !game.players[game.turn].playedPalifico) return Infinity;
  return face > bid.face ? bid.quantity : bid.quantity + 1;
}

export function legalBids(game) {
  const total = diceInPlay(game);
  return BID_FACES.flatMap(face => {
    const min = minimumBid(game, face);
    return min <= total
      ? Array.from({ length: total - min + 1 }, (_, i) => ({ face, quantity: min + i }))
      : [];
  });
}

export function placeBid(game, face, quantity) {
  if (!Number.isInteger(quantity) || quantity < minimumBid(game, face) || quantity > diceInPlay(game)) return game;
  return {
    ...game,
    bid: { face, quantity, player: game.turn },
    turn: nextSeat(game, game.turn)
  };
}

export function matches(die, face, palifico) {
  return die === face || (die === PACO && !palifico);
}

export function countMatches(roll, face, palifico) {
  return roll.filter(die => matches(die, face, palifico)).length;
}

export function challenge(game) {
  if (!game.bid || game.result) return game;
  const { face, quantity, player } = game.bid;
  const actual = game.players.reduce((sum, seat) => sum + countMatches(seat.roll, face, game.palifico), 0);
  return {
    ...game,
    result: {
      actual,
      challenger: game.turn,
      loser: actual >= quantity ? game.turn : player
    }
  };
}

export function finishRound(game, random = Math.random) {
  if (!game.result || game.winner !== undefined) return game;
  const { loser } = game.result;
  const players = game.players.map(player => ({
    ...player,
    playedPalifico: player.playedPalifico || (game.palifico && player.id === game.opener),
    count: player.count - Number(player.id === loser)
  }));
  const alive = players.filter(player => player.count);
  if (alive.length === 1) return { ...game, players, winner: alive[0].id };
  const next = { ...game, players };
  const opener = players[loser].count ? loser : nextSeat(next, loser);
  const palifico = alive.length > 2 && players[loser].count === 1 && !players[loser].playedPalifico;
  return { ...startRound(next, opener, palifico, random), opener };
}

export function probabilityOfBid({ face, quantity }, roll, hidden, palifico) {
  const needed = quantity - countMatches(roll, face, palifico);
  if (needed <= 0) return 1;
  if (needed > hidden) return 0;
  const rate = palifico ? 1 / 6 : 1 / 3;
  let probability = 0;
  let term = (1 - rate) ** hidden;
  for (let hits = 1; hits <= hidden; hits++) {
    term *= ((hidden - hits + 1) / hits) * (rate / (1 - rate));
    if (hits >= needed) probability += term;
  }
  return Math.min(1, probability);
}

export function chooseCpuMove({ roll, total, palifico, bid, options, seat, pressure = 0 }, random = Math.random) {
  const hidden = total - roll.length;
  const odds = candidate => probabilityOfBid(candidate, roll, hidden, palifico);
  const threshold = [0, .37, .25, .31][seat];
  if (bid && (options.length === 0 || odds(bid) + pressure < threshold + (random() - .5) * .20)) {
    return { type: 'dudo' };
  }
  let bestScore = -Infinity;
  let bestBid;
  for (const candidate of options) {
    const support = countMatches(roll, candidate.face, palifico);
    const matchOdds = odds(candidate);
    const preferredOdds = bid ? [.0, .61, .43, .52][seat] : .82;
    const fit = 1 - Math.abs(preferredOdds - matchOdds);
    const score = fit + support * .034 + random() * .13 - (matchOdds === 0 ? .8 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestBid = candidate;
    }
  }
  return { type: 'bid', ...bestBid };
}
