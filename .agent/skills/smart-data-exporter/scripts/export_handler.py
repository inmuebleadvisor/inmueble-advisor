import argparse
import os
import sys
import csv
import json

def main():
    parser = argparse.ArgumentParser(description="Exporta datos de negocio o logs a archivos locales.")
    parser.add_argument('--source', required=True, help="Fuente de datos.")
    parser.add_argument('--format', required=True, choices=['json', 'csv'], help="Formato de salida.")
    parser.add_argument('--target', required=True, help="Ruta de destino.")
    parser.add_argument('--force', action='store_true', help="Ignorar advertencia de archivo existente.")
    
    args = parser.parse_args()

    # Verificar directorio
    dest_dir = os.path.dirname(os.path.abspath(args.target))
    if dest_dir and not os.path.exists(dest_dir):
        os.makedirs(str(dest_dir))

    # Verificar si el archivo ya existe
    if os.path.exists(args.target) and not args.force:
        print(f"ERROR: El archivo '{args.target}' ya existe. Deteniendo para evitar sobrescritura.")
        sys.exit(1)

    # Nota: El script asume que --source contiene la data en formato JSON string para procesar
    try:
        data = json.loads(args.source)
    except json.JSONDecodeError:
        print("ERROR: --source debe ser un string JSON válido.")
        sys.exit(1)

    try:
        if args.format == 'json':
            with open(args.target, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
        elif args.format == 'csv':
            if not isinstance(data, list):
                print("ERROR: Data para CSV debe ser una lista.")
                sys.exit(1)
            keys = data[0].keys()
            with open(args.target, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=keys)
                writer.writeheader()
                writer.writerows(data)
        
        print(f"SUCCESS: Datos exportados a {args.target}")
    except Exception as e:
        print(f"ERROR: Falló la exportación: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
