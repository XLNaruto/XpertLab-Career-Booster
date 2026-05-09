import { useEffect, useRef } from "react";

interface Orb {
  x: number; y: number; r: number; c: string; vx: number; vy: number;
}

interface PathPoint {
  x: number;
  y: number;
}

interface Tracer {
  path: PathPoint[];
  progress: number;
  speed: number;
  tailLength: number;
  color: string;
  glowColor: string;
  width: number;
  done: boolean;
}

const GRID_GAP = 80;
const LINE_COLOR = "rgba(0,0,0,0.04)";

const BEAM_COLORS = [
  { solid: "#e7276f", glow: "rgba(231,39,111,0.4)" },
  { solid: "#2991d6", glow: "rgba(41,145,214,0.4)" },
  { solid: "#a855f7", glow: "rgba(168,85,247,0.4)" },
  { solid: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  { solid: "#ec4899", glow: "rgba(236,72,153,0.4)" },
  { solid: "#0ea5e9", glow: "rgba(14,165,233,0.4)" },
];

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W: number, H: number;
    let orbs: Orb[] = [];
    let tracers: Tracer[] = [];
    let animId: number;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      createOrbs();
    }

    function createOrbs() {
      orbs = [
        { x: W * 0.82, y: H * 0.12, r: 380, c: "rgba(231,39,111,0.15)", vx: 0.12, vy: 0.08 },
        { x: W * 0.10, y: H * 0.78, r: 320, c: "rgba(41,145,214,0.12)", vx: -0.10, vy: -0.06 },
        { x: W * 0.50, y: H * 0.50, r: 220, c: "rgba(41,145,214,0.07)", vx: 0.07, vy: 0.10 },
        { x: W * 0.18, y: H * 0.20, r: 260, c: "rgba(231,39,111,0.08)", vx: 0.09, vy: 0.05 },
      ];
    }

    function buildPath(): PathPoint[] {
      const cols = Math.floor(W / GRID_GAP);
      const rows = Math.floor(H / GRID_GAP);
      if (cols < 1 || rows < 1) return [];

      let col = 1 + Math.floor(Math.random() * Math.max(1, cols - 1));
      const path: PathPoint[] = [{ x: col * GRID_GAP, y: -10 }];

      let currentY = 0;
      const turns = 2 + Math.floor(Math.random() * 3);

      for (let t = 0; t < turns; t++) {
        // move down
        const downCells = 1 + Math.floor(Math.random() * 3);
        currentY += downCells * GRID_GAP;
        if (currentY > H) { currentY = H; }
        path.push({ x: col * GRID_GAP, y: currentY });

        if (currentY >= H) break;

        // turn left or right
        const dir = Math.random() > 0.5 ? 1 : -1;
        const sideCells = 1 + Math.floor(Math.random() * 4);
        const newCol = Math.max(1, Math.min(cols, col + dir * sideCells));
        if (newCol !== col) {
          path.push({ x: newCol * GRID_GAP, y: currentY });
          col = newCol;
        }
      }

      // exit to bottom
      path.push({ x: col * GRID_GAP, y: H + 10 });
      return path;
    }

    function getPathLength(path: PathPoint[]): number {
      let len = 0;
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        len += Math.sqrt(dx * dx + dy * dy);
      }
      return len;
    }

    function getPointOnPath(path: PathPoint[], dist: number): PathPoint | null {
      let remaining = dist;
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        const segLen = Math.sqrt(dx * dx + dy * dy);
        if (segLen === 0) continue;
        if (remaining <= segLen) {
          const t = remaining / segLen;
          return {
            x: path[i - 1].x + dx * t,
            y: path[i - 1].y + dy * t,
          };
        }
        remaining -= segLen;
      }
      return null;
    }

    function spawnTracer() {
      const path = buildPath();
      if (path.length < 2) return;
      const c = BEAM_COLORS[Math.floor(Math.random() * BEAM_COLORS.length)];

      tracers.push({
        path,
        progress: 0,
        speed: 1.2 + Math.random() * 1.3,
        tailLength: 100 + Math.random() * 120,
        color: c.solid,
        glowColor: c.glow,
        width: 2,
        done: false,
      });
    }

    function drawGrid() {
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 1;
      for (let x = GRID_GAP; x < W; x += GRID_GAP) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = GRID_GAP; y < H; y += GRID_GAP) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    function drawTracers() {
      tracers.forEach((t) => {
        const totalLen = getPathLength(t.path);
        const headDist = Math.min(t.progress, totalLen);
        const tailDist = Math.max(0, t.progress - t.tailLength);

        if (headDist - tailDist <= 0) {
          if (tailDist >= totalLen) t.done = true;
          t.progress += t.speed;
          return;
        }

        // draw glow (wide, soft)
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 6;
        ctx.strokeStyle = t.glowColor;
        ctx.globalAlpha = 0.5;

        const glowPoints: PathPoint[] = [];
        const numPts = 30;
        for (let i = 0; i <= numPts; i++) {
          const d = tailDist + ((headDist - tailDist) * i) / numPts;
          const p = getPointOnPath(t.path, d);
          if (p) glowPoints.push(p);
        }
        if (glowPoints.length > 1) {
          ctx.beginPath();
          ctx.moveTo(glowPoints[0].x, glowPoints[0].y);
          for (let i = 1; i < glowPoints.length; i++) {
            ctx.lineTo(glowPoints[i].x, glowPoints[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();

        // draw core beam with gradient fade from tail to head
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const segments = 24;
        const segDist = (headDist - tailDist) / segments;

        for (let i = 0; i < segments; i++) {
          const d1 = tailDist + segDist * i;
          const d2 = tailDist + segDist * (i + 1);
          const p1 = getPointOnPath(t.path, d1);
          const p2 = getPointOnPath(t.path, d2);
          if (!p1 || !p2) continue;

          const fade = (i + 1) / segments; // 0 at tail → 1 at head
          ctx.globalAlpha = fade * 0.9;
          ctx.strokeStyle = t.color;
          ctx.lineWidth = t.width;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // bright dot at head
        const head = getPointOnPath(t.path, headDist);
        if (head) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = t.color;
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        t.progress += t.speed;
        if (tailDist >= totalLen) {
          t.done = true;
        }
      });

      tracers = tracers.filter((t) => !t.done);
    }

    let frameCount = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f5f3ee";
      ctx.fillRect(0, 0, W, H);

      orbs.forEach((o) => {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, o.c);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r || o.x > W + o.r) o.vx *= -1;
        if (o.y < -o.r || o.y > H + o.r) o.vy *= -1;
      });

      drawGrid();

      frameCount++;
      if (frameCount % 30 === 0 && tracers.length < 10) {
        spawnTracer();
      }

      drawTracers();

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 6; i++) spawnTracer();

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
};

export default AnimatedBackground;
