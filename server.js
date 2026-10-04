const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const DATA_DIR = process.env.DATA_DIR || __dirname;
const FILE = path.join(DATA_DIR, "properties.json");
const PASSWORD = process.env.ADMIN_PASSWORD; // optional login

// --- tiny JSON "database" ---
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return []; } };
const save = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2));

app.use(express.json());

// optional password (browser shows a login box)
if (PASSWORD) {
  app.use((req, res, next) => {
    const pass = Buffer.from((req.headers.authorization || "").split(" ")[1] || "", "base64").toString().split(":")[1];
    if (pass === PASSWORD) return next();
    res.set("WWW-Authenticate", 'Basic realm="Property Manager"').status(401).send("Login required");
  });
}

app.use(express.static(path.join(__dirname, "public")));

// --- API ---
app.get("/api/properties", (req, res) => res.json(load()));

app.post("/api/properties", (req, res) => {
  const list = load();
  const p = { ...req.body, id: Date.now(), t: Date.now() };
  list.push(p); save(list); res.status(201).json(p);
});

app.put("/api/properties/:id", (req, res) => {
  const list = load();
  const i = list.findIndex((p) => p.id == req.params.id);
  if (i < 0) return res.sendStatus(404);
  list[i] = { ...list[i], ...req.body, id: list[i].id };
  save(list); res.json(list[i]);
});

app.delete("/api/properties/:id", (req, res) => {
  save(load().filter((p) => p.id != req.params.id));
  res.sendStatus(204);
});

app.listen(process.env.PORT || 3000, () => console.log("Running"));
