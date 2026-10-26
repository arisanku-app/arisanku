/* Service worker sederhana: network-first untuk file milik sendiri.
   Permintaan ke Supabase / CDN (beda origin) tidak disentuh sama sekali,
   jadi data anggota tidak pernah disimpan di cache.
   Cache disimpan tanpa query (?t=token) agar token anggota tidak menumpuk. */
const V = 'arisan-v2';
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
  const key = new Request(u.origin + u.pathname);
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok && res.status === 200 && res.type === 'basic') {
        const cp = res.clone();
        caches.open(V).then(c => c.put(key, cp)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(key).then(m => m || new Response(
        'Anda sedang offline. Hubungkan internet lalu muat ulang halaman.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      ))
    )
  );
});
