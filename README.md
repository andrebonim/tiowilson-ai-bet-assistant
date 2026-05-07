# Tio Wilson Assistente de Bet

Extensão para navegador que adiciona um assistente de IA na interface da Betano para sugerir bilhetes com base no jogo exibido na página.

## O que este plugin faz

- Injeta um ícone de IA nos cards de partidas da Betano.
- Lê informações básicas do evento, como confronto, horário, campeonato e odds visíveis.
- Envia esses dados para um modelo de IA usando OpenAI ou OpenRouter.
- Retorna 2 sugestões de bilhetes em diferentes combinações de mercados.

## Requisitos

- Google Chrome, Microsoft Edge ou outro navegador compatível com extensões Chromium.
- Acesso à Betano em um domínio suportado pela extensão.
- Uma chave de API válida de um dos provedores abaixo:
  - OpenAI
  - OpenRouter

## Instalação

Como o projeto não tem etapa de build, a instalação é feita carregando a pasta da extensão diretamente no navegador.

1. Baixe ou clone este repositório.
2. Abra o navegador e acesse a página de extensões:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Ative o `Modo do desenvolvedor`.
4. Clique em `Carregar sem compactação` ou `Load unpacked`.
5. Selecione a pasta deste projeto:
   - [Z:\SouceCode\tiowilson-ai-bet-assistant](Z:\SouceCode\tiowilson-ai-bet-assistant)
6. Confirme que a extensão `Tio Wilson Assistente de Bet` apareceu na lista de extensões instaladas.

## Como configurar

1. Abra a Betano em um domínio compatível, por exemplo:
   - `https://www.betano.com/*`
   - `https://www.betano.bet.br/*`
2. Aguarde os jogos carregarem.
3. Clique no ícone de robô exibido sobre um card de partida.
4. No modal da extensão, clique no ícone de configuração `⚙`.
5. Escolha o provedor:
   - `OpenAI`
   - `OpenRouter`
6. Cole sua chave de API.
7. Clique em `Salvar Configuração`.

Observação:
As credenciais são armazenadas usando `chrome.storage.sync`, ou seja, no armazenamento da extensão do navegador.

## Como usar

1. Entre em uma página da Betano que exiba partidas e odds.
2. Clique no ícone `🤖` adicionado pela extensão no card do jogo desejado.
3. Revise os dados capturados da partida no modal.
4. Escolha o nível de risco:
   - `Baixo`
   - `Médio`
   - `Alto`
5. Se quiser, escreva um pedido adicional no campo de texto.
   Exemplo: `priorize mercados de gols e escanteios`.
6. Clique em `Gerar bilhete rápido`.
7. Aguarde a resposta da IA com os 2 bilhetes sugeridos.

## Provedores suportados

### OpenAI

- Endpoint usado: `https://api.openai.com/v1/chat/completions`
- Modelo configurado no código: `gpt-4o-mini`

### OpenRouter

- Endpoint usado: `https://openrouter.ai/api/v1/chat/completions`
- Modelo configurado no código: `openrouter/free`

## Permissões da extensão

O arquivo [manifest.json](Z:\SouceCode\tiowilson-ai-bet-assistant\manifest.json) define:

- `storage`: salva o provedor e a chave informada.
- `host_permissions` para:
  - `https://api.openai.com/*`
  - `https://openrouter.ai/*`
  - `https://*.openrouter.ai/*`
- Execução automática do script [content.js](Z:\SouceCode\tiowilson-ai-bet-assistant\content.js) em páginas da Betano suportadas.

## Estrutura do projeto

- [manifest.json](Z:\SouceCode\tiowilson-ai-bet-assistant\manifest.json): configuração da extensão.
- [content.js](Z:\SouceCode\tiowilson-ai-bet-assistant\content.js): captura os jogos da página, exibe a interface e chama a API de IA.
- [icon128.png](Z:\SouceCode\tiowilson-ai-bet-assistant\icon128.png): ícone da extensão.

## Solução de problemas

### O ícone não aparece na Betano

- Recarregue a página após instalar a extensão.
- Verifique se você está em um domínio suportado.
- Confirme se a extensão está habilitada no navegador.

### A IA não responde

- Confira se a chave de API foi salva corretamente.
- Verifique se o provedor selecionado corresponde à chave informada.
- Teste novamente, pois a requisição tem timeout de 25 segundos.

### A partida foi identificada incorretamente

- A extensão depende do texto visível no card da Betano.
- Em layouts diferentes, o confronto, campeonato ou odds podem ser capturados de forma parcial.

## Aviso

Este projeto gera sugestões automatizadas com IA a partir das informações encontradas na página. As respostas podem conter erros, interpretações incompletas ou análises desatualizadas. Use por sua conta e risco.
