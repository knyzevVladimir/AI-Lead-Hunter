"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { damp, prefersReducedMotion } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const DEG = Math.PI / 180;
/** Golden angle — gives an even, non-banded point distribution. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Latitude/longitude in degrees to a point on the unit sphere. */
function latLngToVec3(lat: number, lng: number): Vec3 {
  const phi = (90 - lat) * DEG; // polar angle measured from +Y
  const theta = (lng + 180) * DEG; // azimuth
  const sinPhi = Math.sin(phi);
  return {
    x: -sinPhi * Math.cos(theta),
    y: Math.cos(phi),
    z: sinPhi * Math.sin(theta),
  };
}

/** Evenly distributed points on a sphere (Fibonacci lattice). */
function fibonacciSphere(count: number): Vec3[] {
  const pts: Vec3[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN_ANGLE;
    pts[i] = { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
  }
  return pts;
}

/** Keeps an index inside `[0, length - 1]`, mapping NaN to 0. */
function clampIndex(i: number, length: number): number {
  if (!Number.isFinite(i)) return 0;
  return Math.min(length - 1, Math.max(0, i));
}

/** Normalised linear interpolation — walks the short way along the sphere. */
function slerpish(a: Vec3, b: Vec3, t: number): Vec3 {
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;
  const z = a.z + (b.z - a.z) * t;
  const len = Math.hypot(x, y, z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

interface City {
  name: string;
  lat: number;
  lng: number;
  /** Hot markers pulse and render in the alert colour. */
  hot?: boolean;
}

const CITIES: City[] = [
  { name: "Москва", lat: 55.7558, lng: 37.6173, hot: true },
  { name: "Санкт-Петербург", lat: 59.9311, lng: 30.3609, hot: true },
  { name: "Екатеринбург", lat: 56.8389, lng: 60.6057 },
  { name: "Новосибирск", lat: 55.0084, lng: 82.9357, hot: true },
  { name: "Казань", lat: 55.7887, lng: 49.1221 },
  { name: "Нижний Новгород", lat: 56.2965, lng: 43.9361 },
  { name: "Самара", lat: 53.1959, lng: 50.1002 },
  { name: "Краснодар", lat: 45.0355, lng: 38.9753, hot: true },
  { name: "Сочи", lat: 43.5855, lng: 39.7231 },
  { name: "Владивосток", lat: 43.1155, lng: 131.8855 },
  { name: "Калининград", lat: 54.7104, lng: 20.4522 },
  { name: "Минск", lat: 53.9006, lng: 27.559 },
  { name: "Алматы", lat: 43.222, lng: 76.8512 },
  { name: "Тбилиси", lat: 41.7151, lng: 44.8271 },
  { name: "Стамбул", lat: 41.0082, lng: 28.9784 },
  { name: "Берлин", lat: 52.52, lng: 13.405 },
  { name: "Дубай", lat: 25.2048, lng: 55.2708 },
  { name: "Якутск", lat: 62.0355, lng: 129.6755 },
  { name: "Мурманск", lat: 68.9585, lng: 33.0827 },
];

/** Routes drawn as lifted arcs — the "outreach" lines. */
const ROUTES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 4],
  [0, 7],
  [0, 11],
  [2, 3],
  [3, 17],
  [0, 15],
  [7, 14],
  [4, 6],
  [12, 3],
];

const DOT_COUNT = 780;
const ARC_SEGMENTS = 40;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface Globe3DProps {
  className?: string;
  /** Slows or speeds the idle spin. Default 1. */
  speed?: number;
}

/**
 * A rotating 3D globe rendered to a 2D canvas.
 *
 * Everything here is hand-rolled — points are transformed by an explicit
 * yaw/pitch rotation, projected through a perspective divide, then painted
 * back-to-front. That keeps the whole visual at zero dependency cost instead
 * of pulling ~700KB of three.js into a dashboard bundle.
 *
 * The loop pauses when the canvas scrolls out of view or the tab is hidden,
 * and renders a single static frame for `prefers-reduced-motion` users.
 */
export default function Globe3D({ className, speed = 1 }: Globe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    /* --- static geometry, computed once --- */
    const dots = fibonacciSphere(DOT_COUNT);
    const cityVecs = CITIES.map((c) => latLngToVec3(c.lat, c.lng));

    // Pre-sample every arc so the render loop only rotates + projects.
    const arcs = ROUTES.map(([a, b]) => {
      const from = cityVecs[a];
      const to = cityVecs[b];
      const pts: Vec3[] = [];
      for (let i = 0; i <= ARC_SEGMENTS; i++) {
        const t = i / ARC_SEGMENTS;
        const p = slerpish(from, to, t);
        // Lift the middle of the arc off the surface.
        const lift = 1 + Math.sin(t * Math.PI) * 0.22;
        pts.push({ x: p.x * lift, y: p.y * lift, z: p.z * lift });
      }
      return pts;
    });

    /* --- sizing --- */
    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let radius = 0;
    let dpr = 1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width / 2;
      cy = height / 2;
      radius = Math.min(width, height) * 0.36;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    /* --- interaction state --- */
    // Start with Eurasia facing the camera so the city markers are populated
    // on first paint rather than 20 seconds into the rotation.
    let yaw = -2.2;
    const basePitch = -0.38;
    let pitch = basePitch;
    let pointerX = 0;
    let pointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      targetPointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetPointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onPointerLeave = () => {
      targetPointerX = 0;
      targetPointerY = 0;
    };

    if (!reduced) {
      wrap.addEventListener("pointermove", onPointerMove);
      wrap.addEventListener("pointerleave", onPointerLeave);
    }

    /* --- visibility gating --- */
    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(wrap);

    const onVisibilityChange = () => {
      if (document.hidden) visible = false;
      else {
        visible = true;
        last = -1; // re-seed from the next frame's timestamp
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    /* --- projection --- */
    const CAMERA = 2.9; // camera distance in sphere radii

    interface Projected {
      sx: number;
      sy: number;
      depth: number; // 0 = far side, 1 = near side
      scale: number;
      visible: boolean;
    }

    const project = (p: Vec3, out: Projected) => {
      // yaw about Y
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;
      // pitch about X
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y2 = p.y * cosP - z1 * sinP;
      const z2 = p.y * sinP + z1 * cosP;

      const persp = CAMERA / (CAMERA - z2);
      out.sx = cx + x1 * persp * radius;
      out.sy = cy - y2 * persp * radius;
      out.depth = (z2 + 1) / 2;
      out.scale = persp;
      out.visible = z2 > -0.15;
    };

    const scratch: Projected = {
      sx: 0,
      sy: 0,
      depth: 0,
      scale: 1,
      visible: true,
    };

    /* --- render --- */
    let raf = 0;
    // Seeded from the first rAF timestamp rather than performance.now(): a
    // frame callback can carry a timestamp from *before* this effect ran,
    // which would otherwise produce a negative first delta.
    let last = -1;
    let elapsed = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!radius) return;

      /* Atmosphere: soft halo just outside the sphere. */
      const halo = ctx.createRadialGradient(
        cx,
        cy,
        radius * 0.72,
        cx,
        cy,
        radius * 1.65
      );
      halo.addColorStop(0, "rgba(59,108,255,0.20)");
      halo.addColorStop(0.45, "rgba(94,92,255,0.09)");
      halo.addColorStop(1, "rgba(11,16,32,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.65, 0, Math.PI * 2);
      ctx.fill();

      /* Sphere body: subtly lit from the upper left. */
      const body = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      body.addColorStop(0, "rgba(30,44,86,0.95)");
      body.addColorStop(0.6, "rgba(14,21,44,0.92)");
      body.addColorStop(1, "rgba(8,12,26,0.98)");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      /* Surface dots. */
      // A latitude band sweeps the globe like a scanner pass.
      const sweepY = Math.sin(elapsed * 0.5) * 0.9;
      for (let i = 0; i < dots.length; i++) {
        project(dots[i], scratch);
        if (!scratch.visible) continue;

        const d = scratch.depth;
        // Fade points as they rotate toward the limb.
        const fade = Math.pow(Math.max(0, d), 1.6);
        if (fade < 0.02) continue;

        const nearSweep = 1 - Math.min(1, Math.abs(dots[i].y - sweepY) / 0.12);
        const lit = nearSweep > 0 ? nearSweep : 0;

        const r = (0.75 + d * 1.05) * scratch.scale * 0.85;
        ctx.beginPath();
        ctx.arc(scratch.sx, scratch.sy, r, 0, Math.PI * 2);
        ctx.fillStyle =
          lit > 0.05
            ? `rgba(${Math.round(140 + lit * 90)},${Math.round(
                210 + lit * 40
              )},255,${(0.35 + fade * 0.6).toFixed(3)})`
            : `rgba(140,175,245,${(fade * 0.5).toFixed(3)})`;
        ctx.fill();
      }

      /* Outreach arcs, with a travelling pulse along each one. */
      for (let a = 0; a < arcs.length; a++) {
        const pts = arcs[a];
        // Offset each arc's pulse so they don't fire in unison.
        const pulseT = (elapsed * 0.28 + a * 0.37) % 1;

        ctx.beginPath();
        let started = false;
        let anyVisible = false;

        for (let i = 0; i < pts.length; i++) {
          project(pts[i], scratch);
          if (scratch.depth < 0.42) {
            started = false; // hide the part behind the globe
            continue;
          }
          anyVisible = true;
          if (!started) {
            ctx.moveTo(scratch.sx, scratch.sy);
            started = true;
          } else {
            ctx.lineTo(scratch.sx, scratch.sy);
          }
        }

        if (anyVisible) {
          ctx.strokeStyle = "rgba(92,140,255,0.34)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Pulse head. Index is clamped defensively: a single bad frame time
        // must never be able to index outside the sampled arc.
        const idx = clampIndex(
          Math.floor(pulseT * (pts.length - 1)),
          pts.length
        );
        project(pts[idx], scratch);
        if (scratch.depth >= 0.45) {
          const glow = ctx.createRadialGradient(
            scratch.sx,
            scratch.sy,
            0,
            scratch.sx,
            scratch.sy,
            5 * scratch.scale
          );
          glow.addColorStop(0, "rgba(190,225,255,0.95)");
          glow.addColorStop(1, "rgba(80,170,255,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(scratch.sx, scratch.sy, 5 * scratch.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* City markers — painted last so they sit above everything. */
      for (let i = 0; i < cityVecs.length; i++) {
        project(cityVecs[i], scratch);
        if (scratch.depth < 0.44) continue;

        const city = CITIES[i];
        const alpha = Math.min(1, (scratch.depth - 0.44) * 3.4);
        const base = city.hot ? "255,107,107" : "34,211,238";

        // Expanding ring, staggered per city.
        if (city.hot) {
          const ringT = (elapsed * 0.55 + i * 0.29) % 1;
          const ringR = (2 + ringT * 13) * scratch.scale;
          ctx.beginPath();
          ctx.arc(scratch.sx, scratch.sy, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${base},${(
            (1 - ringT) *
            0.5 *
            alpha
          ).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        const glow = ctx.createRadialGradient(
          scratch.sx,
          scratch.sy,
          0,
          scratch.sx,
          scratch.sy,
          7 * scratch.scale
        );
        glow.addColorStop(0, `rgba(${base},${(0.85 * alpha).toFixed(3)})`);
        glow.addColorStop(1, `rgba(${base},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(scratch.sx, scratch.sy, 7 * scratch.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(scratch.sx, scratch.sy, 1.9 * scratch.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(0.95 * alpha).toFixed(3)})`;
        ctx.fill();
      }

      /* Equatorial orbit ring, tilted out of the globe's plane. */
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const t = (i / 96) * Math.PI * 2;
        const p: Vec3 = {
          x: Math.cos(t) * 1.32,
          y: Math.sin(t) * 0.14,
          z: Math.sin(t) * 1.32,
        };
        project(p, scratch);
        if (i === 0) ctx.moveTo(scratch.sx, scratch.sy);
        else ctx.lineTo(scratch.sx, scratch.sy);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(167,139,250,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || last < 0) {
        last = now;
        return;
      }

      // Clamp both ends: never negative, never a huge jump after a stall.
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      elapsed += dt;

      yaw += dt * 0.14 * speed;
      pointerX = damp(pointerX, targetPointerX, 4, dt);
      pointerY = damp(pointerY, targetPointerY, 4, dt);
      pitch = basePitch + pointerY * 0.22;
      // Pointer nudges the spin without ever stopping it.
      const yawOffset = pointerX * 0.28;

      const saved = yaw;
      yaw = saved + yawOffset;
      draw();
      yaw = saved;
    };

    if (reduced) {
      // One static, well-composed frame.
      elapsed = 1.2;
      draw();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [speed]);

  return (
    <div
      ref={wrapRef}
      className={clsx("gpu relative h-full w-full", className)}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
