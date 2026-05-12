# Colour WAR — Color-Word Interference Multiplayer Game

Game multiplayer real-time berbasis web dengan tema Neo-Brutalism. Pemain berlomba menebak **warna font** dari kata yang ditampilkan (bukan membaca katanya).

## Struktur Project

```
Colour WAR/
├── client/    # React + Vite + Tailwind → Deploy ke Vercel
└── server/    # Bun + Hono + WebSocket  → Deploy ke Railway/Render/Fly.io
```

---

## 🚀 Cara Menjalankan Lokal

### 1. Setup & Jalankan Server

```bash
cd server
bun install
bun run dev
# Server berjalan di: http://localhost:3001
```

### 2. Setup & Jalankan Client

```bash
cd client
npm install
npm run dev
# Client berjalan di: http://localhost:5173
```

### 3. Buka di browser

Buka `http://localhost:5173` di **2 tab atau lebih** untuk tes multiplayer.

---

## 📦 Deployment

### Server → Railway

1. Push folder `server/` ke GitHub repo terpisah
2. Buat project baru di [railway.app](https://railway.app)
3. Connect repo → Railway akan auto-detect `Dockerfile`
4. Set environment variable: `PORT=3001`
5. Copy URL yang diberikan Railway (contoh: `https://colour-war.up.railway.app`)

### Client → Vercel

1. Push folder `client/` ke GitHub repo terpisah
2. Import repo di [vercel.com](https://vercel.com)
3. **Tambahkan Environment Variables di Vercel dashboard:**
   ```
   VITE_WS_URL  = wss://colour-war.up.railway.app/ws
   VITE_API_URL = https://colour-war.up.railway.app
   ```
4. Deploy!

> ⚠️ Gunakan `wss://` (WebSocket Secure) untuk production, bukan `ws://`

---

## 🎮 Cara Bermain

1. Masukkan username
2. Buat lobby atau join lobby yang tersedia
3. Host klik "Mulai Game" (minimal 2 pemain)
4. Lihat kata yang muncul → **tekan tombol sesuai WARNA FONTNYA**, bukan teksnya!
5. Pemain dengan skor tertinggi saat waktu habis menang

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Bun + Hono + WebSocket |
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (Neo-Brutalism) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Deploy Server | Railway / Render / Fly.io |
| Deploy Client | Vercel |
