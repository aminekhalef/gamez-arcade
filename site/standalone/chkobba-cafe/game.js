"use strict";

const suits = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
const ranks = ["A", "2", "3", "4", "5", "6", "7", "Q", "J", "K"];
const deckCards = Object.keys(suits).flatMap(suit =>
  ranks.map((rank, index) => ({ id: rank + suit, rank, suit, value: index + 1 }))
);

function shuffledDeck(random) {
  const cards = [...deckCards];
  for (let index = cards.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

function startRound(match, random = Math.random) {
  let deck, table;
  do {
    deck = shuffledDeck(random);
    table = deck.splice(0, 4);
  } while (table.some(card => table.filter(other => other.value === card.value).length >= 3));

  match.round++;
  match.current = {
    deck, table, hands: [[], []], piles: [[], []], sweeps: [0, 0],
    turn: (match.round - 1) % 2, lastCapture: null, result: null, winner: null
  };
  deal(match.current);
}

function deal(round) {
  round.hands = [round.deck.splice(0, 3), round.deck.splice(0, 3)];
}

function captures(card, table) {
  const options = [];
  function visit(start, remaining, picked) {
    if (!remaining) {
      options.push(picked);
      return;
    }
    for (let index = start; index < table.length; index++) {
      const next = table[index];
      if (next.value <= remaining) visit(index + 1, remaining - next.value, [...picked, next]);
    }
  }
  visit(0, card.value, []);
  return options;
}

function sameCards(cards, ids) {
  return cards.length === ids.length && cards.every(card => ids.includes(card.id));
}

function tally(round) {
  const counts = round.piles.map(pile => ({
    cards: pile.length,
    diamonds: pile.filter(card => card.suit === "♦").length,
    sevens: pile.filter(card => card.value === 7).length,
    sixes: pile.filter(card => card.value === 6).length,
    hayya: Number(pile.some(card => card.id === "7♦"))
  }));
  function majority(left, right) {
    return [Number(left > right), Number(right > left)];
  }
  const [a, b] = counts;
  const rows = [
    ["Karta", ...majority(a.cards, b.cards)],
    ["Dineri", ...majority(a.diamonds, b.diamonds)],
    ["Bermila", ...majority(a.sevens * 5 + a.sixes, b.sevens * 5 + b.sixes)],
    ["7ayya", a.hayya, b.hayya],
    ["Chkobba", ...round.sweeps]
  ];
  const points = [0, 0];
  for (const [, left, right] of rows) {
    points[0] += left;
    points[1] += right;
  }
  return { rows, points };
}

function playMove(match, player, cardId, targetIds) {
  const round = match.current;
  if (round.result || round.turn !== player) return null;
  const hand = round.hands[player];
  const card = hand.find(item => item.id === cardId);
  if (!card) return null;
  const options = captures(card, round.table);
  const chosen = options.find(option => sameCards(option, targetIds));
  if (options.length ? !chosen : targetIds.length > 0) return null;
  const final = !round.deck.length && round.hands.flat().length === 1;
  const sweep = Boolean(chosen && chosen.length === round.table.length && !final);

  hand.splice(hand.indexOf(card), 1);
  if (chosen) {
    round.piles[player].push(card, ...chosen);
    round.table = round.table.filter(item => !chosen.includes(item));
    round.lastCapture = player;
    if (sweep) round.sweeps[player]++;
  } else {
    round.table.push(card);
  }

  if (final) {
    if (round.lastCapture !== null) round.piles[round.lastCapture].push(...round.table);
    round.table = [];
    round.result = tally(round);
    match.scores = match.scores.map((score, index) => score + round.result.points[index]);
    const [you, bot] = match.scores;
    if (Math.max(you, bot) >= match.target && you !== bot) round.winner = you > bot ? 0 : 1;
  } else {
    if (round.hands.every(cards => cards.length === 0)) deal(round);
    round.turn = 1 - player;
  }

  return { card, chosen, sweep };
}

function computerMove(round) {
  const final = !round.deck.length && round.hands.flat().length === 1;
  const moves = round.hands[1].flatMap(card => {
    const options = captures(card, round.table);
    return (options.length ? options : [[]]).map(taken => {
      const captured = taken.length ? [card, ...taken] : [];
      const rest = taken.length ? round.table.filter(item => !taken.includes(item)) : [...round.table, card];
      const sum = rest.reduce((total, item) => total + item.value, 0);
      const sweep = taken.length > 0 && rest.length === 0 && !final;
      const value = captured.reduce((total, item) => total + 1 + (item.suit === "♦" ? 2 : 0)
        + (item.value === 7 ? 2 : 0) + (item.id === "7♦" ? 10 : 0), 0);
      const risk = rest.length && sum <= 10 && !final ? 4 : 0;
      return { card, taken, score: value + (sweep ? 15 : 0) - risk };
    });
  });
  return moves.reduce((best, move) => move.score > best.score ? move : best);
}

if (typeof document !== "undefined") {
  const get = id => document.getElementById(id);
  const target = get("target");
  const play = get("play");
  const restart = get("restart");
  const celebration = get("celebration");
  const sound = get("sound");
  const shake = get("shake");
  const dealLayer = get("deal-layer");
  const board = get("board");
  const rankNames = { A: "Ace", Q: "Queen", J: "Jack", K: "King" };
  let match, selected, selectedIds, log, botTimer, botMove, motion, requestedTarget;
  let celebrationTimer;
  let tableShake, callout;
  let roundIntro = null;
  let previousSpecial, audio;
  let soundOn = true;
  let shakePreference;
  const activeTones = new Set();
  try { soundOn = localStorage.getItem("chkobba-sound") !== "off"; } catch {}
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  try { shakePreference = localStorage.getItem("chkobba-shake"); } catch {}

  function shakeEnabled() {
    return shakePreference ? shakePreference === "on" : !reduceMotion.matches;
  }

  function updateShakeButton() {
    const enabled = shakeEnabled();
    shake.textContent = enabled ? "Shake on" : "Shake off";
    shake.setAttribute("aria-pressed", String(enabled));
  }

  function cardName(card) {
    return (rankNames[card.rank] ?? card.rank) + " of " + suits[card.suit];
  }

  function resetSelection() {
    selected = null;
    selectedIds = [];
  }

  function newMatch(goal) {
    clearTimeout(botTimer);
    motion?.animations.forEach(animation => animation.cancel());
    match = { target: goal, scores: [0, 0], round: 0, current: null };
    target.value = String(goal);
    nextRound();
  }

  function nextRound() {
    tableShake?.cancel();
    stopCallout();
    roundIntro?.animations.forEach(animation => animation.cancel());
    dealLayer.replaceChildren();
    roundIntro = !reduceMotion.matches && typeof dealLayer.animate === "function"
      ? { label: "Shuffling cards…", animations: [] } : null;
    startRound(match);
    resetSelection();
    clearTimeout(celebrationTimer);
    celebration.replaceChildren();
    previousSpecial = [false, false];
    log = [];
    botMove = null;
    motion = null;
    render();
    if (roundIntro) animateDeal(roundIntro);
    else scheduleBot();
  }

  function cardBack() {
    const back = document.createElement("div");
    back.className = "card back";
    back.textContent = "✦";
    back.setAttribute("aria-hidden", "true");
    return back;
  }

  async function animateDeal(intro) {
    const table = [...get("table").children];
    const hand = [...get("hand").children];
    const bot = [...get("bot").children];
    const destinations = [...table, ...hand.flatMap((card, index) => [card, bot[index]])];
    destinations.forEach(card => { card.style.visibility = "hidden"; });

    const layer = dealLayer.getBoundingClientRect();
    const tableArea = get("table").getBoundingClientRect();
    const center = { x: layer.width / 2, y: tableArea.top - layer.top + tableArea.height / 2 };
    function animateBack(frames, options, destination) {
      const card = cardBack();
      card.classList.add("dealing-back");
      card.style.left = center.x + "px";
      card.style.top = center.y + "px";
      dealLayer.append(card);
      const animation = card.animate(frames, { fill: "both", ...options });
      intro.animations.push(animation);
      return animation.finished.catch(() => {}).then(() => {
        if (!destination || roundIntro !== intro) return;
        card.remove();
        destination.style.visibility = "";
      });
    }

    const stack = "translate(-50%, -50%)";
    await Promise.all(Array.from({ length: 8 }, (_, index) => {
      const side = index % 2 ? 1 : -1;
      const offset = Math.floor(index / 2);
      return animateBack([
        { transform: stack + ` translate(${offset * 2}px, ${-offset * 2}px)` },
        { transform: stack + ` translate(${side * (55 + offset * 4)}px, ${offset * -4}px) rotate(${side * 18}deg)`, offset: .38 },
        { transform: stack + ` translate(${side * 15}px, ${offset * -2}px) rotate(${side * 7}deg)`, offset: .74 },
        { transform: stack + ` translate(${offset}px, ${-offset}px)` }
      ], { duration: 1050 + offset * 50, easing: "ease-in-out" });
    }));
    if (roundIntro !== intro) return;

    intro.label = "Dealing cards…";
    get("status").textContent = intro.label;
    // Leave a small draw stack on the felt while the opening cards travel.
    while (dealLayer.children.length > 3) dealLayer.lastElementChild.remove();
    await Promise.all(destinations.map((card, index) => {
      const rect = card.getBoundingClientRect();
      const x = rect.left - layer.left + rect.width / 2 - center.x;
      const y = rect.top - layer.top + rect.height / 2 - center.y;
      return animateBack([
        { transform: stack, opacity: 0 },
        { transform: stack + ` translate(${x * .16}px, ${y * .16 - 10}px) rotate(-9deg)`, opacity: 1, offset: .2 },
        { transform: stack + ` translate(${x}px, ${y}px)`, opacity: 1 }
      ], { duration: 450, delay: index * 150, easing: "cubic-bezier(.2,.65,.35,1)" }, card);
    }));
    if (roundIntro !== intro) return;
    dealLayer.replaceChildren();
    roundIntro = null;
    render();
    scheduleBot();
  }

  function cardFace(card, element) {
    element.className = "card";
    if (card.suit === "♦" || card.suit === "♥") element.classList.add("red");
    element.setAttribute("aria-label", cardName(card) + ", value " + card.value);
    const svgNamespace = "http://www.w3.org/2000/svg";
    const artwork = document.createElementNS(svgNamespace, "svg");
    artwork.setAttribute("class", "card-art");
    artwork.setAttribute("viewBox", "0 0 169.075 244.640");
    artwork.setAttribute("preserveAspectRatio", "none");
    artwork.setAttribute("aria-hidden", "true");
    artwork.setAttribute("focusable", "false");
    const face = document.createElementNS(svgNamespace, "use");
    face.setAttribute("href", "#card-" + card.rank + "-" + suits[card.suit]);
    artwork.append(face);
    element.append(artwork);
  }

  function cardButton(card, { disabled, selected: active, pickable, onClick }) {
    const button = document.createElement("button");
    cardFace(card, button);
    button.type = "button";
    if (active) button.classList.add("selected");
    if (pickable) button.classList.add("pickable");
    button.setAttribute("aria-pressed", String(Boolean(active)));
    button.disabled = disabled;
    button.addEventListener("click", onClick);
    return button;
  }

  function updateSelection(cardId, area) {
    render();
    findCard(area, cardId)?.focus();
  }

  function findCard(area, cardId) {
    return [...get(area).children].find(element => element.dataset.card === cardId);
  }

  function render() {
    const round = match.current;
    const ready = !roundIntro && !motion && !round.result && round.turn === 0;
    const options = selected ? captures(selected, round.table) : [];
    const complete = options.some(option => sameCards(option, selectedIds));
    get("round").textContent = "Round " + match.round;
    get("deck").textContent = round.deck.length + " cards in deck";
    get("your-score").textContent = match.scores[0];
    get("bot-score").textContent = match.scores[1];
    get("goal").textContent = "Target · " + match.target;
    get("sweeps").textContent = "Sweeps · " + round.sweeps.join("–");
    for (const [player, id] of ["your-pile", "bot-pile"].entries()) {
      const count = round.piles[player].length;
      get(id).textContent = count;
      get(id).setAttribute("aria-label", count + " captured cards");
    }
    const hiddenCount = round.hands[1].length - Number(motion?.player === 1);
    get("bot").replaceChildren(...Array.from({ length: hiddenCount }, cardBack));
    get("bot").setAttribute("aria-label", hiddenCount + " hidden cards in computer hand");
    const played = get("bot-played");
    if (botMove) {
      const face = document.createElement("div");
      face.setAttribute("role", "img");
      cardFace(botMove, face);
      played.replaceChildren(face);
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "card-slot";
      placeholder.textContent = "—";
      played.replaceChildren(placeholder);
    }
    get("hand").replaceChildren(...round.hands[0].filter(card => card !== motion?.card).map(card => {
      const button = cardButton(card, {
        disabled: !ready, selected: selected === card,
        onClick() {
          selected = selected === card ? null : card;
          selectedIds = [];
          if (selected) {
            const choices = captures(card, round.table);
            if (choices.length === 1) selectedIds = choices[0].map(item => item.id);
          }
          updateSelection(card.id, "hand");
        }
      });
      button.dataset.card = card.id;
      return button;
    }));
    get("table").replaceChildren(...round.table.map(card => {
      const active = selectedIds.includes(card.id);
      const pickable = options.some(option => option.includes(card)
        && selectedIds.every(id => option.some(item => item.id === id)));
      const button = cardButton(card, {
        disabled: !ready || (!active && !pickable), selected: active, pickable,
        onClick() {
          selectedIds = active ? selectedIds.filter(id => id !== card.id) : [...selectedIds, card.id];
          updateSelection(card.id, "table");
        }
      });
      if (motion?.arrived && motion.taken.includes(card)) button.classList.add("capture-target");
      button.dataset.card = card.id;
      return button;
    }));
    if (motion) {
      const staged = document.createElement("div");
      staged.setAttribute("role", "img");
      cardFace(motion.card, staged);
      staged.classList.add("played-card");
      staged.dataset.card = motion.card.id;
      get("table").append(staged);
    } else if (!round.table.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "The table is clear";
      get("table").append(empty);
    }

    play.textContent = "Play card";
    play.disabled = !ready || !selected || (options.length > 0 && !complete);
    let status;
    if (roundIntro) {
      status = roundIntro.label;
    } else if (round.result) {
      play.disabled = false;
      play.textContent = round.winner === null ? "Next round" : "Play again";
      if (round.winner !== null) {
        status = round.winner === 0 ? "You won the match!" : "The computer won the match.";
      } else if (match.scores[0] >= match.target && match.scores[0] === match.scores[1]) {
        status = "Match tied at the target. Play another round.";
      } else {
        status = "Round complete. See the scorecard for your points.";
      }
    } else if (motion) {
      const { card, taken, player, arrived } = motion;
      status = (player === 0 ? "You play " : "Computer plays ") + cardName(card);
      status += arrived && taken.length
        ? (player === 0 ? " and take " : " and takes ") + taken.map(cardName).join(" + ") + "." : ".";
    } else if (!ready) {
      status = "Computer’s turn…";
    } else if (!selected) {
      status = "Your turn. Choose a card from your hand.";
    } else if (!options.length) {
      status = "This card goes on the table.";
      play.textContent = "Lay card";
    } else if (complete) {
      status = selectedIds.length === round.table.length && (round.deck.length || round.hands.flat().length > 1)
        ? "Clear the table for a Chkobba!"
        : "Capture " + selectedIds.length + (selectedIds.length === 1 ? " card." : " cards.");
      play.textContent = "Capture";
    } else {
      status = "Choose a matching card or cards totaling " + selected.value + ".";
      play.textContent = "Capture";
    }
    get("status").textContent = status;
    get("score-empty").hidden = Boolean(match.lastResult);
    get("breakdown").hidden = !match.lastResult;
    if (match.lastResult) {
      const { rows, points, number } = match.lastResult;
      get("round-heading").textContent = "Round " + number + " scorecard";
      get("details").replaceChildren(...[...rows, ["Total", ...points]].map(values => {
        const row = document.createElement("tr");
        for (const value of values) row.insertCell().textContent = value;
        return row;
      }));
    } else {
      get("round-heading").textContent = "Round scorecard";
    }
    get("log").replaceChildren(...(log.length ? log : ["Moves appear here as you play."]).map(line => {
      const entry = document.createElement("p");
      entry.className = "small";
      entry.textContent = line;
      return entry;
    }));
  }

  function unlockSound() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!soundOn || !Audio) return;
    try {
      audio ??= new Audio();
      if (audio.state !== "running") audio.resume().catch(() => {});
    } catch {}
  }

  function updateSoundButton() {
    sound.textContent = soundOn ? "Sound on" : "Sound off";
    sound.setAttribute("aria-pressed", String(soundOn));
  }

  function playTone(frequency, delay, duration, type, peak, endFrequency = frequency) {
    if (!soundOn || audio?.state !== "running") return;
    const start = audio.currentTime + delay;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    const end = start + duration;
    tone.type = type;
    tone.frequency.setValueAtTime(frequency, start);
    tone.frequency.exponentialRampToValueAtTime(endFrequency, end);
    volume.gain.setValueAtTime(.001, start);
    volume.gain.exponentialRampToValueAtTime(peak, start + Math.min(.018, duration / 4));
    volume.gain.exponentialRampToValueAtTime(.001, end);
    tone.connect(volume);
    volume.connect(audio.destination);
    activeTones.add(tone);
    tone.onended = () => activeTones.delete(tone);
    tone.start(start);
    tone.stop(end);
  }

  function playCelebrationSound(hayya, sweep, savage) {
    const notes = savage ? [392, 523.25, 659.25, 783.99, 1046.5]
      : hayya && sweep ? [523.25, 659.25, 783.99, 1046.5]
      : sweep ? [392, 523.25, 659.25, 783.99] : [659.25, 987.77, 1318.51];
    notes.forEach((frequency, index) => {
      playTone(frequency, index * .075, index === notes.length - 1 ? .28 : .16,
        sweep || savage ? "triangle" : "sine", .11);
    });
    if (sweep) {
      playTone(125, 0, .19, "triangle", .16, 56);
      playTone(380, .13, .065, "triangle", .07, 160);
      playTone(125, .25, .18, "triangle", .13, 56);
    }
  }

  function stopCallout() {
    if (!callout) return;
    callout = null;
    window.speechSynthesis.cancel();
  }

  function speakTunisian(text, player) {
    const speech = window.speechSynthesis;
    if (!soundOn || !speech || !window.SpeechSynthesisUtterance) return;
    const voices = speech.getVoices();
    const tunisian = voices.filter(voice => /^(?:ar-TN|aeb)(?:-|$)/i.test(voice.lang.replaceAll("_", "-")));
    const available = tunisian.length ? tunisian : voices.filter(voice => /^ar(?:[-_]|$)/i.test(voice.lang));
    const voice = available[player] ?? available[0];
    if (!voice) return;
    stopCallout();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 1;
    utterance.pitch = player === 0 ? 1.06 : .92;
    utterance.volume = .85;
    callout = utterance;
    utterance.onend = utterance.onerror = () => {
      if (callout === utterance) callout = null;
    };
    speech.speak(utterance);
  }

  function showCelebration(text, detail, style, duration) {
    clearTimeout(celebrationTimer);
    const badge = document.createElement("div");
    badge.className = "celebration-badge " + style;
    const title = document.createElement("strong");
    title.lang = "aeb-Arab";
    title.dir = "rtl";
    title.textContent = text;
    const description = document.createElement("span");
    description.textContent = detail;
    badge.append(title, description);
    celebration.replaceChildren(badge);
    celebrationTimer = setTimeout(() => celebration.replaceChildren(), duration);
  }

  function celebrateMatch(winner) {
    const won = winner === 0;
    const text = won ? "مبروك عليك! ربحت الماتش!" : "هالمرّة الكمبيوتر ربح. نعاودو؟";
    showCelebration(text, won ? "You won the match!" : "The computer won the match.",
      won ? "match-win" : "match-loss", 4200);
    const notes = won ? [392, 523.25, 659.25, 783.99] : [330, 261.63];
    notes.forEach((note, index) => playTone(note, index * .12, .25, "triangle", .09));
    speakTunisian(text, winner);
  }

  function celebrate(player, hayya, sweep, savage) {
    const event = hayya && sweep ? "7ayya ♦ + Chkobba!" : sweep ? "Chkobba!" : "7ayya ♦";
    const text = hayya && sweep ? "حيّة وشكبّة!" : sweep ? "شكبّة! الطاولة تفرغت!" : "هاذي الحيّة!";
    const who = player === 0 ? "You" : "Computer";
    const detail = who + (hayya && sweep ? " captured 7♦ and cleared the table"
      : sweep ? " cleared the table" : " captured the seven of diamonds");
    showCelebration(text, event + " · " + detail,
      savage ? "savage-badge" : sweep ? "sweep-badge" : "hayya-badge", savage ? 2800 : 2400);

    if (shakeEnabled()) {
      tableShake?.cancel();
      const strength = savage ? 19 : 14;
      tableShake = board.animate?.([
        { transform: "none" },
        { transform: `translate(${-strength}px, -5px) rotate(-1.1deg)`, offset: .09 },
        { transform: `translate(${strength}px, 4px) rotate(1deg)`, offset: .19 },
        { transform: `translate(${-strength * .65}px, -3px) rotate(-.7deg)`, offset: .30 },
        { transform: `translate(${strength * .45}px, 2px) rotate(.5deg)`, offset: .42 },
        { transform: "translate(-4px, -1px) rotate(-.25deg)", offset: .57 },
        { transform: "translateX(2px)", offset: .73 },
        { transform: "none" }
      ], { duration: 560 });
      tableShake?.finished.catch(() => {});
      window.navigator?.vibrate?.(savage ? [75, 45, 90] : [55, 35, 65]);
    }
    if (!reduceMotion.matches) {
      const smoke = document.createElement("div");
      smoke.className = "savage-smoke" + (hayya && !sweep ? " rose-smoke" : "");
      smoke.setAttribute("aria-hidden", "true");
      for (let index = 0; index < 7; index++) {
        const cloud = document.createElement("span");
        cloud.style.setProperty("--drift", (index - 3) * 14 + "%");
        cloud.style.setProperty("--lift", (-16 - index % 3 * 12) + "px");
        cloud.style.setProperty("--delay", (sweep ? 470 : 60) + index % 3 * 55 + "ms");
        smoke.append(cloud);
      }
      celebration.append(smoke);

      const burst = document.createElement("div");
      burst.className = "celebration-burst";
      burst.setAttribute("aria-hidden", "true");
      const count = savage ? 36 : sweep ? 28 : 20;
      for (let index = 0; index < count; index++) {
        const spark = document.createElement("span");
        const angle = index * 2 * Math.PI / count;
        const distance = (savage ? 128 : sweep ? 110 : 90) + (index % 3) * 9;
        spark.style.setProperty("--x", Math.round(Math.cos(angle) * distance) + "px");
        spark.style.setProperty("--y", Math.round(Math.sin(angle) * distance * .55) + "px");
        spark.style.setProperty("--delay", (index % 4) * 32 + "ms");
        spark.textContent = hayya && ((!sweep && !savage) || index % 3 === 0) ? "♦" : "✦";
        burst.append(spark);
      }
      celebration.append(burst);
    }
    if (sweep) {
      const drop = document.createElement("div");
      drop.className = "mic-drop";
      drop.setAttribute("aria-hidden", "true");
      const smoke = document.createElement("span");
      smoke.className = "mic-smoke";
      const microphone = document.createElement("span");
      microphone.className = "microphone";
      drop.append(smoke, microphone);
      celebration.append(drop);
    }
    playCelebrationSound(hayya, sweep, savage);
    speakTunisian(savage ? "يا سلام! " + text : text, player);
  }

  function finishTurn(player, card, taken) {
    const move = playMove(match, player, card.id, taken.map(item => item.id));
    motion = null;
    if (!move) {
      render();
      return;
    }
    if (player === 1) botMove = card;
    const who = player === 0 ? "You" : "Computer";
    const action = move.chosen ? " took " + move.chosen.map(item => item.id).join(" + ") + " with " : " played ";
    const hayya = Boolean(move.chosen && [move.card, ...move.chosen].some(item => item.id === "7♦"));
    const special = hayya || move.sweep;
    const savage = special && previousSpecial[player];
    previousSpecial[player] = special;
    const highlights = [hayya && "7ayya", move.sweep && "Chkobba!"].filter(Boolean);
    log = [[who + action + card.id, ...highlights].join(" · "), ...log].slice(0, 3);
    const round = match.current;
    if (round.result) match.lastResult = { ...round.result, number: match.round };
    resetSelection();
    render();
    if (round.winner !== null) celebrateMatch(round.winner);
    else if (special) celebrate(player, hayya, move.sweep, savage);
    scheduleBot(special && shakeEnabled() ? 610 : 350);
  }

  function slide(element, frames, duration, easing = "cubic-bezier(.22,.68,.26,1)") {
    element.classList.add("in-flight");
    const animation = element.animate(frames, {
      duration, easing, fill: "both"
    });
    motion.animations.push(animation);
    return animation.finished.catch(() => {});
  }

  function gatherComputerCapture(card, taken, pile) {
    const staged = findCard("table", card.id);
    const landing = staged.getBoundingClientRect();
    const stackX = landing.left + landing.width / 2;
    const stackY = landing.top + landing.height / 2;
    const pileX = pile.left + pile.width / 2;
    const pileY = pile.top + pile.height / 2;

    return Promise.all([...taken, card].map((item, index, cards) => {
      const element = findCard("table", item.id);
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const depth = cards.length - index - 1;
      const spread = depth * 2;
      element.style.zIndex = String(2 + index);

      // Gather under the played card, then carry the stack with one shared trajectory.
      return slide(element, [
        { offset: 0, transform: "none", opacity: 1, easing: "ease-in-out" },
        { offset: .45, transform: `translate(${stackX - x - spread}px, ${stackY - y + spread}px) rotate(${depth * -2}deg)`, opacity: 1, easing: "ease-in-out" },
        { offset: .88, transform: `translate(${pileX - x - spread * .3}px, ${pileY - y + spread * .3}px) scale(.38)`, opacity: 1 },
        { offset: 1, transform: `translate(${pileX - x}px, ${pileY - y}px) scale(.26)`, opacity: 0 }
      ], 640, "linear");
    }));
  }

  async function moveCard(player, card, taken, source) {
    if (motion) return;
    tableShake?.cancel();
    const start = source?.getBoundingClientRect();
    const move = { player, card, taken, arrived: false, animations: [] };
    motion = move;
    resetSelection();
    render();

    const staged = findCard("table", card.id);
    const animate = !reduceMotion.matches && typeof staged.animate === "function";
    if (animate && start) {
      const end = staged.getBoundingClientRect();
      const x = start.left + (start.width - end.width) / 2 - end.left;
      const y = start.top + (start.height - end.height) / 2 - end.top;
      const scale = start.width / end.width;
      await slide(staged, [
        { transform: `translate(${x}px, ${y}px) scale(${scale})` },
        { transform: "none" }
      ], 360);
    }
    if (motion !== move) return;

    playTone(185, 0, .065, "triangle", .065, 76);
    if (taken.length) {
      move.arrived = true;
      render();
      const pause = animate ? (player === 1 ? 240 : 470) : 380;
      await new Promise(resolve => setTimeout(resolve, pause));
      if (motion !== move) return;
      if (animate) {
        const pile = get(player === 0 ? "your-pile" : "bot-pile").getBoundingClientRect();
        if (player === 1) {
          await gatherComputerCapture(card, taken, pile);
        } else {
          await Promise.all([card, ...taken].map(item => {
            const element = findCard("table", item.id);
            const rect = element.getBoundingClientRect();
            const x = pile.left + pile.width / 2 - rect.left - rect.width / 2;
            const y = pile.top + pile.height / 2 - rect.top - rect.height / 2;
            return slide(element, [
              { transform: "none", opacity: 1 },
              { transform: `translate(${x}px, ${y}px) scale(.32)`, opacity: .15 }
            ], 380);
          }));
        }
      }
    }
    if (motion !== move) return;
    if (taken.length) playTone(420, 0, .11, "triangle", .055, 170);
    move.animations.forEach(animation => animation.cancel());
    finishTurn(player, card, taken);
  }

  function scheduleBot(delay = 350) {
    if (match.current.turn !== 1 || match.current.result) return;
    botTimer = setTimeout(() => {
      const { card, taken } = computerMove(match.current);
      const source = get("bot").children[match.current.hands[1].indexOf(card)];
      moveCard(1, card, taken, source);
    }, delay);
  }

  function requestRestart(goal) {
    if (!log.length && match.round === 1) {
      newMatch(goal);
      return;
    }
    requestedTarget = goal;
    restart.returnValue = "";
    get("restart-copy").textContent = "Start a fresh " + goal + "-point match? Your current score will reset.";
    restart.showModal();
  }

  target.addEventListener("change", () => {
    const goal = Number(target.value);
    target.value = String(match.target);
    requestRestart(goal);
  });
  restart.addEventListener("close", () => {
    if (restart.returnValue === "confirm") newMatch(requestedTarget);
  });
  get("reset").addEventListener("click", () => requestRestart(match.target));
  get("rules-open").addEventListener("click", () => get("rules").showModal());
  shake.addEventListener("click", () => {
    shakePreference = shakeEnabled() ? "off" : "on";
    try { localStorage.setItem("chkobba-shake", shakePreference); } catch {}
    if (!shakeEnabled()) {
      tableShake?.cancel();
      window.navigator?.vibrate?.(0);
    }
    updateShakeButton();
  });
  reduceMotion.addEventListener?.("change", updateShakeButton);
  sound.addEventListener("click", () => {
    soundOn = !soundOn;
    try { localStorage.setItem("chkobba-sound", soundOn ? "on" : "off"); } catch {}
    if (soundOn) unlockSound();
    else {
      activeTones.forEach(tone => tone.stop());
      stopCallout();
    }
    updateSoundButton();
  });
  play.addEventListener("click", () => {
    unlockSound();
    const round = match.current;
    if (round.result) {
      if (round.winner === null) nextRound();
      else newMatch(match.target);
    } else if (selected && !play.disabled) {
      const taken = match.current.table.filter(card => selectedIds.includes(card.id));
      moveCard(0, selected, taken, findCard("hand", selected.id));
    }
  });

  updateSoundButton();
  updateShakeButton();
  window.speechSynthesis?.getVoices();
  newMatch(11);
}
