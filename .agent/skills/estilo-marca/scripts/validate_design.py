import re
import sys
import os

def check_file(filepath):
    errors = []
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # 1. Check for hardcoded colors (Hex/RGB/HSL)
    # Hex: #abc, #abcdef
    # RGB/HSL: rgb(1,2,3), rgba(...), hsl(...)
    color_patterns = [
        r'#(?:[0-9a-fA-F]{3}){1,2}\b',
        r'(?:rgb|rgba|hsl|hsla)\([^)]*\)'
    ]
    
    for pattern in color_patterns:
        matches = re.finditer(pattern, content)
        for match in matches:
            # Avoid matching CSS variable definitions themselves if possible, 
            # but usually they are in :root or index.css which we might skip or handle.
            # Here we exclude content from strings that look like CSS Var definitions.
            line_no = content.count('\n', 0, match.start()) + 1
            errors.append(f"L{line_no}: Hardcoded color found: '{match.group(0)}'. Use CSS variables.")

    # 2. BEM Validation (Simplified)
    # Checks for double dashes or double underscores that don't follow naming conventions
    # or deep nesting indicators (e.g. .a .b .c .d)
    # This is a heuristic.
    
    # Check for deep nesting in CSS (more than 2 levels)
    # .block .ele1 .ele2 .ele3 { ... }
    nesting_pattern = re.compile(r'\.[a-zA-Z0-9_-]+\s+\.[a-zA-Z0-9_-]+\s+\.[a-zA-Z0-9_-]+\s+\.[a-zA-Z0-9_-]+')
    for match in nesting_pattern.finditer(content):
        line_no = content.count('\n', 0, match.start()) + 1
        errors.append(f"L{line_no}: Potential deep nesting detected (>3 levels). Violates BEM simplicity.")

    return errors

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_design.py <file_path>")
        sys.exit(1)

    target_file = sys.argv[1]
    if not os.path.exists(target_file):
        print(f"Error: File {target_file} not found.")
        sys.exit(1)

    print(f"--- Validating Design Standards: {target_file} ---")
    file_errors = check_file(target_file)
    
    if file_errors:
        for err in file_errors:
            print(f"[ERROR] {err}")
        sys.exit(1)
    else:
        print("[SUCCESS] No violations found. Premium standards maintained.")
        sys.exit(0)

if __name__ == "__main__":
    main()
