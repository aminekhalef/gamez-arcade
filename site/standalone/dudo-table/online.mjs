const sessionKey = 'gamez:dudo-table';
const api = `${window.GAMEZ_API_ORIGIN ?? window.location.origin}/api/rooms`;

async function request(body, session) {
  const url = new URL(api);
  const headers = {};
  if (session) headers['x-player-token'] = session.token;
  if (body) headers['content-type'] = 'application/json';
  else url.search = new URLSearchParams({ code: session.code, playerId: session.playerId });
  try {
    const response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8_000),
    });
    const data = await response.json();
    return { ...data, status: response.status };
  } catch {
    throw new Error('Could not reach the room server. Try again.');
  }
}

export function dudoOnline({ onChange, onConnection }) {
  let session;
  let room;
  let version = 0;
  let timer;
  let pendingCreate;

  function update(data) {
    if (!data.room || data.version < version) return;
    const changed = version !== data.version;
    version = data.version;
    room = data.room;
    onChange(room, session.playerId, changed);
  }

  function saveSession(value) {
    session = value;
    try {
      if (value) sessionStorage.setItem(sessionKey, JSON.stringify(value));
      else sessionStorage.removeItem(sessionKey);
    } catch {}
  }

  function leave() {
    clearTimeout(timer);
    saveSession(undefined);
    room = undefined;
    version = 0;
    onConnection('');
    onChange(undefined);
  }

  async function poll(activeSession) {
    try {
      const data = await request(undefined, activeSession);
      if (session !== activeSession) return;
      if (data.status === 404 || data.error === 'Room access denied.') {
        leave();
        onConnection('Your room is no longer available.');
        return;
      }
      if (data.error) throw new Error(data.error);
      onConnection('');
      update(data);
    } catch (error) {
      if (session === activeSession) onConnection(error.message);
    } finally {
      if (session === activeSession) timer = setTimeout(() => poll(activeSession), 700);
    }
  }

  return {
    resume(inviteCode) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(sessionKey));
        if (saved?.code && saved?.playerId && saved?.token && (!inviteCode || saved.code === inviteCode)) {
          session = saved;
          onConnection('Reconnecting to your room…');
          void poll(saved);
        }
      } catch {}
    },
    async enter(intent, name, code) {
      if (intent === 'create' && pendingCreate?.name !== name) {
        pendingCreate = { name, playerId: crypto.randomUUID(), requestId: crypto.randomUUID() };
      }
      const identity = intent === 'create' ? pendingCreate : { playerId: crypto.randomUUID() };
      const data = await request({ ...identity, intent, game: 'dudo-table', name, code });
      if (data.error || !data.room || !data.token) throw new Error(data.error ?? 'Could not open the room.');
      clearTimeout(timer);
      pendingCreate = undefined;
      saveSession({ code: data.room.code, token: data.token, playerId: identity.playerId });
      version = 0;
      onConnection('');
      update(data);
      const activeSession = session;
      timer = setTimeout(() => poll(activeSession), 700);
    },
    async action(action, payload) {
      const activeSession = session;
      const data = await request({
        intent: 'action', action, payload, code: activeSession.code,
        playerId: activeSession.playerId, version,
      }, activeSession);
      if (session !== activeSession) return;
      if (action === 'leave_lobby' && !data.error) {
        leave();
        return;
      }
      update(data);
      if (data.error || !data.room) throw new Error(data.error ?? 'The move could not be saved.');
    },
    leave,
    get room() { return room; },
  };
}
