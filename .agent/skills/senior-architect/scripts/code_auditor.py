import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional

# --- Configuration ---
def load_rules():
    """Load architecture rules from resources/architecture_rules.json"""
    script_dir = Path(__file__).parent
    rules_path = script_dir.parent / "resources" / "architecture_rules.json"
    
    if not rules_path.exists():
        print(f"CRITICAL ERROR: Rules file not found at {rules_path}")
        sys.exit(1)
        
    try:
        with open(rules_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to parse rules file: {e}")
        sys.exit(1)

RULES = load_rules()

# --- Analysis Logic ---

def get_layer(file_path, project_root):
    """Determine the architectural layer of a file based on its path."""
    # Normalize path to rely on relative structure from src if possible
    # This is a heuristic based on standard Clean Architecture folder names
    parts = file_path.parts
    
    # Check against configured layer identifiers
    for layer, identifiers in RULES.get("layer_identifiers", {}).items():
        for identifier in identifiers:
            if identifier in parts:
                return layer
    return "unknown"

def check_imports(file_path, content, layer):
    """Check for forbidden imports based on the layer."""
    violations = []
    if layer not in RULES.get("forbidden_imports", {}):
        return violations

    forbidden = RULES["forbidden_imports"][layer]
    
    # Regex for imports: import ... from '...' or require('...')
    # Simple regex, might need refinement for edge cases but good for 99%
    import_patterns = [
        r"import\s+.*from\s+['\"](.*)['\"]",
        r"import\s+['\"](.*)['\"]",
        r"require\s*\(\s*['\"](.*)['\"]\s*\)"
    ]
    
    lines = content.splitlines()
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or line.startswith("//") or line.startswith("#"):
            continue
            
        for pattern in import_patterns:
            match = re.search(pattern, line)
            if match:
                imported_module: str = str(match.group(1))
                for forbidden_term in forbidden:
                    # Check if the imported module contains a forbidden term (e.g., 'firebase/auth' contains 'firebase')
                    # We accept slash delimiters to be safe
                    if forbidden_term in imported_module.split('/') or forbidden_term in imported_module.split('.'):
                         violations.append({
                            "line": i + 1,
                            "import": imported_module,
                            "violation": f"Layer '{layer}' cannot import '{forbidden_term}' ({imported_module})"
                        })
    return violations

def check_complexity(file_path, content):
    """Check for code health metrics: file size and indentation."""
    issues = []
    lines = content.splitlines()
    
    # 1. File Size
    if len(lines) > RULES.get("max_file_lines", 300):
        issues.append({
            "type": "file_size",
            "value": len(lines),
            "limit": RULES.get("max_file_lines", 300),
            "msg": f"File length ({len(lines)}) exceeds limit ({RULES.get('max_file_lines', 300)})"
        })

    # 2. Indentation (Simple heuristic: count leading spaces / indent size)
    # Assumes 2 or 4 spaces per indent. We'll just count levels.
    max_indent = 0
    max_indent_line = 0
    
    for i, line in enumerate(lines):
        stripped = line.lstrip()
        if not stripped or stripped.startswith("//") or stripped.startswith("*"):
            continue
        
        leading_spaces = len(line) - len(stripped)
        # Assuming 2 spaces is standard for JS/TS, 4 for Python. Let's normalize to approx levels.
        # If we assume 2 spaces:
        level = leading_spaces // 2
        if level > max_indent:
            max_indent = level
            max_indent_line = i + 1
            
    if max_indent > RULES.get("max_indentation_level", 5):
         issues.append({
            "type": "complexity",
            "value": max_indent,
            "line": max_indent_line,
            "limit": RULES.get("max_indentation_level", 5),
            "msg": f"Max indentation level ({max_indent}) at line {max_indent_line} exceeds limit ({RULES.get('max_indentation_level', 5)})"
        })
        
    return issues

def check_tdd(file_path):
    """Check if a corresponding test file exists."""
    # Skip if the file is already a test
    name = file_path.name
    for suffix in RULES.get("required_test_suffix", []):
        if name.endswith(suffix):
            return True # It is a test file, so TDD compliant logic doesn't apply to itself
            
    # Naive check: look for same name with test suffixes in same dir or __tests__
    # We will look for same directory mainly
    
    parent = file_path.parent
    stem = file_path.stem # 'User.service' from 'User.service.ts' -> NO, stem is 'User.service'
    
    # Handle multiple extensions like .service.ts -> stem is .service. Wait, pathlib stem is just name without last suffix.
    # User.service.ts -> stem is User.service
    
    # Try to find a match
    found = False
    
    # 1. Check same directory
    for potential in parent.iterdir():
        if potential.name.startswith(stem) and potential.name != name:
             for suffix in RULES.get("required_test_suffix", []):
                 if potential.name.endswith(suffix):
                     found = True
                     break
        if found: break
        
    # 2. Check sibling __tests__ folder if not found
    if not found:
        tests_dir = parent / "__tests__"
        if tests_dir.exists():
            for potential in tests_dir.iterdir():
                 if potential.name.startswith(stem):
                     for suffix in RULES.get("required_test_suffix", []):
                         if potential.name.endswith(suffix):
                             found = True
                             break
    
    return found

def audit_file(file_path, project_root):
    """Run all checks on a single file."""
    # Only check interesting files (js, ts, py, etc)
    if file_path.suffix not in ['.ts', '.js', '.jsx', '.tsx', '.py']:
        return None

    # Skip files in node_modules, dist, build, coverage, .git
    parts = file_path.parts
    if any(x in parts for x in ['node_modules', 'dist', 'build', 'coverage', '.git', '.agent']):
        return None
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return None # Skip binary or weird files

    layer = get_layer(file_path, project_root)
    file_report = {
        "file": str(file_path.relative_to(project_root)),
        "layer": layer,
        "violations": [],
        "health": [],
        "tdd_missing": False
    }
    
    # 1. Architecture Violations
    file_report["violations"] = check_imports(file_path, content, layer)
    
    # 2. Code Health
    file_report["health"] = check_complexity(file_path, content)
    
    # 3. TDD (Only for logic files, skip UI/Config potentially, but rule says "All")
    # We enforce it on Domain and Application and Infrastructure, maybe less on UI/Config
    # For now, apply to all analyzed source files unless it's a test itself.
    is_test = False
    for suffix in RULES.get("required_test_suffix", []):
        if file_path.name.endswith(suffix):
            is_test = True
            break
            
    if not is_test:
        has_test = check_tdd(file_path)
        if not has_test:
            file_report["tdd_missing"] = True
            
    # Filter empty reports
    if not file_report["violations"] and not file_report["health"] and not file_report["tdd_missing"]:
        return None
        
    return file_report

def main():
    parser = argparse.ArgumentParser(description="Clean Architecture Auditor")
    parser.add_argument("--target", required=True, help="Target directory or file to analyze")
    parser.add_argument("--format", default="markdown", choices=["json", "markdown"], help="Output format")
    args = parser.parse_args()
    
    target_path = Path(args.target).resolve()
    
    if not target_path.exists():
        print(f"Error: Target path {target_path} does not exist.")
        sys.exit(1)
        
    project_root: Path = target_path if target_path.is_dir() else target_path.parent
    # Try to find actual project root (where package.json is)
    current_dir: str = str(target_path)
    while True:
        if os.path.exists(os.path.join(current_dir, "package.json")) or \
           os.path.exists(os.path.join(current_dir, "requirements.txt")):
            project_root = Path(current_dir)
            break
        parent_dir: str = os.path.dirname(current_dir)
        if parent_dir == current_dir:
            break
        current_dir = parent_dir

    # Collect files
    files_to_scan = []
    if target_path.is_file():
        files_to_scan.append(target_path)
    else:
        for root, _, files in os.walk(target_path):
            for file in files:
                files_to_scan.append(Path(root) / file)
                
    # Run Audit
    reports = []
    for f in files_to_scan:
        res = audit_file(f, project_root)
        if res:
            reports.append(res)
            
    # Generate Output
    if args.format == "json":
        print(json.dumps(reports, indent=2))
    else:
        generate_markdown_report(reports, target_path)

def generate_markdown_report(reports, target):
    """Print a pretty markdown report."""
    
    total_violations = sum(len(r['violations']) for r in reports)
    total_health = sum(len(r['health']) for r in reports)
    total_tdd = sum(1 for r in reports if r['tdd_missing'])
    
    status = "FAILED" if (total_violations > 0 or total_tdd > 0) else "WARNING" if total_health > 0 else "PASSED"
    
    if not reports:
        status = "PASSED"
        
    print(f"# Reporte de Auditoría de Arquitectura\n")
    print(f"**Estado:** {status}")
    print(f"**Target:** `{target}`")
    print(f"**Total Archivos con Problemas:** {len(reports)}\n")
    
    if status == "PASSED":
        print("✅ Todo limpio. ¡Buen trabajo!")
        return

    # Violations
    if total_violations > 0:
        print("## 🚨 Violaciones Críticas (Architecture Violations)\n")
        print("| Archivo | Capa (Layer) | Violación |")
        print("| :--- | :--- | :--- |")
        for r in reports:
            for v in r["violations"]:
                print(f"| `{r['file']}` | {r['layer']} | {v['violation']} (L{v['line']}) |")
        print("")

    # TDD
    if total_tdd > 0:
        print("## ⚠️ Falta de Tests (TDD Enforcement)\n")
        print("Se detectaron archivos de lógica sin test asociado:\n")
        for r in reports:
            if r["tdd_missing"]:
                print(f"- [ ] `{r['file']}`")
        print("")

    # Health
    if total_health > 0:
        print("## 📉 Deuda Técnica (Code Health)\n")
        for r in reports:
            if r["health"]:
                print(f"**{r['file']}**:")
                for h in r["health"]:
                    print(f"  - {h['msg']}")
        print("")
        
if __name__ == "__main__":
    # Force UTF-8 for Windows terminals and redirection
    if sys.stdout.encoding != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    main()
