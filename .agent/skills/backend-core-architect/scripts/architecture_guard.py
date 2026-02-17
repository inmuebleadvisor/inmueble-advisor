import sys
import os
import re
import json
import argparse

def load_dependency_graph(resource_path):
    try:
        with open(resource_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ERROR: Could not find dependency graph at {resource_path}")
        sys.exit(1)

def get_layer(file_path):
    # Normalize path to use forward slashes
    path = file_path.replace('\\', '/')
    
    if '/core/' in path:
        return 'core'
    elif '/infrastructure/' in path:
        return 'infrastructure'
    elif '/interface/' in path:
        return 'interface'
    return None

def check_imports(file_path, dependency_graph):
    layer = get_layer(file_path)
    if not layer:
        print(f"SKIP: File {file_path} does not belong to a strictly enforced layer (core, infrastructure, interface).")
        return True

    rules = dependency_graph['layers'][layer]
    forbidden_patterns = rules.get('forbidden', [])
    allowed_patterns = rules.get('allowed_imports', [])

    print(f"ANALYZING: {file_path} (Layer: {layer})")
    
    violations = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines):
            # Simple regex to catch import statements
            # Matches: import ... from '...' or import ... from "..."
            match = re.search(r'from\s+[\'"](.+)[\'"]', line)
            if match:
                import_path = match.group(1)
                
                # Check for forbidden imports
                for forbidden in forbidden_patterns:
                    # Check if the import path contains the forbidden term
                    # We look for /forbidden/ or start with forbidden/ or exactly forbidden
                    if (f"/{forbidden}/" in import_path or 
                        import_path.startswith(f"{forbidden}/") or 
                        import_path == forbidden or
                        (forbidden in import_path and 'src/' in import_path)): # Catch relative imports resolving to forbidden layer
                        
                        violations.append(f"Line {i+1}: Import '{import_path}' violates rule: cannot import '{forbidden}' in '{layer}' layer.")

    except Exception as e:
        print(f"ERROR: Could not read file {file_path}: {e}")
        sys.exit(1)

    if violations:
        print(f"❌ ARCHITECTURE VIOLATION DETECTED in {file_path}:")
        for v in violations:
            print(f"  - {v}")
        return False
    
    print(f"✅ ARCHITECTURE CHECK PASSED for {file_path}")
    return True

def main():
    parser = argparse.ArgumentParser(description='Architecture Guard')
    parser.add_argument('--target', required=True, help='Path to the file to check')
    parser.add_argument('--layer', help='Force a specific layer (core, infrastructure, interface) for testing purposes')
    args = parser.parse_args()

    # Locate dependency graph relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    resource_path = os.path.join(script_dir, '..', 'resources', 'dependency_graph.json')
    
    graph = load_dependency_graph(resource_path)
    
    # Allow manual layer override
    if args.layer:
        print(f"DEBUG: Forcing layer '{args.layer}' for {args.target}")
        
        # We need to hack check_imports to accept the forced layer
        # Since I can't easily change the signature in this replace block without changing more lines,
        # I will just modify check_imports in the next step or do a full rewrite if easier.
        # Actually, let's rewrite the check_imports call to pass the layer if needed.
        # But check_imports calls get_layer internally.
        # Let's modify get_layer to respect the argument.
        pass

    # Re-implementing logic with layer support
    layer = args.layer if args.layer else get_layer(args.target)
    
    if not layer:
        print(f"SKIP: File {args.target} does not belong to a strictly enforced layer (core, infrastructure, interface) and no --layer specified.")
        sys.exit(0)

    rules = graph['layers'].get(layer)
    if not rules:
         print(f"ERROR: Unknown layer '{layer}'")
         sys.exit(1)

    forbidden_patterns = rules.get('forbidden', [])
    
    print(f"ANALYZING: {args.target} (Layer: {layer})")
    
    violations = []
    
    try:
        with open(args.target, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines):
            match = re.search(r'from\s+[\'"](.+)[\'"]', line)
            if match:
                import_path = match.group(1)
                
                for forbidden in forbidden_patterns:
                    # Robust check for forbidden packages/layers
                    if (f"/{forbidden}/" in import_path or 
                        import_path.startswith(f"{forbidden}/") or 
                        import_path == forbidden or
                        (forbidden in import_path and 'src/' in import_path)): 
                        
                        violations.append(f"Line {i+1}: Import '{import_path}' violates rule: cannot import '{forbidden}' in '{layer}' layer.")

    except Exception as e:
        print(f"ERROR: Could not read file {args.target}: {e}")
        sys.exit(1)

    if violations:
        print(f"❌ ARCHITECTURE VIOLATION DETECTED in {args.target}:")
        for v in violations:
            print(f"  - {v}")
        sys.exit(1)
    
    print(f"✅ ARCHITECTURE CHECK PASSED for {args.target}")
    sys.exit(0)

if __name__ == "__main__":
    main()
