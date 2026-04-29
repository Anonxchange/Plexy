import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Custom SVG Icons ─────────────────────────────────────────────────────────

function IconVerified({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="vg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#d4fc79" />
          <stop offset="100%" stopColor="#8ec506" />
        </radialGradient>
      </defs>
      <path d="M12 2l2.4 4.1L19 7.5l-3.5 3.4.8 4.8L12 13.4l-4.3 2.3.8-4.8L5 7.5l4.6-1.4z" fill="url(#vg)" />
      <path d="M9.5 12l2 2 3.5-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M12 2L4 6v5c0 5 3.5 9.3 8 10.3C16.5 20.3 20 16 20 11V6z" fill="url(#sg)" opacity=".85" />
      <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCamera({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="3" fill="#475569" />
      <path d="M8 7l2-3h4l2 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="4" fill="none" stroke="#e2e8f0" strokeWidth="1.8" />
      <circle cx="12" cy="14" r="2" fill="#cbd5e1" />
      <circle cx="18" cy="10" r="1" fill="#94a3b8" />
    </svg>
  );
}

function IconPencil({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" fill="url(#pg)" />
      <path d="M15 5l4 4" stroke="#cbd5e1" strokeWidth="1.2" />
    </svg>
  );
}

function IconCopy({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="13" height="13" rx="2.5" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconMapPin({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.7 2 6 4.7 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6z" fill="#94a3b8" />
      <circle cx="12" cy="8" r="2.5" fill="#fff" />
    </svg>
  );
}

function IconCalendar({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="17" rx="3" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M3 10h18" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <rect x="7" y="13" width="3" height="3" rx="1" fill="#94a3b8" />
      <rect x="14" y="13" width="3" height="3" rx="1" fill="#94a3b8" />
    </svg>
  );
}

function IconUsers({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="4" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 11a3 3 0 000-6M22 20c0-2.2-1.3-4-3-5" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconAward({ size = 14, accent = false }: { size?: number; accent?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="awg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="9" r="7" fill={accent ? "url(#awg)" : "none"} stroke={accent ? "none" : "#f59e0b"} strokeWidth="2" opacity={accent ? 1 : 0.8} />
      <path d="M8.5 15.5L7 22l5-3 5 3-1.5-6.5" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
      {accent && <path d="M9.5 9l2 2 3.5-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function IconPortfolio({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="portg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b4f22e" />
          <stop offset="100%" stopColor="#8ec506" />
        </linearGradient>
      </defs>
      <rect x="3" y="14" width="4" height="7" rx="1.5" fill="url(#portg)" opacity=".5" />
      <rect x="10" y="9" width="4" height="12" rx="1.5" fill="url(#portg)" opacity=".75" />
      <rect x="17" y="4" width="4" height="17" rx="1.5" fill="url(#portg)" />
    </svg>
  );
}

function IconWinRate({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="wrg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <polyline points="3,17 8,11 13,14 21,5" stroke="url(#wrg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="16,5 21,5 21,10" stroke="url(#wrg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M3 21h18" stroke="#d1fae5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconRank({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="rkg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2 2 9.3l6.9-1z" fill="url(#rkg)" />
      <path d="M12 6l1.8 3.7 4 .6-2.9 2.8.7 4L12 15l-3.6 1.9.7-4L6.2 10l4-.6z" fill="#fef3c7" opacity=".6" />
    </svg>
  );
}

function IconNetwork({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="netg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="3" fill="url(#netg)" />
      <circle cx="4" cy="6" r="2.5" fill="#818cf8" opacity=".7" />
      <circle cx="20" cy="6" r="2.5" fill="#818cf8" opacity=".7" />
      <circle cx="4" cy="18" r="2.5" fill="#818cf8" opacity=".7" />
      <circle cx="20" cy="18" r="2.5" fill="#818cf8" opacity=".7" />
      <line x1="6.5" y1="7" x2="9.5" y2="10" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17.5" y1="7" x2="14.5" y2="10" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6.5" y1="17" x2="9.5" y2="14" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17.5" y1="17" x2="14.5" y2="14" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconWallet({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="wlg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="20" height="15" rx="3" fill="url(#wlg)" />
      <path d="M2 10h20" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M2 6l3-4h14l3 4" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="15" y="13" width="5" height="4" rx="2" fill="#e2e8f0" opacity=".7" />
    </svg>
  );
}

function IconClock({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStar({ size = 11, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {filled
        ? <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2 2 9.3l6.9-1z" fill="#fbbf24" />
        : <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2 2 9.3l6.9-1z" fill="#e2e8f0" />
      }
    </svg>
  );
}

function IconArrowUp({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 17L17 7M17 7H9M17 7v8" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowDown({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 7l10 10M17 17H9M17 17V9" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExternalLink({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconShoppingBag({ size = 14, gradient = false }: { size?: number; gradient?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill={gradient ? "url(#sbg)" : "none"} stroke={gradient ? "none" : "#6366f1"} strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 6h18" stroke={gradient ? "#c7d2fe" : "#6366f1"} strokeWidth="1.5" />
      <path d="M16 10a4 4 0 01-8 0" stroke={gradient ? "#e0e7ff" : "#6366f1"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconTrending({ size = 16, up = true }: { size?: number; up?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="tg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={up ? "#34d399" : "#f87171"} />
          <stop offset="100%" stopColor={up ? "#10b981" : "#ef4444"} />
        </linearGradient>
      </defs>
      {up
        ? <><polyline points="3,17 8,11 13,14 21,5" stroke="url(#tg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <polyline points="16,5 21,5 21,10" stroke="url(#tg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>
        : <><polyline points="3,7 8,13 13,10 21,19" stroke="url(#tg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <polyline points="16,19 21,19 21,14" stroke="url(#tg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>
      }
    </svg>
  );
}

function IconPrediction({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="preg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#preg)" opacity=".15" stroke="url(#preg)" strokeWidth="1.5" />
      <path d="M8 12h8M12 8v8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" opacity=".4" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity=".25" />
      <circle cx="12" cy="12" r="3" fill="#6366f1" />
    </svg>
  );
}

// ─── Blockchain canvas ────────────────────────────────────────────────────────

function BlockchainCanvas({ dark = false }: { dark?: boolean }) {
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

// ─── Data ─────────────────────────────────────────────────────────────────────

const USER = {
  username: "0xNakamoto", handle: "@0xnakamoto",
  bio: "DeFi researcher & prediction market strategist. Stacking sats since 2017. Non-custodial or nothing.",
  location: "New York, US", memberSince: "January 2021", pexlyId: "PEXLY-4829-XZ",
  portfolio: 148320.5, pnl: 12.4, pnlPositive: true,
  wins: 31, losses: 8, xp: 8450, rank: "Diamond",
  badges: ["Early Adopter", "Prediction Pro", "Shop Pioneer"],
  walletAddress: "0x4a16...f3C2", followers: 1204, following: 87, kycLevel: "Advanced",
};

const PREDICTIONS = [
  { id: "1", question: "Will Bitcoin surpass $150,000 before end of 2025?", category: "Crypto", yesOdds: 74, volume: "$2.1M", endsIn: "142 days", trending: true, myPosition: { side: "YES" as const, pnl: 340 } },
  { id: "2", question: "Will Ethereum complete the next major upgrade by Q3 2025?", category: "Crypto", yesOdds: 62, volume: "$890K", endsIn: "58 days", trending: false, myPosition: { side: "YES" as const, pnl: 88 } },
  { id: "3", question: "Will the US approve spot ETH ETF options trading by 2025?", category: "Regulation", yesOdds: 81, volume: "$3.4M", endsIn: "210 days", trending: true, myPosition: { side: "NO" as const, pnl: -42 } },
  { id: "4", question: "Will Solana's daily transactions exceed 100M in 2025?", category: "Crypto", yesOdds: 55, volume: "$550K", endsIn: "89 days", trending: false, myPosition: null },
];

const PRODUCTS = [
  { id: "p1", title: "Pexly Hardware Wallet — Gen 2", price: 129.99, cryptoPrice: "0.00192 BTC", rating: 4.9, reviews: 312, badge: "Best Seller", category: "Security", inStock: true, bg: "bg-slate-100" },
  { id: "p2", title: "Steel Seed Phrase Backup Plate", price: 49.99, cryptoPrice: "0.00074 BTC", rating: 4.8, reviews: 189, badge: "Top Rated", category: "Security", inStock: true, bg: "bg-lime-50" },
  { id: "p3", title: "Pexly Signal Premium — 12 Month", price: 199.0, cryptoPrice: "0.00295 BTC", rating: 4.7, reviews: 94, badge: "New", category: "Subscription", inStock: true, bg: "bg-indigo-50" },
  { id: "p4", title: "Crypto Tax Report Tool — Annual", price: 89.0, cryptoPrice: "0.00132 BTC", rating: 4.6, reviews: 201, badge: null, category: "Tools", inStock: false, bg: "bg-slate-100" },
];

const ACTIVITY = [
  { type: "prediction", label: "Placed YES on BTC $150K", time: "2h ago", amount: "+$340", positive: true },
  { type: "purchase", label: "Bought Hardware Wallet Gen 2", time: "1d ago", amount: "-$129.99", positive: false },
  { type: "prediction", label: "ETH ETF prediction settled — WIN", time: "3d ago", amount: "+$880", positive: true },
  { type: "reward", label: "Diamond rank milestone bonus", time: "5d ago", amount: "+250 XP", positive: true },
  { type: "purchase", label: "Pexly Signal Premium renewed", time: "1w ago", amount: "-$199.00", positive: false },
];

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm", className)}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">{children}</p>;
}

const TABS = ["Overview", "Predictions", "Shop", "Activity"] as const;
type Tab = typeof TABS[number];

// ─── Page ──────────────────────────────────────────────────────────────────────

export function DemoProfile() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [copied, setCopied] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [coverSrc, setCoverSrc] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(USER.pexlyId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pickImage = useCallback((setter: (s: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) setter(ev.target.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const winRate = Math.round((USER.wins / (USER.wins + USER.losses)) * 100);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">

      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={pickImage(setAvatarSrc)} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={pickImage(setCoverSrc)} />

      {/* ── Cover ── */}
      <div className="relative h-56 overflow-hidden group/cover">
        {coverSrc
          ? <img src={coverSrc} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#e8f5d0] via-[#f0fce8] to-[#dff0f8]" />
        }
        <BlockchainCanvas dark={!!coverSrc} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50/70 to-transparent pointer-events-none" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link href="/" className="text-xs text-slate-600 hover:text-slate-900 font-medium bg-white/85 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm transition-colors">
            ← Pexly
          </Link>
          <button
            onClick={() => coverInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-slate-700 font-medium bg-white/85 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm hover:bg-white transition-all opacity-0 group-hover/cover:opacity-100"
          >
            <IconCamera size={14} /> Change cover
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pb-24">

        {/* ── Profile card ── */}
        <div className="relative -mt-14 mb-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">

              {/* Avatar */}
              <div className="relative flex-shrink-0 group/avatar -mt-16">
                <div className={cn(
                  "w-28 h-28 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-2xl font-bold",
                  avatarSrc ? "" : "bg-gradient-to-br from-[#1e293b] to-[#475569] text-white"
                )}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                    : USER.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-sm">
                  <IconVerified size={14} />
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                >
                  <IconCamera size={22} />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 mt-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-slate-900">{USER.username}</h1>
                  <span className="text-sm text-slate-400 font-mono">{USER.handle}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium">
                    <IconShield size={12} /> {USER.kycLevel} KYC
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-lg mb-2.5">{USER.bio}</p>
                <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-400">
                  <span className="flex items-center gap-1"><IconMapPin size={12} />{USER.location}</span>
                  <span className="flex items-center gap-1"><IconCalendar size={12} />Joined {USER.memberSince}</span>
                  <span className="flex items-center gap-1"><IconUsers size={12} />{USER.followers.toLocaleString()} followers · {USER.following} following</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition-colors font-mono border border-slate-200 px-2.5 py-1.5 rounded-lg"
                >
                  <IconCopy size={12} />
                  {copied ? "Copied!" : USER.pexlyId}
                </button>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
                  title="Edit profile"
                >
                  <IconPencil size={14} />
                </button>
                <Button size="sm" className="bg-primary text-black hover:bg-primary/90 font-semibold px-5 text-sm">
                  Follow
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-slate-100">
              {USER.badges.map(b => (
                <span key={b} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <IconAward size={12} /> {b}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Portfolio", value: `$${(USER.portfolio / 1000).toFixed(1)}K`, sub: `+${USER.pnl}% this month`, subColor: "text-emerald-600", icon: <IconPortfolio size={20} />, bg: "bg-lime-50" },
            { label: "Win Rate", value: `${winRate}%`, sub: `${USER.wins}W · ${USER.losses}L`, subColor: "text-slate-400", icon: <IconWinRate size={20} />, bg: "bg-emerald-50" },
            { label: "Rank", value: USER.rank, sub: `${USER.xp.toLocaleString()} XP`, subColor: "text-slate-400", icon: <IconRank size={20} />, bg: "bg-amber-50" },
            { label: "Network", value: "Multi-Chain", sub: "BTC · ETH · SOL", subColor: "text-slate-400", icon: <IconNetwork size={20} />, bg: "bg-indigo-50" },
          ].map(({ label, value, sub, subColor, icon, bg }) => (
            <Card key={label} className="p-4 flex items-center gap-3">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
                {icon}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
                <div className="text-base font-bold text-slate-900 tabular-nums leading-tight">{value}</div>
                <div className={cn("text-[11px] truncate", subColor)}>{sub}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Wallet + XP ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <IconWallet size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-slate-400">Connected Wallet</div>
              <div className="text-sm font-mono font-semibold text-slate-800">{USER.walletAddress}</div>
            </div>
            <div className="flex items-center gap-1.5">
              {["BTC", "ETH", "SOL"].map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200 text-slate-500 font-medium">{t}</span>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <IconAward size={16} accent /> {USER.rank}
              </span>
              <span className="text-xs text-slate-400 tabular-nums">{USER.xp.toLocaleString()} / 10,000 XP</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-lime-400" style={{ width: `${Math.min((USER.xp / 10000) * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>Diamond</span><span>Legend</span>
            </div>
          </Card>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0.5 p-1 bg-white border border-slate-200 rounded-xl mb-5 overflow-x-auto scrollbar-hide shadow-sm">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 min-w-[90px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap",
                tab === t ? "bg-primary text-black shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "Overview" && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Active Predictions</SectionLabel>
                  <button onClick={() => setTab("Predictions")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                    View all <IconChevronRight size={12} />
                  </button>
                </div>
                {PREDICTIONS.filter(p => p.myPosition).slice(0, 3).map((p, i, arr) => (
                  <div key={p.id} className={cn("flex items-center gap-3 py-3", i < arr.length - 1 ? "border-b border-slate-100" : "")}>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                      p.myPosition!.side === "YES" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200")}>
                      {p.myPosition!.side}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{p.question}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><IconClock size={10} />{p.endsIn} left</p>
                    </div>
                    <span className={cn("text-xs font-semibold tabular-nums flex items-center gap-0.5", p.myPosition!.pnl >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {p.myPosition!.pnl >= 0 ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
                      ${Math.abs(p.myPosition!.pnl)}
                    </span>
                  </div>
                ))}
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Recent Purchases</SectionLabel>
                  <button onClick={() => setTab("Shop")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                    Shop <IconChevronRight size={12} />
                  </button>
                </div>
                {PRODUCTS.slice(0, 3).map((p, i) => (
                  <div key={p.id} className={cn("flex items-center gap-3 py-3", i < 2 ? "border-b border-slate-100" : "")}>
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                      <IconShoppingBag size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{p.title}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => <IconStar key={i} size={10} filled={i < Math.floor(p.rating)} />)}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">${p.price}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {/* ── PREDICTIONS ── */}
        {tab === "Predictions" && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Prediction Markets</h2>
              <Link href="/prediction" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Browse all <IconExternalLink size={12} />
              </Link>
            </div>
            {PREDICTIONS.map(p => (
              <Card key={p.id} className="p-5 hover:border-primary/50 hover:shadow-md transition-all duration-150 group cursor-default">
                <div className="flex items-start gap-4">
                  <div className={cn("w-13 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border px-3",
                    p.yesOdds >= 65 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
                    <span className="text-sm font-bold tabular-nums leading-none">{p.yesOdds}%</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-60">YES</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-medium">{p.category}</span>
                          {p.trending && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-50 text-lime-700 border border-lime-200 font-medium flex items-center gap-1">
                              <IconTrending size={10} /> Trending
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 leading-snug">{p.question}</h3>
                      </div>
                      {p.myPosition && (
                        <div className={cn("flex-shrink-0 px-2.5 py-1.5 rounded-xl text-center border",
                          p.myPosition.side === "YES" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200")}>
                          <div className="text-[9px] uppercase tracking-wide opacity-60">My bet</div>
                          <div className="text-sm font-bold">{p.myPosition.side}</div>
                          <div className={cn("text-[10px] font-semibold flex items-center justify-center gap-0.5", p.myPosition.pnl >= 0 ? "text-emerald-600" : "text-red-500")}>
                            {p.myPosition.pnl >= 0 ? <IconArrowUp size={10} /> : <IconArrowDown size={10} />}
                            ${Math.abs(p.myPosition.pnl)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[10px] text-emerald-600 font-medium w-7">YES</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${p.yesOdds}%` }} />
                      </div>
                      <span className="text-[10px] text-red-500 font-medium w-7 text-right">NO</span>
                    </div>
                    <div className="flex gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><IconClock size={11} />{p.endsIn}</span>
                      <span>Vol {p.volume}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                  <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium border-0">Buy YES</Button>
                  <Button size="sm" className="h-7 text-xs bg-red-500 hover:bg-red-600 text-white font-medium border-0">Buy NO</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-slate-700 ml-auto">
                    Details <IconChevronRight size={11} className="ml-0.5 inline" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── SHOP ── */}
        {tab === "Shop" && (
          <div className="animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900">Pexly Store</h2>
              <Link href="/shop" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Full store <IconExternalLink size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRODUCTS.map(p => (
                <Card key={p.id} className="overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-150 group">
                  <div className={cn("h-40 flex items-center justify-center relative", p.bg)}>
                    <IconShoppingBag size={42} gradient />
                    {p.badge && (
                      <span className={cn("absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-semibold",
                        p.badge === "Best Seller" ? "bg-primary text-black" : p.badge === "Top Rated" ? "bg-indigo-600 text-white" : "bg-slate-800 text-white")}>
                        {p.badge}
                      </span>
                    )}
                    {!p.inStock && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1">{p.category}</div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
                    <div className="flex items-center gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => <IconStar key={i} size={12} filled={i < Math.floor(p.rating)} />)}
                      <span className="text-[11px] text-slate-400 ml-1">{p.rating} ({p.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-base font-bold text-slate-900">${p.price}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.cryptoPrice}</div>
                      </div>
                      <Button size="sm" disabled={!p.inStock} className={cn("h-8 text-xs font-semibold",
                        p.inStock ? "bg-primary text-black hover:bg-primary/90" : "opacity-40 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed")}>
                        {p.inStock ? "Add to Cart" : "Sold Out"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {tab === "Activity" && (
          <div className="animate-in fade-in-0 duration-200">
            <h2 className="text-base font-bold text-slate-900 mb-4">Recent Activity</h2>
            <Card className="divide-y divide-slate-100">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    a.type === "prediction" ? "bg-indigo-50 border border-indigo-100" :
                    a.type === "purchase" ? "bg-slate-100 border border-slate-200" : "bg-amber-50 border border-amber-100")}>
                    {a.type === "prediction" && <IconPrediction size={16} />}
                    {a.type === "purchase" && <IconShoppingBag size={14} />}
                    {a.type === "reward" && <IconAward size={15} accent />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{a.label}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><IconClock size={10} />{a.time}</p>
                  </div>
                  <span className={cn("text-sm font-semibold tabular-nums", a.positive ? "text-emerald-600" : "text-slate-500")}>{a.amount}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
