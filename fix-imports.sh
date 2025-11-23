#!/bin/bash

# Script para convertir todos los imports @ a paths relativos

# Función para calcular path relativo
calculate_relative_path() {
    local from_dir="$1"
    local to_path="$2"
    
    # Contar niveles de profundidad desde src/
    local depth=$(echo "$from_dir" | tr -cd '/' | wc -c)
    
    # Crear prefijo de niveles hacia arriba
    local prefix=""
    for ((i=0; i<depth; i++)); do
        prefix="../$prefix"
    done
    
    echo "${prefix}${to_path}"
}

# Encontrar todos los archivos .ts en src/
find src/ -name "*.ts" -type f | while read file; do
    echo "Processing: $file"
    
    # Obtener directorio del archivo relativo a src/
    file_dir=$(dirname "$file" | sed 's|^src/||')
    
    # Crear archivo temporal
    temp_file=$(mktemp)
    
    # Procesar el archivo línea por línea
    while IFS= read -r line; do
        if [[ $line =~ from[[:space:]]+[\']\@/(.+)[\'] ]] || [[ $line =~ from[[:space:]]+[\"]@/(.+)[\"] ]]; then
            import_path="${BASH_REMATCH[1]}"
            
            # Calcular path relativo
            relative_path=$(calculate_relative_path "$file_dir" "$import_path")
            
            # Reemplazar en la línea
            if [[ $line =~ [\'] ]]; then
                echo "$line" | sed "s|'@/${import_path}'|'${relative_path}'|"
            else
                echo "$line" | sed "s|\"@/${import_path}\"|\"${relative_path}\"|"
            fi
        else
            echo "$line"
        fi
    done < "$file" > "$temp_file"
    
    # Reemplazar archivo original
    mv "$temp_file" "$file"
done

echo "✅ Todos los imports han sido convert

idos a paths relativos"
