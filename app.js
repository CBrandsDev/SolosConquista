/* ==========================================================================
   SISTEMA DE MAPEAMENTO DE SOLOS, OBRAS E TURMAS - VITÓRIA DA CONQUISTA (BA)
   Aplicação Unificada: Modos Visualização e Configuração
   ========================================================================== */

// Estado Global da Aplicação
let modoAtual = 'view'; // 'view' ou 'config'
let subAbaView = 'mapa'; // 'mapa' ou 'fotos'
let subAbaCfg = 'mapa';  // 'mapa' ou 'fotos'

let obrasLista = [];
let turmasLista = [];
let opcoesSeletores = {
  atterberg: [],
  granulometria: [],
  compactacao: []
};
let seletorAtivoAba = 'atterberg';

// Mapas Leaflet
let mapaViewer = null;
let mapaEditor = null;
let marcadorEdicao = null;
let marcadoresViewerPorId = {};
let marcadoresEditorPorId = {};
let obraAtivaViewerId = null;

// Fotos temporárias para Obra (no editor)
let foto1Base64 = '';
let foto2Base64 = '';

// Fotos temporárias para Turma (no editor)
let fotosTurmaTemp = [];

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

// ==========================================================================
// ELEMENTOS DO DOM
// ==========================================================================

// Cabeçalho e Navegação
const statusNuvem = document.getElementById('status-nuvem');
const toastNotificacao = document.getElementById('toast-notificacao');

const acoesModoVisualizacao = document.getElementById('acoes-modo-visualizacao');
const acoesModoConfig = document.getElementById('acoes-modo-config');
const btnEntrarConfig = document.getElementById('btn-entrar-config');
const btnCancelarConfig = document.getElementById('btn-cancelar-config');
const btnSalvarVoltar = document.getElementById('btn-salvar-voltar');

const navVisualizacao = document.getElementById('nav-visualizacao');
const navConfig = document.getElementById('nav-config');
const tabVerMapa = document.getElementById('tab-ver-mapa');
const tabVerFotos = document.getElementById('tab-ver-fotos');
const tabCfgMapa = document.getElementById('tab-cfg-mapa');
const tabCfgFotos = document.getElementById('tab-cfg-fotos');

// Seções da Aplicação
const secaoVerMapa = document.getElementById('secao-ver-mapa');
const secaoVerFotos = document.getElementById('secao-ver-fotos');
const secaoCfgMapa = document.getElementById('secao-cfg-mapa');
const secaoCfgFotos = document.getElementById('secao-cfg-fotos');

// Visualizador do Mapa (Aba 1)
const contadorObras = document.getElementById('contador-obras');
const inputFiltroObras = document.getElementById('input-filtro-obras');
const containerListaObras = document.getElementById('container-lista-obras');
const estadoVazio = document.getElementById('estado-vazio');
const cardVisualizacao = document.getElementById('card-visualizacao');
const viewNomeObra = document.getElementById('view-nome-obra');
const viewCoordenadas = document.getElementById('view-coordenadas');
const viewLocalizacao = document.getElementById('view-localizacao');
const viewDescricao = document.getElementById('view-descricao');
const viewAtterberg = document.getElementById('view-atterberg');
const viewGranulometria = document.getElementById('view-granulometria');
const viewCompactacao = document.getElementById('view-compactacao');
const linkGoogleMaps = document.getElementById('link-externo-google-maps');
const btnFecharView = document.getElementById('btn-fechar-view');
const btnAtalhoEditarObra = document.getElementById('btn-atalho-editar-obra');
const viewFotosSecao = document.getElementById('view-fotos-secao');
const boxViewFoto1 = document.getElementById('box-view-foto1');
const viewFoto1 = document.getElementById('view-foto1');
const boxViewFoto2 = document.getElementById('box-view-foto2');
const viewFoto2 = document.getElementById('view-foto2');

// Visualizador de Fotos de Turmas (Aba 2)
const inputFiltroTurmasView = document.getElementById('input-filtro-turmas-view');
const containerTurmasPublicas = document.getElementById('container-turmas-publicas');

// Configurador do Mapa (Aba 3)
const formObra = document.getElementById('form-obra');
const formModoBadge = document.getElementById('form-modo-badge');
const formTitulo = document.getElementById('form-titulo');
const campoIdEdicao = document.getElementById('campo-id-edicao');
const campoLat = document.getElementById('campo-lat');
const campoLng = document.getElementById('campo-lng');
const campoNome = document.getElementById('campo-nome');
const campoCoordenadas = document.getElementById('campo-coordenadas');
const statusCoordenadas = document.getElementById('status-coordenadas');
const campoLocalizacao = document.getElementById('campo-localizacao');
const campoDescricao = document.getElementById('campo-descricao');
const seletorAtterberg = document.getElementById('seletor-atterberg');
const seletorGranulometria = document.getElementById('seletor-granulometria');
const seletorCompactacao = document.getElementById('seletor-compactacao');
const btnNovoPonto = document.getElementById('btn-novo-ponto');
const btnLimparForm = document.getElementById('btn-limpar-formulario');
const inputFiltroEditor = document.getElementById('input-filtro-editor');
const containerListaEditor = document.getElementById('container-lista-obras-editor');

const campoFoto1 = document.getElementById('campo-foto1');
const previewFoto1Box = document.getElementById('preview-foto1-box');
const previewFoto1Img = document.getElementById('preview-foto1-img');
const btnRemoverFoto1 = document.getElementById('btn-remover-foto1');

const campoFoto2 = document.getElementById('campo-foto2');
const previewFoto2Box = document.getElementById('preview-foto2-box');
const previewFoto2Img = document.getElementById('preview-foto2-img');
const btnRemoverFoto2 = document.getElementById('btn-remover-foto2');

// Gerenciador de Seletores
const abasSeletoresBtns = document.querySelectorAll('.btn-aba-seletor');
const containerChipsOpcoes = document.getElementById('container-chips-opcoes');
const inputNovaOpcao = document.getElementById('input-nova-opcao');
const btnAdicionarOpcao = document.getElementById('btn-adicionar-opcao');

// Configurador de Fotos / Turmas (Aba 4)
const formTurmaCfg = document.getElementById('form-turma-cfg');
const turmaCfgIdEdicao = document.getElementById('turma-cfg-id-edicao');
const turmaCampoSemestre = document.getElementById('turma-campo-semestre');
const turmaCampoNome = document.getElementById('turma-campo-nome');
const turmaCampoDescricao = document.getElementById('turma-campo-descricao');
const turmaInputFotos = document.getElementById('turma-input-fotos');
const turmaContainerPreviews = document.getElementById('turma-container-previews');
const badgeModoTurma = document.getElementById('badge-modo-turma');
const tituloFormTurma = document.getElementById('titulo-form-turma');
const btnLimparFormTurma = document.getElementById('btn-limpar-form-turma');
const btnCancelarTurmaCfg = document.getElementById('btn-cancelar-turma-cfg');
const inputFiltroTurmasCfg = document.getElementById('input-filtro-turmas-cfg');
const containerTurmasConfig = document.getElementById('container-turmas-config');

// Lightbox
const modalLightbox = document.getElementById('modal-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const btnFecharLightbox = document.getElementById('btn-fechar-lightbox');

// ==========================================================================
// FUNÇÕES AUXILIARES E COMPRESSÃO DE IMAGENS
// ==========================================================================

function atualizarStatusNuvem(online, texto) {
  if (!statusNuvem) return;
  statusNuvem.className = `badge-status-nuvem ${online ? 'status-online' : 'status-local'}`;
  statusNuvem.innerHTML = online ? `🟢 ${texto}` : `🟡 ${texto}`;
}

function exibirToast(mensagem, duracao = 4000) {
  if (!toastNotificacao) return;
  toastNotificacao.textContent = mensagem;
  toastNotificacao.classList.add('visivel');
  setTimeout(() => {
    toastNotificacao.classList.remove('visivel');
  }, duracao);
}

// Comprime fotos no cliente (JPEG max 1200px / 75% qualidade)
function comprimirImagem(file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Arquivo não é uma imagem válida.'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Lightbox
window.abrirLightbox = function(src) {
  if (!modalLightbox || !lightboxImg || !src) return;
  lightboxImg.src = src;
  modalLightbox.classList.add('visivel');
};

function fecharLightbox() {
  if (!modalLightbox) return;
  modalLightbox.classList.remove('visivel');
  if (lightboxImg) lightboxImg.src = '';
}

if (btnFecharLightbox) btnFecharLightbox.addEventListener('click', fecharLightbox);
if (modalLightbox) {
  modalLightbox.addEventListener('click', (e) => {
    if (e.target === modalLightbox) fecharLightbox();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharLightbox();
});

// Ícones SVG para os marcadores do mapa
function criarIconeMarcador(tipo = 'salvo') {
  let corClasse = 'pin-salvo';
  if (tipo === 'novo') corClasse = 'pin-novo';
  if (tipo === 'selecionado') corClasse = 'pin-selecionado';

  const html = `
    <div class="pin-corpo ${corClasse}">
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

// ==========================================================================
// CONTROLE DE NAVEGAÇÃO E MODOS (VISUALIZAÇÃO vs CONFIGURAÇÃO)
// ==========================================================================

function alternarModo(novoModo) {
  modoAtual = novoModo;

  if (novoModo === 'view') {
    // Topo
    acoesModoVisualizacao.style.display = 'flex';
    acoesModoConfig.style.display = 'none';

    // Navegação de baixo (Apenas 2 botões)
    navVisualizacao.style.display = 'flex';
    navConfig.style.display = 'none';

    ativarAbaVisualizacao(subAbaView || 'mapa');
  } else {
    // Modo Configuração
    // Topo
    acoesModoVisualizacao.style.display = 'none';
    acoesModoConfig.style.display = 'flex';

    // Navegação de baixo (Apenas 2 botões)
    navVisualizacao.style.display = 'none';
    navConfig.style.display = 'flex';

    ativarAbaConfiguracao(subAbaCfg || 'mapa');
  }
}

function ativarAbaVisualizacao(aba) {
  subAbaView = aba;

  tabVerMapa.classList.toggle('ativo', aba === 'mapa');
  tabVerFotos.classList.toggle('ativo', aba === 'fotos');

  secaoVerMapa.style.display = aba === 'mapa' ? 'block' : 'none';
  secaoVerFotos.style.display = aba === 'fotos' ? 'block' : 'none';
  secaoCfgMapa.style.display = 'none';
  secaoCfgFotos.style.display = 'none';

  if (aba === 'mapa') {
    setTimeout(() => {
      if (mapaViewer) mapaViewer.invalidateSize();
    }, 120);
  } else if (aba === 'fotos') {
    renderizarTurmasPublicas();
  }
}

function ativarAbaConfiguracao(aba) {
  subAbaCfg = aba;

  tabCfgMapa.classList.toggle('ativo', aba === 'mapa');
  tabCfgFotos.classList.toggle('ativo', aba === 'fotos');

  secaoVerMapa.style.display = 'none';
  secaoVerFotos.style.display = 'none';
  secaoCfgMapa.style.display = aba === 'mapa' ? 'block' : 'none';
  secaoCfgFotos.style.display = aba === 'fotos' ? 'block' : 'none';

  if (aba === 'mapa') {
    setTimeout(() => {
      if (!mapaEditor) inicializarMapaEditor();
      if (mapaEditor) mapaEditor.invalidateSize();
    }, 120);
    renderizarListaEditor();
  } else if (aba === 'fotos') {
    renderizarTurmasConfig();
  }
}

// Eventos dos Botões do Cabeçalho e Abas
if (btnEntrarConfig) {
  btnEntrarConfig.addEventListener('click', () => {
    alternarModo('config');
  });
}

if (btnCancelarConfig) {
  btnCancelarConfig.addEventListener('click', () => {
    limparFormularioObra();
    limparFormularioTurma();
    alternarModo('view');
  });
}

if (btnSalvarVoltar) {
  btnSalvarVoltar.addEventListener('click', async () => {
    await sincronizarTudoComNuvem();
    alternarModo('view');
  });
}

// Abas do Modo Visualização
if (tabVerMapa) {
  tabVerMapa.addEventListener('click', () => ativarAbaVisualizacao('mapa'));
}
if (tabVerFotos) {
  tabVerFotos.addEventListener('click', () => ativarAbaVisualizacao('fotos'));
}

// Abas do Modo Configuração
if (tabCfgMapa) {
  tabCfgMapa.addEventListener('click', () => ativarAbaConfiguracao('mapa'));
}
if (tabCfgFotos) {
  tabCfgFotos.addEventListener('click', () => ativarAbaConfiguracao('fotos'));
}

// Atalho do visualizador para editar a obra no painel
if (btnAtalhoEditarObra) {
  btnAtalhoEditarObra.addEventListener('click', () => {
    if (!obraAtivaViewerId) return;
    const id = obraAtivaViewerId;
    alternarModo('config');
    ativarAbaConfiguracao('mapa');
    carregarObraNoFormulario(id);
  });
}

// ==========================================================================
// PERSISTÊNCIA E SINCRONIZAÇÃO EM NUVEM (SUPABASE / VERCEL)
// ==========================================================================

async function carregarTodosDados() {
  // 1. Tenta carregar da nuvem
  try {
    const resp = await fetch('/api/solos');
    if (resp.ok) {
      const nuvem = await resp.json();
      if (nuvem && nuvem.conectado) {
        const nomeProvedor = nuvem.provider === 'supabase' ? 'Supabase Online' : 'Nuvem Conectada';
        atualizarStatusNuvem(true, nomeProvedor);

        if (Array.isArray(nuvem.pontos)) {
          obrasLista = nuvem.pontos;
          salvarObrasLocal();
        }
        if (nuvem.opcoesSeletores && typeof nuvem.opcoesSeletores === 'object') {
          opcoesSeletores = nuvem.opcoesSeletores;
          salvarOpcoesLocal();
        }
        if (Array.isArray(nuvem.turmas)) {
          turmasLista = nuvem.turmas;
          salvarTurmasLocal();
        }

        if (obrasLista.length > 0) return;
      } else if (nuvem && nuvem.precisaCriarTabela) {
        atualizarStatusNuvem(false, 'Criar Tabela SQL (Supabase)');
      } else {
        atualizarStatusNuvem(false, 'Modo Local');
      }
    } else {
      atualizarStatusNuvem(false, 'Modo Local');
    }
  } catch (err) {
    atualizarStatusNuvem(false, 'Modo Local');
  }

  // 2. Fallback para localStorage
  try {
    const rawObras = localStorage.getItem('conquista_obras_pontos');
    if (rawObras) obrasLista = JSON.parse(rawObras);
  } catch (e) {}

  try {
    const rawOpcoes = localStorage.getItem('conquista_opcoes_seletores');
    if (rawOpcoes) opcoesSeletores = JSON.parse(rawOpcoes);
  } catch (e) {}

  try {
    const rawTurmas = localStorage.getItem('conquista_turmas');
    if (rawTurmas) turmasLista = JSON.parse(rawTurmas);
  } catch (e) {}

  // 3. Fallback para dados_solos.js
  if (!obrasLista || obrasLista.length === 0) {
    if (window.DADOS_SOLOS_PUBLICOS && Array.isArray(window.DADOS_SOLOS_PUBLICOS.pontos)) {
      obrasLista = JSON.parse(JSON.stringify(window.DADOS_SOLOS_PUBLICOS.pontos));
    } else {
      obrasLista = [];
    }
  }

  if (!opcoesSeletores || !opcoesSeletores.atterberg || opcoesSeletores.atterberg.length === 0) {
    if (window.DADOS_SOLOS_PUBLICOS && window.DADOS_SOLOS_PUBLICOS.opcoesSeletores) {
      opcoesSeletores = JSON.parse(JSON.stringify(window.DADOS_SOLOS_PUBLICOS.opcoesSeletores));
    } else {
      opcoesSeletores = JSON.parse(JSON.stringify(OPCOES_PADRAO));
    }
  }

  if (!turmasLista || turmasLista.length === 0) {
    if (window.DADOS_SOLOS_PUBLICOS && Array.isArray(window.DADOS_SOLOS_PUBLICOS.turmas)) {
      turmasLista = JSON.parse(JSON.stringify(window.DADOS_SOLOS_PUBLICOS.turmas));
    } else {
      turmasLista = [];
    }
  }
}

function salvarObrasLocal() {
  try { localStorage.setItem('conquista_obras_pontos', JSON.stringify(obrasLista)); } catch (e) {}
}

function salvarOpcoesLocal() {
  try { localStorage.setItem('conquista_opcoes_seletores', JSON.stringify(opcoesSeletores)); } catch (e) {}
}

function salvarTurmasLocal() {
  try { localStorage.setItem('conquista_turmas', JSON.stringify(turmasLista)); } catch (e) {}
}

// Sincronização geral com a nuvem (acionada pelo botão "Salvar e Voltar")
async function sincronizarTudoComNuvem() {
  if (!btnSalvarVoltar) return;
  const textoOriginal = btnSalvarVoltar.innerHTML;
  btnSalvarVoltar.disabled = true;
  btnSalvarVoltar.innerHTML = '⏳ Salvando na Nuvem...';

  // Salva no localStorage primeiro
  salvarObrasLocal();
  salvarOpcoesLocal();
  salvarTurmasLocal();

  try {
    const resp = await fetch('/api/solos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'sincronizar_tudo',
        pontos: obrasLista,
        opcoesSeletores: opcoesSeletores,
        turmas: turmasLista
      })
    });

    const res = await resp.json();
    if (res && res.conectado) {
      const nomeProvedor = res.provider === 'supabase' ? 'Supabase' : 'Vercel';
      atualizarStatusNuvem(true, `${nomeProvedor} Online`);
      exibirToast(`✓ Alterações sincronizadas com sucesso no ${nomeProvedor}!`);
    } else if (res && res.precisaCriarTabela) {
      atualizarStatusNuvem(false, 'Criar Tabela SQL (Supabase)');
      alert('⚠️ O Supabase está conectado, mas a tabela "solos_data" ainda não foi criada no banco. Execute o SQL no painel do Supabase.');
    } else {
      atualizarStatusNuvem(false, 'Modo Local');
      exibirToast('✓ Dados salvos localmente.');
    }
  } catch (err) {
    console.warn('Erro ao sincronizar nuvem:', err);
    exibirToast('✓ Dados salvos localmente (offline).');
  } finally {
    btnSalvarVoltar.disabled = false;
    btnSalvarVoltar.innerHTML = textoOriginal;

    // Atualiza as visualizações
    renderizarMarcadoresViewer();
    renderizarListaViewer();
    renderizarTurmasPublicas();
  }
}

// ==========================================================================
// 1. MAPA DO VISUALIZADOR (ABA "MAPA")
// ==========================================================================

function inicializarMapaViewer() {
  const container = document.getElementById('mapa-obras');
  if (!container || mapaViewer) return;

  mapaViewer = L.map('mapa-obras', {
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
    attribution: '© OpenStreetMap'
  });

  camadaGoogle.addTo(mapaViewer);

  L.control.layers({
    'Google Maps (Ruas)': camadaGoogle,
    'Google Satélite': camadaSatelite,
    'OpenStreetMap': camadaOSM
  }, null, { position: 'topright' }).addTo(mapaViewer);
}

function renderizarMarcadoresViewer() {
  if (!mapaViewer) return;

  Object.values(marcadoresViewerPorId).forEach(m => mapaViewer.removeLayer(m));
  marcadoresViewerPorId = {};

  const bounds = [];

  obrasLista.forEach(obra => {
    if (typeof obra.lat !== 'number' || typeof obra.lng !== 'number') return;

    const icone = criarIconeMarcador(obra.id === obraAtivaViewerId ? 'selecionado' : 'salvo');
    const marker = L.marker([obra.lat, obra.lng], { icon: icone }).addTo(mapaViewer);

    marker.bindTooltip(`<strong>${obra.nome || 'Obra'}</strong><br><small style="color:#64748b">${obra.localizacao || ''}</small>`, {
      direction: 'top',
      className: 'tooltip-obra'
    });

    marker.on('click', () => exibirObraViewer(obra.id));

    marcadoresViewerPorId[obra.id] = marker;
    bounds.push([obra.lat, obra.lng]);
  });

  if (bounds.length > 0 && !obraAtivaViewerId) {
    if (bounds.length === 1) {
      mapaViewer.setView(bounds[0], 15);
    } else {
      mapaViewer.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }

  if (contadorObras) {
    contadorObras.textContent = `${obrasLista.length} obra(s) mapeada(s)`;
  }
}

function renderizarListaViewer(filtro = '') {
  if (!containerListaObras) return;
  containerListaObras.innerHTML = '';

  const termo = filtro.trim().toLowerCase();
  const filtradas = obrasLista.filter(o => {
    if (!termo) return true;
    const nome = (o.nome || '').toLowerCase();
    const loc = (o.localizacao || '').toLowerCase();
    const desc = (o.descricao || '').toLowerCase();
    return nome.includes(termo) || loc.includes(termo) || desc.includes(termo);
  });

  if (filtradas.length === 0) {
    containerListaObras.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: #94a3b8; font-size: 0.88rem;">
        Nenhuma obra encontrada.
      </div>
    `;
    return;
  }

  filtradas.forEach(obra => {
    const card = document.createElement('div');
    card.className = `card-obra-item ${obra.id === obraAtivaViewerId ? 'ativo' : ''}`;
    card.id = `card-viewer-${obra.id}`;
    card.innerHTML = `
      <div class="obra-item-nome">
        <span>📍</span>
        <span>${obra.nome || 'Obra sem nome'}</span>
      </div>
      <div class="obra-item-local">${obra.localizacao || 'Vitória da Conquista'}</div>
      <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">
        ${obra.atterberg ? `<strong>Solo:</strong> ${obra.granulometria || obra.atterberg}` : 'Sem ensaio informado'}
      </div>
    `;

    card.addEventListener('click', () => exibirObraViewer(obra.id));
    containerListaObras.appendChild(card);
  });
}

function exibirObraViewer(obraId) {
  const obra = obrasLista.find(o => o.id === obraId);
  if (!obra) return;

  obraAtivaViewerId = obraId;

  // Atualiza destaque no mapa
  Object.keys(marcadoresViewerPorId).forEach(id => {
    const m = marcadoresViewerPorId[id];
    if (m) m.setIcon(criarIconeMarcador(id === obraId ? 'selecionado' : 'salvo'));
  });

  // Atualiza destaque na lista
  document.querySelectorAll('.card-obra-item').forEach(c => c.classList.remove('ativo'));
  const cardAtivo = document.getElementById(`card-viewer-${obraId}`);
  if (cardAtivo) {
    cardAtivo.classList.add('ativo');
    cardAtivo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (mapaViewer && typeof obra.lat === 'number') {
    mapaViewer.flyTo([obra.lat, obra.lng], 16, { duration: 0.8 });
  }

  // Preenche dados
  viewNomeObra.textContent = obra.nome || 'Obra sem título';
  viewCoordenadas.textContent = `${obra.lat.toFixed(6)}, ${obra.lng.toFixed(6)}`;
  viewLocalizacao.textContent = obra.localizacao || 'Vitória da Conquista, BA';
  viewDescricao.textContent = obra.descricao || 'Nenhuma descrição detalhada registrada para esta obra.';
  viewAtterberg.textContent = obra.atterberg || 'Não informado';
  viewGranulometria.textContent = obra.granulometria || 'Não informado';
  viewCompactacao.textContent = obra.compactacao || 'Não informado';

  if (linkGoogleMaps) {
    linkGoogleMaps.href = `https://www.google.com/maps?q=${obra.lat},${obra.lng}`;
  }

  // Fotos da obra (abaixo de granulometria e compactação)
  let temFoto = false;
  if (obra.foto1 && boxViewFoto1 && viewFoto1) {
    viewFoto1.src = obra.foto1;
    boxViewFoto1.style.display = 'block';
    temFoto = true;
  } else if (boxViewFoto1) {
    boxViewFoto1.style.display = 'none';
  }

  if (obra.foto2 && boxViewFoto2 && viewFoto2) {
    viewFoto2.src = obra.foto2;
    boxViewFoto2.style.display = 'block';
    temFoto = true;
  } else if (boxViewFoto2) {
    boxViewFoto2.style.display = 'none';
  }

  if (viewFotosSecao) {
    viewFotosSecao.style.display = temFoto ? 'block' : 'none';
  }

  estadoVazio.style.display = 'none';
  cardVisualizacao.style.display = 'block';

  if (window.innerWidth < 1024) {
    cardVisualizacao.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function fecharVisualizacaoObra() {
  obraAtivaViewerId = null;
  Object.keys(marcadoresViewerPorId).forEach(id => {
    const m = marcadoresViewerPorId[id];
    if (m) m.setIcon(criarIconeMarcador('salvo'));
  });
  document.querySelectorAll('.card-obra-item').forEach(c => c.classList.remove('ativo'));

  cardVisualizacao.style.display = 'none';
  estadoVazio.style.display = 'block';
}

if (btnFecharView) btnFecharView.addEventListener('click', fecharVisualizacaoObra);

if (boxViewFoto1) boxViewFoto1.addEventListener('click', () => abrirLightbox(viewFoto1.src));
if (boxViewFoto2) boxViewFoto2.addEventListener('click', () => abrirLightbox(viewFoto2.src));

if (inputFiltroObras) {
  inputFiltroObras.addEventListener('input', (e) => {
    renderizarListaViewer(e.target.value);
  });
}

// ==========================================================================
// 2. GALERIA PÚBLICA DE FOTOS DAS TURMAS (ABA "FOTOS")
// ==========================================================================

function renderizarTurmasPublicas(filtro = '') {
  if (!containerTurmasPublicas) return;
  containerTurmasPublicas.innerHTML = '';

  const termo = (filtro || (inputFiltroTurmasView ? inputFiltroTurmasView.value : '')).trim().toLowerCase();
  const filtradas = turmasLista.filter(t => {
    if (!termo) return true;
    const sem = (t.semestre || '').toLowerCase();
    const nome = (t.nome || '').toLowerCase();
    const desc = (t.descricao || '').toLowerCase();
    return sem.includes(termo) || nome.includes(termo) || desc.includes(termo);
  });

  if (filtradas.length === 0) {
    containerTurmasPublicas.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1;">
        <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🎓</span>
        <h3 style="color: #475569; margin-bottom: 6px;">Nenhum registro de turma encontrado</h3>
        <p style="font-size: 0.88rem;">Entre no menu "⚙️ Configuração" para cadastrar semestres e fotos de turmas.</p>
      </div>
    `;
    return;
  }

  filtradas.forEach(turma => {
    const card = document.createElement('article');
    card.className = 'card-turma';

    let fotosHtml = '';
    if (Array.isArray(turma.fotos) && turma.fotos.length > 0) {
      fotosHtml = `
        <div class="turma-galeria">
          ${turma.fotos.map((f, i) => `
            <div class="turma-foto-thumb" title="Clique para ampliar" onclick="abrirLightbox('${f}')">
              <img src="${f}" alt="Foto ${i + 1} da Turma ${turma.semestre}">
            </div>
          `).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="turma-cabecalho">
        <div>
          <span class="badge-semestre">Semestre ${turma.semestre || 'Não especificado'}</span>
          <h3 class="turma-nome">${turma.nome || `Turma de Geotecnia ${turma.semestre}`}</h3>
        </div>
      </div>

      <div class="turma-descricao-box">
        <div class="turma-descricao-titulo">O que a turma realizou:</div>
        <div>${turma.descricao || 'Nenhuma descrição informada.'}</div>
      </div>

      ${fotosHtml}
    `;

    containerTurmasPublicas.appendChild(card);
  });
}

if (inputFiltroTurmasView) {
  inputFiltroTurmasView.addEventListener('input', (e) => {
    renderizarTurmasPublicas(e.target.value);
  });
}

// ==========================================================================
// 3. MAPA DE CONFIGURAÇÃO / CADASTRO DE OBRAS (ABA "CONFIGURAR MAPA")
// ==========================================================================

function inicializarMapaEditor() {
  const container = document.getElementById('mapa-editor');
  if (!container || mapaEditor) return;

  mapaEditor = L.map('mapa-editor', {
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
    attribution: '© OpenStreetMap'
  });

  camadaGoogle.addTo(mapaEditor);

  L.control.layers({
    'Google Maps (Ruas)': camadaGoogle,
    'Google Satélite': camadaSatelite,
    'OpenStreetMap': camadaOSM
  }, null, { position: 'topright' }).addTo(mapaEditor);

  // Clique no mapa para marcar terreno
  mapaEditor.on('click', (e) => {
    definirPontoNoMapa(e.latlng.lat, e.latlng.lng, true);
  });

  renderizarMarcadoresEditor();
}

function definirPontoNoMapa(lat, lng, buscarEndereco = false) {
  campoLat.value = lat;
  campoLng.value = lng;
  campoCoordenadas.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  statusCoordenadas.textContent = 'Coordenadas capturadas!';
  statusCoordenadas.style.color = '#15803d';

  if (marcadorEdicao) {
    marcadorEdicao.setLatLng([lat, lng]);
  } else {
    marcadorEdicao = L.marker([lat, lng], {
      icon: criarIconeMarcador('novo'),
      draggable: true
    }).addTo(mapaEditor);

    marcadorEdicao.on('dragend', (ev) => {
      const pos = ev.target.getLatLng();
      definirPontoNoMapa(pos.lat, pos.lng, true);
    });
  }

  if (buscarEndereco) {
    obterEnderecoPorCoordenadas(lat, lng);
  }
}

async function obterEnderecoPorCoordenadas(lat, lng) {
  campoLocalizacao.placeholder = 'Buscando endereço...';
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.address) {
        const addr = data.address;
        const rua = addr.road || addr.street || addr.pedestrian || '';
        const bairro = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
        let texto = '';
        if (rua && bairro) texto = `${rua}, Bairro ${bairro}`;
        else if (bairro) texto = `Bairro ${bairro}, Vitória da Conquista`;
        else if (rua) texto = `${rua}, Vitória da Conquista`;
        else texto = data.display_name.split(',').slice(0, 3).join(',');

        campoLocalizacao.value = texto || 'Vitória da Conquista, BA';
        return;
      }
    }
  } catch (err) {}
  campoLocalizacao.placeholder = 'Ex: Av. Olívia Flores, Bairro Candeias';
}

function renderizarMarcadoresEditor() {
  if (!mapaEditor) return;

  Object.values(marcadoresEditorPorId).forEach(m => mapaEditor.removeLayer(m));
  marcadoresEditorPorId = {};

  obrasLista.forEach(obra => {
    if (typeof obra.lat !== 'number' || typeof obra.lng !== 'number') return;

    const icone = criarIconeMarcador('salvo');
    const marker = L.marker([obra.lat, obra.lng], { icon: icone }).addTo(mapaEditor);

    marker.bindTooltip(`<strong>${obra.nome || 'Obra'}</strong>`, { direction: 'top' });
    marker.on('click', () => carregarObraNoFormulario(obra.id));

    marcadoresEditorPorId[obra.id] = marker;
  });
}

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
      <div style="grid-column: 1 / -1; padding: 15px; text-align: center; color: #94a3b8; font-size: 0.85rem;">
        Nenhuma obra cadastrada ainda.
      </div>
    `;
    return;
  }

  filtradas.forEach(obra => {
    const card = document.createElement('div');
    card.className = 'card-obra-item';
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

window.carregarObraNoFormulario = function(obraId) {
  const obra = obrasLista.find(o => o.id === obraId);
  if (!obra) return;

  campoIdEdicao.value = obra.id;
  campoNome.value = obra.nome || '';
  campoLocalizacao.value = obra.localizacao || '';
  campoDescricao.value = obra.descricao || '';

  seletorAtterberg.value = obra.atterberg || '';
  seletorGranulometria.value = obra.granulometria || '';
  seletorCompactacao.value = obra.compactacao || '';

  // Fotos
  foto1Base64 = obra.foto1 || '';
  if (foto1Base64 && previewFoto1Box && previewFoto1Img) {
    previewFoto1Img.src = foto1Base64;
    previewFoto1Box.style.display = 'block';
  } else if (previewFoto1Box) {
    previewFoto1Box.style.display = 'none';
  }

  foto2Base64 = obra.foto2 || '';
  if (foto2Base64 && previewFoto2Box && previewFoto2Img) {
    previewFoto2Img.src = foto2Base64;
    previewFoto2Box.style.display = 'block';
  } else if (previewFoto2Box) {
    previewFoto2Box.style.display = 'none';
  }

  formModoBadge.textContent = 'Editando Obra';
  formModoBadge.style.color = '#0284c7';
  formTitulo.textContent = 'Editar Informações da Obra';

  if (!mapaEditor) inicializarMapaEditor();
  definirPontoNoMapa(obra.lat, obra.lng, false);

  if (mapaEditor) {
    mapaEditor.flyTo([obra.lat, obra.lng], 16, { duration: 0.7 });
  }

  formObra.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.excluirObra = function(obraId) {
  const obra = obrasLista.find(o => o.id === obraId);
  if (!obra) return;

  if (confirm(`Tem certeza que deseja remover a obra "${obra.nome}"?`)) {
    obrasLista = obrasLista.filter(o => o.id !== obraId);
    salvarObrasLocal();

    if (campoIdEdicao.value === obraId) {
      limparFormularioObra();
    }

    renderizarMarcadoresEditor();
    renderizarListaEditor();
    renderizarMarcadoresViewer();
    renderizarListaViewer();

    exibirToast(`Obra "${obra.nome}" removida localmente.`);
  }
};

function limparFormularioObra() {
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

  foto1Base64 = '';
  if (campoFoto1) campoFoto1.value = '';
  if (previewFoto1Box) previewFoto1Box.style.display = 'none';

  foto2Base64 = '';
  if (campoFoto2) campoFoto2.value = '';
  if (previewFoto2Box) previewFoto2Box.style.display = 'none';

  statusCoordenadas.textContent = 'Clique no mapa';
  statusCoordenadas.style.color = 'var(--solo-azul)';

  formModoBadge.textContent = 'Novo Ponto';
  formModoBadge.style.color = '#fb923c';
  formTitulo.textContent = 'Cadastrar Obra / Terreno';

  if (marcadorEdicao && mapaEditor) {
    mapaEditor.removeLayer(marcadorEdicao);
    marcadorEdicao = null;
  }
}

if (btnNovoPonto) btnNovoPonto.addEventListener('click', limparFormularioObra);
if (btnLimparForm) btnLimparForm.addEventListener('click', limparFormularioObra);

// Handlers de Upload das Fotos da Obra
if (campoFoto1) {
  campoFoto1.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      foto1Base64 = await comprimirImagem(file);
      previewFoto1Img.src = foto1Base64;
      previewFoto1Box.style.display = 'block';
    } catch (err) {
      alert('Erro ao carregar Foto 1: ' + err.message);
    }
  });
}
if (btnRemoverFoto1) {
  btnRemoverFoto1.addEventListener('click', () => {
    foto1Base64 = '';
    if (campoFoto1) campoFoto1.value = '';
    previewFoto1Img.src = '';
    previewFoto1Box.style.display = 'none';
  });
}

if (campoFoto2) {
  campoFoto2.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      foto2Base64 = await comprimirImagem(file);
      previewFoto2Img.src = foto2Base64;
      previewFoto2Box.style.display = 'block';
    } catch (err) {
      alert('Erro ao carregar Foto 2: ' + err.message);
    }
  });
}
if (btnRemoverFoto2) {
  btnRemoverFoto2.addEventListener('click', () => {
    foto2Base64 = '';
    if (campoFoto2) campoFoto2.value = '';
    previewFoto2Img.src = '';
    previewFoto2Box.style.display = 'none';
  });
}

// Salvar Obra no Formulário
if (formObra) {
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
      foto1: foto1Base64 || '',
      foto2: foto2Base64 || '',
      atualizadoEm: new Date().toISOString()
    };

    if (idEdicao) {
      const idx = obrasLista.findIndex(o => o.id === idEdicao);
      if (idx !== -1) obrasLista[idx] = { ...obrasLista[idx], ...dadosObra };
    } else {
      obrasLista.unshift(dadosObra);
    }

    salvarObrasLocal();
    renderizarMarcadoresEditor();
    renderizarListaEditor();
    renderizarMarcadoresViewer();
    renderizarListaViewer();

    exibirToast(`✓ Obra "${dadosObra.nome}" adicionada/atualizada no mapa!`);
    limparFormularioObra();
  });
}

if (inputFiltroEditor) {
  inputFiltroEditor.addEventListener('input', (e) => {
    renderizarListaEditor(e.target.value);
  });
}

// ==========================================================================
// GERENCIADOR DE OPÇÕES DOS 3 SELETORES
// ==========================================================================

function atualizarDropdownsFormulario() {
  const preencherSelect = (elem, opcoes, valorAtual) => {
    if (!elem) return;
    elem.innerHTML = '<option value="">-- Selecione uma opção --</option>';
    (opcoes || []).forEach(op => {
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

function renderizarChipsAbaAtiva() {
  if (!containerChipsOpcoes) return;
  containerChipsOpcoes.innerHTML = '';

  const lista = opcoesSeletores[seletorAtivoAba] || [];

  if (lista.length === 0) {
    containerChipsOpcoes.innerHTML = '<span style="color:#94a3b8; font-size:0.82rem; font-style:italic;">Nenhuma opção cadastrada para este seletor.</span>';
    return;
  }

  lista.forEach((opcao, index) => {
    const chip = document.createElement('span');
    chip.className = 'chip-opcao';
    chip.innerHTML = `
      <span>${opcao}</span>
      <button type="button" title="Remover opção" onclick="removerOpcaoSeletor('${seletorAtivoAba}', ${index})">✕</button>
    `;
    containerChipsOpcoes.appendChild(chip);
  });
}

window.removerOpcaoSeletor = function(seletorKey, index) {
  if (!opcoesSeletores[seletorKey]) return;
  opcoesSeletores[seletorKey].splice(index, 1);
  salvarOpcoesLocal();
  renderizarChipsAbaAtiva();
  atualizarDropdownsFormulario();
};

function adicionarNovaOpcaoSeletor() {
  if (!inputNovaOpcao) return;
  const valor = inputNovaOpcao.value.trim();
  if (!valor) return;

  if (!opcoesSeletores[seletorAtivoAba]) opcoesSeletores[seletorAtivoAba] = [];

  if (opcoesSeletores[seletorAtivoAba].includes(valor)) {
    alert('Esta opção já existe para este seletor.');
    return;
  }

  opcoesSeletores[seletorAtivoAba].push(valor);
  salvarOpcoesLocal();
  inputNovaOpcao.value = '';
  renderizarChipsAbaAtiva();
  atualizarDropdownsFormulario();
}

if (btnAdicionarOpcao) btnAdicionarOpcao.addEventListener('click', adicionarNovaOpcaoSeletor);
if (inputNovaOpcao) {
  inputNovaOpcao.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarNovaOpcaoSeletor();
    }
  });
}

abasSeletoresBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    abasSeletoresBtns.forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    seletorAtivoAba = btn.getAttribute('data-seletor');
    renderizarChipsAbaAtiva();
  });
});

// ==========================================================================
// 4. CONFIGURAÇÃO DE TURMAS E FOTOS (ABA "CONFIGURAR FOTOS")
// ==========================================================================

function renderizarTurmasConfig(filtro = '') {
  if (!containerTurmasConfig) return;
  containerTurmasConfig.innerHTML = '';

  const termo = (filtro || (inputFiltroTurmasCfg ? inputFiltroTurmasCfg.value : '')).trim().toLowerCase();
  const filtradas = turmasLista.filter(t => {
    if (!termo) return true;
    const sem = (t.semestre || '').toLowerCase();
    const nome = (t.nome || '').toLowerCase();
    return sem.includes(termo) || nome.includes(termo);
  });

  if (filtradas.length === 0) {
    containerTurmasConfig.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 25px; text-align: center; color: #94a3b8; font-size: 0.88rem;">
        Nenhuma turma cadastrada no momento.
      </div>
    `;
    return;
  }

  filtradas.forEach(turma => {
    const card = document.createElement('article');
    card.className = 'card-turma';

    let fotosHtml = '';
    if (Array.isArray(turma.fotos) && turma.fotos.length > 0) {
      fotosHtml = `
        <div class="turma-galeria">
          ${turma.fotos.map((f, i) => `
            <div class="turma-foto-thumb" title="Clique para ampliar" onclick="abrirLightbox('${f}')">
              <img src="${f}" alt="Foto ${i + 1}">
            </div>
          `).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="turma-cabecalho">
        <div>
          <span class="badge-semestre">Semestre ${turma.semestre || ''}</span>
          <h3 class="turma-nome">${turma.nome || `Turma ${turma.semestre}`}</h3>
        </div>
      </div>

      <div class="turma-descricao-box">
        <div class="turma-descricao-titulo">O que a turma realizou:</div>
        <div>${turma.descricao || ''}</div>
      </div>

      ${fotosHtml}

      <div class="turma-acoes-rodape">
        <button type="button" class="btn-mini-acao" onclick="carregarTurmaNoFormulario('${turma.id}')">✏️ Editar</button>
        <button type="button" class="btn-mini-acao btn-mini-excluir" onclick="excluirTurmaConfig('${turma.id}')">🗑️ Excluir</button>
      </div>
    `;

    containerTurmasConfig.appendChild(card);
  });
}

function renderizarPreviewsTurmaTemp() {
  if (!turmaContainerPreviews) return;
  turmaContainerPreviews.innerHTML = '';

  fotosTurmaTemp.forEach((foto, idx) => {
    const box = document.createElement('div');
    box.className = 'turma-foto-thumb';
    box.style.position = 'relative';
    box.innerHTML = `
      <img src="${foto}" alt="Prévia">
      <button type="button" class="btn-remover-foto" style="width:22px; height:22px; font-size:11px;" title="Remover" onclick="removerFotoTurmaTemp(${idx})">✕</button>
    `;
    turmaContainerPreviews.appendChild(box);
  });
}

window.removerFotoTurmaTemp = function(idx) {
  fotosTurmaTemp.splice(idx, 1);
  renderizarPreviewsTurmaTemp();
};

if (turmaInputFotos) {
  turmaInputFotos.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      try {
        const base64 = await comprimirImagem(file);
        fotosTurmaTemp.push(base64);
      } catch (err) {
        console.warn('Erro ao comprimir foto:', err);
      }
    }

    turmaInputFotos.value = '';
    renderizarPreviewsTurmaTemp();
  });
}

window.carregarTurmaNoFormulario = function(id) {
  const turma = turmasLista.find(t => t.id === id);
  if (!turma) return;

  turmaCfgIdEdicao.value = turma.id;
  turmaCampoSemestre.value = turma.semestre || '';
  turmaCampoNome.value = turma.nome || '';
  turmaCampoDescricao.value = turma.descricao || '';
  fotosTurmaTemp = Array.isArray(turma.fotos) ? [...turma.fotos] : [];

  badgeModoTurma.textContent = 'Editando Turma';
  badgeModoTurma.style.background = '#e0f2fe';
  badgeModoTurma.style.color = '#0284c7';
  tituloFormTurma.textContent = `Editar Turma (${turma.semestre})`;

  renderizarPreviewsTurmaTemp();
  formTurmaCfg.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.excluirTurmaConfig = function(id) {
  const turma = turmasLista.find(t => t.id === id);
  if (!turma) return;

  if (confirm(`Deseja realmente remover o registro da turma "${turma.semestre}"?`)) {
    turmasLista = turmasLista.filter(t => t.id !== id);
    salvarTurmasLocal();
    renderizarTurmasConfig();
    renderizarTurmasPublicas();
    exibirToast(`Registro da turma "${turma.semestre}" removido localmente.`);
  }
};

function limparFormularioTurma() {
  turmaCfgIdEdicao.value = '';
  turmaCampoSemestre.value = '';
  turmaCampoNome.value = '';
  turmaCampoDescricao.value = '';
  fotosTurmaTemp = [];
  renderizarPreviewsTurmaTemp();

  badgeModoTurma.textContent = 'Nova Turma';
  badgeModoTurma.style.background = '#f0fdf4';
  badgeModoTurma.style.color = '#15803d';
  tituloFormTurma.textContent = 'Cadastrar / Editar Registro da Turma';
}

if (btnLimparFormTurma) btnLimparFormTurma.addEventListener('click', limparFormularioTurma);
if (btnCancelarTurmaCfg) btnCancelarTurmaCfg.addEventListener('click', limparFormularioTurma);

if (formTurmaCfg) {
  formTurmaCfg.addEventListener('submit', (e) => {
    e.preventDefault();

    const semestre = turmaCampoSemestre.value.trim();
    const descricao = turmaCampoDescricao.value.trim();

    if (!semestre) {
      alert('Informe o semestre da turma.');
      turmaCampoSemestre.focus();
      return;
    }
    if (!descricao) {
      alert('Descreva as atividades e ensaios realizados.');
      turmaCampoDescricao.focus();
      return;
    }

    const idEdicao = turmaCfgIdEdicao.value;
    const turmaObj = {
      id: idEdicao || `turma-${Date.now()}`,
      semestre: semestre,
      nome: turmaCampoNome.value.trim() || `Turma de Geotecnia ${semestre}`,
      descricao: descricao,
      fotos: [...fotosTurmaTemp],
      atualizadoEm: new Date().toISOString()
    };

    if (idEdicao) {
      const idx = turmasLista.findIndex(t => t.id === idEdicao);
      if (idx !== -1) turmasLista[idx] = { ...turmasLista[idx], ...turmaObj };
    } else {
      turmasLista.unshift(turmaObj);
    }

    salvarTurmasLocal();
    renderizarTurmasConfig();
    renderizarTurmasPublicas();

    exibirToast(`✓ Registro da turma ${turmaObj.semestre} salvo localmente!`);
    limparFormularioTurma();
  });
}

if (inputFiltroTurmasCfg) {
  inputFiltroTurmasCfg.addEventListener('input', (e) => {
    renderizarTurmasConfig(e.target.value);
  });
}

// ==========================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await carregarTodosDados();

  // Inicializa visualizador
  inicializarMapaViewer();
  renderizarMarcadoresViewer();
  renderizarListaViewer();
  renderizarTurmasPublicas();

  // Inicializa componentes do editor
  atualizarDropdownsFormulario();
  renderizarChipsAbaAtiva();

  // Configura estado inicial (Modo Visualização na aba Mapa)
  alternarModo('view');
  ativarAbaVisualizacao('mapa');

  // Suporte a hash da URL (ex: #fotos ou #config)
  if (window.location.hash === '#fotos') {
    ativarAbaVisualizacao('fotos');
  } else if (window.location.hash.startsWith('#config')) {
    alternarModo('config');
  } else if (window.location.hash.startsWith('#obra-') || window.location.hash.startsWith('#ponto-')) {
    const id = window.location.hash.replace('#', '');
    exibirObraViewer(id);
  }
});
