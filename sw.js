/* Service worker: network-first untuk file milik sendiri (satu origin).
   Permintaan ke Supabase / CDN / font (beda origin) tidak disentuh,
   dan halaman anggota ber-token tidak pernah disimpan di cache. */
const V = 'arisan-v2';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'supabase-config.js'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.endsWith('anggota.html') || u.searchParams.has('t')) return; // jangan cache tautan ber-token
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok && res.status === 200) {
        const cp = res.clone();
        caches.open(V).then(c => c.put(r, cp)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(r).then(m => m || new Response(
        'Anda sedang offline. Hubungkan internet lalu muat ulang halaman.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      ))
    )
  );
});
