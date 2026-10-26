/* Service worker sederhana: network-first untuk file milik sendiri.
   Permintaan ke Firebase / CDN (beda origin) tidak disentuh sama sekali,
   jadi data anggota tidak pernah disimpan di cache. */
const V = 'arisan-v1';
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() =>
      caches.match(r).then(m => m || new Response(
        'Anda sedang offline. Hubungkan internet lalu muat ulang halaman.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      ))
    )
  );
});
