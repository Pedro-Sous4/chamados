const fs = require('fs');
let html = fs.readFileSync('c:/chamados/site/public/index.html', 'utf-8');

// Insert a warning bar inside det-chat-wrapper
const warningBar = `
          <!-- Bot Warning Bar -->
          <div id="bot-warning-bar" class="hidden flex items-center justify-between bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold px-3 py-2 rounded-lg mb-2 shadow-sm">
             <div class="flex items-center gap-2">
                <i data-lucide="bot-off" class="w-4 h-4 text-yellow-600"></i>
                <span>Robô Desativado para este chat. Você está no controle.</span>
             </div>
             <button onclick="document.getElementById('btn-concluir').click()" class="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 border border-yellow-400 px-2 py-1 rounded text-[10px] uppercase cursor-pointer transition-colors">
                Reativar (Encerrar)
             </button>
          </div>
          <div id="det-chat-container"`;

html = html.replace(/<div id="det-chat-container"/, warningBar);

// Show the warning bar if ticket is em_atendimento and isWpp
const showWarningLogic = `
      const isWpp = ticket.origem !== 'site';
      
      const botWarningBar = document.getElementById('bot-warning-bar');
      if (botWarningBar) {
         if (ticket.status === 'em_atendimento' && isWpp) {
            botWarningBar.classList.remove('hidden');
         } else {
            botWarningBar.classList.add('hidden');
         }
      }

      if ((ticket.conversa && ticket.conversa.length > 0) || isWpp) {
`;

html = html.replace(/const isWpp = ticket\.origem !== 'site';\s*if \(\(ticket\.conversa/, showWarningLogic);

fs.writeFileSync('c:/chamados/site/public/index.html', html, 'utf-8');
console.log('Added bot warning bar');
