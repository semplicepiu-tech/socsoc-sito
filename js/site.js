(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open', !expanded);
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      });
    });
  }

  const form = document.querySelector('[data-whatsapp-form]');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = form.querySelector('[name="nome"]')?.value.trim() || '';
      const message = form.querySelector('[name="messaggio"]')?.value.trim() || '';
      if (!name || !message) return;
      const text = `Ciao Soc & Soc, sono ${name}. ${message}`;
      window.open(`https://wa.me/393515088368?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });
  }

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
