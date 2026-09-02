// TRACCIAMENTO STATISTICHE — SOC & SOC
// Scrive direttamente nel database Supabase del sito (nessun servizio esterno).
// Non salva alcun dato personale: nessun nome, email o indirizzo IP.
//
// visitor_id: stringa casuale salvata nel browser (localStorage) per riconoscere
//   se una visita è di una persona già vista prima, senza sapere chi sia.
//   Resta finché non viene cancellata la cache del browser.
// session_id: stringa casuale valida solo per questa "sessione" di navigazione
//   (sessionStorage), si azzera quando si chiude la scheda/il browser.
//   Serve a calcolare durata visita e tasso di rimbalzo.

(function () {
  var CFG = {
    url: "https://wjhgjhwxxoykzppwudvb.supabase.co",
    anonKey: "sb_publishable_YSIRV9WGjdOExHUs0OnBMg_OEiRDs-4"
  };

  function randomId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function getOrCreate(storage, key) {
    try {
      var val = storage.getItem(key);
      if (!val) {
        val = randomId();
        storage.setItem(key, val);
      }
      return val;
    } catch (e) {
      // Se il browser blocca storage (es. modalità privata rigida), usiamo un ID
      // temporaneo solo per questa pagina: i dati restano comunque anonimi.
      return randomId();
    }
  }

  var visitorId = getOrCreate(window.localStorage, 'socsoc_visitor_id');
  var sessionId = getOrCreate(window.sessionStorage, 'socsoc_session_id');

  function sendEvent(eventType) {
    var payload = {
      path: window.location.pathname,
      event_type: eventType,
      referrer: document.referrer || null,
      visitor_id: visitorId,
      session_id: sessionId
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
