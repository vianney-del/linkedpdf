# LinkedPDF 💬

Transformá conversaciones de LinkedIn en PDFs visuales y prolijos.

## Deploy en Vercel (5 minutos)

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "LinkedPDF inicial"
git remote add origin https://github.com/TU_USUARIO/linkedpdf.git
git push -u origin main
```

### 2. Deploy en Vercel

1. Entrá a [vercel.com](https://vercel.com) → New Project
2. Importá el repo de GitHub
3. **Importante:** en "Environment Variables" agregá:
   - `VITE_ANTHROPIC_API_KEY` = tu API key de [console.anthropic.com](https://console.anthropic.com/keys)
4. Click en Deploy

Listo! En 2 minutos tenés tu link para compartir.

## Opciones de API Key

- **Con env variable** (recomendado para compartir): ponés `VITE_ANTHROPIC_API_KEY` en Vercel y todos usan tu key automáticamente.
- **Sin env variable**: cada usuario ingresa su propia API Key al entrar a la app. Se guarda en su navegador.

## Dev local

```bash
npm install
cp .env.example .env   # editá con tu API key
npm run dev
```
