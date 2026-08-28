(() => {
  const cfg = window.SOCSOC_SUPABASE || {};
  const configured = cfg.url && cfg.anonKey && !cfg.url.includes('INCOLLA_QUI') && !cfg.anonKey.includes('INCOLLA_QUI');
  const grid = document.getElementById('productGrid');
  const message = document.getElementById('catalogMessage');
const search = document.getElementById('productSearch');
const categoryFilter = document.getElementById('categoryFilter');
const cards = [...document.querySelectorAll('.catalog-card')];
const count = document.getElementById('productCount');

function updateCatalog() {
  const query = (search.value || '').trim().toLowerCase();
  const activeFilter = categoryFilter.value;
  let visible = 0;

  cards.forEach(card => {
    const category = card.dataset.category || '';
    const name = (card.dataset.name || '').toLowerCase();
    const text = card.textContent.toLowerCase();

    const matchesFilter =
      activeFilter === 'tutti' || category === activeFilter;

    const matchesSearch =
      !query || name.includes(query) || text.includes(query);

    const show = matchesFilter && matchesSearch;

    card.hidden = !show;

    if (show) visible++;
  });

  count.textContent =
    visible === 1 ? '1 oggetto' : `${visible} oggetti`;
}

search.addEventListener('input', updateCatalog);
categoryFilter.addEventListener('change', updateCatalog);

updateCatalog();

    grid.innerHTML = visible.map(p => {
      const sold = p.status === 'sold';
      const image = p.image_url
        ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">`
        : '<div class="catalog-photo-placeholder">Foto non disponibile</div>';
      const status = sold ? 'Venduto' : 'Disponibile';
      const msg = `Ciao Soc & Soc, vorrei informazioni su: ${p.name}.`;
      return `
        <article class="catalog-card ${sold ? 'is-sold' : ''}">
          <div class="catalog-photo">
            <span class="product-status ${sold ? 'sold' : ''}">${status}</span>
            ${image}
          </div>
          <div class="catalog-body">
            <span class="catalog-category">${escapeHtml(p.category || 'altro')}</span>
            <p class="catalog-name">${escapeHtml(p.name)}</p>
            <p class="catalog-price">${escapeHtml(p.price || 'Prezzo su richiesta')}</p>
            <p class="catalog-note">${escapeHtml(p.description || 'Contattaci per informazioni, condizioni e ritiro.')}</p>
            <a class="btn btn-primary btn-small" href="${sold ? '#' : wa(msg)}" ${sold ? 'aria-disabled="true"' : 'target="_blank" rel="noopener"'}>${sold ? 'Prodotto venduto' : 'Chiedi su WhatsApp'}</a>
          </div>
        </article>`;
    }).join('');
  }

  filterButtons.forEach(btn => btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeFilter = btn.dataset.filter;
    render();
  }));

  search.addEventListener('input', render);

  async function loadProducts() {
    if (!configured || !window.supabase) {
      count.textContent = 'Catalogo non collegato';
      showMessage('Il catalogo dinamico non è ancora collegato. Completa la configurazione Supabase per pubblicare i prodotti dall’area admin.');
      return;
    }

    const client = window.supabase.createClient(cfg.url, cfg.anonKey);
    const { data, error } = await client.from('products').select('*').order('status', { ascending: true }).order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      count.textContent = 'Catalogo non disponibile';
      showMessage('Non siamo riusciti a caricare il catalogo. Puoi comunque contattarci su WhatsApp.');
      return;
    }

    products = data || [];
    render();
  }

  loadProducts();
})();
