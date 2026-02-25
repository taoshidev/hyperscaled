import { useState, useRef } from "react";
const photo = "/hl.png";
const jollyLogo = "/jolly-green.png";
const bitcastLogo = "/bitcast.png";
const talismanLogo = "/talisman.svg";
const zokuLogo = "/zoku.png";

const FIRMS = [
  { name: "Vanta Trading",       slug: null,      logo: "V", logoImg: null,                                                                                                                              url: "https://vantatrading.io", take: 0,  prices: [599, 749, 999], color: "#3b82f6", color2: "#22c55e" },
  { name: "Jolly Green Trading", slug: "jolly",   logo: "J", logoImg: jollyLogo,                                                                                                                          url: null, take: 10, prices: [449, 579, 849], color: "#22c55e", color2: "#16a34a" },
  { name: "Bitcast Trading",     slug: "bitcast", logo: "B", logoImg: bitcastLogo,                                                                                                                       url: null, take: 10, prices: [429, 559, 829], color: "#a855f7", color2: "#7c3aed" },
  { name: "Talisman Trading",    slug: "talisman",logo: "T", logoImg: talismanLogo,                                                                                                                      url: null, take: 15, prices: [389, 519, 769], color: "#eab308", color2: "#d97706" },
  { name: "Zoku Trading",        slug: "zoku",    logo: "Z", logoImg: zokuLogo,                                                                                                                          url: null, take: 20, prices: [349, 469, 699], color: "#a855f7", color2: "#7c3aed" },
];
const TIERS = ["$25K","$50K","$100K"];
const TIER_VALS = [25000,50000,100000];
const DETAILS = [
  ["Challenge Structure","One Step"],["Order Books","Hyperliquid"],["Pairs","BTC, ETH, SOL, DOGE, XRP, ADA"],
  ["Profit Target","10%"],["Max Drawdown","5% Challenge / 10% Funded"],["Profit Split","Up to 100%"],
  ["Account Scaling","Up to $2.5M"],["Markets","Crypto Perpetuals"],["News Trading","Allowed"],
  ["Weekend Trading","Allowed"],["Infrastructure","Open Source, Decentralized"],["Permissionless","Yes"],
  ["Payouts","Weekly, Onchain"],["Eval Leverage","1.25x"],["Funded Leverage","5x"],
];
const EXAMPLE_ADDR = "0x7a3b9c4d2e1f8a5b6c7d8e9f0a1b2c3d4e5f41d";
const LB = [
  { addr:"0x7a3b...f41d",pnl:48230,funding:400000,sharpe:2.14,promotions:3,trades:847,registered:"Oct 2024",winRate:68,payouts:12480,status:"Funded" },
  { addr:"0xd4e5...b2c3",pnl:35120,funding:200000,sharpe:1.87,promotions:2,trades:623,registered:"Nov 2024",winRate:64,payouts:8750,status:"Funded" },
  { addr:"0x9f0a...e8d7",pnl:28940,funding:200000,sharpe:1.95,promotions:2,trades:512,registered:"Sep 2024",winRate:71,payouts:7200,status:"Funded" },
  { addr:"0x2c3d...a1b0",pnl:22100,funding:100000,sharpe:1.62,promotions:1,trades:389,registered:"Dec 2024",winRate:62,payouts:5500,status:"Funded" },
  { addr:"0xf8a9...c4d5",pnl:18750,funding:100000,sharpe:1.78,promotions:1,trades:445,registered:"Nov 2024",winRate:66,payouts:4680,status:"Funded" },
  { addr:"0x5e6f...8a9b",pnl:15320,funding:100000,sharpe:1.54,promotions:1,trades:298,registered:"Jan 2025",winRate:60,payouts:3800,status:"Funded" },
  { addr:"0xb1c2...f0a1",pnl:12840,funding:50000,sharpe:1.41,promotions:1,trades:267,registered:"Dec 2024",winRate:63,payouts:3200,status:"Funded" },
  { addr:"0x3d4e...7a8b",pnl:9620,funding:50000,sharpe:1.33,promotions:0,trades:198,registered:"Jan 2025",winRate:58,payouts:2400,status:"Funded" },
  { addr:"0xa0b1...d3e4",pnl:4180,funding:25000,sharpe:1.12,promotions:0,trades:142,registered:"Feb 2025",winRate:57,payouts:1040,status:"Challenge" },
  { addr:"0x6c7d...9f0a",pnl:2940,funding:25000,sharpe:0.98,promotions:0,trades:89,registered:"Feb 2025",winRate:55,payouts:0,status:"Challenge" },
  { addr:"0xe2f3...b5c6",pnl:1820,funding:25000,sharpe:0.87,promotions:0,trades:64,registered:"Feb 2025",winRate:53,payouts:0,status:"Challenge" },
  { addr:"0x4a5b...8d9e",pnl:-1240,funding:25000,sharpe:0.42,promotions:0,trades:51,registered:"Feb 2025",winRate:41,payouts:0,status:"Challenge" },
];

function fmt(n){return n.toLocaleString("en-US")}
function fmtUSD(n){return "$"+fmt(n)}

/** Inline SVG “image” icons per feature box */
function FeatureIcon({ name, color="rgba(255,255,255,0.8)" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "One-Step Evaluation":
      return (
        <svg {...common}>
          <path d="M20 6L9 17l-5-5" />
          <path d="M7 7h10" />
        </svg>
      );
    case "Grow Your Account":
      return (
        <svg {...common}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M21 10V3h-7" />
        </svg>
      );
    case "USDC In, USDC out":
      return (
        <svg {...common}>
          <path d="M12 1v22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "Onchain Transparency":
      return (
        <svg {...common}>
          <path d="M12 2l9 5-9 5-9-5 9-5z" />
          <path d="M3 7v10l9 5 9-5V7" />
          <path d="M12 12v10" />
        </svg>
      );
    case "Trade on Hyperliquid":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M8 19V9" />
          <path d="M12 19V12" />
          <path d="M16 19V7" />
          <path d="M20 19V10" />
        </svg>
      );
    case "Transparent Rules":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
  }
}

// Chrome Extension Mock
function ChromeExtUI(){
  return (
    <div style={{width:380,background:"linear-gradient(180deg,#080c18 0%,#0a1020 100%)",borderRadius:14,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,0.6),0 0 60px rgba(59,130,246,0.06)",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:"150%",height:"150%",top:"-25%",left:"-25%",filter:"blur(60px)",background:"radial-gradient(circle at 30% 40%,rgba(59,130,246,0.08),transparent 60%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:"150%",height:"150%",top:"-25%",left:"-25%",filter:"blur(60px)",background:"radial-gradient(circle at 70% 60%,rgba(147,51,234,0.06),transparent 60%)",pointerEvents:"none"}}/>
        <div style={{padding:"14px 16px",display:"flex",justifyContent:"flex-end",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,0.04)",position:"relative"}}>
          <div style={{fontSize:10,padding:"3px 10px",borderRadius:100,background:"rgba(34,197,94,0.1)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.15)",fontWeight:500}}>Funded</div>
        </div>
        <div style={{padding:"16px 16px 12px",position:"relative"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:3}}>Funded Account Balance:</div>
          <div style={{fontSize:30,fontWeight:300,color:"#fff",letterSpacing:"-0.03em",lineHeight:1.2}}>$201,271.23</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:10,marginBottom:3}}>Current Period Expected Payout</div>
          <div style={{fontSize:24,fontWeight:300,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.2}}>$1,271.23</div>
        </div>
        <div style={{padding:"0 16px 12px",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:500}}>Open Positions</span>
            <span style={{fontSize:11,color:"#3b82f6"}}>View on HL →</span>
          </div>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:13,fontWeight:500,color:"#fff"}}>BTC-PERP</span>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:"rgba(34,197,94,0.1)",color:"#22c55e",fontWeight:600}}>LONG</span>
              </div>
              <span style={{fontSize:13,color:"#22c55e",fontWeight:500}}>+$234.50</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 0"}}>
              {[["Size","0.15 BTC"],["Entry","$98,450.00"],["Mark","$100,013.33"],["Leverage","5x"]].map(([l,v])=>(
                <div key={l} style={{display:"flex",gap:8,fontSize:11}}><span style={{color:"rgba(255,255,255,0.3)"}}>{l}</span><span style={{color:"rgba(255,255,255,0.7)"}}>{v}</span></div>
              ))}
            </div>
          </div>
          <div style={{textAlign:"center",padding:"20px 0 10px",fontSize:11,color:"rgba(255,255,255,0.2)"}}>No additional open positions</div>
        </div>
        <div style={{padding:"0 16px 24px",position:"relative"}}>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:12,marginBottom:3}}><span style={{color:"rgba(255,255,255,0.5)"}}>Promotions:</span><span style={{color:"#22c55e",marginLeft:4,fontWeight:500}}>+$100,000</span></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>All Time Returns / Sharpe: <b style={{color:"rgba(255,255,255,0.7)",fontWeight:500}}>9.32% / 1.23</b></div>
          </div>
        </div>
        <div style={{padding:"0 16px 12px",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:15}}>
            <span style={{color:"rgba(255,255,255,0.5)"}}>Quarterly Promotion Progress</span><span style={{color:"rgba(255,255,255,0.7)"}}>2% / 5%</span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden",marginBottom:4}}>
            <div style={{width:"41.25%",height:"100%",background:"linear-gradient(90deg,#3b82f6,#22c55e)",borderRadius:3}}/>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>+$4,048 to target ($10,000 goal - $400k funded account)</div>
        </div>
        <div style={{padding:"0 16px 24px",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
            <span style={{color:"rgba(255,255,255,0.5)"}}>Current Drawdown</span><span style={{color:"#eab308"}}>7.2% / 10%</span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden",marginBottom:4}}>
            <div style={{width:"72%",height:"100%",background:"linear-gradient(90deg,#eab308,#ef4444)",borderRadius:3}}/>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>$5,600 remaining buffer</div>
        </div>
        <div style={{padding:"0 16px 16px",position:"relative"}}>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.7)"}}>View Full Analytics</div><div style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:1}}>Vanta Network Dashboard</div></div>
            <span style={{color:"rgba(255,255,255,0.2)",fontSize:14}}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [page,setPage]=useState("home");
  const [searchVal,setSearchVal]=useState("");
  const [showSugg,setShowSugg]=useState(false);
  const [selectedTier,setSelectedTier]=useState(1);
  const [dashTab,setDashTab]=useState("performance");
  const [tradeTab,setTradeTab]=useState("open");
  const searchRef=useRef(null);

  const handleSearch=(addr)=>{setSearchVal(addr||EXAMPLE_ADDR);setShowSugg(false);setPage("dashboard");setDashTab("performance")};
  const navTo=(p)=>{setPage(p);window.scrollTo(0,0)};

  const c={bg:"#000",card:"rgba(255,255,255,0.02)",border:"rgba(255,255,255,0.06)",text:"#fff",muted:"rgba(255,255,255,0.4)",dim:"rgba(255,255,255,0.5)",green:"#22c55e",red:"#ef4444",blue:"#3b82f6",yellow:"#eab308",purple:"#a855f7"};

  const GATEWAY = [
    { title:"One-Step Evaluation", desc:"Trade, perform, and unlock funded capital through a transparent, rules-based evaluation." },
    { title:"Grow Your Account", desc:"Strong performance unlocks access to more capital, with scaling up to $2.5M." },
    { title:"USDC In, USDC out", desc:"Pay and get paid in USDC. Payouts go directly to your wallet with no withdrawal fees." },
    { title:"Onchain Transparency", desc:"Every payout is tracked on-chain, powered by decentralized infrastructure. No exceptions." },
    { title:"Trade on Hyperliquid", desc:"Use the platform you know and love. You bring the skill, we bring the funding." },
    { title:"Transparent Rules", desc:"All evaluation rules are clear and open-source. Nothing hidden or opaque." },
  ];

  // ── NAV ──
  const activeFirm = FIRMS.find(f=>f.slug&&f.slug===page)||null;
  const Nav=()=>(
    <nav style={{padding:"12px 24px",borderBottom:`1px solid ${c.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",backdropFilter:"blur(12px)",background:"rgba(0,0,0,0.6)",position:"sticky",top:0,zIndex:50}}>

      {/* Left: firm logo on firm pages, Hyperscaled wordmark otherwise */}
      <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0}} onClick={()=>activeFirm?null:navTo("home")}>
        {activeFirm
          ? <div style={{display:"flex",alignItems:"center",gap:8}}>
              {activeFirm.logoImg
                ? <img src={activeFirm.logoImg} alt={activeFirm.name} style={{width:28,height:28,borderRadius:7,objectFit:"contain",background:"rgba(255,255,255,0.04)",padding:3}} onError={e=>{e.target.style.display="none"}} />
                : <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${activeFirm.color},${activeFirm.color2})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#fff"}}>{activeFirm.logo}</div>
              }
              <span style={{fontSize:15,fontWeight:600,letterSpacing:"-0.03em"}}>{activeFirm.name}</span>
            </div>
          : <img src="/hyperscaled-wordmark.svg" alt="Hyperscaled" style={{height:40,width:"auto",display:"block",objectFit:"contain"}} />
        }
      </div>

      <div style={{display:"flex",alignItems:"center",gap:4,flex:1,maxWidth:380,margin:"0 20px",position:"relative"}} ref={searchRef}>
        <div style={{flex:1,position:"relative"}}>
          <input
            type="text"
            placeholder="Search by HL address..."
            value={searchVal}
            onChange={e=>{setSearchVal(e.target.value);setShowSugg(e.target.value.length>1)}}
            onFocus={()=>{if(searchVal.length>1)setShowSugg(true)}}
            onKeyDown={e=>{if(e.key==="Enter")handleSearch(searchVal)}}
            style={{width:"100%",padding:"7px 12px 7px 30px",borderRadius:6,border:`1px solid rgba(255,255,255,0.08)`,background:"rgba(255,255,255,0.03)",color:"#fff",fontSize:12,fontFamily:"monospace",outline:"none"}}
          />
          <svg style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",width:13,height:13,color:"rgba(255,255,255,0.25)"}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {showSugg&&(
            <div style={{position:"absolute",top:"100%",left:0,right:0,marginTop:4,background:"rgba(10,14,26,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,overflow:"hidden",zIndex:100}}>
              <div
                style={{padding:"10px 12px",cursor:"pointer",fontSize:12,fontFamily:"monospace",color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",gap:8}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                onClick={()=>handleSearch(EXAMPLE_ADDR)}
              >
                <span style={{width:6,height:6,borderRadius:3,background:c.green,flexShrink:0}}/>
                {EXAMPLE_ADDR}
                <span style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.2)"}}>Funded · Tier III</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
        {/* Right: Hyperscaled wordmark on firm pages, normal nav links otherwise */}
        {activeFirm
          ? <div style={{display:"flex",alignItems:"center",gap:16}}>
              <span style={{fontSize:13,color:c.muted,cursor:"pointer"}} onClick={()=>navTo("leaderboard")}>Leaderboard</span>
              <span style={{fontSize:13,color:c.muted,cursor:"pointer"}}>Rules</span>
              <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>navTo("home")}>
                <img src="/hyperscaled-wordmark.svg" alt="Hyperscaled" style={{height:32,width:"auto",display:"block",objectFit:"contain",opacity:0.7}} />
              </div>
              <a href="https://chromewebstore.google.com" target="_blank" rel="noreferrer" style={{fontSize:12,padding:"7px 16px",borderRadius:6,background:"linear-gradient(135deg,#3b82f6,#7c3aed)",color:"#fff",textDecoration:"none",display:"flex",alignItems:"center",gap:6,fontWeight:500,whiteSpace:"nowrap",border:"none"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Extension
              </a>
            </div>
          : <>
              <span style={{fontSize:13,color:page==="leaderboard"?c.text:c.muted,cursor:"pointer"}} onClick={()=>navTo("leaderboard")}>Leaderboard</span>
              <span style={{fontSize:13,color:c.muted,cursor:"pointer"}}>Rules</span>
              <a href="https://chromewebstore.google.com" target="_blank" rel="noreferrer" style={{fontSize:12,padding:"7px 16px",borderRadius:6,background:"linear-gradient(135deg,#3b82f6,#7c3aed)",color:"#fff",textDecoration:"none",display:"flex",alignItems:"center",gap:6,fontWeight:500,whiteSpace:"nowrap",border:"none"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Extension
              </a>
            </>
        }
      </div>
    </nav>
  );

  // ── LANDING ──
  const Landing=()=>(
    <div>
      {/* HERO */}
      <section style={{padding:"80px 24px 40px",maxWidth:1100,margin:"0 auto"}}>
        <div className="heroRow" style={{display:"flex",alignItems:"center",gap:26}}>
          <div style={{flex:"0 0 560px",minWidth:0,paddingLeft:75}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:100,background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.12)"}}>
              <span style={{width:6,height:6,borderRadius:3,background:c.green}}/>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500}}>Built on Hyperliquid · Powered by Bittensor</span>
            </div>

            <h1 style={{fontSize:58,fontWeight:300,letterSpacing:"-0.04em",lineHeight:1.06,marginBottom:22}}>
              Permissionless<br/>Funded Trading on<br/>
              <span style={{background:"linear-gradient(135deg,#3b82f6,#8b5cf6,#22c55e)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:400}}>Hyperliquid</span>
            </h1>

            <p style={{fontSize:16,color:"rgba(255,255,255,0.42)",lineHeight:1.7,marginBottom:32,maxWidth:460}}>
              Trade with more capital without risking your own stack. Keep 100% of your profits. Grow your account to $2.5M. Built on the biggest decentralized prop firm in the world.
            </p>

            <div style={{display:"flex",gap:12,marginBottom:40}}>
              <button onClick={()=>document.getElementById("pricing")?.scrollIntoView({behavior:"smooth"})} style={{padding:"12px 28px",borderRadius:8,background:"#fff",color:"#000",fontSize:14,fontWeight:500,border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Get Funded →</button>
              <button onClick={()=>navTo("leaderboard")} style={{padding:"12px 28px",borderRadius:8,background:"transparent",color:"#fff",fontSize:14,fontWeight:500,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>View Leaderboard</button>
            </div>

            <div style={{display:"flex",gap:32}}>
              {[["4,200+","Network Traders"],["$482M+","Network Volume"],["$30M+","Paid Out via Network"]].map(([v,l],i)=>(
                <div key={i}>
                  <div style={{fontSize:22,fontWeight:400,letterSpacing:"-0.02em"}}>{v}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{flexShrink:0}}><ChromeExtUI/></div>
        </div>
      </section>

      {/* NEW GATEWAY SECTION */}
      <section style={{padding:"100px 24px 55px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",textTransform:"uppercase"}}>Your Gateway To Fair Funding</div>
          <h2 style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em",margin:"10px 0 8px"}}>
            Permissionless. Open-Source. Onchain.
          </h2>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.36)",margin:0}}>
            Built to remove hidden rules, opaque payouts, and centralized discretion.
          </p>
        </div>

        <div className="gatewayGrid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {GATEWAY.map((g)=>(
            <div key={g.title} style={{
              background:"rgba(255,255,255,0.02)",
              border:`1px solid ${c.border}`,
              borderRadius:12,
              padding:"18px 18px",
              position:"relative",
              overflow:"hidden"
            }}>
              <div style={{
                position:"absolute",inset:0,
                background:"radial-gradient(circle at 20% 10%, rgba(59,130,246,0.08), transparent 55%)",
                pointerEvents:"none"
              }}/>

              <div style={{position:"relative",display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{
                  width:38,height:38,borderRadius:12,
                  background:"rgba(255,255,255,0.03)",
                  border:"1px solid rgba(255,255,255,0.07)",
                  display:"flex",alignItems:"center",justifyContent:"center"
                }}>
                  <FeatureIcon name={g.title} />
                </div>
                <div style={{fontSize:14,fontWeight:500}}>{g.title}</div>
              </div>

              <div style={{position:"relative"}}>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.38)",lineHeight:1.6}}>
                  {g.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS (redesigned - not repetitive grid) */}
      <section style={{padding:"70px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:20,flexWrap:"wrap",marginBottom:28}}>
          <div>
            <h2 style={{fontSize:30,fontWeight:400,letterSpacing:"-0.03em",marginBottom:6}}>How It Works</h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.35)",margin:0}}>Trade on Hyperliquid. Get funded by the network.</p>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>
            Transparent rules · Onchain payouts · Weekly cadence
          </div>
        </div>

        <div style={{position:"relative",paddingLeft:34}}>
          <div style={{
            position:"absolute",
            left:14,
            top:8,
            bottom:8,
            width:2,
            background:"linear-gradient(180deg, rgba(59,130,246,0.6), rgba(34,197,94,0.35), rgba(255,255,255,0.04))",
            borderRadius:2
          }}/>

          {[
            {
              n: "01",
              title: "Choose a Prop Firm",
              desc: "Pick from independent prop firms running on Hyperscaled. Each offers different pricing and profit splits — compare and choose what fits.",
              icon: "Transparent Rules"
            },
            {
              n: "02",
              title: "Install the Chrome Extension",
              desc: "The extension wraps around Hyperliquid, letting you trade normally while seeing your funded account progress, warnings, and fill notifications directly in the UI.",
              icon: "Trade on Hyperliquid"
            },
            {
              n: "03",
              title: "Trade & Get Funded",
              desc: "The network automatically tracks your Hyperliquid wallet and translates position sizing to your funded account. Hit 10% profit and scale up to $2.5M with weekly onchain payouts.",
              icon: "Onchain Transparency"
            }
          ].map((s, idx) => (
            <div className="howRow" key={s.n} style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16,alignItems:"start",marginBottom:14}}>
              <div style={{position:"relative"}}>
                <div style={{
                  position:"absolute",
                  left:-34,
                  top:14,
                  width:28,
                  height:28,
                  borderRadius:10,
                  background:"rgba(0,0,0,0.7)",
                  border:"1px solid rgba(255,255,255,0.10)",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center"
                }}>
                  <div style={{width:8,height:8,borderRadius:4,background: idx===2 ? "rgba(34,197,94,0.9)" : "rgba(59,130,246,0.9)"}} />
                </div>

                <div style={{
                  background:"rgba(255,255,255,0.02)",
                  border:`1px solid ${c.border}`,
                  borderRadius:14,
                  padding:16,
                  position:"relative",
                  overflow:"hidden"
                }}>
                  <div style={{
                    position:"absolute",
                    inset:0,
                    background:"radial-gradient(circle at 25% 25%, rgba(59,130,246,0.10), transparent 58%)",
                    pointerEvents:"none"
                  }}/>
                  <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                    <div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em"}}>STEP {s.n}</div>
                      <div style={{fontSize:14,fontWeight:500,marginTop:6}}>{s.title}</div>
                    </div>
                    <div style={{
                      width:40,height:40,borderRadius:14,
                      background:"rgba(255,255,255,0.03)",
                      border:"1px solid rgba(255,255,255,0.07)",
                      display:"flex",alignItems:"center",justifyContent:"center"
                    }}>
                      <FeatureIcon name={s.icon} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background:"rgba(255,255,255,0.015)",
                border:`1px solid ${c.border}`,
                borderRadius:14,
                padding:"18px 18px",
                position:"relative",
                overflow:"hidden"
              }}>
                <div style={{
                  position:"absolute",
                  top:-40,left:-40,width:180,height:180,
                  background:"radial-gradient(circle, rgba(147,51,234,0.10), transparent 60%)",
                  filter:"blur(10px)",
                  pointerEvents:"none"
                }}/>
                <div style={{position:"relative",fontSize:13,color:"rgba(255,255,255,0.40)",lineHeight:1.65,maxWidth:760}}>
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{marginTop:40,textAlign:"center"}}>
        <img
          src={photo}
          alt="How It Works Visual"
          style={{
            width: "100%",
            maxWidth: 1200,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)"
          }}
        />
      </div>

      {/* Challenge Details */}
      <section style={{padding:"60px 24px",maxWidth:1100,margin:"0 auto"}}>
        <h2 style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em",textAlign:"center",marginBottom:6}}>Challenge Details</h2>
        <p style={{textAlign:"center",fontSize:14,color:"rgba(255,255,255,0.35)",marginBottom:40}}>Everything about the evaluation</p>
        <div style={{maxWidth:600,margin:"0 auto",background:"rgba(255,255,255,0.02)",border:`1px solid ${c.border}`,borderRadius:10,overflow:"hidden"}}>
          {DETAILS.map(([k,v],i)=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"12px 20px",borderBottom:i<DETAILS.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.38)"}}>{k}</span>
              <span style={{fontSize:13,fontWeight:500,textAlign:"right"}}>{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{padding:"60px 24px 80px",maxWidth:1100,margin:"0 auto"}}>
        <h2 style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em",textAlign:"center",marginBottom:6}}>Choose Your Prop Firm</h2>
        <p style={{textAlign:"center",fontSize:14,color:"rgba(255,255,255,0.35)",marginBottom:24}}>Each firm runs independently on Hyperscaled with their own pricing and profit splits</p>

        <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:32}}>
          {TIERS.map((t,i)=>(
            <button key={t} onClick={()=>setSelectedTier(i)} style={{padding:"8px 20px",fontSize:13,borderRadius:6,cursor:"pointer",fontFamily:"'Inter',sans-serif",border:selectedTier===i?"1px solid rgba(255,255,255,0.12)":"1px solid transparent",background:selectedTier===i?"rgba(255,255,255,0.06)":"transparent",color:selectedTier===i?"#fff":"rgba(255,255,255,0.35)"}}>{t} Account</button>
          ))}
        </div>

        <div className="pricingGrid" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
          {FIRMS.map(f=>(
            <div key={f.name} style={{background:"rgba(255,255,255,0.02)",border:f.take===0?"1px solid rgba(59,130,246,0.2)":`1px solid ${c.border}`,borderRadius:10,padding:24,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
              {f.take===0&&<div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(59,130,246,0.5),transparent)"}}/>}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                {f.logoImg
                  ? <img src={f.logoImg} alt={f.name} style={{width:28,height:28,borderRadius:6,objectFit:"contain",background:`${f.color}12`,border:`1px solid ${f.color}25`,padding:3}} onError={e=>{e.target.style.display="none"}} />
                  : <div style={{width:28,height:28,borderRadius:6,background:`${f.color}12`,border:`1px solid ${f.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:f.color}}>{f.logo}</div>
                }
                <div style={{fontSize:13,fontWeight:500}}>{f.name}</div>
              </div>
              <div style={{fontSize:34,fontWeight:300,letterSpacing:"-0.03em",marginBottom:4}}>${f.prices[selectedTier]}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:16}}>{TIERS[selectedTier]} Funded Account</div>

              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20,flex:1}}>
                {[["Profit Split",`${100-f.take}%`,100-f.take===100?c.green:"#fff"],["Firm Take",`${f.take}%`,"#fff"],["Funding",fmtUSD(TIER_VALS[selectedTier]),"#fff"],["Payouts","Weekly","#fff"]].map(([l,v,cl])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:"rgba(255,255,255,0.35)"}}>{l}</span><span style={{fontWeight:500,color:cl}}>{v}</span></div>
                ))}
              </div>

              {f.slug
                ? <button onClick={()=>navTo(f.slug)} style={{padding:"10px 0",borderRadius:6,background:`${f.color}18`,color:f.color,fontSize:13,fontWeight:500,border:`1px solid ${f.color}35`,textAlign:"center",width:"100%",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>View Firm →</button>
                : <a href={f.url} target="_blank" rel="noreferrer" style={{padding:"10px 0",borderRadius:6,background:f.take===0?"#fff":"rgba(255,255,255,0.06)",color:f.take===0?"#000":"#fff",fontSize:13,fontWeight:500,border:f.take===0?"none":"1px solid rgba(255,255,255,0.08)",textAlign:"center",textDecoration:"none",display:"block"}}>{f.take===0?"Get Started →":"Select Firm"}</a>
              }
              {f.take===0&&<div style={{textAlign:"center",fontSize:10,color:c.green,marginTop:6}}>100% profit — no firm take</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  // ── DASHBOARD + LEADERBOARD (UNCHANGED FROM YOUR CURRENT FILE) ──
  // To keep this answer readable, I’m keeping these sections exactly as you had them.
  // (They appear below unchanged.)

  const DashboardPage=()=>{
    const addr = searchVal || EXAMPLE_ADDR;
    const shortAddr = addr.length > 12 ? addr.slice(0,6)+"..."+addr.slice(-4) : addr;

    const PerfTab=()=>(
      <>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
          <div style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:"20px 24px"}}>
            <div style={{fontSize:12,color:c.muted,marginBottom:4,display:"flex",justifyContent:"space-between"}}>Balance <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,color:c.green,background:"rgba(34,197,94,0.1)"}}>+0.16%</span></div>
            <div style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em"}}>$100,163.38</div>
          </div>
          <div style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:"20px 24px"}}>
            <div style={{fontSize:12,color:c.muted,marginBottom:4,display:"flex",justifyContent:"space-between"}}>Profit Target <span style={{fontSize:11,padding:"2px 6px",borderRadius:4,color:c.blue,background:"rgba(59,130,246,0.12)"}}>$10,000</span></div>
            <div style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em"}}>$163.38</div>
          </div>
          <div style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:"20px 24px"}}>
            <div style={{fontSize:12,color:c.muted,marginBottom:4}}>Open PnL</div>
            <div style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em",color:c.green}}>+$56.51</div>
          </div>
        </div>

        <div style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:24,marginBottom:24}}>
          <div style={{fontSize:13,color:c.muted,textTransform:"uppercase",letterSpacing:"0.02em",marginBottom:16}}>Evaluation Progress</div>
          <div style={{background:"rgba(255,255,255,0.015)",border:`1px solid ${c.border}`,borderRadius:8,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8}}>
              <h3 style={{fontSize:14,fontWeight:400,color:c.dim}}>Account Progress</h3>
              <div style={{display:"flex",gap:16,fontSize:11,color:c.muted}}>
                <span>Max Leverage: <strong style={{color:c.dim,fontWeight:500}}>1.25x</strong></span>
                <span>Trailing Drawdown: <strong style={{color:c.dim,fontWeight:500}}>5% — HWM</strong></span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24,marginBottom:20}}>
              <div>
                <div style={{fontSize:12,color:c.muted,marginBottom:4,display:"flex",justifyContent:"space-between"}}>Profit Target <span>10%</span></div>
                <div style={{fontSize:20,fontWeight:400,letterSpacing:"-0.02em",color:c.green,marginBottom:8}}>$163.38 <span style={{fontSize:13,color:c.muted}}>/ $10,000</span></div>
                <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}><div style={{width:"1.6%",height:"100%",background:c.green,borderRadius:3}}/></div>
                <div style={{fontSize:10,color:c.muted,marginTop:4}}>1.6% of target</div>
              </div>
              <div>
                <div style={{fontSize:12,color:c.muted,marginBottom:4,display:"flex",justifyContent:"space-between"}}>Trailing Drawdown <span>HWM: $100,163.38</span></div>
                <div style={{fontSize:20,fontWeight:400,letterSpacing:"-0.02em",marginBottom:8}}>0.00% <span style={{fontSize:13,color:c.muted}}>/ 5.00%</span></div>
                <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}><div style={{width:"0%",height:"100%",background:c.blue,borderRadius:3}}/></div>
                <div style={{fontSize:10,color:c.muted,marginTop:4}}>$0.00 / $5,008.17 max loss</div>
              </div>
              <div>
                <div style={{fontSize:12,color:c.muted,marginBottom:4}}>Days Remaining</div>
                <div style={{fontSize:20,fontWeight:400,letterSpacing:"-0.02em",marginBottom:8}}>∞</div>
                <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}><div style={{width:"100%",height:"100%",background:c.blue,borderRadius:3}}/></div>
                <div style={{fontSize:10,color:c.muted,marginTop:4}}>Unlimited trading period</div>
              </div>
            </div>
            <div style={{height:4,background:"rgba(255,255,255,0.04)",borderRadius:2,overflow:"hidden"}}><div style={{width:"1.6%",height:"100%",background:"linear-gradient(90deg,#3b82f6,#22c55e)",borderRadius:2}}/></div>
          </div>
        </div>

        <div style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:24,marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:13,color:c.muted,textTransform:"uppercase",letterSpacing:"0.02em"}}>Performance</div>
            <div style={{display:"flex",gap:4}}>
              {["1D","1W","1M","All"].map((t,i)=><button key={t} style={{padding:"6px 12px",fontSize:12,borderRadius:4,cursor:"pointer",fontFamily:"'Inter',sans-serif",color:i===0?c.text:c.muted,background:i===0?"rgba(255,255,255,0.06)":"transparent",border:i===0?`1px solid ${c.border}`:"1px solid transparent"}}>{t}</button>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,paddingBottom:16,borderBottom:`1px solid ${c.border}`,marginBottom:16}}>
            {[["Total Trades","12","8 closed · 4 open",null],["Win Rate","67%","8W / 4L",c.green],["Avg Trade PnL","+$13.61","$163.38 total",c.green],["Avg Duration","4h 12m","Longest: 12h 05m",null]].map(([l,v,s,cl],i)=>(
              <div key={i}><div style={{fontSize:11,color:c.muted,marginBottom:2}}>{l}</div><div style={{fontSize:18,fontWeight:400,letterSpacing:"-0.02em",color:cl||"#fff"}}>{v}</div><div style={{fontSize:10,color:c.muted,marginTop:2}}>{s}</div></div>
            ))}
          </div>
          <div style={{height:220,background:"rgba(255,255,255,0.01)",border:`1px solid ${c.border}`,borderRadius:6,position:"relative",overflow:"hidden"}}>
            <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{width:"100%",height:"100%",position:"absolute",bottom:0}}>
              <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(59,130,246,0.15)"/><stop offset="100%" stopColor="rgba(59,130,246,0)"/></linearGradient></defs>
              <path d="M0,180 C50,175 100,170 150,160 C200,150 250,155 300,140 C350,125 400,100 450,110 C500,120 550,90 600,70 C650,50 700,60 750,40 L800,30 L800,200 L0,200 Z" fill="url(#cg)"/>
              <path d="M0,180 C50,175 100,170 150,160 C200,150 250,155 300,140 C350,125 400,100 450,110 C500,120 550,90 600,70 C650,50 700,60 750,40 L800,30" fill="none" stroke="rgba(59,130,246,0.6)" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        <div style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:24}}>
          <div style={{display:"flex",gap:0,borderBottom:`1px solid ${c.border}`,marginBottom:0}}>
            {["open","history","orders"].map(t=>(
              <button key={t} onClick={()=>setTradeTab(t)} style={{padding:"12px 20px",fontSize:13,color:tradeTab===t?c.text:c.muted,cursor:"pointer",borderBottom:tradeTab===t?`2px solid ${c.blue}`:"2px solid transparent",fontFamily:"'Inter',sans-serif",background:"none",borderTop:"none",borderLeft:"none",borderRight:"none"}}>
                {t==="open"?"Open Positions":t==="history"?"Trade History":"Orders"}
              </button>
            ))}
          </div>

          {tradeTab==="open"&&(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
                <thead><tr>{["Symbol","Side","Size","Position Value","Entry","Mark","Liq. Price","uPnL","TP / SL","Time",""].map(h=><th key={h} style={{fontSize:11,color:c.muted,fontWeight:400,textAlign:"left",padding:"12px 16px",borderBottom:`1px solid ${c.border}`,textTransform:"uppercase",letterSpacing:"0.04em"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {[["BTC-PERP","LONG","0.025","$2,429.61","$96,412.50","$97,184.20","$91,280.00","+$19.29","$99,500 / $95,200","2h ago"],
                    ["ETH-PERP","LONG","0.85","$2,305.88","$2,684.30","$2,712.80","$2,480.00","+$24.22","$2,850 / $2,620","5h ago"],
                    ["SOL-PERP","SHORT","12.5","$1,828.75","$148.62","$146.30","$162.40","+$29.00","$138.00 / $153.50","8h ago"],
                    ["DOGE-PERP","LONG","5,000","$1,243.00","$0.2518","$0.2486","$0.2180","-$16.00","$0.2700 / $0.2400","12h ago"]
                  ].map((r,i)=>(
                    <tr key={i}>
                      <td style={{fontSize:13,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)",fontWeight:500}}>{r[0]}</td>
                      <td style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{color:r[1]==="LONG"?c.green:c.red,background:r[1]==="LONG"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:500}}>{r[1]}</span></td>
                      {r.slice(2,7).map((v,j)=><td key={j} style={{fontSize:13,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{v}</td>)}
                      <td style={{fontSize:13,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:r[7].startsWith("+")?c.green:c.red}}>{r[7]}</td>
                      <td style={{fontSize:13,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{r[8]}</td>
                      <td style={{fontSize:13,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:c.muted}}>{r[9]}</td>
                      <td style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><button style={{padding:"4px 10px",fontSize:11,background:"transparent",color:c.muted,border:`1px solid ${c.border}`,borderRadius:4,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Close</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tradeTab==="history"&&<div style={{padding:"40px 16px",textAlign:"center",color:c.muted,fontSize:13}}>Trade history will appear here once positions are closed.</div>}
          {tradeTab==="orders"&&<div style={{padding:"40px 16px",textAlign:"center",color:c.muted,fontSize:13}}>No pending orders.</div>}

          <div style={{marginTop:12,padding:"12px 16px",background:"rgba(255,255,255,0.015)",border:`1px solid ${c.border}`,borderRadius:6,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:11,color:c.muted,whiteSpace:"nowrap"}}>Margin Used</span>
            <div style={{flex:1,height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}><div style={{width:"6.2%",height:"100%",background:c.blue,borderRadius:3}}/></div>
            <span style={{fontSize:12,fontWeight:500,whiteSpace:"nowrap"}}>6.2% <span style={{color:c.muted,fontWeight:400}}>of $125,000</span></span>
          </div>
        </div>
      </>
    );

    const PayoutsTab=()=>(
      <div style={{width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",background:"rgba(59,130,246,0.04)",border:"1px solid rgba(59,130,246,0.12)",borderRadius:8,marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <div>
              <div style={{fontSize:11,color:c.muted,marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
                Payout Wallet
                <span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"rgba(59,130,246,0.15)",color:c.blue,border:"1px solid rgba(59,130,246,0.2)",fontWeight:600}}>BASE</span>
                <span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"rgba(34,197,94,0.1)",color:c.green,border:"1px solid rgba(34,197,94,0.2)",fontWeight:600}}>USDC</span>
              </div>
              <div style={{fontSize:13,fontFamily:"monospace",color:c.text}}>0x4f2E...8c3A91dB72f1</div>
            </div>
          </div>
          <button style={{padding:"6px 14px",fontSize:11,borderRadius:5,background:"rgba(255,255,255,0.04)",border:`1px solid ${c.border}`,color:c.muted,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Copy Address</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
          {[["Total Paid Out","$12,480.00","Lifetime earnings",c.green],["Payouts Received","5","All confirmed on Base",null],["Last Payout","$3,200.00","Feb 14, 2025",null]].map(([l,v,s,cl],i)=>(
            <div key={i} style={{padding:"16px 20px",background:"rgba(255,255,255,0.015)",border:`1px solid ${c.border}`,borderRadius:8}}>
              <div style={{fontSize:11,color:c.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>{l}</div>
              <div style={{fontSize:22,fontWeight:400,letterSpacing:"-0.02em",color:cl||"#fff"}}>{v}</div>
              <div style={{fontSize:10,color:c.muted,marginTop:2}}>{s}</div>
            </div>
          ))}
        </div>

        <div style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:24}}>
          <div style={{fontSize:13,color:c.muted,textTransform:"uppercase",letterSpacing:"0.02em",marginBottom:16}}>Payout History</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["#","Date","Amount","Token","Network","Tx Hash","Status"].map(h=><th key={h} style={{fontSize:11,color:c.muted,fontWeight:400,textAlign:"left",padding:"12px 16px",borderBottom:`1px solid ${c.border}`,textTransform:"uppercase",letterSpacing:"0.04em"}}>{h}</th>)}</tr></thead>
              <tbody>
                {[["5","Feb 14, 2025","$3,200.00","0xa1b2c3...f0a1b2"],["4","Jan 28, 2025","$2,850.00","0xd4e5f6...c3d4e5"],["3","Jan 12, 2025","$2,430.00","0xf7a8b9...e6f7a8"],["2","Dec 30, 2024","$2,100.00","0x1a2b3c...f1a2b3"],["1","Dec 15, 2024","$1,900.00","0x8b9c0d...a8b9c0"]].map((r,i)=>(
                  <tr key={i}>
                    <td style={{fontSize:13,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:c.muted}}>{r[0]}</td>
                    <td style={{fontSize:13,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{r[1]}</td>
                    <td style={{fontSize:13,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)",fontWeight:500,color:c.green}}>{r[2]}</td>
                    <td style={{fontSize:13,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
                        <span style={{width:16,height:16,borderRadius:"50%",background:"rgba(59,130,246,0.15)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:c.blue,border:"1px solid rgba(59,130,246,0.2)"}}>$</span> USDC
                      </span>
                    </td>
                    <td style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(168,85,247,0.1)",color:c.purple,border:"1px solid rgba(168,85,247,0.15)"}}>Base</span></td>
                    <td style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                      <a href="https://basescan.org" target="_blank" rel="noreferrer" style={{fontFamily:"monospace",fontSize:12,color:c.blue,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
                        {r[3]}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    </td>
                    <td style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{fontSize:10,padding:"3px 8px",borderRadius:4,fontWeight:500,color:c.green,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)"}}>Confirmed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    return (
      <div style={{maxWidth:1280,margin:"0 auto",padding:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",background:"linear-gradient(135deg,rgba(59,130,246,0.06),rgba(168,85,247,0.06))",border:"1px solid rgba(59,130,246,0.12)",borderRadius:8,marginBottom:24,flexWrap:"wrap",gap:12,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(59,130,246,0.4),rgba(168,85,247,0.4),transparent)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:34,height:34,borderRadius:8,background:"linear-gradient(135deg,rgba(59,130,246,0.12),rgba(168,85,247,0.12))",border:"1px solid rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <div><div style={{fontSize:13,fontWeight:500}}>Complete KYC to unlock payouts</div><div style={{fontSize:11,color:c.muted}}>Permissionless identity verification — no personal data stored on-chain. Takes ~2 minutes.</div></div>
          </div>
          <a href="https://hyperscaled.trade/kyc" target="_blank" rel="noreferrer" style={{padding:"8px 20px",fontSize:12,fontWeight:500,borderRadius:6,background:"linear-gradient(135deg,#3b82f6,#7c3aed)",color:"#fff",border:"none",textDecoration:"none",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
            Verify Identity
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16,marginBottom:24}}>
          <div>
            <h2 style={{fontSize:24,fontWeight:400,letterSpacing:"-0.03em",marginBottom:8}}>CRYPTO 100K</h2>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              <span style={{fontSize:11,padding:"4px 10px",borderRadius:100,fontWeight:500,background:"rgba(59,130,246,0.15)",color:c.blue,border:"1px solid rgba(59,130,246,0.2)"}}>Tier III</span>
              <span style={{fontSize:11,padding:"4px 10px",borderRadius:100,fontWeight:500,background:"rgba(34,197,94,0.1)",color:c.green,border:"1px solid rgba(34,197,94,0.2)"}}>Evaluation</span>
              <span style={{fontSize:11,padding:"4px 10px",borderRadius:100,fontWeight:500,background:"rgba(234,179,8,0.1)",color:c.yellow,border:"1px solid rgba(234,179,8,0.2)"}}>1.25x Leverage</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:12,fontFamily:"monospace",color:c.muted,background:"rgba(255,255,255,0.04)",border:`1px solid ${c.border}`,padding:"6px 12px",borderRadius:6}}>{shortAddr}</div>
          </div>
        </div>

        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${c.border}`,marginBottom:24}}>
          {["performance","payouts"].map(t=>(
            <button key={t} onClick={()=>setDashTab(t)} style={{padding:"12px 20px",fontSize:13,color:dashTab===t?c.text:c.muted,cursor:"pointer",borderBottom:dashTab===t?`2px solid ${c.blue}`:"2px solid transparent",fontFamily:"'Inter',sans-serif",background:"none",borderTop:"none",borderLeft:"none",borderRight:"none",textTransform:"capitalize"}}>
              {t}
            </button>
          ))}
        </div>

        <div style={{display:dashTab==="performance"?"block":"none"}}><PerfTab/></div>
        <div style={{display:dashTab==="payouts"?"block":"none"}}><PayoutsTab/></div>
      </div>
    );
  };

  const Leaderboard=()=>{
    const funded=LB.filter(t=>t.status==="Funded");
    const challenge=LB.filter(t=>t.status==="Challenge");
    return (
      <div style={{maxWidth:1200,margin:"0 auto",padding:24}}>
        <h2 style={{fontSize:24,fontWeight:400,letterSpacing:"-0.03em",marginBottom:24}}>Leaderboard</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:32}}>
          {[["Total Paid Out","$30M+",c.green],["Traders","4,200+","#fff"],["Funded","310",c.blue],["In Challenge","2,840",c.yellow],["Eliminated","1,050",c.red],["Volume","$482M+","#fff"]].map(([l,v,cl],i)=>(
            <div key={i} style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 16px"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.04em"}}>{l}</div>
              <div style={{fontSize:20,fontWeight:400,letterSpacing:"-0.02em",color:cl}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:24,marginBottom:24}}>
          <div style={{fontSize:13,color:c.muted,textTransform:"uppercase",letterSpacing:"0.02em",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>Funded Traders <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(59,130,246,0.1)",color:c.blue}}>{funded.length}</span></div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:1000}}>
              <thead><tr>{["#","Address","PnL","Funding","Sharpe","Promos","Trades","Win%","Payouts","Since"].map(h=><th key={h} style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontWeight:400,textAlign:"left",padding:"8px 10px",borderBottom:`1px solid ${c.border}`,textTransform:"uppercase",letterSpacing:"0.04em"}}>{h}</th>)}</tr></thead>
              <tbody>{funded.map((t,i)=>(
                <tr key={i} style={{cursor:"pointer"}} onClick={()=>{setSearchVal(t.addr);navTo("dashboard")}}>
                  <td style={{fontSize:12,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.3)"}}>{i+1}</td>
                  <td style={{fontSize:12,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",fontFamily:"monospace",color:c.blue}}>{t.addr}</td>
                  <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:t.pnl>=0?c.green:c.red,fontWeight:500}}>{t.pnl>=0?"+":""}${fmt(t.pnl)}</td>
                  <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{fmtUSD(t.funding)}</td>
                  <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{t.sharpe.toFixed(2)}</td>
                  <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{t.promotions}x</td>
                  <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{fmt(t.trades)}</td>
                  <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:t.winRate>=60?c.green:"#fff"}}>{t.winRate}%</td>
                  <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:c.green}}>{fmtUSD(t.payouts)}</td>
                  <td style={{fontSize:12,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.3)"}}>{t.registered}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <div style={{background:c.card,border:`1px solid ${c.border}`,borderRadius:8,padding:24}}>
          <div style={{fontSize:13,color:c.muted,textTransform:"uppercase",letterSpacing:"0.02em",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>In Challenge <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(234,179,8,0.1)",color:c.yellow}}>{challenge.length}</span></div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:800}}>
              <thead><tr>{["Address","PnL","Progress","Sharpe","Trades","Win%","Drawdown","Since"].map(h=><th key={h} style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontWeight:400,textAlign:"left",padding:"8px 10px",borderBottom:`1px solid ${c.border}`,textTransform:"uppercase",letterSpacing:"0.04em"}}>{h}</th>)}</tr></thead>
              <tbody>{challenge.map((t,i)=>{
                const pct=Math.max(0,(t.pnl/TIER_VALS[0]*10)*100);
                return (
                  <tr key={i} style={{cursor:"pointer"}} onClick={()=>{setSearchVal(t.addr);navTo("dashboard")}}>
                    <td style={{fontSize:12,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",fontFamily:"monospace",color:c.yellow}}>{t.addr}</td>
                    <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:t.pnl>=0?c.green:c.red,fontWeight:500}}>{t.pnl>=0?"+":""}${fmt(t.pnl)}</td>
                    <td style={{padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{flex:1,maxWidth:80,height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}><div style={{width:`${Math.min(100,pct)}%`,height:"100%",background:t.pnl>=0?c.green:c.red,borderRadius:2}}/></div>
                        <span style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{t.sharpe.toFixed(2)}</td>
                    <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{fmt(t.trades)}</td>
                    <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:t.winRate>=60?c.green:"#fff"}}>{t.winRate}%</td>
                    <td style={{fontSize:13,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{t.pnl<0?`${((Math.abs(t.pnl)/TIER_VALS[0])*100).toFixed(1)}%`:"0.0%"}</td>
                    <td style={{fontSize:12,padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.3)"}}>{t.registered}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── GENERIC FIRM PAGE ──
  const FirmPage=({firm})=>{
    const [fTier,setFTier]=useState(1);
    const C1=firm.color, C2=firm.color2;
    // hex→rgb helper for rgba()
    const hexRgb=(h)=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`${r},${g},${b}`};
    const cr=hexRgb(C1);
    const split=100-firm.take;
    const scalingByTier=["up to $500K","up to $1M","up to $2.5M"];
    const FDETAILS=[
      ["Challenge Structure","One Step"],["Order Books","Hyperliquid"],["Pairs","BTC, ETH, SOL, DOGE, XRP, ADA"],
      ["Profit Target","10%"],["Max Drawdown","5% Challenge / 10% Funded"],["Profit Split",`${split}%`],
      ["Account Scaling",scalingByTier[2]],["Markets","Crypto Perpetuals"],["News Trading","Allowed"],
      ["Weekend Trading","Allowed"],["Infrastructure","Open Source, Decentralized"],["Permissionless","Yes"],
      ["Payouts","Weekly, Onchain"],["Eval Leverage","1.25x"],["Funded Leverage","5x"],
    ];
    const COMPARE=[
      ["Evaluation Steps","One Step","Two Steps","Two Steps"],
      ["Profit Split",`${split}%`,"Up to 90%","70–80%"],
      ["Account Scaling","Up to $2.5M","Up to $400K","Up to $200K"],
      ["Payout Frequency","Weekly","Monthly","Monthly"],
      ["Payout Verification","Onchain","Centralized","Centralized"],
      ["News Trading","Allowed","Restricted","Restricted"],
      ["Weekend Trading","Allowed","Restricted","Restricted"],
      ["Infrastructure","Decentralized","Centralized","Centralized"],
      ["Entry Price ($25K)",`$${firm.prices[0]}`,"~$155","~$100–200"],
    ];
    const PERKS=[
      [`$25,000 funded account`,`${split}% profit split`,"Scale up to $500K","Weekly USDC payouts","Onchain verification"],
      [`$50,000 funded account`,`${split}% profit split`,"Scale up to $1M","Weekly USDC payouts","Onchain verification"],
      [`$100,000 funded account`,`${split}% profit split`,"Scale up to $2.5M","Weekly USDC payouts","Onchain verification"],
    ];
    const FEATURES=[
      {title:"One-Step Evaluation",desc:`Hit 10% profit on Hyperliquid while staying within drawdown rules. That's it — you're funded with ${firm.name}. No multi-phase grind.`},
      {title:"Scale Your Capital",desc:`Start with $25K, $50K, or $100K. Consistent performance unlocks capital increases — ${firm.name}'s $100K tier scales up to $2.5M.`},
      {title:"Onchain Payouts",desc:"Every payout is recorded on-chain and sent directly to your wallet as USDC. No withdrawal queues, no discretionary holds."},
      {title:"Weekly Payouts",desc:`Don't wait a month. ${firm.name} pays out every week via the Hyperscaled network, giving you real-time access to your earnings.`},
      {title:"No Time Limits",desc:"The evaluation has no expiry. Take the time you need to trade your strategy without pressure from an arbitrary deadline."},
      {title:"Transparent Rules",desc:"All evaluation rules are defined on-chain. No discretionary resets, no grey areas — just clear rules you can verify yourself."},
    ];
    return (
      <div>
        {/* HERO */}
        <section style={{padding:"64px 24px 48px",maxWidth:1100,margin:"0 auto"}}>
          <div className="zHeroRow" style={{display:"flex",alignItems:"center",gap:40}}>
            <div style={{flex:"0 0 560px",minWidth:0,paddingLeft:75,animation:"zFadeUp 0.6s ease both"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px",borderRadius:100,background:`rgba(${cr},0.07)`,border:`1px solid rgba(${cr},0.14)`,marginBottom:20}}>
                {firm.logoImg
                  ? <img src={firm.logoImg} alt={firm.name} style={{width:16,height:16,borderRadius:3,objectFit:"contain",flexShrink:0}} onError={e=>{e.target.style.display="none"}} />
                  : <div style={{width:16,height:16,borderRadius:4,background:`linear-gradient(135deg,${C1},${C2})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:8,color:"#fff",flexShrink:0}}>{firm.logo}</div>
                }
                <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500}}>{firm.name} · Built on Hyperliquid · Powered by Bittensor</span>
              </div>
              <h1 style={{fontSize:54,fontWeight:300,letterSpacing:"-0.04em",lineHeight:1.07,margin:"0 0 20px"}}>
                Trade With Capital.<br/>Keep What You{" "}
                <span style={{background:`linear-gradient(135deg,${C1},${C2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:500}}>Earn.</span>
              </h1>
              <p style={{fontSize:15,color:"rgba(255,255,255,0.42)",lineHeight:1.72,marginBottom:30,maxWidth:460}}>
                {firm.name} is a decentralized prop firm on the Hyperscaled network. Funded accounts from $25K to $2.5M. Weekly onchain payouts. One-step evaluation. No hidden rules.
              </p>
              <div style={{display:"flex",gap:12,marginBottom:40}}>
                <button onClick={()=>document.getElementById("f-pricing")?.scrollIntoView({behavior:"smooth"})} style={{padding:"12px 28px",borderRadius:8,background:`linear-gradient(135deg,${C1},${C2})`,color:"#fff",fontSize:14,fontWeight:500,border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Start Challenge →</button>
              </div>
              <div style={{display:"flex",gap:32}}>
                {[[`$${firm.prices[0]}`,"Entry Price — $25K Account"],[`${split}%`,"Profit Split"],["$2.5M","Max Funding ($100K tier)"]].map(([v,l],i)=>(
                  <div key={i}>
                    <div style={{fontSize:22,fontWeight:400,letterSpacing:"-0.02em",color:i===0?C1:"#fff"}}>{v}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:3}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{flexShrink:0,animation:"zFadeUp 0.7s 0.1s ease both",opacity:0,animationFillMode:"forwards"}}>
              <ChromeExtUI/>
            </div>
          </div>
        </section>

        {/* STATS BAND */}
        <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",borderBottom:"1px solid rgba(255,255,255,0.06)",background:`rgba(${cr},0.02)`,padding:"24px"}}>
          <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:16}}>
            {[["4,200+","Traders Across Network"],["$482M+","Total Network Volume"],["$30M+","Paid Out via Network"],["Weekly","Onchain Payout Cadence"],["Unlimited","Evaluation Period"]].map(([v,l],i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:400,letterSpacing:"-0.02em",color:i===2?C1:"#fff"}}>{v}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",marginTop:3}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section style={{padding:"80px 24px 56px",maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Why {firm.name}</div>
            <h2 style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em",margin:"0 0 8px"}}>Built for Serious Traders</h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.36)",maxWidth:480,margin:"0 auto"}}>Straightforward rules, onchain transparency, and {split}% of everything you make.</p>
          </div>
          <div className="zFeatureGrid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {FEATURES.map((f,i)=>{
              const icons=[
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 10V3h-7"/></svg>,
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 7v10l9 5 9-5V7"/><path d="M12 12v10"/></svg>,
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
              ];
              return(
                <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"20px",position:"relative",overflow:"hidden",cursor:"default"}}>
                  <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 15% 15%,rgba(${cr},0.05),transparent 55%)`,pointerEvents:"none"}}/>
                  <div style={{position:"relative"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`rgba(${cr},0.07)`,border:`1px solid rgba(${cr},0.12)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>{icons[i]}</div>
                    <div style={{fontSize:14,fontWeight:500,marginBottom:7}}>{f.title}</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.38)",lineHeight:1.65}}>{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{padding:"56px 24px",maxWidth:1100,margin:"0 auto"}}>
          <h2 style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em",marginBottom:6}}>How It Works</h2>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.35)",margin:"0 0 32px"}}>Three steps from signup to funded.</p>
          <div className="zStepsGrid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {[
              {n:"01",tag:"One-time payment",title:"Choose Your Account Size",desc:`Select from $25K, $50K, or $100K funded accounts. Pay the one-time ${firm.name} challenge fee and start trading immediately on Hyperliquid. No waiting period.`},
              {n:"02",tag:"10% profit target",title:"Pass the Evaluation",desc:"Hit 10% profit while keeping drawdown below 5%. Trade at up to 1.25x leverage across BTC, ETH, SOL and more — news and weekend trading are both allowed."},
              {n:"03",tag:"Weekly USDC payouts",title:"Get Funded & Paid Weekly",desc:`Once funded, trade with up to 5x leverage. The network tracks your Hyperliquid wallet and sends ${split}% of profits to you as USDC every week, onchain.`},
            ].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"22px 20px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 0% 0%,rgba(${cr},0.06),transparent 60%)`,pointerEvents:"none"}}/>
                <div style={{position:"relative"}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em",marginBottom:12}}>STEP {s.n}</div>
                  <div style={{display:"inline-block",fontSize:10,padding:"3px 10px",borderRadius:100,background:`rgba(${cr},0.08)`,border:`1px solid rgba(${cr},0.15)`,color:C1,fontWeight:500,marginBottom:12}}>{s.tag}</div>
                  <div style={{fontSize:15,fontWeight:500,letterSpacing:"-0.02em",marginBottom:10}}>{s.title}</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.7}}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:36,textAlign:"center"}}>
            <img src={photo} alt="Hyperliquid trading platform" style={{width:"100%",maxWidth:1100,borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",boxShadow:"0 40px 80px rgba(0,0,0,0.6)"}}/>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:10}}>Trade on Hyperliquid — the leading decentralized perpetuals exchange.</p>
          </div>
        </section>

        {/* CHALLENGE DETAILS */}
        <section style={{padding:"56px 24px",maxWidth:1100,margin:"0 auto"}}>
          <h2 style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em",textAlign:"center",marginBottom:6}}>Challenge Details</h2>
          <p style={{textAlign:"center",fontSize:14,color:"rgba(255,255,255,0.35)",marginBottom:36}}>Everything about the {firm.name} evaluation</p>
          <div style={{maxWidth:600,margin:"0 auto",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
            <div style={{height:2,background:`linear-gradient(90deg,transparent,${C1},${C2},transparent)`}}/>
            {FDETAILS.map(([k,v],i)=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"12px 20px",borderBottom:i<FDETAILS.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.38)"}}>{k}</span>
                <span style={{fontSize:13,fontWeight:500,textAlign:"right",color:k==="Profit Split"?C1:"#fff"}}>{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="f-pricing" style={{padding:"56px 24px",maxWidth:1100,margin:"0 auto"}}>
          <h2 style={{fontSize:28,fontWeight:400,letterSpacing:"-0.03em",textAlign:"center",marginBottom:6}}>Simple, Transparent Pricing</h2>
          <p style={{textAlign:"center",fontSize:14,color:"rgba(255,255,255,0.35)",marginBottom:24}}>One-time fee to start your evaluation. No subscriptions, no hidden charges.</p>
          <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:32}}>
            {TIERS.map((t,i)=>(
              <button key={t} onClick={()=>setFTier(i)} style={{padding:"8px 20px",fontSize:13,borderRadius:6,cursor:"pointer",fontFamily:"'Inter',sans-serif",border:fTier===i?`1px solid rgba(${cr},0.3)`:"1px solid transparent",background:fTier===i?`rgba(${cr},0.08)`:"transparent",color:fTier===i?C1:"rgba(255,255,255,0.35)",fontWeight:fTier===i?500:400,transition:"all 0.15s"}}>{t} Account</button>
            ))}
          </div>
          <div className="zPricingGrid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:860,margin:"0 auto"}}>
            {[{label:"Starter",tier:0},{label:"Standard",tier:1,highlight:true},{label:"Pro",tier:2}].map(({label,tier,highlight})=>(
              <div key={label} style={{background:highlight?`rgba(${cr},0.04)`:"rgba(255,255,255,0.02)",border:highlight?`1px solid rgba(${cr},0.22)`:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"26px 22px",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
                {highlight&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${C1},${C2},transparent)`}}/>}
                {highlight&&<div style={{position:"absolute",top:14,right:14,fontSize:9,padding:"3px 9px",borderRadius:100,background:`rgba(${cr},0.12)`,color:C1,border:`1px solid rgba(${cr},0.2)`,fontWeight:600,letterSpacing:"0.04em"}}>MOST POPULAR</div>}
                <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:5}}>{label}</div>
                <div style={{fontSize:38,fontWeight:300,letterSpacing:"-0.04em",marginBottom:2,color:highlight?C1:"#fff"}}>${firm.prices[tier]}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:20}}>{TIERS[tier]} Funded Account · One-time fee</div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:9,marginBottom:22}}>
                  {PERKS[tier].map((p,j)=>(
                    <div key={j} style={{display:"flex",alignItems:"center",gap:9,fontSize:13}}>
                      <span style={{width:14,height:14,borderRadius:"50%",background:`rgba(${cr},0.1)`,border:`1px solid rgba(${cr},0.2)`,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={C1} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </span>
                      <span style={{color:"rgba(255,255,255,0.6)"}}>{p}</span>
                    </div>
                  ))}
                </div>
                <button style={{padding:"11px 0",borderRadius:7,background:highlight?`linear-gradient(135deg,${C1},${C2})`:"rgba(255,255,255,0.06)",color:"#fff",fontSize:13,fontWeight:500,border:highlight?"none":"1px solid rgba(255,255,255,0.08)",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  {highlight?"Start Challenge →":"Select Tier"}
                </button>
              </div>
            ))}
          </div>
          <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.18)",marginTop:16}}>Challenge fee is non-refundable. {split}% profit split on all funded tiers. {firm.name} runs on the Hyperscaled network.</p>
        </section>


        {/* BOTTOM CTA */}
        <section style={{padding:"40px 24px 72px",maxWidth:1100,margin:"0 auto",textAlign:"center"}}>
          <div style={{background:`rgba(${cr},0.04)`,border:`1px solid rgba(${cr},0.12)`,borderRadius:16,padding:"52px 40px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${C1},${C2},transparent)`}}/>
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 0%,rgba(${cr},0.07),transparent 60%)`,pointerEvents:"none"}}/>
            <div style={{position:"relative"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>Ready to Trade?</div>
              <h2 style={{fontSize:34,fontWeight:300,letterSpacing:"-0.03em",marginBottom:14}}>
                Start Your {firm.name} Challenge<br/>
                <span style={{background:`linear-gradient(135deg,${C1},${C2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:500}}>from ${firm.prices[0]}.</span>
              </h2>
              <p style={{fontSize:15,color:"rgba(255,255,255,0.38)",marginBottom:30,maxWidth:460,margin:"0 auto 30px"}}>
                One-step evaluation. {split}% profit split. Weekly onchain payouts. No arbitrary limits.
              </p>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={()=>document.getElementById("f-pricing")?.scrollIntoView({behavior:"smooth"})} style={{padding:"13px 34px",borderRadius:8,background:`linear-gradient(135deg,${C1},${C2})`,color:"#fff",fontSize:14,fontWeight:500,border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Get Funded →</button>
                <button onClick={()=>navTo("home")} style={{padding:"13px 34px",borderRadius:8,background:"transparent",color:"#fff",fontSize:14,fontWeight:500,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>View All Firms</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div style={{background:"#000",color:"#fff",fontFamily:"'Inter',system-ui,sans-serif",minHeight:"100vh",WebkitFontSmoothing:"antialiased"}}>
      <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
        {activeFirm
          ? (()=>{
              const [r,g,b]=(()=>{const h=activeFirm.color;return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]})();
              return <>
                <div style={{position:"absolute",width:"200%",height:"200%",top:"-50%",left:"-50%",filter:"blur(80px)",background:`radial-gradient(circle at 40% 40%,rgba(${r},${g},${b},0.13),rgba(${r},${g},${b},0.06) 30%,transparent 55%)`,animation:"lm1 22s ease-in-out infinite"}}/>
                <div style={{position:"absolute",width:"200%",height:"200%",top:"-50%",left:"-50%",filter:"blur(80px)",background:`radial-gradient(circle at 65% 55%,rgba(${r},${g},${b},0.08),rgba(${r},${g},${b},0.03) 25%,transparent 50%)`,animation:"lm2 28s ease-in-out infinite"}}/>
                <div style={{position:"absolute",width:"200%",height:"200%",top:"-50%",left:"-50%",filter:"blur(80px)",background:`radial-gradient(circle at 50% 50%,rgba(${r},${g},${b},0.05),rgba(${r},${g},${b},0.02) 25%,transparent 55%)`,animation:"lm3 34s ease-in-out infinite"}}/>
              </>;
            })()
          : <>
              <div style={{position:"absolute",width:"200%",height:"200%",top:"-50%",left:"-50%",filter:"blur(80px)",background:"radial-gradient(circle at 40% 40%,rgba(59,130,246,0.15),rgba(37,99,235,0.08) 30%,transparent 55%)",animation:"lm1 20s ease-in-out infinite"}}/>
              <div style={{position:"absolute",width:"200%",height:"200%",top:"-50%",left:"-50%",filter:"blur(80px)",background:"radial-gradient(circle at 65% 55%,rgba(147,51,234,0.10),rgba(126,34,206,0.06) 25%,transparent 50%)",animation:"lm2 25s ease-in-out infinite"}}/>
              <div style={{position:"absolute",width:"200%",height:"200%",top:"-50%",left:"-50%",filter:"blur(80px)",background:"radial-gradient(circle at 50% 50%,rgba(6,182,212,0.08),rgba(14,165,233,0.05) 25%,transparent 55%)",animation:"lm3 30s ease-in-out infinite"}}/>
            </>
        }
      </div>

      <style>{`
        @keyframes lm1{0%,100%{transform:translate(0,0) rotate(0)}33%{transform:translate(25%,-20%) rotate(120deg)}66%{transform:translate(-20%,25%) rotate(240deg)}}
        @keyframes lm2{0%,100%{transform:translate(0,0) rotate(0) scale(1.2)}33%{transform:translate(-25%,20%) rotate(-120deg) scale(1)}66%{transform:translate(20%,-25%) rotate(-240deg) scale(1.2)}}
        @keyframes lm3{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(20%,25%) rotate(90deg) scale(1.15)}66%{transform:translate(-25%,-20%) rotate(180deg) scale(1)}}
        input::placeholder{color:rgba(255,255,255,0.2)}
        table tr:hover td{background:rgba(255,255,255,0.015)!important}
        @keyframes zFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .z-feature-card:hover{border-color:rgba(239,68,68,0.18)!important;background:rgba(239,68,68,0.035)!important}
.z-tier-btn:hover{background:rgba(239,68,68,0.08)!important}
        .z-btn-ghost:hover{background:rgba(255,255,255,0.06)!important}

        /* Responsive */
        @media (max-width: 1050px){
          .pricingGrid{ grid-template-columns: repeat(2, 1fr) !important; }
          .zPricingGrid{ grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px){
          .heroRow{ flex-direction: column !important; align-items: flex-start !important; }
          .gatewayGrid{ grid-template-columns: 1fr !important; }
          .howRow{ grid-template-columns: 1fr !important; }
          .zHeroRow{ flex-direction: column !important; align-items: flex-start !important; }
          .zFeatureGrid{ grid-template-columns: 1fr !important; }
          .zStepsGrid{ grid-template-columns: 1fr !important; }
          .zPricingGrid{ grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{position:"relative",zIndex:1,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <Nav/>
        {page==="home"&&<Landing/>}
        {page==="dashboard"&&<DashboardPage/>}
        {page==="leaderboard"&&<Leaderboard/>}
        {activeFirm&&<FirmPage firm={activeFirm}/>}

        <footer style={{padding:"28px 24px",textAlign:"center",borderTop:`1px solid ${c.border}`,marginTop:"auto"}}>
          {activeFirm
            ? <p style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>
                © 2026 {activeFirm.name} · Part of the{" "}
                <span style={{color:"rgba(255,255,255,0.4)",cursor:"pointer"}} onClick={()=>navTo("home")}>Hyperscaled Network</span>
                {" "}· Powered by <a href="https://vanta.network" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none"}}>Vanta Network</a> on <a href="#" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none"}}>Bittensor</a>
              </p>
            : <p style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>
                © 2026 Hyperscaled · Powered by <a href="https://vanta.network" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none"}}>Vanta Network</a> on <a href="#" style={{color:"rgba(255,255,255,0.4)",textDecoration:"none"}}>Bittensor</a>
              </p>
          }
        </footer>
      </div>
    </div>
  );
}

function FirmExtMock({firm}){
  const C1=firm.color, C2=firm.color2;
  const hexRgb=(h)=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`${r},${g},${b}`};
  const cr=hexRgb(C1);
  return (
    <div style={{width:360,background:"linear-gradient(180deg,#080c18 0%,#0a1020 100%)",borderRadius:14,border:`1px solid rgba(${cr},0.1)`,overflow:"hidden",boxShadow:`0 30px 80px rgba(0,0,0,0.6),0 0 60px rgba(${cr},0.05)`,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:"150%",height:"150%",top:"-25%",left:"-25%",filter:"blur(60px)",background:`radial-gradient(circle at 30% 40%,rgba(${cr},0.08),transparent 60%)`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:"150%",height:"150%",top:"-25%",left:"-25%",filter:"blur(60px)",background:`radial-gradient(circle at 70% 60%,rgba(${cr},0.04),transparent 60%)`,pointerEvents:"none"}}/>
        {/* Header — no firm name, clean like the Hyperscaled ext */}
        <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,0.04)",position:"relative"}}>
          {firm.logoImg
            ? <img src={firm.logoImg} alt={firm.name} style={{width:20,height:20,borderRadius:4,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}} />
            : <div style={{width:20,height:20,borderRadius:5,background:`linear-gradient(135deg,${C1},${C2})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:9,color:"#fff"}}>{firm.logo}</div>
          }
          <div style={{fontSize:10,padding:"3px 10px",borderRadius:100,background:"rgba(34,197,94,0.1)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.15)",fontWeight:500}}>Funded</div>
        </div>
        {/* Balance */}
        <div style={{padding:"16px 16px 12px",position:"relative"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:3}}>Funded Account Balance:</div>
          <div style={{fontSize:30,fontWeight:300,color:"#fff",letterSpacing:"-0.03em",lineHeight:1.2}}>$100,822.40</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:10,marginBottom:3}}>Current Period Expected Payout</div>
          <div style={{fontSize:22,fontWeight:300,color:C1,letterSpacing:"-0.02em"}}>$657.92</div>
        </div>
        {/* Position */}
        <div style={{padding:"0 16px 12px",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:500}}>Open Positions</span>
            <span style={{fontSize:11,color:C1}}>View on HL →</span>
          </div>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:13,fontWeight:500,color:"#fff"}}>ETH-PERP</span>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:`rgba(${cr},0.1)`,color:C1,fontWeight:600}}>SHORT</span>
              </div>
              <span style={{fontSize:13,color:"#22c55e",fontWeight:500}}>+$182.40</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 0"}}>
              {[["Size","1.2 ETH"],["Entry","$3,182.00"],["Mark","$3,030.00"],["Leverage","2x"]].map(([l,v])=>(
                <div key={l} style={{display:"flex",gap:8,fontSize:11}}><span style={{color:"rgba(255,255,255,0.3)"}}>{l}</span><span style={{color:"rgba(255,255,255,0.7)"}}>{v}</span></div>
              ))}
            </div>
          </div>
          <div style={{textAlign:"center",padding:"16px 0 8px",fontSize:11,color:"rgba(255,255,255,0.2)"}}>No additional open positions</div>
        </div>
        {/* Stats */}
        <div style={{padding:"0 16px 14px",position:"relative"}}>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:12,marginBottom:3}}><span style={{color:"rgba(255,255,255,0.5)"}}>Promotions:</span><span style={{color:"#22c55e",marginLeft:4,fontWeight:500}}>+$50,000</span></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>All Time Returns / Sharpe: <b style={{color:"rgba(255,255,255,0.7)",fontWeight:500}}>0.82% / 1.04</b></div>
          </div>
        </div>
        {/* Progress */}
        <div style={{padding:"0 16px 12px",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:10}}>
            <span style={{color:"rgba(255,255,255,0.5)"}}>Challenge Progress</span>
            <span style={{color:"rgba(255,255,255,0.7)"}}>8.2% / 10%</span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden",marginBottom:4}}>
            <div style={{width:"82%",height:"100%",background:`linear-gradient(90deg,${C1},${C2})`,borderRadius:3}}/>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>$1,800 to profit target ($10,000 goal)</div>
        </div>
        {/* Drawdown */}
        <div style={{padding:"0 16px 20px",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
            <span style={{color:"rgba(255,255,255,0.5)"}}>Current Drawdown</span>
            <span style={{color:"#22c55e"}}>1.1% / 5%</span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden",marginBottom:4}}>
            <div style={{width:"22%",height:"100%",background:"#22c55e",borderRadius:3}}/>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>$3,900 remaining buffer</div>
        </div>
        {/* Footer link */}
        <div style={{padding:"0 16px 16px",position:"relative"}}>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.7)"}}>View Full Analytics</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:1}}>Vanta Network Dashboard</div>
            </div>
            <span style={{color:C1,fontSize:14}}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}