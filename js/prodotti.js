(() => {
  const cfg = window.SOCSOC_SUPABASE || {};
  const configured =
    cfg.url &&
    cfg.anonKey &&
    !cfg.url.includes('INCOLLA_QUI') &&
    !cfg.anonKey.includes('INCOLLA_QUI');

  const grid = document.getElementById('productGrid');
  const count = document.getElementById('productCount');
  const message = document.getElementById('catalogMessage');
  const search = document.getElementById('productSearch');
  const categoryFilter = document.getElementById('categoryFilter');

  let products = [];

  const escapeHtml = value =>
    String(value ?? '').replace(/[&<>'"]/g, c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      "'":'&#039;',
      '"':'&quot;'
    }[c]));

  const wa = text =>
    `https://wa.me/393515088368?text=${encodeURIComponent(text)}`;

  function showMessage(text) {
    if (!message) return;
    message.textContent = text;
    message.hidden = false;
  }

  function hideMessage() {
    if (!message) return;
    message.hidden = true;
    message.textContent = '';
  }


  function formatPrice(price) {
    if (price === null || price === undefined || String(price).trim() === '') {
      return 'Prezzo su richiesta';
    }

    const cleaned = String(price)
      .replace(/[€\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();

    const number = Number(cleaned);

    if (Number.isNaN(number)) {
      return String(price);
    }

    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(number);
  }

  function render() {
    const q = (search?.value || '').trim().toLowerCase();
    const activeFilter = categoryFilter?.value || 'tutti';

    const visible = products.filter(p => {
      const category = (p.category || 'altro').toLowerCase();

      const matchesFilter =
        activeFilter === 'tutti' ||
        category === activeFilter;

      const haystack = `
        ${p.name || ''}
        ${p.description || ''}
        ${p.price || ''}
        ${p.category || ''}
      `.toLowerCase();

      return matchesFilter && (!q || haystack.includes(q));
    });

    if (count) {
      count.textContent =
        visible.length === 1
          ? '1 oggetto visualizzato'
          : `${visible.length} oggetti visualizzati`;
    }

    if (!grid) return;

    if (!visible.length) {
      grid.innerHTML = `
        <div class="catalog-message">
          Nessun oggetto trovato con questi filtri.
        </div>`;
      return;
    }

    grid.innerHTML = visible.map(p => {
      const sold = p.status === 'sold';

      const image = p.image_url
        ? `<img src="${escapeHtml(p.image_url)}"
                alt="${escapeHtml(p.name)}"
                loading="lazy">`
        : `<div class="catalog-photo-placeholder">
             Foto non disponibile
           </div>`;

      const status = sold ? 'Venduto' : 'Disponibile';
      const msg = `Ciao Soc & Soc, vorrei informazioni su: ${p.name}.`;

      return `
        <article class="catalog-card ${sold ? 'is-sold' : ''}">
          <div class="catalog-photo">
            <span class="product-status ${sold ? 'sold' : ''}">
              ${status}
            </span>

            ${image}
          </div>

          <div class="catalog-body">
            <span class="catalog-category">
              ${escapeHtml(p.category || 'altro')}
            </span>

            <p class="catalog-name">
              ${escapeHtml(p.name || 'Oggetto recuperato')}
            </p>

            <p class="catalog-price">
              ${escapeHtml(formatPrice(p.price))}
            </p>

            <p class="catalog-note">
              ${escapeHtml(
                p.description ||
                'Contattaci per informazioni, condizioni e ritiro.'
              )}
            </p>

            ${
              sold
                ? `<span class="btn btn-secondary btn-small"
                         aria-disabled="true">
                     Prodotto venduto
                   </span>`
                : `<a class="btn btn-primary btn-small"
                      href="${wa(msg)}"
                      target="_blank"
                      rel="noopener">
                     Chiedi su WhatsApp
                   </a>`
            }
          </div>
        </article>`;
    }).join('');
  }

  search?.addEventListener('input', render);
  categoryFilter?.addEventListener('change', render);

  async function loadProducts() {
    if (!configured) {
      if (count) count.textContent = 'Catalogo non collegato';
      showMessage(
        'Supabase non è configurato. Controlla js/supabase-config.js.'
      );
      return;
    }

    if (!window.supabase) {
      if (count) count.textContent = 'Catalogo non disponibile';
      showMessage(
        'La libreria Supabase non è stata caricata.'
      );
      return;
    }

    hideMessage();

    try {
      const client = window.supabase.createClient(
        cfg.url,
        cfg.anonKey
      );

      const { data, error } = await client
        .from('products')
        .select('*')
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      products = data || [];
      render();

    } catch (err) {
      console.error('Errore caricamento prodotti:', err);

      if (count) {
        count.textContent = 'Catalogo non disponibile';
      }

      showMessage(
        'Non siamo riusciti a caricare il catalogo. Controlla la configurazione Supabase e le policy RLS.'
      );
    }
  }

  loadProducts();
})();
