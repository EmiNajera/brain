# 🧠 Brain

**Second Brain** — minimal, zero-dependency Node.js app for AI-assisted note & task management.

Built for [Valois](https://github.com/EmiNajera) + [Carlota](https://openclaw.ai) (AI executive assistant).

---

## ✨ Features

- 📝 **Notes** — create, edit, delete with tags and auto-color coding
- ✅ **Tasks** — full Kanban board (Todo / In Progress / Done) with drag & drop
- 🤖 **AI-ready REST API** — Carlota can read/write your brain automatically
- 💾 **Zero-database** — data stored in a single local JSON file
- ⚡ **Zero dependencies** — pure Node.js, no npm install needed
- 🎨 **Premium dark UI** — modals, toasts, animations, keyboard shortcuts

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/EmiNajera/brain.git
cd brain

# Run
node server.js

# Open
open http://localhost:8080
```

---

## 🌐 Deploy on VPS (with Tailscale)

```bash
# Run on background
nohup node server.js > brain.log 2>&1 &

# Access from any Tailscale device
open http://<your-tailscale-ip>:8080
```

---

## 🔌 REST API

### Get stats
```http
GET /api/brain
GET /api/brain?action=stats
```

### Get notes
```http
GET /api/brain?action=notes
```

### Get tasks
```http
GET /api/brain?action=tasks
```

### Create note
```http
POST /api/brain
Content-Type: application/json

{
  "type": "note",
  "title": "My insight",
  "content": "Details here...",
  "tags": "idea, strategy"
}
```

### Create task
```http
POST /api/brain
Content-Type: application/json

{
  "type": "task",
  "title": "Review inventory",
  "description": "Optional details",
  "priority": "high",
  "status": "todo"
}
```

### Update task status
```http
POST /api/brain
Content-Type: application/json

{
  "type": "update-task",
  "id": "<task-id>",
  "status": "doing"
}
```

### Delete note / task
```http
POST /api/brain
Content-Type: application/json

{ "type": "delete-note", "id": "<id>" }
{ "type": "delete-task", "id": "<id>" }
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Focus search |
| `⌘N` / `Ctrl+N` | New note or task (context-aware) |
| `Esc` | Close modal |

---

## 📁 Project Structure

```
brain/
├── server.js        # Server + UI (single file)
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── data/
    └── brain.db     # Auto-created, local JSON database
```

---

## 🎨 Customization

Everything lives in `server.js`. Key sections:

- **CSS tokens** (line ~20): colors, spacing, radius
- **HTML structure** (search `const HTML =`)
- **API routes** (search `if (p.pathname === '/api/brain')`)
- **Data model**: notes `{ id, title, content, tags, createdAt }`, tasks `{ id, title, description, status, priority, createdAt }`

---

## 🤝 AI Integration (Carlota)

This Brain is designed to work with [OpenClaw](https://openclaw.ai) and Carlota AI:

```js
// Carlota can save insights automatically
await fetch('http://100.127.96.25:8080/api/brain', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'note',
    title: 'Strategic insight from today',
    content: 'Key decision: ...',
    tags: 'strategy, ortopedia'
  })
})
```

---

## 📄 License

MIT — do whatever you want with it.
