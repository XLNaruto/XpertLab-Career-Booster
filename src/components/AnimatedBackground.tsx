import { useEffect, useRef } from "react";

interface Orb {
  x: number; y: number; r: number; c: string; vx: number; vy: number;
}

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W: number, H: number;
    let orbs: Orb[] = [];
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

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
};

export default AnimatedBackground;
