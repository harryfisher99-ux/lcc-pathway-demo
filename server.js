// LCC Adults Financial Pathway - DEMO ONLY. All people, figures and systems are fictitious.
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 3000;
const DEMO_TODAY = "2026-10-28";
const STATE_FILE = path.join(__dirname, "state.json");

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const gbp = n => "£" + Number(n || 0).toFixed(2);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

function seed() {
  return {
    persons: [
      { id: "P-1001", name: "Margaret Ellis", dob: "1948-03-14", address: "12 Mill Lane, Sleaford (fictitious)", stage: "Assessment approved", mosaicNeeds: "Stroke 3 months ago. Needs help with washing, dressing, meals and medication. Lives alone. Daughter visits weekly.", eligibility: "Eligible", capacity: "Has capacity", safeguarding: "No concerns", faStatus: "Form received", dpStatus: "Not started", dpWeekly: 0, dpStart: "", assessmentDate: "2026-07-21", channel: "Face to face", notes: ["21 Jul 2026: Needs assessment completed at home by practitioner J. Marsh. Sonic Brief summary attached."], deceased: "" },
      { id: "P-1002", name: "Arthur Benson", dob: "1952-11-02", address: "4 Church Street, Louth (fictitious)", stage: "Needs assessment in progress", mosaicNeeds: "", eligibility: "Pending", capacity: "Has capacity", safeguarding: "No concerns", faStatus: "Not started", dpStatus: "Not started", dpWeekly: 0, dpStart: "", assessmentDate: "", channel: "Phone", notes: ["14 Oct 2026: Initial contact by phone. Referred by GP."], deceased: "" },
      { id: "P-1003", name: "Priya Nair", dob: "1989-06-30", address: "27 Park View, Lincoln (fictitious)", stage: "Direct payment live", mosaicNeeds: "Learning disability and epilepsy. Needs support with budgeting, travel and daily routines.", eligibility: "Eligible", capacity: "Supported decision making", safeguarding: "No concerns", faStatus: "Approved", dpStatus: "Live", dpWeekly: 620, dpStart: "2026-04-06", assessmentDate: "2026-02-10", channel: "Face to face", notes: ["10 Feb 2026: Assessment completed.", "06 Apr 2026: Direct payment started."], deceased: "" },
      { id: "P-1004", name: "George Whitaker", dob: "1941-01-19", address: "9 Orchard Close, Grantham (fictitious)", stage: "Direct payment live", mosaicNeeds: "Advanced dementia. Daily care package funded through direct payment to his son.", eligibility: "Eligible", capacity: "Lacks capacity (son is suitable person)", safeguarding: "Monitoring", faStatus: "Approved", dpStatus: "Live", dpWeekly: 480, dpStart: "2026-01-12", assessmentDate: "2025-12-02", channel: "Face to face", notes: ["02 Sep 2026: Registrar notified Mosaic that Mr Whitaker has died. Record updated by duty worker."], deceased: "2026-09-02" },
      { id: "P-1005", name: "Fatima Rahman", dob: "1976-09-08", address: "61 Riverside Drive, Boston (fictitious)", stage: "Direct payment live", mosaicNeeds: "Spinal injury. Needs personal assistant 25 hours per week.", eligibility: "Eligible", capacity: "Has capacity", safeguarding: "No concerns", faStatus: "Approved", dpStatus: "Live", dpWeekly: 700, dpStart: "2026-05-04", assessmentDate: "2026-03-17", channel: "Web form", notes: ["17 Mar 2026: Assessment completed.", "04 May 2026: Direct payment started."], deceased: "" }
    ],
    jadu: [
      { id: "J-5001", personId: "P-1001", submitted: "2026-10-20", method: "Paper (scanned)", weeklyIncome: 310.5, incomeSource: "State pension £203.85 plus private pension £106.65", savings: 4200, disabilityBenefit: "Attendance Allowance (higher rate) £108.55 weekly", housingCost: 118, otherCosts: "Council tax £22.40, heating £35", scanFile: "/files/ellis-financial-form.png", status: "Received" }
    ],
    abacus: [
      { id: "A-3001", personId: "P-1003", income: 280, contribution: 0, band: "Band C", dpWeekly: 620, status: "Approved", approvedBy: "S. Patel", date: "2026-03-02" },
      { id: "A-3002", personId: "P-1004", income: 410, contribution: 38.4, band: "Band C", dpWeekly: 480, status: "Approved", approvedBy: "S. Patel", date: "2025-12-18" },
      { id: "A-3003", personId: "P-1005", income: 195, contribution: 0, band: "Band D", dpWeekly: 700, status: "Approved", approvedBy: "R. Kaur", date: "2026-04-14" }
    ],
    bw: {
      lastBatch: "2026-10-12", nextBatch: "2026-11-09",
      payees: [
        { id: "BW-7001", personId: "P-1003", payee: "Priya Nair (own account)", method: "Prepaid card", weekly: 620, start: "2026-04-06", status: "Active", created: "2026-04-01" },
        { id: "BW-7002", personId: "P-1004", payee: "Mr D. Whitaker (son, suitable person)", method: "Separate bank account", weekly: 480, start: "2026-01-12", status: "Active", created: "2026-01-05" },
        { id: "BW-7003", personId: "P-1005", payee: "Fatima Rahman (own account)", method: "Prepaid card", weekly: 700, start: "2026-05-04", status: "Active", created: "2026-04-28" }
      ],
      payments: []
    },
    spend: {
      "P-1003": [{ week: "2026-10-05", spent: 590 }, { week: "2026-10-12", spent: 605 }, { week: "2026-10-19", spent: 612 }],
      "P-1004": [{ week: "2026-10-05", spent: 0 }, { week: "2026-10-12", spent: 0 }, { week: "2026-10-19", spent: 0 }],
      "P-1005": [{ week: "2026-10-05", spent: 260 }, { week: "2026-10-12", spent: 240 }, { week: "2026-10-19", spent: 255 }]
    },
    careCubed: [
      { band: "Band A", level: "Low", range: "Up to 7 hours support per week", hourly: 24.5, weekly: 171.5 },
      { band: "Band B", level: "Medium", range: "7 to 14 hours support per week", hourly: 24.5, weekly: 343 },
      { band: "Band C", level: "High", range: "14 to 25 hours support per week", hourly: 24.5, weekly: 612.5 },
      { band: "Band D", level: "Very high / complex", range: "25 hours or more per week", hourly: 28, weekly: 700 }
    ],
    providers: [
      { id: "PR-01", name: "Fenland Home Care Ltd", area: "Lincoln, Sleaford", rate: 24.5, vacancies: "Yes" },
      { id: "PR-02", name: "Wolds Community Support", area: "Louth, Horncastle", rate: 24.5, vacancies: "Limited" },
      { id: "PR-03", name: "Coastal Complex Care", area: "Boston, Skegness", rate: 28, vacancies: "Yes" }
    ],
    log: []
  };
}

let S;
function load() { try { S = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { S = seed(); save(); } }
function save() { try { fs.writeFileSync(STATE_FILE, JSON.stringify(S, null, 1)); } catch { } }
function audit(system, text) { S.log.unshift({ time: new Date().toISOString().slice(0, 16).replace("T", " "), system, text }); S.log = S.log.slice(0, 100); save(); }
const person = id => S.persons.find(p => p.id === id);

const BANDS = [
  { band: "Band A", level: "Low", min: 0, max: 7, base: 171.5 },
  { band: "Band B", level: "Medium", min: 7, max: 14, base: 343 },
  { band: "Band C", level: "High", min: 14, max: 25, base: 612.5 },
  { band: "Band D", level: "Very high / complex", min: 25, max: 99, base: 700 }
];
const RULES = { allowance: 250, taperPercent: 50, savingsThreshold: 14250, note: "Fictitious demo rules only. Weekly contribution = 50% of (weekly income minus disability benefit disregard, housing cost, other costs and the £250 personal allowance), if positive. Savings above £14,250 mean the person is a self-funder and not eligible for a council direct payment." };

const SYSTEMS = {
  jadu: { name: "Jadu web forms", colour: "#0b5cab", path: "/jadu" },
  mosaic: { name: "Mosaic (case record)", colour: "#c8102e", path: "/mosaic" },
  abacus: { name: "Abacus (financial assessment)", colour: "#6b2fa0", path: "/abacus" },
  bw: { name: "Business World (finance)", colour: "#2d6e3e", path: "/businessworld" },
  carecubed: { name: "CareCubed (provider management)", colour: "#00708b", path: "/carecubed" },
  master: { name: "Master spreadsheet (bands)", colour: "#7a5c00", path: "/master" },
  spend: { name: "DP spend returns", colour: "#b45a00", path: "/spend" },
  dash: { name: "Management information", colour: "#222", path: "/dashboard" }
};

function page(sysKey, title, body) {
  const sys = SYSTEMS[sysKey] || { name: "LCC Adults Financial Pathway demo", colour: "#333" };
  const nav = Object.entries(SYSTEMS).map(([k, v]) => `<a href="${v.path}">${esc(v.name)}</a>`).join(" | ");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} - ${esc(sys.name)}</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;margin:0;color:#222;background:#f4f5f7}
header{background:${sys.colour};color:#fff;padding:14px 24px}header h1{margin:0;font-size:22px}header small{opacity:.85}
nav{background:#fff;padding:8px 24px;border-bottom:1px solid #ddd;font-size:13px}nav a{color:#0b5cab;text-decoration:none}
main{padding:20px 24px;max-width:1150px}table{border-collapse:collapse;width:100%;background:#fff;margin:10px 0}
th,td{border:1px solid #ccc;padding:7px 10px;text-align:left;font-size:14px;vertical-align:top}th{background:#e9ecf1}
label{display:block;margin:10px 0 3px;font-weight:600;font-size:14px}input,select,textarea{width:100%;max-width:560px;padding:7px;font-size:14px;border:1px solid #888;border-radius:3px;box-sizing:border-box}
textarea{height:90px}button,.btn{background:${sys.colour};color:#fff;border:0;padding:9px 18px;font-size:14px;border-radius:3px;cursor:pointer;margin-top:14px;text-decoration:none;display:inline-block}
.card{background:#fff;border:1px solid #ccc;padding:14px 18px;margin:12px 0;border-radius:4px}.warn{background:#fff4e5;border-left:4px solid #e08a00;padding:8px 12px;margin:10px 0}
.ok{background:#e8f5ea;border-left:4px solid #2d8a3e;padding:8px 12px;margin:10px 0}.bad{background:#fde8e8;border-left:4px solid #c8102e;padding:8px 12px;margin:10px 0}
.banner{background:#222;color:#ffd24d;padding:5px 24px;font-size:12px}.kv td:first-child{width:230px;font-weight:600;background:#f0f2f6}</style></head><body>
<div class="banner">DEMONSTRATION ONLY: fictitious people and data. Demo date: ${DEMO_TODAY}</div>
<header><h1>${esc(sys.name)}</h1><small>${esc(title)}</small></header><nav><a href="/">Home</a> | ${nav}</nav><main>${body}</main></body></html>`;
}

function parseBody(req) {
  return new Promise(res => { let d = ""; req.on("data", c => d += c); req.on("end", () => { const o = {}; new URLSearchParams(d).forEach((v, k) => o[k] = v); res(o); }); });
}
const send = (res, html, code = 200) => { res.writeHead(code, { "Content-Type": "text/html; charset=utf-8" }); res.end(html); };
const redirect = (res, to) => { res.writeHead(303, { Location: to }); res.end(); };

function bandFor(hours) { return BANDS.find(b => hours >= b.min && hours < b.max) || BANDS[3]; }
function contribution(income, benefit, housing, other) {
  const v = (income - benefit - housing - other - RULES.allowance) * (RULES.taperPercent / 100);
  return Math.max(0, Math.round(v * 100) / 100);
}

const routes = {};

routes["GET /"] = () => page(null, "Home", `<div class="card"><h2>Lincolnshire Adults: Financial Pathway demo site</h2>
<p>This single site stands in for the systems on Lincolnshire's pathway: ${Object.values(SYSTEMS).map(s => esc(s.name)).join(", ")}. Each system has its own page, but they share one set of people and records.</p>
<p><b>Current demo case:</b> Margaret Ellis (P-1001). Her needs assessment is approved. She has returned a paper financial assessment form that has been scanned (see Jadu). The goal is to get a direct payment live without the usual 90-day delay.</p></div>
<table><tr><th>System</th><th>Open</th></tr>${Object.values(SYSTEMS).map(s => `<tr><td>${esc(s.name)}</td><td><a href="${s.path}">${s.path}</a></td></tr>`).join("")}</table>
<form method="post" action="/reset"><button type="submit">Reset demo data</button></form>`);

routes["POST /reset"] = (req, res) => { S = seed(); save(); redirect(res, "/"); return null; };

// Jadu
routes["GET /jadu"] = () => page("jadu", "Submissions", `<p>Financial assessment forms submitted online or scanned from paper.</p>
<table><tr><th>ID</th><th>Person</th><th>Submitted</th><th>Method</th><th>Status</th><th></th></tr>${S.jadu.map(j => `<tr><td>${j.id}</td><td>${esc(person(j.personId)?.name)} (${j.personId})</td><td>${j.submitted}</td><td>${esc(j.method)}</td><td>${esc(j.status)}</td><td><a href="/jadu/${j.id}">Open</a></td></tr>`).join("")}</table>
<p><a class="btn" href="/jadu/new">Complete a financial assessment web form</a></p>`);
routes["GET /jadu/new"] = () => page("jadu", "Financial assessment form", `<form method="post" action="/jadu/new">
<label for="personId">Person ID</label><input id="personId" name="personId" value="P-1002">
<label for="weeklyIncome">Total weekly income (£)</label><input id="weeklyIncome" name="weeklyIncome">
<label for="incomeSource">Income sources</label><input id="incomeSource" name="incomeSource">
<label for="savings">Savings and capital (£)</label><input id="savings" name="savings">
<label for="disabilityBenefit">Disability benefits (description and weekly £)</label><input id="disabilityBenefit" name="disabilityBenefit">
<label for="housingCost">Weekly housing cost (£)</label><input id="housingCost" name="housingCost">
<label for="otherCosts">Other disability-related costs</label><input id="otherCosts" name="otherCosts">
<button type="submit">Submit form</button></form>`);
routes["POST /jadu/new"] = async (req, res) => {
  const b = await parseBody(req);
  const id = "J-" + (5001 + S.jadu.length);
  S.jadu.push({ id, personId: b.personId, submitted: DEMO_TODAY, method: "Web form", weeklyIncome: +b.weeklyIncome || 0, incomeSource: b.incomeSource, savings: +b.savings || 0, disabilityBenefit: b.disabilityBenefit, housingCost: +b.housingCost || 0, otherCosts: b.otherCosts, status: "Received" });
  const p = person(b.personId); if (p) p.faStatus = "Form received";
  audit("Jadu", `Financial form ${id} submitted for ${b.personId}`); redirect(res, "/jadu"); return null;
};
routes["GET /jadu/:id"] = (req, res, m) => {
  const j = S.jadu.find(x => x.id === m.id); if (!j) return page("jadu", "Not found", "<p>Not found</p>");
  return page("jadu", "Submission " + j.id, `<table class="kv"><tr><td>Person</td><td>${esc(person(j.personId)?.name)} (${j.personId})</td></tr><tr><td>Submitted</td><td>${j.submitted}</td></tr><tr><td>Method</td><td>${esc(j.method)}</td></tr>
<tr><td>Total weekly income</td><td>${gbp(j.weeklyIncome)}</td></tr><tr><td>Income sources</td><td>${esc(j.incomeSource)}</td></tr><tr><td>Savings and capital</td><td>${gbp(j.savings)}</td></tr>
<tr><td>Disability benefits</td><td>${esc(j.disabilityBenefit)}</td></tr><tr><td>Weekly housing cost</td><td>${gbp(j.housingCost)}</td></tr><tr><td>Other costs</td><td>${esc(j.otherCosts)}</td></tr><tr><td>Status</td><td>${esc(j.status)}</td></tr></table>
${j.scanFile ? `<h3>Scanned paper form</h3><p>Typed fields above come from keying; the original handwritten form is below. Check that they match.</p><img src="${j.scanFile}" alt="Scanned handwritten financial assessment form" style="max-width:700px;border:1px solid #888">` : ""}`);
};

// Mosaic
routes["GET /mosaic"] = () => page("mosaic", "People", `<table><tr><th>ID</th><th>Name</th><th>Stage</th><th>Eligibility</th><th>Financial assessment</th><th>Direct payment</th><th></th></tr>${S.persons.map(p => `<tr><td>${p.id}</td><td>${esc(p.name)}</td><td>${esc(p.stage)}</td><td>${esc(p.eligibility)}</td><td>${esc(p.faStatus)}</td><td>${esc(p.dpStatus)}${p.dpWeekly ? " " + gbp(p.dpWeekly) + "/wk" : ""}</td><td><a href="/mosaic/${p.id}">Open</a></td></tr>`).join("")}</table>`);
routes["GET /mosaic/:id"] = (req, res, m) => {
  const p = person(m.id); if (!p) return page("mosaic", "Not found", "<p>Not found</p>");
  return page("mosaic", `${p.name} (${p.id})`, `${p.deceased ? `<div class="bad"><b>Deceased: ${p.deceased}</b></div>` : ""}
<table class="kv"><tr><td>Name</td><td>${esc(p.name)}</td></tr><tr><td>Date of birth</td><td>${p.dob}</td></tr><tr><td>Address</td><td>${esc(p.address)}</td></tr><tr><td>Stage</td><td>${esc(p.stage)}</td></tr>
<tr><td>Assessment date</td><td>${p.assessmentDate || "None"}</td></tr><tr><td>Needs summary</td><td>${esc(p.mosaicNeeds) || "<i>empty</i>"}</td></tr><tr><td>Eligibility</td><td>${esc(p.eligibility)}</td></tr><tr><td>Capacity</td><td>${esc(p.capacity)}</td></tr><tr><td>Safeguarding</td><td>${esc(p.safeguarding)}</td></tr>
<tr><td>Financial assessment status</td><td>${esc(p.faStatus)}</td></tr><tr><td>Direct payment status</td><td>${esc(p.dpStatus)}</td></tr><tr><td>Direct payment weekly</td><td>${p.dpWeekly ? gbp(p.dpWeekly) : "None"}</td></tr><tr><td>DP start date</td><td>${p.dpStart || "None"}</td></tr></table>
<h3>Case notes</h3><ul>${p.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>
<h3>Update record</h3><form method="post" action="/mosaic/${p.id}">
<label for="faStatus">Financial assessment status</label><select id="faStatus" name="faStatus">${["Not started", "Form received", "Assessment prepared", "Awaiting approval", "Approved"].map(o => `<option${o === p.faStatus ? " selected" : ""}>${o}</option>`).join("")}</select>
<label for="dpStatus">Direct payment status</label><select id="dpStatus" name="dpStatus">${["Not started", "Requested", "Approved", "Live", "Stopped"].map(o => `<option${o === p.dpStatus ? " selected" : ""}>${o}</option>`).join("")}</select>
<label for="dpWeekly">Direct payment weekly amount (£)</label><input id="dpWeekly" name="dpWeekly" value="${p.dpWeekly || ""}">
<label for="dpStart">Direct payment start date (YYYY-MM-DD)</label><input id="dpStart" name="dpStart" value="${esc(p.dpStart)}">
<label for="note">Add case note</label><textarea id="note" name="note"></textarea>
<button type="submit">Save to Mosaic</button></form>`);
};
routes["POST /mosaic/:id"] = async (req, res, m) => {
  const p = person(m.id), b = await parseBody(req);
  if (p) {
    if (b.faStatus) p.faStatus = b.faStatus; if (b.dpStatus) p.dpStatus = b.dpStatus;
    p.dpWeekly = +b.dpWeekly || 0; p.dpStart = b.dpStart || "";
    if (b.note) p.notes.push(`${DEMO_TODAY}: ${b.note}`);
    if (p.dpStatus === "Live") p.stage = "Direct payment live"; else if (p.faStatus === "Approved") p.stage = "Financial assessment approved";
    audit("Mosaic", `Record ${p.id} updated (FA ${p.faStatus}, DP ${p.dpStatus} ${p.dpWeekly})`);
  }
  redirect(res, "/mosaic/" + m.id); return null;
};

// Abacus
routes["GET /abacus"] = () => page("abacus", "Financial assessments", `<p>Not integrated with Mosaic: details must be keyed or populated separately.</p>
<table><tr><th>ID</th><th>Person</th><th>Weekly income</th><th>Weekly contribution</th><th>Band</th><th>DP weekly</th><th>Status</th><th>Approved by</th><th>Date</th></tr>${S.abacus.map(a => `<tr><td>${a.id}</td><td>${esc(person(a.personId)?.name)} (${a.personId})</td><td>${gbp(a.income)}</td><td>${gbp(a.contribution)}</td><td>${a.band}</td><td>${gbp(a.dpWeekly)}</td><td>${a.status}</td><td>${esc(a.approvedBy)}</td><td>${a.date}</td></tr>`).join("")}</table>
<p><a class="btn" href="/abacus/new">New financial assessment</a></p>`);
routes["GET /abacus/new"] = () => page("abacus", "New financial assessment", `<form method="post" action="/abacus/new">
<label for="personId">Person ID</label><input id="personId" name="personId" value="P-1001">
<label for="income">Total weekly income (£)</label><input id="income" name="income">
<label for="contribution">Assessed weekly contribution (£)</label><input id="contribution" name="contribution">
<label for="band">Needs band</label><select id="band" name="band">${BANDS.map(b => `<option>${b.band}</option>`).join("")}</select>
<label for="dpWeekly">Direct payment weekly amount (£)</label><input id="dpWeekly" name="dpWeekly">
<label for="status">Status</label><select id="status" name="status"><option>Draft</option><option>Awaiting approval</option><option>Approved</option></select>
<label for="approvedBy">Approved by (practitioner or finance officer)</label><input id="approvedBy" name="approvedBy">
<button type="submit">Save assessment</button></form>
<div class="warn">${esc(RULES.note)}</div>`);
routes["POST /abacus/new"] = async (req, res) => {
  const b = await parseBody(req); const id = "A-" + (3001 + S.abacus.length);
  S.abacus.push({ id, personId: b.personId, income: +b.income || 0, contribution: +b.contribution || 0, band: b.band, dpWeekly: +b.dpWeekly || 0, status: b.status, approvedBy: b.approvedBy, date: DEMO_TODAY });
  audit("Abacus", `Assessment ${id} saved for ${b.personId} (${b.status})`); redirect(res, "/abacus"); return null;
};

// Business World
routes["GET /businessworld"] = () => {
  const queued = S.abacus.filter(a => a.status === "Approved" && !S.bw.payees.some(p => p.personId === a.personId));
  return page("bw", "Payees and direct payments", `<div class="warn">Normal route: approved assessments reach Business World through the batch import. Last batch ${S.bw.lastBatch}; next batch ${S.bw.nextBatch}. Records often wait one to three months (about 90 days) before a payee exists and payment can start.</div>
<h3>Queued for batch import (no payee yet)</h3>${queued.length ? `<table><tr><th>Abacus ID</th><th>Person</th><th>DP weekly</th><th>Approved</th><th>Days waiting</th></tr>${queued.map(a => `<tr><td>${a.id}</td><td>${esc(person(a.personId)?.name)}</td><td>${gbp(a.dpWeekly)}</td><td>${a.date}</td><td>${daysBetween(a.date, DEMO_TODAY)}</td></tr>`).join("")}</table>` : "<p>None</p>"}
<h3>Payees</h3><table><tr><th>ID</th><th>Person</th><th>Payee</th><th>Method</th><th>Weekly</th><th>Start</th><th>Status</th><th></th></tr>${S.bw.payees.map(p => `<tr><td>${p.id}</td><td>${esc(person(p.personId)?.name)}</td><td>${esc(p.payee)}</td><td>${esc(p.method)}</td><td>${gbp(p.weekly)}</td><td>${p.start}</td><td>${p.status}</td><td>${p.status === "Active" ? `<form method="post" action="/businessworld/stop/${p.id}" style="margin:0"><button type="submit" style="margin:0;padding:4px 10px">Stop payments</button></form>` : ""}</td></tr>`).join("")}</table>
<p><a class="btn" href="/businessworld/new">Create payee and direct payment now (urgent, outside batch)</a></p>`);
};
routes["GET /businessworld/new"] = () => page("bw", "Create payee and direct payment", `<form method="post" action="/businessworld/new">
<label for="personId">Person ID</label><input id="personId" name="personId" value="P-1001">
<label for="abacusId">Approved Abacus assessment ID</label><input id="abacusId" name="abacusId">
<label for="payee">Payee name</label><input id="payee" name="payee">
<label for="method">Payment method</label><select id="method" name="method"><option>Prepaid card</option><option>Separate bank account</option><option>Suitable person's account</option></select>
<label for="weekly">Weekly amount (£)</label><input id="weekly" name="weekly">
<label for="start">Start date (YYYY-MM-DD)</label><input id="start" name="start" value="${DEMO_TODAY}">
<button type="submit">Create payee</button></form>`);
routes["POST /businessworld/new"] = async (req, res) => {
  const b = await parseBody(req);
  const a = S.abacus.find(x => x.id === b.abacusId);
  if (!a || a.status !== "Approved" || a.personId !== b.personId) {
    return page("bw", "Error", `<div class="bad">Cannot create payee: Abacus assessment ${esc(b.abacusId)} must exist, be Approved and belong to ${esc(b.personId)}.</div><p><a href="/businessworld/new">Back</a></p>`);
  }
  const id = "BW-" + (7001 + S.bw.payees.length);
  S.bw.payees.push({ id, personId: b.personId, payee: b.payee, method: b.method, weekly: +b.weekly || 0, start: b.start, status: "Active", created: DEMO_TODAY });
  audit("Business World", `Payee ${id} created for ${b.personId}, ${gbp(+b.weekly)}/wk from ${b.start}`); redirect(res, "/businessworld"); return null;
};
routes["POST /businessworld/stop/:id"] = (req, res, m) => {
  const p = S.bw.payees.find(x => x.id === m.id); if (p) { p.status = "Stopped"; audit("Business World", `Payments stopped for ${p.id}`); }
  redirect(res, "/businessworld"); return null;
};

// CareCubed + providers
routes["GET /carecubed"] = () => page("carecubed", "Cost and provider lookup", `<h3>Cost bands</h3><table><tr><th>Band</th><th>Need level</th><th>Support hours</th><th>Hourly rate</th><th>Indicative weekly cost</th></tr>${S.careCubed.map(c => `<tr><td>${c.band}</td><td>${c.level}</td><td>${c.range}</td><td>${gbp(c.hourly)}</td><td>${gbp(c.weekly)}</td></tr>`).join("")}</table>
<h3>Providers (Provider Portal)</h3><table><tr><th>ID</th><th>Provider</th><th>Area</th><th>Hourly rate</th><th>Vacancies</th></tr>${S.providers.map(p => `<tr><td>${p.id}</td><td>${esc(p.name)}</td><td>${esc(p.area)}</td><td>${gbp(p.rate)}</td><td>${p.vacancies}</td></tr>`).join("")}</table>`);

// Master spreadsheet
routes["GET /master"] = () => page("master", "Needs bands and contribution rules", `<p>The "master spreadsheet" used to calculate direct payment awards and contributions.</p>
<table><tr><th>Band</th><th>Need level</th><th>Support hours per week</th><th>Maximum weekly direct payment</th></tr>${BANDS.map(b => `<tr><td>${b.band}</td><td>${b.level}</td><td>${b.min} to ${b.max === 99 ? "25+" : b.max}</td><td>${gbp(b.base)}</td></tr>`).join("")}</table>
<h3>Contribution rules</h3><div class="card">${esc(RULES.note)}</div><h3>Worked example</h3><p>Income £300, disability benefit £100, housing £50, other £20: (300 - 100 - 50 - 20 - 250) = -120, so contribution = £0.00.</p>`);

// Spend
function spendAnalysis() {
  return S.bw.payees.filter(p => S.spend[p.personId]).map(p => {
    const rows = S.spend[p.personId]; const spent = rows.reduce((a, r) => a + r.spent, 0); const expected = p.weekly * rows.length;
    const pr = person(p.personId); const flags = [];
    if (pr.deceased && p.status === "Active") flags.push(`DECEASED ${pr.deceased}: payments still active`);
    if (expected && spent / expected < 0.6 && !pr.deceased) flags.push("Under-spend below 60% of award");
    return { p, pr, rows, spent, expected, pct: expected ? Math.round(spent / expected * 100) : 0, flags };
  });
}
routes["GET /spend"] = () => page("spend", "Direct payment spend returns", `<p>Last three weeks of returns (prepaid card, separate account or suitable person's account) against the award.</p>
<table><tr><th>Person</th><th>Payee method</th><th>Weekly award</th><th>Spent (3 wks)</th><th>Expected (3 wks)</th><th>Spend %</th><th>Flags</th></tr>${spendAnalysis().map(a => `<tr><td>${esc(a.pr.name)} (${a.pr.id})</td><td>${esc(a.p.method)}</td><td>${gbp(a.p.weekly)}</td><td>${gbp(a.spent)}</td><td>${gbp(a.expected)}</td><td>${a.pct}%</td><td>${a.flags.length ? a.flags.map(f => `<b>${esc(f)}</b>`).join("<br>") : "None"}</td></tr>`).join("")}</table>`);

// Dashboard
routes["GET /dashboard"] = () => {
  const open = S.persons.filter(p => p.dpStatus !== "Live" && p.eligibility !== "Pending");
  const ex = spendAnalysis().filter(a => a.flags.length);
  return page("dash", "Pathway status and exceptions", `<div class="card"><b>Cases awaiting a live direct payment</b>
<table><tr><th>Person</th><th>Stage</th><th>FA status</th><th>Form received</th><th>Days since form</th></tr>${open.map(p => { const j = S.jadu.find(x => x.personId === p.id); return `<tr><td>${esc(p.name)}</td><td>${esc(p.stage)}</td><td>${esc(p.faStatus)}</td><td>${j ? j.submitted : "-"}</td><td>${j ? daysBetween(j.submitted, DEMO_TODAY) : "-"}</td></tr>`; }).join("") || "<tr><td colspan=5>None</td></tr>"}</table></div>
<div class="card"><b>Exceptions</b>${ex.length ? ex.map(a => `<div class="${a.flags[0].startsWith("DECEASED") ? "bad" : "warn"}">${esc(a.pr.name)}: ${esc(a.flags.join("; "))} (${gbp(a.p.weekly)}/wk)</div>`).join("") : "<p>None</p>"}</div>
<div class="card"><b>Recent activity (audit log)</b><table><tr><th>Time</th><th>System</th><th>Action</th></tr>${S.log.slice(0, 20).map(l => `<tr><td>${l.time}</td><td>${esc(l.system)}</td><td>${esc(l.text)}</td></tr>`).join("") || "<tr><td colspan=3>No activity yet</td></tr>"}</table></div>`);
};
routes["GET /api/state"] = (req, res) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(S, null, 1)); return null; };

const compiled = Object.keys(routes).map(k => { const [method, p] = k.split(" "); return { method, re: new RegExp("^" + p.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "/?$"), fn: routes[k] }; });

http.createServer(async (req, res) => {
  try {
    const url = req.url.split("?")[0];
    if (url.startsWith("/files/")) {
      const f = path.join(__dirname, "files", path.basename(url));
      if (fs.existsSync(f)) { res.writeHead(200, { "Content-Type": "image/png" }); return res.end(fs.readFileSync(f)); }
      res.writeHead(404); return res.end("not found");
    }
    for (const r of compiled) {
      if (r.method !== req.method) continue;
      const m = r.re.exec(url); if (!m) continue;
      const out = await r.fn(req, res, m.groups || {});
      if (out === null) return;
      return send(res, out);
    }
    send(res, page(null, "Not found", "<p>Page not found.</p>"), 404);
  } catch (e) { send(res, page(null, "Error", "<pre>" + esc(e.stack) + "</pre>"), 500); }
}).listen(PORT, () => console.log("LCC demo on " + PORT));
load();
