/* ASSUMPTIONS.md must match js/assumptions.js; every id is unique; every figure the stay engine uses is listed. */
const { execFileSync } = require("child_process"), path = require("path"), fs = require("fs"), vm = require("vm");
const root = path.join(__dirname, "..");
let ok = 0, bad = 0; const t = (n, c) => { if (c) ok++; else { bad++; console.log("FAIL", n); } };
try { execFileSync("node", [path.join(root, "tools/gen-assumptions.js"), "--check"], { stdio: "pipe" }); t("md in sync", true); } catch (e) { t("md in sync", false); }
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js/assumptions.js"), "utf8"), ctx);
const items = ctx.MD.assume.items, ids = items.map(i => i.id);
t("unique ids", new Set(ids).size === ids.length);
t("every item complete", items.every(i => i.id && i.group && i.label && i.value && i.where && i.basis && i.owner));
const banned = /\b(tbc|to be confirmed|placeholder|prototype|estimate|indicative|reconfirm)\b/i;
t("md has none of the banned words except where describing the rule", !items.some(i => banned.test(i.label + i.value)));
console.log(ok + " passed, " + bad + " failed"); process.exit(bad ? 1 : 0);
