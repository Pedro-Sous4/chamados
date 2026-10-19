const fs = require('fs');
let c = fs.readFileSync('c:/chamados/site/public/index.html', 'utf-8');

const regex = /if \(root\) \{\s*if \(root\.lideranca\) _allColabs\.push\(\.\.\.root\.lideranca\);\s*if \(root\.setores\) \{\s*root\.setores\.forEach\(s => \{\s*if \(s\.colaboradores\) _allColabs\.push\(\.\.\.s\.colaboradores\);\s*if \(s\.subsetores\) \{\s*s\.subsetores\.forEach\(sub => \{\s*if \(sub\.colaboradores\) _allColabs\.push\(\.\.\.sub\.colaboradores\);\s*\}\);\s*\}\s*\}\);\s*\}\s*\}/;

const replacement = `if (root) {
          if (root.lideranca) _allColabs.push(...root.lideranca);
          const extractDeep = (sectors) => {
             if (!sectors) return;
             sectors.forEach(s => {
                if (s.colaboradores) _allColabs.push(...s.colaboradores);
                if (s.subsetores) extractDeep(s.subsetores);
             });
          };
          extractDeep(root.setores);
        }`;

c = c.replace(regex, replacement);
fs.writeFileSync('c:/chamados/site/public/index.html', c, 'utf-8');
console.log('Fixed index.html recursive extraction');
