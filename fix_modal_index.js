const fs = require('fs');

const modalPath = 'c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx';
let modalContent = fs.readFileSync(modalPath, 'utf-8');

modalContent = modalContent.replace(
  "window.open('/dashboard.html?openId=' + data.ticketId, '_blank');",
  "window.open('/?openId=' + data.ticketId, '_blank');"
);

fs.writeFileSync(modalPath, modalContent, 'utf-8');
console.log('Modal.jsx updated to use /?openId=');
