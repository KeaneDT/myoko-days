const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/fieldnotes.js'),'utf8');
// Each chapter can be hidden independently. SVG filters must stay in the same
// SVG as their consumers; a filter in a hidden sibling can suppress whole layers.
for(const name of ['landscape','horse']){
  const match=source.match(new RegExp('const '+name+' = \\x60([\\s\\S]*?)\\x60;'));
  assert.ok(match,'Missing illustration '+name);
  const svg=match[1],ids=new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
  for(const ref of svg.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.has(ref[1]),name+' refers to a definition outside its own SVG: '+ref[1]);
}
console.log('PASS journal illustrations retain all referenced filters and gradients when the other chapter is hidden.');
