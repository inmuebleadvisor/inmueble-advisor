import os
import argparse
import json
import re
import difflib

def find_matches(search_term, search_type, root_dirs):
    matches = []
    
    # Normalize search term for file matching
    normalized_term = search_term.lower().replace(" ", "_").replace("-", "_")
    
    for root_dir in root_dirs:
        if not os.path.exists(root_dir):
            continue
            
        for dirpath, _, filenames in os.walk(root_dir):
            for filename in filenames:
                full_path = os.path.join(dirpath, filename)
                
                # 1. File Name Match
                if normalized_term in filename.lower():
                    matches.append({
                        "type": "file_name_match",
                        "path": full_path,
                        "similarity": "high"
                    })
                
                # 2. Content Match (Classes/Functions)
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                    if search_type == "class":
                        # Regex for class definition (simplistic)
                        # Buscamos 'class Nombre' o 'export class Nombre' etc.
                        class_pattern = re.compile(r'class\s+(\w+)', re.IGNORECASE)
                        for match in class_pattern.finditer(content):
                            class_name = match.group(1)
                            similarity = difflib.SequenceMatcher(None, search_term.lower(), class_name.lower()).ratio()
                            if similarity > 0.8: # Threshold could be adjusted
                                matches.append({
                                    "type": "class_definition_match",
                                    "path": full_path,
                                    "match": class_name,
                                    "similarity": f"{similarity:.2f}"
                                })

                    elif search_type == "function":
                        # Regex for function definition (simplistic js/ts/py)
                        # function name(), const name = () =>, def name():
                        func_patterns = [
                            r'function\s+(\w+)',
                            r'const\s+(\w+)\s*=\s*\(',
                            r'def\s+(\w+)\s*\('
                        ]
                        
                        for pat in func_patterns:
                            for match in re.finditer(pat, content, re.IGNORECASE):
                                func_name = match.group(1)
                                similarity = difflib.SequenceMatcher(None, search_term.lower(), func_name.lower()).ratio()
                                if similarity > 0.8:
                                    matches.append({
                                        "type": "function_definition_match",
                                        "path": full_path,
                                        "match": func_name,
                                        "similarity": f"{similarity:.2f}"
                                    })
                                    
                except Exception:
                    # Skip files that can't be read
                    continue

    return matches

def main():
    parser = argparse.ArgumentParser(description="Audit codebase for duplicates.")
    parser.add_argument("--search", required=True, help="Term to search for (function name, class name, file concept)")
    parser.add_argument("--type", default="file", choices=["class", "function", "file"], help="Type of element to search for")
    
    args = parser.parse_args()
    
    # Directorios a escanear según instrucciones: src/ (Frontend) y functions/ (Backend)
    scan_dirs = ["src", "functions"]
    
    matches = find_matches(args.search, args.type, scan_dirs)
    
    result = {
        "exists": len(matches) > 0,
        "matches": matches
    }
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
