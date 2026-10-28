// LCC Adults Financial Pathway - DEMO ONLY. All people, figures and systems are fictitious.
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 3000;
const TODAY = "2026-10-28";
const VERSION = 2;
const STATE_FILE = path.join(__dirname, "state.json");
const CUR = { notes: true };

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = v => { const n = parseFloat(String(v ?? "").replace(/[£,\s]/g, "")); return isNaN(n) ? 0 : n; };
const r2 = n => Math.round(n * 100) / 100;
const gbp = n => "£" + Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = iso => { if (!iso) return "-"; const d = new Date(String(iso).slice(0, 10) + "T00:00:00Z"); return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); };
const dayDiff = (a, b) => Math.round((new Date(String(b).slice(0, 10)) - new Date(String(a).slice(0, 10))) / 86400000);
const nowStamp = () => TODAY + " " + new Date().toISOString().slice(11, 16);

// ---------- rules (fictitious demo rules) ----------
const RULES = { allowance: 250, taper: 50, capital: 14250 };
const BANDS = [
  { band: "Band A", level: "Low", lo: 0, hi: 7, rate: 24.5, text: "Under 7 hours of support a week" },
  { band: "Band B", level: "Medium", lo: 7, hi: 14, rate: 24.5, text: "7 hours up to (not including) 14 hours a week" },
  { band: "Band C", level: "High", lo: 14, hi: 25, rate: 24.5, text: "14 hours up to (not including) 25 hours a week" },
  { band: "Band D", level: "Very high / complex", lo: 25, hi: 999, rate: 28, text: "25 hours or more a week" }
];
const bandFor = h => BANDS.find(b => h >= b.lo && h < b.hi) || BANDS[3];
const TEAMS = { "Older People - South Kesteven": "AS4412", "Older People - East Lindsey": "AS4413", "Learning Disability - Lincoln": "AS4420", "Physical Disability - Boston": "AS4431", "Mental Health - Grantham": "AS4440" };
const NEXT_BATCH = "2026-11-09", LAST_BATCH = "2026-10-12", FIRST_RUN = "2026-11-06", CARD_DUE = "2026-11-04";

function calc(i) {
  const income = r2(i.sp + i.pp + i.ben + i.other), housing = r2(i.rent + i.ct), dre = r2(i.heat + i.dre);
  const assessable = r2(income - housing - dre - RULES.allowance);
  const contribution = Math.max(0, r2(assessable * RULES.taper / 100));
  const b = bandFor(i.hours), gross = r2(i.hours * b.rate), selfFunder = i.capital > RULES.capital;
  const dp = selfFunder ? 0 : Math.max(0, r2(gross - contribution));
  return { income, housing, dre, assessable, contribution, band: b.band, rate: b.rate, gross, selfFunder, dp };
}
const mkA = (id, pid, created, inp, status, by, ad) => ({ id, personId: pid, created, inp, calc: calc(inp), status, preparedBy: "Business Support", approvedBy: by || "", approvedDate: ad || "" });

function seed() {
  const A = [
    mkA("A-3001", "P-1003", "2026-03-02", { sp: 0, pp: 0, ben: 280, other: 0, rent: 95, ct: 18, heat: 0, dre: 20, capital: 900, hours: 22 }, "Approved", "S. Patel", "2026-03-02"),
    mkA("A-3002", "P-1004", "2025-12-18", { sp: 195, pp: 120, ben: 110, other: 0, rent: 0, ct: 24, heat: 30, dre: 15, capital: 6000, hours: 18 }, "Approved", "S. Patel", "2025-12-18"),
    mkA("A-3003", "P-1005", "2026-04-14", { sp: 0, pp: 0, ben: 195, other: 0, rent: 80, ct: 15, heat: 0, dre: 25, capital: 1200, hours: 30 }, "Approved", "R. Kaur", "2026-04-14"),
    mkA("A-3004", "P-1006", "2026-09-08", { sp: 203.85, pp: 180, ben: 108.55, other: 0, rent: 0, ct: 31, heat: 40, dre: 45, capital: 7800, hours: 17 }, "Approved", "A. Cole", "2026-09-10")
  ];
  const dpOf = id => A.find(a => a.id === id).calc.dp;
  const P = o => Object.assign({ eligibility: "Eligible", capacity: "Has capacity", safeguarding: "No concerns", faStatus: "Not started", dpStatus: "Not started", dpWeekly: 0, dpStart: "", deceased: "", notes: [], timeline: [] }, o);
  return {
    version: VERSION,
    persons: [
      P({ id: "P-1001", name: "Margaret Ellis", dob: "1948-03-14", nhs: "943 000 1001", address: "12 Mill Lane, Sleaford (fictitious)", worker: "J. Marsh", team: "Older People - South Kesteven", hours: 10, needsApproved: "2026-07-21", stage: "Needs assessment approved",
        needs: "Stroke in April 2026. Needs help with washing, dressing, meals and medication. Lives alone. Daughter visits weekly. Assessed support: 10 hours a week.",
        notes: [{ d: "2026-07-21", t: "Needs assessment completed at home by practitioner J. Marsh using Sonic Brief. Assessed support 10 hours a week. Financial assessment form issued to Mrs Ellis." }],
        timeline: [
          { when: "2026-07-21", sys: "Mosaic", text: "Needs assessment completed at home and approved (10 hours a week).", kind: "step" },
          { when: "2026-10-28 08:50", sys: "Jadu", text: "Paper financial assessment form arrived by post and was scanned by Business Support. The clock starts here.", kind: "step", tag: "start" }] }),
      P({ id: "P-1002", name: "Arthur Benson", dob: "1952-11-02", nhs: "943 000 1002", address: "4 Church Street, Louth (fictitious)", worker: "A. Cole", team: "Older People - East Lindsey", hours: 0, needsApproved: "", stage: "Needs assessment in progress", eligibility: "Pending", needs: "", notes: [{ d: "2026-10-14", t: "Initial contact by phone, referred by GP." }] }),
      P({ id: "P-1003", name: "Priya Nair", dob: "1989-06-30", nhs: "943 000 1003", address: "27 Park View, Lincoln (fictitious)", worker: "S. Patel", team: "Learning Disability - Lincoln", hours: 22, needsApproved: "2026-02-10", stage: "Direct payment live", capacity: "Supported decision making", faStatus: "Approved", dpStatus: "Live", dpWeekly: dpOf("A-3001"), dpStart: "2026-04-06",
        needs: "Learning disability and epilepsy. Needs support with budgeting, travel and daily routines. Assessed support: 22 hours a week.", notes: [{ d: "2026-04-06", t: "Direct payment started." }] }),
      P({ id: "P-1004", name: "George Whitaker", dob: "1941-01-19", nhs: "943 000 1004", address: "9 Orchard Close, Grantham (fictitious)", worker: "S. Patel", team: "Older People - South Kesteven", hours: 18, needsApproved: "2025-12-02", stage: "Direct payment live", capacity: "Lacks capacity (son is suitable person)", safeguarding: "Monitoring", faStatus: "Approved", dpStatus: "Live", dpWeekly: dpOf("A-3002"), dpStart: "2026-01-12", deceased: "2026-09-02",
        needs: "Advanced dementia. Daily care funded through a direct payment to his son. Assessed support: 18 hours a week.", notes: [{ d: "2026-09-02", t: "Registrar notified Mosaic that Mr Whitaker has died. Record updated by duty worker. Business World not told." }] }),
      P({ id: "P-1005", name: "Fatima Rahman", dob: "1976-09-08", nhs: "943 000 1005", address: "61 Riverside Drive, Boston (fictitious)", worker: "R. Kaur", team: "Physical Disability - Boston", hours: 30, needsApproved: "2026-03-17", stage: "Direct payment live", faStatus: "Approved", dpStatus: "Live", dpWeekly: dpOf("A-3003"), dpStart: "2026-05-04",
        needs: "Spinal injury. Needs a personal assistant. Assessed support: 30 hours a week.", notes: [{ d: "2026-05-04", t: "Direct payment started." }] }),
      P({ id: "P-1006", name: "Dennis Hartley", dob: "1944-08-22", nhs: "943 000 1006", address: "3 Beck Lane, Horncastle (fictitious)", worker: "A. Cole", team: "Older People - East Lindsey", hours: 17, needsApproved: "2026-08-12", stage: "Waiting for Business World set-up", faStatus: "Approved", dpStatus: "Requested", dpWeekly: dpOf("A-3004"),
        needs: "Parkinson's disease. Needs help with personal care and meals. Wife is the main carer. Assessed support: 17 hours a week.",
        notes: [{ d: "2026-10-14", t: "PSR accepted by Adult Care Finance. Waiting for Business World batch import." }],
        timeline: [
          { when: "2026-08-12", sys: "Mosaic", text: "Needs assessment completed and approved (17 hours a week).", kind: "step" },
          { when: "2026-08-18", sys: "Jadu", text: "Paper financial assessment form received by post. The clock starts here.", kind: "step", tag: "start" },
          { when: "2026-09-01", sys: "Jadu", text: "Form keyed by Business Support after waiting in the keying queue.", kind: "wait" },
          { when: "2026-09-08", sys: "Abacus", text: "Details re-keyed into Abacus (dual keying) and calculated.", kind: "wait" },
          { when: "2026-09-10", sys: "Abacus", text: "Practitioner approved the financial assessment.", kind: "step" },
          { when: "2026-09-16", sys: "Mosaic", text: "Purchase Service Request PSR-2201 sent to Adult Care Finance.", kind: "step" },
          { when: "2026-09-24", sys: "Mosaic", text: "PSR-2201 REJECTED: cost centre code missing. Returned for correction.", kind: "bounce" },
          { when: "2026-10-01", sys: "Mosaic", text: "PSR-2214 resubmitted after correction.", kind: "step" },
          { when: "2026-10-09", sys: "Mosaic", text: "PSR-2214 REJECTED: wrong cost centre for the team. Returned again.", kind: "bounce" },
          { when: "2026-10-13", sys: "Mosaic", text: "PSR-2233 resubmitted.", kind: "step" },
          { when: "2026-10-14", sys: "Mosaic", text: "PSR-2233 accepted by Adult Care Finance.", kind: "step" },
          { when: "2026-10-14", sys: "Business World", text: "Missed the 12 Oct batch import. Mosaic does not pass the PSR on automatically (BizTalk link), so it waits for the next batch import.", kind: "wait" },
          { when: "2026-11-09", sys: "Business World", text: "Batch import creates the payee (expected).", kind: "projected" },
          { when: "2026-11-13", sys: "Business World", text: "First payment run, backdated to the form date (expected).", kind: "projected", tag: "firstpay" }] })
    ],
    jadu: [
      { id: "S-5001", personId: "P-1001", received: TODAY, source: "Post, scanned by Business Support", status: "Awaiting keying", scanFile: "/files/ellis-financial-form.png", fields: null },
      { id: "S-5002", personId: "", received: "2026-10-22", source: "Post, scanned by Business Support", status: "Awaiting keying (not used in demo)", scanFile: "", fields: null },
      { id: "S-5003", personId: "", received: "2026-10-23", source: "Post, scanned by Business Support", status: "Awaiting keying (not used in demo)", scanFile: "", fields: null },
      { id: "S-4991", personId: "", received: "2026-10-26", source: "Web form", status: "Awaiting keying (not used in demo)", scanFile: "", fields: null }
    ],
    abacus: A,
    psr: [
      { id: "PSR-2201", personId: "P-1006", abacusId: "A-3004", created: "2026-09-16", costCentre: "", authoriser: "A. Cole", method: "Separate bank account", weekly: A[3].calc.dp, startDate: "2026-09-10", status: "Rejected", decided: "2026-09-24", reasons: ["Cost centre code is missing"] },
      { id: "PSR-2214", personId: "P-1006", abacusId: "A-3004", created: "2026-10-01", costCentre: "AS4412", authoriser: "A. Cole", method: "Separate bank account", weekly: A[3].calc.dp, startDate: "2026-09-10", status: "Rejected", decided: "2026-10-09", reasons: ["Cost centre AS4412 does not match the team for this person (Older People - East Lindsey uses AS4413)"] },
      { id: "PSR-2233", personId: "P-1006", abacusId: "A-3004", created: "2026-10-13", costCentre: "AS4413", authoriser: "A. Cole", method: "Separate bank account", weekly: A[3].calc.dp, startDate: "2026-09-10", status: "Accepted", decided: "2026-10-14", reasons: [] }
    ],
    payees: [
      { id: "BW-7001", personId: "P-1003", payee: "Priya Nair (own account)", method: "Prepaid card", weekly: A[0].calc.dp, start: "2026-04-06", status: "Active", created: "2026-04-01", firstRun: "", cardDue: "" },
      { id: "BW-7002", personId: "P-1004", payee: "Mr D. Whitaker (son, suitable person)", method: "Separate bank account", weekly: A[1].calc.dp, start: "2026-01-12", status: "Active", created: "2026-01-05", firstRun: "", cardDue: "" },
      { id: "BW-7003", personId: "P-1005", payee: "Fatima Rahman (own account)", method: "Prepaid card", weekly: A[2].calc.dp, start: "2026-05-04", status: "Active", created: "2026-04-28", firstRun: "", cardDue: "" }
    ],
    spend: { "P-1003": [505, 512, 498], "P-1004": [0, 0, 0], "P-1005": [340, 310, 355] },
    log: []
  };
}

let S;
function load() { try { S = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); if (S.version !== VERSION) throw 0; } catch { S = seed(); save(); } }
function save() { try { fs.writeFileSync(STATE_FILE, JSON.stringify(S)); } catch { } }
const person = id => S.persons.find(p => p.id === id);
const pname = id => person(id)?.name || "-";
function audit(sys, text, pid, kind, extra) {
  const t = nowStamp();
  S.log.unshift({ time: t, system: sys, text, personId: pid || "" }); S.log = S.log.slice(0, 200);
  const p = pid && person(pid); if (p) p.timeline.push(Object.assign({ when: t, sys, text, kind: kind || "step" }, extra || {}));
  save();
}

// ---------- demo notes ----------
const note = (k, t, b) => CUR.notes ? `<div class="dn ${k}"><b class="t">${{ wait: "&#9203; Waiting for", limit: "&#9888; Limitation", fast: "&#9889; Faster with Cowork" }[k]}${t ? ": " + esc(t) : ""}</b>${b}</div>` : "";
const T = (h, rows, cls) => `<table class="${cls || ""}"><thead><tr>${h.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${h.length}"><i>None</i></td></tr>`}</tbody></table>`;
const KV = rows => `<table class="kv"><tbody>${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</tbody></table>`;
const opts = (list, sel) => list.map(o => `<option${o === sel ? " selected" : ""}>${esc(o)}</option>`).join("");

// ---------- chrome ----------
const CSS = `*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",Arial,sans-serif;font-size:14px;color:#222;background:#f3f4f6}
.demobar{background:#111;color:#ffd24d;padding:5px 14px;font-size:12px;line-height:1.6}.demobar a{color:#9fd0ff;text-decoration:none;margin:0 3px}
table{border-collapse:collapse;width:100%;background:#fff;margin:8px 0}th,td{border:1px solid #d0d4da;padding:6px 9px;text-align:left;vertical-align:top}th{background:#eceff3;font-weight:600}
table.kv th{width:240px}h1{font-size:22px;margin:4px 0 12px}h2{font-size:17px;margin:20px 0 6px}h3{font-size:15px;margin:14px 0 4px}
label{display:block;margin:10px 0 3px;font-weight:600}input,select,textarea{width:100%;max-width:520px;padding:6px 8px;border:1px solid #8a919c;border-radius:2px;font:inherit;background:#fff}textarea{height:80px}
button,.btn{background:var(--ac,#333);color:#fff;border:0;padding:8px 18px;font:inherit;border-radius:2px;cursor:pointer;margin-top:14px;text-decoration:none;display:inline-block}
.btn.alt{background:#fff;color:var(--ac,#333);border:1px solid var(--ac,#333)}a{color:var(--ac,#0b5cab)}
.pad{padding:18px 24px;max-width:1250px}.ok{background:#e8f5ea;border-left:4px solid #2d8a3e;padding:8px 12px;margin:10px 0}.bad{background:#fde8e8;border-left:4px solid #c8102e;padding:8px 12px;margin:10px 0}.warn{background:#fff4e5;border-left:4px solid #e08a00;padding:8px 12px;margin:10px 0}
.dn{margin:12px 0;padding:9px 12px;border:1px dashed #8a8a8a;border-left-width:5px;background:#fff;font-size:13px;max-width:980px}.dn b.t{display:block;font-size:11px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:3px}
.dn.wait{border-left-color:#e08a00;background:#fff8ec}.dn.wait b.t{color:#a86300}.dn.limit{border-left-color:#6b4fa0;background:#f6f2fb}.dn.limit b.t{color:#5a3d96}.dn.fast{border-left-color:#1f8a3b;background:#eef9f0}.dn.fast b.t{color:#176b2d}
.badge{display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;color:#fff;background:#555}.b-step{background:#4b6584}.b-wait{background:#e08a00}.b-bounce{background:#c8102e}.b-limit{background:#6b4fa0}.b-projected{background:#9aa0a6}.b-ok{background:#1f8a3b}
.pill{display:inline-block;padding:2px 9px;border-radius:3px;background:#e9ecf1;font-size:12px}.pill.g{background:#dff3e3;color:#176b2d}.pill.a{background:#ffe9c7;color:#8a5200}.pill.r{background:#fcdcdc;color:#9b1c1c}`;
const SYSCSS = {
  jadu: `--ac:#00629b}.jd-top{background:#fff;border-bottom:6px solid #00629b;padding:14px 24px;display:flex;align-items:center;gap:22px}.jd-logo{font-weight:700;font-size:19px;line-height:1.05;color:#00629b;border-left:6px solid #7ab800;padding-left:10px}.jd-sub{color:#444}.jd-nav{background:#00629b;padding:8px 24px}.jd-nav a{color:#fff;text-decoration:none;margin-right:20px}`,
  mosaic: `--ac:#b3122b}.mz-top{background:#b3122b;color:#fff;display:flex;align-items:center;gap:12px;padding:9px 18px}.ring{width:24px;height:24px;border:5px solid #fff;border-radius:50%;display:inline-block}.mz-top b{font-size:20px;letter-spacing:.02em}.mz-sub{opacity:.85;font-size:12px}.mz-user{margin-left:auto;font-size:13px}.mz-body{display:flex;min-height:80vh}.mz-nav{width:200px;background:#2e3238;padding:12px 0}.mz-nav a{display:block;color:#dfe3e8;padding:9px 18px;text-decoration:none}.mz-nav a:hover{background:#444a52}.mz-main{flex:1;padding:16px 22px;background:#fff}.mz-person{background:#f1f3f5;border:1px solid #d5d9de;border-left:6px solid #b3122b;padding:10px 14px;margin-bottom:12px}.mz-person b{font-size:18px}`,
  abacus: `--ac:#8e1b2d}.ab-top{background:#6e1522;color:#fff;display:flex;align-items:center;gap:12px;padding:8px 18px}.ab-top b{font-size:19px}.ab-tabs{background:#e6e0e1;padding:0 18px;border-bottom:3px solid #8e1b2d}.ab-tabs a{display:inline-block;padding:8px 16px;text-decoration:none;color:#3a1018;border:1px solid #c9bcbf;border-bottom:0;background:#f4eff0;margin-right:3px}.ab-main{padding:16px 24px;background:#fff;min-height:75vh}fieldset{border:1px solid #b9a9ad;margin:10px 0;padding:6px 14px 12px;max-width:640px}legend{padding:0 6px;font-weight:600;color:#6e1522}`,
  bw: `--ac:#1b75bc}.bw-top{background:#1d2733;color:#fff;display:flex;align-items:center;gap:14px;padding:8px 16px}.u4{background:#fff;color:#1d2733;font-weight:800;padding:1px 6px;border-radius:3px}.bw-top b{font-size:17px}.bw-top span.r{margin-left:auto;font-size:12px;opacity:.8}.bw-body{display:flex;min-height:80vh}.bw-nav{width:230px;background:#eef1f5;border-right:1px solid #cfd6df;padding:10px 0;font-size:13px}.bw-nav div{padding:5px 14px;color:#566;font-weight:600;text-transform:uppercase;font-size:11px;margin-top:8px}.bw-nav a{display:block;padding:7px 14px 7px 26px;color:#1d2733;text-decoration:none}.bw-nav a:hover{background:#dde6f0}.bw-main{flex:1;padding:14px 22px;background:#fff}.bw-crumb{color:#667;font-size:12px;margin-bottom:4px}.bw-main tbody tr:nth-child(even) td{background:#f7f9fb}`,
  cc: `--ac:#0e8a7d}.cc-top{background:#fff;border-bottom:3px solid #0e8a7d;display:flex;align-items:center;gap:12px;padding:10px 22px}.hex{width:30px;height:34px;background:#0e8a7d;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}.cc-top b{font-size:20px;color:#0e8a7d}.cc-nav{background:#0e8a7d;padding:8px 22px}.cc-nav a{color:#fff;text-decoration:none;margin-right:20px}.card{background:#fff;border:1px solid #d5e3e1;border-radius:8px;padding:12px 16px;margin:10px 0}`,
  fabric: `--ac:#117865}.fb-top{background:#1f1f1f;color:#fff;display:flex;align-items:center;gap:12px;padding:8px 16px}.fb-logo{width:22px;height:22px;background:linear-gradient(135deg,#117865,#35c0a0);border-radius:4px}.fb-main{padding:16px 22px}.tiles{display:flex;gap:12px;flex-wrap:wrap}.tile{background:#fff;border:1px solid #ddd;border-top:4px solid #117865;padding:10px 16px;min-width:210px;flex:1}.tile .v{font-size:28px;font-weight:600}.tile .l{color:#555;font-size:12px}.tile.r{border-top-color:#c8102e}.tile.a{border-top-color:#e08a00}.panel{background:#fff;border:1px solid #ddd;padding:6px 14px 12px;margin:14px 0}`,
  xl: `--ac:#217346}.xl-top{background:#217346;color:#fff;padding:7px 16px;display:flex;gap:12px}.xl-top b{font-size:16px}.xl-fx{background:#f3f3f3;border-bottom:1px solid #ccc;padding:5px 12px;font-family:Consolas,monospace;font-size:12px;color:#555}.xl-main{padding:12px 18px}table.grid th:first-child,table.grid td:first-child{background:#f0f0f0;text-align:center;width:36px;color:#555}table.grid th{background:#e6e6e6;text-align:center}table.grid td,table.grid th{border:1px solid #cfcfcf;padding:4px 8px}.xl-tabs{background:#f3f3f3;border-top:1px solid #ccc;padding:6px 18px;font-size:12px;color:#333}`,
  plain: `--ac:#333}.pl{padding:18px 24px;max-width:1200px}`
};
function shell(sys, title, body, o = {}) {
  const bar = `<div class="demobar"><b>DEMONSTRATION ONLY</b> &middot; fictitious people and data &middot; demo date ${fmtD(TODAY)} &middot; <a href="/">Launcher</a>|<a href="/jadu">Jadu</a>|<a href="/mosaic">Mosaic</a>|<a href="/abacus">Abacus</a>|<a href="/businessworld">Business World</a>|<a href="/carecubed">CareCubed</a>|<a href="/master">Master spreadsheet</a>|<a href="/dashboard">Management information</a>|<a href="/assumptions">Assumptions</a>|<a href="/notes/${CUR.notes ? "off" : "on"}">${CUR.notes ? "Hide" : "Show"} demo notes</a></div>`;
  let chrome;
  const nb = note("", "", "") && "";
  if (sys === "jadu") chrome = `<div class="jd-top"><div class="jd-logo">Lincolnshire<br>County Council</div><div class="jd-sub">Jadu Central &middot; Forms and submissions (staff)</div></div><div class="jd-nav"><a href="/jadu">Scan inbox and submissions</a></div><div class="pad"><h1>${title}</h1>${body}</div>`;
  else if (sys === "mosaic") chrome = `<div class="mz-top"><span class="ring"></span><b>Mosaic</b><span class="mz-sub">Lincolnshire County Council &middot; Adult Social Care</span><span class="mz-user">J. Marsh (Practitioner)</span></div><div class="mz-body"><div class="mz-nav"><a href="/mosaic">People</a><a href="/mosaic/psr">Purchase Service Requests</a><a href="/mosaic/psr-checklist">PSR checklist</a></div><div class="mz-main">${o.person ? `<div class="mz-person"><b>${esc(o.person.name)}</b> &nbsp; ${esc(o.person.id)} &middot; DOB ${fmtD(o.person.dob)} &middot; NHS ${esc(o.person.nhs)}<br>${esc(o.person.address)} &middot; Worker ${esc(o.person.worker)} &middot; Team ${esc(o.person.team)}${o.person.deceased ? ` <span class="pill r">Deceased ${fmtD(o.person.deceased)}</span>` : ""}</div>` : ""}<h1>${title}</h1>${body}</div></div>`;
  else if (sys === "abacus") chrome = `<div class="ab-top"><span class="ring"></span><b>Abacus</b><span>Financial assessment and charging &middot; Adult Social Care</span></div><div class="ab-tabs"><a href="/abacus">Assessments</a><a href="/abacus/new">New assessment</a><a href="/abacus/approvals">Approvals</a></div><div class="ab-main"><h1>${title}</h1>${body}</div>`;
  else if (sys === "bw") chrome = `<div class="bw-top"><span class="u4">U4</span><b>Business World</b><span>Adult Care Finance</span><span class="r">Finance officer: L. Brennan</span></div><div class="bw-body"><div class="bw-nav"><div>Accounts payable</div><a href="/businessworld">Direct payments workbench</a><a href="/businessworld/new">New payee request</a><a href="/businessworld/approvals">Approvals</a><a href="/businessworld/runs">Payment runs</a></div><div class="bw-main"><div class="bw-crumb">Accounts payable &rsaquo; Direct payments</div><h1>${title}</h1>${body}</div></div>`;
  else if (sys === "cc") chrome = `<div class="cc-top"><div class="hex"></div><b>CareCubed</b><span>Care cost and provider management</span></div><div class="cc-nav"><a href="/carecubed">Cost bands and calculator</a><a href="/carecubed#providers">Provider Portal</a></div><div class="pad"><h1>${title}</h1>${body}</div>`;
  else if (sys === "fabric") chrome = `<div class="fb-top"><div class="fb-logo"></div><b>Microsoft Fabric</b><span>Adults Financial Pathway &middot; management information</span></div><div class="fb-main"><h1>${title}</h1>${body}</div>`;
  else if (sys === "xl") chrome = `<div class="xl-top"><b>Excel</b><span>Master_Direct_Payment_Rules.xlsx &middot; Adult Care Finance</span></div><div class="xl-fx">fx &nbsp; ${esc(title)}</div><div class="xl-main">${body}</div><div class="xl-tabs">Bands | Contribution rules | Worked example</div>`;
  else chrome = `<div class="pl"><h1>${title}</h1>${body}</div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title.replace(/<[^>]+>/g, ""))}</title><style>${CSS}body{${SYSCSS[sys] || SYSCSS.plain}</style></head><body>${bar}${chrome}</body></html>`;
}

// ---------- helpers ----------
const ageOf = dob => Math.floor((new Date(TODAY) - new Date(dob)) / 31557600000);
const pill = (t, c) => `<span class="pill ${c || ""}">${esc(t)}</span>`;
function validatePSR(p, i) {
  const errs = []; const a = S.abacus.find(x => x.id === i.abacusId && x.personId === p.id);
  if (!String(i.authoriser || "").trim()) errs.push("Authoriser (practitioner and budget holder) is missing");
  const cc = String(i.costCentre || "").trim().toUpperCase();
  if (!cc) errs.push("Cost centre code is missing");
  else if (!Object.values(TEAMS).includes(cc)) errs.push(`Cost centre "${cc}" is not recognised`);
  else if (cc !== TEAMS[p.team]) errs.push(`Cost centre ${cc} does not match the team for this person (${p.team} uses ${TEAMS[p.team]})`);
  if (!a) errs.push("Abacus assessment ID not found for this person");
  else if (a.status !== "Approved") errs.push("The Abacus assessment is not approved yet");
  else {
    if (i.startDate < a.approvedDate) errs.push("Start date is before the financial assessment was approved");
    if (Math.abs(num(i.weekly) - a.calc.dp) > 0.005) errs.push(`Weekly amount ${gbp(num(i.weekly))} does not match the approved Abacus assessment (${gbp(a.calc.dp)})`);
  }
  if (!i.method) errs.push("Payment method is missing");
  return errs;
}
const parseBody = req => new Promise(res => { let d = ""; req.on("data", c => d += c); req.on("end", () => { const o = {}; new URLSearchParams(d).forEach((v, k) => o[k] = v); res(o); }); });
const html = (res, h, code = 200, hdr = {}) => { res.writeHead(code, Object.assign({ "Content-Type": "text/html; charset=utf-8" }, hdr)); res.end(h); };
const go = (res, to) => { res.writeHead(303, { Location: to }); res.end(); return null; };
const routes = {};

// ---------- launcher ----------
routes["GET /"] = () => {
  const e = person("P-1001"), h = person("P-1006");
  return shell(null, "Lincolnshire Adults: Financial Pathway demo", `
<p>One site standing in for the systems on Lincolnshire's Adult Social Care financial pathway. Every person, figure and rule is fictitious. Each system has its own screen, but they share one set of records, so what is keyed in one place shows up (or fails to show up) in the next, just like the real pathway.</p>
${note("fast", "", "Grey boxes like this one are <b>demo notes</b>. <b>Amber = waiting for</b> something (where the delay is today), <b>purple = limitation</b> (something Cowork cannot fix) and <b>green = faster with Cowork</b>. Use &quot;Hide demo notes&quot; in the black bar to see the screens as a user would.")}
<h2>Two cases to compare</h2>
${T(["Case", "Route", "Where it is now"], [[`<b>${esc(e.name)}</b> (${e.id})`, "Cowork-assisted. Form scanned today.", esc(e.stage)], [`<b>${esc(h.name)}</b> (${h.id})`, "Usual route. Form received 18 Aug.", esc(h.stage) + " (see Management information)"]])}
<h2>Systems</h2>
${T(["System", "What it stands in for"], [[`<a href="/jadu">Jadu</a>`, "Council forms: scan inbox and financial assessment forms"], [`<a href="/mosaic">Mosaic</a>`, "Case record (Access Group)"], [`<a href="/abacus">Abacus</a>`, "Financial assessment (Access Group, not integrated with Mosaic)"], [`<a href="/master">Master spreadsheet</a>`, "Bands and contribution rules"], [`<a href="/carecubed">CareCubed</a> and Provider Portal`, "Care costs and providers"], [`<a href="/businessworld">Business World</a>`, "Unit4 finance system: payees, approvals, payment runs"], [`<a href="/dashboard">Management information</a>`, "Fabric report: journey, exceptions, spend"], [`<a href="/assumptions">Assumptions</a>`, "What comes from Lincolnshire and what is assumed"]])}
<form method="post" action="/reset"><button type="submit">Reset demo data</button></form>`);
};
routes["POST /reset"] = (req, res) => { S = seed(); save(); return go(res, "/"); };
routes["GET /notes/:s"] = (req, res, m) => { res.writeHead(303, { Location: req.headers.referer || "/", "Set-Cookie": `notes=${m.s === "off" ? "off" : "on"}; Path=/; Max-Age=31536000` }); res.end(); return null; };
routes["GET /api/state"] = (req, res) => { res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(S, null, 1)); return null; };

routes["GET /assumptions"] = () => shell(null, "What is real and what is assumed", `<p>Built from the 26 October scoping call and Lincolnshire's own material. Anything marked <b>Assumption</b> needs validating with Lincolnshire Finance and Adults before it is quoted to anyone.</p>
${T(["Item in the demo", "Value", "Status"], [
  ["Delay from financial assessment to payment", "Up to about 90 days (up to 3 months)", pill("From Lincolnshire (Dave Toye, 26 Oct call)", "g")],
  ["Backdated payments caused by the delay", "About £1.3m of a £1.5m discrepancy in community supported living", pill("From Lincolnshire (Dave Toye)", "g")],
  ["Purchase Service Request (PSR) errors", "35% error rate, about 3,000 rejected forms needing manual work", pill("From Lincolnshire (Adult Social Care Financial Pathway IE Update)", "g")],
  ["Re-keying between Mosaic, Abacus and Business World", "Dual keying, spreadsheets and workarounds", pill("From Lincolnshire (Adults digital strategy material)", "g")],
  ["BizTalk blocking Mosaic to Business World payment transfers", "Replacement with Azure integration services around March 2027", pill("From Lincolnshire (Craig Smith, 26 Oct call; March roadmap)", "g")],
  ["Some data up to 6 months behind", "Reported in Adults improvement notes", pill("From Lincolnshire notes", "g")],
  ["Business Support keying queue", "Oldest paper form about 6 days; 14 forms", pill("Assumption", "a")],
  ["Business World batch import", "Monthly: 12 Oct and 9 Nov 2026", pill("Assumption", "a")],
  ["Weekly payment run", "Fridays, with cut-off the week before (first run for Margaret: 6 Nov)", pill("Assumption", "a")],
  ["Prepaid card delivery", "About 5 working days", pill("Assumption", "a")],
  ["Adult Care Finance PSR turnaround", "3 to 5 working days per attempt", pill("Assumption", "a")],
  ["Urgent payee request outside the batch", "Possible with finance approval", pill("Assumption: confirm with Lincolnshire Finance", "a")],
  ["Contribution and band rules, cost centre codes, rates", "All invented for the demo", pill("Fictitious", "r")]])}`);

// ---------- Jadu ----------
routes["GET /jadu"] = () => shell("jadu", "Scan inbox and submissions", `
<p>Forms posted in by people are scanned by Business Support and appear here. A form cannot go any further until someone has keyed it.</p>
${note("wait", "Business Support to key paper forms", "Today a posted form joins the keying queue (14 forms, oldest 6 days; demo assumption). Nothing else can start on the case until someone has re-keyed it.")}
${note("fast", "", "Cowork reads the handwriting (OCR) and keys the form in minutes, then flags anything missing.")}
${T(["Scan ID", "Person", "Received", "Source", "Status", ""], S.jadu.map(j => [j.id, j.personId ? `${esc(pname(j.personId))} (${j.personId})` : "<i>Not matched</i>", fmtD(j.received), esc(j.source), esc(j.status), j.scanFile ? `<a href="/jadu/${j.id}">Open</a>` : ""]))}`);
routes["GET /jadu/:id"] = (req, res, m) => {
  const j = S.jadu.find(x => x.id === m.id); if (!j || !j.scanFile) return shell("jadu", "Not found", "<p>Not found</p>");
  const f = j.fields;
  return shell("jadu", `Scan ${j.id}: financial assessment form`, `
<p><b>Person:</b> ${esc(pname(j.personId))} (${j.personId}) &middot; <b>Received:</b> ${fmtD(j.received)} &middot; <b>Status:</b> ${esc(j.status)}</p>
${f ? "" : note("limit", "", "Handwriting is read with a confidence level. Anything unclear goes back to the practitioner. Cowork cannot create evidence that was not sent (for example a receipt for a disability-related cost).")}
<h2>Scanned paper form</h2><img src="${j.scanFile}" alt="Scanned handwritten financial assessment form" style="max-width:720px;border:1px solid #888">
<h2>Keyed record</h2>
${f ? KV([["State pension (weekly)", gbp(f.sp)], ["Private pension (weekly)", gbp(f.pp)], ["Disability benefits (weekly)", gbp(f.ben)], ["Other income (weekly)", gbp(f.other)], ["Total weekly income", gbp(f.sp + f.pp + f.ben + f.other)], ["Savings and capital", gbp(f.capital)], ["Rent or mortgage (weekly)", gbp(f.rent)], ["Council tax (weekly)", gbp(f.ct)], ["Heating extra (weekly)", gbp(f.heat)], ["Other disability-related costs (weekly)", gbp(f.dre) + " " + esc(f.dreText)], ["Evidence for those costs attached", esc(f.evidence)], ["Date signed", esc(f.signed)], ["Keying notes", esc(f.notes)]]) :
      `<p>Not yet keyed. Enter exactly what is written on the form.</p><form method="post" action="/jadu/${j.id}/key">
<label for="sp">State pension (weekly £)</label><input id="sp" name="sp"><label for="pp">Private pension (weekly £)</label><input id="pp" name="pp">
<label for="ben">Disability benefits, for example Attendance Allowance (weekly £)</label><input id="ben" name="ben"><label for="other">Other income (weekly £)</label><input id="other" name="other" value="0">
<label for="capital">Savings and capital (total £)</label><input id="capital" name="capital"><label for="rent">Rent or mortgage (weekly £)</label><input id="rent" name="rent">
<label for="ct">Council tax (weekly £)</label><input id="ct" name="ct"><label for="heat">Heating extra (weekly £)</label><input id="heat" name="heat">
<label for="dre">Other disability-related costs (weekly £)</label><input id="dre" name="dre" value="0"><label for="dreText">Description of those costs</label><input id="dreText" name="dreText">
<label for="evidence">Evidence for those costs attached (receipt or invoice)</label><select id="evidence" name="evidence"><option>Yes</option><option>No</option></select>
<label for="signed">Date signed</label><input id="signed" name="signed"><label for="notes">Keying notes (anything unclear or missing)</label><textarea id="notes" name="notes"></textarea>
<button type="submit">Save keyed record</button></form>`}`);
};
routes["POST /jadu/:id/key"] = async (req, res, m) => {
  const j = S.jadu.find(x => x.id === m.id), b = await parseBody(req);
  if (j) { j.fields = { sp: num(b.sp), pp: num(b.pp), ben: num(b.ben), other: num(b.other), capital: num(b.capital), rent: num(b.rent), ct: num(b.ct), heat: num(b.heat), dre: num(b.dre), dreText: b.dreText || "", evidence: b.evidence || "No", signed: b.signed || "", notes: b.notes || "" }; j.status = "Keyed, ready for completeness check"; audit("Jadu", `Scan ${j.id} keyed (record created for ${j.personId})`, j.personId, "step"); }
  return go(res, "/jadu/" + m.id);
};

// ---------- Mosaic ----------
routes["GET /mosaic"] = () => shell("mosaic", "People", `${note("limit", "", "Mosaic is not linked to Abacus or Business World (Access Group will not integrate them, even though both are theirs). The same details are keyed again in each system: &quot;dual keying&quot;. Cowork does that keying, but it is still three separate entries.")}
${T(["ID", "Name", "Team", "Stage", "Financial assessment", "Direct payment", ""], S.persons.map(p => [p.id, esc(p.name), esc(p.team), esc(p.stage), esc(p.faStatus), esc(p.dpStatus) + (p.dpWeekly ? " " + gbp(p.dpWeekly) + " a week" : ""), `<a href="/mosaic/${p.id}">Open</a>`]))}`);
routes["GET /mosaic/psr"] = () => shell("mosaic", "Purchase Service Requests (PSRs)", `<p>A PSR tells Adult Care Finance what to pay, to whom, from which cost centre.</p>
${note("wait", "Adult Care Finance to check each PSR", "Each PSR is reviewed by Adult Care Finance and waits in their queue (3 to 5 working days an attempt; demo assumption). Lincolnshire's own report found a <b>35% error rate and about 3,000 rejected forms</b> needing manual rework. Every bounce restarts the wait.")}
${T(["PSR", "Person", "Submitted", "Weekly", "Cost centre", "Outcome", "Reason"], S.psr.map(x => [`<a href="/mosaic/psr/${x.id}">${x.id}</a>`, `${esc(pname(x.personId))}`, fmtD(x.created), gbp(x.weekly), esc(x.costCentre) || "<i>blank</i>", x.status === "Accepted" ? pill("Accepted", "g") : pill("Rejected", "r"), esc(x.reasons.join("; "))]))}`);
routes["GET /mosaic/psr-checklist"] = () => shell("mosaic", "PSR checklist (Adult Care Finance)", `<p>Adult Care Finance reject a PSR that fails any of these checks.</p>
<ol><li>Authoriser named (practitioner and budget holder).</li><li>Cost centre code present, recognised and correct for the person's team (table below).</li><li>An <b>approved</b> Abacus assessment ID for the person.</li><li>Start date is not before the date the financial assessment was approved.</li><li>Weekly amount exactly matches the approved Abacus assessment.</li><li>Payment method stated (prepaid card, separate bank account or suitable person's account).</li></ol>
<h2>Cost centre by team</h2>${T(["Team", "Cost centre"], Object.entries(TEAMS).map(([t, c]) => [esc(t), c]))}
${note("wait", "people to interpret the rules", "Lincolnshire's report says the PSR process is &quot;open to interpretation&quot;, which is a main cause of the 35% error rate.")}
${note("fast", "", "Cowork applies this checklist the same way every time, before the PSR is sent.")}`);
routes["GET /mosaic/psr/:id"] = (req, res, m) => {
  const x = S.psr.find(q => q.id === m.id); if (!x) return shell("mosaic", "Not found", "<p>Not found</p>");
  return shell("mosaic", `PSR ${x.id}`, `${x.status === "Accepted" ? `<div class="ok"><b>Accepted</b> by Adult Care Finance.</div>` : `<div class="bad"><b>Rejected</b> by Adult Care Finance. Returned for correction:<ul>${x.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div>`}
${KV([["Person", `${esc(pname(x.personId))} (${x.personId})`], ["Abacus assessment", esc(x.abacusId)], ["Weekly amount", gbp(x.weekly)], ["Start date", esc(x.startDate)], ["Payment method", esc(x.method)], ["Cost centre", esc(x.costCentre) || "<i>blank</i>"], ["Authoriser", esc(x.authoriser)], ["Submitted", fmtD(x.created)], ["Decided", fmtD(x.decided)]])}
${x.status === "Accepted" ? note("limit", "", "Mosaic does <b>not</b> pass an accepted PSR to Business World (the BizTalk link is a known blocker; its replacement is expected around March). The usual route waits for the <b>monthly batch import</b>. An urgent payee request in Business World is the workaround.") : note("wait", "correction and a second review", "Each bounce adds the correction time plus another review queue, roughly a week (demo assumption).")}
<p><a class="btn alt" href="/mosaic/${x.personId}">Back to ${esc(pname(x.personId))}</a></p>`, { person: person(x.personId) });
};
routes["GET /mosaic/:id"] = (req, res, m) => {
  const p = person(m.id); if (!p) return shell("mosaic", "Not found", "<p>Not found</p>");
  const psrs = S.psr.filter(x => x.personId === p.id), last = psrs[psrs.length - 1];
  return shell("mosaic", "Person summary", `
<h2>Pathway progress</h2>${T(["Step", "Status"], [["1. Needs assessment", p.needsApproved ? pill("Approved " + fmtD(p.needsApproved), "g") + ` &middot; assessed support ${p.hours} hours a week` : pill("In progress", "a")], ["2. Financial assessment", pill(p.faStatus, p.faStatus === "Approved" ? "g" : "a")], ["3. Purchase Service Request", last ? (last.status === "Accepted" ? pill("Accepted " + last.id, "g") : pill("Rejected " + last.id, "r")) : pill("Not raised", "a")], ["4. Direct payment", pill(p.dpStatus, p.dpStatus === "Live" ? "g" : "a") + (p.dpWeekly ? ` ${gbp(p.dpWeekly)} a week` : "") + (p.dpStart ? ` from ${fmtD(p.dpStart)}` : "")]])}
<h2>Assessment summary</h2>${KV([["Needs summary", esc(p.needs) || "<i>empty</i>"], ["Assessed support hours a week", p.hours || "-"], ["Eligibility", esc(p.eligibility)], ["Capacity", esc(p.capacity)], ["Safeguarding", esc(p.safeguarding)], ["Team", esc(p.team)], ["Stage", esc(p.stage)]])}
${note("limit", "", "The financial details are not held in Mosaic. They live on a paper form, in Jadu, in Abacus and in the master spreadsheet.")}
<h2>Purchase Service Requests</h2>${T(["PSR", "Weekly", "Outcome", "Reason"], psrs.map(x => [`<a href="/mosaic/psr/${x.id}">${x.id}</a>`, gbp(x.weekly), x.status === "Accepted" ? pill("Accepted", "g") : pill("Rejected", "r"), esc(x.reasons.join("; "))]))}
<p><a class="btn" href="/mosaic/${p.id}/psr/new">Raise a Purchase Service Request</a></p>
<h2>Case notes</h2><ul>${p.notes.map(n => `<li><b>${fmtD(n.d)}</b>: ${esc(n.t)}</li>`).join("")}</ul>
<h2>Update record</h2><form method="post" action="/mosaic/${p.id}">
<label for="faStatus">Financial assessment status</label><select id="faStatus" name="faStatus">${opts(["Not started", "Form keyed", "Assessment prepared", "Awaiting approval", "Approved"], p.faStatus)}</select>
<label for="dpStatus">Direct payment status</label><select id="dpStatus" name="dpStatus">${opts(["Not started", "Requested", "Awaiting finance set-up", "Live", "Stopped"], p.dpStatus)}</select>
<label for="dpWeekly">Direct payment weekly amount (£)</label><input id="dpWeekly" name="dpWeekly" value="${p.dpWeekly || ""}">
<label for="dpStart">Direct payment start date (YYYY-MM-DD)</label><input id="dpStart" name="dpStart" value="${esc(p.dpStart)}">
<label for="note">Add case note</label><textarea id="note" name="note"></textarea><button type="submit">Save to Mosaic</button></form>`, { person: p });
};
routes["POST /mosaic/:id"] = async (req, res, m) => {
  const p = person(m.id), b = await parseBody(req);
  if (p) { if (b.faStatus) p.faStatus = b.faStatus; if (b.dpStatus) p.dpStatus = b.dpStatus; p.dpWeekly = num(b.dpWeekly); p.dpStart = b.dpStart || ""; if (b.note) p.notes.push({ d: TODAY, t: b.note }); p.stage = p.dpStatus === "Live" ? "Direct payment live" : p.dpStatus === "Awaiting finance set-up" ? "Waiting for Business World set-up" : p.faStatus === "Approved" ? "Financial assessment approved" : p.stage; audit("Mosaic", `Record ${p.id} updated (financial assessment ${p.faStatus}, direct payment ${p.dpStatus} ${gbp(p.dpWeekly)})`, p.id, "step"); }
  return go(res, "/mosaic/" + m.id);
};
routes["GET /mosaic/:id/psr/new"] = (req, res, m) => {
  const p = person(m.id); if (!p) return shell("mosaic", "Not found", "<p>Not found</p>");
  return shell("mosaic", "Raise a Purchase Service Request", `
${note("wait", "Adult Care Finance review", "Once sent, the PSR waits in the Adult Care Finance queue. A PSR with an error comes back and the wait starts again (35% do, per Lincolnshire's report).")}
${note("fast", "", "Cowork checks the PSR against the <a href='/mosaic/psr-checklist'>PSR checklist</a> before it is sent, so it should go through first time. Compare Dennis Hartley (P-1006): two bounces and about four weeks lost.")}
<form method="post" action="/mosaic/${p.id}/psr/new">
<label for="abacusId">Approved Abacus assessment ID</label><input id="abacusId" name="abacusId">
<label for="service">Service</label><input id="service" name="service" value="Direct payment" readonly>
<label for="method">Payment method</label><select id="method" name="method"><option value="">-- select --</option><option>Prepaid card</option><option>Separate bank account</option><option>Suitable person's account</option></select>
<label for="weekly">Weekly amount (£)</label><input id="weekly" name="weekly">
<label for="startDate">Start date (YYYY-MM-DD)</label><input id="startDate" name="startDate">
<label for="costCentre">Cost centre code</label><input id="costCentre" name="costCentre">
<label for="authoriser">Authoriser (practitioner and budget holder)</label><input id="authoriser" name="authoriser">
<button type="submit">Send to Adult Care Finance</button></form>`, { person: p });
};
routes["POST /mosaic/:id/psr/new"] = async (req, res, m) => {
  const p = person(m.id), b = await parseBody(req); if (!p) return go(res, "/mosaic");
  const errs = validatePSR(p, b), id = "PSR-" + (2240 + S.psr.length);
  S.psr.push({ id, personId: p.id, abacusId: b.abacusId, created: TODAY, costCentre: (b.costCentre || "").toUpperCase(), authoriser: b.authoriser, method: b.method, weekly: num(b.weekly), startDate: b.startDate, status: errs.length ? "Rejected" : "Accepted", decided: TODAY, reasons: errs });
  if (errs.length) audit("Mosaic", `${id} REJECTED by Adult Care Finance: ${errs.join("; ")}`, p.id, "bounce");
  else { audit("Mosaic", `${id} accepted by Adult Care Finance`, p.id, "step"); audit("Business World", "Accepted PSR does not flow to Business World automatically (BizTalk link). Usual route: wait for the monthly batch import on " + fmtD(NEXT_BATCH) + ".", p.id, "limit"); }
  return go(res, "/mosaic/psr/" + id);
};

// ---------- Abacus ----------
const abCalc = a => KV([["Total weekly income", gbp(a.calc.income)], ["Less housing costs (rent and council tax)", gbp(a.calc.housing)], ["Less disability-related costs (heating and other)", gbp(a.calc.dre)], ["Less personal allowance", gbp(RULES.allowance)], ["Assessable income", gbp(a.calc.assessable)], ["Weekly contribution (50% if above zero)", gbp(a.calc.contribution)], ["Savings and capital", gbp(a.inp.capital) + (a.calc.selfFunder ? " (above limit: self-funder)" : " (below limit)")], ["Assessed hours a week", a.inp.hours], ["Band and hourly rate", `${a.calc.band} at ${gbp(a.calc.rate)}`], ["Gross weekly cost", gbp(a.calc.gross)], ["<b>Weekly direct payment</b>", `<b>${gbp(a.calc.dp)}</b>`]]);
routes["GET /abacus"] = () => shell("abacus", "Financial assessments", `${note("limit", "", "Abacus is not integrated with Mosaic. Everything is keyed in again (dual keying), and the finance result then has to be keyed a third time into Business World.")}
${T(["ID", "Person", "Income", "Contribution", "Band", "Hours", "Direct payment", "Status", "Approved by", "Date", ""], S.abacus.map(a => [a.id, `${esc(pname(a.personId))} (${a.personId})`, gbp(a.calc.income), gbp(a.calc.contribution), a.calc.band, a.inp.hours, gbp(a.calc.dp), a.status === "Approved" ? pill("Approved", "g") : pill(a.status, "a"), esc(a.approvedBy), fmtD(a.approvedDate || a.created), `<a href="/abacus/${a.id}">Open</a>`]))}`);
routes["GET /abacus/new"] = () => shell("abacus", "New financial assessment", `${note("fast", "", "Cowork copies the figures from the keyed form, works out the result itself using the master spreadsheet rules and checks that Abacus agrees before anyone approves.")}
<form method="post" action="/abacus/new"><fieldset><legend>Person</legend><label for="personId">Person ID</label><input id="personId" name="personId"></fieldset>
<fieldset><legend>Income (weekly £)</legend><label for="sp">State pension</label><input id="sp" name="sp" value="0"><label for="pp">Private pension</label><input id="pp" name="pp" value="0"><label for="ben">Benefits (including disability benefits)</label><input id="ben" name="ben" value="0"><label for="other">Other income</label><input id="other" name="other" value="0"></fieldset>
<fieldset><legend>Expenditure (weekly £)</legend><label for="rent">Rent or mortgage</label><input id="rent" name="rent" value="0"><label for="ct">Council tax</label><input id="ct" name="ct" value="0"><label for="heat">Heating extra</label><input id="heat" name="heat" value="0"><label for="dre">Other disability-related costs</label><input id="dre" name="dre" value="0"></fieldset>
<fieldset><legend>Capital and support</legend><label for="capital">Savings and capital (total £)</label><input id="capital" name="capital" value="0"><label for="hours">Assessed support hours a week</label><input id="hours" name="hours"></fieldset>
<fieldset><legend>Prepared by</legend><label for="by">Name</label><input id="by" name="by" value="Cowork (for practitioner review)"></fieldset>
<button type="submit">Calculate and save for approval</button></form>`);
routes["POST /abacus/new"] = async (req, res) => {
  const b = await parseBody(req), id = "A-" + (3001 + S.abacus.length);
  const inp = { sp: num(b.sp), pp: num(b.pp), ben: num(b.ben), other: num(b.other), rent: num(b.rent), ct: num(b.ct), heat: num(b.heat), dre: num(b.dre), capital: num(b.capital), hours: num(b.hours) };
  const a = mkA(id, b.personId, TODAY, inp, "Awaiting approval", "", ""); a.preparedBy = b.by || ""; S.abacus.push(a);
  audit("Abacus", `Assessment ${id} saved for ${b.personId}: contribution ${gbp(a.calc.contribution)}, ${a.calc.band}, direct payment ${gbp(a.calc.dp)} a week. Awaiting practitioner approval.`, b.personId, "step");
  return go(res, "/abacus/" + id);
};
routes["GET /abacus/approvals"] = () => shell("abacus", "Approvals", `${note("limit", "", "Cowork can prepare an assessment but <b>cannot approve it</b>. Eligibility and the award stay a practitioner decision. (In the demo, whoever is watching plays the practitioner.)")}
${T(["ID", "Person", "Direct payment", "Prepared by", ""], S.abacus.filter(a => a.status === "Awaiting approval").map(a => [a.id, esc(pname(a.personId)), gbp(a.calc.dp), esc(a.preparedBy), `<a href="/abacus/${a.id}">Review</a> <form method="post" action="/abacus/approve/${a.id}" style="display:inline"><button type="submit" style="margin:0;padding:4px 12px">Approve as practitioner (J. Marsh)</button></form>`]))}`);
routes["POST /abacus/approve/:id"] = (req, res, m) => {
  const a = S.abacus.find(x => x.id === m.id); if (a && a.status === "Awaiting approval") { a.status = "Approved"; a.approvedBy = "J. Marsh (practitioner)"; a.approvedDate = TODAY; audit("Abacus", `Practitioner approved assessment ${a.id}`, a.personId, "step"); }
  return go(res, "/abacus/approvals");
};
routes["GET /abacus/:id"] = (req, res, m) => {
  const a = S.abacus.find(x => x.id === m.id); if (!a) return shell("abacus", "Not found", "<p>Not found</p>");
  return shell("abacus", `Assessment ${a.id}: ${esc(pname(a.personId))}`, `<p>Status: ${a.status === "Approved" ? pill("Approved", "g") : pill(a.status, "a")} &middot; Prepared by ${esc(a.preparedBy)} &middot; Approved by ${esc(a.approvedBy) || "-"} ${a.approvedDate ? "on " + fmtD(a.approvedDate) : ""}</p>${abCalc(a)}`);
};

// ---------- master spreadsheet ----------
routes["GET /master"] = () => shell("xl", "Bands and contribution rules (master spreadsheet)", `
<table class="grid"><thead><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody>
<tr><td>1</td><td><b>Band</b></td><td><b>Need level</b></td><td><b>Support hours a week</b></td><td><b>Hourly rate</b></td></tr>
${BANDS.map((b, i) => `<tr><td>${i + 2}</td><td>${b.band}</td><td>${b.level}</td><td>${b.text}</td><td>${gbp(b.rate)}</td></tr>`).join("")}
<tr><td>6</td><td></td><td></td><td></td><td></td></tr><tr><td>7</td><td colspan="4"><b>Contribution rules</b></td></tr>
<tr><td>8</td><td colspan="4">Total weekly income = all income including disability benefits (Attendance Allowance, PIP and so on).</td></tr>
<tr><td>9</td><td colspan="4">Less housing costs = rent or mortgage plus council tax.</td></tr>
<tr><td>10</td><td colspan="4">Less disability-related costs = heating extra plus any other evidenced disability-related costs (receipt or invoice).</td></tr>
<tr><td>11</td><td colspan="4">Less personal allowance = ${gbp(RULES.allowance)} a week.</td></tr>
<tr><td>12</td><td colspan="4">Weekly contribution = ${RULES.taper}% of what is left, if above zero; otherwise zero.</td></tr>
<tr><td>13</td><td colspan="4">Savings and capital above ${gbp(RULES.capital)}: the person is a self-funder and not eligible for a council direct payment.</td></tr>
<tr><td>14</td><td colspan="4"><b>Weekly direct payment = assessed hours x the band's hourly rate, minus the weekly contribution.</b></td></tr>
<tr><td>15</td><td colspan="4">Worked example: income 300.00, housing 100.00, other costs 20.00, allowance 250.00, so the remainder is negative and the contribution is 0.00. For 10 hours in Band B: 10 x 24.50 = 245.00 a week.</td></tr></tbody></table>
${note("limit", "", "These rules live in a spreadsheet outside the systems. Someone has to open it, apply it and key the result into Abacus. Cowork applies it the same way every time, but the rules still have to be kept up to date by Lincolnshire.")}`);

// ---------- CareCubed ----------
routes["GET /carecubed"] = () => shell("cc", "Cost bands and provider lookup", `
${note("limit", "", "CareCubed has an API but a limited one, and it is not integrated with Mosaic. Costs are looked up on screen. Cowork can do the same lookup in a browser.")}
<div class="card"><h2>Cost bands</h2>${T(["Band", "Need level", "Support hours a week", "Hourly rate"], BANDS.map(b => [b.band, b.level, b.text, gbp(b.rate)]))}</div>
<div class="card"><h2>Indicative weekly cost by hours</h2>${T(["Hours a week", "Band", "Weekly cost"], [5, 8, 10, 12, 14, 17, 22, 25, 30].map(h => [h, bandFor(h).band, gbp(h * bandFor(h).rate)]))}</div>
<div class="card" id="providers"><h2>Provider Portal</h2>${T(["Provider", "Area", "Hourly rate", "Vacancies"], [["Fenland Home Care Ltd", "Lincoln, Sleaford", gbp(24.5), "Yes"], ["Wolds Community Support", "Louth, Horncastle", gbp(24.5), "Limited"], ["Coastal Complex Care", "Boston, Skegness", gbp(28), "Yes"]])}
${note("limit", "", "The Provider Portal is a shared instance used by about five authorities, so it is not Lincolnshire's to change. It is read-only for the demo.")}</div>`);

// ---------- Business World ----------
routes["GET /businessworld"] = () => {
  const queued = S.psr.filter(x => x.status === "Accepted" && !S.payees.some(p => p.personId === x.personId));
  return shell("bw", "Direct payments workbench", `
<div class="warn">Normal route: accepted PSRs reach Business World through the <b>batch import</b>. Last import ${fmtD(LAST_BATCH)}. Next import <b>${fmtD(NEXT_BATCH)}</b>.</div>
<h2>Accepted PSRs waiting for batch import</h2>
${note("wait", "the next batch import", "An accepted PSR does not appear in Business World until the monthly import runs, because the BizTalk link between Mosaic and Business World is a known blocker (replacement expected around March). This is the biggest single wait on the usual route: &quot;up to three months&quot; from the form.")}
${T(["PSR", "Person", "Weekly", "Accepted", "Days waiting", "Expected import"], queued.map(x => [x.id, esc(pname(x.personId)), gbp(x.weekly), fmtD(x.decided), dayDiff(x.decided, TODAY), fmtD(NEXT_BATCH)]))}
<h2>Payees</h2>${T(["ID", "Person", "Payee", "Method", "Weekly", "Start", "Status", "First run", ""], S.payees.map(p => [p.id, esc(pname(p.personId)), esc(p.payee), esc(p.method), gbp(p.weekly), fmtD(p.start), p.status === "Active" ? pill("Active", "g") : pill(p.status, "a"), p.firstRun ? fmtD(p.firstRun) : "-", p.status === "Active" ? `<form method="post" action="/businessworld/stop/${p.id}" style="margin:0"><button type="submit" style="margin:0;padding:3px 10px">Stop payments</button></form>` : ""]))}
${note("limit", "", "Business World is not told when a person dies (Mosaic is). See George Whitaker on the Management information page: still being paid.")}
<p><a class="btn" href="/businessworld/new">New payee request (urgent, outside the batch)</a> <a class="btn alt" href="/businessworld/approvals">Approvals</a> <a class="btn alt" href="/businessworld/runs">Payment runs</a></p>`);
};
routes["GET /businessworld/new"] = () => shell("bw", "New payee request (outside the batch)", `
${note("fast", "", "Instead of waiting for the monthly import, a complete payee request is raised straight away, already linked to the approved Abacus assessment and the accepted PSR. <b>Assumption:</b> Lincolnshire Finance allow urgent requests outside the batch; this needs confirming.")}
${note("limit", "", "A finance officer must still approve the request. Cowork can prepare it but cannot approve it.")}
<form method="post" action="/businessworld/new"><label for="personId">Person ID</label><input id="personId" name="personId">
<label for="abacusId">Approved Abacus assessment ID</label><input id="abacusId" name="abacusId"><label for="psrId">Accepted PSR ID</label><input id="psrId" name="psrId">
<label for="payee">Payee name</label><input id="payee" name="payee"><label for="method">Payment method</label><select id="method" name="method"><option>Prepaid card</option><option>Separate bank account</option><option>Suitable person's account</option></select>
<label for="weekly">Weekly amount (£)</label><input id="weekly" name="weekly"><label for="start">Start date (YYYY-MM-DD)</label><input id="start" name="start">
<button type="submit">Submit payee request for approval</button></form>`);
routes["POST /businessworld/new"] = async (req, res) => {
  const b = await parseBody(req), a = S.abacus.find(x => x.id === b.abacusId), x = S.psr.find(q => q.id === b.psrId);
  const errs = [];
  if (!a || a.personId !== b.personId || a.status !== "Approved") errs.push(`Abacus assessment ${esc(b.abacusId)} must exist, be Approved and belong to ${esc(b.personId)}`);
  if (!x || x.personId !== b.personId || x.status !== "Accepted") errs.push(`PSR ${esc(b.psrId)} must exist, be Accepted and belong to ${esc(b.personId)}`);
  if (a && Math.abs(num(b.weekly) - a.calc.dp) > 0.005) errs.push(`Weekly amount must equal the approved Abacus amount (${gbp(a.calc.dp)})`);
  if (x && b.start !== x.startDate) errs.push(`Start date must equal the PSR start date (${esc(x.startDate)})`);
  if (S.payees.some(p => p.personId === b.personId && p.status !== "Stopped")) errs.push("A payee already exists or is awaiting approval for this person (duplicate)");
  if (errs.length) return html(res, shell("bw", "Payee request rejected", `<div class="bad"><b>Cannot create payee:</b><ul>${errs.map(e => `<li>${e}</li>`).join("")}</ul></div><p><a href="/businessworld/new">Back</a></p>`), 200), null;
  const id = "BW-" + (7001 + S.payees.length);
  S.payees.push({ id, personId: b.personId, payee: b.payee, method: b.method, weekly: num(b.weekly), start: b.start, status: "Awaiting finance approval", created: TODAY, firstRun: "", cardDue: "" });
  audit("Business World", `Payee request ${id} raised for ${b.personId}, ${gbp(num(b.weekly))} a week from ${b.start}. Awaiting finance approval.`, b.personId, "step");
  return go(res, "/businessworld");
};
routes["GET /businessworld/approvals"] = () => shell("bw", "Approvals (finance officer)", `${note("limit", "", "Segregation of duties: only a finance officer can approve a payee. Cowork cannot, and should not. (In the demo, whoever is watching plays the finance officer.)")}
${T(["Payee", "Person", "Method", "Weekly", "Start", ""], S.payees.filter(p => p.status === "Awaiting finance approval").map(p => [p.id, esc(pname(p.personId)), esc(p.method), gbp(p.weekly), fmtD(p.start), `<form method="post" action="/businessworld/approve/${p.id}" style="margin:0"><button type="submit" style="margin:0;padding:4px 12px">Approve as finance officer</button></form>`]))}`);
routes["POST /businessworld/approve/:id"] = (req, res, m) => {
  const p = S.payees.find(x => x.id === m.id);
  if (p && p.status === "Awaiting finance approval") {
    p.status = "Active"; p.firstRun = FIRST_RUN; if (p.method === "Prepaid card") p.cardDue = CARD_DUE;
    audit("Business World", `Finance officer approved payee ${p.id}. First payment run ${fmtD(FIRST_RUN)}.`, p.personId, "step");
    audit("Business World", `The cut-off for the 30 Oct payment run has passed, so the first payment is in the run on ${fmtD(FIRST_RUN)}${p.method === "Prepaid card" ? `; the prepaid card is ordered and due about ${fmtD(CARD_DUE)}` : ""}. Cowork cannot speed this up.`, p.personId, "limit");
    if (p.method === "Prepaid card") person(p.personId)?.timeline.push({ when: CARD_DUE, sys: "Business World", text: "Prepaid card due to be delivered (about 5 working days).", kind: "projected" });
    person(p.personId)?.timeline.push({ when: FIRST_RUN, sys: "Business World", text: "First payment run.", kind: "projected", tag: "firstpay" });
  }
  return go(res, "/businessworld/approvals");
};
routes["POST /businessworld/stop/:id"] = (req, res, m) => { const p = S.payees.find(x => x.id === m.id); if (p) { p.status = "Stopped"; audit("Business World", `Payments stopped for ${p.id}`, p.personId, "step"); } return go(res, "/businessworld"); };
routes["GET /businessworld/runs"] = () => shell("bw", "Payment runs", `${note("limit", "", "Payments go out on set payment runs with a cut-off before each. Missing a cut-off means waiting for the next run. (Run days and cut-offs are demo assumptions.)")}
${T(["Run date", "Cut-off", "Status"], [[fmtD("2026-10-30"), "Tue 27 Oct 2026, 17:00", pill("Cut-off passed", "r")], [fmtD("2026-11-06"), "Tue 3 Nov 2026, 17:00", pill("Open", "g")], [fmtD("2026-11-13"), "Tue 10 Nov 2026, 17:00", pill("Open", "g")]])}`);

// ---------- Fabric: spend + dashboard ----------
function spendRows() {
  return S.payees.filter(p => S.spend[p.personId]).map(p => { const pr = person(p.personId), rows = S.spend[p.personId], spent = rows.reduce((a, c) => a + c, 0), exp = p.weekly * rows.length, pct = exp ? Math.round(spent / exp * 100) : 0, flags = []; if (pr.deceased && p.status === "Active") flags.push(`Died ${fmtD(pr.deceased)}: payments still active`); if (exp && pct < 60 && !pr.deceased) flags.push("Spending below 60% of the award"); return { p, pr, spent, exp, pct, flags }; });
}
routes["GET /spend"] = () => shell("fabric", "Direct payment spend returns", `<p>Last three weeks of returns (prepaid card, separate account or suitable person's account) against the award.</p>
${T(["Person", "Method", "Weekly award", "Spent (3 weeks)", "Expected (3 weeks)", "Spend %", "Flags"], spendRows().map(a => [`${esc(a.pr.name)} (${a.pr.id})`, esc(a.p.method), gbp(a.p.weekly), gbp(a.spent), gbp(a.exp), a.pct + "%", a.flags.length ? a.flags.map(f => `<b>${esc(f)}</b>`).join("<br>") : "None"]))}
${note("fast", "", "Today nobody joins these returns up to the awards. A Cowork check can compare them every week, flag people who have died and highlight under-spend, then suggest changes to the bands.")}`);
routes["GET /dashboard"] = () => {
  const e = person("P-1001"), h = person("P-1006");
  const startOf = p => p.timeline.find(t => t.tag === "start")?.when, payOf = p => p.timeline.find(t => t.tag === "firstpay")?.when;
  const hDays = dayDiff(startOf(h), payOf(h)), eP = payOf(e), eDays = eP ? dayDiff(startOf(e), eP) : null;
  const hArrears = r2(hDays / 7 * h.dpWeekly), ea = S.abacus.filter(a => a.personId === e.id).pop(), eWeekly = ea ? ea.calc.dp : 0;
  const saved = eDays !== null ? r2((hDays - eDays) / 7 * eWeekly) : null;
  const bounces = p => S.psr.filter(x => x.personId === p.id && x.status === "Rejected").length;
  const tl = p => { const rows = []; let prev = null; for (const t of p.timeline) { const d = t.when.slice(0, 10); const started = p.timeline.findIndex(x => x.tag === "start") <= p.timeline.indexOf(t) && p.timeline.indexOf(t) > p.timeline.findIndex(x => x.tag === "start"); const gap = prev && started ? dayDiff(prev, d) : 0; prev = d; const cls = { step: "b-step", wait: "b-wait", bounce: "b-bounce", limit: "b-limit", projected: "b-projected" }[t.kind], lab = { step: "Step", wait: "Waiting", bounce: "Bounced", limit: "Limitation", projected: "Expected" }[t.kind]; rows.push([esc(t.when), esc(t.sys), esc(t.text), gap > 0 ? `+${gap}d` : "", `<span class="badge ${cls}">${lab}</span>`]); } return T(["When", "System", "What happened", "Gap", "Type"], rows); };
  const ex = spendRows().filter(a => a.flags.length);
  return shell("fabric", "Adults Financial Pathway: journey and exceptions", `
<div class="tiles">
<div class="tile r"><div class="v">${hDays} days</div><div class="l">Usual route: ${esc(h.name)}, form to first payment (${bounces(h)} PSR bounces)</div></div>
<div class="tile"><div class="v">${eDays !== null ? eDays + " days" : "In progress"}</div><div class="l">Cowork-assisted: ${esc(e.name)}, form to first payment (${bounces(e)} PSR bounces)</div></div>
<div class="tile a"><div class="v">${gbp(hArrears)}</div><div class="l">Backdated payment owed to ${esc(h.name)} because of the delay (estimate)</div></div>
<div class="tile"><div class="v">${saved !== null ? gbp(saved) : "-"}</div><div class="l">Estimated backdating avoided for ${esc(e.name)} versus the usual route</div></div></div>
${note("fast", "", `Form to first payment: <b>about ${hDays} days down to ${eDays !== null ? eDays : "a handful of"} days</b>. The minutes of Cowork work are not what is left; what is left are the real limits below.`)}
${note("limit", "What is still not quicker", "<ul><li>The practitioner's approval of the assessment (a human decision, but Cowork has the pack ready).</li><li>The finance officer's approval of the payee.</li><li>The weekly payment run and its cut-off.</li><li>Prepaid card delivery (about 5 working days).</li><li>Mosaic, Abacus and Business World are still three systems; Cowork bridges them but does not replace the BizTalk link (due around March).</li></ul>")}
<div class="panel"><h2>Case journey: ${esc(e.name)} (Cowork-assisted)</h2>${tl(e)}</div>
<div class="panel"><h2>Case journey: ${esc(h.name)} (usual route)</h2>${tl(h)}
${note("wait", "", "Where the usual route loses time: the keying queue, re-keying into Abacus, two bounced PSRs and the monthly batch import. Each gap is a person or a queue, not a computer.")}</div>
<div class="panel"><h2>Adult Care Finance PSR quality</h2>${T(["Measure", "Value"], [["Error rate across Lincolnshire (IE report)", "35%"], ["Rejected forms needing manual intervention (IE report)", "about 3,000"], ["Bounces in this demo: usual route", String(bounces(h))], ["Bounces in this demo: Cowork-assisted", String(bounces(e))]])}</div>
<div class="panel"><h2>Exceptions: direct payments</h2>${ex.length ? ex.map(a => `<div class="${a.flags[0].startsWith("Died") ? "bad" : "warn"}"><b>${esc(a.pr.name)}</b>: ${esc(a.flags.join("; "))} (${gbp(a.p.weekly)} a week)</div>`).join("") : "<p>None</p>"}<p><a href="/spend">Spend returns</a></p></div>
<div class="panel"><h2>Audit log</h2>${T(["Time", "System", "Action"], S.log.slice(0, 30).map(l => [esc(l.time), esc(l.system), esc(l.text)]))}</div>`);
};

// ---------- server ----------
const compiled = Object.keys(routes).map(k => { const [method, p] = k.split(" "); return { method, re: new RegExp("^" + p.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "/?$"), fn: routes[k] }; });
http.createServer(async (req, res) => {
  try {
    CUR.notes = !/(^|;\s*)notes=off/.test(req.headers.cookie || "");
    const url = req.url.split("?")[0];
    if (url.startsWith("/files/")) { const f = path.join(__dirname, "files", path.basename(url)); if (fs.existsSync(f)) { res.writeHead(200, { "Content-Type": "image/png" }); return res.end(fs.readFileSync(f)); } res.writeHead(404); return res.end("not found"); }
    for (const r of compiled) {
      if (r.method !== req.method) continue; const m = r.re.exec(url); if (!m) continue;
      const out = await r.fn(req, res, m.groups || {}); if (out === null || out === undefined) return;
      return html(res, out);
    }
    html(res, shell(null, "Not found", "<p>Page not found.</p>"), 404);
  } catch (e) { html(res, shell(null, "Error", "<pre>" + esc(e.stack) + "</pre>"), 500); }
}).listen(PORT, () => console.log("LCC demo on " + PORT));
load();
