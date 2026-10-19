const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', 'utf-8');

c = c.replace(
  /const SectorNode = \(\{ s \}\) => \{/,
  `const handleBroadcast = (e, s) => {
    e.stopPropagation();
    const msg = window.prompt(\`Digite a mensagem para enviar via WhatsApp para todos do setor "\${s.nome}":\`);
    if (!msg || msg.trim() === '') return;
    
    const getPhones = (sector) => {
      let phones = [];
      if (sector.colaboradores) {
        sector.colaboradores.forEach(c => {
          if (c.telefone) phones.push(c.telefone.replace(/\D/g, ''));
        });
      }
      if (sector.subsetores) {
        sector.subsetores.forEach(sub => {
          phones = phones.concat(getPhones(sub));
        });
      }
      return phones;
    };
    
    const allPhones = getPhones(s);
    if (allPhones.length === 0) {
      alert('Nenhum colaborador com telefone cadastrado neste setor ou subsetores.');
      return;
    }
    
    if (!window.confirm(\`Enviar mensagem para \${allPhones.length} colaborador(es)?\`)) return;

    fetch('/api/bot/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefones: allPhones, mensagem: msg })
    }).then(() => alert('Mensagem disparada para a fila do Bot!'))
      .catch(() => alert('Erro ao enviar.'));
  };

  const SectorNode = ({ s }) => {`
);

c = c.replace(
  /<button onClick=\{\(e\) => \{ e\.stopPropagation\(\); if \(onDeleteSector\) onDeleteSector\(s\.nome\); \}\} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir Setor">[\s\S]*?<\/button>/,
  `$&
                <button onClick={(e) => handleBroadcast(e, s)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Aviso para o Setor (WhatsApp)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
                </button>`
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', c, 'utf-8');
console.log('Fixed OrgChart.jsx');
