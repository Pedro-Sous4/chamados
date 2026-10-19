const fs = require('fs');

// 1. Update App.jsx to load tickets
let appContent = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', 'utf-8');
if (!appContent.includes('const [tickets, setTickets]')) {
  appContent = appContent.replace(
    /const \[data, setData\] = useState\(null\);/,
    "const [data, setData] = useState(null);\n  const [tickets, setTickets] = useState([]);"
  );
  
  appContent = appContent.replace(
    /const json = await res\.json\(\);\n\s*setData\(json\);/,
    `const json = await res.json();
      setData(json);
      try {
        const resTickets = await fetch('/api/tickets');
        const jsonTickets = await resTickets.json();
        setTickets(jsonTickets);
      } catch (err) {}`
  );
  
  // Pass tickets to OrgChart and Modal
  appContent = appContent.replace(
    /<OrgChart data=\{data\}/,
    "<OrgChart tickets={tickets} data={data}"
  );
  
  appContent = appContent.replace(
    /<Modal colaborador=\{selectedColaborador\} onClose=\{handleCloseModal\} \/>/,
    "<Modal colaborador={selectedColaborador} onClose={handleCloseModal} tickets={tickets} />"
  );
  
  // Fix search to remove case-sensitivity issues and make it robust
  appContent = appContent.replace(
    /if \(c\.dataset\.name && c\.dataset\.name\.toLowerCase\(\)\.includes\(term\.toLowerCase\(\)\)\) \{/,
    "if (c.dataset.name && term && c.dataset.name.toLowerCase().includes(term.toLowerCase())) {"
  );
  
  fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', appContent, 'utf-8');
}


// 2. Update OrgChart.jsx to pass tickets to Card and fix Megaphone regex
let orgContent = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', 'utf-8');
orgContent = orgContent.replace(
  /const OrgChart = \(\{ data/,
  "const OrgChart = ({ tickets, data"
);

// Fix regex typo
orgContent = orgContent.replace(/\\D\/g/g, '\\\\D/g');
orgContent = orgContent.replace(/\/D\/g/g, '\\\\D/g');

orgContent = orgContent.replace(
  /<Card colaborador=\{colab\} onClick=\{onSelect\} isAdmin=\{isAdmin\} \/>/g,
  "<Card colaborador={colab} onClick={onSelect} isAdmin={isAdmin} tickets={tickets} />"
);

orgContent = orgContent.replace(
  /<Card key=\{lider\.id\} colaborador=\{lider\} onClick=\{onSelect\} isCenter=\{true\} isAdmin=\{isAdmin\} \/>/g,
  "<Card key={lider.id} colaborador={lider} onClick={onSelect} isCenter={true} isAdmin={isAdmin} tickets={tickets} />"
);

// Add visual bot status if possible or just better error
orgContent = orgContent.replace(
  /fetch\('\/api\/bot\/broadcast'[\s\S]*?\.catch\(\(\) => alert\('Erro ao enviar\.'\)\);/,
  `fetch('/api/bot/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefones: allPhones, mensagem: msg })
    }).then(r => r.json()).then(res => {
      if (res.ok) alert('Mensagem disparada para a fila do Bot! (Se o bot estiver rodando, eles receberão em breve)');
      else alert('Erro: ' + res.error);
    }).catch(() => alert('Erro de conexão ao enviar.'));`
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', orgContent, 'utf-8');

// 3. Update Card.jsx to blink if there is an open ticket
let cardContent = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Card.jsx', 'utf-8');
if (!cardContent.includes('const hasOpenTicket')) {
  cardContent = cardContent.replace(
    /const Card = \(\{ colaborador, onClick, isCenter = false, isAdmin = false \}\) => \{/,
    "const Card = ({ colaborador, onClick, isCenter = false, isAdmin = false, tickets = [] }) => {"
  );
  
  cardContent = cardContent.replace(
    /const handleDragStart = \(e\) => \{/,
    `const hasOpenTicket = tickets.some(t => {
      if (t.status === 'concluido' || t.status === 'cancelado') return false;
      const colabTel = String(colaborador.telefone || '').replace(/\\D/g, '');
      const tNum = String(t.number || '').replace(/\\D/g, '');
      if (!colabTel || !tNum) return false;
      return tNum.endsWith(colabTel) || colabTel.endsWith(tNum);
    });\n\n  const handleDragStart = (e) => {`
  );
  
  cardContent = cardContent.replace(
    /className=\{\`colab-card relative group/,
    "className={`colab-card relative group ${hasOpenTicket ? 'animate-pulse ring-4 ring-red-500 rounded-lg' : ''}"
  );
  
  fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Card.jsx', cardContent, 'utf-8');
}


console.log('Fixed App, OrgChart, Card');
