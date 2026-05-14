const https = require('https');
const http = require('http');
const { URL } = require('url');

const API_BASE = (process.env.API_URL || '').replace(/\/$/, '');
const API_KEY = process.env.API_KEY || '';

/**
 * Envia um chamado para o sistema externo via POST /chatbot/chamado.
 * @param {{ telefone: string, tipo: string, descricao: string, status: string }} payload
 * @returns {Promise<{ id?: string|number, [key: string]: any }>} resposta da API
 */
function enviarChamado(payload) {
  return new Promise((resolve, reject) => {
    if (!API_BASE) {
      console.warn('[api] API_URL não configurada — chamado salvo apenas localmente.');
      return resolve({});
    }

    let parsed;
    try {
      parsed = new URL(`${API_BASE}/chamado`);
    } catch {
      return reject(new Error(`API_URL inválida: ${API_BASE}`));
    }

    const body = JSON.stringify(payload);
    const transport = parsed.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': API_KEY,
      },
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({});
          }
        } else {
          reject(new Error(`API retornou status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Busca chamados do sistema externo via GET /chatbot/chamado?
 * @param {{ id?: string|number, status?: string, limit?: number }} params
 * @returns {Promise<{ chamados?: Array, [key: string]: any }>} resposta da API
 */
function buscarChamados(params = {}) {
  return new Promise((resolve, reject) => {
    if (!API_BASE) {
      console.warn('[api] API_URL não configurada');
      return resolve({ chamados: [] });
    }

    const queryString = new URLSearchParams();
    if (params.id) queryString.append('id', params.id);
    if (params.status) queryString.append('status', params.status);
    if (params.limit) queryString.append('limit', params.limit);

    let parsed;
    try {
      const url = `${API_BASE}/chamado${queryString.toString() ? '?' + queryString.toString() : ''}`;
      parsed = new URL(url);
    } catch {
      return reject(new Error(`URL inválida: ${API_BASE}`));
    }

    const transport = parsed.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ chamados: [] });
          }
        } else {
          reject(new Error(`API retornou status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

module.exports = { enviarChamado, buscarChamados };
