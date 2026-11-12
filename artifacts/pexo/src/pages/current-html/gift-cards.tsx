"use client";
import { useEffect, useRef, useState } from "react";
import { CurrentMarketingPage } from "@/components/marketing/current-marketing-page";

const HERO_CARDS = [
  { n: "Steam", f: "$20", usd: 20, img: "/marketing-media/gift-cards/steam.jpeg" },
  { n: "Netflix", f: "$30", usd: 30, img: "/marketing-media/gift-cards/netflix.jpg" },
  { n: "Xbox", f: "$100", usd: 100, img: "/marketing-media/gift-cards/xbox.jpeg" },
  { n: "Razer Gold", f: "$100", usd: 100, img: "/marketing-media/gift-cards/razer.png" },
  { n: "Starbucks", f: "$25", usd: 25, img: "/marketing-media/gift-cards/starbucks.jpeg" },
];
const WIDE_CARDS = [
  { n: "Razer Gold $100", img: "/marketing-media/gift-cards/razer.png", r: -9, y: 44, z: 1 },
  { n: "Starbucks $25", img: "/marketing-media/gift-cards/starbucks.jpeg", r: -5, y: 16, z: 2, cls: " sbux" },
  { n: "Steam $20", img: "/marketing-media/gift-cards/steam.jpeg", r: -2, y: -4, z: 4 },
  { n: "Apple $50", img: "/marketing-media/gift-cards/apple-card.jpg", r: 1.5, y: 2, z: 5 },
  { n: "Netflix $30", img: "/marketing-media/gift-cards/netflix.jpg", r: 4.5, y: 20, z: 3 },
  { n: "Xbox $100", img: "/marketing-media/gift-cards/xbox.jpeg", r: 8, y: 46, z: 1 },
];
// Sample rates for the preview only. Replace with your live price feed.
const HERO_COINS = [
  { s: "USDT", r: 1, d: 2 },
  { s: "USDC", r: 1, d: 2 },
  { s: "BTC", r: 98000, d: 6 },
  { s: "ETH", r: 3400, d: 4 },
  { s: "SOL", r: 165, d: 3 },
];

const HERO_CSS = `
.pxg .ph-hero{--ph-bg:#fff;--ph-ink:#091e1c;--ph-mute:#52625f;--ph-line:#e3ebe9;--ph-lime:#d9f99d;--ph-chip:#f3f7f6;background:var(--ph-bg);color:var(--ph-ink);padding:56px 20px 56px;text-align:center;overflow:hidden}
.pxg .ph-hero .ph-wrap{max-width:1100px;margin:0 auto}
.pxg .ph-hero h1{font-size:clamp(42px,8.4vw,92px);line-height:.98;letter-spacing:-.045em;font-weight:800;margin:0;color:var(--ph-ink)}
.pxg .ph-hero .ph-sub{max-width:520px;margin:18px auto 0;color:var(--ph-mute);font-size:clamp(16px,2vw,19px);line-height:1.5}
.pxg .ph-hero .ph-pay{margin:30px auto 0;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
.pxg .ph-hero .ph-pay>span{font-weight:600;color:var(--ph-mute);font-size:15px}
.pxg .ph-hero .ph-chips{display:flex;gap:6px;padding:5px;background:var(--ph-chip);border-radius:999px;border:1px solid var(--ph-line)}
.pxg .ph-hero .ph-chip{font:700 14px/1 inherit;font-family:inherit;border:0;background:transparent;color:var(--ph-ink);height:38px;padding:0 15px;border-radius:999px;cursor:pointer;transition:background .2s,color .2s;width:auto;margin:0}
.pxg .ph-hero .ph-chip[aria-pressed="true"]{background:var(--ph-ink);color:#fff}
.pxg .ph-hero .ph-chip:focus-visible,.pxg .ph-hero .ph-cta:focus-visible,.pxg .ph-hero .ph-dots button:focus-visible,.pxg .ph-hero .ph-stage:focus-visible{outline:3px solid #5b8cff;outline-offset:2px}
.pxg .ph-hero .ph-stage{--w:min(250px,58vw);--step:calc(var(--w)*.64);position:relative;height:calc(var(--w)*1.5 + 36px);margin:34px auto 0;perspective:1100px;touch-action:pan-y;user-select:none}
.pxg .ph-hero .ph-card{position:absolute;left:50%;top:18px;width:var(--w);aspect-ratio:2/3;margin-left:calc(var(--w)/-2);border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 18px 40px rgba(9,30,28,.22);cursor:pointer;transform:translateX(calc(var(--d)*var(--step))) rotateY(calc(var(--d)*-14deg)) scale(calc(1 - var(--a)*.12));opacity:calc(1 - var(--a)*.22);z-index:calc(10 - var(--a));transition:transform .55s cubic-bezier(.2,.8,.2,1),opacity .55s}
.pxg .ph-hero .ph-card img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;max-width:none}
.pxg .ph-hero .ph-card.sbux img{transform:scale(1.08)}
.pxg .ph-hero .ph-quote{margin:8px auto 0;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 20px;background:var(--ph-lime);color:#091e1c;border-radius:999px;font-weight:600;width:min(340px,88vw)}
.pxg .ph-hero .ph-quote b{font-size:19px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.pxg .ph-hero .ph-quote em{font-style:normal;font-size:15px}
.pxg .ph-hero .ph-dots{display:flex;gap:7px;justify-content:center;margin-top:16px}
.pxg .ph-hero .ph-dots button{width:8px;height:8px;min-width:0;border-radius:99px;border:0;padding:0;background:var(--ph-line);cursor:pointer;transition:width .3s,background .3s}
.pxg .ph-hero .ph-dots button[aria-current="true"]{width:24px;background:var(--ph-ink)}
.pxg .ph-hero .ph-btns{display:flex;gap:12px;justify-content:center;margin-top:28px}
.pxg .ph-hero .ph-cta{display:inline-flex;align-items:center;justify-content:center;height:52px;padding:0 28px;border-radius:999px;font-weight:700;font-size:16px;text-decoration:none;border:1.5px solid var(--ph-ink);white-space:nowrap}
.pxg .ph-hero .ph-cta.solid{background:var(--ph-ink);color:#fff}
.pxg .ph-hero .ph-cta.ghost{background:transparent;color:var(--ph-ink)}
@media(max-width:560px){.pxg .ph-hero{padding:36px 16px 40px}.pxg .ph-hero .ph-btns{padding:0 4px}.pxg .ph-hero .ph-cta{flex:1;padding:0 10px;font-size:15px}.pxg .ph-hero .ph-chip{padding:0 11px;font-size:13px}}

.pxg .ph-wide{display:none}
@media(min-width:768px){
.pxg .ph-mob{display:none}
.pxg .ph-wide{display:block;padding:64px 20px 0;--ph-glow:rgba(190,242,100,.38)}
.pxg .ph-wide h1{font-size:clamp(56px,8.2vw,104px);line-height:.97}
.pxg .ph-wide .ph-sub{max-width:620px;font-size:clamp(17px,2vw,21px)}
.pxg .ph-wide .ph-btns{margin-top:30px}
.pxg .ph-wide .ph-cta{height:54px;padding:0 30px}
.pxg .ph-wide .pw-wrap{position:relative;max-width:1240px;margin:0 auto}
.pxg .ph-wide .pw-fan{--w:clamp(150px,17.5vw,236px);position:relative;display:flex;justify-content:center;align-items:flex-start;margin:64px auto 0;padding-top:46px;height:calc(var(--w)*1.12 + 46px);overflow:hidden}
.pxg .ph-wide .pw-fan:before{content:"";position:absolute;left:50%;bottom:-160px;width:min(1000px,130vw);height:360px;transform:translateX(-50%);background:radial-gradient(closest-side,var(--ph-glow),transparent);pointer-events:none}
.pxg .ph-wide .pw-item{position:relative;flex:0 0 auto;width:var(--w);margin-left:calc(var(--w)*-.1);transform:translateY(var(--y)) rotate(var(--r));transition:transform .35s cubic-bezier(.2,.8,.2,1);z-index:var(--z);cursor:pointer}
.pxg .ph-wide .pw-item:first-child{margin-left:0}
.pxg .ph-wide .pw-item:hover{transform:translateY(calc(var(--y) - 24px)) rotate(0) scale(1.05);z-index:30}
.pxg .ph-wide .pw-face{aspect-ratio:2/3;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 16px 36px rgba(9,30,28,.22)}
.pxg .ph-wide .pw-face img{width:100%;height:100%;object-fit:cover;display:block;max-width:none}
.pxg .ph-wide .pw-item.sbux img{transform:scale(1.08)}
.pxg .ph-wide .pw-tag{position:absolute;z-index:40;padding:9px 16px;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 8px 20px rgba(9,30,28,.16)}
.pxg .ph-wide .pw-tag:after{content:"";position:absolute;bottom:-6px;width:12px;height:12px;background:inherit;transform:rotate(45deg);border-radius:2px}
.pxg .ph-wide .pw-tag.a{top:0;left:6%;background:#d9f99d;color:#091e1c}
.pxg .ph-wide .pw-tag.a:after{left:24px}
.pxg .ph-wide .pw-tag.b{top:10px;right:6%;background:#091e1c;color:#fff}
.pxg .ph-wide .pw-tag.b:after{right:24px}
}
@media(prefers-reduced-motion:reduce){.pxg .ph-hero .ph-card,.pxg .ph-hero .ph-chip,.pxg .ph-hero .ph-dots button{transition:none}}
`;

function HeroCarousel() {
  const [cur, setCur] = useState(0);
  const [coin, setCoin] = useState(0);
  const [auto, setAuto] = useState(true);
  const startX = useRef<number | null>(null);
  const N = HERO_CARDS.length;

  useEffect(() => {
    if (!auto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setCur((c) => (c + 1) % N), 3200);
    return () => clearInterval(t);
  }, [auto, N]);

  const go = (i: number) => {
    setAuto(false);
    setCur(((i % N) + N) % N);
  };
  const c = HERO_CARDS[cur];
  const k = HERO_COINS[coin];

  return (
    <>
    <section className={"ph-hero ph-mob"}>
      <style>{HERO_CSS}</style>
      <div className={"ph-wrap"}>
        <h1>
          {"Gift cards,"}
          <br />
          {"paid in crypto."}
        </h1>
        <p className={"ph-sub"}>
          {"Pick the coin you hold and every price switches to it. Your code arrives by email."}
        </p>
        <div className={"ph-pay"} role={"group"} aria-label={"Choose a coin"}>
          <span>{"Pay with"}</span>
          <div className={"ph-chips"}>
            {HERO_COINS.map((x, i) => (
              <button key={x.s} type={"button"} className={"ph-chip"} aria-pressed={i === coin} onClick={() => setCoin(i)}>
                {x.s}
              </button>
            ))}
          </div>
        </div>
        <div
          className={"ph-stage"}
          tabIndex={0}
          aria-roledescription={"carousel"}
          aria-label={"Gift cards"}
          onPointerDown={(e) => {
            startX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (startX.current === null) return;
            const dx = e.clientX - startX.current;
            startX.current = null;
            if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(cur + 1);
            if (e.key === "ArrowLeft") go(cur - 1);
          }}
        >
          {HERO_CARDS.map((x, i) => {
            let d = i - cur;
            if (d > N / 2) d -= N;
            if (d < -N / 2) d += N;
            const a = Math.abs(d);
            return (
              <div
                key={x.n}
                className={"ph-card" + (x.n === "Starbucks" ? " sbux" : "")}
                role={"group"}
                aria-label={x.n + " " + x.f + " gift card"}
                style={{ "--d": d, "--a": a, display: a > 2 ? "none" : undefined } as React.CSSProperties}
                onClick={() => go(i)}
              >
                <img src={x.img} alt={""} draggable={false} />
              </div>
            );
          })}
        </div>
        <div className={"ph-quote"} aria-live={"polite"}>
          <em>{c.n + " " + c.f}</em>
          <b>{(c.usd / k.r).toFixed(k.d) + " " + k.s}</b>
        </div>
        <div className={"ph-dots"}>
          {HERO_CARDS.map((x, i) => (
            <button key={x.n} type={"button"} aria-label={"Show " + x.n} aria-current={i === cur} onClick={() => go(i)} />
          ))}
        </div>
        <div className={"ph-btns"}>
          <a className={"ph-cta solid"} href={"#g-bar"}>
            {"Browse cards"}
          </a>
          <a className={"ph-cta ghost"} href={"#g-after"}>
            {"How it works"}
          </a>
        </div>
      </div>
    </section>
    <section className={"ph-hero ph-wide"}>
      <div className={"ph-wrap"}>
        <h1>
          {"Gift cards,"}
          <br />
          {"paid in crypto."}
        </h1>
        <p className={"ph-sub"}>
          {"Steam, Netflix, Xbox, Apple and more. Pay with the coin you hold and your code arrives by email."}
        </p>
        <div className={"ph-btns"}>
          <a className={"ph-cta solid"} href={"#g-bar"}>
            {"Browse cards"}
          </a>
          <a className={"ph-cta ghost"} href={"#g-after"}>
            {"How it works"}
          </a>
        </div>
      </div>
      <div className={"pw-wrap"}>
        <span className={"pw-tag a"}>{"Paid in USDT"}</span>
        <span className={"pw-tag b"}>{"Code in minutes"}</span>
        <div className={"pw-fan"}>
          {WIDE_CARDS.map((x) => (
            <div key={x.n} className={"pw-item" + (x.cls || "")} style={{ "--r": x.r + "deg", "--y": x.y + "px", "--z": x.z } as React.CSSProperties}>
              <div className={"pw-face"}>
                <img src={x.img} alt={x.n + " gift card"} draggable={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}

export function GiftCardsExport() {
  return (
    <CurrentMarketingPage page="gift-cards">
    <div className={"page-wrapper"}>
      <header className={"px-nav"} id={"pxnav"}>
        <div className={"px-nav-in"}>
          <a className={"px-logo"} href={"#"} data-px-link={"home"}>
            <span className={"px-logo-mark"}>
              {"p"}
            </span>
            <span>
              {"pexly"}
            </span>
          </a>
          <nav className={"px-menu"} id={"pxmenu"} aria-label={"Main"}>
            <div className={"px-dd"}>
              <button className={"px-dd-t"} type={"button"} aria-expanded={"false"}>
                {"Marketplace "}
                <i></i>
              </button>
              <div className={"px-dd-l"}>
                <a href={"#"} data-px-link={"giftcards"}>
                  <b>
                    {"Gift Cards"}
                  </b>
                  <small>
                    {"Shopping, gaming, streaming"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"topup"}>
                  <b>
                    {"Mobile Top Up"}
                  </b>
                  <small>
                    {"Airtime and data, anywhere"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"shop"}>
                  <b>
                    {"Physical Products"}
                  </b>
                  <small>
                    {"Electronics, fashion, home"}
                  </small>
                </a>
              </div>
            </div>
            <a className={"px-l"} href={"#"} data-px-link={"giftcards"}>
              {"Gift Cards"}
            </a>
            <a className={"px-l"} href={"#"} data-px-link={"shop"}>
              {"Physical Products"}
            </a>
            <a className={"px-l"} href={"#"} data-px-link={"blog"}>
              {"Blog"}
            </a>
            <div className={"px-dd"}>
              <button className={"px-dd-t"} type={"button"} aria-expanded={"false"}>
                {"Company "}
                <i></i>
              </button>
              <div className={"px-dd-l"}>
                <a href={"#"} data-px-link={"about"}>
                  <b>
                    {"About Pexly"}
                  </b>
                  <small>
                    {"Our mission and story"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"team"}>
                  <b>
                    {"Our Team"}
                  </b>
                  <small>
                    {"The people behind Pexly"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"careers"}>
                  <b>
                    {"Careers"}
                  </b>
                  <small>
                    {"Open roles"}
                  </small>
                </a>
              </div>
            </div>
            <div className={"px-mob-btns"}>
              <a className={"px-btn ghost"} href={"#"}>
                {"Connect Wallet"}
              </a>
              <a className={"px-btn solid"} href={"#"} data-px-link={"giftcards"}>
                {"Start Shopping"}
              </a>
            </div>
          </nav>
          <div className={"px-right"}>
            <a className={"px-btn ghost"} href={"#"}>
              {"Connect Wallet"}
            </a>
            <a className={"px-btn solid"} href={"#"} data-px-link={"giftcards"}>
              {"Start Shopping"}
            </a>
          </div>
          <button className={"px-burger"} id={"pxburger"} aria-label={"Menu"} aria-expanded={"false"}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
      <main id={"top"}>
        <div className={"pxg"}>
          <HeroCarousel />
          <div className={"g-bar"} id={"g-bar"}>
            <div className={"g-w"}>
              <div className={"g-coins"}></div>
            </div>
          </div>
          <div className={"g-main"}>
            <div className={"g-w"}>
              <div id={"g-shelf"}></div>
              <div className={"g-after"} id={"g-after"}>
                <div>
                  <h2>
                    {"What happens after you pay"}
                  </h2>
                  <p>
                    {"No account, no card details. You pay from your wallet and the code comes to your inbox."}
                  </p>
                </div>
                <div className={"g-rc"}>
                  <h3>
                    {"Typical timing"}
                  </h3>
                  <div className={"r"}>
                    <div className={"tt"}>
                      {"0:00"}
                    </div>
                    <div>
                      <b>
                        {"You send the coin"}
                      </b>
                      <span>
                        {"From your own wallet to the address we show."}
                      </span>
                    </div>
                  </div>
                  <div className={"r"}>
                    <div className={"tt"}>
                      {"~0:30"}
                    </div>
                    <div>
                      <b>
                        {"The network confirms"}
                      </b>
                      <span>
                        {"Speed depends on the coin you picked."}
                      </span>
                    </div>
                  </div>
                  <div className={"r"}>
                    <div className={"tt"}>
                      {"~2:00"}
                    </div>
                    <div>
                      <b>
                        {"The code is in your inbox"}
                      </b>
                      <span>
                        {"Check spam if you don’t see it."}
                      </span>
                    </div>
                  </div>
                  <small>
                    {"Typical timings. Busy networks can take longer."}
                  </small>
                </div>
              </div>
              <div id={"g-more"}></div>
            </div>
          </div>
          <section className={"sp-sec"}>
            <div className={"padding-global"}>
              <div className={"container-large"}>
                <h2 className={"sp-h center"}>
                  {"Explore the rest of the marketplace"}
                </h2>
                <div className={"sp-looks"}>
                  <figure className={"sp-look"}>
                    <img src={"/marketing-media/media-f9de0167e3e0ed2c.avif"} alt={""} loading={"lazy"} />
                    <a className={"sp-pill"} href={"#"} data-px-link={"topup"}>
                      <svg viewBox={"0 0 24 24"} width={"20"} height={"20"} fill={"none"} stroke={"#091e1c"} strokeWidth={"1.8"}>
                        <path d={"M3 12l9-9h8v8l-9 9z"}></path>
                        <circle cx={"16"} cy={"8"} r={"1.2"}></circle>
                      </svg>
                      {"Shop Top Ups"}
                    </a>
                  </figure>
                  <figure className={"sp-look"}>
                    <img src={"/marketing-media/media-1ee388ec36d8c9a7.avif"} alt={""} loading={"lazy"} />
                    <a className={"sp-pill"} href={"#"} data-px-link={"shop"}>
                      <svg viewBox={"0 0 24 24"} width={"20"} height={"20"} fill={"none"} stroke={"#091e1c"} strokeWidth={"1.8"}>
                        <path d={"M3 12l9-9h8v8l-9 9z"}></path>
                        <circle cx={"16"} cy={"8"} r={"1.2"}></circle>
                      </svg>
                      {"Shop Physical Products"}
                    </a>
                  </figure>
                  <figure className={"sp-look"}>
                    <img src={"/marketing-media/media-d9e7636fc944d27d.avif"} alt={""} loading={"lazy"} />
                    <a className={"sp-pill"} href={"#"} data-px-link={"shop"}>
                      <svg viewBox={"0 0 24 24"} width={"20"} height={"20"} fill={"none"} stroke={"#091e1c"} strokeWidth={"1.8"}>
                        <path d={"M3 12l9-9h8v8l-9 9z"}></path>
                        <circle cx={"16"} cy={"8"} r={"1.2"}></circle>
                      </svg>
                      {"Start Selling"}
                    </a>
                  </figure>
                </div>
              </div>
            </div>
          </section>
          <section className={"sp-reviews"}>
            <div className={"padding-global"}>
              <div className={"container-large"}>
                <div className={"sp-stars"}>
                  {"★★★★★"}
                </div>
                <h2 className={"sp-h center"}>
                  {"What people are saying"}
                </h2>
                <div className={"sp-row"}>
                  <article className={"sp-rev"}>
                    <div className={"st"}>
                      {"★★★★★"}
                    </div>
                    <p>
                      {"Bought a Steam card with USDT and the code landed in my inbox in two minutes."}
                    </p>
                    <div className={"by"}>
                      <b>
                        {"Tunde A."}
                      </b>
                      <span>
                        <i>
                          {"✓"}
                        </i>
                        {"Verified buyer"}
                      </span>
                    </div>
                  </article>
                  <article className={"sp-rev"}>
                    <div className={"st"}>
                      {"★★★★★"}
                    </div>
                    <p>
                      {"Easy way to gift my sister an Amazon card abroad. No bank transfer needed."}
                    </p>
                    <div className={"by"}>
                      <b>
                        {"Chloe R."}
                      </b>
                      <span>
                        <i>
                          {"✓"}
                        </i>
                        {"Verified buyer"}
                      </span>
                    </div>
                  </article>
                  <article className={"sp-rev"}>
                    <div className={"st"}>
                      {"★★★★★"}
                    </div>
                    <p>
                      {"Clear total in my coin before paying. No surprises."}
                    </p>
                    <div className={"by"}>
                      <b>
                        {"Ibrahim S."}
                      </b>
                      <span>
                        <i>
                          {"✓"}
                        </i>
                        {"Verified buyer"}
                      </span>
                    </div>
                  </article>
                  <article className={"sp-rev"}>
                    <div className={"st"}>
                      {"★★★★★"}
                    </div>
                    <p>
                      {"Finally a simple place to spend crypto on Netflix and Spotify."}
                    </p>
                    <div className={"by"}>
                      <b>
                        {"Grace M."}
                      </b>
                      <span>
                        <i>
                          {"✓"}
                        </i>
                        {"Verified buyer"}
                      </span>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>
          <div className={"g-main"}>
            <div className={"g-w"}>
              <div className={"g-faq"}>
                <div>
                  <h2>
                    {"Questions people ask"}
                  </h2>
                  <p className={"s"}>
                    {"Can’t find yours? Contact support from the footer."}
                  </p>
                </div>
                <div>
                  <details>
                    <summary>
                      {"Which coins can I pay with?"}
                    </summary>
                    <p>
                      {"USDT, USDC, Bitcoin, Ethereum, Solana and Litecoin. Pick one in the bar and all prices switch to it."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Do I need an account?"}
                    </summary>
                    <p>
                      {"No. Choose a card, pay, and the code is sent to the email you enter."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"How fast does the code arrive?"}
                    </summary>
                    <p>
                      {"Usually within a few minutes of your payment confirming."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Can I get a refund?"}
                    </summary>
                    <p>
                      {"Codes can’t be refunded once revealed. If a code doesn’t work, contact support within 24 hours."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Why do I only see some cards?"}
                    </summary>
                    <p>
                      {"Many cards only work in one country. Pick your country and you will only see cards that work for you."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Are there extra fees?"}
                    </summary>
                    <p>
                      {"The price shown is the card price in your coin. Your wallet’s network fee is separate and shown before you confirm."}
                    </p>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
        <section id={"start"} className={"sp-signup"}>
          <svg className={"wave"} viewBox={"0 0 1440 120"} preserveAspectRatio={"none"}>
            <path d={"M0 120V60C120 20 240 0 380 30s260 70 420 40 260-60 400-30 180 50 240 30v80z"} fill={"#091e1c"}></path>
          </svg>
          <div className={"padding-global"}>
            <div className={"container-large"}>
              <div className={"in"}>
                <h2>
                  {"Get 5% back on your first order when you sign up for email!"}
                </h2>
                <div className={"f"}>
                  <input type={"email"} placeholder={"Email address"} aria-label={"Email"} />
                  <button aria-label={"Subscribe"}>
                    {"→"}
                  </button>
                </div>
                <small>
                  {"By submitting this form you agree to receive marketing emails from Pexly. Unsubscribe at any time."}
                </small>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className={"footer"}>
        <div className={"padding-global"}>
          <div className={"container-large"}>
            <div className={"footer-content-box"}>
              <div className={"footer-content-upper"}>
                <div className={"footer-upper-left-content"}>
                  <div className={"footer-upper-logo-block"}>
                    <span className={"px-flogo"}>
                      <span className={"px-logo-mark"}>
                        {"p"}
                      </span>
                      {"pexly"}
                    </span>
                  </div>
                  <div className={"footer-upper-text-block"}>
                    <p className={"p-regular text-lightgrey"}>
                      {"Pexly is one decentralized marketplace for shopping with crypto."}
                      <br />
                      {"‍"}
                      <br />
                      {" Buy gift cards, top up mobile phones and order physical products, all from your own wallet."}
                    </p>
                  </div>
                  <div className={"footer-upper-coin-icon-block"}>
                    <img src={"/marketing-media/media-e04327e51cd5c862.avif"} loading={"lazy"} alt={""} className={"footer-upper-coin"} />
                  </div>
                  <div className={"footer-upper-text-block"}>
                    <p className={"p-regular light-gray"}>
                      {"Decentralized. Non-custodial. Borderless."}
                    </p>
                  </div>
                  <div className={"footer-social-link-wrap"}>
                    <a href={"#"} className={"footer-social-link-block w-inline-block"}>
                      <svg xmlns={"http://www.w3.org/2000/svg"} width={"100%"} viewBox={"0 0 14 12"} fill={"none"} className={"footer-social-link-icon"}>
                        <path d={"M10.4416 0H12.3925L8.1304 4.87129L13.1444 11.5H9.21849L6.1436 7.4797L2.62515 11.5H0.673105L5.23183 6.2896L0.421875 0H4.44747L7.22689 3.6747L10.4416 0ZM9.7569 10.3323H10.8379L3.86009 1.10636H2.70006L9.7569 10.3323Z"} fill={"currentColor"}></path>
                      </svg>
                    </a>
                    <a href={"#"} className={"footer-social-link-block w-inline-block"}>
                      <svg xmlns={"http://www.w3.org/2000/svg"} width={"100%"} viewBox={"0 0 20 20"} fill={"none"} className={"footer-social-link-icon"}>
                        <mask id={"mask0_3988_4230"} style={{"maskType": "luminance"} as any} maskUnits={"userSpaceOnUse"} x={"3"} y={"2"} width={"14"} height={"16"}>
                          <path d={"M17 2.75H3V17.522H17V2.75Z"} fill={"white"}></path>
                        </mask>
                        <g mask={"url(#mask0_3988_4230)"}>
                          <path d={"M10.7972 7.88289C11.0942 7.10744 11.7173 6.8054 12.4559 6.69064C13.1348 6.58479 13.8207 6.57277 14.4984 6.71196C15.479 6.91319 16.1533 7.49168 16.5297 8.41485C16.8008 9.0798 16.9423 9.77771 16.9508 10.4919C16.978 12.7589 16.9834 15.0259 17.0043 17.293C17.0059 17.481 16.9322 17.5186 16.7651 17.5175C15.8799 17.5116 14.9947 17.5093 14.1096 17.519C13.9095 17.5213 13.8599 17.4546 13.8606 17.2635C13.8665 15.3253 13.8657 13.387 13.8626 11.4488C13.8618 11.0987 13.8273 10.7489 13.6544 10.4345C13.369 9.91496 12.8708 9.775 12.3373 9.77383C11.7894 9.77267 11.2509 9.89984 11.0031 10.4566C10.8686 10.7586 10.8088 11.1173 10.8057 11.4511C10.7879 13.37 10.7972 15.2888 10.7968 17.2077C10.7968 17.4121 10.695 17.5145 10.4913 17.5147C9.6321 17.5147 8.77251 17.5101 7.91331 17.5182C7.72488 17.5202 7.65586 17.474 7.65625 17.2713C7.66207 13.8019 7.66168 10.3321 7.65703 6.86279C7.65703 6.67707 7.7117 6.61852 7.89858 6.62046C8.78376 6.6286 9.66894 6.63015 10.5541 6.61968C10.7581 6.61736 10.8073 6.69025 10.8003 6.87791C10.7879 7.21252 10.7972 7.5479 10.7972 7.88289Z"} fill={"currentColor"}></path>
                          <path d={"M6.14019 12.0889C6.14019 13.8073 6.14019 15.5261 6.14019 17.2445C6.14019 17.5186 6.13902 17.5198 5.86102 17.5198C4.98864 17.5201 4.11665 17.5155 3.24465 17.5232C3.06126 17.5248 3.00038 17.4721 3.00038 17.2832C3.00542 13.8139 3.00542 10.3445 3 6.87513C3 6.677 3.06126 6.62311 3.25396 6.62505C4.12595 6.63396 4.99833 6.62854 5.87033 6.62892C6.13864 6.62892 6.1398 6.63009 6.1398 6.89413C6.14019 8.62571 6.14019 10.3573 6.14019 12.0889Z"} fill={"currentColor"}></path>
                          <path d={"M6.13554 4.32223C6.13477 5.21361 5.45818 5.88631 4.56331 5.88554C3.67232 5.88476 2.99961 5.2078 3 4.31292C3.00078 3.42193 3.67736 2.74923 4.57223 2.75C5.46439 2.75078 6.13593 3.4262 6.13554 4.32223Z"} fill={"currentColor"}></path>
                        </g>
                      </svg>
                    </a>
                  </div>
                </div>
                <div className={"footer-upper-right-content"}>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Marketplace"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Gift Cards"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Mobile Top Up"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Physical Products"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Open a Store"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Order History"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Price Alerts"}
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Wallet"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Connect Wallet"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with BTC"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with ETH"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with USDT"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with USDC"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Fees"}
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Support"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Help Center"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Dispute Resolution"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Contact Us"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"FAQ"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Report a Seller"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Status"}
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Company"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"About Pexly"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Blog"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Careers"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Press"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Terms"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Privacy"}
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className={"footer-bottom-content-wrap"}>
                <div className={"footer-big-logo-wrap"}>
                  <div className={"px-big"}>
                    {"PEXLY"}
                  </div>
                  <div className={"footer-logo-line"}></div>
                </div>
                <div className={"footer-bottom-text-wrapper"}>
                  <div className={"footer-bottom-text-left"}>
                    <p className={"p-xs light-gray"}>
                      {"2026 — All rights reserved. Pexly is a decentralized, non-custodial marketplace. Crypto assets are volatile, so only spend what you can afford to. Availability of gift cards, top ups and products varies by region."}
                    </p>
                  </div>
                  <div className={"footer-bottom-link-wrap"}>
                    <a href={"#"} className={"footer-link-item w-inline-block"}>
                      <div className={"p-xs light-gray"}>
                        {"Terms & policies"}
                      </div>
                    </a>
                    <a href={"#"} className={"footer-link-item w-inline-block"}>
                      <div className={"p-xs light-gray"}>
                        {"Privacy Policy"}
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </CurrentMarketingPage>
  );
}
