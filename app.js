/* ==========================================================================
   PAINEL DE CONFIGURAÇÕES E EDIÇÃO - VITÓRIA DA CONQUISTA (BA)
   Adição de Terrenos no Mapa, Coordenadas e Gerenciamento dos 3 Seletores
   ========================================================================== */

let mapaLeaflet = null;
let marcadorEdicao = null;
let marcadoresSalvos = {};
let obrasLista = [];
let opcoesSeletores = {
  atterberg: [],
  granulometria: [],
  compactacao: []
};
let seletorAtivoAba = 'atterberg';

// Opções padrão da engenharia geotécnica
const OPCOES_PADRAO = {
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
};

// Ícone SVG para os marcadores
function criarIcone(tipo = 'salvo') {
  let classe = 'pin-salvo';
  if (tipo === 'novo') classe = 'pin-novo';
  if (tipo === 'selecionado') classe = 'pin-selecionado';

  const html = `
    <div class="pin-corpo ${classe}">
      <svg viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
        <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html: html,
    className: 'custom-pin',
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38]
  });
}

// Carrega os dados do localStorage ou do arquivo dados_solos.js
function carregarDados() {
  // 1. Obras
  try {
    const rawObras = localStorage.getItem('conquista_obras_pontos');
    if (rawObras) obrasLista = JSON.parse(rawObras);
  } catch (e) {
    console.warn('Erro ao carregar obras locais:', e);
  }

  if (!obrasLista || obrasLista.length === 0) {
    if (window.DADOS_SOLOS_PUBLICOS && Array.isArray(window.DADOS_SOLOS_PUBLICOS.pontos)) {
      obrasLista = JSON.parse(JSON.stringify(window.DADOS_SOLOS_PUBLICOS.pontos));
    } else {
      obrasLista = [];
    }
  }

  // 2. Opções dos 3 Seletores
  try {
    const rawOpcoes = localStorage.getItem('conquista_opcoes_seletores');
    if (rawOpcoes) opcoesSeletores = JSON.parse(rawOpcoes);
  } catch (e) {
    console.warn('Erro ao carregar opções locais:', e);
  }

  if (!opcoesSeletores || !opcoesSeletores.atterberg || opcoesSeletores.atterberg.length === 0) {
    if (window.DADOS_SOLOS_PUBLICOS && window.DADOS_SOLOS_PUBLICOS.opcoesSeletores) {
      opcoesSeletores = JSON.parse(JSON.stringify(window.DADOS_SOLOS_PUBLICOS.opcoesSeletores));
    } else {
      opcoesSeletores = JSON.parse(JSON.stringify(OPCOES_PADRAO));
    }
  }
}

// Salva dados no localStorage
function persistirObras() {
  localStorage.setItem('conquista_obras_pontos', JSON.stringify(obrasLista));
}

function persistirOpcoes() {
  localStorage.setItem('conquista_opcoes_seletores', JSON.stringify(opcoesSeletores));
}

// Elementos do Formulário
const formObra = document.getElementById('form-obra');
const formModoBadge = document.getElementById('form-modo-badge');
const formTitulo = document.getElementById('form-titulo');
const campoNome = document.getElementById('campo-nome');
const campoCoordenadas = document.getElementById('campo-coordenadas');
const campoLat = document.getElementById('campo-lat');
const campoLng = document.getElementById('campo-lng');
const campoIdEdicao = document.getElementById('campo-id-edicao');
const campoLocalizacao = document.getElementById('campo-localizacao');
const campoDescricao = document.getElementById('campo-descricao');
const statusCoordenadas = document.getElementById('status-coordenadas');
const seletorAtterberg = document.getElementById('seletor-atterberg');
const seletorGranulometria = document.getElementById('seletor-granulometria');
const seletorCompactacao = document.getElementById('seletor-compactacao');
const alertaSucesso = document.getElementById('alerta-sucesso');
const btnNovoPonto = document.getElementById('btn-novo-ponto');
const btnLimparForm = document.getElementById('btn-limpar-formulario');

// Elementos do Gerenciador de Seletores
const abasBotoes = document.querySelectorAll('.btn-aba-seletor');
const containerChips = document.getElementById('container-chips-opcoes');
const inputNovaOpcao = document.getElementById('input-nova-opcao');
const btnAddOpcao = document.getElementById('btn-adicionar-opcao');

// Lista e Filtro no Editor
const containerListaEditor = document.getElementById('container-lista-obras-editor');
const inputFiltroEditor = document.getElementById('input-filtro-editor');

// Backup
const btnExportarBackup = document.getElementById('btn-exportar-backup');
const inputImportarBackup = document.getElementById('input-importar-backup');

// Inicializa o mapa com estilo Google Maps
function inicializarMapa() {
  const container = document.getElementById('mapa-editor');
  if (!container) return;

  mapaLeaflet = L.map('mapa-editor', {
    center: [-14.8600, -40.8400],
    zoom: 13,
    minZoom: 10,
    maxZoom: 20
  });

  const camadaGoogle = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    attribution: '© Google Maps'
  });

  const camadaSatelite = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    attribution: '© Google Maps Satélite'
  });

  const camadaOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  });

  camadaGoogle.addTo(mapaLeaflet);

  L.control.layers({
    'Google Maps (Ruas)': camadaGoogle,
    'Google Satélite': camadaSatelite,
    'OpenStreetMap': camadaOSM
  }, null, { position: 'topright' }).addTo(mapaLeaflet);

  // CLIQUE NO MAPA PARA ADICIONAR OU MOVER PONTO
  mapaLeaflet.on('click', (e) => {
    definirPontoNoMapa(e.latlng.lat, e.latlng.lng, true);
  });
}

// Define o marcador de edição no mapa e preenche as coordenadas
async function definirPontoNoMapa(lat, lng, buscarEndereco = true) {
  const latFormatado = parseFloat(lat.toFixed(6));
  const lngFormatado = parseFloat(lng.toFixed(6));

  campoLat.value = latFormatado;
  campoLng.value = lngFormatado;
  campoCoordenadas.value = `${latFormatado}, ${lngFormatado}`;
  statusCoordenadas.textContent = '✓ Ponto fixado no mapa';
  statusCoordenadas.style.color = '#15803d';

  if (!marcadorEdicao) {
    marcadorEdicao = L.marker([latFormatado, lngFormatado], {
      icon: criarIcone('novo'),
      draggable: true
    }).addTo(mapaLeaflet);

    marcadorEdicao.on('dragend', (ev) => {
      const novaPos = ev.target.getLatLng();
      definirPontoNoMapa(novaPos.lat, novaPos.lng, false);
    });
  } else {
    marcadorEdicao.setLatLng([latFormatado, lngFormatado]);
    marcadorEdicao.setIcon(criarIcone('novo'));
  }

  // Tenta buscar o endereço/bairro via geocodificação reversa se o campo estiver vazio
  if (buscarEndereco && !campoLocalizacao.value.trim()) {
    statusCoordenadas.textContent = 'Buscando localização...';
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latFormatado}&lon=${lngFormatado}&format=json`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } });
      if (resp.ok) {
        const data = await resp.json();
        const addr = data.address || {};
        const partes = [];
        if (addr.road) partes.push(addr.road);
        if (addr.suburb || addr.neighbourhood) partes.push(addr.suburb || addr.neighbourhood);
        if (addr.city || addr.town) partes.push(addr.city || addr.town);
        if (partes.length > 0) {
          campoLocalizacao.value = partes.join(', ');
        }
      }
    } catch (e) {
      console.warn('Geocodificação reversa:', e);
    }
    statusCoordenadas.textContent = '✓ Ponto fixado no mapa';
  }
}

// Renderiza marcadores das obras salvas
function renderizarMarcadoresSalvos() {
  Object.values(marcadoresSalvos).forEach(m => mapaLeaflet.removeLayer(m));
  marcadoresSalvos = {};

  obrasLista.forEach(obra => {
    if (typeof obra.lat !== 'number' || typeof obra.lng !== 'number') return;

    const m = L.marker([obra.lat, obra.lng], { icon: criarIcone('salvo') }).addTo(mapaLeaflet);
    m.bindTooltip(`<strong>${obra.nome || 'Obra'}</strong><br><small>${obra.localizacao || ''}</small>`, {
      direction: 'top',
      className: 'tooltip-obra'
    });

    m.on('click', () => {
      carregarObraNoFormulario(obra.id);
    });

    marcadoresSalvos[obra.id] = m;
  });
}

// Renderiza lista de obras cadastradas no editor
function renderizarListaEditor(filtro = '') {
  if (!containerListaEditor) return;
  containerListaEditor.innerHTML = '';

  const termo = filtro.trim().toLowerCase();
  const filtradas = obrasLista.filter(o => {
    if (!termo) return true;
    const nome = (o.nome || '').toLowerCase();
    const loc = (o.localizacao || '').toLowerCase();
    return nome.includes(termo) || loc.includes(termo);
  });

  if (filtradas.length === 0) {
    containerListaEditor.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 18px; text-align: center; color: #94a3b8; font-size: 0.88rem;">
        Nenhuma obra cadastrada ainda. Clique no mapa para adicionar o primeiro terreno!
      </div>
    `;
    return;
  }

  filtradas.forEach(obra => {
    const card = document.createElement('div');
    card.className = `card-obra-item ${campoIdEdicao.value === obra.id ? 'ativo' : ''}`;
    card.innerHTML = `
      <div class="obra-item-nome">
        <span>📍</span>
        <span>${obra.nome || 'Obra sem nome'}</span>
      </div>
      <div class="obra-item-local">${obra.localizacao || 'Vitória da Conquista'}</div>
      <div class="obra-item-acoes">
        <button type="button" class="btn-mini-acao" onclick="carregarObraNoFormulario('${obra.id}')">✏️ Editar</button>
        <button type="button" class="btn-mini-acao btn-mini-excluir" onclick="excluirObra('${obra.id}')">🗑️ Excluir</button>
      </div>
    `;
    containerListaEditor.appendChild(card);
  });
}

// Carrega uma obra existente no formulário para edição
window.carregarObraNoFormulario = function(obraId) {
  const obra = obrasLista.find(o => o.id === obraId);
  if (!obra) return;

  campoIdEdicao.value = obra.id;
  campoNome.value = obra.nome || '';
  campoLocalizacao.value = obra.localizacao || '';
  campoDescricao.value = obra.descricao || '';

  // Seleciona as opções nos seletores
  seletorAtterberg.value = obra.atterberg || '';
  seletorGranulometria.value = obra.granulometria || '';
  seletorCompactacao.value = obra.compactacao || '';

  formModoBadge.textContent = 'Editando Obra';
  formModoBadge.style.color = '#0284c7';
  formTitulo.textContent = 'Editar Informações da Obra';

  definirPontoNoMapa(obra.lat, obra.lng, false);

  if (mapaLeaflet) {
    mapaLeaflet.flyTo([obra.lat, obra.lng], 16, { duration: 0.7 });
  }

  renderizarListaEditor(inputFiltroEditor ? inputFiltroEditor.value : '');

  // Rola até o formulário em telas menores
  if (window.innerWidth < 1024) {
    formObra.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Exclui uma obra cadastrada
window.excluirObra = function(obraId) {
  const obra = obrasLista.find(o => o.id === obraId);
  if (!obra) return;

  if (confirm(`Tem certeza que deseja remover a obra "${obra.nome}"?`)) {
    obrasLista = obrasLista.filter(o => o.id !== obraId);
    persistirObras();

    if (campoIdEdicao.value === obraId) {
      limparFormulario();
    }

    renderizarMarcadoresSalvos();
    renderizarListaEditor();

    exibirAlerta(`Obra "${obra.nome}" removida.`);
  }
};

// Limpa o formulário e reseta para "Nova Obra"
function limparFormulario() {
  campoIdEdicao.value = '';
  campoNome.value = '';
  campoCoordenadas.value = '';
  campoLat.value = '';
  campoLng.value = '';
  campoLocalizacao.value = '';
  campoDescricao.value = '';
  seletorAtterberg.value = '';
  seletorGranulometria.value = '';
  seletorCompactacao.value = '';

  statusCoordenadas.textContent = 'Clique no mapa';
  statusCoordenadas.style.color = 'var(--solo-azul)';

  formModoBadge.textContent = 'Novo Ponto';
  formModoBadge.style.color = '#fb923c';
  formTitulo.textContent = 'Cadastrar Obra / Terreno';

  if (marcadorEdicao) {
    mapaLeaflet.removeLayer(marcadorEdicao);
    marcadorEdicao = null;
  }

  renderizarListaEditor();
}

btnNovoPonto.addEventListener('click', limparFormulario);
btnLimparForm.addEventListener('click', limparFormulario);

// Salva a obra (nova ou editada)
formObra.addEventListener('submit', (e) => {
  e.preventDefault();

  const lat = parseFloat(campoLat.value);
  const lng = parseFloat(campoLng.value);

  if (isNaN(lat) || isNaN(lng)) {
    alert('Por favor, clique em um ponto no mapa para definir as coordenadas do terreno.');
    return;
  }

  const idEdicao = campoIdEdicao.value;
  const nome = campoNome.value.trim();

  if (!nome) {
    alert('Informe o nome da obra.');
    campoNome.focus();
    return;
  }

  const dadosObra = {
    id: idEdicao || `obra-${Date.now()}`,
    nome: nome,
    lat: lat,
    lng: lng,
    localizacao: campoLocalizacao.value.trim() || 'Vitória da Conquista, BA',
    descricao: campoDescricao.value.trim(),
    atterberg: seletorAtterberg.value,
    granulometria: seletorGranulometria.value,
    compactacao: seletorCompactacao.value,
    atualizadoEm: new Date().toISOString()
  };

  if (idEdicao) {
    // Atualiza existente
    const idx = obrasLista.findIndex(o => o.id === idEdicao);
    if (idx !== -1) {
      obrasLista[idx] = { ...obrasLista[idx], ...dadosObra };
    }
  } else {
    // Insere nova
    obrasLista.unshift(dadosObra);
  }

  persistirObras();
  renderizarMarcadoresSalvos();
  renderizarListaEditor();

  exibirAlerta(`✓ Obra "${dadosObra.nome}" salva com sucesso!`);
  limparFormulario();
});

// Feedback visual
function exibirAlerta(texto) {
  alertaSucesso.textContent = texto;
  alertaSucesso.classList.add('visivel');
  setTimeout(() => {
    alertaSucesso.classList.remove('visivel');
  }, 3500);
}

// ==========================================================================
// GERENCIADOR DE OPÇÕES DOS 3 SELETORES
// ==========================================================================

// Preenche os 3 dropdowns (<select>) do formulário com as opções atuais
function atualizarDropdownsFormulario() {
  const preencherSelect = (elem, opcoes, valorAtual) => {
    elem.innerHTML = '<option value="">-- Selecione uma opção --</option>';
    opcoes.forEach(op => {
      const opt = document.createElement('option');
      opt.value = op;
      opt.textContent = op;
      elem.appendChild(opt);
    });
    if (valorAtual) elem.value = valorAtual;
  };

  preencherSelect(seletorAtterberg, opcoesSeletores.atterberg, seletorAtterberg.value);
  preencherSelect(seletorGranulometria, opcoesSeletores.granulometria, seletorGranulometria.value);
  preencherSelect(seletorCompactacao, opcoesSeletores.compactacao, seletorCompactacao.value);
}

// Renderiza a lista de chips da aba de seletor atualmente ativa
function renderizarChipsAbaAtiva() {
  if (!containerChips) return;
  containerChips.innerHTML = '';

  const lista = opcoesSeletores[seletorAtivoAba] || [];

  if (lista.length === 0) {
    containerChips.innerHTML = '<span style="color:#94a3b8; font-size:0.82rem; font-style:italic;">Nenhuma opção cadastrada para este seletor.</span>';
    return;
  }

  lista.forEach((opcao, index) => {
    const chip = document.createElement('span');
    chip.className = 'chip-opcao';
    chip.innerHTML = `
      <span>${opcao}</span>
      <button type="button" title="Remover opção" onclick="removerOpcaoSeletor('${seletorAtivoAba}', ${index})">✕</button>
    `;
    containerChips.appendChild(chip);
  });
}

// Remove uma opção do seletor
window.removerOpcaoSeletor = function(seletorKey, index) {
  if (!opcoesSeletores[seletorKey]) return;
  opcoesSeletores[seletorKey].splice(index, 1);
  persistirOpcoes();
  renderizarChipsAbaAtiva();
  atualizarDropdownsFormulario();
};

// Adiciona uma nova opção no seletor ativo
function adicionarNovaOpcao() {
  const valor = inputNovaOpcao.value.trim();
  if (!valor) return;

  if (!opcoesSeletores[seletorAtivoAba]) {
    opcoesSeletores[seletorAtivoAba] = [];
  }

  if (opcoesSeletores[seletorAtivoAba].includes(valor)) {
    alert('Esta opção já existe para este seletor.');
    return;
  }

  opcoesSeletores[seletorAtivoAba].push(valor);
  persistirOpcoes();
  inputNovaOpcao.value = '';
  renderizarChipsAbaAtiva();
  atualizarDropdownsFormulario();
}

if (btnAddOpcao) {
  btnAddOpcao.addEventListener('click', adicionarNovaOpcao);
}

if (inputNovaOpcao) {
  inputNovaOpcao.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarNovaOpcao();
    }
  });
}

// Troca de aba no gerenciador de seletores
abasBotoes.forEach(btn => {
  btn.addEventListener('click', () => {
    abasBotoes.forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    seletorAtivoAba = btn.getAttribute('data-seletor');
    renderizarChipsAbaAtiva();
  });
});

// ==========================================================================
// BACKUP E RESTAURAÇÃO
// ==========================================================================

// Salvar Backup (Gera o arquivo dados_solos.js com obras e opções de seletores)
if (btnExportarBackup) {
  btnExportarBackup.addEventListener('click', () => {
    const payload = {
      pontos: obrasLista,
      opcoesSeletores: opcoesSeletores
    };

    const codigoJs = `// ==========================================================================\n// DADOS DE SOLOS E OBRAS - VITÓRIA DA CONQUISTA (BA)\n// Gerado em: ${new Date().toLocaleString('pt-BR')}\n// Este arquivo é carregado pelo site no Netlify e localmente.\n// ==========================================================================\n\nwindow.DADOS_SOLOS_PUBLICOS = ${JSON.stringify(payload, null, 2)};\n`;

    const blob = new Blob([codigoJs], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dados_solos.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`✅ Backup gerado com sucesso!\n\nArquivo baixado: "dados_solos.js" (${obrasLista.length} obra(s)).\n\nBasta salvá-lo na pasta "siteConquista" e reenviar a pasta para o Netlify para atualizar o site na web!`);
  });
}

// Restaurar Backup (Aceita .js ou .json)
if (inputImportarBackup) {
  inputImportarBackup.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let texto = ev.target.result.trim();
        if (texto.includes('window.DADOS_SOLOS_PUBLICOS')) {
          const match = texto.match(/window\.DADOS_SOLOS_PUBLICOS\s*=\s*(\{[\s\S]*?\})\s*;/);
          if (match) texto = match[1];
        }

        const dados = JSON.parse(texto);

        // Suporta tanto o novo formato ({ pontos, opcoesSeletores }) quanto o formato anterior (array)
        if (Array.isArray(dados)) {
          obrasLista = dados;
        } else if (dados && typeof dados === 'object') {
          if (Array.isArray(dados.pontos)) obrasLista = dados.pontos;
          if (dados.opcoesSeletores) opcoesSeletores = dados.opcoesSeletores;
        }

        persistirObras();
        persistirOpcoes();

        atualizarDropdownsFormulario();
        renderizarChipsAbaAtiva();
        renderizarMarcadoresSalvos();
        renderizarListaEditor();
        limparFormulario();

        alert(`✅ Backup restaurado com sucesso! ${obrasLista.length} obra(s) carregada(s).`);
      } catch (err) {
        alert('Erro ao processar arquivo de backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
}

// Filtro na lista de obras do editor
if (inputFiltroEditor) {
  inputFiltroEditor.addEventListener('input', (e) => {
    renderizarListaEditor(e.target.value);
  });
}

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  inicializarMapa();
  atualizarDropdownsFormulario();
  renderizarChipsAbaAtiva();
  renderizarMarcadoresSalvos();
  renderizarListaEditor();

  // Se houver hash na URL (ex: editor.html#obra-123), carrega direto
  if (window.location.hash) {
    const id = window.location.hash.replace('#', '');
    carregarObraNoFormulario(id);
  }
});
