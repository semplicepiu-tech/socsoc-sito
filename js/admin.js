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
  const imageInput = document.getElementById('productImage');
  const imagePreviewWrap = document.getElementById('imagePreviewWrap');
  const imagePreview = document.getElementById('imagePreview');

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

  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      imageInput.value = '';
      return setMsg(productMessage, 'La foto supera 5 MB. Riducila e riprova.', 'error');
    }
    imagePreview.src = URL.createObjectURL(file);
    imagePreviewWrap.hidden = false;
  });

  function resetForm() {
    productForm.reset();
    $('productId').value = '';
    $('existingImagePath').value = '';
    $('existingImageUrl').value = '';
    formTitle.textContent = 'Nuovo prodotto';
    cancelEditBtn.hidden = true;
    imagePreviewWrap.hidden = true;
    imagePreview.removeAttribute('src');
    setMsg(productMessage, '');
  }

  newProductBtn.addEventListener('click', () => {
    resetForm();
    document.querySelector('.admin-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  cancelEditBtn.addEventListener('click', resetForm);

  async function uploadImage(file) {
    const { data: authData } = await client.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) throw new Error('Sessione scaduta. Accedi di nuovo.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await client.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
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
      let imagePath = $('existingImagePath').value || null;
      let imageUrl = $('existingImageUrl').value || null;
      const file = imageInput.files?.[0];

      if (file) {
        const uploaded = await uploadImage(file);
        const oldPath = imagePath;
        imagePath = uploaded.path;
        imageUrl = uploaded.url;
        if (oldPath) await client.storage.from('product-images').remove([oldPath]);
      }

      const payload = {
        name: $('productName').value.trim(),
        category: $('productCategory').value,
        price: $('productPrice').value.trim() || 'Prezzo su richiesta',
        description: $('productDescription').value.trim(),
        status: $('productStatus').value,
        image_url: imageUrl,
        image_path: imagePath,
        updated_at: new Date().toISOString()
      };

      const query = id ? client.from('products').update(payload).eq('id', id) : client.from('products').insert(payload);
      const { error } = await query;
      if (error) throw error;

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
      $('existingImagePath').value = product.image_path || '';
      $('existingImageUrl').value = product.image_url || '';
      formTitle.textContent = 'Modifica prodotto';
      cancelEditBtn.hidden = false;
      if (product.image_url) { imagePreview.src = product.image_url; imagePreviewWrap.hidden = false; } else { imagePreviewWrap.hidden = true; }
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
      if (product.image_path) await client.storage.from('product-images').remove([product.image_path]);
      resetForm();
      return loadProducts();
    }
  });

  checkSession();
})();
