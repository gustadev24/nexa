#!/bin/bash

# Script para compilar el informe NEXA en formato IEEE
# Uso: ./compile.sh

echo "======================================"
echo "Compilando informe NEXA..."
echo "======================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "nexa_report.tex" ]; then
    echo "Error: nexa_report.tex no encontrado"
    echo "Asegúrate de ejecutar este script desde el directorio docs/report/"
    exit 1
fi

# Verificar que existen las imágenes
echo ""
echo "Verificando imágenes..."
if [ ! -d "../../assets/img" ]; then
    echo "Advertencia: No se encontró el directorio de imágenes"
    echo "Las imágenes no se incluirán en el documento"
else
    echo "✓ Directorio de imágenes encontrado"
fi

# Primera compilación con pdflatex
echo ""
echo "[1/4] Primera compilación con pdflatex..."
pdflatex -interaction=nonstopmode -shell-escape nexa_report.tex > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Error en la primera compilación. Ejecutando con output detallado:"
    pdflatex -shell-escape nexa_report.tex
    exit 1
fi

# Generar bibliografía con bibtex
echo "[2/4] Generando bibliografía con bibtex..."
bibtex nexa_report > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Advertencia: Hubo problemas con bibtex. Continuando..."
    # Mostrar los warnings de bibtex si existen
    if [ -f "nexa_report.blg" ]; then
        echo "Contenido del log de bibtex:"
        tail -n 20 nexa_report.blg
    fi
fi

# Segunda compilación para resolver referencias
echo "[3/4] Segunda compilación para resolver referencias..."
pdflatex -interaction=nonstopmode -shell-escape nexa_report.tex > /dev/null 2>&1

# Tercera compilación para asegurar todas las referencias
echo "[4/4] Tercera compilación final..."
pdflatex -interaction=nonstopmode -shell-escape nexa_report.tex > /dev/null 2>&1

# Verificar que se generó el PDF
if [ -f "nexa_report.pdf" ]; then
    echo ""
    echo "======================================"
    echo "✓ Compilación exitosa!"
    echo "======================================"
    echo "Archivo generado: nexa_report.pdf"
    echo ""

    # Mostrar tamaño del archivo
    SIZE=$(du -h nexa_report.pdf | cut -f1)
    echo "Tamaño del archivo: $SIZE"

    # Contar páginas (requiere pdfinfo)
    if command -v pdfinfo &> /dev/null; then
        PAGES=$(pdfinfo nexa_report.pdf 2>/dev/null | grep Pages | awk '{print $2}')
        if [ ! -z "$PAGES" ]; then
            echo "Número de páginas: $PAGES"
        fi
    fi

    echo ""
    echo "Opciones disponibles:"
    echo "  ./compile.sh clean  - Limpiar archivos temporales"
    echo "  ./compile.sh open   - Abrir el PDF generado"
    echo ""
else
    echo ""
    echo "======================================"
    echo "✗ Error: No se pudo generar el PDF"
    echo "======================================"
    echo "Revisa los errores en el archivo nexa_report.log"

    if [ -f "nexa_report.log" ]; then
        echo ""
        echo "Últimas líneas del log:"
        tail -n 30 nexa_report.log
    fi
    exit 1
fi

# Opciones adicionales
if [ "$1" = "clean" ]; then
    echo "Limpiando archivos temporales..."
    rm -f *.aux *.log *.out *.bbl *.blg *.toc *.lof *.lot *.synctex.gz *.fls *.fdb_latexmk
    echo "✓ Archivos temporales eliminados"
fi

if [ "$1" = "open" ]; then
    echo "Abriendo PDF..."
    if command -v xdg-open &> /dev/null; then
        xdg-open nexa_report.pdf &
    elif command -v open &> /dev/null; then
        open nexa_report.pdf &
    elif command -v start &> /dev/null; then
        start nexa_report.pdf &
    else
        echo "No se pudo abrir el PDF automáticamente"
        echo "Por favor, abre manualmente: nexa_report.pdf"
    fi
fi
