# Deploy dashboard di Cloudflare Workers

Dashboard ini memakai Next.js 16 dengan SSR, route API, middleware, dan server actions.
Gunakan **Workers + OpenNext**. `wrangler pages deploy .open-next/assets` hanya
mengunggah aset statis dan tidak menjalankan API/SSR; konfigurasi itu sudah diganti.
Cloudflare Pages static export tidak mendukung fitur server aplikasi ini.

## Produksi

1. Deploy API dari repo `Valzyys/JKT48connect-CF` lebih dulu. Ikuti `CLOUDFLARE-D1.md`
   di repo itu untuk membuat `GATEWAY_DB`, memasang skema, dan memindahkan data lama.
2. Pastikan `services.API.service` di `wrangler.jsonc` sama dengan nama Worker API
   (`jkt48connect-cf`), pada akun Cloudflare yang sama. Binding memanggil Worker API
   langsung. `API_BASE_URL` menentukan host URL request; fallback HTTP dipakai saat
   menjalankan Next.js tanpa binding.
3. Jalankan:

   ```bash
   npm ci
   npm run deploy
   ```

Bundle dashboard saat diuji berukuran sekitar 3,2 MiB gzip, sehingga memerlukan
Workers Paid (batas script 10 MiB; Free 3 MiB).

Di Cloudflare Workers Builds, gunakan build command `npm run cf:build` dan deploy
command `npx wrangler deploy`. Jangan pilih output directory Pages.

Semua panggilan browser memakai `/api/gateway`, `/api/partnership`, atau `/api/pmj`.
Cookie autentikasi dikirim pada domain dashboard, lalu proxy meneruskan Bearer token
ke API. Proxy mempertahankan multipart upload dan status upstream. Database berada
pada Worker API; dashboard tidak memerlukan kredensial SQL maupun binding D1 sendiri.

Jika upstream partnership membutuhkan `x-proxy-secret`, simpan nilainya melalui
`npx wrangler secret put PARTNERSHIP_PROXY_SECRET`. Tidak ada secret default pada proxy.

## Lokal

```bash
npm run dev
npm run cf:preview
```

`cf:preview` membangun dan menjalankan bundle OpenNext pada Wrangler/workerd.
Untuk service binding lokal, jalankan Worker API di terminal terpisah lebih dulu
(`npm run dev` dalam repo API). Konfigurasi sumber API berisi binding lain seperti
Hyperdrive/Browser/KV yang perlu tersedia untuk modul di luar gateway.
Untuk Next.js standalone tanpa binding, set `API_BASE_URL` ke alamat API yang bisa
diakses server. Request tanpa login ke endpoint API terlindungi mendapat JSON 401.

## Validasi

```bash
npm run typecheck
npm run cf:build
npx wrangler deploy --dry-run
```

Font tema dibundel melalui paket font lokal, sehingga build tidak mengunduh Google Fonts.
