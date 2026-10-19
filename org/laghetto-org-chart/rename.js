import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIR = path.join(__dirname, 'public', 'figurinhas');

async function run() {
  console.log('Iniciando OCR das figurinhas...');
  const files = fs.readdirSync(DIR).filter(f => f.startsWith('figurinha_pagina_') && f.endsWith('.png'));
  
  if (files.length === 0) {
    console.log('Nenhuma figurinha para renomear.');
    return;
  }

  const worker = await createWorker('por'); // Portuguese

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(DIR, file);
    try {
      console.log(`Processando [${i+1}/${files.length}]: ${file}`);
      const { data: { text } } = await worker.recognize(filePath);
      
      // Clean and extract name
      // Looking at the example: "BRUNO\nPOSSEBON\nSEM CONTRATO NÃO TEM JOGO"
      // Let's grab the biggest/most prominent or just the last few uppercase lines
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      
      // Try to find the name (heuristic: last 2-3 lines before the very small bottom text)
      // Usually the name is all caps, 2 words.
      let possibleName = "desconhecido_" + i;
      
      // Basic heuristic: assume the name is somewhere in the bottom half.
      if (lines.length >= 2) {
         // Get the lines from bottom up. The last line is usually "SEM CONTRATO..." or "COPA LGM..."
         // We'll just grab everything, clean special chars and pick the longest consecutive uppercase lines.
         const cleanLines = lines.filter(l => /^[A-ZÀ-Ú\s]+$/.test(l));
         if (cleanLines.length >= 2) {
            possibleName = cleanLines.slice(-2).join('_').replace(/\s+/g, '_').toLowerCase();
         } else if (cleanLines.length === 1) {
            possibleName = cleanLines[0].replace(/\s+/g, '_').toLowerCase();
         }
      }
      
      // Fallback fallback: just grab the first line if nothing else
      if (possibleName.startsWith('desconhecido') && lines.length > 0) {
        // Just grab the largest text? We don't have bounding boxes easily without detailed output.
        // Let's just use the 2nd to last line.
        possibleName = lines[lines.length - 2].replace(/[^a-zA-ZÀ-Ú ]/g, '').trim().replace(/\s+/g, '_').toLowerCase();
      }

      if (!possibleName || possibleName.length < 3) {
        possibleName = "desconhecido_" + i;
      }

      // Avoid duplicates
      let newName = `${possibleName}.png`;
      let counter = 1;
      while (fs.existsSync(path.join(DIR, newName))) {
        newName = `${possibleName}_${counter}.png`;
        counter++;
      }

      fs.renameSync(filePath, path.join(DIR, newName));
      console.log(`-> Renomeado para: ${newName}`);

    } catch (e) {
      console.error(`Erro ao processar ${file}:`, e.message);
    }
  }

  await worker.terminate();
  console.log('Finalizado!');
}

run();
