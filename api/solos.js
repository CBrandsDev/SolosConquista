// ==========================================================================
// API SERVERLESS VERCEL - PERSISTÊNCIA EM NUVEM DE SOLOS E OBRAS
// Endpoint: /api/solos
// Suporta Vercel KV e Upstash Redis para sincronização global em tempo real
// ==========================================================================

module.exports = async (req, res) => {
  // Cabeçalhos CORS para permitir acesso seguro de qualquer origem
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responde imediatamente a requisições preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Identifica as variáveis de ambiente do Vercel KV ou Upstash
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // Se o Vercel KV ainda não foi conectado no painel da Vercel
  if (!kvUrl || !kvToken) {
    return res.status(200).json({
      conectado: false,
      mensagem: 'Vercel KV ainda não conectado no painel da Vercel. Vá em Storage > Create Database > KV para ativar o salvamento online para todos.',
      pontos: [],
      opcoesSeletores: null
    });
  }

  const DB_KEY = 'solos_conquista_database';

  // Função auxiliar para executar comandos Upstash / Vercel KV
  async function executarComandoKV(comandoArray) {
    const resp = await fetch(kvUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(comandoArray)
    });

    if (!resp.ok) {
      const errTexto = await resp.text();
      throw new Error(`Erro KV (${resp.status}): ${errTexto}`);
    }

    return await resp.json();
  }

  try {
    // ------------------------------------------------------------------------
    // MÉTODO GET: Retorna todas as obras e seletores salvos na nuvem
    // ------------------------------------------------------------------------
    if (req.method === 'GET') {
      const resJson = await executarComandoKV(['GET', DB_KEY]);
      let dados = null;

      if (resJson && resJson.result) {
        try {
          dados = typeof resJson.result === 'string' ? JSON.parse(resJson.result) : resJson.result;
        } catch (e) {
          console.warn('Erro ao decodificar JSON do KV:', e);
        }
      }

      if (!dados || !Array.isArray(dados.pontos)) {
        dados = { pontos: [], opcoesSeletores: null };
      }

      return res.status(200).json({
        conectado: true,
        sucesso: true,
        pontos: dados.pontos || [],
        opcoesSeletores: dados.opcoesSeletores || null,
        atualizadoEm: dados.atualizadoEm || null
      });
    }

    // ------------------------------------------------------------------------
    // MÉTODO POST: Grava nova obra, edita, exclui ou sincroniza seletores
    // ------------------------------------------------------------------------
    if (req.method === 'POST') {
      let payload = req.body || {};
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          payload = {};
        }
      }

      const { acao, obra, id, opcoesSeletores, pontos } = payload;

      // 1. Obtém o estado atual gravado no KV
      const resJson = await executarComandoKV(['GET', DB_KEY]);
      let estadoAtual = { pontos: [], opcoesSeletores: null };

      if (resJson && resJson.result) {
        try {
          estadoAtual = typeof resJson.result === 'string' ? JSON.parse(resJson.result) : resJson.result;
        } catch (e) {}
      }
      if (!Array.isArray(estadoAtual.pontos)) estadoAtual.pontos = [];

      // 2. Aplica a ação recebida
      if (acao === 'salvar_obra' && obra) {
        const idx = estadoAtual.pontos.findIndex(o => o.id === obra.id);
        const obraAtualizada = { ...obra, atualizadoEm: new Date().toISOString() };
        if (idx !== -1) {
          estadoAtual.pontos[idx] = obraAtualizada;
        } else {
          estadoAtual.pontos.unshift(obraAtualizada);
        }
      } else if (acao === 'excluir_obra' && id) {
        estadoAtual.pontos = estadoAtual.pontos.filter(o => o.id !== id);
      } else if (acao === 'salvar_opcoes' && opcoesSeletores) {
        estadoAtual.opcoesSeletores = opcoesSeletores;
      } else if (acao === 'sincronizar_tudo') {
        if (Array.isArray(pontos)) estadoAtual.pontos = pontos;
        if (opcoesSeletores) estadoAtual.opcoesSeletores = opcoesSeletores;
      } else {
        if (Array.isArray(payload.pontos)) estadoAtual.pontos = payload.pontos;
        if (payload.opcoesSeletores) estadoAtual.opcoesSeletores = payload.opcoesSeletores;
      }

      estadoAtual.atualizadoEm = new Date().toISOString();

      // 3. Grava o novo estado atualizado no Vercel KV
      await executarComandoKV(['SET', DB_KEY, JSON.stringify(estadoAtual)]);

      return res.status(200).json({
        sucesso: true,
        conectado: true,
        mensagem: 'Dados sincronizados com sucesso na nuvem Vercel!',
        pontos: estadoAtual.pontos,
        opcoesSeletores: estadoAtual.opcoesSeletores,
        atualizadoEm: estadoAtual.atualizadoEm
      });
    }

    return res.status(405).json({ erro: 'Método HTTP não permitido' });
  } catch (erro) {
    console.error('Erro na função serverless /api/solos:', erro);
    return res.status(500).json({
      erro: 'Falha na comunicação com o banco de dados na nuvem',
      detalhes: erro.message
    });
  }
};
