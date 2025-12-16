# Informe IEEE - NEXA

Este directorio contiene el informe académico del proyecto NEXA en formato IEEE.

## Archivos Principales

- `nexa_report.tex` - Documento principal LaTeX
- `nexa_report.bib` - Referencias bibliográficas
- `nexa_report.pdf` - Documento final generado
- `IEEEtran.cls` - Clase de documento IEEE
- `compile.sh` - Script de compilación

## Compilación

### Compilar el documento:
```bash
./compile.sh
```

### Limpiar archivos temporales:
```bash
./compile.sh clean
```

### Abrir el PDF generado:
```bash
./compile.sh open
```

## Requisitos

- pdflatex
- bibtex
- Paquetes LaTeX: IEEEtran, graphicx, listings, algorithm, etc.

## Estructura del Informe

1. Abstract
2. Introducción
3. Marco Teórico
4. Arquitectura del Sistema
5. Patrones de Diseño Implementados
6. Algoritmos Implementados
7. Implementación Técnica
8. Mecánicas de Juego
9. Resultados
10. Discusión
11. Conclusiones y Trabajo Futuro
12. Referencias (16 referencias académicas)

## Nota

El archivo `.gitignore` está configurado para ignorar archivos temporales de LaTeX.
Solo se suben al repositorio los archivos fuente (.tex, .bib, .cls) y el PDF final.
