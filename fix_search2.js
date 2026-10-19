const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', 'utf-8');

c = c.replace(/function App\(\) \{/, "function App() {\n  const [searchTerm, setSearchTerm] = useState('');");

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', c, 'utf-8');
console.log('Fixed App.jsx function definition');
