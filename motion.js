/* Visual motion only. Server positions, work, damage and cooldowns remain authoritative. */
"use strict";
window.CrownMotion = (() => {
  const tracks = new Map(),
    definitions = new Map(),
    cells = new Map();
  let entities = new Map(),
    snapshot = null,
    clock = 0,
    lastTime = -1;
  const cycle = (n) => ((n % 1) + 1) % 1;
  function hostile(a, b) {
    return (
      a >= 0 &&
      b >= 0 &&
      a !== b &&
      !(
        snapshot.players[a]?.team > 0 &&
        snapshot.players[a].team === snapshot.players[b]?.team
      )
    );
  }
  function target(e) {
    if (e.target && entities.has(e.target)) return entities.get(e.target);
    if (!e.cooldown) return null;
    let nearest = null,
      distance =
        (e.kind === 1 && [1, 3].includes(e.race)
          ? 4.5
          : definitions.get(e.kind)?.range || 1.5) + 2.5;
    const r = Math.ceil(distance / 4),
      cx = Math.floor(e.x / 4),
      cy = Math.floor(e.y / 4);
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        for (const other of cells.get(`${x},${y}`) || []) {
          if (!hostile(e.owner, other.owner)) continue;
          const d = Math.hypot(e.x - other.x, e.y - other.y);
          if (d < distance) {
            nearest = other;
            distance = d;
          }
        }
      }
    return nearest;
  }
  function ingest(next) {
    if (
      next.time < lastTime ||
      snapshot?.seed !== next.seed ||
      snapshot?.width !== next.width
    ) {
      tracks.clear();
      clock = 0;
    }
    lastTime = next.time;
    snapshot = next;
    const before = entities;
    entities = new Map(next.entities.map((e) => [e.id, e]));
    cells.clear();
    for (const e of next.entities) {
      if (!e.garrison && e.owner >= 0) {
        const key = `${Math.floor(e.x / 4)},${Math.floor(e.y / 4)}`;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(e);
      }
      if (!CrownArt.isUnit(e.kind) || e.garrison) continue;
      let t = tracks.get(e.id);
      if (!t) {
        t = {
          visual: { ...e },
          gait: cycle(e.id * 0.618),
          facing: 1,
          velocity: 0,
          action: "idle",
          phase: 0,
          contact: -10,
          received: clock,
          cooldown: 0,
        };
        tracks.set(e.id, t);
      }
      const old = before.get(e.id),
        elapsed = next.time - (t.simTime ?? next.time);
      // A merged delta can retain an outer-box pose for several fast snapshots.
      // Only an actually received entity advances its motion sample clock.
      if (old === e) continue;
      t.sampleSeconds = Math.max(0.05, Math.min(0.5, elapsed));
      const box = next.interest;
      t.blendSeconds =
        box?.enabled &&
        e.owner !== next.player &&
        (Math.abs((e.x - e.y) * 32 - box.x) > box.innerHalfWidth ||
          Math.abs((e.x + e.y) * 16 - box.y) > box.innerHalfHeight)
          ? 0.12
          : 1 / 24;
      t.velocity =
        old && elapsed > 0 ? Math.hypot(e.x - old.x, e.y - old.y) / elapsed : 0;
      if (e.cooldown > (old?.cooldown || 0) + 0.1) t.contact = clock;
      t.simTime = next.time;
      t.received = clock;
      t.cooldown = e.cooldown;
      const x = t.visual.x,
        y = t.visual.y;
      Object.assign(t.visual, e, { x, y });
      if (Math.hypot(e.x - x, e.y - y) > 4) {
        t.visual.x = e.x;
        t.visual.y = e.y;
      }
    }
    for (const [id] of tracks)
      if (!entities.has(id) || entities.get(id).garrison) tracks.delete(id);
  }
  function advance(dt) {
    if (!snapshot) return;
    const step =
      snapshot.paused || snapshot.waiting || snapshot.winner >= 0
        ? 0
        : dt * (snapshot.speed || 1);
    if (step === 0) return;
    clock += step;
    for (const [id, t] of tracks) {
      const blend = 1 - Math.exp(-step / (t.blendSeconds || 1 / 24));
      const e = entities.get(id),
        v = t.visual,
        dx = (e.x - v.x) * blend,
        dy = (e.y - v.y) * blend;
      v.x += dx;
      v.y += dy;
      const distance = Math.hypot(dx, dy),
        moving =
          (t.velocity > 0.3 &&
            clock - t.received < (t.sampleSeconds || 0.1) * 1.5 + 0.1) ||
          Math.hypot(e.x - v.x, e.y - v.y) > 0.05;
      t.gait = cycle(
        t.gait + distance / ([3, 28, 29, 31, 38].includes(e.kind) ? 2.1 : 1.15),
      );
      const other = target(e),
        attackSeconds = definitions.get(e.kind)?.attackSeconds || 1;
      const remaining = Math.max(0, t.cooldown - (clock - t.received));
      let action = "idle",
        phase = cycle(clock * 0.32 + id * 0.618);
      if (remaining > 0 && (clock - t.contact < 0.16 || !moving)) {
        action =
          e.kind === 33 &&
          other &&
          Math.hypot(e.x - other.x, e.y - other.y) < 1.8
            ? "melee"
            : "attack";
        phase = cycle(1 - remaining / attackSeconds + 0.5);
      } else if (moving) {
        action = "walk";
        phase = t.gait;
      } else if (
        e.kind === 0 &&
        other &&
        Math.hypot(e.x - other.x, e.y - other.y) <
          ([4, 10].includes(e.order)
            ? CrownArt.footprint(other.kind) * 0.707107 + 0.4
            : other.kind === 10
              ? 1.45
              : 1.2)
      ) {
        if (
          (e.order === 4 && other.progress < 1) ||
          (e.order === 10 && e.repairActive && other.hp < other.maxHP)
        )
          action = "build";
        if (e.order === 2 && e.carry < 10)
          action =
            other.kind === 11 ? "chop" : other.kind >= 13 ? "mine" : "pick";
        phase = cycle(clock * (action === "pick" ? 0.8 : 1.15) + id * 0.618);
      }
      let facingDelta = dx - dy;
      if (other && action !== "walk" && action !== "idle")
        facingDelta = other.x - e.x - (other.y - e.y);
      if (Math.abs(facingDelta) > 0.001) t.facing = facingDelta < 0 ? -1 : 1;
      t.action = action;
      t.phase = phase;
    }
  }
  function draw(ctx, atlas, e, p, zoom) {
    const t = tracks.get(e.id);
    if (!t) return;
    const sprite = CrownArt.factionFrame(
      atlas,
      e,
      CrownArt.unitFrame(e, t.action, t.phase),
    );
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    ctx.scale(t.facing * zoom, zoom);
    CrownArt.drawFrame(ctx, sprite.image, sprite.frame, -32, -32, 64, 64);
    if (e.kind === 0 && e.carry > 0) {
      // A load travels with the worker rather than floating over its destination.
      const bob =
        t.action === "walk" ? -Math.abs(Math.sin(t.phase * Math.PI * 2)) : 0;
      const colors = ["#a47948", "#86643e", "#d5b759", "#9da596"];
      ctx.fillStyle = "#4c4a31";
      ctx.fillRect(-15, -12 + bob, 8, 6);
      ctx.fillStyle = colors[e.carryType] || colors[0];
      ctx.fillRect(-14, -14 + bob, 6, 6);
      ctx.fillStyle = "#d1b77f";
      ctx.fillRect(-12, -14 + bob, 1, 6);
    }
    // Bounded analytic chips at tool contact: no particle objects or server entities.
    if (
      ["chop", "mine", "build"].includes(t.action) &&
      t.phase > 0.5 &&
      t.phase < 0.76
    ) {
      const age = (t.phase - 0.5) / 0.26;
      ctx.fillStyle = t.action === "mine" ? "#d1c18c" : "#ba9e64";
      for (let i = 0; i < 3; i++)
        ctx.fillRect(
          12 + age * (i * 5 - 3),
          -4 - age * (12 - i * 3) + age * age * 7,
          1.5,
          1.5,
        );
    }
    ctx.restore();
  }
  return {
    configure(catalog) {
      for (const def of catalog) definitions.set(def.kind, def);
    },
    ingest,
    advance,
    draw,
    target,
    visual(e) {
      return tracks.get(e.id)?.visual || e;
    },
    sample(id) {
      const t = tracks.get(id);
      return t
        ? {
            action: t.action,
            phase: t.phase,
            facing: t.facing,
            x: t.visual.x,
            y: t.visual.y,
          }
        : null;
    },
    get size() {
      return tracks.size;
    },
  };
})();
