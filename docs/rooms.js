(() => {
  const config = globalThis.WISHING_TREE_CONFIG || {};
  const online = Boolean(config.url && config.publishableKey);
  const partial = Boolean(config.url || config.publishableKey) && !online;
  const day = 86400000;
  let dbPromise;
  function database() {
    if (!dbPromise)
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(
          "wishing-tree-v1:" + location.pathname.replace(/index\.html$/, ""),
          1
        );
        req.onupgradeneeded = () => req.result.createObjectStore("rooms", { keyPath: "code" });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          dbPromise = null;
          reject(Error("Your browser could not open local rooms. Try a normal browser window."));
        };
      });
    return dbPromise;
  }
  async function local(op, p) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("rooms", "readwrite");
      const table = tx.objectStore("rooms");
      let answer, problem;
      tx.oncomplete = () => resolve(answer);
      tx.onabort = () => reject(problem || Error("The room could not be saved. Please try again."));
      function finish(room) {
        try {
          const now = Date.now();
          if (!room || room.expires <= now)
            throw Error("This room has closed, or the code is incorrect.");
          let seat = room.tokens.indexOf(p.token);
          if (seat === -1 && op === "join") {
            if (room.tokens.length === 2) throw Error("This room already has two people.");
            seat = 1;
            room.tokens.push(p.token);
            room.names.push(p.name);
          }
          if (seat === -1) throw Error("This seat belongs to another browser.");
          room.seen[seat] = now;
          if (op === "act" && !room.events.some((e) => e.id === p.event.id)) {
            if (room.names.length !== 2) throw Error("Wait until both seats are filled.");
            room.events.push({ ...p.event, seat, at: now, seq: room.events.length + 1 });
          }
          table.put(room);
          answer = {
            code: room.code,
            seat,
            names: room.names,
            seen: room.seen,
            now,
            version: room.events.length,
            events: room.events.slice(p.after || 0)
          };
        } catch (e) {
          problem = e;
          tx.abort();
        }
      }
      if (op === "open") {
        const req = table.getAll();
        req.onsuccess = () => {
          const now = Date.now(),
            codes = new Set();
          let existing;
          for (const room of req.result) {
            if (room.expires <= now) table.delete(room.code);
            else {
              codes.add(room.code);
              if (room.tokens[0] === p.token) existing = room;
            }
          }
          if (existing) {
            finish(existing);
            return;
          }
          let code;
          do {
            code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
          } while (codes.has(code));
          finish({
            code,
            expires: now + day,
            tokens: [p.token],
            names: [p.name],
            events: [],
            seen: [now, 0]
          });
        };
      } else {
        const req = table.get(p.code);
        req.onsuccess = () => finish(req.result);
      }
    });
  }
  async function call(op, p) {
    if (partial)
      throw Error("Both settings in config.js are needed for online rooms. Check the setup guide.");
    if (!online) return local(op, p);
    if (
      !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url) ||
      !config.publishableKey.startsWith("sb_publishable_")
    )
      throw Error("Check the project URL and sb_publishable_ key in config.js.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(config.url.replace(/\/$/, "") + "/rest/v1/rpc/wt_room", {
        method: "POST",
        signal: controller.signal,
        headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_op: op,
          p_token: p.token,
          p_code: p.code || "",
          p_name: p.name || "",
          p_event: p.event || {},
          p_after: p.after || 0
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "P0001") throw Error(data.message);
        if (res.status === 404)
          throw Error(
            "Room setup is incomplete. Run setup.sql in Supabase and enable the Data API."
          );
        if ([401, 403].includes(res.status))
          throw Error(
            "The room service rejected the key or access settings. Check config.js and setup.sql."
          );
        throw Error("The room service is unavailable. Please try again.");
      }
      return data;
    } catch (e) {
      if (e.name === "AbortError" || e instanceof TypeError)
        throw Error("Couldn’t reach the room. Check your connection and try again.");
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  globalThis.WTRooms = { call, online };
})();
