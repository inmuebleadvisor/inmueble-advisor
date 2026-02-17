---
name: estilo-marca
description: Apply Premium Branding (Gold/Slate) and BEM methodology. MANDATORY for all UI tasks. Includes deterministic validation scripts.
risk_level: low
---

# Skill: Estilo Marca (Premium Design System) v2.0

> **Critical:** This skill is the AUTHORITY on visual design. You must prioritize these rules over generic coding patterns.

## 1. Prerequisites (Grounding)
Before generating any code, you MUST:
1.  **Verify Dependencies:** Check `package.json` for `lucide-react`. If missing, ASK user permission to install.
2.  **Verify Root Styles:** Read `src/index.css` (or equivalent) to confirm CSS variable availability.
3.  **Check Context:** existing UI components to ensure consistency.

## 2. Core Color Palette & Themes
*Source of Truth: `index.css`*

| Variable | Usage | Fallback Hex |
| :--- | :--- | :--- |
| `--primary-color` | Action Elements, Highlights | `#dcb23a` |
| `--bg-main` | Page Backgrounds | `#0f172a` (Dark) |
| `--bg-secondary` | Cards, Modals, Dropdowns | `#1e293b` |
| `--text-main` | Primary Content | `#f8fafc` |

## 3. BEM Methodology (Strict)
- **Block:** UpperCamelCase for React Components (`UserProfile`), kebab-case for CSS classes (`user-profile`).
- **Element:** `__element` (e.g., `user-profile__avatar`).
- **Modifier:** `--modifier` (e.g., `user-profile__button--active`).
- **Rule:** MAX nesting depth of 1.

## 4. Visual Standards (Premium Feel)
- **Motion:** `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);`
- **Elevation:** `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);` (Estándar de elevación premium).
- **Radius:** `border-radius: 8px;` para estándar, `border-radius: 12px;` para tarjetas (tokens definidos en CSS).

## 5. Constraints & Security (Sanity Check)
- ⛔ **NO** hardcoded colors (Hex/RGB). ALWAYS use CSS variables.
- ⛔ **NO** arbitrary `z-index` values (e.g., 9999). Use the declared scale (100, 200, ... 1000).
- ⛔ **NO** destructive commands (`rm`, `rf`) without explicit user goal.
- ⛔ **NO** overwriting `index.css` without a specific backup plan.

## 6. Verification & Quality Assurance (Mandatory)
After implementation, you MUST:
1.  **Validación Determinista:** Ejecutar el script de validación para asegurar cumplimiento BEM y evitar colores hardcodeados.
    ```bash
    python .agent/skills/estilo-marca/scripts/validate_design.py --target "ruta/al/archivo/modificado.jsx"
    ```
2.  **Browser Check:** context logic permitting, use `browser_subagent` to screenshot the component in Dark Mode.
3.  **Visual Audit:** Verify contrast ratios and alignment (8px grid).
4.  **Documentation:** Update `walkthrough.md` with:
    *   Screenshot of the new/modified component.
    *   List of modified files.
    *   Confirmation of Mobile Responsiveness checks (<768px).
