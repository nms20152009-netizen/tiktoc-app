# 🎬 Tiktoc App

> Herramienta de creación de contenido inteligente con Gemini AI para creadores emergentes

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://tiktoc-app.vercel.app/)
[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%20AI-blue)](#)
[![Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF)](#)

## 🌐 App en Vivo

**URL**: [https://tiktoc-app.vercel.app/](https://tiktoc-app.vercel.app/)

---

## 📋 PASO FINAL: Activar Funcionalidad Completa

### Estado Actual:
✅ Repositorio GitHub configurado  
✅ Vercel conectado y desplegando  
✅ Variables de entorno configuradas  
❌ **Falta**: Código fuente completo de AI Studio

### Instrucciones para Completar:

1. **Descargar código de AI Studio**:
   - Ve a: https://aistudio.google.com/apps/drive/1O7Qv342uccyLfPXe2XvDHRTQAlucqKBN
   - Haz clic en el icono de descarga (flecha hacia abajo)
   - Se descargará un ZIP con todo el código

2. **Preparar el código**:
```bash
# Extraer el ZIP
unzip tiktoc-app.zip
cd tiktoc-app

# Configurar Git (si es necesario)
git init
git remote add origin https://github.com/nms20152009-netizen/tiktoc-app.git

# Obtener los archivos actuales del repo
git pull origin main

# Agregar todo el código de AI Studio
git add .
git commit -m "Add full Tiktoc app functionality from AI Studio"
git push origin main
```

3. **Vercel desplegará automáticamente**
   - En ~2 minutos tu app estará funcionando completamente
   - Con todas las funciones de cámara, Gemini AI, edición, etc.

---

## 🚀 Tecnologías

- **Frontend**: React 18 + TypeScript
- **Build**: Vite 5
- **AI**: Google Gemini API (2.5 Pro, 2.5 Flash, Veo 3.1)
- **Hosting**: Vercel
- **Repo**: GitHub

## 🔑 Variables de Entorno

Ya configuradas en Vercel:
- `VITE_GEMINI_API_KEY`: API Key de Gemini (Nivel 1 gratuito)

## 📦 Scripts Disponibles

```bash
npm install    # Instalar dependencias
npm run dev    # Servidor de desarrollo
npm run build  # Build para producción
```

## 🎯 Características

- 📹 Grabación de video con cámara
- 🤖 Integración con Gemini AI
- ✂️ Edición de imágenes
- 🎵 Biblioteca de música
- 📤 Compartir contenido
- 💡 Sugerencias inteligentes
- 🎬 Generación de video

---

**Creado por**: nms20152009-netizen  
**Fecha**: Noviembre 2025  
**Licencia**: MIT
