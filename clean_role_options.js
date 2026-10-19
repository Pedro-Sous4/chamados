const fs = require('fs');
let s = fs.readFileSync('site/public/index.html', 'utf8');
const target = `<select id="lgn-role" class="px-3 py-2 border rounded-lg text-sm outline-none focus:border-brand-400">`;
const endTarget = `</select>`;
const i1 = s.indexOf(target);
const i2 = s.indexOf(endTarget, i1);
if (i1 !== -1 && i2 !== -1) {
  const replacement = `<select id="lgn-role" class="px-3 py-2 border rounded-lg text-sm outline-none focus:border-brand-400">
            <option value="usuario">👤 Usuário</option>
            <option value="supervisor">💼 Supervisor</option>
            <option value="administrador">🛡️ Administrador</option>
          </select>`;
  s = s.slice(0, i1) + replacement + s.slice(i2 + endTarget.length);
  fs.writeFileSync('site/public/index.html', s, 'utf8');
  console.log('Successfully replaced role options!');
} else {
  console.log('Target not found:', i1, i2);
}
