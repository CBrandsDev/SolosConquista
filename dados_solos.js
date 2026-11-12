// ==========================================================================
// DADOS DE SOLOS E OBRAS - VITÓRIA DA CONQUISTA (BA)
// Este arquivo é carregado pelo site no Netlify e localmente.
// Quando você gerar um novo backup no painel de edição, substitua este
// arquivo na pasta do projeto para atualizar os dados para todos os visitantes.
// ==========================================================================

window.DADOS_SOLOS_PUBLICOS = {
  pontos: [
    {
      id: "ponto-exemplo-candeias",
      nome: "Sondagem Preliminar - Bairro Candeias",
      lat: -14.8685,
      lng: -40.8137,
      localizacao: "Av. Olívia Flores, Candeias",
      descricao: "Ensaio geotécnico preliminar para fundações superficiais. Solo homogêneo com boa capacidade de suporte.",
      atterberg: "Média Plasticidade (7 ≤ IP ≤ 15)",
      granulometria: "Argila arenosa",
      compactacao: "Ensaio Proctor Normal",
      dataCriacao: "2026-11-12T15:00:00.000Z"
    },
    {
      id: "ponto-exemplo-centro",
      nome: "Obra Comercial - Centro",
      lat: -14.8514,
      lng: -40.8426,
      localizacao: "Praça Barão do Rio Branco, Centro",
      descricao: "Investigação geotécnica para contenção e subsolo em área central consolidada.",
      atterberg: "Baixa Plasticidade (IP < 7)",
      granulometria: "Areia argilosa",
      compactacao: "Grau de Compactação (GC ≥ 95%)",
      dataCriacao: "2026-11-12T15:10:00.000Z"
    }
  ],
  opcoesSeletores: {
    atterberg: [
      "Não Plástico (NP)",
      "Baixa Plasticidade (IP < 7)",
      "Média Plasticidade (7 ≤ IP ≤ 15)",
      "Alta Plasticidade (IP > 15)",
      "Limite de Liquidez (LL < 50%)",
      "Limite de Liquidez (LL ≥ 50%)"
    ],
    granulometria: [
      "Argila arenosa",
      "Argila siltosa",
      "Silte argiloso",
      "Areia argilosa",
      "Areia fina a média",
      "Areia com pedregulhos",
      "Solo granular",
      "Solo fino homogêneo"
    ],
    compactacao: [
      "Ensaio Proctor Normal",
      "Ensaio Proctor Intermediário",
      "Ensaio Proctor Modificado",
      "Grau de Compactação (GC ≥ 95%)",
      "Grau de Compactação (GC ≥ 98%)",
      "Umidade Ótima Atingida"
    ]
  }
};
