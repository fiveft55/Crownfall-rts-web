/* The entire game uses ONE generated image: atlas.png (4096 px wide; layout computed below).
   This generator constructs it from polygons/lines, hatches surfaces, then
   quantizes R/G/B channels with a Bayer dither. See docs/ART.md. */
(() => {
  const CELL = 128,
    COLS = 32,
    BUILDING_SIZE = 128,
    BUILDING_HEIGHT = 192,
    BUILDING_COLUMNS = 32,
    BUILDING_BASE_Y = 128;
  const buildingKinds = [4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 41];
  const raceTemplates = [
    {
      id: "imperials",
      name: "Imperials",
      skin: "#c5a17b",
      roof: "#6d8192",
      units: [0, 1, 2, 3, 19, 20, 28, 31],
    },
    {
      id: "highlanders",
      name: "Highlanders",
      skin: "#c99066",
      roof: "#a17b48",
      units: [0, 1, 19, 20, 22, 28, 30],
    },
    {
      id: "rebels",
      name: "Rebels",
      skin: "#b68d68",
      roof: "#8b7450",
      units: [0, 1, 2, 3, 19, 20, 21, 28, 32],
    },
    {
      id: "orcs",
      name: "Orcs",
      skin: "#78924f",
      roof: "#7c5740",
      units: [0, 1, 19, 20, 22, 29, 34],
    },
    {
      id: "goblins",
      name: "Goblins",
      skin: "#9d9a50",
      roof: "#92754e",
      units: [0, 1, 2, 19, 20, 21, 29, 35],
    },
    {
      id: "high-elves",
      name: "High Elves",
      skin: "#d5bd97",
      roof: "#719489",
      units: [0, 1, 2, 19, 20, 21, 28, 33],
    },
    {
      id: "long-ears",
      name: "LongEars",
      skin: "#9b6b4d",
      roof: "#a57350",
      units: [0, 1, 2, 19, 20, 21, 28, 36],
    },
    {
      id: "dwarves",
      name: "Dwarves",
      skin: "#bd8e62",
      roof: "#7e8984",
      units: [0, 1, 19, 20, 23, 27, 29, 37],
    },
    {
      id: "hobbits",
      name: "Hobbits",
      skin: "#bc9a72",
      roof: "#748153",
      units: [0, 1, 2, 19, 20, 28, 39],
    },
    {
      id: "chaos-legion",
      name: "Chaos Legion",
      skin: "#cbc6a3",
      roof: "#635c76",
      units: [0, 24, 25, 26, 28, 38],
    },
  ];
  for (const race of raceTemplates) if (race.units.includes(19)) {
    if (!race.units.includes(40)) race.units.push(40);
    if (!race.units.includes(20)) race.units.push(20);
  }
  const BUILDING_SLOTS = buildingKinds.length + 3;
  const UNIT_SIZE = 64,
    UNIT_ROW_HEIGHT = 48,
    UNIT_COLUMNS = 64,
    BUILDING_ROWS = Math.ceil(
      (BUILDING_SLOTS * 10 * 3) / BUILDING_COLUMNS,
    ),
    UNIT_BASE_Y = BUILDING_BASE_Y + BUILDING_ROWS * BUILDING_HEIGHT;
  // Omit ages where a class cannot exist; spend the saved cells on clearer 64px poses.
  const minUnitAge = (kind) =>
    [0, 19, 24].includes(kind)
      ? 1
      : kind === 40
        ? 2
        : kind === 3 || kind === 20 || kind >= 30
          ? 3
          : 2;
  const unitOffsets = Array.from({ length: 3 }, () => []);
  let unitPoseCount = 0;
  for (let age = 1; age <= 3; age++)
    for (let race = 0; race < raceTemplates.length; race++) {
      const offsets = {};
      for (const kind of raceTemplates[race].units)
        if (age >= minUnitAge(kind)) {
          offsets[kind] = unitPoseCount;
          unitPoseCount += kind === 0 ? 104 : kind === 33 ? 56 : 40;
        }
      unitOffsets[age - 1][race] = offsets;
    }
  const unitActions = {
    idle: [0, 8],
    walk: [8, 16],
    attack: [24, 16],
    chop: [40, 16],
    mine: [56, 16],
    pick: [72, 16],
    build: [88, 16],
    melee: [40, 16],
  };
  function actionsFor(kind) {
    return kind === 0
      ? ["idle", "walk", "attack", "chop", "mine", "pick", "build"]
      : kind === 33
        ? ["idle", "walk", "attack", "melee"]
        : ["idle", "walk", "attack"];
  }
  function idleStyle() {
    return "breathe";
  }
  const teamNames = [
    "Blue",
    "Crimson",
    "Amber",
    "Jade",
    "Violet",
    "Ivory",
    "Rose",
    "Teal",
    "Copper",
    "Lime",
    "Indigo",
    "Orange",
    "Silver",
    "Magenta",
    "Olive",
    "Sky",
  ];
  const palettes = [
    ["#60878e", "#3b626e", "#91acaa"],
    ["#b65d48", "#8a443b", "#d4875e"],
    ["#c6a04d", "#8e6d36", "#e0c783"],
    ["#559b69", "#366347", "#8fbd85"],
    ["#9275ad", "#5f497e", "#b99acc"],
    ["#c6c1a2", "#89886d", "#ede2bd"],
    ["#bc7f95", "#814c68", "#deb0c0"],
    ["#4b9d9a", "#2b6c70", "#8bc9bc"],
    ["#b58250", "#785639", "#d5aa76"],
    ["#a0b54f", "#647c33", "#c9d981"],
    ["#665fab", "#383972", "#a09bd5"],
    ["#cf803c", "#8e4b26", "#edb077"],
    ["#9ca7b0", "#616a7d", "#d0dbe1"],
    ["#b05ab0", "#743b7f", "#db96d8"],
    ["#8f9958", "#555e36", "#c0c48a"],
    ["#65acd0", "#346f96", "#9dd8e7"],
  ];
  let ctx,
    rng = 93481;
  const rand = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  function poly(points, fill, stroke = "#273528") {
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  function line(x, y, a, b, color = "#65734b", width = 1) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(a, b);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function ellipse(x, y, rx, ry, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function hatch(points, fill, shade, spacing = 4) {
    poly(points, fill);
    ctx.save();
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.closePath();
    ctx.clip();
    for (let x = -128; x < 256; x += spacing) line(x, 0, x - 100, 128, shade);
    ctx.restore();
  }
  function shadow(rx = 18, ry = 8) {
    ellipse(65, 100, rx, ry, "#1426196e");
  }
  // Cloth is animated at draw time; no frozen flags remain baked into the atlas.
  function flag() {}
  function roof(cx, cy, w, h, team) {
    const blue = palettes[team];
    hatch(
      [
        [cx - w, cy],
        [cx, cy - h],
        [cx + w, cy],
        [cx, cy + h * 0.55],
      ],
      blue[0],
      blue[1],
      5,
    );
    poly(
      [
        [cx - w, cy],
        [cx, cy + h * 0.55],
        [cx, cy + h * 0.55 + 5],
        [cx - w, cy + 5],
      ],
      blue[1],
    );
    poly(
      [
        [cx, cy + h * 0.55],
        [cx + w, cy],
        [cx + w, cy + 5],
        [cx, cy + h * 0.55 + 5],
      ],
      blue[1],
    );
    line(cx - w, cy, cx, cy - h, blue[2], 2);
    line(cx, cy - h, cx + w, cy, blue[2]);
    for (let i = 1; i < 5; i++) {
      let f = i / 5;
      line(
        cx - w * f,
        cy - h * (1 - f),
        cx + w * (1 - f),
        cy + h * 0.55 * f,
        blue[1],
      );
    }
  }
  function block(cx, cy, w, d, height) {
    poly(
      [
        [cx - w, cy],
        [cx, cy + d],
        [cx + w, cy],
        [cx, cy - d],
      ],
      "#9b936b",
    );
    hatch(
      [
        [cx - w, cy],
        [cx, cy + d],
        [cx, cy + d - height],
        [cx - w, cy - height],
      ],
      "#b6ad83",
      "#9d9a73",
      7,
    );
    hatch(
      [
        [cx, cy + d],
        [cx + w, cy],
        [cx + w, cy - height],
        [cx, cy + d - height],
      ],
      "#868969",
      "#777c5d",
      5,
    );
    poly(
      [
        [cx - w, cy - height],
        [cx, cy + d - height],
        [cx + w, cy - height],
        [cx, cy - d - height],
      ],
      "#c8bb91",
    );
    for (let j = 0; j < height; j += 7) {
      line(cx - w, cy - j, cx, cy + d - j, "#7c80634a");
      line(cx, cy + d - j, cx + w, cy - j, "#4d675742");
    }
  }
  function door(x, y) {
    poly(
      [
        [x - 5, y],
        [x + 5, y - 5],
        [x + 5, y - 20],
        [x, y - 23],
        [x - 5, y - 18],
      ],
      "#3c493b",
    );
    line(x, y - 3, x, y - 19, "#786f48");
  }
  function windowAt(x, y) {
    rect(x, y, 4, 8, "#394d40");
    rect(x, y, 1, 8, "#c5b184");
    rect(x + 1, y + 2, 2, 2, "#dac78f");
  }
  function tree(variant) {
    shadow(18, 7);
    if (variant === 1) {
      poly(
        [
          [60, 101],
          [67, 100],
          [67, 61],
          [62, 59],
        ],
        "#786748",
      );
      line(65, 91, 49, 65, "#8c7d4c", 3);
      line(65, 80, 81, 54, "#8c7d4c", 3);
      const crowns = [
        [48, 68, 17],
        [78, 65, 18],
        [43, 51, 17],
        [82, 46, 17],
        [62, 39, 21],
        [63, 58, 22],
      ];
      for (let i = 0; i < crowns.length; i++) {
        const [x, y, r] = crowns[i],
          pts = [];
        for (let j = 0; j < 14; j++) {
          const a = (j * Math.PI * 2) / 14,
            rr = r * (0.85 + rand() * 0.22);
          pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.76]);
        }
        hatch(
          pts,
          ["#43663c", "#50713e", "#5c8045", "#668749", "#79934f", "#6b8c47"][i],
          "#365b3655",
          3,
        );
        for (let j = 0; j < 28; j++) {
          const a = rand() * Math.PI * 2,
            rr = rand() * r * 0.8;
          rect(
            x + Math.cos(a) * rr,
            y + Math.sin(a) * rr * 0.65,
            2,
            1,
            rand() > 0.4 ? "#98ab63" : "#476c3e",
          );
        }
      }
      return;
    }
    poly(
      [
        [61, 101],
        [66, 99],
        [67, 61],
        [63, 60],
      ],
      "#786b45",
    );
    line(65, 95, 64, 65, "#a4975c");
    const colors = [
      "#3b613c",
      "#487144",
      "#547e49",
      "#678c50",
      "#7a9958",
      "#8ca666",
    ];
    for (let layer = 0; layer < 4; layer++) {
      const y = 78 - layer * 13,
        w = 25 - layer * 4;
      const pts = [
        [64, y - 26],
        [64 + w * 0.5, y - 9],
        [64 + w, y + 5],
        [64 + 9, y + 10],
        [64, y + 8],
        [64 - 12, y + 10],
        [64 - w, y + 4],
        [64 - w * 0.55, y - 11],
      ];
      hatch(
        pts,
        colors[(variant + layer) % 3],
        colors[((variant + layer) % 3) + 1],
        5,
      );
      line(64 - w, y + 4, 64, y - 26, colors[4]);
      for (let j = 0; j < 9; j++) {
        let xx = 64 + (rand() - 0.5) * w * 1.6,
          yy = y - 8 + rand() * 15;
        rect(xx, yy, 2, 1, colors[3 + Math.floor(rand() * 3)]);
      }
    }
  }
  function bush() {
    shadow(17, 6);
    for (let i = 0; i < 8; i++) {
      let x = 50 + rand() * 28,
        y = 88 + rand() * 9;
      ellipse(x, y, 7, 6, "#4a713e");
      ellipse(x - 1, y - 2, 5, 4, "#78934a");
      for (let j = 0; j < 3; j++)
        rect(
          x - 3 + rand() * 7,
          y - 1 + rand() * 4,
          2,
          2,
          rand() > 0.5 ? "#d08664" : "#aa4a3a",
        );
    }
  }
  function deposit(gold) {
    shadow(20, 8);
    for (let i = 0; i < 7; i++) {
      let x = 47 + rand() * 32,
        y = 93 + rand() * 10,
        w = 7 + rand() * 5;
      poly(
        [
          [x - w, y],
          [x - w * 0.7, y - 9],
          [x, y - 16],
          [x + w, y - 8],
          [x + w, y + 1],
          [x, y + 5],
        ],
        gold ? "#958458" : "#82908a",
      );
      hatch(
        [
          [x - w, y],
          [x, y - 5],
          [x, y - 16],
          [x - w * 0.7, y - 9],
        ],
        gold ? "#d2b267" : "#afb6a5",
        gold ? "#aa914d" : "#87978e",
        3,
      );
      for (let j = 0; j < 3; j++)
        line(
          x + rand() * w,
          y - 5 - rand() * 6,
          x + 3,
          y - 3,
          gold ? "#e4c46f" : "#c4c7b3",
        );
    }
  }
  // Dark Age wattle/thatch and Feudal timber halls have their own silhouettes.
  function earlyBuilding(kind, team, age) {
    const feudal = age === 2,
      wood = feudal ? "#8f7750" : "#756246",
      plaster = feudal ? "#b9ad83" : "#96845d";
    const wall = (x, y, w, d, h) => {
      block(x, y, w, d, h);
      hatch(
        [
          [x - w, y],
          [x, y + d],
          [x, y + d - h],
          [x - w, y - h],
        ],
        plaster,
        "#706144",
        feudal ? 8 : 4,
      );
      hatch(
        [
          [x, y + d],
          [x + w, y],
          [x + w, y - h],
          [x, y + d - h],
        ],
        wood,
        "#66543c",
        6,
      );
      for (let i = -w + 5; i < w; i += 10)
        line(
          x + i,
          y + Math.min(w - Math.abs(i), d) - h,
          x + i,
          y + Math.min(w - Math.abs(i), d),
          "#5d5037",
          2,
        );
    };
    const cover = (x, y, w, d) => {
      poly(
        [
          [x - w, y],
          [x, y - d - 13],
          [x + w, y],
          [x, y + d],
        ],
        feudal ? palettes[team][1] : "#a18e52",
      );
      hatch(
        [
          [x - w, y],
          [x, y - d - 13],
          [x, y + d],
        ],
        feudal ? "#8a7550" : "#b29b5c",
        feudal ? "#5c5e41" : "#8a7945",
        feudal ? 7 : 3,
      );
      hatch(
        [
          [x, y - d - 13],
          [x + w, y],
          [x, y + d],
        ],
        feudal ? palettes[team][0] : "#8e7d4c",
        feudal ? palettes[team][1] : "#776b42",
        feudal ? 7 : 3,
      );
      line(x - w, y, x, y + d, "#c0a673", 2);
      line(x, y + d, x + w, y, "#6c5b3e", 2);
    };
    if (kind === 9) {
      wall(64, 99, 18, 10, feudal ? 52 : 38);
      wall(64, feudal ? 47 : 61, 23, 12, 7);
      for (let i = 0; i < 5; i++)
        line(
          44 + i * 10,
          feudal ? 40 : 54,
          44 + i * 10,
          feudal ? 26 : 40,
          "#88734e",
          4,
        );
      door(60, 104);
      flag(65, feudal ? 30 : 44, team);
      return;
    }
    if (kind === 4) {
      wall(64, 96, 43, 20, feudal ? 34 : 23);
      cover(64, feudal ? 54 : 66, 48, 22);
      wall(29, 103, 12, 7, 14);
      cover(29, 85, 17, 9);
      door(53, 111);
      door(77, 101);
      if (feudal) {
        wall(91, 74, 10, 6, 33);
        cover(91, 37, 15, 8);
        windowAt(87, 52);
      }
      for (let i = 0; i < 4; i++)
        rect(48 + i * 8, 112 - i * 2, 6, 2, "#c2b58d");
      flag(feudal ? 90 : 61, feudal ? 29 : 48, team);
      return;
    }
    if (kind === 6) {
      // A drill yard, longhouse and tall weapon gate distinguish the barracks from housing.
      poly(
        [
          [13, 100],
          [68, 74],
          [119, 101],
          [65, 125],
        ],
        "#796d4a",
      );
      wall(70, 89, 32, 15, feudal ? 31 : 22);
      cover(70, feudal ? 51 : 62, 38, 19);
      door(65, 101);
      for (let i = 0; i < 6; i++)
        line(16 + i * 7, 101 + i * 3, 16 + i * 7, 87 + i * 3, "#9c8555", 3);
      line(24, 108, 28, 66, "#6c5738", 4);
      line(46, 118, 48, 76, "#6c5738", 4);
      line(28, 70, 48, 80, "#9f8857", 4);
      ellipse(38, 86, 7, 10, palettes[team][0]);
      line(32, 88, 44, 83, "#d0b478", 2);
      for (let i = 0; i < 3; i++) {
        line(82 + i * 7, 108 - i * 3, 82 + i * 7, 76 - i * 3, "#c5b788", 2);
        poly(
          [
            [79 + i * 7, 78 - i * 3],
            [82 + i * 7, 70 - i * 3],
            [85 + i * 7, 77 - i * 3],
          ],
          feudal ? "#bbc2af" : "#8f8c77",
        );
      }
      flag(28, 62, team);
      return;
    }
    wall(64, 98, kind === 5 ? 25 : 33, kind === 5 ? 13 : 17, feudal ? 29 : 20);
    cover(64, feudal ? 62 : 73, kind === 5 ? 32 : 40, kind === 5 ? 18 : 21);
    door(56, 109);
    if (feudal) {
      windowAt(76, 84);
      line(39, 79, 64, 101, "#665539", 3);
    }
    if (kind === 7) {
      ellipse(29, 106, 10, 12, "#c5b17a");
      ellipse(29, 106, 7, 8, "#6a5a3c");
      ellipse(29, 106, 3, 3, "#b66245");
      line(26, 118, 25, 125, "#7d683e", 2);
    }
    if (kind === 8) {
      for (let i = 0; i < 5; i++)
        line(26 + i * 8, 102 + i * 3, 26 + i * 8, 89 + i * 3, "#b5a06e", 2);
      ellipse(35, 97, 5, 6, "#8e724d");
    }
    if (kind === 15) {
      wall(88, 81, 9, 6, 42);
      rect(82, 36, 15, 5, "#86795a");
      poly(
        [
          [27, 111],
          [47, 120],
          [47, 101],
          [27, 92],
        ],
        "#443b2d",
      );
      rect(30, 104, 11, 7, "#cf803e");
      rect(34, 107, 5, 3, "#f0bd66");
      rect(56, 111, 17, 4, "#515c57");
      rect(59, 107, 16, 4, "#8f9b8b");
      rect(62, 115, 5, 8, "#74745b");
    }
    if (kind === 16) {
      rect(28, 108, 20, 7, "#aa8e58");
      poly(
        [
          [29, 108],
          [38, 103],
          [47, 107],
          [38, 112],
        ],
        "#d8c998",
      );
      line(38, 104, 38, 111, "#8a7854");
      line(87, 96, 87, 68, "#745b38", 2);
      rect(82, 66, 13, 17, palettes[team][0]);
      line(84, 71, 92, 71, "#dbcda4");
      line(84, 76, 91, 76, "#dbcda4");
    }
    if (kind !== 5) flag(92, 70, team);
  }
  function building(kind, team, age = 3) {
    shadow(kind === 4 ? 47 : 33, kind === 4 ? 19 : 14);
    if (kind === 10) {
      poly(
        [
          [19, 96],
          [62, 76],
          [111, 99],
          [66, 120],
        ],
        "#7e7449",
      );
      for (let i = 0; i < 8; i++) {
        let x = 25 + i * 5;
        line(x, 96 - i * 2.35, x + 44, 117 - i * 2.35, "#514d32", 3);
        line(x, 94 - i * 2.35, x + 43, 115 - i * 2.35, "#a7a061");
        for (let j = 0; j < 7; j++)
          rect(x + j * 6, 94 - i * 2.35 + j * 2.8, 2, 3, "#abb26b");
      }
      return;
    }
    if (age < 3) {
      earlyBuilding(kind, team, age);
      return;
    }
    if (kind === 15) {
      block(65, 98, 34, 17, 30);
      roof(65, 62, 40, 22, team);
      block(91, 66, 9, 6, 43);
      rect(84, 17, 16, 5, "#b6ad87");
      block(32, 104, 18, 10, 21);
      poly(
        [
          [19, 104],
          [34, 112],
          [34, 94],
          [19, 88],
        ],
        "#3e3a30",
      );
      rect(22, 97, 9, 8, "#bf693a");
      rect(25, 100, 5, 4, "#efb45e");
      block(63, 111, 9, 5, 9);
      poly(
        [
          [51, 102],
          [65, 97],
          [77, 101],
          [71, 106],
          [56, 108],
        ],
        "#87958d",
      );
      for (let i = 0; i < 3; i++) {
        line(88 + i * 6, 102 - i * 3, 86 + i * 6, 80 - i * 3, "#c0c7b0", 2);
        line(82 + i * 6, 89 - i * 3, 91 + i * 6, 85 - i * 3, "#a18d55", 2);
      }
      door(64, 102);
      flag(38, 59, team);
      return;
    }
    if (kind === 16) {
      block(64, 98, 34, 17, 34);
      roof(64, 58, 41, 22, team);
      door(54, 110);
      for (let i = 0; i < 3; i++) windowAt(74 + i * 8, 77 - i * 4);
      block(29, 80, 10, 6, 31);
      roof(29, 45, 15, 9, team);
      flag(29, 40, team);
      poly(
        [
          [68, 110],
          [82, 103],
          [96, 110],
          [82, 118],
        ],
        "#d7cca4",
      );
      line(82, 104, 82, 116, "#8b7c52", 2);
      line(70, 109, 79, 106, "#9e8b5f");
      for (let i = 0; i < 4; i++) {
        rect(101, 86 + i * 4, 9, 3, ["#9e7657", "#687b68", "#b3a16b"][i % 3]);
      }
      return;
    }
    if (kind === 4) {
      // A timber and limestone civic hall with a bell tower and blue copper roofs.
      block(64, 94, 46, 22, 8);
      block(64, 84, 35, 17, 30);
      for (let x = 37; x <= 91; x += 14)
        windowAt(x, 65 + (x < 64 ? (x - 37) * 0.49 : (91 - x) * 0.49));
      door(52, 99);
      line(29, 76, 64, 94, "#6b5c3e", 3);
      line(64, 94, 99, 76, "#5a5940", 3);
      roof(64, 53, 43, 20, team);
      block(79, 59, 12, 7, 37);
      windowAt(73, 26);
      windowAt(83, 25);
      roof(79, 21, 17, 13, team);
      flag(79, 28, team);
      block(25, 99, 9, 5, 15);
      roof(25, 81, 13, 8, team);
      line(42, 100, 42, 86, "#c5b68b", 2);
      line(61, 108, 61, 91, "#8a8059", 2);
      rect(87, 90, 12, 3, "#7f7149");
      rect(87, 94, 12, 3, "#7f7149");
    } else if (kind === 5) {
      block(64, 98, 25, 13, 27);
      door(56, 109);
      windowAt(73, 82);
      roof(64, 66, 31, 21, team);
      rect(79, 43, 6, 19, "#a7a17c");
      rect(77, 41, 10, 4, "#bcb18a");
      line(42, 77, 42, 96, "#6f6645", 2);
    } else if (kind === 6) {
      poly(
        [
          [10, 103],
          [62, 77],
          [120, 104],
          [66, 126],
        ],
        "#8a8262",
      );
      block(75, 84, 29, 14, 31);
      roof(75, 48, 35, 19, team);
      door(72, 98);
      block(30, 105, 12, 7, 42);
      block(54, 115, 10, 6, 42);
      line(30, 66, 54, 77, "#c1b38a", 5);
      for (let i = 0; i < 3; i++) {
        block(20 + i * 10, 63 + i * 3, 4, 2, 8);
        block(46 + i * 7, 76 + i * 2, 3, 2, 7);
      }
      poly(
        [
          [31, 78],
          [39, 75],
          [45, 81],
          [41, 94],
          [33, 90],
        ],
        palettes[team][0],
      );
      line(33, 80, 41, 89, "#d1c792", 2);
      line(28, 111, 30, 93, "#bcc6b0", 2);
      line(24, 99, 35, 104, "#d1c99c", 2);
      flag(31, 56, team);
      for (let i = 0; i < 4; i++)
        line(86 + i * 6, 107 - i * 3, 86 + i * 6, 82 - i * 3, "#d4ceae", 2);
    } else if (kind === 9) {
      block(64, 98, 19, 10, 63);
      door(60, 104);
      windowAt(52, 52);
      windowAt(70, 48);
      block(64, 38, 23, 12, 7);
      for (let i = 0; i < 4; i++) {
        block(45 + i * 12, 33 + Math.min(i, 3 - i) * 5, 4, 2, 9);
      }
      flag(64, 33, team);
    } else {
      block(64, 97, 34, 17, 27);
      roof(64, 64, 41, 23, team);
      door(54, 106);
      for (let i = 0; i < 3; i++) windowAt(68 + i * 8, 77 - i * 4);
      line(31, 77, 31, 94, "#6d6443", 3);
      line(64, 94, 64, 111, "#6d6443", 3);
      flag(91, 71, team);
      if (kind === 6) {
        line(37, 103, 30, 73, "#c0bca2", 2);
        line(33, 91, 26, 94, "#a8ac97", 2);
        line(92, 102, 100, 74, "#b4b7a1", 2);
        poly(
          [
            [29, 75],
            [31, 66],
            [34, 73],
          ],
          "#bdc6b4",
        );
        rect(76, 102, 11, 8, "#746d45");
      }
      if (kind === 7) {
        ellipse(35, 100, 9, 13, "#b6a374");
        ellipse(35, 100, 6, 9, "#685a3d");
        ellipse(35, 100, 3, 5, "#d0c28f");
        line(26, 117, 30, 105, "#746b44", 2);
        line(43, 114, 39, 105, "#746b44", 2);
      }
      if (kind === 8) {
        poly(
          [
            [31, 104],
            [48, 109],
            [48, 89],
            [31, 84],
          ],
          "#514b34",
        );
        for (let i = 0; i < 5; i++)
          line(31 + i * 4, 85 + i, 31 + i * 4, 105 + i, "#c2ae78");
        ellipse(38, 96, 4, 5, "#9e7f51");
      }
    }
  }
  function raceHouse(race, age) {
    shadow(31, 13);
    const timber = age === 1 ? "#8c7854" : "#b6aa84",
      stone = age === 3 ? "#aab09a" : "#8c9077",
      roof = raceTemplates[race].roof;
    if (race === 3) {
      poly(
        [
          [27, 91],
          [63, 107],
          [102, 88],
          [64, 68],
        ],
        "#655c3e",
      );
      poly(
        [
          [30, 91],
          [37, 60],
          [63, 41],
          [94, 65],
          [99, 89],
          [66, 102],
        ],
        "#807252",
      );
      hatch(
        [
          [29, 73],
          [62, 34],
          [101, 73],
          [65, 87],
        ],
        roof,
        "#4a4532",
        5,
      );
      for (const x of [31, 98]) {
        line(x, 97, x - 1, 63, "#b1a681", 4);
        poly(
          [
            [x - 5, 64],
            [x - 4, 44],
            [x + 5, 62],
          ],
          "#ded3ac",
        );
      }
      poly(
        [
          [54, 101],
          [55, 78],
          [67, 74],
          [78, 82],
          [77, 98],
        ],
        "#303e30",
      );
      line(43, 67, 84, 70, "#443d30", 2);
      line(53, 55, 52, 75, "#b69c62", 2);
    } else if (race === 4) {
      block(61, 100, 30, 14, 23);
      line(36, 106, 32, 78, "#81633c", 4);
      line(88, 104, 93, 75, "#81633c", 4);
      hatch(
        [
          [25, 71],
          [51, 44],
          [88, 57],
          [101, 77],
          [67, 88],
        ],
        roof,
        "#665232",
        5,
      );
      poly(
        [
          [45, 56],
          [61, 52],
          [73, 72],
          [58, 80],
        ],
        "#bc9b60",
      );
      rect(75, 40, 10, 23, "#6d715b");
      rect(74, 38, 13, 4, "#a1a181");
      ellipse(39, 91, 4, 6, "#e4c879");
      line(37, 86, 37, 79, "#494d34", 1);
      door(69, 86);
    } else if (race === 5) {
      block(64, 104, 27, 15, 35);
      door(65, 88);
      for (const x of [35, 92]) {
        line(x, 99, x, 57, "#c9ccb2", 4);
        poly(
          [
            [x - 9, 63],
            [x, 29],
            [x + 9, 63],
          ],
          roof,
        );
      }
      hatch(
        [
          [36, 69],
          [64, 27],
          [94, 69],
          [65, 86],
        ],
        roof,
        "#425f55",
        4,
      );
      line(64, 28, 64, 76, "#ddd8ae", 2);
      ellipse(64, 68, 4, 7, "#d9cda0");
      for (let i = 0; i < 3; i++)
        line(49 + i * 16, 84, 49 + i * 16, 97, "#d4cfac", 2);
    } else if (race === 6) {
      block(64, 103, 34, 17, 27);
      door(64, 86);
      hatch(
        [
          [26, 70],
          [51, 45],
          [70, 41],
          [104, 70],
          [66, 88],
        ],
        roof,
        "#775537",
        5,
      );
      line(28, 69, 45, 66, "#c3a76a", 3);
      line(88, 67, 105, 69, "#c3a76a", 3);
      for (let i = 0; i < 3; i++) rect(35 + i * 8, 84 + i * 3, 4, 7, "#a7ad85");
      ellipse(96, 102, 9, 4, "#6b8652");
      rect(42, 73, 3, 26, "#8d6947");
      rect(84, 75, 3, 25, "#8d6947");
    } else if (race === 7) {
      block(64, 103, 36, 18, 27);
      hatch(
        [
          [25, 66],
          [64, 49],
          [103, 67],
          [66, 84],
        ],
        roof,
        "#53655d",
        4,
      );
      for (let i = 0; i < 4; i++) {
        line(35 + i * 15, 64, 68 + i * 8, 79, "#b0b8a2", 2);
        rect(38 + i * 15, 76, 2, 2, "#e2c98d");
      }
      poly(
        [
          [50, 96],
          [50, 83],
          [62, 76],
          [75, 84],
          [75, 99],
          [63, 105],
        ],
        "#4d5a4e",
      );
      line(52, 84, 62, 79, "#c7b77e", 3);
      line(62, 79, 73, 85, "#c7b77e", 3);
      rect(61, 85, 4, 16, "#9e8451");
      rect(85, 49, 10, 18, "#596c62");
      rect(83, 46, 14, 5, "#b7b68e");
      ellipse(36, 90, 5, 6, "#d39b4c");
    } else if (race === 8) {
      ellipse(64, 90, 38, 20, "#627c49");
      ellipse(63, 79, 33, 24, "#7e9256");
      for (let i = 0; i < 12; i++)
        line(
          33 + i * 5,
          77 + (i % 3) * 3,
          37 + i * 5,
          75 + (i % 3) * 3,
          "#a0aa65",
          1,
        );
      ellipse(64, 89, 14, 17, "#d0c08e");
      ellipse(64, 91, 10, 13, "#6f6240");
      line(59, 81, 59, 102, "#aa8b4b", 2);
      line(66, 79, 66, 104, "#aa8b4b", 2);
      ellipse(70, 92, 1.5, 1.5, "#e0cb84");
      ellipse(40, 87, 6, 7, "#ddc890");
      ellipse(89, 88, 6, 7, "#ddc890");
      line(40, 82, 40, 93, "#796843", 2);
      rect(80, 55, 8, 16, "#aeab87");
      rect(78, 53, 12, 4, "#d0c39a");
    } else if (race === 9) {
      poly(
        [
          [24, 96],
          [62, 113],
          [105, 93],
          [66, 74],
        ],
        "#5a5b56",
      );
      for (const x of [34, 93]) {
        block(x, 91, 7, 5, 31);
        poly(
          [
            [x - 8, 59],
            [x, 37],
            [x + 8, 59],
          ],
          roof,
        );
      }
      poly(
        [
          [44, 98],
          [45, 71],
          [63, 61],
          [83, 73],
          [84, 99],
          [72, 105],
          [72, 82],
          [62, 76],
          [54, 84],
          [54, 103],
        ],
        "#afb299",
      );
      for (let i = 0; i < 5; i++) {
        line(47 + i * 8, 71, 47 + i * 8, 81, "#d8d6b5", 2);
      }
      ellipse(63, 67, 6, 6, "#d0d0ae");
      rect(59, 65, 3, 3, "#4a3d49");
      rect(65, 65, 3, 3, "#4a3d49");
      line(30, 101, 91, 87, "#aab094", 3);
      line(32, 84, 90, 104, "#aab094", 3);
    }
  }
  // Generated once into PNG. Runtime only selects an atlas frame.
  function raceBuilding(kind, race, age, facing = 0) {
    if (kind === 41) {
      const alongY = facing % 2;
      const ends = alongY ? [[96,76],[32,108]] : [[32,76],[96,108]];
      for (const [x,y] of ends) block(x,y,11,7,56,"#919786");
      poly([[ends[0][0]-6,ends[0][1]-54],[ends[1][0]-6,ends[1][1]-54],
        [ends[1][0]+6,ends[1][1]-45],[ends[0][0]+6,ends[0][1]-45]],"#716449");
      for (let t=.2;t<.9;t+=.2) {
        const x=ends[0][0]+(ends[1][0]-ends[0][0])*t,
          y=ends[0][1]+(ends[1][1]-ends[0][1])*t;
        line(x,y-48,x,y-8,"#594e3d",3);
      }
      line(ends[0][0],ends[0][1]-28,ends[1][0],ends[1][1]-28,"#383e34",3);
      if (facing>=2) line(ends[0][0],ends[0][1]-8,ends[1][0],ends[1][1]-48,"#c1a76c",2);
      return;
    }
    if (kind === 17) {
      block(64,96,62,31,62,"#929987");
      for (const [x,y] of [[20,75],[43,64],[66,53],[89,65],[111,76]]) block(x,y,6,4,10,"#aab09d");
      return;
    }
    if (kind===9) { legacyRaceBuilding(9,0,age); return; }
    if (window.CrownArtTheme === "legacy" || race===0 || kind===10) {
      legacyRaceBuilding(kind,race,age); return;
    }
    const roof=raceTemplates[race].roof, stone=age===3?"#a5a38f":"#8e8064";
    const hall=kind===4||kind===18, height=kind===16?43:kind===6?29:34;
    ctx.save();
    const growth=age===1?.84:age===2?.94:1;
    ctx.translate(64,100);ctx.scale(1,growth);ctx.translate(-64,-100);
    if(kind===4 && ![3,5,8,9].includes(race)) {
      for(const [x,y]of [[23,97],[105,97]]){
        block(x,y,18,11,25,race===7?stone:"#887353");
        poly([[x-22,y-26],[x,y-41],[x+22,y-26],[x,y-11]],roof);
        rect(x+2,y-12,7,10,"#384638");line(x+5,y-12,x+5,y-2,"#c4b58b",1);
      }
    }
    if (race===1) {
      block(64,93,43,23,height,"#876346");
      poly([[16,62],[57,23],[111,57],[73,87]],"#5a6056");
      poly([[16,62],[73,87],[73,97],[16,72]],"#a58156");
      line(18,57,7,41,"#d7caa5",5);line(110,56,120,40,"#d7caa5",5);
      for(let i=0;i<5;i++)line(37+i*12,61,37+i*12,91,"#4f402e",2);
      for(let i=1;i<6;i++)line(57+i*8,23+i*5.6,16+i*9,62+i*4.7,"#81816a",1);
      poly([[62,86],[73,80],[83,86],[83,110],[62,100]],"#393e31");
      line(61,84,74,76,"#c0a674",3);line(74,76,85,84,"#c0a674",3);
    } else if(race===2) {
      block(62,95,40,21,height,"#8b7957");
      poly([[15,63],[62,34],[110,69],[70,81],[54,70],[39,78]],"#807359");
      poly([[62,34],[89,46],[76,72],[54,70]],"#775743");
      line(22,70,27,98,"#403c31",3);line(102,68,97,102,"#403c31",3);
      poly([[36,71],[58,77],[58,85],[48,82],[39,88]],"#b29b6c");
    } else if(race===3) {
      block(64,98,40,23,22,"#5b6250");
      poly([[15,82],[31,55],[61,25],[99,55],[113,86],[65,111]],"#78654c");
      line(30,69,61,30,"#483f32",3);line(98,68,61,30,"#483f32",3);
      poly([[49,100],[47,74],[61,63],[74,81],[78,112]],"#303d30");
      line(22,95,18,54,"#d4c6a0",5);line(104,96,111,51,"#d4c6a0",5);
    } else if(race===4) {
      for(const x of [26,48,82,102])line(x,72,x-4,116,"#514d34",5);
      block(64,79,40,22,25,"#7e7351");
      poly([[12,62],[53,20],[108,58],[84,69],[66,60],[40,73]],"#66704e");
      rect(33,61,14,19,"#344329");rect(35,64,8,12,"#d6b058");
      line(85,48,96,15,"#4b4b34",4);
    } else if(race===5) {
      block(64,98,39,22,height,"#c4c6b3");
      for(const x of [27,99]) {block(x,83,9,6,44,"#c9cbb8");poly([[x-13,40],[x,12],[x+13,40]],"#788a84");}
      poly([[22,64],[64,21],[106,64],[64,85]],"#6b857b");
      poly([[51,108],[51,79],[64,62],[77,79],[77,119]],"#385c58");
      line(64,65,64,110,"#dbc79c",2);
    } else if(race===6) {
      block(64,97,40,23,height,"#b0986d");
      poly([[15,62],[63,31],[112,64],[66,88]],"#748662");
      poly([[15,62],[31,54],[28,70],[66,88],[98,73],[112,64],[110,76],[66,100],[18,77]],"#53684c");
      for(const x of [25,98])line(x,73,x,103,"#74573c",4);
      rect(60,83,16,23,"#3c4734");
    } else if(race===7) {
      block(64,99,43,24,height+9,"#909788");
      poly([[16,59],[64,28],[112,59],[112,72],[64,94],[16,72]],"#7b826d");
      for(let i=0;i<5;i++)line(25+i*17,58,25+i*17,77,"#b5b59d",2);
      block(93,61,9,6,40,"#926749");
      line(22,79,43,90,"#b38b57",5);line(43,90,43,111,"#b38b57",5);
      rect(61,86,21,23,"#323e36");
    } else if(race===8) {
      poly([[10,96],[15,67],[42,39],[77,35],[109,63],[117,96],[68,125]],"#6b8050");
      poly([[20,99],[27,71],[63,55],[99,77],[103,105],[66,123]],"#a09365");
      block(64,109,15,8,25,"#73543b");
      poly([[48,103],[49,85],[60,78],[74,84],[80,109],[64,117]],"#4b6040");
      line(62,84,65,112,"#bfa96b",2);
      for(const x of [22,100]) {rect(x,88,10,10,"#ddc786");line(x+5,87,x+5,98,"#5c6041",1);}
    } else {
      block(64,99,39,23,height,"#636373");
      for(const [x,y] of [[27,77],[99,77],[64,91]]) {
        block(x,y,7,5,59,"#898b87");poly([[x-10,y-57],[x,y-83],[x+10,y-57]],"#52435f");
      }
      poly([[50,109],[50,78],[65,61],[80,79],[80,121]],"#2c3036");
      for(let i=0;i<4;i++)line(52+i*9,78,52+i*9,103,"#b4b59f",2);
    }
    // Production silhouettes reflect their role, not a floating identifying icon.
    if(kind===6){for(const x of [31,42,86]){line(x,99,x+8,68,"#ddd1ac",3);line(x-4,83,x+9,87,"#5c4935",3);}}
    if(kind===7){line(28,105,35,72,"#75583e",4);line(35,72,48,101,"#75583e",4);line(26,88,48,88,"#d6cfa4",2);}
    if(kind===8){block(29,101,20,10,18,"#65543e");line(25,86,25,114,"#9c8056",3);line(40,90,40,119,"#9c8056",3);}
    if(kind===15){block(88,82,9,6,56,stone);block(40,107,14,8,10,"#414b45");rect(32,93,17,4,"#b7bca9");}
    if(kind===16){poly([[46,68],[64,43],[82,68]],roof);rect(51,68,23,15,"#d6cda7");line(62,68,62,83,"#65593e",2);}
    if(kind===18){for(const [x,y]of [[17,91],[109,91]])block(x,y,10,7,hall?56:40,stone);}
    if([2,4].includes(race)){poly([[63,94],[78,101],[78,119],[63,111]],"#3f4334");line(62,91,80,99,"#c4ae7f",3);}
    ctx.restore();
  }
  function legacyRaceBuilding(kind, race, age) {
    if (kind === 5 && race >= 3) {
      raceHouse(race, age);
      return;
    }
    if (kind === 18) {
      block(64, 84, 27, 22, 37, "#8f9684");
      for (const [x, y] of [
        [39, 76],
        [87, 76],
        [42, 98],
        [86, 98],
      ]) {
        block(x, y, 8, 8, 45, "#abb09b");
        for (let i = -1; i <= 1; i++)
          rect(x + i * 5 - 2, y - 49, 4, 8, raceTemplates[race].roof);
      }
      poly(
        [
          [53, 85],
          [64, 79],
          [75, 85],
          [75, 104],
          [53, 104],
        ],
        "#414f43",
      );
      for (let i = 0; i < 5; i++)
        line(55 + i * 4, 86, 55 + i * 4, 101, "#a49a72", 1);
      flag(64, 34, race);
    } else if (kind === 17) {
      block(64, 96, 24, 12, 30, "#929987");
    } else building(kind, race, age);
    if (kind === 10 || kind === 17) return;
    const roof = raceTemplates[race].roof;
    if (race === 1) {
      // Open clan hall, crossed timber and ox horn gables.
      line(37, 77, 64, 41, "#9e7849", 3);
      line(64, 41, 91, 77, "#9e7849", 3);
      line(60, 47, 54, 35, "#d8c79b", 3);
      line(68, 47, 74, 35, "#d8c79b", 3);
    }
    if (race === 2) {
      line(37, 64, 88, 90, "#8e7853", 3);
      poly(
        [
          [41, 54],
          [64, 40],
          [91, 56],
          [69, 68],
        ],
        roof,
      );
      rect(53, 74, 14, 9, "#c0ad77");
    }
    if (race === 3) {
      poly(
        [
          [30, 76],
          [62, 35],
          [96, 75],
          [66, 88],
        ],
        roof,
      );
      for (const x of [35, 90]) {
        line(x, 93, x - 3, 59, "#a9a185", 4);
        poly(
          [
            [x - 6, 62],
            [x - 5, 49],
            [x + 3, 59],
          ],
          "#d8d0ab",
        );
      }
      line(51, 66, 78, 69, "#453d30", 2);
    }
    if (race === 4) {
      poly(
        [
          [35, 69],
          [59, 41],
          [95, 63],
          [69, 81],
        ],
        roof,
      );
      line(43, 67, 43, 99, "#b28d50", 3);
      line(83, 68, 86, 94, "#80613c", 3);
      rect(78, 41, 8, 21, "#5b6148");
      ellipse(39, 80, 4, 6, "#d8bc65");
      line(38, 78, 40, 81, "#f5dfa4", 2);
    }
    if (race === 5 || race === 6) {
      poly(
        [
          [32, 68],
          [64, race === 5 ? 25 : 39],
          [96, 68],
          [65, 81],
        ],
        roof,
      );
      line(64, race === 5 ? 25 : 39, 64, 75, "#c5c6a0", 2);
      for (let i = 0; i < 3; i++) {
        line(43 + i * 18, 79, 43 + i * 18, 96, "#c7bea0", 2);
      }
      ellipse(64, 61, 3, 5, race === 5 ? "#cfce9e" : "#d7af75");
    }
    if (race === 7) {
      poly(
        [
          [32, 59],
          [63, 43],
          [96, 59],
          [66, 76],
        ],
        roof,
      );
      for (let i = 0; i < 7; i++)
        line(37 + i * 8, 62, 67 + i * 4, 74, "#b6baa0", 1);
      rect(42, 76, 17, 19, "#535f56");
      ellipse(80, 78, 8, 8, "#b69d62");
      ellipse(80, 78, 4, 4, "#606f62");
      for (let i = 0; i < 4; i++) rect(42 + i * 12, 72, 2, 2, "#e0d1a0");
    }
    if (race === 8) {
      ellipse(63, 78, 32, 20, "#6f8150");
      ellipse(64, 85, 13, 16, "#d3c290");
      ellipse(64, 87, 9, 12, "#725b3a");
      rect(59, 78, 2, 18, "#a68f54");
      ellipse(69, 88, 1.5, 1.5, "#d9c77f");
      for (let i = 0; i < 6; i++)
        rect(40 + i * 8, 67 + (i % 2) * 3, 2, 2, "#d4b572");
    }
    if (race === 9) {
      poly(
        [
          [31, 73],
          [45, 40],
          [58, 69],
          [69, 30],
          [96, 74],
          [67, 87],
        ],
        roof,
      );
      for (const x of [41, 83]) {
        rect(x, 75, 10, 13, "#b4b497");
        rect(x + 2, 78, 2, 3, "#4f424f");
        rect(x + 6, 78, 2, 3, "#4f424f");
      }
      line(49, 94, 81, 78, "#b4b497", 2);
      line(50, 79, 81, 95, "#b4b497", 2);
    }
  }
  // Monarch folk: one original silhouette language, shared idle, practical field dress.
  // Semantic magenta is reserved for owner dye; skin, wood and metal never use it.
  const dye = ["#ee00ee", "#8e008e", "#ff60ff"];
  function unit(actual, action, phase, age, race) {
    const angle = phase * Math.PI * 2,
      walk = action === "walk",
      attack = action === "attack" || action === "melee",
      work = ["chop", "mine", "pick", "build"].includes(action),
      mounted = [3, 28, 29, 31, 38].includes(actual),
      bow = [2, 26, 27, 33].includes(actual) && action !== "melee",
      female = [2, 33].includes(actual) && [2, 5, 6].includes(race),
      skeleton = race === 9 && actual !== 24 && actual !== 38,
      armored = age > 1 && actual !== 0,
      skin = raceTemplates[race].skin,
      steel = "#b6c5cb",
      darkSteel = "#52616b",
      gold = "#ccb476",
      stride = walk ? Math.sin(angle) * 3.2 : 0,
      bob = walk
        ? -Math.abs(Math.sin(angle)) * 0.7
        : action === "idle"
          ? Math.sin(angle) * 0.25
          : 0,
      swing =
        attack || work
          ? phase < 0.35
            ? -phase / 0.35
            : phase < 0.5
              ? -1 + ((phase - 0.35) / 0.15) * 2
              : 1 - (phase - 0.5) / 0.5
          : 0;
    ctx.save();
    ctx.translate(32, 44 + bob);
    ellipse(32, 56 - bob, mounted ? 22 : 11, mounted ? 4 : 2.5, "#14261966");
    if (mounted) {
      const hog = actual === 29;
      for (const [x, d] of [
        [16, stride],
        [25, -stride],
        [39, stride],
        [46, -stride],
      ]) {
        const lift = walk
          ? Math.max(0, Math.cos(angle) * (x === 16 || x === 39 ? 1 : -1)) * 2
          : 0;
        line(x, 45, x + d, 55 - lift, "#302d2b", 3);
        line(x + d - 2, 55 - lift, x + d + 2, 55 - lift, "#242727", 2);
      }
      ellipse(
        30,
        42,
        18,
        hog ? 8 : 7,
        actual === 31 ? "#d8d6c7" : actual === 38 ? "#596268" : "#99806a",
      );
      poly(
        [
          [41, 41],
          [47, 23],
          [54, 25],
          [55, 32],
          [48, 44],
        ],
        actual === 31 ? "#d8d6c7" : "#a08b73",
      );
      if (hog) {
        ellipse(50, 38, 8, 6, "#a18c72");
        line(54, 40, 58, 36, "#f4e9c5", 2);
      } else {
        poly(
          [
            [47, 25],
            [48, 18],
            [51, 24],
          ],
          "#554b43",
        );
        line(44, 25, 43, 38, "#4f463e", 3);
      }
      rect(51, 27, 2, 2, "#23292a");
      poly(
        [
          [16, 36],
          [36, 33],
          [42, 38],
          [38, 47],
          [18, 48],
        ],
        dye[1],
      );
      line(19, 38, 36, 36, dye[2], 2);
    }
    const base = mounted ? 30 : 39,
      head = mounted ? 8 : 14,
      torso = mounted ? 18 : 25;
    // A short cloak or a braided ponytail makes the bowkeeper distinct without
    // borrowing a reference pose, costume or proportions.
    if (female) {
      line(26, head + 4, 23, torso + 10, "#493a32", 4);
      for (let i = 0; i < 4; i++)
        line(22, head + 8 + i * 3, 25, head + 10 + i * 3, "#a38754", 1);
    } else
      poly(
        [
          [25, torso],
          [36, torso],
          [40, base + 8],
          [23, base + 8],
        ],
        dye[1],
      );
    for (const [hip, d, shade] of [
      [28, -stride, darkSteel],
      [35, stride, "#796c56"],
    ]) {
      const lift = walk
          ? Math.max(0, Math.cos(angle) * (hip === 28 ? 1 : -1)) * 2.2
          : 0,
        foot = (mounted ? 43 : 55) - lift,
        knee = (base + foot) / 2;
      line(hip, base, hip + d * 0.5, knee, armored ? shade : "#665d49", 4);
      line(hip + d * 0.5, knee, hip + d, foot, "#403b35", 3);
      line(hip + d - 1, foot, hip + d + 3, foot, "#272e2d", 2);
    }
    poly(
      [
        [25, torso - 2],
        [36, torso - 2],
        [38, base + 1],
        [34, base + 5],
        [25, base + 4],
        [23, base],
      ],
      dye[0],
    );
    // Overlapping woven diagonal lines give every uniform the same readable texture.
    line(26, torso, 34, base, dye[1], 2);
    line(27, torso, 35, torso + 2, dye[2], 1);
    if (armored) {
      poly(
        [
          [26, torso],
          [35, torso],
          [35, base - 5],
          [29, base - 3],
          [25, base - 6],
        ],
        steel,
      );
      line(28, torso + 2, 28, base - 6, "#e6e5d5", 1);
    }
    rect(24, base - 1, 14, 2, "#665238");
    rect(30, base - 1, 3, 2, gold);
    if (female) {
      // Original ranger's split overskirt, high collar and leather bracers.
      poly(
        [
          [25, base],
          [37, base],
          [40, base + 7],
          [33, base + 5],
          [29, base + 9],
          [23, base + 5],
        ],
        dye[0],
      );
      line(25, torso - 2, 36, torso - 2, dye[2], 2);
    }
    if (skeleton) {
      rect(26, torso, 10, base - torso - 2, "#3c4140");
      for (let i = 0; i < 4; i++)
        line(27, torso + 2 + i * 2, 35, torso + 2 + i * 2, skin, 1);
      line(31, torso, 31, base - 2, skin, 1);
    }
    ellipse(31, head + 4, 5, 6, skin);
    line(28, head + 6, 33, head + 8, "#896c55", 1);
    rect(33, head + 3, 1, 1, "#252d2c");
    if (race === 5 || race === 6)
      poly(
        [
          [26, head + 3],
          [20, head],
          [25, head + 7],
        ],
        skin,
      );
    if (race === 3) {
      line(33, head + 9, 35, head + 6, "#ede4bb", 1);
    }
    if (skeleton) {
      rect(28, head + 2, 2, 2, "#272b30");
      rect(32, head + 2, 2, 2, "#272b30");
      line(28, head + 7, 34, head + 7, "#575547", 1);
    } else if (armored && !female) {
      poly(
        [
          [26, head + 2],
          [26, head - 1],
          [31, head - 3],
          [36, head],
          [36, head + 3],
        ],
        steel,
      );
      line(31, head - 2, 31, head + 2, "#eee9d6", 1);
    } else {
      poly(
        [
          [26, head + 2],
          [26, head - 1],
          [32, head - 2],
          [36, head],
          [36, head + 2],
        ],
        female ? "#493a32" : "#5c4a38",
      );
      line(27, head, 34, head, dye[0], 2);
    }
    // Race traits stay attached to the head through every shared action pose.
    // Draw after caps/helmets so short Goblins retain a clear pointed silhouette.
    if (race === 4) {
      poly(
        [
          [27, head + 3],
          [18, head - 1],
          [24, head + 8],
        ],
        skin,
      );
      poly(
        [
          [35, head + 3],
          [42, head],
          [36, head + 8],
        ],
        skin,
      );
      line(22, head + 2, 26, head + 5, "#62643c", 1);
      line(38, head + 3, 36, head + 5, "#62643c", 1);
    }
    if (race === 7) {
      // A broad forked beard, cheek whiskers and a brass-bound central braid.
      poly(
        [
          [26, head + 6],
          [30, head + 8],
          [35, head + 6],
          [36, head + 13],
          [33, head + 19],
          [30, head + 16],
          [27, head + 18],
          [25, head + 11],
        ],
        "#815232",
      );
      line(27, head + 9, 28, head + 15, "#c29a62", 1);
      line(32, head + 10, 33, head + 16, "#bd8a52", 1.5);
      line(29, head + 8, 34, head + 8, "#533b2b", 1.5);
      line(31, head + 15, 34, head + 15, gold, 1.5);
    }
    const silkAttack = attack && window.CrownArtTheme !== "legacy";
    // Wind-up, quick contact and slower recovery. Arms follow the working hand;
    // the weapon rotates through the strike instead of translating a rigid sprite.
    const contact = phase < .3 ? -phase/.3 : phase < .5 ? -1+(phase-.3)*10 : 1-(phase-.5)*2;
    const handY = torso + 8 + (silkAttack ? (bow ? -2 : -5+contact*5) : attack || work ? swing*4 : walk ? stride*.4 : 0),
      handX = 40 + (silkAttack ? (bow ? -contact*4 : contact*7) : attack || work ? swing*5 : 0);
    line(25, torso + 2, 21, torso + 8, skin, 3);
    line(21, torso + 8, 23, base - 1, skin, 2.5);
    line(36, torso + 2, 40, torso + 6, skin, 3);
    line(40, torso + 6, handX, handY, skin, 2.5);
    if (female || armored) line(40, torso + 6, handX, handY, "#6a5949", 2);
    ctx.save();
    if(silkAttack && !bow){ctx.translate(handX,handY);ctx.rotate([1,34].includes(actual) ? -.65-contact*.65 : contact*.95);ctx.translate(-handX,-handY);}
    // Workers carry nothing at rest or on the way to a job. Tools appear at contact.
    if (actual === 0) {
      if (work || attack) {
        line(handX, handY, handX + 5, handY - 14, "#9b7847", 2);
        if (action === "pick") ellipse(handX + 3, handY - 2, 3, 2, "#a17a43");
        else line(handX + 1, handY - 14, handX + 10, handY - 11, steel, 3);
      }
    } else if (bow) {
      if (actual === 27) {
        line(handX - 5, handY - 2, handX + 9, handY - 2, "#9d814b", 3);
        line(handX + 3, handY - 9, handX + 3, handY + 4, steel, 2);
      } else {
        line(
          handX + 2,
          handY - 13,
          handX + 8 + (attack ? swing * 2 : 0),
          handY - 3,
          "#bca068",
          2,
        );
        line(
          handX + 8 + (attack ? swing * 2 : 0),
          handY - 3,
          handX + 3,
          handY + 9,
          "#bca068",
          2,
        );
        line(handX + 2, handY - 13, handX + 3, handY + 9, "#d6d0ac", 1);
        if (attack)
          line(handX - 5, handY - 3, handX + 12, handY - 3, "#d6d0ac", 1);
      }
    } else if ([1, 34].includes(actual)) {
      line(handX - 1, handY + 12, handX + 2, handY - 23, "#a08354", 2);
      poly(
        [
          [handX, handY - 23],
          [handX + 2, handY - 30],
          [handX + 5, handY - 22],
        ],
        steel,
      );
      if (actual === 34)
        poly(
          [
            [handX + 3, handY - 20],
            [handX + 12, handY - 17],
            [handX + 3, handY - 12],
          ],
          dye[0],
        );
    } else if (actual === 19 || actual === 24) {
      line(handX, handY + 3, handX + 5, handY - 12, "#876640", 3);
    } else if ([22, 23, 30, 37].includes(actual)) {
      line(handX, handY + 6, handX + 5, handY - 15, "#927647", 3);
      rect(handX + 1, handY - 18, actual === 23 ? 10 : 8, 7, steel);
    } else if (actual === 39) {
      ellipse(handX, handY + 1, 5, 7, "#ba985e");
      line(handX, handY, handX + 2, handY - 11, gold, 2);
    } else {
      line(handX - 2, handY + 4, handX + 8, handY - 15, "#303c3e", 4);
      line(handX - 2, handY + 4, handX + 8, handY - 15, steel, 2);
      line(handX - 4, handY, handX + 3, handY + 3, gold, 2);
      if ([21, 32, 35].includes(actual))
        line(21, base - 2, 17, torso + 1, steel, 2);
      if (actual === 31) {
        poly(
          [
            [20, torso + 3],
            [26, torso + 3],
            [27, base],
            [22, base + 4],
            [18, base],
          ],
          dye[0],
        );
        line(22, torso + 4, 22, base, gold, 1);
      }
    }
    ctx.restore();
    if (actual === 33) {
      line(26, head, 36, head, gold, 1);
      rect(30, head - 2, 2, 2, "#eee6bd");
    }
    if (actual === 35) {
      poly(
        [
          [25, head],
          [31, head - 6],
          [37, head],
        ],
        "#a7443b",
      );
    }
    if (actual === 37) {
      rect(23, torso - 1, 17, base - torso + 5, darkSteel);
      rect(28, torso + 2, 8, 5, dye[0]);
    }
    ctx.restore();
  }
  function terrain(kind, variant) {
    let points = [
      [32, 84],
      [64, 100],
      [32, 116],
      [0, 100],
    ];
    // Terrain is centered at (64,100), matching every other atlas sprite.
    points = points.map(([x, y]) => [x + 32, y]);
    if (kind === 0) {
      poly(points, ["#71824d", "#768750", "#6c7e49", "#7b8951"][variant], null);
      ctx.save();
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i < 60; i++) {
        let x = 32 + rand() * 64,
          y = 84 + rand() * 32;
        rect(
          x,
          y,
          rand() > 0.8 ? 3 : 1,
          1,
          rand() > 0.5 ? "#98a263" : "#546c3c",
        );
      }
      ctx.restore();
    }
    if (kind === 1) {
      poly(points, "#416b69", null);
      ctx.save();
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i < 15; i++)
        line(
          32 + rand() * 55,
          84 + rand() * 32,
          44 + rand() * 50,
          84 + rand() * 32,
          "#72908a40",
        );
      ctx.restore();
    }
    if (kind === 2) {
      poly(points, "#969370");
      for (let i = 0; i < 7; i++) {
        let f = i / 7;
        line(32 + 32 * f, 100 + 16 * f, 64 + 32 * f, 84 + 16 * f, "#646f57");
      }
      line(32, 100, 64, 116, "#c2b48a", 2);
      line(64, 84, 96, 100, "#c2b48a", 2);
    }
  }
  function generate() {
    rng = 93481;
    const canvas = document.createElement("canvas");
    canvas.width = CELL * COLS;
    canvas.height =
      UNIT_BASE_Y + Math.ceil(unitPoseCount / UNIT_COLUMNS) * UNIT_SIZE;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    function at(index, fn) {
      ctx.save();
      ctx.translate((index % COLS) * CELL, Math.floor(index / COLS) * CELL);
      ctx.beginPath();
      ctx.rect(0, 0, CELL, CELL);
      ctx.clip();
      fn();
      ctx.restore();
    }
    for (let i = 0; i < 4; i++) at(i, () => terrain(0, i));
    at(4, () => terrain(1, 0));
    at(5, () => terrain(2, 0));
    at(6, () => {
      terrain(0, 0);
      poly(
        [
          [32, 100],
          [64, 84],
          [96, 100],
          [64, 116],
        ],
        "#9b94614a",
        null,
      );
    });
    function resource(index, draw) {
      at(index, () => {
        // Roots and rock bases stay in one cell; foliage keeps its natural height.
        ctx.beginPath();
        ctx.moveTo(32, 0);
        ctx.lineTo(96, 0);
        ctx.lineTo(96, 100);
        ctx.lineTo(64, 116);
        ctx.lineTo(32, 100);
        ctx.closePath();
        ctx.clip();
        ctx.translate(64, 100);
        ctx.scale(index <= 10 ? 0.8 : 0.95, 1);
        ctx.translate(-64, -100);
        draw();
      });
    }
    for (let i = 0; i < 3; i++) resource(8 + i, () => tree(i));
    resource(11, bush);
    resource(12, () => deposit(true));
    resource(13, () => deposit(false));
    for (let age = 1; age <= 3; age++)
      for (let race = 0; race < raceTemplates.length; race++) {
        for (let slot = 0; slot < BUILDING_SLOTS; slot++) {
          const index = ((age - 1) * 10 + race) * BUILDING_SLOTS + slot;
          ctx.save();
          ctx.translate(
            (index % BUILDING_COLUMNS) * BUILDING_SIZE,
            BUILDING_BASE_Y +
              Math.floor(index / BUILDING_COLUMNS) * BUILDING_HEIGHT,
          );
          ctx.beginPath();
          ctx.rect(0, 0, BUILDING_SIZE, BUILDING_HEIGHT);
          ctx.clip();
          // Upright architecture above a ground diamond, with a stable (64,160) anchor.
          ctx.translate(0, 60);
          ctx.beginPath();
          ctx.moveTo(1, -60);
          ctx.lineTo(127, -60);
          ctx.lineTo(127, 100);
          ctx.lineTo(64, 131);
          ctx.lineTo(1, 100);
          ctx.closePath();
          ctx.clip();
          if (buildingKinds[slot] !== 10 && slot < buildingKinds.length-1) {
            poly(
              [
                [8, 100],
                [64, 72],
                [120, 100],
                [64, 128],
              ],
              age === 1 ? "#726748" : "#9b967e",
              "#454838",
            );
            line(9, 100, 64, 127, "#c0b497", 1.5);
            line(64, 127, 119, 100, "#626858", 1.5);
          }
          const original = palettes[race];
          palettes[race] = dye;
          raceBuilding(buildingKinds[slot] ?? 41, race, age, slot >= buildingKinds.length-1 ? slot-(buildingKinds.length-1) : 0);
          palettes[race] = original;
          ctx.restore();
        }
        for (const actual of raceTemplates[race].units) {
          if (age < minUnitAge(actual)) continue;
          for (const action of actionsFor(actual)) {
            const [offset, count] = unitActions[action];
            for (let frame = 0; frame < count; frame++) {
              const index = unitOffsets[age - 1][race][actual] + offset + frame;
              ctx.save();
              ctx.translate(
                (index % UNIT_COLUMNS) * UNIT_SIZE,
                UNIT_BASE_Y + Math.floor(index / UNIT_COLUMNS) * UNIT_SIZE,
              );
              ctx.beginPath();
              ctx.rect(0, 0, UNIT_SIZE, UNIT_SIZE);
              ctx.clip();
              ctx.scale(UNIT_SIZE / 64, UNIT_SIZE / 64);
              ctx.translate(32, 52);
              ctx.scale(0.88, 0.88);
              ctx.translate(-64, -100);
              ctx.translate(64, 86);
              ctx.scale(
                race === 7 || race === 8 || race === 4 ? 1.12 : 1,
                race === 7 || race === 8 || race === 4 ? 0.84 : 1,
              );
              ctx.translate(-64, -86);
              unit(actual, action, frame / count, age, race);
              ctx.restore();
            }
          }
        }
      }
    for (let age = 1; age <= 3; age++)
      for (let race = 0; race < 10; race++)
        for (const kind of raceTemplates[race].units) {
          if (age < minUnitAge(kind)) continue;
          const first = unitOffsets[age - 1][race][kind],
            count = kind === 0 ? 120 : kind === 33 ? 72 : 56,
            frames = [];
          for (let i = 0; i < count; i++) {
            const index = first + i,
              x = (index % UNIT_COLUMNS) * UNIT_SIZE,
              y = UNIT_BASE_Y + Math.floor(index / UNIT_COLUMNS) * UNIT_SIZE;
            frames.push({ x, y });
          }
          // A stable ground anchor replaces radial warping: faces, torsos and
          // equipment retain their proportions in every action and animation pose.
          for (const f of frames) {
            // One source-pixel hard edge, generated once. No runtime outline passes.
            const im = ctx.getImageData(f.x, f.y, UNIT_SIZE, UNIT_SIZE),
              original = new Uint8ClampedArray(im.data);
            for (let py = 1; py < UNIT_SIZE - 1; py++)
              for (let px = 1; px < UNIT_SIZE - 1; px++) {
                const at = (py * UNIT_SIZE + px) * 4;
                if (original[at + 3] > 100) continue;
                if (
                  [-1, 1, -UNIT_SIZE, UNIT_SIZE].some(
                    (d) => original[at + d * 4 + 3] > 180,
                  )
                ) {
                  im.data[at] = 26;
                  im.data[at + 1] = 29;
                  im.data[at + 2] = 27;
                  im.data[at + 3] = 225;
                }
              }
            ctx.putImageData(im, f.x, f.y);
          }
        }
    // Ordered dithering: independently quantize red/green/blue using a 4×4 Bayer matrix.
    // This deliberately introduces structured pixel texture instead of blurred gradients.
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5],
      image = ctx.getImageData(0, 0, canvas.width, canvas.height),
      data = image.data,
      step = 12;
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] === 0) continue;
        const threshold = (bayer[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * step;
        for (let channel = 0; channel < 3; channel++)
          data[i + channel] = Math.max(
            0,
            Math.min(
              255,
              Math.round((data[i + channel] + threshold) / step) * step,
            ),
          );
      }
    ctx.putImageData(image, 0, 0);
    // Strip transparent padding once at bake time; upright unit cells are 64×48.
    // All poses share a ground anchor; there are no textures allocated per unit.
    const packed = document.createElement("canvas");
    packed.width = canvas.width;
    packed.height =
      UNIT_BASE_Y + Math.ceil(unitPoseCount / UNIT_COLUMNS) * UNIT_ROW_HEIGHT;
    const pc = packed.getContext("2d");
    pc.imageSmoothingEnabled = false;
    pc.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      UNIT_BASE_Y,
      0,
      0,
      canvas.width,
      UNIT_BASE_Y,
    );
    for (let row = 0; row < Math.ceil(unitPoseCount / UNIT_COLUMNS); row++)
      pc.drawImage(
        canvas,
        0,
        UNIT_BASE_Y + row * UNIT_SIZE + 8,
        canvas.width,
        UNIT_ROW_HEIGHT,
        0,
        UNIT_BASE_Y + row * UNIT_ROW_HEIGHT,
        canvas.width,
        UNIT_ROW_HEIGHT,
      );
    return packed;
  }
  // Bounded shared frame cache (1024 × 64 × 48 RGBA = 12 MiB), never per-entity art.
  const factionFrames = new Map();
  const hitMasks = new Map();
  let factionImage = null,
    factionBytes = 0;
  function factionFrame(image, entity, frame) {
    if (
      !Number.isInteger(entity.owner) ||
      entity.owner < 0 ||
      !(buildingKinds.includes(entity.kind) || isUnitArt(entity.kind))
    )
      return { image, frame };
    if (factionImage !== image) {
      factionFrames.clear();
      factionBytes = 0;
      factionImage = image;
    }
    const team = (entity.color ?? entity.owner) % palettes.length,
      key = [frame.x, frame.y, team].join(":");
    if (factionFrames.has(key)) {
      const cached = factionFrames.get(key);
      factionFrames.delete(key);
      factionFrames.set(key, cached);
      return cached;
    }
    const canvas = document.createElement("canvas");
    canvas.width = frame.size;
    canvas.height = frame.height;
    const c = canvas.getContext("2d", { willReadFrequently: true });
    c.drawImage(
      image,
      frame.x,
      frame.y,
      frame.size,
      frame.height,
      0,
      0,
      frame.size,
      frame.height,
    );
    const pixels = c.getImageData(0, 0, canvas.width, canvas.height),
      d = pixels.data,
      colors = [palettes[team][1], palettes[team][0], palettes[team][2]].map(
        (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
      );
    for (let i = 0; i < d.length; i += 4) {
      const green = d[i + 1],
        marker = (d[i] + d[i + 2]) / 2;
      if (
        !d[i + 3] ||
        d[i] - green < 24 ||
        d[i + 2] - green < 16 ||
        marker - green < 32
      )
        continue;
      const light = marker > 235,
        blend = light
          ? Math.min(1, green / 96)
          : Math.max(0, (marker - 142) / 96),
        a = colors[light ? 1 : 0],
        b = colors[light ? 2 : 1];
      for (let channel = 0; channel < 3; channel++)
        d[i + channel] =
          Math.round((a[channel] + (b[channel] - a[channel]) * blend) / 6) * 6;
    }
    c.putImageData(pixels, 0, 0);
    const result = { image: canvas, frame: { ...frame, x: 0, y: 0 } };
    factionFrames.set(key, result);
    factionBytes += canvas.width * canvas.height * 4;
    while (factionFrames.size > 1024 || factionBytes > 12 * 1024 * 1024) {
      const first = factionFrames.keys().next().value,
        old = factionFrames.get(first).image;
      factionBytes -= old.width * old.height * 4;
      factionFrames.delete(first);
    }
    return result;
  }
  const isUnitArt = (kind) =>
    kind >= 0 &&
    kind < 41 &&
    !buildingKinds.includes(kind) &&
    !(kind >= 11 && kind <= 14);
  window.CrownArt = {
    teamNames,
    palettes,
    generate,
    clearCaches() { factionFrames.clear(); factionBytes=0; this.iconBounds?.clear(); },
    CELL,
    COLS,
    minUnitAge,
    idleStyle,
    actionsFor,
    factionFrame,
    get factionCacheBytes() {
      return factionBytes;
    },
    get factionCacheSize() {
      return factionFrames.size;
    },
    hit(image, entity, x, y) {
      const f = this.frame(entity),
        scale = this.renderScale(entity),
        sx = Math.floor(x / scale + (f.anchorX ?? f.size / 2)),
        sy = Math.floor(y / scale + (f.anchorY ?? (f.height || f.size) / 2));
      if (sx < 0 || sy < 0 || sx >= f.size || sy >= (f.height || f.size))
        return false;
      const key = [f.x, f.y].join(":");
      let mask = hitMasks.get(key);
      if (!mask) {
        const c = document.createElement("canvas");
        c.width = f.size;
        c.height = f.height || f.size;
        const cx = c.getContext("2d", { willReadFrequently: true });
        cx.drawImage(
          image,
          f.x,
          f.y,
          c.width,
          c.height,
          0,
          0,
          c.width,
          c.height,
        );
        const pixels = cx.getImageData(0, 0, c.width, c.height).data;
        mask = new Uint8Array(c.width * c.height);
        for (let i = 0; i < mask.length; i++) mask[i] = pixels[i * 4 + 3];
        hitMasks.set(key, mask);
        if (hitMasks.size > 128) hitMasks.delete(hitMasks.keys().next().value);
      }
      return mask[sy * f.size + sx] > 100;
    },
    actions: unitActions,
    spriteSheet(image, entity) {
      const actions = actionsFor(entity.kind),
        canvas = document.createElement("canvas"),
        cell = 64,
        columns = 16,
        metadata = {
          version: 2,
          atlas: "atlas.png",
          race: raceTemplates[entity.race || 0].id,
          kind: entity.kind,
          age: entity.age,
          owner: entity.owner,
          columns,
          cell: { width: cell, height: cell, anchorX: 32, anchorY: 56 },
          animations: {},
        };
      canvas.width = cell * columns;
      canvas.height = cell * actions.length;
      const c = canvas.getContext("2d");
      c.imageSmoothingEnabled = false;
      actions.forEach((action, row) => {
        const count = unitActions[action][1],
          frames = [];
        for (let i = 0; i < count; i++) {
          const source = this.unitFrame(entity, action, i / count),
            sprite = factionFrame(image, entity, source);
          this.drawFrame(
            c,
            sprite.image,
            sprite.frame,
            i * cell,
            row * cell + 24,
            cell,
            cell,
          );
          frames.push({
            x: i * cell,
            y: row * cell,
            width: cell,
            height: cell,
            source: { ...source },
          });
        }
        metadata.animations[action] = {
          loop: action !== "attack" && action !== "melee",
          duration: action === "idle" ? 3.125 : 1,
          frames,
        };
      });
      return { canvas, metadata };
    },
    layout: {
      width: CELL * COLS,
      height:
        UNIT_BASE_Y + Math.ceil(unitPoseCount / UNIT_COLUMNS) * UNIT_ROW_HEIGHT,
      unitSize: UNIT_SIZE,
      unitSourceHeight: UNIT_ROW_HEIGHT,
      unitPoseCount,
    },
    unitFrame(entity, action, phase) {
      const race = Math.max(0, Math.min(9, entity.race || 0)),
        kind = entity.kind;
      if (!actionsFor(kind).includes(action)) action = "idle";
      const [offset, count] = unitActions[action];
      const age = Math.max(minUnitAge(kind), Math.min(3, entity.age || 1)),
        offsets = unitOffsets[age - 1][race];
      const index =
        (offsets[kind] ?? offsets[19] ?? offsets[24] ?? offsets[0]) +
        offset +
        Math.min(count - 1, Math.floor((((phase % 1) + 1) % 1) * count));
      return {
        x: (index % UNIT_COLUMNS) * UNIT_SIZE,
        y: UNIT_BASE_Y + Math.floor(index / UNIT_COLUMNS) * UNIT_ROW_HEIGHT,
        size: UNIT_SIZE,
        height: UNIT_ROW_HEIGHT,
        anchorX: 32,
        anchorY: 44,
        weapon:
          kind === 33 ? (action === "melee" ? "sword" : "bow") : undefined,
      };
    },
    buildingFrame(entity) {
      const slot = buildingKinds.indexOf(entity.kind) + (entity.kind===41 ? (entity.facing||0) : 0),
        age = Math.max(1, Math.min(3, entity.age || 1)),
        race = Math.max(0, Math.min(9, entity.race || 0));
      const index =
        ((age - 1) * 10 + race) * BUILDING_SLOTS + Math.max(0, slot);
      return {
        x: (index % BUILDING_COLUMNS) * BUILDING_SIZE,
        y:
          BUILDING_BASE_Y +
          Math.floor(index / BUILDING_COLUMNS) * BUILDING_HEIGHT,
        size: BUILDING_SIZE,
        height: BUILDING_HEIGHT,
        anchorX: 64,
        anchorY: 160,
      };
    },
    footprint(kind) {
      return kind === 4 || kind === 18
        ? 3
        : kind === 17
          ? 1
          : buildingKinds.includes(kind)
            ? 2
            : 1;
    },
    clipTile(context, entity, x, y, zoom) {
      if(entity.kind===41){context.beginPath();context.rect(x-100*zoom,y-160*zoom,200*zoom,200*zoom);context.clip();return;}
      const n = this.footprint(entity.kind),
        rx = n * 32 * zoom,
        ry = n * 16 * zoom;
      context.beginPath();
      const upright =
        this.isUnit(entity.kind) ||
        this.isBuilding(entity.kind) ||
        (entity.kind >= 11 && entity.kind <= 14);
      context.moveTo(x - rx, upright ? y - 240 * zoom : y);
      if (upright) {
        context.lineTo(x + rx, y - 240 * zoom);
        context.lineTo(x + rx, y);
      } else context.lineTo(x, y - ry);
      context.lineTo(x + rx, y);
      context.lineTo(x, y + ry);
      context.lineTo(x - rx, y);
      context.closePath();
      context.clip();
    },
    raceTemplates,
    isUnit(kind) {
      return (
        kind >= 0 &&
        kind < 41 &&
        !buildingKinds.includes(kind) &&
        !(kind >= 11 && kind <= 14)
      );
    },
    isBuilding(kind) {
      return buildingKinds.includes(kind);
    },
    renderScale(entity) {
      return buildingKinds.includes(entity.kind)
        ? entity.kind === 4 || entity.kind === 18
          ? 1.5
          : entity.kind === 17
            ? 0.5
            : 1
        : 1;
    },
    frame(entity) {
      if (this.isUnit(entity.kind))
        return { ...this.unitFrame(entity, "idle", 0), unit: true };
      if (buildingKinds.includes(entity.kind))
        return this.buildingFrame(entity);
      const index = this.index(entity);
      return {
        x: (index % 16) * 128,
        y: Math.floor(index / 16) * 128,
        size: 128,
        anchorX: 64,
        anchorY: 100,
      };
    },
    icon(context, image, entity, width, height) {
      const f = this.frame(entity),
        key = [f.x, f.y, f.size].join(",");
      this.iconBounds ||= new Map();
      let b = this.iconBounds.get(key);
      if (!b) {
        const c = document.createElement("canvas");
        c.width = f.size;
        c.height = f.height || f.size;
        const cc = c.getContext("2d", { willReadFrequently: true });
        cc.drawImage(
          image,
          f.x,
          f.y,
          f.size,
          f.height || f.size,
          0,
          0,
          f.size,
          f.height || f.size,
        );
        const d = cc.getImageData(0, 0, f.size, f.height || f.size).data;
        let left = f.size,
          top = f.size,
          right = 0,
          bottom = 0;
        for (let y = 0; y < (f.height || f.size); y++)
          for (let x = 0; x < f.size; x++)
            if (d[(y * f.size + x) * 4 + 3] > 20) {
              left = Math.min(left, x);
              top = Math.min(top, y);
              right = Math.max(right, x);
              bottom = Math.max(bottom, y);
            }
        b = {
          x: left,
          y: top,
          w: Math.max(1, right - left + 1),
          h: Math.max(1, bottom - top + 1),
        };
        this.iconBounds.set(key, b);
      }
      const scale = Math.min((width - 6) / b.w, (height - 4) / b.h);
      const sprite = factionFrame(image, entity, f);
      context.drawImage(
        sprite.image,
        sprite.frame.x + b.x,
        sprite.frame.y + b.y,
        b.w,
        b.h,
        (width - b.w * scale) / 2,
        (height - b.h * scale) / 2,
        b.w * scale,
        b.h * scale,
      );
    },
    // Draw a packed source rectangle at its full logical square anchor.
    drawFrame(context, image, f, x, y, width, height) {
      const sx = width / f.size,
        sy = height / f.size;
      context.drawImage(
        image,
        f.x,
        f.y,
        f.size,
        f.height || f.size,
        x + width / 2 - (f.anchorX ?? f.size / 2) * sx,
        y + height / 2 - (f.anchorY ?? (f.height || f.size) / 2) * sy,
        width,
        (f.height || f.size) * sy,
      );
    },
    buildingFlag(context, entity, x, y, zoom, seconds) {
      if (
        !buildingKinds.includes(entity.kind) || entity.kind === 17 ||
        entity.progress < 1 ||
        entity.owner < 0
      )
        return;
      const size = this.renderScale(entity),
        colors = palettes[(entity.color ?? entity.owner) % palettes.length],
        height = [4, 18].includes(entity.kind)
          ? 79
          : entity.kind === 9
            ? 91
            : entity.kind === 10
              ? 4
              : entity.kind === 17
                ? 18
                : 58;
      context.save();
      context.translate(x + 18 * size * zoom, y - height * size * zoom);
      context.scale(zoom, zoom);
      context.strokeStyle = "#b6a174";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(0, 15);
      context.lineTo(0, -14);
      context.stroke();
      for (let stripe = 0; stripe < 6; stripe++) {
        const wind =
          Math.sin(seconds * 3.2 + stripe * 0.68 + entity.id * 0.3) *
          (stripe * 0.45);
        context.fillStyle = colors[stripe % 3 === 0 ? 2 : 0];
        context.fillRect(stripe * 2, -14 + wind, 2.2, 9);
      }
      context.restore();
    },
    blit(context, image, entity, x, y, scale = 1, alpha = 1) {
      const f = this.frame(entity),
        size = f.unit ? 64 : 128,
        zoom = scale * this.renderScale(entity);
      context.save();
      context.globalAlpha *= alpha;
      const sprite = factionFrame(image, entity, f);
      this.drawFrame(
        context,
        sprite.image,
        sprite.frame,
        x - (size / 2) * zoom,
        y - (size / 2) * zoom,
        size * zoom,
        size * zoom,
      );
      context.restore();
    },
    index(entity, time = 0) {
      const k = entity.kind,
        team = Math.max(0, entity.owner);
      if (k === 11) return 8 + (entity.id % 3);
      if (k === 12) return 11;
      if (k === 13) return 12;
      if (k === 14) return 13;
      return 0;
    },
  };
})();
