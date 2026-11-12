// ==========================================================================
// API SERVERLESS VERCEL - PERSISTÊNCIA EM NUVEM DE SOLOS E OBRAS
// Endpoint: /api/solos
// Suporta Supabase (Plano Gratuito) e Vercel KV / Upstash Redis
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

  // 1. Identifica credenciais do Supabase (Vercel Integration)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // 2. Identifica credenciais do Vercel KV / Upstash (caso usado)
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // Se nenhum provedor foi configurado ainda
  if ((!supabaseUrl || !supabaseKey) && (!kvUrl || !kvToken)) {
    return res.status(200).json({
      conectado: false,
      mensagem: 'Nenhum banco de dados conectado. Conecte a integração do Supabase (Free Plan) no painel da Vercel.',
      pontos: [],
      opcoesSeletores: null
    });
  }

  const DB_KEY = 'solos_conquista_database';

  try {
    // ========================================================================
    // INTEGRAÇÃO COM SUPABASE (REST API)
    // ========================================================================
    if (supabaseUrl && supabaseKey) {
      if (req.method === 'GET') {
        const resp = await fetch(`${supabaseUrl}/rest/v1/solos_data?id=eq.principal&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (!resp.ok) {
          const errText = await resp.text();
          if (resp.status === 404 || resp.status === 400 || errText.includes('does not exist') || errText.includes('relation')) {
            return res.status(200).json({
              conectado: false,
              precisaCriarTabela: true,
              mensagem: 'Supabase conectado! Execute o SQL para criar a tabela "solos_data".',
              pontos: [],
              opcoesSeletores: null
            });
          }
          throw new Error(`Erro Supabase (${resp.status}): ${errText}`);
        }

        const rows = await resp.json();
        let pontos = [];
        let opcoesSeletores = null;
        let atualizadoEm = null;

        if (Array.isArray(rows) && rows.length > 0) {
          pontos = rows[0].pontos || [];
          opcoesSeletores = rows[0].opcoes_seletores || null;
          atualizadoEm = rows[0].atualizado_em || null;
        }

        return res.status(200).json({
          conectado: true,
          provider: 'supabase',
          sucesso: true,
          pontos: pontos,
          opcoesSeletores: opcoesSeletores,
          atualizadoEm: atualizadoEm
        });
      }

      if (req.method === 'POST') {
        let payload = req.body || {};
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload); } catch (e) { payload = {}; }
        }

        const { acao, obra, id, opcoesSeletores, pontos } = payload;

        // Obtém estado atual gravado
        let estadoAtual = { pontos: [], opcoesSeletores: null };
        try {
          const getResp = await fetch(`${supabaseUrl}/rest/v1/solos_data?id=eq.principal&select=*`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          if (getResp.ok) {
            const rows = await getResp.json();
            if (Array.isArray(rows) && rows.length > 0) {
              if (Array.isArray(rows[0].pontos)) estadoAtual.pontos = rows[0].pontos;
              if (rows[0].opcoes_seletores) estadoAtual.opcoesSeletores = rows[0].opcoes_seletores;
            }
          }
        } catch (e) {}

        if (!Array.isArray(estadoAtual.pontos)) estadoAtual.pontos = [];

        // Aplica ação
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

        // Grava no Supabase via UPSERT (Prefer: resolution=merge-duplicates)
        const saveResp = await fetch(`${supabaseUrl}/rest/v1/solos_data`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify([{
            id: 'principal',
            pontos: estadoAtual.pontos,
            opcoes_seletores: estadoAtual.opcoesSeletores,
            atualizado_em: estadoAtual.atualizadoEm
          }])
        });

        if (!saveResp.ok) {
          const errText = await saveResp.text();
          throw new Error(`Erro ao salvar no Supabase (${saveResp.status}): ${errText}`);
        }

        return res.status(200).json({
          sucesso: true,
          conectado: true,
          provider: 'supabase',
          mensagem: 'Dados sincronizados com sucesso no Supabase!',
          pontos: estadoAtual.pontos,
          opcoesSeletores: estadoAtual.opcoesSeletores,
          atualizadoEm: estadoAtual.atualizadoEm
        });
      }
    }

    // ========================================================================
    // FALLBACK: INTEGRAÇÃO COM VERCEL KV / UPSTASH
    // ========================================================================
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

    if (req.method === 'GET') {
      const resJson = await executarComandoKV(['GET', DB_KEY]);
      let dados = null;
      if (resJson && resJson.result) {
        try {
          dados = typeof resJson.result === 'string' ? JSON.parse(resJson.result) : resJson.result;
        } catch (e) {}
      }
      if (!dados || !Array.isArray(dados.pontos)) {
        dados = { pontos: [], opcoesSeletores: null };
      }
      return res.status(200).json({
        conectado: true,
        provider: 'vercel-kv',
        sucesso: true,
        pontos: dados.pontos || [],
        opcoesSeletores: dados.opcoesSeletores || null,
        atualizadoEm: dados.atualizadoEm || null
      });
    }

    if (req.method === 'POST') {
      let payload = req.body || {};
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (e) { payload = {}; }
      }
      const { acao, obra, id, opcoesSeletores, pontos } = payload;

      const resJson = await executarComandoKV(['GET', DB_KEY]);
      let estadoAtual = { pontos: [], opcoesSeletores: null };
      if (resJson && resJson.result) {
        try {
          estadoAtual = typeof resJson.result === 'string' ? JSON.parse(resJson.result) : resJson.result;
        } catch (e) {}
      }
      if (!Array.isArray(estadoAtual.pontos)) estadoAtual.pontos = [];

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
      }

      estadoAtual.atualizadoEm = new Date().toISOString();
      await executarComandoKV(['SET', DB_KEY, JSON.stringify(estadoAtual)]);

      return res.status(200).json({
        sucesso: true,
        conectado: true,
        provider: 'vercel-kv',
        mensagem: 'Dados sincronizados com sucesso na nuvem Vercel KV!',
        pontos: estadoAtual.pontos,
        opcoesSeletores: estadoAtual.opcoesSeletores,
        atualizadoEm: estadoAtual.atualizadoEm
      });
    }

    return res.status(405).json({ erro: 'Método HTTP não permitido' });
  } catch (erro) {
    console.error('Erro na API /api/solos:', erro);
    return res.status(500).json({
      erro: 'Falha na comunicação com o banco de dados na nuvem',
      detalhes: erro.message
    });
  }
};
