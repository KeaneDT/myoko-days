/* Writes ASSUMPTIONS.md from js/assumptions.js (and the rate table from js/stay.js).
   node tools/gen-assumptions.js          writes ../ASSUMPTIONS.md
   node tools/gen-assumptions.js --check  exits 1 if ASSUMPTIONS.md is out of date */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
["js/assumptions.js", "js/stay.js"].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f }));
const MD = ctx.MD, items = MD.assume.items, A = MD.assume.v, S = MD.stay;

const esc = s => String(s).replace(/\|/g, "\\|");
const yen = n => "¥" + n.toLocaleString("en-US");
const groups = ["Stay", "Getting around", "Activities", "Map", "Copy"];
const blurb = {
  "Stay": "Room rates are modelled, not quoted. They are priced by the night of arrival, per room, and change with the season and the day of the week.",
  "Getting around": "Transport figures used to total a trip.",
  "Activities": "Prices, meeting points and hosts that were not published when the activities were researched.",
  "Map": "How the diorama draws the valley.",
  "Copy": "Wording that describes rather than reports."
};

let out = `# Myoko Days: assumptions

Every figure or detail on the site that was set by the team, rather than published by an operator, is listed here. They all live in one file, \`js/assumptions.js\`, so they can be reviewed and replaced in a single edit. This document is generated from that file (\`node tools/gen-assumptions.js\`); change the numbers there, not here.

`;
groups.forEach(g => {
  const rows = items.filter(i => i.group === g); if (!rows.length) return;
  out += `## ${g}\n\n${blurb[g]}\n\n| ID | Assumption | Value | Used in | Basis | To confirm with |\n|---|---|---|---|---|---|\n`;
  rows.forEach(r => { out += `| ${r.id} | ${esc(r.label)} | ${esc(r.value)} | ${esc(r.where)} | ${esc(r.basis)} | ${esc(r.owner)} |\n`; });
  out += "\n";
  if (g === "Stay") {
    const cols = [["Weeknight (Tue)", "2027-09-14"], ["Saturday", "2027-09-11"], ["Holiday-weekend Sunday", "2027-09-19"], ["Obon Sunday", "2027-08-15"], ["Obon Friday", "2027-08-13"], ["Autumn colour Tuesday", "2027-10-12"]];
    out += `### Worked examples (per room, per night, in yen)\n\n| Night | ${cols.map(c => c[0]).join(" | ")} |\n|---|${cols.map(() => "---:").join("|")}|\n`;
    ["madarao", "lime", "sixsenses"].forEach(k => { out += `| ${S.OPTIONS[k].name} | ${cols.map(c => yen(S.nightRate(k, c[1]).rate)).join(" | ")} |\n`; });
    out += `\nThe dates are examples of how the rule behaves, not offers. A trip of N days is N − 1 nights, each priced by its own arrival date; rooms = party ÷ 2, rounded up.\n\n`;
  }
});
out += `## Changing a number

1. Edit \`js/assumptions.js\` (values in \`v\`, wording in \`items\`).
2. Run \`node tools/gen-assumptions.js\` to refresh this file.
3. Run \`node verification/test-stay.cjs\` and \`node verification/test-assumptions.cjs\`.
`;
const file = path.join(root, "ASSUMPTIONS.md");
if (process.argv.includes("--check")) {
  const cur = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (cur !== out) { console.error("ASSUMPTIONS.md is out of date: run node tools/gen-assumptions.js"); process.exit(1); }
  console.log("ASSUMPTIONS.md is up to date");
} else { fs.writeFileSync(file, out); console.log("wrote", file, out.length + " chars"); }
