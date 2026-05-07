// ==================== TIO WILSON ASSISTENTE DE BET ====================
let currentIcons = new Set();

const DEFAULT_OPENROUTER_KEY = '';
const OPENROUTER_MODEL = 'openrouter/free';

const AI_PROMPT_BASE = `Você é um sharp bettor profissional especializado em value bets e bilhetes de alto retorno na Betano.

Analise os jogos informados no final da instrução considerando:
forma recente, xG/xGA, desfalques, provável escalação, motivação, mando, H2H e contexto da partida.

Objetivo:
Gerar 2 bilhetes agressivos, inteligentes e lucrativos, equilibrando risco e valor esperado.

Mercados permitidos (Criar Aposta Betano):
- Resultado Final
- Dupla Chance
- Handicap Asiático
- Over/Under gols
- Ambas Marcam
- Escanteios
- Cartões
- Chutes
- Mercado de jogadores
- Anytime Goalscorer
- Resultado Exato

Regras:
- Priorize valor, não favoritismo óbvio
- Misture mercados quando fizer sentido
- Evite seleções redundantes ou altamente correlacionadas
- Use mercados de jogadores quando houver valor
- Seja criativo e agressivo conforme o risco solicitado

Quantidade por risco:
- Baixo: 2–4 seleções | odd ~1.80–3.50
- Médio: 4–7 seleções | odd ~4.00–12.00
- Alto: 6–10 seleções | odd 15.00+

Responda APENAS neste formato:

BILHETE 1:
Mercados:
• Seleção 1
• Seleção 2
...
Risco do bilhete:
Odd estimada:

BILHETE 2:
Mercados:
• Seleção 1
• Seleção 2
...
Risco do bilhete:
Odd estimada:`;

// ==================== CONFIGURAÇÃO ====================
async function getConfig() {
  const data = await chrome.storage.sync.get(['provider', 'openai_key', 'openrouter_key']);

  return {
    provider: data.provider || 'openrouter',
    openai_key: data.openai_key || '',
    openrouter_key: data.openrouter_key || DEFAULT_OPENROUTER_KEY
  };
}

async function saveConfig(provider, key) {
  await chrome.storage.sync.set({
    provider: provider,
    [`${provider}_key`]: key
  });
}

// ==================== SETTINGS MODAL ====================
function showSettingsModal() {
  document.getElementById('settings-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'settings-modal';
  modal.style.cssText = `
    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
    width:460px; background:#1f1f1f; color:#fff; border-radius:16px;
    z-index:2147483647; padding:25px; box-shadow:0 20px 50px rgba(0,0,0,0.9);
  `;

  modal.innerHTML = `
    <h3 style="color:#00ff9d">⚙️ Configurar API</h3>

    <label style="display:block;margin:15px 0 5px;">Provedor:</label>
    <select id="provider-select" style="width:100%;padding:12px;background:#333;color:white;border:none;border-radius:8px;margin-bottom:15px;">
      <option value="openai">OpenAI (gpt-4o-mini)</option>
      <option value="openrouter">OpenRouter</option>
    </select>

    <input id="api-input" type="password" placeholder="Cole sua API Key aqui"
      style="width:100%;padding:14px;margin-bottom:15px;border-radius:8px;background:#333;color:white;border:none;">

    <button id="save-api" style="width:100%;padding:15px;background:#00ff9d;color:#000;border:none;border-radius:8px;font-weight:bold;">
      Salvar Configuração
    </button>
    <small style="color:#888;display:block;margin-top:10px;">
      OpenRouter: <a href="https://openrouter.ai/keys" target="_blank" style="color:#00ff9d">openrouter.ai/keys</a><br>
      OpenAI: platform.openai.com/api-keys
    </small>
  `;

  document.body.appendChild(modal);

  const select = document.getElementById('provider-select');
  const input = document.getElementById('api-input');

  getConfig().then(cfg => {
    select.value = cfg.provider;
    input.value = cfg[`${cfg.provider}_key`] || '';
  });

  select.onchange = () => {
    getConfig().then(cfg => input.value = cfg[`${select.value}_key`] || '');
  };

  document.getElementById('save-api').onclick = async () => {
    const provider = select.value;
    const key = input.value.trim();
    if (!key) return alert("Digite a chave da API");
    await saveConfig(provider, key);
    alert(`✅ ${provider.toUpperCase()} salvo!`);
    modal.remove();
  };
}

// ==================== MODAL PRINCIPAL ====================
function showBeautifulModal(gameInfo) {
  document.getElementById('betano-ai-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'betano-ai-modal';
  modal.style.cssText = `
    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
    width:500px; background:#1f1f1f; color:#fff; border-radius:16px;
    z-index:2147483647; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.95);
  `;

  modal.innerHTML = `
    <div style="background:linear-gradient(90deg,#00ff9d,#00cc7a);padding:16px 20px;color:#000;font-weight:700;display:flex;justify-content:space-between;">
      <span>🤖 Tio Wilson Assistente de Bet</span>
      <div>
        <span id="config-btn" style="cursor:pointer;margin-right:15px;">⚙️</span>
        <span id="close-btn" style="cursor:pointer;font-size:26px;">✕</span>
      </div>
    </div>

    <div style="padding:20px;">
      <div style="background:#252525;padding:14px;border-radius:10px;margin-bottom:16px;">
        <strong>${escapeHtml(gameInfo.match)}</strong><br>
        <small>${escapeHtml(gameInfo.time)} • Odds: ${escapeHtml(gameInfo.odds)}</small><br>
        <small>${escapeHtml(gameInfo.championship)}</small>
      </div>

      <select id="risk-level" style="width:100%;padding:12px;background:#252525;color:white;border:none;border-radius:10px;margin-bottom:12px;">
        <option value="Médio">Risco Médio</option>
        <option value="Baixo">Risco Baixo</option>
        <option value="Alto">Risco Alto</option>
      </select>

      <textarea id="user-q" rows="3" placeholder="Pedido adicional opcional" style="width:100%;background:#252525;border:none;border-radius:10px;color:#fff;padding:14px;resize:none;"></textarea>

      <button id="send-q" style="width:100%;margin-top:12px;padding:16px;background:#00ff9d;color:#000;border:none;border-radius:10px;font-weight:bold;font-size:16px;">
        Gerar bilhete rápido
      </button>

      <div id="response-area" style="margin-top:15px;display:none;background:#111;padding:14px;border-radius:10px;max-height:420px;overflow-y:auto;white-space:pre-wrap;font-size:14px;line-height:1.4;"></div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('close-btn').onclick = () => modal.remove();
  document.getElementById('config-btn').onclick = showSettingsModal;
  document.getElementById('send-q').onclick = () => sendToAI(gameInfo);
}

// ==================== ENVIO PARA API ====================
async function sendToAI(gameInfo) {
  const btn = document.getElementById('send-q');
  const extra = document.getElementById('user-q').value.trim();
  const risk = document.getElementById('risk-level').value;
  const responseArea = document.getElementById('response-area');

  const config = await getConfig();
  const rawKey = config[`${config.provider}_key`];

  const key = String(rawKey || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

  if (!key) {
    alert("⚠️ Configure sua chave API primeiro! Clique no ⚙️");
    showSettingsModal();
    return;
  }

  btn.disabled = true;
  btn.textContent = "Gerando...";
  responseArea.style.display = 'block';
  responseArea.innerHTML = "Analisando jogo...";

  let prompt = `${AI_PROMPT_BASE}

Jogo: ${gameInfo.match}
Campeonato: ${gameInfo.championship}
Horário/Status: ${gameInfo.time}
Odds: ${gameInfo.odds}
Risco: ${risk}`;

  if (extra) prompt += `\nPedido adicional: ${extra}`;

  let apiUrl = 'https://api.openai.com/v1/chat/completions';
  let model = 'gpt-4o-mini';
  let headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  };

  if (config.provider === 'openrouter') {
    apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    model = OPENROUTER_MODEL;

    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    };
  } else {
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    model = 'gpt-4o-mini';
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    console.log("OpenRouter/Auth debug:", {
      provider: config.provider,
      model,
      keyPrefix: key.slice(0, 12),
      keyLength: key.length,
      hasBearer: headers.Authorization.startsWith('Bearer ')
    });

    const res = await fetch(apiUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: headers,
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: config.provider === 'openrouter' ? 0.7 : 0.3,
        max_tokens: 700
      })
    });

	console.log(prompt);

    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error?.message || data.message || `Erro HTTP ${res.status}`);
    }

    const answer = data.choices?.[0]?.message?.content || "Sem resposta";
    responseArea.innerHTML = `<strong>Resposta:</strong><br><br>${escapeHtml(answer).replace(/\n/g, '<br>')}`;

  } catch (e) {
    responseArea.innerHTML = e.name === "AbortError"
      ? "⏳ Tempo esgotado. Tente novamente."
      : `Erro (${config.provider}): ${escapeHtml(e.message)}`;
  }

  btn.disabled = false;
  btn.textContent = "Gerar bilhete rápido";
}

// ==================== UTIL ====================
function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isOddText(text) {
  return /^\d{1,3}[.,]\d{1,2}$/.test(String(text || "").trim());
}

function isIgnoredLine(text) {
  const t = normalizeText(text);
  if (!t) return true;

  // Ignorar números isolados, odds, horários, datas, etc.
  if (/^\d+$/.test(t)) return true;                    // números puros
  if (/^\d{1,3}[.,]\d{1,2}$/.test(t)) return true;    // odds
  if (/^\d{1,2}:\d{2}$/.test(t)) return true;         // horário
  if (/^\d{1,2}\/\d{1,2}$/.test(t)) return true;      // ← NOVA REGRA (datas DD/MM)
  if (/^\d{1,2}\/\d{2,4}$/.test(t)) return true;      // DD/MM ou DD/YYYY
  if (/^(1|x|2)$/.test(t)) return true;
  if (/^\+\d+/.test(t)) return true;

  // Palavras-chave que devem ser ignoradas
  const ignoreKeywords = /(popular|futebol|tenis|basquete|esports|volei|beisebol|hoquei|futsal|handebol|dardos|ao vivo|copa|libertadores|jogos|serie|campeonato|liga|league|resultado final|total de gols|ambas marcam|casa|empate|fora|risco|pedido|gerar bilhete)/i;
  
  return ignoreKeywords.test(t);
}

// ==================== EXTRATOR ====================
function extractBetanoGameInfo(card) {
  const fullText = card.innerText || '';

  let time = "Ao vivo";
  let championship = "Não identificado";

  const oddsList = [...new Set(fullText.match(/\b\d{1,3}[.,]\d{1,2}\b/g) || [])].slice(0, 8);

  const timeMatch = fullText.match(/\b\d{1,2}:\d{2}\b|Ao vivo/i);
  if (timeMatch) time = timeMatch[0];

  const champMatch = fullText.match(/(Copa Libertadores|Libertadores|Copa Sul-Americana|Sul-Americana|Brasileirão|Série A|Série B|Premier League|La Liga|Champions League|Europa League|NBA|NFL|NHL|MLB)/i);
  if (champMatch) championship = champMatch[0];

  const lines = fullText
    .split('\n')
    .map(x => x.trim())
    .filter(x => x.length >= 2 && x.length <= 70)
    .filter(x => !isIgnoredLine(x));

  const unique = [...new Set(lines)];

  if (unique.length < 2) {
    return { match: null, odds: oddsList.join(" | ") || "Não capturadas", time, championship };
  }

  return {
    match: `${unique[0]} x ${unique[1]}`,
    odds: oddsList.join(" | ") || "Não capturadas",
    time,
    championship
  };
}

function getGameKey(card) {
  const info = extractBetanoGameInfo(card);
  if (!info.match) return null;
  return normalizeText(info.match);
}

// ==================== LOCALIZADOR DE CARD ====================
function findGameCardFromOddElement(el) {
  let node = el;
  for (let i = 0; i < 12 && node && node !== document.body; i++) {
    const text = node.innerText || '';
    const oddsCount = (text.match(/\b\d{1,3}[.,]\d{1,2}\b/g) || []).length;
    const hasTime = /\b\d{1,2}:\d{2}\b|Ao vivo/i.test(text);

    if (node.offsetWidth >= 500 && node.offsetHeight >= 45 && node.offsetHeight <= 180 && oddsCount >= 2 && hasTime) {
      return node;
    }
    node = node.parentElement;
  }

  node = el;
  for (let i = 0; i < 14 && node && node !== document.body; i++) {
    const text = node.innerText || '';
    const oddsCount = (text.match(/\b\d{1,3}[.,]\d{1,2}\b/g) || []).length;
    if (node.offsetWidth >= 500 && node.offsetHeight >= 45 && node.offsetHeight <= 220 && oddsCount >= 2) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function collectGameCards() {
  const cards = new Set();

  document.querySelectorAll('button, div, span').forEach(el => {
    if (!isOddText(el.innerText || '')) return;
    const card = findGameCardFromOddElement(el);
    if (card) cards.add(card);
  });

  document.querySelectorAll('article, div[role="button"], div[class*="event"], div[class*="Event"], div[class*="match"], div[class*="Match"]').forEach(el => {
    const oddsCount = (el.innerText.match(/\b\d{1,3}[.,]\d{1,2}\b/g) || []).length;
    if (el.offsetWidth >= 500 && el.offsetHeight >= 45 && el.offsetHeight <= 220 && oddsCount >= 2) {
      cards.add(el);
    }
  });

  return [...cards];
}

// ==================== ÍCONE ====================
function createFloatingIcon(card) {
  if (card.querySelector(':scope > .betano-ai-icon')) return;

  const key = getGameKey(card);
  if (!key || currentIcons.has(key)) return;
  currentIcons.add(key);

  const icon = document.createElement('div');
  icon.className = 'betano-ai-icon';
  icon.textContent = '🤖';
  icon.style.cssText = `
    position:absolute; top:6px; right:6px; z-index:2147483647;
    width:30px; height:30px; background:#00ff9d; color:#000;
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:19px; cursor:pointer; box-shadow:0 4px 15px rgba(0,255,157,0.7);
    border:2px solid #111;
  `;

  icon.onclick = (e) => {
    e.stopImmediatePropagation();
    const info = extractBetanoGameInfo(card);
    if (!info.match) return alert("Não consegui identificar os times.");
    showBeautifulModal(info);
  };

  if (window.getComputedStyle(card).position === "static") card.style.position = "relative";
  card.appendChild(icon);
}

// ==================== SCANNER ====================
function scanForCards() {
  try {
    const cards = collectGameCards();
    cards.forEach(card => createFloatingIcon(card));
  } catch (e) {
    console.error("Erro no scan Tio Wilson Assistente de Bet:", e);
  }
}

function cleanupIcons() {
  const activeKeys = new Set();
  document.querySelectorAll('.betano-ai-icon').forEach(icon => {
    const parent = icon.parentElement;
    if (!parent || !document.body.contains(parent)) {
      icon.remove();
    } else {
      const key = getGameKey(parent);
      if (key) activeKeys.add(key);
    }
  });
  currentIcons = activeKeys;
}

// ==================== INICIALIZAÇÃO ====================
setTimeout(scanForCards, 200);
setInterval(() => { scanForCards(); cleanupIcons(); }, 500);

const observer = new MutationObserver(() => scanForCards());
observer.observe(document.body, { childList: true, subtree: true, characterData: true });
