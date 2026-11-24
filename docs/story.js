/* The same chronological, seat-bound actions drive local and online rooms. */
(() => {
  const chapters = [
    [
      "moon",
      "The clearing",
      "ใต้ต้นไม้",
      "Follow the fireflies to the tree and take each other’s hand."
    ],
    [
      "leaf",
      "Leaf & bloom",
      "พับใบตอง",
      "Fold banana leaves around a banana-stem base. Choose your flowers together."
    ],
    [
      "flame",
      "Candlelight",
      "แสงเทียน",
      "Tuck away a little of the old year, then light the candle and incense."
    ],
    [
      "wave",
      "The wishing river",
      "สายน้ำ",
      "Keep your wish in your heart. Let go together and watch the river carry it."
    ],
    ["stars", "Goodnight", "ฝันดี", "Follow the last firefly home, hand in hand."]
  ];
  const stages = [
    "clearing",
    "craft",
    "keepsakes",
    "light",
    "wish",
    "release",
    "floating",
    "kiss",
    "bed",
    "dark"
  ];
  const chapterFor = [0, 1, 2, 2, 3, 3, 3, 4, 4, 4];
  const maxFlowersPerKind = 12;
  const folds = ["Pointed petal", "Lotus petal", "Fan fold"];
  const colors = [
    ["Banana green", "#648647"],
    ["Pandan", "#285d4c"],
    ["Young leaf", "#a3b66a"],
    ["Lotus pink", "#c78296"],
    ["Dusky violet", "#9280a9"]
  ];
  function start() {
    return {
      stage: 0,
      fold: 0,
      color: 0,
      marigold: 0,
      orchid: 0,
      candle: false,
      incense: false,
      nails: [false, false],
      hair: [false, false],
      candleLit: false,
      incenseLit: false,
      ready: [false, false],
      liftedAt: 0
    };
  }
  function mayReady(s, seat) {
    if (s.stage === 1) return s.marigold + s.orchid > 0 && s.candle && s.incense;
    if (s.stage === 2) return s.nails[seat] && s.hair[seat];
    if (s.stage === 3) return s.candleLit && s.incenseLit;
    return s.stage < stages.length - 1;
  }
  function apply(s, event) {
    const { kind, value, seat, stage } = event;
    if (s.stage !== stage || ![0, 1].includes(seat)) return;
    if (kind === "ready") {
      if (!mayReady(s, seat)) return;
      s.ready[seat] = true;
      if (s.ready.every(Boolean)) {
        s.stage++;
        s.ready = [false, false];
        if (s.stage === 6) s.liftedAt = event.at;
      }
      return;
    }
    if (s.stage === 1) {
      let changed = false;
      if (kind === "fold" && Number.isInteger(value) && folds[value] && s.fold !== value) {
        s.fold = value;
        changed = true;
      }
      if (kind === "color" && Number.isInteger(value) && colors[value] && s.color !== value) {
        s.color = value;
        changed = true;
      }
      if (["marigold", "orchid"].includes(kind) && [1, -1].includes(value)) {
        const count = Math.min(maxFlowersPerKind, Math.max(0, s[kind] + value));
        changed = s[kind] !== count;
        s[kind] = count;
      }
      if (["candle", "incense"].includes(kind) && !s[kind]) {
        s[kind] = true;
        changed = true;
      }
      if (changed) s.ready = [false, false];
    }
    if (s.stage === 2 && ["nails", "hair"].includes(kind)) s[kind][seat] = true;
    if (s.stage === 3 && ["candleLit", "incenseLit"].includes(kind)) s[kind] = true;
  }
  function randomId() {
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    return [...b]
      .map((v, i) => ([4, 6, 8, 10].includes(i) ? "-" : "") + v.toString(16).padStart(2, "0"))
      .join("");
  }
  globalThis.WTStory = {
    chapters,
    stages,
    chapterFor,
    maxFlowersPerKind,
    folds,
    colors,
    start,
    mayReady,
    apply,
    randomId
  };
})();
