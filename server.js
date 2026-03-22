const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')

const DB_FILE = path.join(__dirname, 'data', 'brain.db')
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'))

let db = { notes: [], tasks: [] }
try { if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch(e) {}
function save() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)) }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Brain</title>
<style>
/* ── TOKENS ───────────────────────────────────────────── */
:root{
  --bg:#0c0c10; --surface:#111116; --card:#16161d; --card2:#1c1c25;
  --border:#1e1e2a; --border2:#28283a; --border3:#333347;
  --text:#e4e4f0; --muted:#6b6b90; --muted2:#9090b8;
  --accent:#7c6af7; --accent-h:#9f91ff; --accent-low:rgba(124,106,247,.12);
  --green:#22c55e; --green-low:rgba(34,197,94,.12);
  --yellow:#f59e0b; --yellow-low:rgba(245,158,11,.12);
  --red:#ef4444; --red-low:rgba(239,68,68,.12);
  --blue:#3b82f6; --blue-low:rgba(59,130,246,.12);
  --purple:#a855f7; --purple-low:rgba(168,85,247,.12);
  --r:12px; --r-sm:8px; --r-lg:18px;
  --shadow:0 12px 40px rgba(0,0,0,.6);
  --shadow-sm:0 4px 16px rgba(0,0,0,.4);
}
/* ── RESET ────────────────────────────────────────────── */
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;background:var(--bg);color:var(--text);overflow:hidden;font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
button{font-family:inherit;cursor:pointer}
input,textarea,select{font-family:inherit}
*::-webkit-scrollbar{width:5px;height:5px}
*::-webkit-scrollbar-track{background:transparent}
*::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}
/* ── LAYOUT ───────────────────────────────────────────── */
.app{display:grid;grid-template-columns:248px 1fr;height:100vh}
/* ── SIDEBAR ──────────────────────────────────────────── */
.sidebar{background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.sb-head{padding:22px 18px 16px;border-bottom:1px solid var(--border)}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{
  width:36px;height:36px;border-radius:11px;flex-shrink:0;
  background:linear-gradient(135deg,#7c6af7,#c084fc);
  display:flex;align-items:center;justify-content:center;font-size:1.1rem;
  box-shadow:0 4px 14px rgba(124,106,247,.4);
}
.logo-name{font-size:.95rem;font-weight:800;color:#fff;letter-spacing:-.03em}
.logo-tag{font-size:.68rem;color:var(--muted);margin-top:1px}
.sb-search{padding:10px 14px;border-bottom:1px solid var(--border)}
.s-wrap{position:relative}
.s-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;font-size:.8rem}
.s-input{
  width:100%;padding:8px 10px 8px 30px;background:var(--card);
  border:1px solid var(--border);border-radius:var(--r-sm);
  color:var(--text);font-size:.8rem;outline:none;transition:border .18s,box-shadow .18s;
}
.s-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,106,247,.12)}
.s-input::placeholder{color:var(--muted)}
.sb-nav{flex:1;overflow-y:auto;padding:8px}
.nav-group{margin-bottom:18px}
.nav-group-label{font-size:.62rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;padding:0 10px;margin-bottom:5px}
.nav-btn{
  display:flex;align-items:center;gap:9px;width:100%;
  padding:9px 11px;border-radius:var(--r-sm);border:none;background:none;
  color:var(--muted);font-size:.83rem;font-weight:500;text-align:left;
  transition:background .15s,color .15s;position:relative;
}
.nav-btn:hover{background:var(--card);color:var(--text)}
.nav-btn.active{background:var(--accent-low);color:var(--accent);font-weight:600}
.nav-btn.active::before{content:'';position:absolute;left:0;top:22%;bottom:22%;width:3px;border-radius:0 3px 3px 0;background:var(--accent)}
.nav-icon{font-size:.9rem;width:18px;text-align:center;flex-shrink:0}
.nav-badge{margin-left:auto;font-size:.68rem;font-weight:700;padding:1px 7px;border-radius:99px;background:var(--border2);color:var(--muted2)}
.nav-btn.active .nav-badge{background:var(--accent-low);color:var(--accent)}
.sb-foot{padding:12px 14px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer;transition:background .15s;border-radius:0}
.sb-foot:hover{background:var(--card)}
.avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#c084fc);display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:800;color:#fff;flex-shrink:0}
.foot-name{font-size:.8rem;font-weight:700;color:var(--text)}
.foot-sub{font-size:.68rem;color:var(--muted)}
.carlota-dot{margin-left:auto;display:flex;align-items:center;gap:5px;font-size:.68rem;color:var(--green)}
.carlota-dot::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 7px var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
/* ── MAIN ─────────────────────────────────────────────── */
.main{display:flex;flex-direction:column;overflow:hidden}
/* ── TOPBAR ───────────────────────────────────────────── */
.topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:0 26px;height:58px;border-bottom:1px solid var(--border);
  background:var(--bg);flex-shrink:0;
}
.tb-left{display:flex;flex-direction:column;justify-content:center}
.tb-title{font-size:.95rem;font-weight:800;color:#fff;letter-spacing:-.02em}
.tb-sub{font-size:.72rem;color:var(--muted);margin-top:1px}
.tb-right{display:flex;align-items:center;gap:7px}
/* ── BUTTONS ──────────────────────────────────────────── */
.btn{display:inline-flex;align-items:center;gap:5px;padding:8px 15px;border-radius:var(--r-sm);font-size:.78rem;font-weight:700;border:none;transition:all .15s;white-space:nowrap;letter-spacing:.01em}
.btn:active{transform:scale(.96)}
.btn-primary{background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(124,106,247,.3)}
.btn-primary:hover{background:var(--accent-h);box-shadow:0 4px 16px rgba(124,106,247,.45);transform:translateY(-1px)}
.btn-ghost{background:var(--card);color:var(--muted2);border:1px solid var(--border)}
.btn-ghost:hover{background:var(--card2);color:var(--text);border-color:var(--border2)}
.btn-danger{background:var(--red-low);color:var(--red);border:1px solid rgba(239,68,68,.15)}
.btn-danger:hover{background:var(--red);color:#fff;border-color:var(--red)}
.btn-sm{padding:5px 11px;font-size:.73rem}
.btn-xs{padding:3px 8px;font-size:.68rem;border-radius:6px}
.btn-icon{padding:7px;border-radius:var(--r-sm);background:var(--card);border:1px solid var(--border);color:var(--muted2);line-height:1}
.btn-icon:hover{background:var(--card2);color:var(--text);border-color:var(--border2)}
/* ── PAGE ─────────────────────────────────────────────── */
.page{flex:1;overflow-y:auto;padding:26px}
/* page enter animation */
.page-enter{animation:pageIn .22s ease-out}
@keyframes pageIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
/* ── STATS ────────────────────────────────────────────── */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat{
  background:var(--card);border:1px solid var(--border);border-radius:var(--r);
  padding:18px 20px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden;
}
.stat::after{content:'';position:absolute;inset:0;background:var(--accent);opacity:0;transition:opacity .18s}
.stat:hover{border-color:var(--border3);transform:translateY(-2px);box-shadow:var(--shadow-sm)}
.stat:hover::after{opacity:.03}
.stat-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.stat-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:.95rem}
.stat-badge{font-size:.68rem;font-weight:700;padding:3px 8px;border-radius:99px}
.stat-n{font-size:1.9rem;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:1}
.stat-l{font-size:.72rem;color:var(--muted);margin-top:3px;font-weight:500}
.progress{height:3px;background:var(--border2);border-radius:99px;overflow:hidden;margin-top:10px}
.progress-bar{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent),#c084fc);transition:width .5s cubic-bezier(.4,0,.2,1)}
/* ── DASHBOARD GRID ───────────────────────────────────── */
.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.panel{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:20px}
.panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.panel-title{font-size:.82rem;font-weight:700;color:#fff;display:flex;align-items:center;gap:7px}
.panel-count{font-size:.68rem;background:var(--border2);color:var(--muted2);padding:2px 8px;border-radius:99px;font-weight:700}
/* ── NOTE GRID ────────────────────────────────────────── */
.notes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:13px}
.note-card{
  background:var(--card);border:1px solid var(--border);border-radius:var(--r);
  padding:18px;display:flex;flex-direction:column;gap:10px;
  transition:all .18s;position:relative;cursor:default;
}
.note-card:hover{border-color:var(--border3);transform:translateY(-2px);box-shadow:var(--shadow-sm)}
.note-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:var(--r) var(--r) 0 0;opacity:0;transition:opacity .2s;background:var(--tag-color,var(--accent))}
.note-card:hover::before{opacity:1}
.note-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.note-title{font-size:.88rem;font-weight:700;color:#fff;line-height:1.35;flex:1}
.note-menu{display:flex;gap:3px;opacity:0;transition:opacity .15s;flex-shrink:0}
.note-card:hover .note-menu{opacity:1}
.note-body{font-size:.78rem;color:var(--muted2);line-height:1.65;flex:1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.note-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto}
.tag-row{display:flex;gap:4px;flex-wrap:wrap;flex:1}
.tag{font-size:.65rem;font-weight:700;padding:2px 7px;border-radius:6px}
.note-date{font-size:.67rem;color:var(--muted);white-space:nowrap}
/* ── TAG COLORS ───────────────────────────────────────── */
.tc-0{background:rgba(124,106,247,.15);color:#a899ff}
.tc-1{background:rgba(34,197,94,.15);color:#4ade80}
.tc-2{background:rgba(245,158,11,.15);color:#fbbf24}
.tc-3{background:rgba(239,68,68,.15);color:#f87171}
.tc-4{background:rgba(59,130,246,.15);color:#60a5fa}
.tc-5{background:rgba(168,85,247,.15);color:#c084fc}
.tc-6{background:rgba(20,184,166,.15);color:#2dd4bf}
/* ── KANBAN ───────────────────────────────────────────── */
.kanban{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;height:calc(100vh - 120px);overflow:hidden}
.kcol{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);display:flex;flex-direction:column;overflow:hidden;transition:border-color .18s}
.kcol.drag-over{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),inset 0 0 20px rgba(124,106,247,.06)}
.kcol-head{padding:14px 16px 12px;border-bottom:1px solid var(--border);flex-shrink:0}
.kcol-top{display:flex;align-items:center;gap:8px}
.kcol-dot{width:9px;height:9px;border-radius:50%}
.kcol-label{font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;flex:1}
.kcol-count{font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:99px}
.kcol-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.kcol-drop-hint{
  border:2px dashed var(--border3);border-radius:var(--r-sm);
  padding:14px;text-align:center;font-size:.75rem;color:var(--muted);
  opacity:0;transition:opacity .2s;pointer-events:none;
}
.kcol.drag-over .kcol-drop-hint{opacity:1}
.kcol-foot{padding:10px 12px;border-top:1px solid var(--border);flex-shrink:0}
.kcard{
  background:var(--card);border:1px solid var(--border);border-radius:var(--r-sm);
  padding:13px 14px;cursor:grab;transition:all .15s;position:relative;
}
.kcard:hover{border-color:var(--border3);transform:translateY(-1px);box-shadow:var(--shadow-sm)}
.kcard:active{cursor:grabbing;transform:scale(.98)}
.kcard.dragging{opacity:.4}
.kcard-title{font-size:.83rem;font-weight:700;color:#fff;margin-bottom:5px;line-height:1.3}
.kcard-desc{font-size:.74rem;color:var(--muted2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;margin-bottom:8px}
.kcard-foot{display:flex;align-items:center;justify-content:space-between}
.kcard-actions{display:flex;gap:4px;opacity:0;transition:opacity .15s}
.kcard:hover .kcard-actions{opacity:1}
.kcard-meta{display:flex;align-items:center;gap:5px}
/* ── PRIORITY & STATUS CHIPS ──────────────────────────── */
.chip{font-size:.67rem;font-weight:800;padding:2px 8px;border-radius:6px;letter-spacing:.02em}
.chip-high{background:var(--red-low);color:var(--red)}
.chip-medium{background:var(--yellow-low);color:var(--yellow)}
.chip-low{background:var(--border);color:var(--muted2)}
.chip-todo{background:var(--blue-low);color:var(--blue)}
.chip-doing{background:var(--yellow-low);color:var(--yellow)}
.chip-done{background:var(--green-low);color:var(--green)}
/* ── MODAL ────────────────────────────────────────────── */
.overlay{
  position:fixed;inset:0;z-index:200;
  background:rgba(0,0,0,.75);backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;padding:16px;
  opacity:0;pointer-events:none;transition:opacity .2s;
}
.overlay.open{opacity:1;pointer-events:all}
.modal{
  background:var(--card);border:1px solid var(--border3);
  border-radius:var(--r-lg);width:100%;max-width:500px;
  box-shadow:var(--shadow);
  transform:translateY(24px) scale(.96);
  transition:transform .28s cubic-bezier(.34,1.45,.64,1);
}
.overlay.open .modal{transform:translateY(0) scale(1)}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 16px;border-bottom:1px solid var(--border)}
.modal-title{font-size:.95rem;font-weight:800;color:#fff}
.modal-x{width:27px;height:27px;border-radius:8px;border:none;background:var(--border);color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.9rem;transition:all .15s}
.modal-x:hover{background:var(--border2);color:var(--text)}
.modal-body{padding:20px 22px;display:flex;flex-direction:column;gap:15px}
.modal-foot{padding:14px 22px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px}
/* ── FORM ─────────────────────────────────────────────── */
.field label{display:block;font-size:.68rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
.field input,.field textarea,.field select{
  width:100%;background:var(--surface);border:1.5px solid var(--border);
  border-radius:var(--r-sm);padding:10px 13px;color:var(--text);font-size:.85rem;
  outline:none;transition:border .18s,box-shadow .18s;
}
.field input:focus,.field textarea:focus,.field select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,106,247,.14)}
.field input.error,.field textarea.error{border-color:var(--red)!important;box-shadow:0 0 0 3px var(--red-low)!important}
.field input::placeholder,.field textarea::placeholder{color:var(--muted)}
.field textarea{min-height:105px;resize:vertical;line-height:1.65}
.field select option{background:var(--card)}
.field-err{font-size:.72rem;color:var(--red);margin-top:4px;display:none}
.field-err.show{display:block}
.field-hint{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.field-hint label{margin-bottom:0}
.char-count{font-size:.68rem;color:var(--muted)}
.char-count.warn{color:var(--yellow)}
.char-count.over{color:var(--red)}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
/* ── TOAST ────────────────────────────────────────────── */
.toasts{position:fixed;bottom:22px;right:22px;z-index:999;display:flex;flex-direction:column;gap:7px;pointer-events:none}
.toast{
  display:flex;align-items:center;gap:9px;
  background:var(--card);border:1px solid var(--border3);
  border-radius:11px;padding:11px 15px;
  box-shadow:var(--shadow);font-size:.8rem;font-weight:500;
  pointer-events:all;max-width:300px;
  animation:toastIn .25s cubic-bezier(.34,1.45,.64,1);
  transition:opacity .2s,transform .2s;
}
.toast-success{border-left:3px solid var(--green)}
.toast-error{border-left:3px solid var(--red)}
.toast-info{border-left:3px solid var(--accent)}
@keyframes toastIn{from{opacity:0;transform:translateY(14px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
/* ── EMPTY ────────────────────────────────────────────── */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;gap:10px;text-align:center}
.empty-emoji{font-size:2.8rem;opacity:.35;margin-bottom:4px}
.empty-title{font-size:.9rem;font-weight:700;color:var(--muted2)}
.empty-sub{font-size:.77rem;color:var(--muted);max-width:220px;line-height:1.5}
/* ── SPINNER ──────────────────────────────────────────── */
.spin{width:18px;height:18px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:rot .6s linear infinite}
@keyframes rot{to{transform:rotate(360deg)}}
/* ── ROW ITEM (dashboard list) ────────────────────────── */
.row-item{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid var(--border)}
.row-item:last-child{border-bottom:none}
.row-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);flex-shrink:0}
.row-body{flex:1;min-width:0}
.row-title{font-size:.82rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row-sub{font-size:.72rem;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* ── QUICK CHECK ──────────────────────────────────────── */
.qcheck{width:18px;height:18px;border:1.5px solid var(--border2);border-radius:5px;flex-shrink:0;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center}
.qcheck:hover{border-color:var(--green);background:var(--green-low)}
/* ── MOBILE ───────────────────────────────────────────── */
@media(max-width:680px){
  .app{grid-template-columns:1fr}
  .sidebar{display:none}
  .stats-row{grid-template-columns:1fr 1fr}
  .kanban{grid-template-columns:1fr;height:auto}
  .dash-grid{grid-template-columns:1fr}
  .topbar{padding:0 14px}
  .page{padding:14px}
}
</style>
</head>
<body>
<div class="app">

<!-- ── SIDEBAR ─────────────────────────────────────────── -->
<aside class="sidebar">
  <div class="sb-head">
    <div class="logo">
      <div class="logo-mark">🧠</div>
      <div>
        <div class="logo-name">Brain</div>
        <div class="logo-tag">Second Brain · Valois</div>
      </div>
    </div>
  </div>

  <div class="sb-search">
    <div class="s-wrap">
      <span class="s-icon">🔍</span>
      <input class="s-input" id="gsearch" placeholder="Buscar… (⌘K)" oninput="onSearch(this.value)">
    </div>
  </div>

  <nav class="sb-nav">
    <div class="nav-group">
      <div class="nav-group-label">Principal</div>
      <button class="nav-btn active" id="nav-dashboard" onclick="go('dashboard')">
        <span class="nav-icon">⬛</span> Dashboard
      </button>
      <button class="nav-btn" id="nav-notes" onclick="go('notes')">
        <span class="nav-icon">📝</span> Notas
        <span class="nav-badge" id="b-notes">0</span>
      </button>
      <button class="nav-btn" id="nav-tasks" onclick="go('tasks')">
        <span class="nav-icon">✅</span> Tareas
        <span class="nav-badge" id="b-tasks">0</span>
      </button>
    </div>
    <div class="nav-group">
      <div class="nav-group-label">IA</div>
      <button class="nav-btn" onclick="showAIInfo()">
        <span class="nav-icon">🦊</span> Carlota
        <span class="nav-badge" style="background:var(--green-low);color:var(--green)">Online</span>
      </button>
    </div>
  </nav>

  <div class="sb-foot" onclick="showAIInfo()">
    <div class="avatar">V</div>
    <div>
      <div class="foot-name">Valois</div>
      <div class="foot-sub">Founder · MX</div>
    </div>
    <div class="carlota-dot">Carlota activa</div>
  </div>
</aside>

<!-- ── MAIN ────────────────────────────────────────────── -->
<div class="main">
  <header class="topbar">
    <div class="tb-left">
      <div class="tb-title" id="tb-title">Dashboard</div>
      <div class="tb-sub" id="tb-sub">Resumen general</div>
    </div>
    <div class="tb-right" id="tb-actions"></div>
  </header>
  <div class="page" id="page">
    <div style="display:flex;justify-content:center;align-items:center;height:100%">
      <div class="spin"></div>
    </div>
  </div>
</div>
</div>

<!-- ── MODAL ───────────────────────────────────────────── -->
<div class="overlay" id="overlay" onmousedown="overlayClick(event)">
  <div class="modal" id="modal" onmousedown="e=>e.stopPropagation()">
    <div class="modal-head">
      <div class="modal-title" id="m-title">Nuevo</div>
      <button class="modal-x" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" id="m-body"></div>
    <div class="modal-foot" id="m-foot"></div>
  </div>
</div>

<!-- ── TOASTS ──────────────────────────────────────────── -->
<div class="toasts" id="toasts"></div>

<script>
/* ── STATE ───────────────────────────────────────────── */
const S = { notes:[], tasks:[], page:'dashboard', q:'' }
const TAG_COLORS = ['tc-0','tc-1','tc-2','tc-3','tc-4','tc-5','tc-6']
const tagColorMap = {}

/* ── API ─────────────────────────────────────────────── */
async function api(method, action='', body=null){
  const o={method,headers:{'Content-Type':'application/json'}}
  if(body) o.body=JSON.stringify(body)
  const r=await fetch('/api/brain'+(action?'?action='+action:''),o)
  if(!r.ok) throw new Error('Error '+r.status)
  return r.json()
}
async function reload(){
  const [n,t]=await Promise.all([api('GET','notes'),api('GET','tasks')])
  S.notes=n.notes||[]
  S.tasks=t.tasks||[]
  // rebuild tag color map
  S.notes.forEach(n=>{
    (n.tags||'').split(',').forEach((t,i)=>{
      const k=t.trim().toLowerCase()
      if(k && !tagColorMap[k]) tagColorMap[k]=TAG_COLORS[Object.keys(tagColorMap).length % TAG_COLORS.length]
    })
  })
  const active=S.tasks.filter(t=>t.status!=='done').length
  document.getElementById('b-notes').textContent=S.notes.length
  document.getElementById('b-tasks').textContent=active
}

/* ── NAVIGATION ──────────────────────────────────────── */
const META={
  dashboard:{title:'Dashboard',sub:'Resumen general'},
  notes:{title:'Notas',sub:'Base de conocimiento'},
  tasks:{title:'Tareas',sub:'Metodología Kanban'}
}
async function go(page){
  S.page=page
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'))
  const nb=document.getElementById('nav-'+page)
  if(nb) nb.classList.add('active')
  const m=META[page]
  document.getElementById('tb-title').textContent=m.title
  document.getElementById('tb-sub').textContent=m.sub
  document.getElementById('page').innerHTML='<div style="display:flex;justify-content:center;padding:48px"><div class="spin"></div></div>'
  await reload()
  renderPage()
}
function renderPage(){
  const p=document.getElementById('page')
  p.innerHTML=''
  const wrap=document.createElement('div')
  wrap.className='page-enter'
  p.appendChild(wrap)
  const fns={dashboard:renderDash,notes:renderNotes,tasks:renderTasks}
  fns[S.page]?.(wrap)
}

/* ── SEARCH ──────────────────────────────────────────── */
function onSearch(v){ S.q=v.toLowerCase(); renderPage() }

/* ── TIME RELATIVE ───────────────────────────────────── */
function reltime(d){
  const sec=Math.floor((Date.now()-new Date(d))/1000)
  if(sec<60) return 'ahora'
  if(sec<3600) return \`hace \${Math.floor(sec/60)}min\`
  if(sec<86400) return \`hace \${Math.floor(sec/3600)}h\`
  if(sec<604800) return \`hace \${Math.floor(sec/86400)}d\`
  return new Date(d).toLocaleDateString('es-MX',{day:'numeric',month:'short'})
}

/* ── DASHBOARD ───────────────────────────────────────── */
function renderDash(wrap){
  document.getElementById('tb-actions').innerHTML=\`
    <button class="btn btn-ghost btn-sm" onclick="go('notes')">Notas →</button>
    <button class="btn btn-primary btn-sm" onclick="go('tasks')">Tareas →</button>
  \`
  const todo=S.tasks.filter(t=>t.status==='todo').length
  const doing=S.tasks.filter(t=>t.status==='doing').length
  const done=S.tasks.filter(t=>t.status==='done').length
  const total=S.tasks.length
  const pct=total?Math.round(done/total*100):0
  const rn=[...S.notes].reverse().slice(0,4)
  const rt=S.tasks.filter(t=>t.status!=='done').slice(0,4)

  wrap.innerHTML=\`
    <div class="stats-row">
      <div class="stat" onclick="go('notes')" title="Ver notas">
        <div class="stat-top">
          <div class="stat-icon" style="background:var(--accent-low)">📝</div>
          <span class="stat-badge" style="background:var(--accent-low);color:var(--accent)">\${S.notes.length} total</span>
        </div>
        <div class="stat-n">\${S.notes.length}</div>
        <div class="stat-l">Notas</div>
      </div>
      <div class="stat" onclick="go('tasks')" title="Ver por hacer">
        <div class="stat-top">
          <div class="stat-icon" style="background:var(--blue-low)">⬜</div>
          <span class="stat-badge" style="background:var(--blue-low);color:var(--blue)">por hacer</span>
        </div>
        <div class="stat-n">\${todo}</div>
        <div class="stat-l">Pendientes</div>
      </div>
      <div class="stat" onclick="go('tasks')" title="Ver en progreso">
        <div class="stat-top">
          <div class="stat-icon" style="background:var(--yellow-low)">🔄</div>
          <span class="stat-badge" style="background:var(--yellow-low);color:var(--yellow)">en progreso</span>
        </div>
        <div class="stat-n">\${doing}</div>
        <div class="stat-l">En curso</div>
      </div>
      <div class="stat" onclick="go('tasks')" title="Ver completadas">
        <div class="stat-top">
          <div class="stat-icon" style="background:var(--green-low)">✅</div>
          <span class="stat-badge" style="background:var(--green-low);color:var(--green)">\${pct}%</span>
        </div>
        <div class="stat-n">\${done}</div>
        <div class="stat-l">Completadas</div>
        <div class="progress"><div class="progress-bar" style="width:\${pct}%"></div></div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">📝 Notas recientes <span class="panel-count">\${S.notes.length}</span></div>
          <button class="btn btn-ghost btn-xs" onclick="go('notes')">Ver todas →</button>
        </div>
        \${rn.length ? rn.map(n=>\`
          <div class="row-item">
            <div class="row-dot" style="background:var(--accent)"></div>
            <div class="row-body">
              <div class="row-title">\${esc(n.title)}</div>
              <div class="row-sub">\${esc(n.content).slice(0,60)}\${n.content.length>60?'…':''}</div>
            </div>
            <div style="font-size:.68rem;color:var(--muted);flex-shrink:0">\${reltime(n.createdAt)}</div>
          </div>
        \`).join('') : emptyHtml('📝','Sin notas aún','Crea tu primera nota')}
        <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-top:12px" onclick="openNoteModal()">+ Nueva nota</button>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">⚡ Tareas activas <span class="panel-count">\${todo+doing}</span></div>
          <button class="btn btn-ghost btn-xs" onclick="go('tasks')">Ver kanban →</button>
        </div>
        \${rt.length ? rt.map(t=>\`
          <div class="row-item">
            <div class="qcheck" onclick="quickDone('\${t.id}')" title="Marcar completa"></div>
            <div class="row-body">
              <div class="row-title">\${esc(t.title)}</div>
              <div class="row-sub">\${esc(t.description||'').slice(0,50)}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
              <span class="chip chip-\${t.priority}">\${t.priority}</span>
              <span style="font-size:.67rem;color:var(--muted)">\${reltime(t.createdAt)}</span>
            </div>
          </div>
        \`).join('') : emptyHtml('✅','Todo al día','Sin tareas pendientes')}
        <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;margin-top:12px" onclick="openTaskModal()">+ Nueva tarea</button>
      </div>
    </div>
  \`
}

/* ── NOTES ───────────────────────────────────────────── */
function renderNotes(wrap){
  document.getElementById('tb-actions').innerHTML=\`
    <button class="btn btn-primary" onclick="openNoteModal()">
      <span style="font-size:1rem;line-height:1">+</span> Nueva nota
    </button>
  \`
  const q=S.q
  const list=q ? S.notes.filter(n=>n.title.toLowerCase().includes(q)||n.content.toLowerCase().includes(q)) : S.notes
  const sorted=[...list].reverse()

  if(!sorted.length){
    wrap.innerHTML=\`<div class="empty">
      <div class="empty-emoji">📝</div>
      <div class="empty-title">\${q?'Sin resultados para "'+esc(q)+'"':'Sin notas aún'}</div>
      <div class="empty-sub">\${q?'Intenta con otra búsqueda':'Las notas que creas aparecerán aquí'}</div>
      \${!q?'<button class="btn btn-primary" style="margin-top:8px" onclick="openNoteModal()">Crear primera nota</button>':''}
    </div>\`
    return
  }

  wrap.innerHTML=\`<div class="notes-grid">\${sorted.map(n=>{
    const tags=(n.tags||'').split(',').map(t=>t.trim()).filter(Boolean)
    const firstTag=tags[0]?.toLowerCase()
    const accentColor = firstTag && tagColorMap[firstTag] ? getTagHex(tagColorMap[firstTag]) : 'var(--accent)'
    return \`<div class="note-card" style="--tag-color:\${accentColor}">
      <div class="note-top">
        <div class="note-title">\${esc(n.title)}</div>
        <div class="note-menu">
          <button class="btn btn-xs btn-ghost" onclick='openNoteModal(\${JSON.stringify(n).replace(/'/g,"&#39;")})' title="Editar">✏️</button>
          <button class="btn btn-xs btn-danger" onclick="deleteNote('\${n.id}')" title="Eliminar">🗑</button>
        </div>
      </div>
      \${n.content ? \`<div class="note-body">\${esc(n.content)}</div>\` : ''}
      <div class="note-foot">
        <div class="tag-row">
          \${tags.slice(0,4).map((t,i)=>\`<span class="tag \${tagColorMap[t.toLowerCase()]||'tc-0'}">\${esc(t)}</span>\`).join('')}
        </div>
        <div class="note-date">\${reltime(n.createdAt)}</div>
      </div>
    </div>\`
  }).join('')}</div>\`
}

/* ── TASKS KANBAN ────────────────────────────────────── */
function renderTasks(wrap){
  document.getElementById('tb-actions').innerHTML=\`
    <button class="btn btn-primary" onclick="openTaskModal()">
      <span style="font-size:1rem;line-height:1">+</span> Nueva tarea
    </button>
  \`
  const q=S.q
  const list=q ? S.tasks.filter(t=>t.title.toLowerCase().includes(q)) : S.tasks
  const cols=[
    {key:'todo', label:'Por hacer', color:'var(--blue)', count_color:'chip-todo'},
    {key:'doing',label:'En progreso',color:'var(--yellow)',count_color:'chip-doing'},
    {key:'done', label:'Completado', color:'var(--green)', count_color:'chip-done'}
  ]

  wrap.innerHTML=\`<div class="kanban">\${cols.map(col=>{
    const items=list.filter(t=>t.status===col.key)
    return \`<div class="kcol" id="kcol-\${col.key}" ondragover="dragOver(event,'\${col.key}')" ondragleave="dragLeave('\${col.key}')" ondrop="dropTask(event,'\${col.key}')">
      <div class="kcol-head">
        <div class="kcol-top">
          <div class="kcol-dot" style="background:\${col.color}"></div>
          <div class="kcol-label" style="color:\${col.color}">\${col.label}</div>
          <span class="chip \${col.count_color}">\${items.length}</span>
        </div>
      </div>
      <div class="kcol-body">
        \${items.map(t=>\`<div class="kcard" draggable="true" id="kcard-\${t.id}" ondragstart="dragStart(event,'\${t.id}')">
          <div class="kcard-title">\${esc(t.title)}</div>
          \${t.description?\`<div class="kcard-desc">\${esc(t.description)}</div>\`:''}
          <div class="kcard-foot">
            <div class="kcard-meta">
              <span class="chip chip-\${t.priority}">\${t.priority}</span>
              <span style="font-size:.67rem;color:var(--muted)">\${reltime(t.createdAt)}</span>
            </div>
            <div class="kcard-actions">
              \${col.key==='todo'?  \`<button class="btn btn-xs btn-ghost" title="Iniciar" onclick="mvTask('\${t.id}','doing')">▶</button>\`:''}
              \${col.key==='doing'? \`<button class="btn btn-xs btn-ghost" title="Completar" onclick="mvTask('\${t.id}','done')">✓</button>\`:''}
              \${col.key==='done'?  \`<button class="btn btn-xs btn-ghost" title="Reabrir" onclick="mvTask('\${t.id}','todo')">↩</button>\`:''}
              <button class="btn btn-xs btn-ghost" title="Editar" onclick='openTaskModal(\${JSON.stringify(t).replace(/'/g,"&#39;")})'>✏️</button>
              <button class="btn btn-xs btn-danger" title="Eliminar" onclick="deleteTask('\${t.id}')">🗑</button>
            </div>
          </div>
        </div>\`).join('')}
        <div class="kcol-drop-hint">Suelta aquí para mover</div>
      </div>
      \${items.length===0 && !q ? \`<div class="kcol-foot"><button class="btn btn-ghost btn-xs" style="width:100%;justify-content:center" onclick="openTaskModal(null,'\${col.key}')">+ Añadir</button></div>\` : ''}
    </div>\`
  }).join('')}</div>\`
}

/* ── NOTE MODAL ──────────────────────────────────────── */
function openNoteModal(note=null){
  document.getElementById('m-title').textContent = note?'Editar nota':'Nueva nota'
  document.getElementById('m-body').innerHTML=\`
    <div class="field">
      <label>Título *</label>
      <input id="fi-title" value="\${note?esc(note.title):''}" placeholder="Ej: Insight sobre Ortopedia…" maxlength="120">
      <div class="field-err" id="err-title">El título es requerido</div>
    </div>
    <div class="field">
      <div class="field-hint">
        <label>Contenido</label>
        <span class="char-count" id="cc-content">0 / 2000</span>
      </div>
      <textarea id="fi-content" placeholder="Escribe tu nota aquí…" maxlength="2000" oninput="updateCC('cc-content',this,2000)">\${note?esc(note.content):''}</textarea>
    </div>
    <div class="field">
      <label>Tags (separados por coma)</label>
      <input id="fi-tags" value="\${note?esc(note.tags||''):''}" placeholder="idea, estrategia, proyecto…">
    </div>
  \`
  document.getElementById('m-foot').innerHTML=\`
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" id="m-submit" onclick="\${note?\`saveNote('\${note.id}')\`:'createNote()'}">
      \${note?'Guardar cambios':'Crear nota'}
    </button>
  \`
  openModal()
  // init char count
  const ta=document.getElementById('fi-content')
  if(ta.value) updateCC('cc-content',ta,2000)
}

/* ── TASK MODAL ──────────────────────────────────────── */
function openTaskModal(task=null, defStatus='todo'){
  const status=task?task.status:defStatus
  document.getElementById('m-title').textContent = task?'Editar tarea':'Nueva tarea'
  document.getElementById('m-body').innerHTML=\`
    <div class="field">
      <label>Título *</label>
      <input id="fi-title" value="\${task?esc(task.title):''}" placeholder="Ej: Revisar inventario Ortopedia…" maxlength="120">
      <div class="field-err" id="err-title">El título es requerido</div>
    </div>
    <div class="field">
      <div class="field-hint">
        <label>Descripción</label>
        <span class="char-count" id="cc-desc">0 / 500</span>
      </div>
      <textarea id="fi-desc" placeholder="Detalles opcionales…" maxlength="500" oninput="updateCC('cc-desc',this,500)">\${task?esc(task.description||''):''}</textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Prioridad</label>
        <select id="fi-prio">
          <option value="high" \${(task?.priority||'medium')==='high'?'selected':''}>🔴 Alta</option>
          <option value="medium" \${(task?.priority||'medium')==='medium'?'selected':''}>🟡 Media</option>
          <option value="low" \${(task?.priority||'medium')==='low'?'selected':''}>⚪ Baja</option>
        </select>
      </div>
      <div class="field">
        <label>Estado</label>
        <select id="fi-status">
          <option value="todo" \${status==='todo'?'selected':''}>⬜ Por hacer</option>
          <option value="doing" \${status==='doing'?'selected':''}>🔄 En progreso</option>
          <option value="done" \${status==='done'?'selected':''}>✅ Completada</option>
        </select>
      </div>
    </div>
  \`
  document.getElementById('m-foot').innerHTML=\`
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" id="m-submit" onclick="\${task?\`saveTask('\${task.id}')\`:'createTask()'}">
      \${task?'Guardar cambios':'Crear tarea'}
    </button>
  \`
  openModal()
  if(task?.description) updateCC('cc-desc',document.getElementById('fi-desc'),500)
}

/* ── CHAR COUNTER ────────────────────────────────────── */
function updateCC(id,el,max){
  const n=el.value.length
  const span=document.getElementById(id)
  span.textContent=\`\${n} / \${max}\`
  span.className='char-count'+(n>max*.9?' warn':'')+(n>=max?' over':'')
}

/* ── FORM VALIDATION ─────────────────────────────────── */
function validateTitle(){
  const el=document.getElementById('fi-title')
  const err=document.getElementById('err-title')
  if(!el.value.trim()){
    el.classList.add('error')
    err.classList.add('show')
    el.focus()
    return false
  }
  el.classList.remove('error')
  err.classList.remove('show')
  return true
}

/* ── CRUD NOTES ──────────────────────────────────────── */
async function createNote(){
  if(!validateTitle()) return
  setBtnLoading('m-submit',true)
  try{
    await api('POST','',{type:'note',title:document.getElementById('fi-title').value.trim(),content:document.getElementById('fi-content').value,tags:document.getElementById('fi-tags').value})
    closeModal(); await reload(); renderPage(); toast('Nota creada','success')
  }catch(e){toast(e.message,'error')}finally{setBtnLoading('m-submit',false)}
}
async function saveNote(id){
  if(!validateTitle()) return
  setBtnLoading('m-submit',true)
  try{
    await api('POST','',{type:'update-note',id,title:document.getElementById('fi-title').value.trim(),content:document.getElementById('fi-content').value,tags:document.getElementById('fi-tags').value})
    closeModal(); await reload(); renderPage(); toast('Nota actualizada','success')
  }catch(e){toast(e.message,'error')}finally{setBtnLoading('m-submit',false)}
}
async function deleteNote(id){
  if(!confirm('¿Eliminar esta nota?')) return
  await api('POST','',{type:'delete-note',id}); await reload(); renderPage(); toast('Nota eliminada','info')
}

/* ── CRUD TASKS ──────────────────────────────────────── */
async function createTask(){
  if(!validateTitle()) return
  setBtnLoading('m-submit',true)
  try{
    await api('POST','',{type:'task',title:document.getElementById('fi-title').value.trim(),description:document.getElementById('fi-desc').value,priority:document.getElementById('fi-prio').value,status:document.getElementById('fi-status').value})
    closeModal(); await reload(); renderPage(); toast('Tarea creada','success')
  }catch(e){toast(e.message,'error')}finally{setBtnLoading('m-submit',false)}
}
async function saveTask(id){
  if(!validateTitle()) return
  setBtnLoading('m-submit',true)
  try{
    await api('POST','',{type:'update-task',id,title:document.getElementById('fi-title').value.trim(),description:document.getElementById('fi-desc').value,priority:document.getElementById('fi-prio').value,status:document.getElementById('fi-status').value})
    closeModal(); await reload(); renderPage(); toast('Tarea actualizada','success')
  }catch(e){toast(e.message,'error')}finally{setBtnLoading('m-submit',false)}
}
async function mvTask(id,status){
  await api('POST','',{type:'update-task',id,status}); await reload(); renderPage()
  toast(status==='done'?'¡Completada! ✅':'Tarea movida','success')
}
async function deleteTask(id){
  if(!confirm('¿Eliminar esta tarea?')) return
  await api('POST','',{type:'delete-task',id}); await reload(); renderPage(); toast('Tarea eliminada','info')
}
async function quickDone(id){
  await api('POST','',{type:'update-task',id,status:'done'}); await reload(); renderPage()
  toast('¡Tarea completada! ✅','success')
}

/* ── DRAG & DROP ─────────────────────────────────────── */
let dragId=null
function dragStart(e,id){
  dragId=id
  e.dataTransfer.effectAllowed='move'
  document.getElementById('kcard-'+id)?.classList.add('dragging')
}
function dragOver(e,col){
  e.preventDefault()
  e.dataTransfer.dropEffect='move'
  document.getElementById('kcol-'+col)?.classList.add('drag-over')
}
function dragLeave(col){ document.getElementById('kcol-'+col)?.classList.remove('drag-over') }
async function dropTask(e,status){
  e.preventDefault()
  document.querySelectorAll('.kcol').forEach(c=>c.classList.remove('drag-over'))
  if(!dragId) return
  document.getElementById('kcard-'+dragId)?.classList.remove('dragging')
  await api('POST','',{type:'update-task',id:dragId,status})
  dragId=null; await reload(); renderPage(); toast('Movida a '+status,'success')
}

/* ── MODAL UTILS ─────────────────────────────────────── */
function openModal(){ document.getElementById('overlay').classList.add('open'); setTimeout(()=>document.getElementById('fi-title')?.focus(),60) }
function closeModal(){ document.getElementById('overlay').classList.remove('open') }
function overlayClick(e){ if(e.target===document.getElementById('overlay')) closeModal() }

/* ── BUTTON LOADING ──────────────────────────────────── */
function setBtnLoading(id,on){
  const b=document.getElementById(id)
  if(!b) return
  if(on){ b._txt=b.textContent; b.innerHTML='<div class="spin" style="width:14px;height:14px;border-width:2px"></div>'; b.disabled=true }
  else{ b.textContent=b._txt; b.disabled=false }
}

/* ── AI INFO ─────────────────────────────────────────── */
function showAIInfo(){
  document.getElementById('m-title').textContent='🦊 Carlota'
  document.getElementById('m-body').innerHTML=\`
    <div style="background:var(--accent-low);border:1px solid rgba(124,106,247,.2);border-radius:var(--r-sm);padding:16px;margin-bottom:16px">
      <div style="font-weight:700;color:var(--accent);margin-bottom:6px">Tu asistente ejecutiva está activa</div>
      <div style="font-size:.8rem;color:var(--muted2);line-height:1.6">
        Carlota puede guardar notas aquí, crear tareas desde conversaciones, y consultar tu brain para darte contexto personalizado.
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;font-size:.82rem">
      <div style="padding:10px;background:var(--surface);border-radius:var(--r-sm)">
        <div style="font-weight:700;color:#fff;margin-bottom:3px">📝 Guardar notas</div>
        <code style="color:var(--muted2);font-size:.75rem">POST /api/brain  {"type":"note","title":"…","content":"…"}</code>
      </div>
      <div style="padding:10px;background:var(--surface);border-radius:var(--r-sm)">
        <div style="font-weight:700;color:#fff;margin-bottom:3px">✅ Crear tareas</div>
        <code style="color:var(--muted2);font-size:.75rem">POST /api/brain  {"type":"task","title":"…","priority":"high"}</code>
      </div>
      <div style="padding:10px;background:var(--surface);border-radius:var(--r-sm)">
        <div style="font-weight:700;color:#fff;margin-bottom:3px">📊 Consultar estado</div>
        <code style="color:var(--muted2);font-size:.75rem">GET /api/brain?action=stats</code>
      </div>
    </div>
  \`
  document.getElementById('m-foot').innerHTML=\`<button class="btn btn-primary" onclick="closeModal()">Entendido</button>\`
  openModal()
}

/* ── TOAST ───────────────────────────────────────────── */
function toast(msg,type='info'){
  const icons={success:'✅',error:'❌',info:'💡'}
  const el=document.createElement('div')
  el.className=\`toast toast-\${type}\`
  el.innerHTML=\`<span>\${icons[type]}</span><span>\${msg}</span>\`
  document.getElementById('toasts').appendChild(el)
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(8px)'; setTimeout(()=>el.remove(),220) },2600)
}

/* ── EMPTY HTML ──────────────────────────────────────── */
function emptyHtml(emoji,title,sub){
  return \`<div class="empty" style="padding:24px 10px"><div class="empty-emoji">\${emoji}</div><div class="empty-title">\${title}</div><div class="empty-sub">\${sub}</div></div>\`
}

/* ── HELPERS ─────────────────────────────────────────── */
function esc(s=''){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function getTagHex(cls){
  const map={'tc-0':'#a899ff','tc-1':'#4ade80','tc-2':'#fbbf24','tc-3':'#f87171','tc-4':'#60a5fa','tc-5':'#c084fc','tc-6':'#2dd4bf'}
  return map[cls]||'var(--accent)'
}

/* ── KEYBOARD ────────────────────────────────────────── */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') closeModal()
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){ e.preventDefault(); document.getElementById('gsearch').focus() }
  if((e.metaKey||e.ctrlKey)&&e.key==='n'&&!document.getElementById('overlay').classList.contains('open')){
    e.preventDefault()
    if(S.page==='notes') openNoteModal()
    else if(S.page==='tasks') openTaskModal()
    else go('notes').then(()=>openNoteModal())
  }
})

/* ── INIT ────────────────────────────────────────────── */
go('dashboard')
</script>
</body>
</html>`

const server = http.createServer((req, res) => {
  const p = url.parse(req.url, true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  if (p.pathname === '/api/brain') {
    if (req.method === 'GET') {
      const action = p.query.action || 'stats'
      res.writeHead(200, { 'Content-Type': 'application/json' })
      if (action === 'notes') return res.end(JSON.stringify({ notes: db.notes }))
      if (action === 'tasks') return res.end(JSON.stringify({ tasks: db.tasks }))
      return res.end(JSON.stringify({ status: 'ok', stats: {
        notes: db.notes.length, tasks: db.tasks.length,
        tasksByStatus: {
          todo:  db.tasks.filter(t => t.status === 'todo').length,
          doing: db.tasks.filter(t => t.status === 'doing').length,
          done:  db.tasks.filter(t => t.status === 'done').length
        }
      }}))
    }
    if (req.method === 'POST') {
      let body = ''
      req.on('data', c => body += c)
      req.on('end', () => {
        try {
          const d = JSON.parse(body)
          res.setHeader('Content-Type', 'application/json')
          if (d.type === 'note') {
            const n = { id: uid(), title: d.title, content: d.content||'', tags: d.tags||'', createdAt: new Date().toISOString() }
            db.notes.push(n); save(); res.writeHead(200); return res.end(JSON.stringify({ success: true, note: n }))
          }
          if (d.type === 'update-note') {
            const n = db.notes.find(x => x.id === d.id)
            if (n) { if(d.title) n.title=d.title; if(d.content!==undefined) n.content=d.content; if(d.tags!==undefined) n.tags=d.tags; n.updatedAt=new Date().toISOString(); save() }
            res.writeHead(200); return res.end(JSON.stringify({ success: true }))
          }
          if (d.type === 'delete-note') {
            db.notes = db.notes.filter(x => x.id !== d.id); save(); res.writeHead(200); return res.end(JSON.stringify({ success: true }))
          }
          if (d.type === 'task') {
            const t = { id: uid(), title: d.title, description: d.description||'', status: d.status||'todo', priority: d.priority||'medium', createdAt: new Date().toISOString() }
            db.tasks.push(t); save(); res.writeHead(200); return res.end(JSON.stringify({ success: true, task: t }))
          }
          if (d.type === 'update-task') {
            const t = db.tasks.find(x => x.id === d.id)
            if (t) { if(d.status) t.status=d.status; if(d.title) t.title=d.title; if(d.description!==undefined) t.description=d.description; if(d.priority) t.priority=d.priority; t.updatedAt=new Date().toISOString(); save() }
            res.writeHead(200); return res.end(JSON.stringify({ success: true }))
          }
          if (d.type === 'delete-task') {
            db.tasks = db.tasks.filter(x => x.id !== d.id); save(); res.writeHead(200); return res.end(JSON.stringify({ success: true }))
          }
          res.writeHead(400); res.end(JSON.stringify({ error: 'Unknown type' }))
        } catch(e) { res.writeHead(400); res.end(JSON.stringify({ error: e.message })) }
      })
      return
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(HTML)
})

server.listen(8080, '0.0.0.0', () => {
  console.log('🧠 Brain server running at http://0.0.0.0:8080')
  console.log('🌐 Access from Mac Mini: http://100.127.96.25:8080')
})
