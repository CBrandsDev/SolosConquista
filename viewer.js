/* ==========================================================================
   VISUALIZADOR DE OBRAS E SOLOS - VITÓRIA DA CONQUISTA (BA)
   Mapa estilo Google Maps com Marcadores de Obras e Ensaios Geotécnicos
   ========================================================================== */

let mapaLeaflet = null;
let marcadoresPorId = {};
let obrasLista = [];
let obraAtivaId = null;

// Ícone SVG para os marcadores no mapa
function criarIconeMarcador(ativo = false) {
  const corClasse = ativo ? 'pin-selecionado' : 'pin-salvo';
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

// Elemento de status da nuvem
const statusNuvem = document.getElementById('status-nuvem');

function atualizarStatusNuvem(online, texto) {
  if (!statusNuvem) return;
  statusNuvem.className = `badge-status-nuvem ${online ? 'status-online' : 'status-local'}`;
  statusNuvem.innerHTML = online ? `🟢 ${texto}` : `🟡 ${texto}`;
}

// Carrega as obras da Nuvem Vercel (com fallback para localStorage e dados_solos.js)
async function carregarObras() {
  // 1. Tenta buscar da nuvem (Vercel KV)
  try {
    const resp = await fetch('/api/solos');
    if (resp.ok) {
      const dados = await resp.json();
      if (dados && dados.conectado) {
        const provedorNome = dados.provider === 'supabase' ? 'Supabase Online' : 'Nuvem Conectada';
        atualizarStatusNuvem(true, provedorNome);
        if (Array.isArray(dados.pontos) && dados.pontos.length > 0) {
          try {
            localStorage.setItem('conquista_obras_pontos', JSON.stringify(dados.pontos));
          } catch (e) {}
        }
        if (Array.isArray(dados.turmas)) {
          try {
            localStorage.setItem('conquista_turmas', JSON.stringify(dados.turmas));
          } catch (e) {}
        }
        if (Array.isArray(dados.pontos) && dados.pontos.length > 0) {
          return dados.pontos;
        }
      } else if (dados && dados.precisaCriarTabela) {
        atualizarStatusNuvem(false, 'Criar Tabela SQL');
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
  let locais = null;
  try {
    const raw = localStorage.getItem('conquista_obras_pontos');
    if (raw) locais = JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler localStorage:', e);
  }

  if (locais && Array.isArray(locais) && locais.length > 0) {
    return locais;
  }

  // 3. Fallback para os dados pré-configurados do dados_solos.js
  if (window.DADOS_SOLOS_PUBLICOS && Array.isArray(window.DADOS_SOLOS_PUBLICOS.pontos)) {
    return window.DADOS_SOLOS_PUBLICOS.pontos;
  }

  return [];
}

// Elementos DOM
const estadoVazio = document.getElementById('estado-vazio');
const cardVisualizacao = document.getElementById('card-visualizacao');
const viewNome = document.getElementById('view-nome-obra');
const viewCoord = document.getElementById('view-coordenadas');
const viewLocalizacao = document.getElementById('view-localizacao');
const viewDescricao = document.getElementById('view-descricao');
const viewAtterberg = document.getElementById('view-atterberg');
const viewGranulometria = document.getElementById('view-granulometria');
const viewCompactacao = document.getElementById('view-compactacao');
const linkGoogleMaps = document.getElementById('link-externo-google-maps');
const linkEditarObra = document.getElementById('link-editar-obra');
const btnFechar = document.getElementById('btn-fechar-view');
const contadorObras = document.getElementById('contador-obras');
const containerListaObras = document.getElementById('container-lista-obras');
const inputFiltro = document.getElementById('input-filtro-obras');

// Elementos de Fotos e Lightbox
const viewFotosSecao = document.getElementById('view-fotos-secao');
const boxViewFoto1 = document.getElementById('box-view-foto1');
const viewFoto1 = document.getElementById('view-foto1');
const boxViewFoto2 = document.getElementById('box-view-foto2');
const viewFoto2 = document.getElementById('view-foto2');
const modalLightbox = document.getElementById('modal-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const btnFecharLightbox = document.getElementById('btn-fechar-lightbox');

function abrirLightbox(src) {
  if (!modalLightbox || !lightboxImg || !src) return;
  lightboxImg.src = src;
  modalLightbox.classList.add('visivel');
}

function fecharLightbox() {
  if (!modalLightbox) return;
  modalLightbox.classList.remove('visivel');
  if (lightboxImg) lightboxImg.src = '';
}

if (boxViewFoto1) boxViewFoto1.addEventListener('click', () => abrirLightbox(viewFoto1.src));
if (boxViewFoto2) boxViewFoto2.addEventListener('click', () => abrirLightbox(viewFoto2.src));
if (btnFecharLightbox) btnFecharLightbox.addEventListener('click', fecharLightbox);
if (modalLightbox) {
  modalLightbox.addEventListener('click', (e) => {
    if (e.target === modalLightbox) fecharLightbox();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharLightbox();
});

// Inicializa o mapa com estilo Google Maps
function inicializarMapa() {
  const container = document.getElementById('mapa-obras');
  if (!container) return;

  // Centro de Vitória da Conquista
  mapaLeaflet = L.map('mapa-obras', {
    center: [-14.8600, -40.8400],
    zoom: 13,
    minZoom: 10,
    maxZoom: 20
  });

  // Camadas de mapas (Padrão Google Maps, Satélite e OpenStreetMap)
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

  // Adiciona a camada Google como padrão
  camadaGoogle.addTo(mapaLeaflet);

  // Adiciona seletor de camadas no canto superior direito
  L.control.layers({
    'Google Maps (Ruas)': camadaGoogle,
    'Google Satélite': camadaSatelite,
    'OpenStreetMap': camadaOSM
  }, null, { position: 'topright' }).addTo(mapaLeaflet);
}

// Renderiza os marcadores de todas as obras no mapa
function renderizarMarcadores(obras) {
  // Limpa marcadores anteriores
  Object.values(marcadoresPorId).forEach(m => mapaLeaflet.removeLayer(m));
  marcadoresPorId = {};

  const bounds = [];

  obras.forEach(obra => {
    if (typeof obra.lat !== 'number' || typeof obra.lng !== 'number') return;

    const icone = criarIconeMarcador(obra.id === obraAtivaId);
    const marker = L.marker([obra.lat, obra.lng], { icon: icone }).addTo(mapaLeaflet);

    // Tooltip elegante
    marker.bindTooltip(`<strong>${obra.nome || 'Obra sem nome'}</strong><br><small style="color:#64748b">${obra.localizacao || ''}</small>`, {
      direction: 'top',
      className: 'tooltip-obra'
    });

    marker.on('click', () => {
      exibirObra(obra.id);
    });

    marcadoresPorId[obra.id] = marker;
    bounds.push([obra.lat, obra.lng]);
  });

  // Se houver pontos cadastrados, ajusta o mapa para enquadrar todos
  if (bounds.length > 0 && !obraAtivaId) {
    if (bounds.length === 1) {
      mapaLeaflet.setView(bounds[0], 15);
    } else {
      mapaLeaflet.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }
}

// Renderiza a lista de cards de obras abaixo do mapa
function renderizarListaObras(obras, filtro = '') {
  if (!containerListaObras) return;
  containerListaObras.innerHTML = '';

  const termo = filtro.trim().toLowerCase();
  const filtradas = obras.filter(o => {
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
    card.className = `card-obra-item ${obra.id === obraAtivaId ? 'ativo' : ''}`;
    card.id = `card-item-${obra.id}`;
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

    card.addEventListener('click', () => {
      exibirObra(obra.id);
    });

    containerListaObras.appendChild(card);
  });
}

// Exibe os dados da obra selecionada
function exibirObra(obraId) {
  const obra = obrasLista.find(o => o.id === obraId);
  if (!obra) return;

  obraAtivaId = obraId;

  // Atualiza destaque dos marcadores
  Object.keys(marcadoresPorId).forEach(id => {
    const m = marcadoresPorId[id];
    if (m) {
      m.setIcon(criarIconeMarcador(id === obraId));
    }
  });

  // Atualiza destaque na lista
  document.querySelectorAll('.card-obra-item').forEach(c => c.classList.remove('ativo'));
  const cardAtivo = document.getElementById(`card-item-${obraId}`);
  if (cardAtivo) {
    cardAtivo.classList.add('ativo');
    cardAtivo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Centraliza o mapa na obra
  if (mapaLeaflet && typeof obra.lat === 'number') {
    mapaLeaflet.flyTo([obra.lat, obra.lng], 16, { duration: 0.8 });
  }

  // Preenche dados no card lateral
  viewNome.textContent = obra.nome || 'Obra sem título';
  const coordTexto = `${obra.lat.toFixed(6)}, ${obra.lng.toFixed(6)}`;
  viewCoord.textContent = coordTexto;
  viewLocalizacao.textContent = obra.localizacao || 'Vitória da Conquista, BA';
  viewDescricao.textContent = obra.descricao || 'Nenhuma descrição detalhada registrada para esta obra.';
  
  viewAtterberg.textContent = obra.atterberg || 'Não informado';
  viewGranulometria.textContent = obra.granulometria || 'Não informado';
  viewCompactacao.textContent = obra.compactacao || 'Não informado';

  // Fotos da obra / ensaio (abaixo de granulometria e compactação)
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

  if (linkGoogleMaps) {
    linkGoogleMaps.href = `https://www.google.com/maps?q=${obra.lat},${obra.lng}`;
  }

  if (linkEditarObra) {
    linkEditarObra.href = `editor.html#${obra.id}`;
  }

  // Exibe o painel de detalhes
  estadoVazio.style.display = 'none';
  cardVisualizacao.style.display = 'block';

  if (window.innerWidth < 1024) {
    cardVisualizacao.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function fecharVisualizacao() {
  obraAtivaId = null;
  Object.keys(marcadoresPorId).forEach(id => {
    const m = marcadoresPorId[id];
    if (m) m.setIcon(criarIconeMarcador(false));
  });
  document.querySelectorAll('.card-obra-item').forEach(c => c.classList.remove('ativo'));

  cardVisualizacao.style.display = 'none';
  estadoVazio.style.display = 'block';
}

if (btnFechar) {
  btnFechar.addEventListener('click', fecharVisualizacao);
}

// Filtro de busca de obras
if (inputFiltro) {
  inputFiltro.addEventListener('input', (e) => {
    renderizarListaObras(obrasLista, e.target.value);
  });
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  inicializarMapa();
  obrasLista = await carregarObras();

  if (contadorObras) {
    contadorObras.textContent = `${obrasLista.length} obra(s) mapeada(s)`;
  }

  renderizarMarcadores(obrasLista);
  renderizarListaObras(obrasLista);

  // Se houver hash na URL (#ponto-xxx), abre direto
  if (window.location.hash) {
    const id = window.location.hash.replace('#', '');
    exibirObra(id);
  }
});
