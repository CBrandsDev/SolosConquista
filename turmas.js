/* ==========================================================================
   GALERIA DE TURMAS E ENSAIOS GEOTÉCNICOS - VITÓRIA DA CONQUISTA (BA)
   Controle por Semestre, Fotos de Campo/Laboratório e Descrição das Atividades
   ========================================================================== */

let turmasLista = [];
let fotosTemporarias = [];

// Elementos DOM
const statusNuvem = document.getElementById('status-nuvem');
const secaoFormTurma = document.getElementById('secao-form-turma');
const btnAbrirFormTurma = document.getElementById('btn-abrir-form-turma');
const btnFecharFormTurma = document.getElementById('btn-fechar-form-turma');
const btnCancelarTurma = document.getElementById('btn-cancelar-turma');

const formTurma = document.getElementById('form-turma');
const turmaIdEdicao = document.getElementById('turma-id-edicao');
const campoSemestre = document.getElementById('campo-semestre');
const campoNomeTurma = document.getElementById('campo-nome-turma');
const campoDescricaoTurma = document.getElementById('campo-descricao-turma');
const inputFotosTurma = document.getElementById('input-fotos-turma');
const containerPreviewsTurma = document.getElementById('container-previews-turma');
const alertaTurma = document.getElementById('alerta-turma');

const containerCardsTurmas = document.getElementById('container-cards-turmas');
const inputFiltroTurmas = document.getElementById('input-filtro-turmas');
const badgeModoTurma = document.getElementById('badge-modo-turma');
const tituloFormTurma = document.getElementById('titulo-form-turma');

// Lightbox
const modalLightbox = document.getElementById('modal-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const btnFecharLightbox = document.getElementById('btn-fechar-lightbox');

function atualizarStatusNuvem(online, texto) {
  if (!statusNuvem) return;
  statusNuvem.className = `badge-status-nuvem ${online ? 'status-online' : 'status-local'}`;
  statusNuvem.innerHTML = online ? `🟢 ${texto}` : `🟡 ${texto}`;
}

// Compressão de fotos do cliente antes de salvar
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

// Carrega as turmas do backend na nuvem ou localStorage
async function carregarTurmas() {
  // 1. Tenta carregar da nuvem
  try {
    const resp = await fetch('/api/solos');
    if (resp.ok) {
      const dados = await resp.json();
      if (dados && dados.conectado) {
        const provedorNome = dados.provider === 'supabase' ? 'Supabase Online' : 'Nuvem Conectada';
        atualizarStatusNuvem(true, provedorNome);
        if (Array.isArray(dados.turmas) && dados.turmas.length > 0) {
          turmasLista = dados.turmas;
          persistirLocal();
          return;
        }
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
    const raw = localStorage.getItem('conquista_turmas');
    if (raw) turmasLista = JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler localStorage de turmas:', e);
  }

  // 3. Fallback para dados_solos.js
  if (!turmasLista || turmasLista.length === 0) {
    if (window.DADOS_SOLOS_PUBLICOS && Array.isArray(window.DADOS_SOLOS_PUBLICOS.turmas)) {
      turmasLista = JSON.parse(JSON.stringify(window.DADOS_SOLOS_PUBLICOS.turmas));
    } else {
      turmasLista = [];
    }
  }
}

function persistirLocal() {
  try {
    localStorage.setItem('conquista_turmas', JSON.stringify(turmasLista));
  } catch (e) {}
}

// Sincroniza turma com o backend na nuvem
async function salvarTurmaNuvem(turma) {
  try {
    const resp = await fetch('/api/solos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'salvar_turma', turma })
    });
    const res = await resp.json();
    if (res && res.conectado) {
      const provedor = res.provider === 'supabase' ? 'Supabase' : 'Vercel';
      atualizarStatusNuvem(true, `${provedor} Online`);
      exibirAlerta(`✓ Registro da turma salvo no ${provedor} para todos!`);
    }
  } catch (err) {
    console.warn('Erro ao salvar turma na nuvem:', err);
  }
}

async function excluirTurmaNuvem(turmaId) {
  try {
    const resp = await fetch('/api/solos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'excluir_turma', id: turmaId })
    });
    const res = await resp.json();
    if (res && res.conectado) {
      atualizarStatusNuvem(true, 'Nuvem Conectada');
    }
  } catch (err) {
    console.warn('Erro ao excluir turma na nuvem:', err);
  }
}

// Renderiza a lista de cards de turmas
function renderizarTurmas(filtro = '') {
  if (!containerCardsTurmas) return;
  containerCardsTurmas.innerHTML = '';

  const termo = filtro.trim().toLowerCase();
  const filtradas = turmasLista.filter(t => {
    if (!termo) return true;
    const sem = (t.semestre || '').toLowerCase();
    const nome = (t.nome || '').toLowerCase();
    const desc = (t.descricao || '').toLowerCase();
    return sem.includes(termo) || nome.includes(termo) || desc.includes(termo);
  });

  if (filtradas.length === 0) {
    containerCardsTurmas.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1;">
        <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🎓</span>
        <h3 style="color: #475569; margin-bottom: 6px;">Nenhum registro de turma encontrado</h3>
        <p style="font-size: 0.88rem;">Clique no botão "＋ Cadastrar Turma" acima para registrar o semestre e as fotos dos alunos.</p>
      </div>
    `;
    return;
  }

  filtradas.forEach(turma => {
    const card = document.createElement('article');
    card.className = 'card-turma';
    card.id = `turma-card-${turma.id}`;

    // Fotos miniaturas
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
        <div>${turma.descricao || 'Nenhuma descrição detalhada informada.'}</div>
      </div>

      ${fotosHtml}

      <div class="turma-acoes-rodape">
        <button type="button" class="btn-mini-acao" onclick="editarTurma('${turma.id}')">✏️ Editar</button>
        <button type="button" class="btn-mini-acao btn-mini-excluir" onclick="excluirTurma('${turma.id}')">🗑️ Excluir</button>
      </div>
    `;

    containerCardsTurmas.appendChild(card);
  });
}

// Edita uma turma existente
window.editarTurma = function(id) {
  const turma = turmasLista.find(t => t.id === id);
  if (!turma) return;

  turmaIdEdicao.value = turma.id;
  campoSemestre.value = turma.semestre || '';
  campoNomeTurma.value = turma.nome || '';
  campoDescricaoTurma.value = turma.descricao || '';
  fotosTemporarias = Array.isArray(turma.fotos) ? [...turma.fotos] : [];

  badgeModoTurma.textContent = 'Editando Turma';
  badgeModoTurma.style.background = '#e0f2fe';
  badgeModoTurma.style.color = '#0284c7';
  tituloFormTurma.textContent = `Editar Turma (${turma.semestre})`;

  renderizarPreviewsFotos();
  secaoFormTurma.style.display = 'block';
  secaoFormTurma.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Exclui uma turma
window.excluirTurma = function(id) {
  const turma = turmasLista.find(t => t.id === id);
  if (!turma) return;

  if (confirm(`Tem certeza que deseja remover o registro da turma "${turma.semestre} - ${turma.nome || ''}"?`)) {
    turmasLista = turmasLista.filter(t => t.id !== id);
    persistirLocal();
    renderizarTurmas(inputFiltroTurmas ? inputFiltroTurmas.value : '');
    excluirTurmaNuvem(id);
    exibirAlerta(`Registro da turma "${turma.semestre}" removido.`);
  }
};

// Renderiza miniaturas de prévia no formulário
function renderizarPreviewsFotos() {
  if (!containerPreviewsTurma) return;
  containerPreviewsTurma.innerHTML = '';

  fotosTemporarias.forEach((foto, index) => {
    const box = document.createElement('div');
    box.className = 'turma-foto-thumb';
    box.style.position = 'relative';
    box.innerHTML = `
      <img src="${foto}" alt="Prévia">
      <button type="button" class="btn-remover-foto" style="width:22px; height:22px; font-size:11px;" title="Remover" onclick="removerFotoTemporaria(${index})">✕</button>
    `;
    containerPreviewsTurma.appendChild(box);
  });
}

window.removerFotoTemporaria = function(index) {
  fotosTemporarias.splice(index, 1);
  renderizarPreviewsFotos();
};

// Seleção de múltiplas fotos
if (inputFotosTurma) {
  inputFotosTurma.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      try {
        const base64 = await comprimirImagem(file);
        fotosTemporarias.push(base64);
      } catch (err) {
        console.warn('Erro ao comprimir foto da turma:', err);
      }
    }

    inputFotosTurma.value = '';
    renderizarPreviewsFotos();
  });
}

// Submissão do formulário de turma
if (formTurma) {
  formTurma.addEventListener('submit', (e) => {
    e.preventDefault();

    const semestre = campoSemestre.value.trim();
    const descricao = campoDescricaoTurma.value.trim();

    if (!semestre) {
      alert('Por favor, informe o semestre da turma (ex: 2024.2).');
      campoSemestre.focus();
      return;
    }

    if (!descricao) {
      alert('Por favor, descreva as atividades e ensaios realizados pela turma.');
      campoDescricaoTurma.focus();
      return;
    }

    const idEdicao = turmaIdEdicao.value;
    const turmaObj = {
      id: idEdicao || `turma-${Date.now()}`,
      semestre: semestre,
      nome: campoNomeTurma.value.trim() || `Turma de Geotecnia ${semestre}`,
      descricao: descricao,
      fotos: [...fotosTemporarias],
      atualizadoEm: new Date().toISOString()
    };

    if (idEdicao) {
      const idx = turmasLista.findIndex(t => t.id === idEdicao);
      if (idx !== -1) {
        turmasLista[idx] = { ...turmasLista[idx], ...turmaObj };
      }
    } else {
      turmasLista.unshift(turmaObj);
    }

    persistirLocal();
    renderizarTurmas(inputFiltroTurmas ? inputFiltroTurmas.value : '');
    salvarTurmaNuvem(turmaObj);

    exibirAlerta(`✓ Registro da turma ${turmaObj.semestre} salvo com sucesso!`);
    fecharFormulario();
  });
}

function fecharFormulario() {
  turmaIdEdicao.value = '';
  campoSemestre.value = '';
  campoNomeTurma.value = '';
  campoDescricaoTurma.value = '';
  fotosTemporarias = [];
  renderizarPreviewsFotos();

  badgeModoTurma.textContent = 'Nova Turma';
  badgeModoTurma.style.background = '#f0fdf4';
  badgeModoTurma.style.color = '#15803d';
  tituloFormTurma.textContent = 'Cadastrar Registro da Turma';

  secaoFormTurma.style.display = 'none';
}

if (btnAbrirFormTurma) {
  btnAbrirFormTurma.addEventListener('click', () => {
    fecharFormulario();
    secaoFormTurma.style.display = 'block';
    secaoFormTurma.scrollIntoView({ behavior: 'smooth', block: 'start' });
    campoSemestre.focus();
  });
}

if (btnFecharFormTurma) btnFecharFormTurma.addEventListener('click', fecharFormulario);
if (btnCancelarTurma) btnCancelarTurma.addEventListener('click', fecharFormulario);

// Feedback visual
function exibirAlerta(texto) {
  if (!alertaTurma) return;
  alertaTurma.textContent = texto;
  alertaTurma.classList.add('visivel');
  setTimeout(() => {
    alertaTurma.classList.remove('visivel');
  }, 3500);
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

// Filtro de turmas
if (inputFiltroTurmas) {
  inputFiltroTurmas.addEventListener('input', (e) => {
    renderizarTurmas(e.target.value);
  });
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  await carregarTurmas();
  renderizarTurmas();
});
