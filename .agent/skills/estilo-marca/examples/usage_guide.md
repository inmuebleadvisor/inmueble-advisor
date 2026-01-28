# Usage Guide: Estilo Marca

## 1. Official Button Patterns
Use the classes defined in `src/styles/buttons.css`.

### Primary Button (Gold Gradient)
```jsx
/* ✅ Correct implementation */
<button className="btn btn-primary">
  Propiedades Premium
</button>
```

### Secondary/Glass Button
```jsx
/* ✅ Transmutes to glass effect on hover */
<button className="btn btn-secondary">
  Ver Detalles
</button>
```

## 2. Interactive Badges (Trust Seals)
Follow the pattern for certifications.

```jsx
/* ✅ Correct BEM structure for badges */
<div className="trust-badges">
  <div className="trust-badge">
    <Check size={16} strokeWidth={2} />
    Desarrollador Verificado
  </div>
</div>
```

## 3. Animation Standards
Apply the project's "Premium" easing for custom components.

```css
.my-custom-modal {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 4. Responsive Best Practices
Always check the `768px` threshold.

```css
.my-component {
  padding: 16px; /* Mobile first */
}

@media (min-width: 768px) {
  .my-component {
    padding: 32px; /* Desktop rhythm */
  }
}
```
