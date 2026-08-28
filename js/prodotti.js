(() => {
  const cfg = window.SOCSOC_SUPABASE || {};
  const configured = cfg.url && cfg.anonKey && !cfg.url.includes('INCOLLA_QUI') && !cfg.anonKey.includes('INCOLLA_QUI');
  const grid = document.getElementById('productGrid');
  const count = document.getElementById('productCount');
  const message = document.getElementById('catalogMessage');
  const search = document.getElementById('productSearch');
  const filterButtons = [...document.querySelectorAll('.catalog-filter')];

  let products = [];
  let activeFilter = 'tutti';

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const wa = text => `https://wa.me/393515088368?text=${encodeURIComponent(text)}`;

  function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
  }

  function render() {
    const q = (search.value || '').trim().toLowerCase();
    const visible = products.filter(p => {
      const matchesFilter = activeFilter === 'tutti' || p.category === activeFilter;
      const haystack = `${p.name || ''} ${p.description || ''} ${p.price || ''} ${p.category || ''}`.toLowerCase();
      return matchesFilter && (!q || haystack.includes(q));
    });

    count.textContent = visible.length === 1 ? '1 oggetto visualizzato' : `${visible.length} oggetti visualizzati`;

    if (!visible.length) {
      grid.innerHTML = '<div class="catalog-message">Nessun oggetto trovato con questi filtri.</div>';
      return;
    }

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
