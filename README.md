# 🗺️ Mapeamento de Obras e Solos - Vitória da Conquista (BA)

Sistema georreferenciado para cadastro e consulta de terrenos, obras e ensaios geotécnicos de solos (Limites de Atterberg, Granulometria e Compactação) no padrão Google Maps.

---

## 🚀 Novas Funcionalidades

1. **Mapa no Padrão Google Maps:**
   - As demarcações de bairros foram retiradas. O mapa exibe a malha viária real com ruas, avenidas e topografia de Vitória da Conquista, com seletor de camadas (Ruas, Satélite e OpenStreetMap).

2. **Marcação Direta de Terrenos por Ponto:**
   - Para adicionar um terreno, basta **clicar em qualquer ponto no mapa**.
   - As coordenadas exatas (`Latitude` e `Longitude`) são capturadas instantaneamente.
   - A localização (rua/bairro) é preenchida automaticamente por geocodificação reversa.
   - O marcador é arrastável pelo mapa para ajuste fino.

3. **Campos Específicos de Geotecnia:**
   - **Nome da Obra / Terreno**
   - **Coordenadas** (com link direto para abrir no Google Maps)
   - **Localização**
   - **Descrição do Local**
   - **3 Seletores de Ensaio:**
     - 🧪 **Limite de Atterberg**
     - 📐 **Granulometria**
     - 🏗️ **Compactação**

4. **Gerenciador de Opções dos 3 Seletores:**
   - No painel de configurações ([editor.html](file:///home/calil/Projects/siteConquista/editor.html)), há uma área para **adicionar** e **remover** opções de cada um dos 3 seletores livremente.

5. **Imagens Removidas:**
   - O sistema agora é 100% focado em dados técnicos e georreferenciamento, sem campos de upload de imagem.

---

## 📄 Páginas do Sistema

- **[index.html](file:///home/calil/Projects/siteConquista/index.html) — Mapa Principal:** Visualização das obras no mapa, consulta dos ensaios e filtro de busca.
- **[editor.html](file:///home/calil/Projects/siteConquista/editor.html) — Painel de Configurações:** Cadastro de novas obras no mapa, edição/exclusão e gerenciamento das opções dos 3 seletores.

---

## 💾 Como Salvar Backup e Publicar no Netlify

1. Acesse o [editor.html](file:///home/calil/Projects/siteConquista/editor.html) no seu computador.
2. Adicione ou edite os terrenos e configure os seletores como desejar.
3. No topo, clique em **"💾 Salvar Backup"**.
4. Ele baixará o arquivo **`dados_solos.js`**.
5. Mantenha/substitua esse arquivo na pasta `siteConquista` e reenvie a pasta para o [Netlify](https://app.netlify.com/).
6. O site já abrirá com todas as obras e seletores configurados para qualquer pessoa na internet!
