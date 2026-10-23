/* Bounded cosmetic effects for authoritative deaths and building health. No simulation entities. */
"use strict";
window.CrownDamage = (() => {
  const ghosts = new Map(),
    seen = new Set();
  let lastTime = -1;
  function ingest(next) {
    if (next.time < lastTime) {
      ghosts.clear();
      seen.clear();
    }
    lastTime = next.time;
    for (const event of [...(next.deaths || [])].sort(
      (a, b) => a.sequence - b.sequence,
    )) {
      if (seen.has(event.sequence)) continue;
      seen.add(event.sequence);
      if (seen.size > 512) seen.delete(seen.values().next().value);
      ghosts.set(event.sequence, {
        ...event,
        elapsed: Math.max(0, next.time - event.time),
        pose: CrownMotion.sample(event.id) || {
          action: "idle",
          phase: 0,
          facing: 1,
        },
      });
      if (ghosts.size > 128) ghosts.delete(ghosts.keys().next().value);
    }
  }
  function advance(dt, paused, speed = 1) {
    if (paused) return;
    for (const [key, g] of ghosts) {
      g.elapsed += dt * speed;
      if (g.elapsed > (CrownArt.isUnit(g.kind) ? 5.25 : 2.4))
        ghosts.delete(key);
    }
  }
  function drawGhosts(ctx, atlas, screen, zoom) {
    for (const g of ghosts.values()) {
      const p = screen(g.x, g.y);
      if (
        p.x < -140 ||
        p.x > innerWidth + 140 ||
        p.y < 0 ||
        p.y > innerHeight + 100
      )
        continue;
      const fall = Math.min(1, g.elapsed / 0.75),
        alpha = Math.min(
          1,
          ((CrownArt.isUnit(g.kind) ? 5.25 : 2.4) - g.elapsed) / 0.8,
        );
      ctx.save();
      CrownArt.clipTile(ctx, g, p.x, p.y, zoom);
      ctx.translate(p.x, p.y);
      const scale = zoom * CrownArt.renderScale(g);
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.max(0, alpha);
      if (CrownArt.isUnit(g.kind)) {
        ctx.scale(g.pose.facing, 1);
        ctx.rotate(fall * 1.5);
        const sprite = CrownArt.factionFrame(
          atlas,
          g,
          CrownArt.unitFrame(g, g.pose.action, g.pose.phase),
        );
        CrownArt.drawFrame(ctx, sprite.image, sprite.frame, -32, -32, 64, 64);
      } else {
        const frame = CrownArt.buildingFrame(g),
          sprite = CrownArt.factionFrame(atlas, g, frame);
        ctx.globalAlpha *= 1 - fall * 0.8;
        ctx.save();
        ctx.scale(1, 1 - fall * 0.8);
        CrownArt.drawFrame(ctx, sprite.image, sprite.frame, -64, -64, 128, 128);
        ctx.restore();
        ctx.globalAlpha = alpha;
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = i % 3 === 0 ? "#34392c" : "#79725a";
          const spread = (0.35 + fall) * 22;
          ctx.fillRect(
            Math.sin(i * 8 + g.id) * spread,
            Math.cos(i * 5) * spread * 0.35,
            4 + (i % 5),
            2 + (i % 3),
          );
        }
        if (g.elapsed < 1.3) {
          ctx.globalAlpha *= Math.max(0, 1 - g.elapsed / 1.3) * 0.35;
          ctx.fillStyle = "#b6b193";
          for (let i = 0; i < 5; i++)
            ctx.fillRect(
              -28 + i * 13 - g.elapsed * 8,
              -12 - g.elapsed * 22,
              12 + g.elapsed * 10,
              8 + g.elapsed * 8,
            );
        }
      }
      ctx.restore();
    }
  }
  function building(ctx, atlas, e, p, z, time) {
    const ratio = Math.max(0, Math.min(1, e.hp / (e.maxHP || 1))),
      frame = CrownArt.buildingFrame(e),
      sprite = CrownArt.factionFrame(atlas, e, frame);
    z *= CrownArt.renderScale(e);
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    ctx.scale(z, z);
    if (ratio < 0.49) {
      ctx.beginPath();
      ctx.rect(-64, -160, 128, 192);
      const shift = e.id % 7;
      ctx.rect(4 + shift, -48, 12, 10 + (1 - ratio) * 8);
      ctx.rect(-14, -24 + shift, 10 + (1 - ratio) * 6, 8);
      ctx.clip("evenodd");
    }
    CrownArt.drawFrame(ctx, sprite.image, sprite.frame, -64, -64, 128, 128);
    ctx.restore();
    if (ratio >= 1 || e.progress < 1) return;
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    ctx.scale(z, z);
    const height = e.kind === 9 ? 65 : 42;
    if (ratio < 0.49) {
      ctx.strokeStyle = "#343529";
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-14 + i * 9, -30);
        ctx.lineTo(-16 + i * 9, -55 + (i % 2) * 6);
        ctx.stroke();
      }
      ctx.fillStyle = "#5b5640";
      for (let i = 0; i < 8; i++)
        ctx.fillRect(-27 + i * 8, 2 + Math.sin(i) * 5, 4, 2);
    }
    // Smoke starts with light damage and becomes denser as integrity falls.
    for (let i = 0; i < (ratio < 0.7 ? 5 : 3); i++) {
      const phase = (((time * 0.3 + i * 0.29 + e.id * 0.13) % 1) + 1) % 1;
      ctx.fillStyle = `rgba(99,105,88,${(1 - phase) * (ratio < 0.7 ? 0.42 : 0.22)})`;
      const width = 3 + phase * (ratio < 0.7 ? 14 : 7);
      ctx.fillRect(
        -3 + Math.sin(phase * 5 + i) * 6 - phase * 8,
        -height - phase * 16,
        width,
        width * 0.8,
      );
    }
    if (ratio < 0.9) {
      const count = ratio < 0.7 ? 5 : 2;
      for (let i = 0; i < count; i++) {
        const seed = e.id + i * 11,
          x = Math.sin(seed) * 13,
          y = -height + 4 + (i % 3) * 6,
          wave = (Math.sin(time * 9 + seed) + 1) * 0.5;
        if (ratio < 0.7) {
          ctx.fillStyle = "#a74e2b";
          ctx.beginPath();
          ctx.moveTo(x - 4, y + 8);
          ctx.lineTo(x - 2 + wave * 3, y - 7 - wave * 9);
          ctx.lineTo(x + 5, y + 7);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#e7ac54";
          ctx.fillRect(x - 1, y - 2 - wave * 4, 2, 8);
          ctx.fillStyle = "#f2cf83";
          ctx.fillRect(x, y + 3, 1, 3);
        }
        const rise = (time * 0.9 + i * 0.37) % 1;
        ctx.fillStyle = i % 2 ? "#e3a45a" : "#ad6940";
        ctx.fillRect(
          x + Math.sin(time * 2 + i) * 3,
          y - rise * 8,
          1 + (i % 2),
          1,
        );
      }
    }
    ctx.restore();
  }
  return {
    ingest,
    advance,
    drawGhosts,
    building,
    get ghostCount() {
      return ghosts.size;
    },
  };
})();
