(() => {
  const cfg = window.SOCSOC_SUPABASE || {};
  const configured = cfg.url && cfg.anonKey && !cfg.url.includes('INCOLLA_QUI') && !cfg.anonKey.includes('INCOLLA_QUI');
  const setupPanel = document.getElementById('setupPanel');
  const loginPanel = document.getElementById('loginPanel');
  const dashboard = document.getElementById('dashboard');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const productForm = document.getElementById('productForm');
  const productMessage = document.getElementById('productMessage');
  const list = document.getElementById('adminProductList');
  const adminEmpty = document.getElementById('adminEmpty');
  const adminCount = document.getElementById('adminProductCount');
  const adminSearch = document.getElementById('adminSearch');
  const formTitle = document.getElementById('formTitle');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const newProductBtn = document.getElementById('newProductBtn');
  const imagesInput = document.getElementById('productImages');
  const imageGallery = document.getElementById('imageGallery');
  const MAX_IMAGES = 3;
  let existingImages = []; // [{url, path}] già salvate su questo prodotto
  let newFiles = [];       // File[] scelti ora, non ancora caricati

  if (!configured || !window.supabase) {
    setupPanel.hidden = false;
    loginPanel.hidden = true;
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  let products = [];

  const $ = id => document.getElementById(id);
  const safe = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const setMsg = (el, text, type='') => { el.textContent = text; el.className = `form-message ${type ? 'is-'+type : ''}`; };

  async function checkSession() {
    const { data } = await client.auth.getSession();
    updateAuthUI(data.session);
  }

  function updateAuthUI(session) {
    const logged = !!session;
    loginPanel.hidden = logged;
    dashboard.hidden = !logged;
    logoutBtn.hidden = !logged;
    if (logged) loadProducts();
  }

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    setMsg(loginMessage, 'Accesso in corso…');
    const { error } = await client.auth.signInWithPassword({ email: $('loginEmail').value.trim(), password: $('loginPassword').value });
    if (error) return setMsg(loginMessage, 'Email o password non corretti.', 'error');
    setMsg(loginMessage, '');
  });

  logoutBtn.addEventListener('click', async () => { await client.auth.signOut(); });
  client.auth.onAuthStateChange((_event, session) => updateAuthUI(session));

  function renderGallery() {
    const total = existingImages.length + newFiles.length;
    imageGallery.hidden = total === 0;

    const existingThumbs = existingImages.map((img, i) => `
      <div class="admin-image-thumb" data-kind="existing" data-index="${i}">
        <img src="${safe(img.url)}" alt="Foto prodotto">
        <button type="button" class="thumb-remove" data-kind="existing" data-index="${i}" aria-label="Rimuovi foto">×</button>
      </div>`).join('');

    const newThumbs = newFiles.map((file, i) => `
      <div class="admin-image-thumb" data-kind="new" data-index="${i}">
        <img src="${URL.createObjectURL(file)}" alt="Nuova foto">
        <span class="thumb-new">Nuova</span>
        <button type="button" class="thumb-remove" data-kind="new" data-index="${i}" aria-label="Rimuovi foto">×</button>
      </div>`).join('');

    imageGallery.innerHTML = existingThumbs + newThumbs;
  }

  imageGallery.addEventListener('click', e => {
    const btn = e.target.closest('.thumb-remove');
    if (!btn) return;
    const index = Number(btn.dataset.index);
    if (btn.dataset.kind === 'existing') existingImages.splice(index, 1);
    else newFiles.splice(index, 1);
    renderGallery();
  });

  imagesInput.addEventListener('change', () => {
    const chosen = Array.from(imagesInput.files || []);
    imagesInput.value = ''; // permette di riselezionare lo stesso file in seguito

    const remaining = MAX_IMAGES - existingImages.length - newFiles.length;
    if (remaining <= 0) {
      return setMsg(productMessage, `Hai già raggiunto il massimo di ${MAX_IMAGES} foto. Rimuovine una per aggiungerne un'altra.`, 'error');
    }

    const tooBig = chosen.filter(f => f.size > 5 * 1024 * 1024);
    const valid = chosen.filter(f => f.size <= 5 * 1024 * 1024).slice(0, remaining);

    if (tooBig.length) setMsg(productMessage, `${tooBig.length===1?'Una foto supera':'Alcune foto superano'} i 5 MB e ${tooBig.length===1?'non è stata':'non sono state'} aggiunta.`, 'error');
    else if (chosen.length > valid.length) setMsg(productMessage, `Puoi avere al massimo ${MAX_IMAGES} foto: solo le prime ${valid.length} sono state aggiunte.`, 'error');
    else setMsg(productMessage, '');

    newFiles.push(...valid);
    renderGallery();
  });

  function resetForm() {
    productForm.reset();
    $('productId').value = '';
    existingImages = [];
    newFiles = [];
    formTitle.textContent = 'Nuovo prodotto';
    cancelEditBtn.hidden = true;
    renderGallery();
    setMsg(productMessage, '');
  }

  newProductBtn.addEventListener('click', () => {
    resetForm();
    document.querySelector('.admin-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  cancelEditBtn.addEventListener('click', resetForm);

  async function uploadImage(file, attempt = 1) {
    const MAX_ATTEMPTS = 3;
    const { data: authData } = await client.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) throw new Error('Sessione scaduta. Accedi di nuovo.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await client.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) {
      // Errore di rete transitorio: riprovo automaticamente prima di arrendermi.
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`Upload fallito (tentativo ${attempt}), riprovo tra un istante...`, error);
        setMsg(productMessage, `Caricamento foto non riuscito, riprovo automaticamente (${attempt}/${MAX_ATTEMPTS - 1})…`);
        await new Promise(resolve => setTimeout(resolve, 1200 * attempt));
        return uploadImage(file, attempt + 1);
      }
      throw new Error('Impossibile caricare la foto dopo vari tentativi. Controlla la connessione e riprova.');
    }
    const { data } = client.storage.from('product-images').getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  productForm.addEventListener('submit', async e => {
    e.preventDefault();
    const saveBtn = $('saveProductBtn');
    saveBtn.disabled = true;
    setMsg(productMessage, 'Salvataggio in corso…');

    try {
      const id = $('productId').value;

      // Chi era già salvato in origine, per capire dopo cosa è stato tolto.
      const originalPaths = id ? (products.find(p => p.id === id)?.image_paths || []) : [];
      const keptPaths = existingImages.map(img => img.path);
      const removedPaths = originalPaths.filter(p => !keptPaths.includes(p));

      // Carico le nuove foto una alla volta (riusa uploadImage con retry già collaudato).
      const uploaded = [];
      for (const file of newFiles) {
        uploaded.push(await uploadImage(file));
      }

      const finalUrls = [...existingImages.map(i => i.url), ...uploaded.map(u => u.url)];
      const finalPaths = [...existingImages.map(i => i.path), ...uploaded.map(u => u.path)];

      const payload = {
        name: $('productName').value.trim(),
        category: $('productCategory').value,
        price: $('productPrice').value.trim() || 'Prezzo su richiesta',
        description: $('productDescription').value.trim(),
        status: $('productStatus').value,
        image_urls: finalUrls,
        image_paths: finalPaths,
        // Compatibilità: la pagina Prodotti pubblica userà ancora questi due
        // campi finché non completiamo l'aggiornamento della galleria pubblica.
        image_url: finalUrls[0] || null,
        image_path: finalPaths[0] || null,
        updated_at: new Date().toISOString()
      };

      const query = id ? client.from('products').update(payload).eq('id', id) : client.from('products').insert(payload);
      const { error } = await query;
      if (error) throw error;

      // Solo dopo il salvataggio riuscito, elimino dallo storage le foto rimosse.
      if (removedPaths.length) await client.storage.from('product-images').remove(removedPaths);

      setMsg(productMessage, id ? 'Prodotto aggiornato.' : 'Prodotto pubblicato.', 'success');
      await loadProducts();
      setTimeout(resetForm, 700);
    } catch (err) {
      console.error(err);
      setMsg(productMessage, err.message || 'Errore durante il salvataggio.', 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  async function loadProducts() {
    const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      list.innerHTML = '<div class="admin-empty">Errore nel caricamento del catalogo.</div>';
      return;
    }
    products = data || [];
    renderProducts();
  }

  function renderProducts() {
    const q = (adminSearch.value || '').trim().toLowerCase();
    const shown = products.filter(p => `${p.name||''} ${p.category||''} ${p.price||''}`.toLowerCase().includes(q));
    adminCount.textContent = products.length;
    adminEmpty.hidden = shown.length > 0;
    list.innerHTML = shown.map(p => `
      <article class="admin-product-item" data-id="${safe(p.id)}">
        <div class="admin-product-thumb">${p.image_url ? `<img src="${safe(p.image_url)}" alt="${safe(p.name)}">` : '<div class="admin-product-placeholder">Nessuna foto</div>'}</div>
        <div class="admin-product-info">
          <h3>${safe(p.name)}</h3>
          <p>${safe(p.price || 'Prezzo su richiesta')}</p>
          <div class="admin-product-meta"><span class="admin-chip">${safe(p.category)}</span><span class="admin-chip ${p.status==='sold'?'sold':''}">${p.status==='sold'?'Venduto':'Disponibile'}</span></div>
        </div>
        <div class="admin-product-actions">
          <button type="button" data-action="edit">Modifica</button>
          <button type="button" data-action="toggle">${p.status==='sold'?'Rimetti disponibile':'Segna venduto'}</button>
          <button type="button" class="delete" data-action="delete">Elimina</button>
        </div>
      </article>`).join('');
  }

  adminSearch.addEventListener('input', renderProducts);

  list.addEventListener('click', async e => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const item = button.closest('.admin-product-item');
    const product = products.find(p => p.id === item.dataset.id);
    if (!product) return;

    if (button.dataset.action === 'edit') {
      $('productId').value = product.id;
      $('productName').value = product.name || '';
      $('productCategory').value = product.category || 'altro';
      $('productStatus').value = product.status || 'available';
      $('productPrice').value = product.price || '';
      $('productDescription').value = product.description || '';
      const urls = product.image_urls?.length ? product.image_urls : (product.image_url ? [product.image_url] : []);
      const paths = product.image_paths?.length ? product.image_paths : (product.image_path ? [product.image_path] : []);
      existingImages = urls.map((url, i) => ({ url, path: paths[i] || '' }));
      newFiles = [];
      renderGallery();
      formTitle.textContent = 'Modifica prodotto';
      cancelEditBtn.hidden = false;
      document.querySelector('.admin-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (button.dataset.action === 'toggle') {
      const status = product.status === 'sold' ? 'available' : 'sold';
      const { error } = await client.from('products').update({ status, updated_at: new Date().toISOString() }).eq('id', product.id);
      if (error) return alert('Errore: ' + error.message);
      return loadProducts();
    }

    if (button.dataset.action === 'delete') {
      if (!confirm(`Eliminare definitivamente “${product.name}”?`)) return;
      const { error } = await client.from('products').delete().eq('id', product.id);
      if (error) return alert('Errore: ' + error.message);
      const pathsToRemove = product.image_paths?.length ? product.image_paths : (product.image_path ? [product.image_path] : []);
      if (pathsToRemove.length) await client.storage.from('product-images').remove(pathsToRemove);
      resetForm();
      return loadProducts();
    }
  });

  checkSession();
})();
