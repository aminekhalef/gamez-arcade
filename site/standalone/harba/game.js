(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayCopy = document.getElementById('overlay-copy');
  const overlayAction = document.getElementById('overlay-action');
  const levelLabel = document.getElementById('level-label');
  const distanceLabel = document.getElementById('objective-label');
  const dinarLabel = document.getElementById('health-label');
  const stateChip = document.getElementById('state-chip');
  const notice = document.getElementById('notice');
  const W = canvas.width, H = canvas.height, GROUND = 458, FINISH = 1000;

  const DISTRICTS = [
    { name: 'Bab Bhar', start: 0, end: 333, speed: 5.7, spawn: 108, sky: ['#42bfe8', '#f6d79a'], accent: '#0877a8' },
    { name: 'Souk El Attarine', start: 333, end: 666, speed: 6.6, spawn: 88, sky: ['#1b91c6', '#efb86e'], accent: '#c1642c' },
    { name: 'Zitouna Quarter', start: 666, end: FINISH, speed: 7.5, spawn: 72, sky: ['#1c3e70', '#d37a54'], accent: '#6f2c70' }
  ];

  const heroImage = new Image(); heroImage.src = 'assets/harba-runner.png';
  const streetImage = new Image(); streetImage.src = 'assets/medina-street.png';
  const player = { x: 205, y: GROUND - 88, w: 48, h: 88, vy: 0, jumps: 0, grounded: true, sliding: false, invincible: 0 };
  let mode = 'menu', distance = 0, dinars = 0, pursuit = 100, shield = 0, turbo = 0, districtIndex = 0;
  let entities = [], spawnTimer = 70, time = 0, worldOffset = 0, noticeTimer = 0, shake = 0, onlineMode = false, lastReport = -1, overlayHandler = null, slideHeld = false;

  function showOverlay(title, copy, action, handler) {
    overlayTitle.textContent = title; overlayCopy.textContent = copy; overlayAction.textContent = action;
    overlayHandler = handler; overlay.hidden = false;
  }
  function hideOverlay() { overlay.hidden = true; }
  overlayAction.addEventListener('click', () => {
    if (overlayHandler) overlayHandler();
  });

  function toast(message) {
    notice.textContent = message; notice.classList.add('show'); noticeTimer = 145;
  }

  function resetPlayer() {
    player.y = GROUND - 88; player.h = 88; player.vy = 0; player.jumps = 0; player.grounded = true; player.sliding = false; player.invincible = 0;
  }

  function startGame() {
    mode = 'running'; distance = 0; dinars = 0; pursuit = 100; shield = 0; turbo = 0; districtIndex = 0;
    entities = []; spawnTimer = 75; worldOffset = 0; lastReport = -1; slideHeld = false; resetPlayer(); hideOverlay(); updateHud(); reportProgress();
    toast('Bab Bhar — run!');
  }

  function jump() {
    if (mode !== 'running' || player.jumps >= 2) return;
    if (player.sliding) setSlide(false);
    player.vy = player.jumps === 0 ? -13.5 : -11.2; player.jumps++; player.grounded = false;
  }

  function setSlide(active) {
    if (mode !== 'running') return;
    if (active && player.grounded && !player.sliding) { player.sliding = true; player.h = 50; player.y = GROUND - player.h; }
    if (!active && player.sliding) { player.sliding = false; player.h = 88; player.y = GROUND - player.h; }
  }

  function reportProgress(finished = false) {
    if (!onlineMode) return;
    const score = Math.min(FINISH, Math.floor(distance));
    if (score === lastReport && !finished) return;
    lastReport = score;
    parent.postMessage({ type: 'gamez-progress', game: 'harba', score, finished }, location.origin);
  }

  function finish(won) {
    mode = won ? 'won' : 'lost'; reportProgress(true);
    if (won) {
      try { localStorage.setItem('harba:best', String(Math.max(FINISH, Number(localStorage.getItem('harba:best')) || 0))); } catch {}
      showOverlay('Medina escaped!', `You crossed all three districts with ${dinars} dinars and left the patrol behind.`, 'Run again', startGame);
    } else {
      try { localStorage.setItem('harba:best', String(Math.max(Math.floor(distance), Number(localStorage.getItem('harba:best')) || 0))); } catch {}
      showOverlay('The patrol caught up', `You reached ${Math.floor(distance)} metres. Time your jumps and slide under the taller barriers.`, 'Try again', startGame);
    }
  }

  function updateHud() {
    levelLabel.textContent = `${districtIndex + 1} / 3 · ${DISTRICTS[districtIndex].name}`;
    distanceLabel.textContent = `${Math.min(FINISH, Math.floor(distance))} / ${FINISH} m`;
    dinarLabel.textContent = String(dinars);
    const status = pursuit < 35 ? 'DANGER' : pursuit < 65 ? 'CLOSE' : 'SAFE';
    stateChip.textContent = `${shield ? 'SHIELD · ' : turbo ? 'TURBO · ' : ''}${status} · ${Math.ceil(pursuit)}%`;
    stateChip.className = pursuit < 35 ? 'alert' : pursuit < 65 ? 'warning' : '';
  }

  function spawnCoinTrail(count = 4) {
    const high = Math.random() < .5, baseY = high ? GROUND - 145 : GROUND - 68;
    for (let i = 0; i < count; i++) entities.push({ kind: 'coin', x: W + 50 + i * 43, y: baseY - Math.sin(i / Math.max(1, count - 1) * Math.PI) * 32, w: 24, h: 24, taken: false });
  }

  function spawnHazard() {
    const choices = districtIndex === 0 ? ['crate', 'basket', 'barrier'] : districtIndex === 1 ? ['crate', 'scooter', 'barrier', 'cart'] : ['scooter', 'barrier', 'cart', 'crates'];
    const type = choices[Math.floor(Math.random() * choices.length)];
    const sizes = { crate: [58, 60], basket: [66, 40], scooter: [92, 58], barrier: [82, 82], cart: [110, 66], crates: [88, 88] };
    const [w, h] = sizes[type];
    const y = type === 'barrier' ? GROUND - 92 : GROUND - h;
    entities.push({ kind: 'hazard', type, x: W + 60, y, w, h: type === 'barrier' ? 42 : h, hit: false });
  }

  function spawnPower() {
    entities.push({ kind: Math.random() < .55 ? 'shield' : 'turbo', x: W + 70, y: GROUND - 145, w: 38, h: 38, taken: false });
  }

  function spawnPattern() {
    const roll = Math.random();
    if (roll < .27) spawnCoinTrail(3 + Math.floor(Math.random() * 3));
    else if (roll < .37) spawnPower();
    else { spawnHazard(); if (districtIndex > 0 && Math.random() < .32) spawnCoinTrail(3); }
  }

  const overlaps = (a, b) => a.x + 7 < b.x + b.w && a.x + a.w - 7 > b.x && a.y + 5 < b.y + b.h && a.y + a.h > b.y + 4;

  function collide(entity) {
    if (entity.hit || player.invincible > 0) return;
    entity.hit = true; shake = 13;
    if (shield > 0) { shield = 0; player.invincible = 70; toast('Brik shield saved you!'); }
    else if (turbo > 0) { player.invincible = 50; toast('Harissa turbo powers through!'); }
    else { pursuit = Math.max(0, pursuit - 31); player.invincible = 100; toast('The patrol is getting closer!'); }
  }

  function updatePlayer() {
    if (player.invincible > 0) player.invincible--;
    if (!player.grounded) {
      player.vy += .72; player.y += player.vy;
      if (player.y + player.h >= GROUND) { player.y = GROUND - player.h; player.vy = 0; player.grounded = true; player.jumps = 0; if (slideHeld) setSlide(true); }
    }
  }

  function updateEntities(speed) {
    const body = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const entity of entities) {
      entity.x -= speed;
      if (entity.kind === 'hazard' && overlaps(body, entity)) collide(entity);
      if (entity.kind !== 'hazard' && !entity.taken && overlaps(body, entity)) {
        entity.taken = true;
        if (entity.kind === 'coin') dinars++;
        else if (entity.kind === 'shield') { shield = 1; toast('Brik shield ready.'); }
        else { turbo = 260; toast('Harissa turbo!'); }
      }
    }
    entities = entities.filter(entity => entity.x + entity.w > -80 && !entity.taken);
  }

  function update() {
    if (mode !== 'running') return;
    const district = DISTRICTS[districtIndex], speed = district.speed + (turbo > 0 ? 2.2 : 0);
    if (turbo > 0) turbo--;
    worldOffset += speed; distance += speed * .0185; pursuit = Math.min(100, pursuit + .018);
    updatePlayer(); updateEntities(speed);
    if (--spawnTimer <= 0) { spawnPattern(); spawnTimer = district.spawn + Math.random() * 34; }
    if (districtIndex < DISTRICTS.length - 1 && distance >= district.end) {
      districtIndex++; spawnTimer = 65; toast(`${DISTRICTS[districtIndex].name} — the streets get faster!`);
    }
    if (distance >= FINISH) finish(true); else if (pursuit <= 0) finish(false);
    if (Math.floor(distance) % 3 === 0) reportProgress();
    if (noticeTimer > 0 && --noticeTimer === 0) notice.classList.remove('show');
    updateHud();
  }

  function drawBackground() {
    const district = DISTRICTS[districtIndex];
    const gradient = ctx.createLinearGradient(0, 0, 0, H); gradient.addColorStop(0, district.sky[0]); gradient.addColorStop(1, district.sky[1]); ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
    if (streetImage.complete && streetImage.naturalWidth) {
      const scale = W / streetImage.naturalWidth, cropH = H / scale, cropY = Math.min(streetImage.naturalHeight - cropH, 70 + districtIndex * 85);
      ctx.save(); ctx.globalAlpha = districtIndex === 2 ? .34 : .49; ctx.drawImage(streetImage, 0, cropY, streetImage.naturalWidth, cropH, 0, 0, W, H); ctx.restore();
    }
    const parallax = -((worldOffset * .18) % 280);
    for (let x = parallax - 280; x < W + 280; x += 280) {
      ctx.fillStyle = districtIndex === 2 ? '#b57b6cbb' : '#f5e3b9c9'; ctx.fillRect(x, 170, 238, GROUND - 170);
      ctx.fillStyle = district.accent; ctx.fillRect(x + 28, 292, 72, GROUND - 292); ctx.fillStyle = '#f5d28c'; ctx.fillRect(x + 42, 318, 44, 4);
      ctx.fillStyle = '#243f5d'; ctx.fillRect(x + 152, 225, 47, 65);
      ctx.fillStyle = '#b72549'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + 222 + Math.sin(i) * 9, 230 + i * 15, 11, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = '#897969'; ctx.fillRect(0, GROUND, W, H - GROUND); ctx.fillStyle = '#b9a68e'; ctx.fillRect(0, GROUND, W, 7);
    ctx.strokeStyle = '#645b52'; ctx.lineWidth = 2; const road = -((worldOffset * .95) % 58); for (let x = road - 58; x < W + 58; x += 58) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x - 14, H); ctx.stroke(); }
  }

  function drawHero() {
    const blink = player.invincible > 0 && Math.floor(player.invincible / 6) % 2; if (blink) return;
    const running = Math.sin(time * .28), bob = player.grounded ? Math.abs(running) * 4 : 0;
    ctx.save(); ctx.translate(player.x + player.w / 2, player.y + player.h / 2 + bob);
    if (player.sliding) { ctx.rotate(-.27); ctx.scale(1.08, .72); }
    else ctx.rotate(player.grounded ? running * .018 : -.08);
    if (turbo > 0) { ctx.fillStyle = '#ff7a2b88'; for (let i = 0; i < 4; i++) ctx.fillRect(-70 - i * 18, -22 + i * 12, 42, 5); }
    if (shield) { ctx.strokeStyle = '#ffe26a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, 48, 58, 0, 0, Math.PI * 2); ctx.stroke(); }
    if (heroImage.complete && heroImage.naturalWidth) ctx.drawImage(heroImage, -47, -58, 94, 116);
    else { ctx.fillStyle = '#f3ead9'; ctx.fillRect(-16, -34, 32, 57); ctx.fillStyle = '#cf1735'; ctx.fillRect(-18, -50, 36, 14); }
    ctx.restore();
    ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(player.x + 25, GROUND + 4, player.sliding ? 48 : 31, 7, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawPolice() {
    const closeness = 1 - pursuit / 100, x = 38 + closeness * 105, y = GROUND - 79;
    const stride = Math.sin(time * (.24 + districtIndex * .025)) * 15;
    ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
    ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(3, 83, 31, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#132b49'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-7, 55); ctx.lineTo(-10 + stride, 79); ctx.moveTo(8, 55); ctx.lineTo(11 - stride, 79); ctx.stroke();
    ctx.strokeStyle = '#101b2b'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-11 + stride, 79); ctx.lineTo(-2 + stride, 79); ctx.moveTo(10 - stride, 79); ctx.lineTo(19 - stride, 79); ctx.stroke();
    ctx.fillStyle = '#183d66'; ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(-18, 24, 36, 40, 8);
    else ctx.rect(-18, 24, 36, 40);
    ctx.fill();
    ctx.fillStyle = '#d6aa80'; ctx.beginPath(); ctx.arc(0, 14, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#183d66'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-14, 31); ctx.lineTo(-24 - stride * .45, 51); ctx.moveTo(14, 31); ctx.lineTo(24 + stride * .45, 49); ctx.stroke();
    ctx.fillStyle = '#112b49'; ctx.beginPath(); ctx.arc(0, 8, 15, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillRect(-16, 7, 32, 5);
    ctx.fillStyle = '#d8ba55'; ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(5, 14); ctx.lineTo(0, 18); ctx.lineTo(-5, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-17, 35, 7, 11); ctx.fillStyle = '#e31b36'; ctx.beginPath(); ctx.arc(-13.5, 40.5, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9c85a'; ctx.fillRect(-4, 31, 8, 10); ctx.fillStyle = '#f7e49a'; ctx.fillRect(8, 30, 6, 3); ctx.fillRect(8, 35, 6, 3);
    if (pursuit < 50) { ctx.fillStyle = '#e31b36'; ctx.font = '900 23px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', 0, -12); }
    ctx.restore();
  }

  function drawEntity(entity) {
    ctx.save(); ctx.translate(entity.x, entity.y);
    if (entity.kind === 'coin') {
      ctx.translate(entity.w / 2, entity.h / 2 + Math.sin(time * .1 + entity.x) * 3); ctx.rotate(time * .025); ctx.fillStyle = '#ffd64f'; ctx.strokeStyle = '#8f5c08'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8f5c08'; ctx.font = 'bold 13px serif'; ctx.textAlign = 'center'; ctx.fillText('د', 0, 5);
    } else if (entity.kind === 'shield' || entity.kind === 'turbo') {
      ctx.fillStyle = entity.kind === 'shield' ? '#f0b83f' : '#db233e'; ctx.beginPath(); ctx.arc(19, 19, 19, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(entity.kind === 'shield' ? '◆' : '🔥', 19, 26);
    } else {
      if (entity.type === 'barrier') { ctx.fillStyle = '#d22e37'; ctx.fillRect(0, 0, entity.w, 34); ctx.fillStyle = '#fff'; for (let x = 8; x < entity.w; x += 25) ctx.fillRect(x, 0, 12, 34); ctx.fillStyle = '#70452a'; ctx.fillRect(9, 34, 8, 58); ctx.fillRect(entity.w - 17, 34, 8, 58); }
      else if (entity.type === 'scooter') { ctx.strokeStyle = '#272b33'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(18, entity.h - 10, 12, 0, Math.PI * 2); ctx.arc(entity.w - 17, entity.h - 10, 12, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#1f9fa8'; ctx.fillRect(15, 18, 55, 25); ctx.strokeStyle = '#333'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(65, 22); ctx.lineTo(76, 0); ctx.stroke(); }
      else if (entity.type === 'cart') { ctx.fillStyle = '#b72d37'; ctx.fillRect(0, 10, entity.w, 40); ctx.strokeStyle = '#432b20'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(22, 55, 12, 0, Math.PI * 2); ctx.arc(entity.w - 22, 55, 12, 0, Math.PI * 2); ctx.stroke(); }
      else { ctx.fillStyle = entity.type === 'basket' ? '#b47a35' : '#79502d'; ctx.fillRect(0, 0, entity.w, entity.h); ctx.strokeStyle = '#d3a05b'; ctx.lineWidth = 4; ctx.strokeRect(5, 5, entity.w - 10, entity.h - 10); if (entity.type === 'crates') { ctx.beginPath(); ctx.moveTo(0, entity.h / 2); ctx.lineTo(entity.w, entity.h / 2); ctx.stroke(); } }
    }
    ctx.restore();
  }

  function draw() {
    time++; ctx.save(); if (shake > .2) { ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); shake *= .82; }
    drawBackground(); drawPolice(); entities.forEach(drawEntity); drawHero();
    ctx.fillStyle = '#fff'; ctx.font = '900 14px system-ui'; ctx.textAlign = 'left'; ctx.fillText(`${DISTRICTS[districtIndex].name} · ${Math.max(0, Math.ceil(DISTRICTS[districtIndex].end - distance))} m to next gate`, 18, H - 17); ctx.restore();
  }

  function frame() { update(); draw(); requestAnimationFrame(frame); }

  addEventListener('keydown', event => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(event.code)) event.preventDefault();
    if ((event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') && !event.repeat) jump();
    if (event.code === 'ArrowDown' || event.code === 'KeyS') { slideHeld = true; setSlide(true); }
  });
  addEventListener('keyup', event => { if (event.code === 'ArrowDown' || event.code === 'KeyS') { slideHeld = false; setSlide(false); } });
  addEventListener('blur', () => { slideHeld = false; setSlide(false); });

  const jumpButton = document.querySelector('[data-action="jump"]');
  const slideButton = document.querySelector('[data-action="slide"]');
  if (jumpButton) jumpButton.addEventListener('pointerdown', event => { event.preventDefault(); jump(); });
  if (slideButton) {
    slideButton.addEventListener('pointerdown', event => {
      event.preventDefault(); slideHeld = true;
      if (typeof slideButton.setPointerCapture === 'function') slideButton.setPointerCapture(event.pointerId);
      setSlide(true);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => slideButton.addEventListener(type, () => { slideHeld = false; setSlide(false); }));
  }

  addEventListener('message', event => {
    if (event.origin !== location.origin || !event.data || event.data.type !== 'gamez-online-start') return;
    onlineMode = true; startGame();
  });

  updateHud(); showOverlay('Medina Escape', 'Run automatically through three increasingly difficult districts. Double-jump, slide, collect dinars, and keep the improved patrol behind you.', 'Start running', startGame); frame();
})();
