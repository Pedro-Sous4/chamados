const fs = require('fs');
let c = fs.readFileSync('c:/chamados/site/server.js', 'utf-8');

const regex = /if \(root\) \{\s*allColaboradores = \[\.\.\.\(root\.lideranca \|\| \[\]\)\];\s*\(root\.setores \|\| \[\]\)\.forEach\(s => \{\s*allColaboradores\.push\(\.\.\.\(s\.colaboradores \|\| \[\]\)\);\s*\(s\.subsetores \|\| \[\]\)\.forEach\(sub => allColaboradores\.push\(\.\.\.\(sub\.colaboradores \|\| \[\]\)\)\);\s*\}\);\s*\}/;

const replacement = `if (root) {
        allColaboradores = [...(root.lideranca || [])];
        const extractDeep = (sectors) => {
          if (!sectors) return;
          sectors.forEach(s => {
            if (s.colaboradores) allColaboradores.push(...s.colaboradores);
            if (s.subsetores) extractDeep(s.subsetores);
          });
        };
        extractDeep(root.setores);
      }`;

c = c.replace(regex, replacement);
fs.writeFileSync('c:/chamados/site/server.js', c, 'utf-8');
console.log('Fixed server.js recursive extraction');
