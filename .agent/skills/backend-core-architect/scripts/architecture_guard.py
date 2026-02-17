import sys
import os
import re
import json
import argparse
from typing import List, Dict, Optional, Any, Match, cast

def load_dependency_graph(resource_path: str) -> Dict[str, Any]:
    try:
        with open(resource_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ERROR: Could not find dependency graph at {resource_path}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to load dependency graph: {e}")
        sys.exit(1)

def get_layer(file_path: str) -> Optional[str]:
    # Normalize path to use forward slashes
    path = file_path.replace('\\', '/')
    
    if '/core/' in path:
        return 'core'
    elif '/infrastructure/' in path:
        return 'infrastructure'
    elif '/interface/' in path:
        return 'interface'
    return None

def check_file_architecture(file_path: str, layer: str, forbidden_patterns: List[str]) -> List[str]:
    print(f"ANALYZING: {file_path} (Layer: {layer})")
    
    violations = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines):
            # Simple regex to catch import statements
            # Matches: import ... from '...' or import ... from "..."
            match: Optional[Match[str]] = re.search(r'from\s+[\'"](.+)[\'"]', line)
            if match:
                import_path = cast(str, match.group(1))
                
                for forbidden in forbidden_patterns:
                    # Explicit type check/hint for static analyzers
                    if not isinstance(forbidden, str):
                        continue
                        
                    # Robust check for forbidden packages/layers
                    # 1. /forbidden/ anywhere in path (e.g. .../infrastructure/...)
                    # 2. Starts with forbidden/ (e.g. infrastructure/UserRepo)
                    # 3. Exact match (e.g. infrastructure)
                    # 4. forbidden in path AND 'src/' in path (catch relative imports resolving to forbidden layer)
                    # 5. Starts with @forbidden/ (e.g. @infrastructure/UserRepo)
                    
                    forbidden_str = str(forbidden)
                    is_violation = (
                        f"/{forbidden_str}/" in import_path or 
                        import_path.startswith(f"{forbidden_str}/") or 
                        import_path.startswith(f"@{forbidden_str}/") or
                        import_path == forbidden_str or
                        (forbidden_str in import_path and 'src/' in import_path)
                    )
                    
                    if is_violation:
                        violations.append(f"Line {i+1}: Import '{import_path}' violates rule: cannot import '{forbidden}' in '{layer}' layer.")

    except Exception as e:
        print(f"ERROR: Could not read file {file_path}: {e}")
        sys.exit(1)
        
    return violations

def main():
    parser = argparse.ArgumentParser(description='Architecture Guard')
    parser.add_argument('--target', required=True, help='Path to the file to check')
    parser.add_argument('--layer', help='Force a specific layer (core, infrastructure, interface) for testing purposes')
    args = parser.parse_args()

    # Locate dependency graph relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    resource_path = os.path.join(script_dir, '..', 'resources', 'dependency_graph.json')
    
    graph = load_dependency_graph(resource_path)
    
    # Determine the layer
    layer = args.layer if args.layer else get_layer(args.target)
    
    if not layer:
        print(f"SKIP: File {args.target} does not belong to a strictly enforced layer (core, infrastructure, interface) and no --layer specified.")
        sys.exit(0)

    # Get rules for the layer
    # Type hint cast or safe get
    layers_config = graph.get('layers', {})
    rules = layers_config.get(layer)
    
    if not rules:
         print(f"ERROR: Unknown layer '{layer}' or no rules defined.")
         sys.exit(1)

    forbidden_patterns: List[str] = list(rules.get('forbidden', []))
    
    # Run check
    assert layer is not None
        
    violations = check_file_architecture(args.target, layer, forbidden_patterns)

    if violations:
        print(f"❌ ARCHITECTURE VIOLATION DETECTED in {args.target}:")
        for v in violations:
            print(f"  - {v}")
        sys.exit(1)
    
    print(f"✅ ARCHITECTURE CHECK PASSED for {args.target}")
    sys.exit(0)

if __name__ == "__main__":
    main()
