# Instrucciones para Generar PDFs

Este directorio contiene la documentación del proyecto Nexa en formato Markdown. A continuación se detallan las opciones para convertir estos archivos a PDF.

---

## Archivos de Documentación

- `memoria_descriptiva.md` - Documentación técnica completa del proyecto
- `manual_de_usuario.md` - Guía de usuario para jugar Nexa

---

## Opción 1: Usando Pandoc (Recomendado)

### Instalación de Pandoc

**Windows:**
```bash
# Descargar desde: https://pandoc.org/installing.html
# O con Chocolatey:
choco install pandoc

# Instalar LaTeX para mejor calidad (opcional):
choco install miktex
```

**macOS:**
```bash
brew install pandoc

# Instalar LaTeX (opcional):
brew install --cask mactex
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install pandoc

# Instalar LaTeX (opcional):
sudo apt-get install texlive-latex-base texlive-latex-extra
```

### Convertir a PDF

```bash
# Memoria Descriptiva
pandoc memoria_descriptiva.md -o memoria_descriptiva.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V documentclass=article \
  -V lang=es

# Manual de Usuario
pandoc manual_de_usuario.md -o manual_de_usuario.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V documentclass=article \
  -V lang=es \
  --toc \
  --toc-depth=2
```

### Con Tabla de Contenidos y Estilos Mejorados

```bash
# Memoria Descriptiva - Versión Profesional
pandoc memoria_descriptiva.md -o memoria_descriptiva.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V documentclass=article \
  -V lang=es \
  -V colorlinks=true \
  -V linkcolor=blue \
  -V urlcolor=blue \
  --toc \
  --toc-depth=3 \
  --number-sections

# Manual de Usuario - Versión Profesional
pandoc manual_de_usuario.md -o manual_de_usuario.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V documentclass=article \
  -V lang=es \
  -V colorlinks=true \
  -V linkcolor=blue \
  -V urlcolor=blue \
  --toc \
  --toc-depth=3 \
  --number-sections
```

---

## Opción 2: Usar Editor Online

### Markdown to PDF (Online)

1. **Visitar:** https://www.markdowntopdf.com/
2. **Copiar** el contenido del archivo .md
3. **Pegar** en el editor
4. **Click** en "Convert to PDF"
5. **Descargar** el archivo PDF generado

### Dillinger (Online)

1. **Visitar:** https://dillinger.io/
2. **Import from** → Seleccionar archivo .md
3. **Export as** → PDF
4. **Descargar** el archivo

---

## Opción 3: Usar Visual Studio Code

### Con Extensión Markdown PDF

1. **Instalar extensión:**
   - Abrir VS Code
   - Ir a Extensions (Ctrl+Shift+X)
   - Buscar "Markdown PDF"
   - Instalar la extensión de yzane.markdown-pdf

2. **Convertir a PDF:**
   - Abrir el archivo .md en VS Code
   - Presionar F1
   - Escribir "Markdown PDF: Export (pdf)"
   - Presionar Enter
   - El PDF se generará en el mismo directorio

---

## Opción 4: Usar Google Docs

1. **Abrir Google Docs:** https://docs.google.com
2. **Crear nuevo documento**
3. **Copiar contenido** del archivo .md
4. **Pegar** en Google Docs
5. **Ajustar formato** (títulos, negritas, etc.)
6. **Archivo** → **Descargar** → **Documento PDF (.pdf)**

---

## Opción 5: Usar Typora

### Software Typora (Gratuito para evaluación)

1. **Descargar:** https://typora.io/
2. **Instalar** Typora
3. **Abrir** archivo .md con Typora
4. **File** → **Export** → **PDF**
5. **Guardar** archivo PDF

---

## Recomendaciones de Formato

### Para Memoria Descriptiva

```bash
pandoc memoria_descriptiva.md -o memoria_descriptiva.pdf \
  --pdf-engine=xelatex \
  -V geometry:"top=2.5cm, bottom=2.5cm, left=3cm, right=2cm" \
  -V fontsize=12pt \
  -V documentclass=report \
  -V lang=es \
  -V papersize=letter \
  -V colorlinks=true \
  -V linkcolor=NavyBlue \
  -V urlcolor=NavyBlue \
  --toc \
  --toc-depth=3 \
  --number-sections \
  --highlight-style=tango \
  -V title="Memoria Descriptiva del Juego Nexa" \
  -V author="Equipo Nexa - UNSA" \
  -V date="Diciembre 2025"
```

### Para Manual de Usuario

```bash
pandoc manual_de_usuario.md -o manual_de_usuario.pdf \
  --pdf-engine=xelatex \
  -V geometry:"top=2cm, bottom=2cm, left=2.5cm, right=2cm" \
  -V fontsize=11pt \
  -V documentclass=article \
  -V lang=es \
  -V papersize=letter \
  -V colorlinks=true \
  -V linkcolor=blue \
  -V urlcolor=blue \
  --toc \
  --toc-depth=2 \
  --number-sections \
  --highlight-style=breezedark \
  -V title="Manual de Usuario - Nexa" \
  -V subtitle="Juego de Estrategia en Tiempo Real sobre Grafos" \
  -V author="Equipo Nexa - UNSA" \
  -V date="Diciembre 2025"
```

---

## Personalización Avanzada (Pandoc)

### Agregar Portada Personalizada

Crear archivo `portada.yaml`:

```yaml
---
title: "Memoria Descriptiva"
subtitle: "Juego Nexa - Estrategia en Tiempo Real sobre Grafos"
author: 
  - "Luis Gustavo Sequeiros Condori"
  - "Ricardo Chambilla"
  - "Paul Cari Lipe"
  - "Jhon Aquino"
  - "Raquel Quispe"
  - "Rafael Chambilla"
institute: "Universidad Nacional de San Agustín de Arequipa"
date: "Diciembre 2025"
abstract: |
  Nexa es un juego de estrategia en tiempo real desarrollado con TypeScript y Phaser 3,
  donde dos jugadores compiten por el control de un grafo mediante gestión inteligente de energía.
toc: true
toc-depth: 3
number-sections: true
---
```

Luego convertir:

```bash
pandoc portada.yaml memoria_descriptiva.md -o memoria_descriptiva.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=12pt \
  -V documentclass=report \
  -V lang=es
```

---

## Verificar Instalación de Pandoc

```bash
# Verificar versión
pandoc --version

# Debe mostrar algo como:
# pandoc 2.x.x
# Compiled with pandoc-types x.x.x, texmath x.x.x, skylighting x.x.x
```

---

## Solución de Problemas

### Error: "pdflatex not found"

**Solución:** Instalar LaTeX:
- **Windows:** MiKTeX (https://miktex.org/)
- **macOS:** MacTeX (https://www.tug.org/mactex/)
- **Linux:** `sudo apt-get install texlive-full`

### Error: "Cannot decode byte"

**Solución:** Especificar codificación UTF-8:
```bash
pandoc memoria_descriptiva.md -o memoria_descriptiva.pdf \
  --pdf-engine=xelatex \
  -V lang=es \
  --metadata charset=UTF-8
```

### PDF no muestra emojis correctamente

**Solución:** Usar XeLaTeX en lugar de pdflatex:
```bash
--pdf-engine=xelatex
```

---

## Scripts Automatizados

### Script Bash (Linux/macOS)

Crear archivo `generar_pdfs.sh`:

```bash
#!/bin/bash

echo "Generando PDFs de documentación..."

# Memoria Descriptiva
echo "→ Generando memoria_descriptiva.pdf..."
pandoc memoria_descriptiva.md -o memoria_descriptiva.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=12pt \
  -V lang=es \
  --toc \
  --number-sections

# Manual de Usuario
echo "→ Generando manual_de_usuario.pdf..."
pandoc manual_de_usuario.md -o manual_de_usuario.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V lang=es \
  --toc \
  --toc-depth=2 \
  --number-sections

echo "✅ PDFs generados exitosamente!"
ls -lh *.pdf
```

Ejecutar:
```bash
chmod +x generar_pdfs.sh
./generar_pdfs.sh
```

### Script PowerShell (Windows)

Crear archivo `generar_pdfs.ps1`:

```powershell
Write-Host "Generando PDFs de documentación..." -ForegroundColor Green

# Memoria Descriptiva
Write-Host "→ Generando memoria_descriptiva.pdf..." -ForegroundColor Yellow
pandoc memoria_descriptiva.md -o memoria_descriptiva.pdf `
  --pdf-engine=xelatex `
  -V geometry:margin=1in `
  -V fontsize=12pt `
  -V lang=es `
  --toc `
  --number-sections

# Manual de Usuario
Write-Host "→ Generando manual_de_usuario.pdf..." -ForegroundColor Yellow
pandoc manual_de_usuario.md -o manual_de_usuario.pdf `
  --pdf-engine=xelatex `
  -V geometry:margin=1in `
  -V fontsize=11pt `
  -V lang=es `
  --toc `
  --toc-depth=2 `
  --number-sections

Write-Host "✅ PDFs generados exitosamente!" -ForegroundColor Green
Get-ChildItem -Filter *.pdf | Format-Table Name, Length, LastWriteTime
```

Ejecutar:
```powershell
.\generar_pdfs.ps1
```

---

## Resultado Esperado

Después de ejecutar cualquiera de los métodos, deberías tener:

```
docs/
├── memoria_descriptiva.md
├── memoria_descriptiva.pdf       ← Generado
├── manual_de_usuario.md
├── manual_de_usuario.pdf          ← Generado
└── CONVERTIR_A_PDF.md (este archivo)
```

---

## Recursos Adicionales

- **Pandoc Documentation:** https://pandoc.org/MANUAL.html
- **Markdown Guide:** https://www.markdownguide.org/
- **LaTeX Documentation:** https://www.latex-project.org/help/documentation/

---

**Nota:** Los archivos PDF generados no están incluidos en el repositorio Git (.gitignore) para mantener el repositorio ligero. Cada usuario puede generar sus propios PDFs según necesidad.
