---
description: Apply Premium Branding (Gold/Slate), BEM methodology, and official UI patterns for Inmueble Advisor. Use when modifying CSS, creating components, or auditing visual fidelity.
---

# Skill: Estilo Marca (Premium Design System)

This skill ensures all UI/UX work adheres to the **Inmueble Advisor Premium** standards, using the codebase as the absolute source of truth.

## 1. Core Color Palette & Themes
Always use CSS variables from `index.css`.

| Variable | Light Mode | Dark Mode (Default) | Hex Reference |
| :--- | :--- | :--- | :--- |
| `--primary-color` | `--base-primary-light` | `--base-primary-dark` | `#dcb23a` / `#f59e0b` |
| `--bg-main` | `#f8fafc` | `#0f172a` | Foundation Slate |
| `--bg-secondary` | `#ffffff` | `#1e293b` | Elevation Layer |
| `--text-main` | `#0f172a` | `#f8fafc` | Primary Text |

## 2. BEM Methodology & CSS Structure
- **Methodology**: Strict BEM (`.block`, `.block__element`, `.block--modifier`).
- **Hierarchy**: Flats selectors. No deep nesting.
- **Location**: Screen-specific styles in `src/styles/`, common components in `src/styles/common/` or `src/styles/components/`.

## 3. Visual & Motion Standards (Premium Feel)
- **Easing**: Use `cubic-bezier(0.4, 0, 0.2, 1)` for all significant transitions.
- **Micro-interactions**: `0.2s` for icon/color changes; `0.3s` for layout/modals.
- **Hover Pattern**: `transform: translateY(-2px);` with `box-shadow: 0 4px 12px var(--shadow-glow);`.

## 4. Layout & Spacing
- **8px Grid**: All margins/paddings must be multiples of 8px (4px, 8px, 16px, 24px, 32px, 48px, 64px).
- **Breakpoints**: 
    - **Mobile**: `< 768px`
    - **Desktop**: `>= 768px` (Container max-width: `1200px`)
- **Radius**: `8px` (SM), `16px` (MD), `24px` (LG/Buttons).

## 5. Z-Index Hierarchy
- `1100`: Topmost Interaction (Mobile Toggle).
- `1050`: Overlays/Modals (Mobile Menu).
- `1000`: Base Navbars/Sticky elements.
- `400`: Functional Panels (Maps).
- `20`: Decorative Overlays.
- `2`: Footers.

## 6. Iconography (Lucide-React)
- **Library**: `lucide-react`.
- **Standards**: `strokeWidth="2"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.
- **Standard Sizes**: `20px` (Utility), `24px` (Actions), `28px` (Prominent/Header).

## 7. Forbidden Actions
- ❌ **No hardcoded hex codes** (except in `index.css`).
- ❌ **No utility-first CSS** (Always use BEM + Vanilla CSS).
- ❌ **No Magic Numbers**: If a value is not a multiple of 8px, it must be documented as a "micro-adjustment".

---
*Reference: Consolidated from STYLES_GUIDE.md, index.css, and Header.css (Jan 2026).*
