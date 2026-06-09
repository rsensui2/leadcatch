const CACHE='leadcatch-v2';
const OCR_CACHE='leadcatch-ocr-v1';
const ASSETS=['./','./index.html','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
// Tesseract.js のライブラリ・WASM・言語モデルを供給する CDN ホスト（ランタイムキャッシュ対象）
const OCR_HOSTS=['cdn.jsdelivr.net','unpkg.com','tessdata.projectnaptha.com','raw.githubusercontent.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==OCR_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  let url;try{url=new URL(e.request.url);}catch(_){return;}

  // Tesseract 関連 (CDN/モデル) は cache-first で別キャッシュにランタイム保存 → 2回目以降オフライン化
  if(OCR_HOSTS.indexOf(url.hostname)!==-1){
    e.respondWith(caches.open(OCR_CACHE).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(resp=>{
      try{c.put(e.request,resp.clone());}catch(_){ } return resp;
    }))));
    return;
  }

  // 同一オリジンのアプリ資産: cache-first、無ければ取得して保存、失敗時は index.html
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    const cp=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return resp;
  }).catch(()=>caches.match('./index.html'))));
});
