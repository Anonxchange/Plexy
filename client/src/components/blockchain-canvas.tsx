import { useRef, useEffect } from "react";

export function BlockchainCanvas({ dark = false }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    type Node = { x: number; y: number; vx: number; vy: number; r: number; phase: number; lime: boolean; hex: boolean; };
    let nodes: Node[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initNodes();
    };

    const initNodes = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      const count = Math.max(Math.floor((w * h) / 10000), 35);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2.5 + 2, phase: Math.random() * Math.PI * 2,
        lime: Math.random() < 0.18, hex: Math.random() < 0.3,
      }));
    };

    const MAX_DIST = 180;

    const drawHex = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
                : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
      }
      ctx.closePath();
    };

    const draw = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.phase += 0.028;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < MAX_DIST) {
            const t = 1 - dist / MAX_DIST;
            const accent = a.lime || b.lime;
            ctx.beginPath();
            ctx.strokeStyle = accent ? `rgba(142,197,6,${t * 0.55})` : (dark ? `rgba(255,255,255,${t * 0.18})` : `rgba(15,23,42,${t * 0.13})`);
            ctx.lineWidth = accent ? 1 : 0.8;
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        const pulse = Math.sin(n.phase) * 0.35 + 0.65, nr = n.r * pulse;
        if (n.lime) {
          ctx.shadowColor = "rgba(142,197,6,0.55)"; ctx.shadowBlur = 10;
          if (n.hex) { drawHex(n.x, n.y, nr * 1.4); ctx.fillStyle = "rgba(142,197,6,0.85)"; ctx.fill(); ctx.strokeStyle = "rgba(180,242,46,0.9)"; ctx.lineWidth = 1; ctx.stroke(); }
          else { ctx.beginPath(); ctx.arc(n.x, n.y, nr, 0, Math.PI * 2); ctx.fillStyle = "rgba(142,197,6,0.9)"; ctx.fill(); }
          ctx.shadowBlur = 0;
        } else if (n.hex) {
          drawHex(n.x, n.y, nr * 1.3);
          ctx.fillStyle = dark ? `rgba(255,255,255,${pulse * 0.12})` : `rgba(15,23,42,${pulse * 0.1})`;
          ctx.fill(); ctx.strokeStyle = dark ? `rgba(255,255,255,0.25)` : `rgba(15,23,42,0.22)`; ctx.lineWidth = 0.8; ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(n.x, n.y, nr, 0, Math.PI * 2);
          ctx.fillStyle = dark ? `rgba(255,255,255,${pulse * 0.35})` : `rgba(15,23,42,${pulse * 0.22})`; ctx.fill();
        }
      });
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, [dark]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
