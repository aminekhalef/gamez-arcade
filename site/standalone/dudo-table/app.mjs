import {
  BID_FACES, PACO, startGame, diceInPlay, minimumBid, legalBids, placeBid,
  matches, countMatches, challenge, finishRound, chooseCpuMove
} from './engine.mjs';
import { dudoOnline } from './online.mjs?v=2';

const $ = id => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const diceShake = new Audio(new URL('./dice-shake.mp3', import.meta.url));
const dots = {
  2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
};
const colors = ['gold', 'rose', 'mint', 'lilac'];
const elements = ['seats', 'center', 'your-seat', 'controls', 'log', 'round-label', 'round-small', 'table-status'];
const view = Object.fromEntries(elements.map(id => [id, $(id)]));
let game;
let selection = null;
let history = [];
let previousBid = null;
let revealed = 0;
let revealOrder = [];
let revealDice = 0;
let timer;
let onlinePlaying = false;
let canAdvanceOnline = false;
let onlineHost = false;
let onlineBusy = false;

function dice(face, className = '', label = true) {
  const isPaco = face === PACO;
  const name = isPaco ? 'Paco joker' : 'Die showing ' + face;
  const attrs = label ? `role="img" aria-label="${name}"` : 'aria-hidden="true"';
  if (isPaco) {
    return `<span ${attrs} class="die paco ${className}">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#a13f27" d="M9 5h4c5.5 0 9 3 9 8.5H10z"/>
        <path fill="#35251f" d="M2 21V12a7 7 0 0 1 7-7h3v7c0 5-3 9-10 9z"/>
        <path fill="#fff4da" d="M5 12a4 4 0 0 1 4-4h2v3a5 5 0 0 1-6 5z"/>
        <circle cx="8.8" cy="10" r="1.2" fill="#35251f"/>
      </svg>
    </span>`;
  }
  return `<span ${attrs} class="die ${className}">${dots[face].map(dot =>
    `<i style="grid-area:${Math.floor(dot / 3) + 1}/${dot % 3 + 1}"></i>`).join('')}</span>`;
}

function bidText(bid) {
  return `${bid.quantity} ${bid.face}${bid.quantity === 1 ? '' : 's'}`;
}

function addLog(type, title, detail) {
  history.unshift({ type, title, detail });
  if (history.length > 8) history.pop();
}

function playDiceShake(onBlocked) {
  diceShake.currentTime = 0;
  diceShake.play().catch(error => {
    if (error.name === 'NotAllowedError') onBlocked?.();
  });
}

function start(onShakeBlocked) {
  clearTimeout(timer);
  game = startGame();
  history = [];
  previousBid = null;
  revealed = 0;
  revealOrder = [];
  addLog('roll', 'Dice rolled', '20 dice in play');
  playDiceShake(onShakeBlocked);
  prepareTurn();
}

function prepareTurn() {
  if (game.turn === 0 && !game.result && game.winner === undefined) {
    const roll = game.players[0].roll;
    selection = legalBids(game).reduce((best, bid) => {
      if (!best || bid.quantity < best.quantity) return bid;
      if (bid.quantity > best.quantity) return best;
      return countMatches(roll, bid.face, game.palifico) > countMatches(roll, best.face, game.palifico) ? bid : best;
    }, null);
  } else {
    selection = null;
  }
  render();
  if (!onlinePlaying && game.turn !== 0) timer = setTimeout(cpuTurn, 900 + Math.random() * 350);
}

function cpuMove(state, priorBid) {
  const { turn: seat, bid, palifico, players } = state;
  const voluntarySwitch = priorBid && bid && priorBid.face !== bid.face && bid.quantity > priorBid.quantity;
  return chooseCpuMove({
    roll: players[seat].roll, total: diceInPlay(state), palifico,
    bid, options: legalBids(state), seat, pressure: voluntarySwitch ? .04 : 0
  });
}

function cpuTurn() {
  const move = cpuMove(game, previousBid);
  if (move.type === 'dudo') beginReveal();
  else submitBid(move.face, move.quantity);
}

function submitBid(face, quantity) {
  const next = placeBid(game, face, quantity);
  if (next === game) return;
  previousBid = game.bid;
  game = next;
  addLog('bid', game.players[game.bid.player].name + (game.bid.player === 0 ? ' bid' : ' bids'), bidText(game.bid));
  prepareTurn();
}

function beginReveal() {
  const next = challenge(game);
  if (next === game) return;
  game = next;
  revealDice = diceInPlay(game);
  revealOrder = game.players.filter(player => player.count).map(player => player.id);
  revealed = 0;
  addLog('dudo', game.players[game.turn].name + (game.turn === 0 ? ' call Dudo' : ' calls Dudo'), `Challenge to ${bidText(game.bid)}`);
  render();
  timer = setTimeout(revealNext, reducedMotion.matches ? 0 : 340);
}

function revealNext() {
  revealed++;
  if (revealed < revealOrder.length) {
    render();
    timer = setTimeout(revealNext, reducedMotion.matches ? 0 : 420);
    return;
  }
  const { loser, actual } = game.result;
  const player = game.players[loser];
  addLog('loss', loser === 0 ? 'You lose a die' : player.name + ' loses a die', `${actual} matched · ${player.count === 1 ? 'Eliminated' : (player.count - 1) + ' remaining'}`);
  render();
  if (humanJustEliminated()) timer = setTimeout(advance, 650);
}

function advance() {
  if (!revealDone() || game.winner !== undefined) return;
  clearTimeout(timer);
  const next = finishRound(game);
  if (next.winner !== undefined) {
    showWinner(next);
    return;
  }
  if (next.players[0].count === 0) {
    finishCpuMatch(next);
    return;
  }
  game = next;
  previousBid = null;
  revealed = 0;
  revealOrder = [];
  addLog('roll', game.palifico ? 'Palifico round' : 'Dice rolled', `${diceInPlay(game)} dice in play`);
  playDiceShake();
  prepareTurn();
}

function finishCpuMatch(state) {
  const firstRound = state.round;
  while (state.winner === undefined) {
    let priorBid = null;
    while (!state.result) {
      const move = cpuMove(state, priorBid);
      priorBid = state.bid;
      state = move.type === 'dudo' ? challenge(state) : placeBid(state, move.face, move.quantity);
    }
    state = finishRound(state);
  }

  const rounds = state.round - firstRound + 1;
  revealOrder = [];
  revealed = 0;
  addLog('roll', 'CPU play complete', `${rounds} ${rounds === 1 ? 'round' : 'rounds'} played automatically`);
  showWinner(state);
}

function showWinner(state) {
  game = state;
  addLog('win', game.winner === 0 ? 'You win the table' : `${game.players[game.winner].name} wins the table`, 'Last player with dice');
  render();
}

function revealDone() {
  return game.result && revealOrder.length > 0 && revealed === revealOrder.length;
}

function humanJustEliminated() {
  return !onlinePlaying && revealDone() && game.result.loser === 0 && game.players[0].count === 1;
}

function isRevealed(seat) {
  const index = revealOrder.indexOf(seat);
  return !!game.result && index >= 0 && index < revealed;
}

function rollMarkup(player) {
  const countable = isRevealed(player.id);
  return player.roll.map(face => dice(face, countable ? (matches(face, game.bid.face, game.palifico) ? 'match' : 'miss') : '')).join('');
}

function renderSeats() {
  view.seats.innerHTML = game.players.slice(1).map(player => {
    const open = isRevealed(player.id);
    const lifting = !onlinePlaying && open && revealOrder[revealed - 1] === player.id && game.winner === undefined;
    const loser = revealDone() && game.result.loser === player.id;
    const active = !game.result && player.id === game.turn;
    const count = player.count - Number(loser && game.winner === undefined);
    const out = player.count === 0 && !open;
    return `<article class="seat ${colors[player.id]} ${active ? 'active' : ''} ${out ? 'out' : ''}" aria-label="${player.name}">
      <div class="seat-name"><span class="avatar" aria-hidden="true">${player.initial ?? player.name[0]}</span><span>${player.name}<small>${out ? 'Eliminated' : active ? (player.human ? 'Their turn' : 'Thinking…') : (player.human ? 'Player' : 'CPU')}</small></span></div>
      <div class="cup-area ${lifting ? 'lifting' : open ? 'settled' : ''}">
        ${out ? '<span class="empty-seat" aria-hidden="true">—</span>' : `<div class="cup" aria-hidden="true"><i></i></div>`}
        ${open ? `<div class="rival-roll">${rollMarkup(player)}</div>` : ''}
      </div>
      <span class="seat-count ${loser ? 'lost' : ''}">${count} ${count === 1 ? 'die' : 'dice'}${loser ? ' · −1' : ''}</span>
    </article>`;
  }).join('');

  const player = game.players[0];
  const loser = revealDone() && game.result.loser === 0;
  const count = player.count - Number(loser && game.winner === undefined);
  view['your-seat'].innerHTML = `<div class="self-label"><span class="avatar">Y</span><div><b>Your dice</b><small>${count ? 'Visible only to you during bidding' : 'Eliminated'}</small></div></div>
    <div class="own-roll">${player.count || isRevealed(0) ? rollMarkup(player) : ''}</div>
    <span class="own-count ${loser ? 'lost' : ''}">${count} ${count === 1 ? 'die' : 'dice'}${loser ? ' · −1' : ''}</span>`;
}

function renderCenter() {
  if (game.winner !== undefined) {
    view.center.innerHTML = `<div class="center-caption">Match over</div><strong class="result-title">${game.winner === 0 ? 'You win!' : game.players[game.winner].name + ' wins!'}</strong><p>Last player with dice</p>`;
    return;
  }
  if (!game.bid) {
    view.center.innerHTML = `<div class="center-caption">Opening bid</div><strong class="result-title">${game.turn === 0 ? 'Your call' : game.players[game.turn].name + ' opens'}</strong><p>${game.turn === 0 ? 'Choose a face and quantity below.' : 'Waiting for the first bid…'}</p>`;
    return;
  }
  if (!game.result) {
    view.center.innerHTML = `<div class="center-caption">Current bid</div><div class="bid-readout"><strong>${game.bid.quantity} <span>×</span></strong>${dice(game.bid.face)}</div><p>Bid by ${game.bid.player === 0 ? 'you' : game.players[game.bid.player].name}</p>`;
    return;
  }
  const bid = game.bid;
  const currentMatches = revealOrder.slice(0, revealed).reduce((sum, id) =>
    sum + countMatches(game.players[id].roll, bid.face, game.palifico), 0);
  const done = revealDone();
  const loser = game.result.loser;
  const held = game.result.actual >= bid.quantity;
  const status = done ? (held ? 'Bid holds' : 'Bluff called') : 'Dudo! Revealing';
  view.center.innerHTML = `<div class="center-caption ${done && !held ? 'red-text' : ''}">${status}</div>
    <div class="reveal-score"><strong>${currentMatches}</strong><span>/ ${bid.quantity} needed</span>${dice(bid.face)}</div>
    <p>${done ? (loser === 0 ? 'You lose one die.' : game.players[loser].name + ' loses one die.') : 'Counting matching dice…'}</p>`;
}

function renderControls() {
  if (game.winner !== undefined) {
    const canReplay = !onlinePlaying || onlineHost;
    view.controls.innerHTML = `<div><h2>Match complete</h2><p>${canReplay ? 'Start a fresh table with five dice each.' : 'The host can start a rematch.'}</p></div>${canReplay ? '<button class="primary" data-action="play-again">Play again <span aria-hidden="true">↻</span></button>' : ''}`;
    return;
  }
  if (humanJustEliminated()) {
    view.controls.innerHTML = '<div><h2>You’re eliminated</h2><p>Finishing the match automatically…</p></div><span class="waiting" aria-hidden="true"><i></i><i></i><i></i></span>';
    return;
  }
  if (game.result) {
    const done = revealDone();
    const finalRound = done && game.players.filter(player => player.count > 0).length === 2 && game.players[game.result.loser].count === 1;
    view.controls.innerHTML = `<div><h2>${done ? 'Round complete' : 'Cups coming up'}</h2><p>${done ? `The bid was ${bidText(game.bid)}. ${game.result.actual} matched.` : 'Watch for the dice that count toward the bid.'}</p></div>
      <button class="primary" data-action="next" ${done && (!onlinePlaying || canAdvanceOnline) ? '' : 'disabled'}>${finalRound ? 'See winner' : 'Next round'} <span aria-hidden="true">→</span></button>`;
    return;
  }
  if (game.turn !== 0) {
    view.controls.innerHTML = `<div><h2>${game.players[game.turn].name}’s turn</h2><p>Watch the table as the bidding continues.</p></div><span class="waiting" aria-hidden="true"><i></i><i></i><i></i></span>`;
    return;
  }
  const total = diceInPlay(game);
  view.controls.innerHTML = `<div class="controls-heading"><div><h2>Your turn</h2><p>${game.bid ? 'Raise the bid or challenge it.' : 'Make the first bid of this round.'}</p></div><span class="turn-tag"><i></i> Your move</span></div>
    <div class="bid-controls">
      <div class="choice-group"><span class="control-label">Quantity</span>
        <div class="stepper"><button data-action="minus" aria-label="Decrease quantity" ${selection && selection.quantity > minimumBid(game, selection.face) ? '' : 'disabled'}>−</button><output>${selection?.quantity ?? '–'}</output><button data-action="plus" aria-label="Increase quantity" ${selection && selection.quantity < total ? '' : 'disabled'}>+</button></div>
      </div>
      <div class="choice-group"><span class="control-label">Die face</span><div class="face-buttons" role="group" aria-label="Die face">${BID_FACES.map(face =>
        `<button data-face="${face}" aria-label="${face}" aria-pressed="${selection?.face === face}" ${minimumBid(game, face) > total ? 'disabled' : ''}>${dice(face, '', false)}</button>`).join('')}</div></div>
      <div class="action-buttons">
        <button class="danger" data-action="dudo" ${game.bid ? '' : 'disabled'}>Dudo!</button>
        <button class="primary" data-action="bid" ${selection ? '' : 'disabled'}>${selection ? 'Bid ' + bidText(selection) : 'Place bid'} <span aria-hidden="true">→</span></button>
      </div>
    </div>`;
}

function render() {
  const tableDice = game.result && game.winner === undefined ? revealDice : diceInPlay(game);
  view['round-label'].textContent = `Round ${game.round}`;
  view['round-small'].textContent = `Round ${game.round}`;
  view['table-status'].innerHTML = `<span class="${game.palifico ? 'special' : ''}"><i></i>${game.palifico ? 'Palifico · Pacos aren’t wild' : 'Pacos are wild'}</span><span>${tableDice} ${tableDice === 1 ? 'die' : 'dice'} in play</span>`;
  renderSeats();
  renderCenter();
  renderControls();
  const icons = { roll: '↻', bid: '↗', dudo: '!', loss: '−', win: '✦' };
  view.log.innerHTML = history.map(({ type, title, detail }) => `<li class="${type}"><span class="log-icon" aria-hidden="true">${icons[type]}</span><div><b>${title}</b><small>${detail}</small></div></li>`).join('');
}

view.controls.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || onlineBusy) return;
  const { action, face } = button.dataset;
  if (action === 'play-again') return onlinePlaying ? sendMove('rematch') : start();
  if (action === 'next') return onlinePlaying ? sendMove('next_round') : advance();
  if (game.turn !== 0 || game.result) return;
  if (action === 'bid' && selection) return onlinePlaying ? sendMove('bid', selection) : submitBid(selection.face, selection.quantity);
  if (action === 'dudo') return onlinePlaying ? sendMove('challenge') : beginReveal();
  if (face) {
    const selectedFace = Number(face);
    selection = { face: selectedFace, quantity: minimumBid(game, selectedFace) };
  } else if (selection && (action === 'plus' || action === 'minus')) {
    selection.quantity += action === 'plus' ? 1 : -1;
  }
  renderControls();
  const focus = face ? `[data-face="${face}"]` : `[data-action="${action}"]`;
  const control = view.controls.querySelector(focus);
  (control?.disabled ? view.controls.querySelector('[data-action="bid"]') : control)?.focus();
});

$('rules-btn').addEventListener('click', () => $('rules').showModal());
$('new-btn').addEventListener('click', () => $('restart').showModal());
$('confirm-new').addEventListener('click', () => {
  $('restart').close();
  start();
});
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => $(button.dataset.close).close());
});
$('quick-die').innerHTML = dice(PACO);
start(() => {
  document.addEventListener('click', () => {
    if (!onlinePlaying && game.round === 1 && !game.bid && !game.result) playDiceShake();
  }, { capture: true, once: true });
});

const roomDialog = $('online-room');
const roomEntry = $('room-entry');
let connectionMessage = '';
let moveMessage = '';

function showMessage(element, message) {
  if (element.textContent !== message) element.textContent = message;
  element.hidden = !message;
}

function setConnection(message) {
  connectionMessage = message;
  showMessage($('online-status'), moveMessage || connectionMessage);
}

function escapeText(value) {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML.replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function displayRoom(room, playerId, changed) {
  const lobby = room?.phase === 'lobby';
  const finished = room?.phase === 'finished';
  onlineHost = room?.hostId === playerId;
  $('room-info').hidden = !room;
  roomEntry.hidden = !!room;
  $('online-btn').textContent = room ? `Room ${room.code}` : 'Play online';
  $('new-btn').hidden = !!room?.dudo;
  if (room) {
    $('copy-code').textContent = room.code;
    $('invite-actions').hidden = !lobby;
    $('start-room').hidden = !lobby || !onlineHost;
    $('leave-room').hidden = !lobby && !finished;
    const roster = Array.from({ length: 4 }, (_, seat) => {
      const player = room.players[seat];
      const item = document.createElement('li');
      item.textContent = player ? `${player.name}${player.id === playerId ? ' (you)' : ''}${player.id === room.hostId ? ' · Host' : ''}` : 'CPU seat';
      return item;
    });
    $('room-players').replaceChildren(...roster);
    $('room-note').textContent = lobby
      ? (onlineHost ? 'Share the code, then start when everyone is ready.' : 'Waiting for the host to start.')
      : (finished ? 'The match is complete.' : 'The match is in progress.');
  }
  if (!room?.dudo) {
    if (onlinePlaying) {
      onlinePlaying = false;
      moveMessage = '';
      setConnection('');
      $('game-mode').textContent = 'Solo · 3 CPU opponents';
      start();
    }
    return;
  }
  const firstOnlineTurn = !onlinePlaying;
  onlinePlaying = true;
  if (firstOnlineTurn) {
    clearTimeout(timer);
    roomDialog.close();
    $('restart').close();
    const humans = room.players.length;
    $('game-mode').textContent = `Online · ${humans} ${humans === 1 ? 'player' : 'players'} · ${4 - humans} CPU`;
  }
  const wasReady = canAdvanceOnline;
  canAdvanceOnline = room.dudo.canAdvance;
  if (!changed && !firstOnlineTurn) {
    if (wasReady !== canAdvanceOnline) renderControls();
    return;
  }
  // Rotate seats on each screen so the viewer always occupies the bottom seat.
  const self = room.players.findIndex(player => player.id === playerId);
  const remote = room.dudo.game;
  const roundStarted = !remote.result && remote.winner === undefined &&
    (firstOnlineTurn || remote.round !== game.round || game.winner !== undefined);
  const localSeat = seat => (seat - self + remote.players.length) % remote.players.length;
  const players = remote.players.map(player => ({
    ...player,
    id: localSeat(player.id),
    name: escapeText(player.name),
    initial: escapeText(Array.from(player.name)[0]),
    human: player.id < room.players.length,
  })).sort((a, b) => a.id - b.id);
  game = {
    ...remote,
    players,
    turn: localSeat(remote.turn),
    bid: remote.bid && { ...remote.bid, player: localSeat(remote.bid.player) },
    result: remote.result && { ...remote.result, loser: localSeat(remote.result.loser) },
    winner: remote.winner === undefined ? undefined : localSeat(remote.winner),
  };
  history = room.dudo.log.map(entry => ({ ...entry, title: escapeText(entry.title), detail: escapeText(entry.detail) }));
  revealOrder = game.result ? players.filter(player => player.roll.length).map(player => player.id) : [];
  revealed = revealOrder.length;
  revealDice = diceInPlay(game);
  if (roundStarted) playDiceShake();
  prepareTurn();
}

const online = dudoOnline({ onChange: displayRoom, onConnection: setConnection });

async function roomTask(task, status) {
  if (onlineBusy) return;
  onlineBusy = true;
  if (status === $('online-status')) {
    moveMessage = '';
    showMessage(status, connectionMessage);
  } else showMessage(status, '');
  try {
    await task();
  } catch (error) {
    if (status === $('online-status')) moveMessage = error.message;
    showMessage(status, error.message);
  } finally {
    onlineBusy = false;
  }
}

function sendMove(action, payload) {
  return roomTask(() => online.action(action, payload), $('online-status'));
}

$('online-btn').addEventListener('click', () => {
  showMessage($('room-error'), '');
  roomDialog.showModal();
});
roomEntry.addEventListener('submit', event => {
  event.preventDefault();
  const intent = event.submitter?.value ?? (inviteCode ? 'join' : 'create');
  const name = $('room-name').value.trim();
  const code = $('room-code').value.trim().toUpperCase();
  if (!name) return showMessage($('room-error'), 'Enter your display name.');
  if (intent === 'join' && !/^[A-Z2-9]{6}$/.test(code)) return showMessage($('room-error'), 'Enter the six-character room code.');
  void roomTask(() => online.enter(intent, name, code), $('room-error'));
});
$('start-room').addEventListener('click', () => {
  void roomTask(() => online.action('start'), $('room-error'));
});
$('leave-room').addEventListener('click', () => {
  if (online.room?.phase === 'finished') online.leave();
  else void roomTask(() => online.action('leave_lobby'), $('room-error'));
});
$('copy-code').addEventListener('click', () => {
  void roomTask(async () => {
    await navigator.clipboard.writeText(online.room.code);
    showMessage($('room-error'), 'Room code copied.');
  }, $('room-error'));
});
function inviteUrl() {
  const url = new URL('../../games/liars-dice/', location.href);
  url.searchParams.set('room', online.room.code);
  return url.href;
}

async function copyInvite() {
  try {
    await navigator.clipboard.writeText(inviteUrl());
    showMessage($('room-error'), 'Invite link copied.');
  } catch {
    showMessage($('room-error'), 'Could not copy the link. Share room code ' + online.room.code + ' instead.');
  }
}

$('copy-invite').addEventListener('click', copyInvite);
$('share-invite').hidden = typeof navigator.share !== 'function';
$('share-invite').addEventListener('click', async () => {
  try {
    await navigator.share({ url: inviteUrl() });
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) await copyInvite();
  }
});

const requestedRoom = new URLSearchParams(location.search).get('room')?.trim().toUpperCase() ?? '';
const inviteCode = /^[A-Z2-9]{6}$/.test(requestedRoom) ? requestedRoom : '';
if (inviteCode) {
  $('room-code').value = inviteCode;
  roomEntry.querySelector('[value="create"]').remove();
  roomDialog.showModal();
  online.resume(inviteCode);
} else {
  online.resume();
}
