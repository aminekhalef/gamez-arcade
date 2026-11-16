"use strict";

const byId = id => document.getElementById(id);
const dayLength = 86_400_000;
const firstDay = Date.UTC(2026, 0, 1) / dayLength;
const storagePrefix = "lettergrid.v1.";
const keyStrength = { gray: 1, yellow: 2, green: 3 };
const accepted = new Set([...dictionary, ...answers]);
const keyboardRows = ["QWERTYUIOP".split(""), "ASDFGHJKL".split(""), ["Enter", ..."ZXCVBNM", "Backspace"]];
const board = byId("board");
const keyboard = byId("keyboard");
const dialog = byId("dialog");
const keys = new Map();
const tiles = [];
let storageUnavailable = false;
let round;
let mode = "daily";

function scoreGuess(guess, answer) {
  const scores = Array(5).fill("gray");
  const remaining = new Map();
  for (let i = 0; i < 5; i++) {
    const letter = answer[i];
    if (guess[i] === letter) {
      scores[i] = "green";
    } else {
      remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
    }
  }
  for (let i = 0; i < 5; i++) {
    const letter = guess[i];
    const count = remaining.get(letter) ?? 0;
    if (scores[i] === "gray" && count > 0) {
      scores[i] = "yellow";
      remaining.set(letter, count - 1);
    }
  }
  return scores;
}

function dayIndex() {
  return Math.floor(Date.now() / dayLength) - firstDay;
}

function dailyAnswer(day) {
  const index = ((day * 97 % answers.length) + answers.length) % answers.length;
  return answers[index];
}

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(storagePrefix + key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(storagePrefix + key, JSON.stringify(value));
  } catch {
    storageUnavailable = true;
  }
}

function newRound(answer, day = null) {
  return { answer, day, guesses: [], input: "" };
}

function randomAnswer(previous) {
  const candidates = answers.filter(word => word !== previous);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function outcome(record) {
  if (record.guesses.at(-1) === record.answer) return "won";
  return record.guesses.length === 6 ? "lost" : "playing";
}

function roundKey() {
  return mode === "daily" ? "daily." + round.day : "unlimited";
}

function persist() {
  write(roundKey(), round);
}

function switchMode(nextMode) {
  mode = nextMode;
  if (mode === "daily") {
    const day = dayIndex();
    round = read("daily." + day, newRound(dailyAnswer(day), day));
  } else {
    round = read("unlimited", null) ?? newRound(randomAnswer());
    persist();
  }
  render();
}

function render(message = "") {
  const status = outcome(round);
  const marks = new Map();
  const rows = round.guesses.map(guess => scoreGuess(guess, round.answer));
  tiles.forEach((row, rowIndex) => {
    const current = status === "playing" && rowIndex === round.guesses.length;
    const letters = round.guesses[rowIndex] ?? (current ? round.input : "");
    row.forEach((tile, i) => {
      const letter = letters[i] ?? "";
      const score = rows[rowIndex]?.[i];
      tile.textContent = letter;
      tile.className = ["tile", score, letter && "filled", current && "current", current && i === letters.length && "caret"].filter(Boolean).join(" ");
      tile.setAttribute("aria-label", letter ? [letter, score].filter(Boolean).join(", ") : "Empty");
      if (score && keyStrength[score] > (keyStrength[marks.get(letter)] ?? 0)) marks.set(letter, score);
    });
  });
  keys.forEach((button, key) => {
    const score = marks.get(key);
    const label = key === "Backspace" ? "Delete letter" : key;
    button.className = ["key", key.length > 1 && "wide", score].filter(Boolean).join(" ");
    button.setAttribute("aria-label", score ? label + ", " + score : label);
  });
  byId("daily").setAttribute("aria-pressed", mode === "daily");
  byId("unlimited").setAttribute("aria-pressed", mode === "unlimited");
  byId("puzzle-label").textContent = mode === "daily" ? "Puzzle #" + (round.day + 1) : "Practice round";
  byId("round-actions").hidden = status === "playing";
  byId("next").textContent = mode === "daily" ? "Play unlimited" : "Play again";
  const result = status === "won"
    ? "Solved in " + round.guesses.length + (round.guesses.length === 1 ? " guess!" : " guesses!")
    : status === "lost" ? "The word was " + round.answer + "." : "";
  byId("message").textContent = message || result;
}

function recordStats() {
  const key = "stats." + mode;
  const stats = read(key, { played: 0, wins: 0, streak: 0, best: 0, lastDay: null });
  if (mode === "daily" && stats.lastDay === round.day) return;
  if (mode === "daily" && stats.lastDay !== round.day - 1) stats.streak = 0;
  stats.played++;
  if (outcome(round) === "won") {
    stats.wins++;
    stats.streak++;
    stats.best = Math.max(stats.best, stats.streak);
  } else {
    stats.streak = 0;
  }
  stats.lastDay = round.day;
  write(key, stats);
}

function press(key) {
  if (dialog.open) return;
  if (mode === "daily" && round.day !== dayIndex()) switchMode("daily");
  if (outcome(round) !== "playing") return;

  if (key === "Enter") {
    if (round.input.length !== 5) return render("Enter five letters.");
    if (!accepted.has(round.input)) return render("That word isn’t in the dictionary.");
    round.guesses.push(round.input);
    round.input = "";
    if (outcome(round) !== "playing") recordStats();
  } else if (key === "Backspace") {
    round.input = round.input.slice(0, -1);
  } else if (/^[A-Z]$/.test(key) && round.input.length < 5) {
    round.input += key;
  } else {
    return;
  }
  persist();
  render();
}

function showDialog(title, content) {
  byId("dialog-title").textContent = title;
  byId("dialog-body").replaceChildren(content);
  dialog.showModal();
}

function showStats() {
  const stats = read("stats." + mode, { played: 0, wins: 0, streak: 0, best: 0 });
  const streak = mode === "daily" && stats.lastDay < dayIndex() - 1 ? 0 : stats.streak;
  const winRate = stats.played ? Math.round(stats.wins / stats.played * 100) : 0;
  const list = document.createElement("dl");
  list.className = "stats-list";
  for (const [label, value] of [["Played", stats.played], ["Win rate", winRate + "%"], ["Streak", streak], ["Best streak", stats.best]]) {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const definition = document.createElement("dd");
    term.textContent = label;
    definition.textContent = value;
    item.append(term, definition);
    list.append(item);
  }
  if (storageUnavailable) {
    const note = document.createElement("p");
    note.textContent = "Browser storage is unavailable, so stats may reset.";
    showDialog(mode === "daily" ? "Daily stats" : "Unlimited stats", list);
    byId("dialog-body").append(note);
    return;
  }
  showDialog(mode === "daily" ? "Daily stats" : "Unlimited stats", list);
}

function showHelp() {
  const help = document.createElement("div");
  help.innerHTML = '<p>Type a five-letter English word and press Enter. You have six guesses.</p><div class="guide"><p><span class="sample green" aria-hidden="true">A</span> Right letter, right spot</p><p><span class="sample yellow" aria-hidden="true">R</span> Right letter, wrong spot</p><p><span class="sample gray" aria-hidden="true">T</span> No matching copy left</p></div><p>Repeated letters only score as many times as they appear in the answer. The Daily puzzle changes at midnight UTC. Choose Unlimited to keep playing.</p>';
  showDialog("How to play", help);
}

async function share() {
  const symbols = { green: "🟩", yellow: "🟨", gray: "⬛" };
  const grid = round.guesses.map(guess => scoreGuess(guess, round.answer).map(score => symbols[score]).join("")).join("\n");
  const label = mode === "daily" ? "#" + (round.day + 1) : "Unlimited";
  const result = outcome(round) === "won" ? round.guesses.length : "X";
  const text = "Lettergrid " + label + " " + result + "/6\n\n" + grid;
  try {
    await navigator.clipboard.writeText(text);
    render("Result copied.");
  } catch {
    const field = document.createElement("textarea");
    field.className = "share-text";
    field.readOnly = true;
    field.value = text;
    field.setAttribute("aria-label", "Result to copy");
    showDialog("Share result", field);
    field.select();
  }
}

for (let index = 0; index < 6; index++) {
  const row = document.createElement("div");
  row.className = "row";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Guess " + (index + 1));
  const cells = Array.from({ length: 5 }, () => document.createElement("span"));
  row.append(...cells);
  board.append(row);
  tiles.push(cells);
}
for (const letters of keyboardRows) {
  const row = document.createElement("div");
  row.className = "keyrow";
  for (const letter of letters) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = letter === "Backspace" ? "⌫" : letter;
    button.addEventListener("mousedown", event => event.preventDefault());
    button.addEventListener("click", () => press(letter));
    keys.set(letter, button);
    row.append(button);
  }
  keyboard.append(row);
}

document.addEventListener("keydown", event => {
  if (dialog.open || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
  if (event.key === "Enter" && event.target.closest?.("button, a")) return;
  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  if (key === "Enter" || key === "Backspace" || /^[A-Z]$/.test(key)) {
    event.preventDefault();
    if (/^[A-Z]$/.test(key)) event.target.closest?.("button, a")?.blur();
    press(key);
  }
});
byId("daily").addEventListener("click", () => switchMode("daily"));
byId("unlimited").addEventListener("click", () => switchMode("unlimited"));
byId("help").addEventListener("click", showHelp);
byId("stats").addEventListener("click", showStats);
byId("close").addEventListener("click", () => dialog.close());
byId("share").addEventListener("click", share);
byId("next").addEventListener("click", () => {
  if (mode === "daily") {
    switchMode("unlimited");
  } else {
    round = newRound(randomAnswer(round.answer));
    persist();
    render();
  }
  byId("unlimited").focus();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && mode === "daily" && round.day !== dayIndex()) switchMode("daily");
});
switchMode("daily");
