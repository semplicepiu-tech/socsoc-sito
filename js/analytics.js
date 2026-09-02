// TRACCIAMENTO STATISTICHE — SOC & SOC
// Scrive direttamente nel database Supabase del sito (nessun servizio esterno).
// Non salva alcun dato personale: solo pagina, tipo di evento, provenienza, orario.

(function () {
  // Stessi valori di js/supabase-config.js, ripetuti qui perché questo script
  // deve funzionare anche sulle pagine che non caricano già quel file
  // (l'anon key è pubblica per design, la sicurezza è nelle policy RLS).
  var CFG = {
    url: "https://wjhgjhwxxoykzppwudvb.supabase.co",
    anonKey: "sb_publishable_YSIRV9WGjdOExHUs0OnBMg_OEiRDs-4"
  };

  function sendEvent(eventType) {
    var payload = {
      path: window.location.pathname,
      event_type: eventType,
      referrer: document.referrer || null
    };

    fetch(CFG.url + '/rest/v1/analytics_events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CFG.anonKey,
        'Authorization': 'Bearer ' + CFG.anonKey
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {
      // Silenzioso: un errore di rete qui non deve mai bloccare la navigazione dell'utente.
    });
  }

  // Traccia la visita alla pagina
  sendEvent('pageview');

  // Traccia i click su link WhatsApp e telefono già presenti nella pagina
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="https://wa.me/"], a[href^="tel:"]');
    if (!link) return;
    var type = link.href.indexOf('wa.me') !== -1 ? 'click_whatsapp' : 'click_telefono';
    sendEvent(type);
  });
})();
