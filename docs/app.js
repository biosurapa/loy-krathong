(() => {
  const $ = (id) => document.getElementById(id);
  const { chapters, stages, chapterFor, folds, colors, start, mayReady, apply, randomId } = WTStory;
  const { icon, boat, ambience } = WTArt;
  const key =
    "wishing-tree:seat:" +
    location.pathname.replace(/index\.html$/, "") +
    ":" +
    (WTRooms.online ? "online" : "local");
  let s = start(),
    room = null,
    people = [],
    mySeat = 0,
    lastSeq = 0,
    timeDifference = 0,
    lastSeen = [],
    busy = false,
    mode = "home",
    sound = false;
  let syncing = false,
    toastTimer,
    pollTimer,
    renderKey = "",
    lastConnection = "",
    retryEvent = null;
  const esc = (t) =>
    String(t ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  const other = () => people[1 - mySeat] || "your love";
  function tell(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 3300);
  }
  function textIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
  }
  function chapterBar(active) {
    $("chapters").innerHTML = chapters
      .map(
        ([symbol, title], i) =>
          (i ? '<span class="path-dot" aria-hidden="true"></span>' : "") +
          '<button class="chapter-button ' +
          (i === active ? "active" : "") +
          '" data-chapter="' +
          i +
          '" ' +
          (i === active ? 'aria-current="step"' : "") +
          '><span class="chapter-icon">' +
          icon(symbol) +
          "</span><span>" +
          title +
          "</span></button>"
      )
      .join("");
  }
  function modal(html) {
    if (!$("dialog").open) $("dialog").showModal();
    $("dialog-body").innerHTML = html;
    requestAnimationFrame(() => {
      ($("dialog").querySelector("input") || $("close-dialog")).focus();
    });
  }
  function close() {
    if ($("dialog").open) $("dialog").close();
  }
  const dialogHead = (symbol, title, desc) =>
    '<div class="dialog-icon">' +
    icon(symbol) +
    '</div><h2 id="dialog-title">' +
    title +
    '</h2><p class="dialog-desc">' +
    desc +
    "</p>";
  function guide(i) {
    if (typeof i === "number") {
      const [symbol, title, thai, desc] = chapters[i];
      modal(
        dialogHead(symbol, title, desc) +
          '<p class="form-note" lang="th">' +
          thai +
          '</p><button class="primary" data-ui="close">Back to the forest</button>'
      );
      return;
    }
    modal(
      dialogHead(
        "book",
        "Your forest guide",
        "One krathong, two seats, and five chapters you turn together."
      ) +
        '<ol class="help-list"><li>One of you creates a room with a nickname. Share the website link and the six-digit code privately.</li><li>Your partner joins with the code and a nickname. Each of you taps to continue at the end of every scene.</li><li>Work on the same krathong. Add your own hair and nail clippings, light the offerings, then make a silent wish.</li><li>When both of you let go, the current takes your krathong. Follow it home for a goodnight kiss.</li></ol>' +
        (!WTRooms.online
          ? '<p class="form-note">Device preview is active. Use two fresh tabs in the same browser for a local room, or explore solo. For separate devices, follow the Supabase steps in README.md.</p>'
          : '<p class="form-note">Your room lasts 24 hours. Refreshing the same tab keeps your seat. Only nicknames and ritual choices are shared.</p>') +
        '<button class="primary" data-ui="close">Back to the forest</button>'
    );
  }
  function entrance(which) {
    const join = which === "join";
    modal(
      dialogHead(
        join ? "key" : "lotus",
        join ? "Join your love" : "Save a place for two",
        join
          ? "Enter the code your partner shared with you."
          : "Choose the name your partner will see in the forest."
      ) +
        '<form id="room-form"><label class="field">Your nickname<input id="nickname" type="text" placeholder="e.g. Bio" maxlength="24" autocomplete="off" required></label>' +
        (join
          ? '<label class="field">Six-digit room code<input id="room-code" class="code-input" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required autocomplete="off"></label>'
          : "") +
        '<p id="form-error" class="error-text" role="alert"></p><button class="primary" type="submit">' +
        icon(join ? "key" : "lotus") +
        (join ? "Join the room" : "Create room code") +
        "</button></form>" +
        '<p class="form-note">' +
        (WTRooms.online
          ? "Two seats per room. Anyone with the code can claim the open seat."
          : "Device preview · This code works in two tabs on this browser. Connect Supabase in config.js for a long-distance date.") +
        "</p>"
    );
    const form = $("room-form");
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = $("nickname").value.trim(),
        code = join ? $("room-code").value.trim() : "";
      if (!name) {
        $("form-error").textContent = "Enter a nickname first.";
        $("nickname").focus();
        return;
      }
      const submit = form.querySelector("button");
      if (submit.disabled) return;
      submit.disabled = true;
      submit.textContent = join ? "Joining…" : "Opening…";
      const pendingKey = key + ":pending:" + (join ? code : "create");
      let token;
      try {
        token = sessionStorage.getItem(pendingKey);
      } catch {}
      if (!token) {
        token = randomId();
        try {
          sessionStorage.setItem(pendingKey, token);
        } catch {}
      }
      const candidate = { code, token };
      try {
        const reply = await WTRooms.call(join ? "join" : "open", { ...candidate, name });
        if (!form.isConnected || !$("dialog").open) return;
        try {
          sessionStorage.removeItem(pendingKey);
        } catch {}
        candidate.code = reply.code;
        close();
        begin("room", candidate);
        saveSeat();
        merge(reply, true);
        render(true);
        startPoll();
      } catch (err) {
        if (form.isConnected) {
          $("form-error").textContent = err.message;
          submit.disabled = false;
          submit.textContent = join ? "Join the room" : "Create room code";
        }
      }
    };
  }
  function begin(next, session) {
    mode = next;
    room = session;
    people = [];
    mySeat = 0;
    lastSeen = [];
    lastSeq = 0;
    s = start();
    renderKey = "";
    lastConnection = "";
    syncing = false;
    busy = false;
    retryEvent = null;
    clearTimeout(pollTimer);
    $("home").hidden = true;
    $("story").hidden = false;
  }
  function saveSeat() {
    try {
      if (room) sessionStorage.setItem(key, JSON.stringify(room));
      else sessionStorage.removeItem(key);
    } catch {}
  }
  function home() {
    begin("home", null);
    saveSeat();
    $("story").hidden = true;
    $("story").replaceChildren();
    $("home").hidden = false;
    document.body.dataset.scene = "home";
    chapterBar(0);
    close();
    $("create").focus();
  }
  function leave() {
    if (mode === "home") return;
    modal(
      dialogHead(
        "moon",
        "Leave the clearing?",
        mode === "solo"
          ? "Your rehearsal will end here."
          : "This will forget your seat on this tab. You can start a new room together."
      ) +
        '<div class="actions" style="margin-top:18px"><button class="secondary" data-ui="close">Stay here</button><button class="primary" data-ui="leave">Leave room</button></div>'
    );
  }
  function solo() {
    close();
    begin("solo", { solo: true });
    people = ["You", "Your companion"];
    render(true);
  }
  function merge(reply, initial = false) {
    if (reply.version < lastSeq) return;
    if (reply.names.length >= people.length) people = reply.names;
    mySeat = reply.seat;
    lastSeen = reply.seen.map((at, i) => Math.max(at, lastSeen[i] || 0));
    timeDifference = Date.now() - reply.now;
    for (const e of reply.events) {
      if (e.seq <= lastSeq) continue;
      if (e.seq !== lastSeq + 1) break;
      apply(s, e);
      lastSeq = e.seq;
      if (!initial && e.seat !== mySeat && Math.abs(reply.now - e.at) < 6500) {
        if (e.kind === "hand") tell(other() + " squeezed your hand.");
        else if (e.kind === "fold") tell(other() + " chose " + folds[e.value]?.toLowerCase() + ".");
        else if (e.kind === "color")
          tell(other() + " chose " + colors[e.value]?.[0].toLowerCase() + ".");
        else if (["marigold", "orchid"].includes(e.kind))
          tell(
            other() +
              (e.value > 0 ? " added" : " removed") +
              " " +
              (e.kind === "orchid" ? "an orchid." : "a marigold.")
          );
      }
    }
    if (!initial) render();
  }
  function startPoll() {
    clearTimeout(pollTimer);
    if (mode === "room") pollTimer = setTimeout(poll, document.hidden ? 7500 : 1600);
  }
  async function poll() {
    if (mode !== "room" || syncing) return;
    const current = room,
      restoring = people.length === 0;
    syncing = true;
    try {
      const reply = await WTRooms.call("sync", { ...current, after: lastSeq });
      if (room !== current) return;
      lastConnection = "";
      merge(reply, restoring);
      if (restoring) render(true);
    } catch (e) {
      if (room === current) {
        lastConnection = e.message;
        render();
      }
    } finally {
      if (room === current) {
        syncing = false;
        startPoll();
      }
    }
  }
  async function send(kind, value = 0) {
    if (busy || !room || !people[1]) return;
    const current = room;
    // If the last reply was lost, retry exactly the same operation ID.
    const event = retryEvent || { id: randomId(), kind, value, stage: s.stage };
    if (mode === "solo") {
      apply(s, { ...event, seat: 0, at: Date.now() });
      if (["nails", "hair", "ready"].includes(event.kind))
        apply(s, { ...event, seat: 1, at: Date.now() });
      if (event.kind === "hand") tell("Your companion squeezes your hand back.");
      render();
      return;
    }
    busy = true;
    render();
    try {
      const reply = await WTRooms.call("act", { ...current, event, after: lastSeq });
      if (room !== current) return;
      lastConnection = "";
      retryEvent = null;
      merge(reply);
    } catch (e) {
      if (room === current) {
        lastConnection = e.message;
        retryEvent = event;
        tell("Your action is pending. Tap Retry action to send it again.");
      }
    } finally {
      if (room === current) {
        busy = false;
        render();
      }
    }
  }
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      tell("Room code copied.");
    } catch {
      tell("Room code · " + room.code);
    }
  }
  const button = (kind, label, options = {}) =>
    '<button data-act="' +
    kind +
    '"' +
    (options.value !== undefined ? ' data-value="' + options.value + '"' : "") +
    ' class="' +
    (options.cls || "primary") +
    '"' +
    (options.pressed !== undefined ? ' aria-pressed="' + options.pressed + '"' : "") +
    (options.aria ? ' aria-label="' + esc(options.aria) + '"' : "") +
    (options.disabled || busy || retryEvent ? " disabled" : "") +
    ">" +
    label +
    "</button>";
  const ui = (name, label, cls = "mini-action") =>
    '<button class="' + cls + '" data-ui="' + name + '">' + label + "</button>";
  const checked = (on) => (on ? icon("check") : "");
  function craft() {
    const leaf = folds
      .map((name, i) =>
        button("fold", icon(["pointed", "petal", "fan"][i]) + name, {
          value: i,
          cls: "option",
          pressed: s.fold === i
        })
      )
      .join("");
    const samples = colors
      .map(
        ([name, color], i) =>
          '<button data-act="color" data-value="' +
          i +
          '" class="swatch" aria-label="' +
          name +
          '" title="' +
          name +
          '" aria-pressed="' +
          (s.color === i) +
          '" style="--sample:' +
          color +
          '"' +
          (busy || retryEvent ? " disabled" : "") +
          ">" +
          checked(i === s.color) +
          "</button>"
      )
      .join("");
    const count = (k, name) =>
      '<div class="count-control"><span>' +
      name +
      "</span>" +
      button(k, "−", {
        value: -1,
        cls: "counter-btn",
        aria: "Remove one " + k,
        disabled: s[k] === 0
      }) +
      '<span class="flower-count">' +
      s[k] +
      "</span>" +
      button(k, "+", {
        value: 1,
        cls: "counter-btn",
        aria: "Add one " + k,
        disabled: s[k] >= WTStory.maxFlowersPerKind
      }) +
      "</div>";
    return (
      '<div class="controls"><fieldset><legend>Banana-leaf fold · ใบตอง</legend><div class="craft-line">' +
      leaf +
      "</div></fieldset>" +
      '<fieldset><legend>Leaf color</legend><div class="craft-line">' +
      samples +
      '<span class="swatch-label">' +
      colors[s.color][0] +
      "</span></div></fieldset>" +
      '<fieldset><legend>Mix your flowers · ดาวเรือง &amp; กล้วยไม้</legend><div class="counter-row">' +
      count("marigold", "Marigold") +
      count("orchid", "Orchid") +
      "</div></fieldset>" +
      '<fieldset><legend>Place the offerings</legend><div class="craft-line">' +
      ["candle", "incense"]
        .map((k, i) =>
          button(k, checked(s[k]) + (i ? "Three incense sticks · ธูป" : "Candle · เทียน"), {
            cls: "toggle",
            pressed: s[k],
            disabled: s[k]
          })
        )
        .join("") +
      "</div></fieldset></div>"
    );
  }
  function render(force = false) {
    if (mode === "home") return;
    const now = Date.now() - timeDifference;
    const away = mode === "room" && people[1] && now - lastSeen[1 - mySeat] > 45000;
    const stamp = JSON.stringify([
      s,
      people,
      mySeat,
      mode,
      busy,
      !!retryEvent,
      lastConnection,
      !!away
    ]);
    if (!force && stamp === renderKey) return;
    renderKey = stamp;
    const stage = s.stage,
      chapter = chapterFor[stage],
      scene = stages[stage],
      was = document.body.dataset.scene;
    const focused = document.activeElement?.closest("#story button");
    const oldAct = focused?.dataset.act,
      oldVal = focused?.dataset.value,
      oldUi = focused?.dataset.ui,
      oldAria = focused?.getAttribute("aria-label");
    document.body.dataset.scene = scene;
    chapterBar(chapter);
    const party =
      mode === "solo" ? "Solo rehearsal" : WTRooms.online ? "Online room" : "Device preview";
    const top =
      '<div class="roomline"><span class="room-meta">' +
      esc(party) +
      "</span>" +
      (mode === "room"
        ? ui("copy", '<span class="letterspace">' + esc(room.code) + "</span>" + icon("copy"))
        : "") +
      (people[1] ? button("hand", icon("hand") + "Squeeze hand", { cls: "mini-action" }) : "") +
      "</div>";
    const tag =
      '<div class="story-tag">' +
      icon(chapters[chapter][0]) +
      chapters[chapter][1] +
      ' · <span lang="th">' +
      chapters[chapter][2] +
      "</span></div>";
    let title = "",
      desc = "",
      controls = "",
      action = "",
      hint = "",
      visual = "";
    const readyLabels = [
      "Hold hands",
      "Our krathong is ready",
      "Settle by the water",
      "Sit together",
      "I’ve made my wish",
      "Let go together",
      "Follow the fireflies",
      "Walk to bed",
      "Turn out the light",
      ""
    ];
    if (people.length < 2) {
      title = people.length ? "A place beside you." : "Finding your place…";
      desc = people.length
        ? "The fireflies are gathering. Send this room code to your love and meet beneath the branches."
        : "Reopening your seat in the forest.";
      if (people.length)
        controls =
          '<div class="wait-code">' +
          esc(room.code) +
          '<button type="button" data-ui="copy" aria-label="Copy room code">' +
          icon("copy") +
          "</button>" +
          '</div><div class="wait-note"><span class="smallcaps">One of two seats filled</span><p class="subtle">' +
          (WTRooms.online
            ? "Share this website’s link and the code. Your partner chooses Join with a code."
            : "Open the same URL in a fresh tab in this browser, choose Join with a code, and enter a second nickname.") +
          "</p></div>";
    } else {
      const partner = esc(other());
      const titles = [
        "There you are.",
        "Fold a little moon.",
        "Something to let go.",
        "Borrow a little fire.",
        "Make a quiet wish.",
        "On the count of two.",
        "Look, it’s floating.",
        "One last kiss.",
        "Come to bed.",
        "ฝันดีนะ"
      ];
      const descs = [
        "You spot " +
          partner +
          " beneath sprays of glowing baby’s breath (ยิปโซ). A firefly lands between your hands. Beyond the roots, the river turns in a slow circle.",
        "Your hands meet over a round slice of banana stem. Fold the ใบตอง, tuck in marigolds and orchids, then give the candle and incense a place at the center.",
        "You sit shoulder to shoulder. Snip a tiny nail clipping and a strand of hair, then tuck them beneath the leaves. The river can carry a little of this year away.",
        "Cup your hands around the wick. One flame for the candle, then a glowing tip for each of the three incense sticks.",
        "หลับตาแล้วขอพร · Close your eyes beside " +
          partner +
          ". Hold one wish in your mind. Take as long as you like.",
        "Kneel at the water’s edge with " +
          partner +
          ". You each hold one side of the banana-stem base. When both hands open, it will float.",
        "The candle bends in the breeze. Your krathong circles the old tree, carrying both unspoken wishes through the reflections of rainbow flowers.",
        "A firefly catches in your hair. " +
          partner +
          " leans close, brushes it away, and stays for a soft goodnight kiss.",
        "Still holding hands, you walk barefoot to bed. Behind the curtain, the last firefly blinks. The little lamp is yours to turn out together.",
        "Goodnight, " +
          partner +
          ". Somewhere beyond the window, a small candle is still circling the tree."
      ];
      title = titles[stage];
      desc = descs[stage];
      if (stage === 1) {
        controls = craft();
        if (!mayReady(s, mySeat))
          hint = "Add at least one flower, the candle, and all three incense sticks.";
      }
      if (stage === 2) {
        controls =
          '<div class="controls"><div class="control-title">Your keepsakes</div><div class="craft-line">' +
          button(
            "nails",
            checked(s.nails[mySeat]) +
              (s.nails[mySeat] ? "Nail clipping tucked in" : "Snip a nail clipping"),
            { cls: "toggle", pressed: s.nails[mySeat], disabled: s.nails[mySeat] }
          ) +
          button(
            "hair",
            checked(s.hair[mySeat]) + (s.hair[mySeat] ? "Hair tucked in" : "Snip a strand of hair"),
            { cls: "toggle", pressed: s.hair[mySeat], disabled: s.hair[mySeat] }
          ) +
          "</div></div>";
      }
      if (stage === 3)
        controls =
          '<div class="craft-line">' +
          button(
            "candleLit",
            checked(s.candleLit) + (s.candleLit ? "Candle lit" : "Light the candle"),
            { cls: "secondary", disabled: s.candleLit }
          ) +
          button(
            "incenseLit",
            checked(s.incenseLit) + (s.incenseLit ? "Incense lit" : "Light the incense"),
            { cls: "secondary", disabled: s.incenseLit || !s.candleLit }
          ) +
          "</div>";
      if (stage < 9) {
        action = button(
          "ready",
          s.ready[mySeat] ? icon("check") + "You’re ready" : readyLabels[stage],
          { disabled: s.ready[mySeat] || !mayReady(s, mySeat) }
        );
        if (s.ready[mySeat]) hint = "Waiting for " + partner + "…";
        else if (s.ready[1 - mySeat]) hint = partner + " is ready when you are.";
      } else action = ui("finish", "Return to the forest", "primary");
      if ([1, 2, 3, 4, 5].includes(stage))
        visual =
          '<div class="artist"><div class="artist-head"><span>Our krathong</span><span lang="th">กระทงของเรา</span></div><canvas id="basket" role="img" aria-label="Shared ' +
          esc(colors[s.color][0]) +
          " " +
          esc(folds[s.fold]) +
          " krathong with " +
          s.marigold +
          " marigolds and " +
          s.orchid +
          ' orchids"></canvas><div class="artist-foot"><span>Banana-stem base</span>·<span>' +
          s.marigold +
          " marigold" +
          (s.marigold === 1 ? "" : "s") +
          " + " +
          s.orchid +
          " orchid" +
          (s.orchid === 1 ? "" : "s") +
          "</span></div></div>";
      if (stage === 6)
        visual =
          '<canvas class="flowing" id="basket" role="img" aria-label="Your decorated krathong circling the tree"></canvas>';
    }
    const connection = lastConnection
      ? '<p role="status" class="error-text">' + esc(lastConnection) + "</p>"
      : away
        ? '<p class="status-text">Waiting for ' +
          esc(other()) +
          " to reconnect. Their seat is saved.</p>"
        : "";
    const names = people[1]
      ? '<p class="status-text">' +
        icon("heart", 13) +
        " &nbsp;" +
        esc(people[0]) +
        " &amp; " +
        esc(people[1]) +
        "</p>"
      : "";
    $("story").innerHTML =
      '<div class="story-copy">' +
      top +
      tag +
      '<h1 class="scene-title" id="scene-heading" tabindex="-1">' +
      title +
      '</h1><p class="narrative">' +
      desc +
      "</p>" +
      controls +
      '<div class="joint-action">' +
      (retryEvent ? ui("retry", "Retry action", "primary") : action) +
      "</div>" +
      (hint ? '<p class="status-text">' + hint + "</p>" : "") +
      names +
      connection +
      '<button class="text-button" data-ui="exit">' +
      (mode === "solo" ? "End rehearsal" : "Leave room") +
      "</button></div>" +
      visual;
    boat($("basket"), s);
    if (stage === 6 && $("basket"))
      $("basket").style.animationDelay = -Math.max(0, ((now - s.liftedAt) / 1000) % 17) + "s";
    if (was !== scene) {
      $("scene-heading")?.focus({ preventScroll: true });
    } else if (oldAct || oldUi) {
      const match = Array.from($("story").querySelectorAll("button")).find(
        (b) =>
          !b.disabled &&
          b.dataset.act === oldAct &&
          b.dataset.value === oldVal &&
          b.dataset.ui === oldUi &&
          b.getAttribute("aria-label") === oldAria
      );
      match?.focus({ preventScroll: true });
    }
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.hasAttribute("data-chapter")) return guide(Number(b.dataset.chapter));
    if (b.dataset.act) return send(b.dataset.act, Number(b.dataset.value || 0));
    switch (b.dataset.ui) {
      case "close":
        return close();
      case "copy":
        return copyCode();
      case "exit":
        return leave();
      case "leave":
      case "finish":
        return home();
      case "retry":
        return send(retryEvent?.kind || "ready");
    }
  });
  $("create").onclick = () => entrance("open");
  $("join").onclick = () => entrance("join");
  $("rehearse").onclick = solo;
  $("brand").onclick = (e) => {
    e.preventDefault();
    if (mode !== "home") leave();
  };
  $("help").onclick = () => guide();
  $("close-dialog").onclick = close;
  $("dialog").onclick = (e) => {
    if (e.target === $("dialog")) close();
  };
  $("sound").onclick = async () => {
    const b = $("sound");
    b.disabled = true;
    try {
      await ambience(!sound);
      sound = !sound;
      b.setAttribute("aria-pressed", String(sound));
      b.innerHTML =
        icon(sound ? "sound" : "muted") +
        '<span class="sound-label">Sound ' +
        (sound ? "on" : "off") +
        "</span>";
    } catch (e) {
      tell(e.message);
    } finally {
      b.disabled = false;
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && mode === "room") {
      clearTimeout(pollTimer);
      poll();
    }
  });
  function init() {
    textIcons();
    chapterBar(0);
    let dots = "";
    for (let i = 0; i < 40; i++)
      dots +=
        '<i style="left:' +
        (7 + ((i * 37.1) % 90)) +
        "%;top:" +
        (15 + ((i * 13.3) % 72)) +
        "%;--time:" +
        (3 + (i % 6)) +
        "s;animation-delay:-" +
        ((i * 1.23) % 9) +
        's"></i>';
    $("fireflies").innerHTML = dots;
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem(key));
    } catch {}
    if (saved && /^\d{6}$/.test(saved.code) && typeof saved.token === "string") {
      begin("room", saved);
      render(true);
      poll();
    }
  }
  init();
})();
