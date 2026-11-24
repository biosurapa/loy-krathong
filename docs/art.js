(() => {
  const paths = {
    lotus:
      '<path d="M3 12c4 0 7 2 9 6-5 0-8-2-9-6Zm18 0c-4 0-7 2-9 6 5 0 8-2 9-6Z"/><path d="M12 17c-4-3-5-6-4-9 3 1 4 3 4 5 0-2 1-4 4-5 1 3 0 6-4 9ZM6 20c3 1 4 1 6 0 2 1 4 1 6 0M12 9V6m0-2c-2-1-1-3 1-4 0 2 1 3-1 4Z"/>',
    moon: '<path d="M19.8 15.8A8.8 8.8 0 0 1 8.4 4.2a8.8 8.8 0 1 0 11.4 11.6Z"/><path d="M17.5 3.5v4m-2-2h4"/>',
    leaf: '<path d="M4 19C3 10 9 4 20 4c0 11-6 17-15 15Zm1 0L16 8m-6 7v-5m0 5h5"/>',
    flame: '<path d="M7 21h10m-8-3V10h6v8m-5-9c-3-3 1-5 3-8 0 3 3 5 1 7-1 2-3 2-4 1Zm-4 9h12"/>',
    wave: '<path d="M2 10q3-3 6 0t6 0t8 0M2 15q3-3 6 0t6 0t8 0M7 5q2-2 4 0t4 0"/>',
    stars:
      '<path d="m10 3 1.7 5.3L17 10l-5.3 1.7L10 17l-1.7-5.3L3 10l5.3-1.7L10 3Zm8 11 .9 2.7 2.6.8-2.6.9L18 21l-.9-2.6-2.6-.9 2.6-.8L18 14Z"/>',
    sprig:
      '<path d="M6 23q7-10 11-22M10 17q-7-1-6-7 6 2 6 7Zm3-6q6-1 7-7-6 1-7 7Zm-1 2q-6-4-4-9 5 3 4 9Zm-3 6q6 1 9-4-5-1-9 4Z"/>',
    book: '<path d="M3 5c3-1 6-1 9 2 3-3 6-3 9-2v14c-3-1-6-1-9 1-3-2-6-2-9-1V5Zm9 2v13"/>',
    muted: '<path d="M3 9h4l5-4v14l-5-4H3V9Zm13 1 5 5m0-5-5 5"/>',
    sound: '<path d="M3 9h4l5-4v14l-5-4H3V9Zm13-1c3 2 3 6 0 8m2-11c5 3 5 11 0 14"/>',
    play: '<path d="m8 5 10 7-10 7V5Z"/>',
    key: '<circle cx="8" cy="9" r="4"/><path d="m11 12 8 8h3v-3h-3v-3h-3"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    heart: '<path d="M12 20 4 12C-1 6 7 1 12 7c5-6 13-1 8 5l-8 8Z"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 5V3H4v14h2"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    pointed: '<path d="m4 19 8-16 8 16H4Zm8-16v16m0-9 5 9"/>',
    petal: '<path d="M12 3C2 10 3 17 6 20h12c3-3 4-10-6-17Zm0 0v17m0-1 6-7m-6 7-6-7"/>',
    fan: '<path d="m4 9 3-4 4 2 3-3 5 3 3 4-10 10L3 12l1-3Zm3-4 5 16m-1-14 1 14 7-14m-5-3-2 17"/>',
    hand: '<path d="M5 12c-1-3 0-4 2-2l2 3V5c0-2 3-2 3 0v6-8c0-2 3-2 3 0v8-6c0-2 3-2 3 0v7-4c0-2 3-2 3 0v7c0 5-2 7-6 7h-2c-3 0-4-2-6-5l-2-5Z"/>'
  };
  function icon(name, size = 22) {
    return (
      '<svg aria-hidden="true" width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">' +
      (paths[name] || "") +
      "</svg>"
    );
  }
  function boat(canvas, s) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 880;
    canvas.height = 610;
    ctx.scale(2, 2);
    function ellipse(x, y, rx, ry, fill, angle = 0) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
      ctx.fillStyle = fill;
      ctx.fill();
    }
    function line(points, stroke, width = 1) {
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      for (const p of points.slice(1)) ctx.lineTo(...p);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    function path(draw, fill, stroke = null) {
      ctx.beginPath();
      draw();
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
    function shade(hex, amount) {
      return (
        "rgb(" +
        [1, 3, 5]
          .map((i) =>
            Math.round(Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) + amount)))
          )
          .join(",") +
        ")"
      );
    }
    const base = WTStory.colors[s.color][1];
    ellipse(220, 261, 137, 15, "rgba(2,10,10,.32)");
    path(() => {
      ctx.moveTo(82, 197);
      ctx.lineTo(91, 231);
      ctx.bezierCurveTo(120, 270, 328, 270, 350, 231);
      ctx.lineTo(358, 197);
    }, "#797e44");
    for (let i = 0; i < 36; i++) {
      const a = (i * Math.PI) / 35;
      const x = 220 + 132 * Math.cos(a),
        y = 202 + 40 * Math.sin(a);
      line(
        [
          [x, y],
          [220 + (x - 220) * 0.97, y + 13]
        ],
        "#b2aa70",
        1.2
      );
    }
    ellipse(220, 194, 138, 44, "#b9b581");
    ellipse(220, 194, 129, 38, "#ddd3a0");
    for (let i = 0; i < 45; i++) {
      const a = i * 2.4,
        r = Math.sqrt((i + 1) / 46);
      ellipse(220 + 120 * r * Math.cos(a), 194 + 32 * r * Math.sin(a), 2, 1.1, "#ab9d6b");
    }
    function folded(x, y, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const light = ctx.createLinearGradient(-24, 0, 20, 0);
      light.addColorStop(0, shade(base, -33));
      light.addColorStop(0.53, shade(base, 16));
      light.addColorStop(1, shade(base, -2));
      path(
        () => {
          ctx.moveTo(-24, 4);
          if (s.fold === 0) {
            ctx.lineTo(3, -54);
            ctx.lineTo(25, 4);
          }
          if (s.fold === 1) {
            ctx.bezierCurveTo(-28, -14, -10, -34, 5, -48);
            ctx.bezierCurveTo(8, -36, 34, -18, 25, 4);
          }
          if (s.fold === 2) {
            ctx.lineTo(-27, -24);
            ctx.lineTo(-18, -32);
            ctx.lineTo(-10, -30);
            ctx.lineTo(-4, -43);
            ctx.lineTo(5, -36);
            ctx.lineTo(15, -42);
            ctx.lineTo(25, -31);
            ctx.lineTo(29, -19);
            ctx.lineTo(24, 4);
          }
          ctx.quadraticCurveTo(0, 13, -24, 4);
        },
        light,
        shade(base, 42)
      );
      if (s.fold === 2) {
        for (const [x1, y1] of [
          [-24, -23],
          [-17, -31],
          [-4, -41],
          [6, -34],
          [15, -40],
          [24, -29]
        ])
          line(
            [
              [1, 6],
              [x1, y1]
            ],
            shade(base, 55),
            0.8
          );
      } else {
        path(
          () => {
            ctx.moveTo(3, s.fold === 0 ? -54 : -47);
            ctx.lineTo(1, 6);
            ctx.lineTo(20, 5);
          },
          shade(base, -14)
        );
        line(
          [
            [1, 5],
            [3, s.fold === 0 ? -51 : -44]
          ],
          shade(base, 64),
          1
        );
        for (let i = 0; i < 3; i++)
          line(
            [
              [-14 + i * 3, 0],
              [0, -10 - i * 7]
            ],
            shade(base, 32),
            0.7
          );
      }
      ctx.restore();
    }
    for (let i = 0; i < 19; i++) {
      const a = Math.PI + (i * Math.PI) / 18;
      folded(220 + 128 * Math.cos(a), 202 + 36 * Math.sin(a), Math.cos(a) * 0.38);
    }
    function marigold(k) {
      ctx.rotate(k * 0.9);
      ellipse(0, 2, 18, 14, "#9c621f");
      for (let ring = 3; ring >= 0; ring--) {
        const count = ring * 5 + 5;
        for (let i = 0; i < count; i++) {
          const a = (i * Math.PI * 2) / count + ring * 0.58;
          ellipse(
            Math.cos(a) * ring * 4.2,
            Math.sin(a) * ring * 3.2,
            5.3,
            3.3,
            ["#ffdf77", "#ffbd46", "#e99b27", "#d18121"][(i + ring) % 4],
            a
          );
        }
      }
    }
    function orchid(k) {
      ctx.rotate(0.25 * Math.sin(k));
      const palette = ["#cf8dbe", "#d99ecb", "#b474ab", "#c27caf", "#e7b2cf"];
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - 0.3;
        ellipse(9 * Math.cos(a), 8 * Math.sin(a), 12, 7.2, palette[i], a);
        line(
          [
            [4 * Math.cos(a), 4 * Math.sin(a)],
            [16 * Math.cos(a), 13 * Math.sin(a)]
          ],
          "#ad6697",
          0.7
        );
      }
      ellipse(0, 3, 6, 5, "#9b4c81");
      ellipse(0, 2, 3.5, 2.5, "#ffcf74");
    }
    // Fill the bowl from side to side first, then build up a staggered floral crown.
    // Slots stay fixed as either partner adds or removes a bloom.
    const marigoldSlots = [
      [158, 170], [274, 169], [216, 181], [312, 149],
      [184, 146], [238, 144], [129, 148], [162, 125],
      [282, 126], [220, 119], [136, 188], [302, 190]
    ];
    const orchidSlots = [
      [291, 150], [184, 177], [248, 185], [122, 167],
      [216, 153], [320, 174], [152, 146], [251, 121],
      [193, 123], [267, 146], [171, 194], [279, 193]
    ];
    const blooms = [];
    for (const [slots, count, draw] of [
      [marigoldSlots, s.marigold, marigold],
      [orchidSlots, s.orchid, orchid]
    ]) {
      slots.slice(0, count).forEach(([x, y], index) => blooms.push({ x, y, index, draw }));
    }
    blooms.sort((a, b) => a.y - b.y);
    function drawBloom({ x, y, index, draw }) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1.35, 1.35);
      draw(index);
      ctx.restore();
    }
    // The front flowers wrap around the foot of the candle and incense.
    for (const bloom of blooms) if (bloom.y < 178) drawBloom(bloom);
    if (s.incense)
      for (let i = 0; i < 3; i++) {
        const x = 239 + i * 4,
          top = 237 + i * 8,
          y = 74 + Math.abs(1 - i) * 7;
        line(
          [
            [x, 184],
            [top, y]
          ],
          "#dbc09c",
          2.7
        );
        line(
          [
            [x, 184],
            [x + (top - x) * 0.28, 153]
          ],
          "#ab5746",
          3
        );
        if (s.incenseLit) {
          ellipse(top, y, 1.9, 2.5, "#ffb361");
          ctx.beginPath();
          ctx.moveTo(top, y - 3);
          ctx.bezierCurveTo(top - 12, y - 18, top + 16, y - 26, top - 2, y - 47);
          ctx.strokeStyle = "rgba(232,228,225,.68)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    if (s.candle) {
      const wax = ctx.createLinearGradient(205, 0, 218, 0);
      wax.addColorStop(0, "#ab7839");
      wax.addColorStop(0.25, "#ffe4a3");
      wax.addColorStop(1, "#e5bc70");
      ctx.fillStyle = wax;
      ctx.fillRect(205, 113, 13, 74);
      ellipse(211.5, 113, 6.5, 2.6, "#ffe9b0");
      line(
        [
          [211, 113],
          [212, 106]
        ],
        "#45392d",
        1.5
      );
      if (s.candleLit) {
        const glow = ctx.createRadialGradient(211, 97, 1, 211, 97, 45);
        glow.addColorStop(0, "rgba(255,208,109,.55)");
        glow.addColorStop(1, "rgba(255,197,105,0)");
        ellipse(211, 97, 46, 46, glow);
        path(() => {
          ctx.moveTo(211, 109);
          ctx.bezierCurveTo(197, 103, 213, 87, 215, 79);
          ctx.bezierCurveTo(213, 90, 223, 102, 211, 109);
        }, "#ffc56a");
        ellipse(212, 101, 3, 6, "#fff3be");
      }
    }
    for (const bloom of blooms) if (bloom.y >= 178) drawBloom(bloom);
    for (let i = 0; i <= 14; i++) {
      const a = (i * Math.PI) / 14;
      folded(220 + 130 * Math.cos(a), 208 + 37 * Math.sin(a), Math.cos(a) * 0.4);
    }
    if (s.nails.some(Boolean) || s.hair.some(Boolean)) {
      ellipse(196, 199, 6, 1.8, "#eccbb0");
    }
  }
  let context, volume;
  async function ambience(on) {
    if (!on) {
      if (context) await context.suspend();
      return;
    }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw Error("Sound is unavailable in this browser.");
    if (!context) {
      context = new Audio();
      volume = context.createGain();
      volume.gain.value = 0.12;
      volume.connect(context.destination);
      const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate),
        samples = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < samples.length; i++) {
        last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.025;
        samples[i] = last * 2;
      }
      const water = context.createBufferSource();
      water.buffer = buffer;
      water.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;
      water.connect(filter);
      filter.connect(volume);
      water.start();
      for (const [tone, speed] of [
        [3250, 0.19],
        [3770, 0.13]
      ]) {
        const chirp = context.createOscillator(),
          gain = context.createGain(),
          swell = context.createOscillator(),
          depth = context.createGain();
        chirp.frequency.value = tone;
        gain.gain.value = 0.008;
        swell.frequency.value = speed;
        depth.gain.value = 0.007;
        swell.connect(depth);
        depth.connect(gain.gain);
        chirp.connect(gain);
        gain.connect(volume);
        chirp.start();
        swell.start();
      }
    }
    await context.resume();
  }
  globalThis.WTArt = { icon, boat, ambience };
})();
