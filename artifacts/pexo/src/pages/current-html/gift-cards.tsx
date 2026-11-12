import { CurrentMarketingPage } from "@/components/marketing/current-marketing-page";

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
          <section className={"ph-hero"}>
            <style>{`
              .ph-hero{background:#fff;color:#091e1c;padding:72px 0 0;overflow:hidden;position:relative}
              .ph-hero .ph-in{max-width:1100px;margin:0 auto;padding:0 20px;text-align:center}
              .ph-hero h1{font-size:clamp(44px,8vw,96px);line-height:.98;letter-spacing:-.04em;font-weight:800;margin:0 0 22px;color:#091e1c}
              .ph-hero .ph-sub{font-size:clamp(16px,2vw,21px);line-height:1.5;color:#4b5b59;max-width:620px;margin:0 auto 30px}
              .ph-hero .ph-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
              .ph-hero .ph-b{display:inline-flex;align-items:center;justify-content:center;height:52px;padding:0 28px;border-radius:999px;font-weight:600;font-size:16px;text-decoration:none;border:1.5px solid #091e1c;transition:transform .15s}
              .ph-hero .ph-b:hover{transform:translateY(-2px)}
              .ph-hero .ph-b.solid{background:#091e1c;color:#fff}
              .ph-hero .ph-b.ghost{background:#fff;color:#091e1c}
              .ph-stage{position:relative;max-width:1180px;margin:56px auto 0;padding:0 16px}
              .ph-fan{display:flex;justify-content:center;align-items:flex-start;height:400px;overflow:hidden;padding-top:40px}
              .ph-card{flex:0 0 auto;width:210px;margin-left:-34px;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 14px 34px rgba(9,30,28,.18);transition:transform .25s}
              .ph-card:first-child{margin-left:0}
              .ph-card img{display:block;width:100%;height:auto}
              .ph-card:nth-child(1){transform:rotate(-8deg) translateY(18px)}
              .ph-card:nth-child(2){transform:rotate(-5deg) translateY(4px)}
              .ph-card:nth-child(3){transform:rotate(-2deg) translateY(-8px);z-index:2}
              .ph-card:nth-child(4){transform:rotate(1.5deg) translateY(-4px);z-index:3}
              .ph-card:nth-child(5){transform:rotate(4deg) translateY(6px);z-index:2}
              .ph-card:nth-child(6){transform:rotate(7deg) translateY(16px)}
              .ph-card:hover{transform:translateY(-14px) rotate(0);z-index:9}
              .ph-tag{position:absolute;z-index:10;padding:9px 16px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 6px 16px rgba(9,30,28,.15)}
              .ph-tag.a{top:6px;left:6%;background:#d9f99d;color:#091e1c}
              .ph-tag.b{top:20px;right:8%;background:#091e1c;color:#fff}
              @media(max-width:767px){
                .ph-hero{padding-top:44px}
                .ph-stage{margin-top:36px;padding:0}
                .ph-fan{height:auto;overflow-x:auto;overflow-y:hidden;justify-content:flex-start;gap:14px;padding:44px 20px 28px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}
                .ph-fan::-webkit-scrollbar{display:none}
                .ph-card,.ph-card:nth-child(n){width:68vw;max-width:300px;margin:0;transform:none;scroll-snap-align:center}
                .ph-card:hover{transform:none}
                .ph-tag.a{top:4px;left:20px}
                .ph-tag.b{top:4px;right:20px}
                .ph-hero .ph-b{flex:1 1 140px}
              }
            `}</style>
            <div className={"ph-in"}>
              <h1>
                {"Gift cards,"}
                <br />
                {"paid in crypto."}
              </h1>
              <p className={"ph-sub"}>
                {"Steam, Netflix, Xbox, Apple and more. Pay with the coin you hold and your code arrives by email."}
              </p>
              <div className={"ph-btns"}>
                <a className={"ph-b solid"} href={"#g-bar"}>
                  {"Browse cards"}
                </a>
                <a className={"ph-b ghost"} href={"#g-after"}>
                  {"How it works"}
                </a>
              </div>
            </div>
            <div className={"ph-stage"}>
              <span className={"ph-tag a"}>
                {"Paid in USDT"}
              </span>
              <span className={"ph-tag b"}>
                {"Code in minutes"}
              </span>
              <div className={"ph-fan"}>
                <div className={"ph-card"}><img src={"/marketing-media/gift-cards/razer.png"} alt={"Razer Gold gift card"} /></div>
                <div className={"ph-card"}><img src={"/marketing-media/gift-cards/starbucks.jpeg"} alt={"Starbucks gift card"} /></div>
                <div className={"ph-card"}><img src={"/marketing-media/gift-cards/steam.jpeg"} alt={"Steam gift card"} /></div>
                <div className={"ph-card"}><img src={"/marketing-media/gift-cards/apple.jpg"} alt={"Apple gift card"} /></div>
                <div className={"ph-card"}><img src={"/marketing-media/gift-cards/netflix.jpg"} alt={"Netflix gift card"} /></div>
                <div className={"ph-card"}><img src={"/marketing-media/gift-cards/xbox.jpeg"} alt={"Xbox gift card"} /></div>
              </div>
              <div id={"g-deck"} hidden></div>
            </div>
          </section>
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
