import { useState, useRef } from "react";
import { createPortal } from "react-dom";

/* ── Tool types ─────────────────────────────────────────────────────── */
export type DrawingTool =
  | "cursor"
  // Lines
  | "trendline" | "trendangle" | "hray" | "hline" | "vline" | "crossline" | "arrow" | "ray" | "extline"
  // Brush
  | "highlighter"
  // Channels
  | "parallelchannel" | "disjointchannel"
  // Patterns
  | "abcd" | "headshoulders" | "triangle_pat" | "3drives" | "elliottwave"
  // Fibonacci
  | "fib_ret" | "fib_ext" | "fib_channel" | "fib_time" | "fib_speed" | "fib_circles" | "fib_spiral"
  // Gann
  | "gann_box" | "gann_sq" | "gann_fan"
  // Shapes
  | "rectangle" | "rotatedrect" | "circle" | "ellipse" | "tri_shape" | "arc"
  // Text / annotations
  | "text" | "note" | "callout" | "pricelabel" | "anchored_note"
  // Positions
  | "longpos" | "shortpos"
  // Measure
  | "measure" | "daterange" | "pricerange"
  // Zoom
  | "zoom"
  // Erase
  | "eraseall";

/* ── Inline SVG icons (TradingView-style) ───────────────────────────── */
const Icon = ({ d, viewBox = "0 0 24 24" }: { d: string; viewBox?: string }) => (
  <svg width="18" height="18" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons: Record<string, JSX.Element> = {
  cursor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l7 18 3-7 7-3L4 4z" />
    </svg>
  ),
  trendline: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="5" cy="19" r="1.5" fill="currentColor" />
      <circle cx="19" cy="5" r="1.5" fill="currentColor" />
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  hray: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="17,9 20,12 17,15" />
    </svg>
  ),
  hline: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="8" x2="22" y2="8" strokeDasharray="3 2" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="16" x2="22" y2="16" strokeDasharray="3 2" />
    </svg>
  ),
  vline: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="6" y1="2" x2="6" y2="22" strokeDasharray="3 2" />
      <line x1="18" y1="2" x2="18" y2="22" strokeDasharray="3 2" />
    </svg>
  ),
  crossline: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  ray: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="4" cy="19" r="1.5" fill="currentColor" />
      <line x1="4" y1="19" x2="20" y2="5" />
      <polyline points="17,4 20,5 19,8" />
    </svg>
  ),
  extline: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <line x1="2" y1="22" x2="22" y2="2" />
    </svg>
  ),
  highlighter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17c3-3 4-6 9-6s6 3 9 6" />
      <path d="M3 17l3-3" strokeDasharray="2 1" />
    </svg>
  ),
  parallelchannel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="7" x2="21" y2="14" />
      <line x1="3" y1="14" x2="21" y2="7" strokeOpacity="0.4" />
    </svg>
  ),
  abcd: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,18 8,6 13,14 18,4" />
      <circle cx="3"  cy="18" r="1.5" fill="currentColor" />
      <circle cx="8"  cy="6"  r="1.5" fill="currentColor" />
      <circle cx="13" cy="14" r="1.5" fill="currentColor" />
      <circle cx="18" cy="4"  r="1.5" fill="currentColor" />
    </svg>
  ),
  headshoulders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,18 5,14 8,16 12,5 16,16 19,14 22,18" />
    </svg>
  ),
  fib_ret: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="4"  x2="21" y2="4" />
      <line x1="3" y1="9"  x2="21" y2="9" strokeOpacity="0.6" />
      <line x1="3" y1="13" x2="21" y2="13" strokeOpacity="0.6" />
      <line x1="3" y1="17" x2="21" y2="17" strokeOpacity="0.6" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  ),
  fib_ext: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="5"  x2="21" y2="5" />
      <line x1="3" y1="10" x2="21" y2="10" strokeOpacity="0.6" />
      <line x1="3" y1="15" x2="21" y2="15" strokeOpacity="0.6" />
      <line x1="3" y1="19" x2="21" y2="19" />
      <polyline points="8,5 5,2 5,22 8,19" strokeOpacity="0.5" />
    </svg>
  ),
  fib_channel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="18" x2="21" y2="8" />
      <line x1="3" y1="14" x2="21" y2="4" strokeOpacity="0.6" />
      <line x1="3" y1="22" x2="21" y2="12" strokeOpacity="0.6" />
    </svg>
  ),
  fib_time: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3"  y1="3" x2="3"  y2="21" />
      <line x1="8"  y1="3" x2="8"  y2="21" strokeOpacity="0.6" />
      <line x1="14" y1="3" x2="14" y2="21" strokeOpacity="0.6" />
      <line x1="21" y1="3" x2="21" y2="21" strokeOpacity="0.6" />
    </svg>
  ),
  fib_speed: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 20 Q12 3 21 20" />
      <path d="M3 20 Q10 8 21 20" strokeOpacity="0.6" />
      <path d="M3 20 Q7 14 21 20" strokeOpacity="0.4" />
    </svg>
  ),
  gann_box: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" />
      <line x1="3" y1="3" x2="21" y2="21" strokeOpacity="0.6" />
      <line x1="3" y1="12" x2="21" y2="12" strokeOpacity="0.4" />
      <line x1="12" y1="3" x2="12" y2="21" strokeOpacity="0.4" />
    </svg>
  ),
  gann_fan: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="21" x2="21" y2="3" />
      <line x1="3" y1="21" x2="21" y2="9" strokeOpacity="0.6" />
      <line x1="3" y1="21" x2="21" y2="15" strokeOpacity="0.6" />
      <line x1="3" y1="21" x2="15" y2="3" strokeOpacity="0.4" />
    </svg>
  ),
  rectangle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="14" />
      <circle cx="3"  cy="5"  r="1.5" fill="currentColor" />
      <circle cx="21" cy="19" r="1.5" fill="currentColor" />
    </svg>
  ),
  circle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="3"  cy="12" r="1.5" fill="currentColor" />
      <circle cx="21" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  triangle_shape: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,3 21,20 3,20" />
    </svg>
  ),
  text: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="6" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  ),
  note: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="14" height="16" rx="2" />
      <line x1="8" y1="9"  x2="14" y2="9" />
      <line x1="8" y1="13" x2="14" y2="13" />
      <line x1="8" y1="17" x2="11" y2="17" />
    </svg>
  ),
  callout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18v11H9l-4 4V16H3V5z" />
    </svg>
  ),
  pricelabel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="8" y2="12" />
      <path d="M8 8h12v8H8l-3-4 3-4z" />
    </svg>
  ),
  anchored_note: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="3" width="12" height="10" rx="1" />
      <circle cx="5" cy="17" r="2" />
      <line x1="5" y1="15" x2="8" y2="10" />
    </svg>
  ),
  longpos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="14" x2="21" y2="14" />
      <polygon points="3,14 3,19 21,19 21,14" fill="rgba(38,166,154,0.3)" stroke="none" />
      <polyline points="12,8 12,3 17,8" />
    </svg>
  ),
  shortpos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="10" x2="21" y2="10" />
      <polygon points="3,5 3,10 21,10 21,5" fill="rgba(239,83,80,0.3)" stroke="none" />
      <polyline points="12,16 12,21 7,16" />
    </svg>
  ),
  measure: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="9"  x2="4"  y2="15" />
      <line x1="20" y1="9" x2="20" y2="15" />
      <line x1="8"  y1="10" x2="8"  y2="14" strokeOpacity="0.5" />
      <line x1="12" y1="10" x2="12" y2="14" strokeOpacity="0.5" />
      <line x1="16" y1="10" x2="16" y2="14" strokeOpacity="0.5" />
    </svg>
  ),
  zoom: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  ),
  magnet: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v7a6 6 0 0012 0V3" />
      <line x1="6"  y1="3" x2="6"  y2="7" />
      <line x1="18" y1="3" x2="18" y2="7" />
      <line x1="3"  y1="3" x2="9"  y2="3" />
      <line x1="15" y1="3" x2="21" y2="3" />
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  ),
  visibility: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eraseall: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  ),
};

/* ── Tool group definitions ─────────────────────────────────────────── */
interface ToolItem { id: DrawingTool; label: string; }
interface ToolGroup {
  primary: DrawingTool;
  items: ToolItem[];
}

const GROUPS: ToolGroup[] = [
  {
    primary: "trendline",
    items: [
      { id: "trendline",   label: "Trend Line" },
      { id: "ray",         label: "Ray" },
      { id: "extline",     label: "Extended Line" },
      { id: "trendangle",  label: "Trend Angle" },
      { id: "hray",        label: "Horizontal Ray" },
      { id: "hline",       label: "Horizontal Line" },
      { id: "vline",       label: "Vertical Line" },
      { id: "crossline",   label: "Cross Line" },
    ],
  },
  {
    primary: "highlighter",
    items: [
      { id: "highlighter", label: "Highlighter" },
    ],
  },
  {
    primary: "parallelchannel",
    items: [
      { id: "parallelchannel", label: "Parallel Channel" },
      { id: "disjointchannel", label: "Disjoint Channel" },
    ],
  },
  {
    primary: "headshoulders",
    items: [
      { id: "abcd",          label: "ABCD Pattern" },
      { id: "headshoulders", label: "Head & Shoulders" },
      { id: "triangle_pat",  label: "Triangle Pattern" },
      { id: "3drives",       label: "3 Drives" },
      { id: "elliottwave",   label: "Elliott Wave" },
    ],
  },
  {
    primary: "fib_ret",
    items: [
      { id: "fib_ret",     label: "Fib Retracement" },
      { id: "fib_ext",     label: "Fib Extension" },
      { id: "fib_channel", label: "Fib Channel" },
      { id: "fib_time",    label: "Fib Time Zones" },
      { id: "fib_speed",   label: "Speed Resistance Arcs" },
      { id: "fib_circles", label: "Fib Circles" },
      { id: "fib_spiral",  label: "Fib Spiral" },
    ],
  },
  {
    primary: "gann_box",
    items: [
      { id: "gann_box", label: "Gann Box" },
      { id: "gann_sq",  label: "Gann Square" },
      { id: "gann_fan", label: "Gann Fan" },
    ],
  },
  {
    primary: "rectangle",
    items: [
      { id: "rectangle",     label: "Rectangle" },
      { id: "rotatedrect",   label: "Rotated Rectangle" },
      { id: "circle",        label: "Circle" },
      { id: "ellipse",       label: "Ellipse" },
      { id: "triangle_shape",label: "Triangle" },
      { id: "arc",           label: "Arc" },
    ],
  },
  {
    primary: "text",
    items: [
      { id: "text",       label: "Text" },
      { id: "note",       label: "Note" },
      { id: "callout",    label: "Callout" },
      { id: "pricelabel", label: "Price Label" },
    ],
  },
  {
    primary: "anchored_note",
    items: [
      { id: "anchored_note", label: "Anchored Note" },
    ],
  },
];

const POSITION_GROUP: ToolGroup = {
  primary: "longpos",
  items: [
    { id: "longpos",  label: "Long Position" },
    { id: "shortpos", label: "Short Position" },
  ],
};

const MEASURE_GROUP: ToolGroup = {
  primary: "measure",
  items: [
    { id: "measure",    label: "Measure" },
    { id: "daterange",  label: "Date Range" },
    { id: "pricerange", label: "Price Range" },
  ],
};

/* ── Working tools (actually draw on chart) ─────────────────────────── */
const WORKING_TOOLS = new Set<DrawingTool>([
  "cursor",
  /* Lines */
  "trendline", "ray", "extline", "trendangle",
  "hray", "hline", "vline", "crossline",
  /* Channels */
  "parallelchannel", "disjointchannel",
  /* Shapes */
  "rectangle",
  /* Annotations */
  "text", "note", "callout", "anchored_note", "pricelabel",
  /* Highlight */
  "highlighter",
  /* Positions */
  "longpos", "shortpos",
  /* Measure */
  "measure", "daterange", "pricerange",
  /* Utility */
  "zoom", "eraseall",
]);

/* ── ToolButton ─────────────────────────────────────────────────────── */
function ToolBtn({
  tool, activeTool, onSelect, label,
}: {
  tool: DrawingTool;
  activeTool: DrawingTool;
  onSelect: (t: DrawingTool) => void;
  label: string;
}) {
  const isActive = activeTool === tool;
  const works = WORKING_TOOLS.has(tool);
  return (
    <button
      title={label + (!works ? " (coming soon)" : "")}
      onClick={() => onSelect(tool)}
      className={`w-full flex items-center gap-2 px-2 py-1.5 text-[11px] rounded transition-colors ${
        isActive
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      } ${!works ? "opacity-60" : ""}`}
    >
      <span className="flex-shrink-0">{icons[tool] ?? icons["trendline"]}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ── GroupBtn — icon + portal flyout (escapes overflow-y-auto clip) ─── */
function GroupBtn({
  group, activeTool, primaryOverrides, onSelect, onPrimaryChange,
}: {
  group: ToolGroup;
  activeTool: DrawingTool;
  primaryOverrides: Partial<Record<string, DrawingTool>>;
  onSelect: (t: DrawingTool) => void;
  onPrimaryChange: (groupPrimary: DrawingTool, newPrimary: DrawingTool) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [flyPos, setFlyPos] = useState({ top: 0, left: 0 });
  const anchorRef           = useRef<HTMLDivElement>(null);
  const closeTimer          = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 80);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const openFlyout = () => {
    cancelClose();
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setFlyPos({ top: r.top, left: r.right + 2 });
    }
    setOpen(true);
  };

  const primaryId     = (primaryOverrides[group.primary] ?? group.primary) as DrawingTool;
  const isGroupActive = group.items.some(i => i.id === activeTool);

  if (group.items.length === 1) {
    return (
      <button
        title={group.items[0].label}
        onClick={() => onSelect(group.items[0].id)}
        className={`relative flex items-center justify-center w-7 h-7 rounded transition-colors ${
          isGroupActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        {icons[primaryId] ?? icons["trendline"]}
      </button>
    );
  }

  return (
    <>
      <div
        ref={anchorRef}
        className="relative"
        onMouseLeave={scheduleClose}
        onMouseEnter={cancelClose}
      >
        <div
          className={`flex items-center w-7 h-7 rounded transition-colors ${
            isGroupActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <button
            title={group.items.find(i => i.id === primaryId)?.label}
            onClick={() => onSelect(primaryId)}
            className="flex-1 flex items-center justify-center h-full pl-0.5"
          >
            {icons[primaryId] ?? icons["trendline"]}
          </button>
          <button
            onClick={openFlyout}
            onMouseEnter={openFlyout}
            className="flex items-center justify-center w-3.5 h-full opacity-50 hover:opacity-100"
          >
            <svg width="5" height="8" viewBox="0 0 5 8" fill="currentColor">
              <path d="M0 0l5 4-5 4V0z" />
            </svg>
          </button>
        </div>
      </div>

      {open && createPortal(
        <div
          style={{ position: "fixed", top: flyPos.top, left: flyPos.left, zIndex: 9999 }}
          className="w-44 bg-popover border border-border rounded-lg shadow-xl overflow-hidden py-1"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {group.items.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onPrimaryChange(group.primary, item.id);
                onSelect(item.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] transition-colors text-left ${
                activeTool === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-accent"
              } ${!WORKING_TOOLS.has(item.id) ? "opacity-60" : ""}`}
            >
              <span className="flex-shrink-0">{icons[item.id] ?? icons["trendline"]}</span>
              <span className="flex-1">{item.label}</span>
              {!WORKING_TOOLS.has(item.id) && (
                <span className="text-[9px] text-muted-foreground">soon</span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

/* ── Divider ────────────────────────────────────────────────────────── */
const Divider = () => <div className="h-px bg-border/60 mx-1 my-0.5" />;

/* ── Main DrawingToolbar ────────────────────────────────────────────── */
interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
  magnetMode: boolean;
  onMagnetToggle: () => void;
  lockMode: boolean;
  onLockToggle: () => void;
  hiddenMode: boolean;
  onHiddenToggle: () => void;
}

export default function DrawingToolbar({
  activeTool,
  onToolSelect,
  magnetMode,
  onMagnetToggle,
  lockMode,
  onLockToggle,
  hiddenMode,
  onHiddenToggle,
}: DrawingToolbarProps) {
  const [primaryOverrides, setPrimaryOverrides] = useState<Partial<Record<string, DrawingTool>>>({});

  const handlePrimaryChange = (groupPrimary: DrawingTool, newPrimary: DrawingTool) => {
    setPrimaryOverrides(prev => ({ ...prev, [groupPrimary]: newPrimary }));
  };

  return (
    <div className="absolute left-0 top-0 bottom-0 z-40 flex flex-col items-center w-10 bg-card border-r-2 border-border py-1 overflow-y-auto overflow-x-visible select-none" style={{ borderRightColor: "hsl(var(--border) / 0.9)" }}>

      {/* Cursor */}
      <button
        title="Cursor"
        onClick={() => onToolSelect("cursor")}
        className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
          activeTool === "cursor" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        {icons.cursor}
      </button>

      <Divider />

      {/* Drawing tool groups */}
      {GROUPS.map(group => (
        <GroupBtn
          key={group.primary}
          group={group}
          activeTool={activeTool}
          primaryOverrides={primaryOverrides}
          onSelect={onToolSelect}
          onPrimaryChange={handlePrimaryChange}
        />
      ))}

      <Divider />

      {/* Position group */}
      <GroupBtn
        group={POSITION_GROUP}
        activeTool={activeTool}
        primaryOverrides={primaryOverrides}
        onSelect={onToolSelect}
        onPrimaryChange={handlePrimaryChange}
      />

      {/* Measure group */}
      <GroupBtn
        group={MEASURE_GROUP}
        activeTool={activeTool}
        primaryOverrides={primaryOverrides}
        onSelect={onToolSelect}
        onPrimaryChange={handlePrimaryChange}
      />

      {/* Zoom */}
      <button
        title="Zoom In"
        onClick={() => onToolSelect("zoom")}
        className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
          activeTool === "zoom" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        {icons.zoom}
      </button>

      <Divider />

      {/* Magnet mode toggle */}
      <button
        title={magnetMode ? "Magnet On (click to disable)" : "Magnet Off (click to enable)"}
        onClick={onMagnetToggle}
        className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
          magnetMode ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        {icons.magnet}
      </button>

      {/* Lock all */}
      <button
        title={lockMode ? "Unlock All" : "Lock All"}
        onClick={onLockToggle}
        className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
          lockMode ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        {icons.lock}
      </button>

      {/* Show/Hide all */}
      <button
        title={hiddenMode ? "Show All Drawings" : "Hide All Drawings"}
        onClick={onHiddenToggle}
        className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
          hiddenMode ? "text-muted-foreground/40" : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        {icons.visibility}
      </button>

      {/* Erase all */}
      <button
        title="Erase All Drawings"
        onClick={() => onToolSelect("eraseall")}
        className="flex items-center justify-center w-7 h-7 rounded transition-colors text-muted-foreground hover:text-trading-red hover:bg-trading-red/10"
      >
        {icons.eraseall}
      </button>
    </div>
  );
}
