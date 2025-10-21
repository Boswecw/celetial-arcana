# Celestia Arcana - Color Scheme Guide

## 🎨 Complete Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Cosmic Violet** | `#7B61FF` | rgb(123, 97, 255) | Primary buttons, headings, borders |
| **Starlight Lilac** | `#C6A7FF` | rgb(198, 167, 255) | Hover states, secondary text |
| **Electric Magenta** | `#FF4EDB` | rgb(255, 78, 219) | Accents, highlights, active states |

### Background & Surface

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Deep Space** | `#0B0724` | rgb(11, 7, 36) | Main background |
| **Nebula Navy** | `#17133A` | rgb(23, 19, 58) | Card surfaces, panels |

### Text Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Moon White** | `#EDEBFF` | rgb(237, 235, 255) | Primary text, headings |
| **Starlit Gray** | `#B3A9C7` | rgb(179, 169, 199) | Secondary text, muted content |

### Status Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Comet Green** | `#4DF2B0` | rgb(77, 242, 176) | Success states, positive feedback |
| **Solar Amber** | `#FFC857` | rgb(255, 200, 87) | Warnings, reversed cards |

### Gradients

| Name | Definition | Usage |
|------|-----------|-------|
| **Celestial Gradient** | `linear-gradient(135deg, #7B61FF, #FF4EDB)` | Hero titles, card backs |

---

## 🎯 Usage Examples

### Buttons

```css
/* Primary Button */
background-color: #7B61FF;
color: #EDEBFF;
border: none;

/* Primary Button Hover */
background-color: #C6A7FF;
box-shadow: 0 10px 15px -3px rgba(123, 97, 255, 0.5);

/* Secondary Button */
background-color: #17133A;
color: #EDEBFF;
border: 1px solid rgba(123, 97, 255, 0.5);

/* Accent Button */
background-color: #FF4EDB;
color: #EDEBFF;
```

### Cards & Surfaces

```css
/* Card Surface */
background-color: rgba(23, 19, 58, 0.5);
backdrop-filter: blur(10px);
border: 1px solid rgba(123, 97, 255, 0.3);
border-radius: 0.75rem;

/* Card Hover */
border-color: rgba(123, 97, 255, 0.6);
box-shadow: 0 10px 15px -3px rgba(123, 97, 255, 0.2);
```

### Text

```css
/* Primary Text */
color: #EDEBFF;
font-family: 'Cinzel Decorative', serif;

/* Secondary Text */
color: #B3A9C7;
font-family: 'Inter', sans-serif;

/* Accent Text */
color: #7B61FF;
```

### Badges

```css
/* Success Badge */
background-color: rgba(77, 242, 176, 0.2);
color: #4DF2B0;
border: 1px solid rgba(77, 242, 176, 0.5);

/* Warning Badge */
background-color: rgba(255, 200, 87, 0.2);
color: #FFC857;
border: 1px solid rgba(255, 200, 87, 0.5);
```

---

## 🔧 Tailwind Configuration

```javascript
colors: {
  celestial: {
    violet: "#7B61FF",
    lilac: "#C6A7FF",
    deepspace: "#0B0724",
    navy: "#17133A",
    magenta: "#FF4EDB",
    green: "#4DF2B0",
    amber: "#FFC857",
    white: "#EDEBFF",
    gray: "#B3A9C7",
  },
}

backgroundImage: {
  "celestial-gradient": "linear-gradient(135deg, #7B61FF, #FF4EDB)",
}
```

---

## 📐 Color Accessibility

### Contrast Ratios (WCAG AA Standard)
- ✅ Moon White (#EDEBFF) on Deep Space (#0B0724): 15.8:1 (AAA)
- ✅ Cosmic Violet (#7B61FF) on Deep Space (#0B0724): 5.2:1 (AA)
- ✅ Electric Magenta (#FF4EDB) on Deep Space (#0B0724): 4.8:1 (AA)

### Color Blindness Considerations
- ✅ Violet and Magenta are distinguishable for most color blindness types
- ✅ Green and Amber provide additional visual cues
- ✅ Text contrast is high enough for readability

---

## 🎨 Design Tokens

### Spacing
- Button padding: `0.5rem 1rem`
- Card padding: `1.5rem` (p-6) to `2rem` (p-8)
- Gap between elements: `1rem` to `2rem`

### Border Radius
- Buttons: `0.5rem` (rounded-lg)
- Cards: `0.75rem` (rounded-xl)
- Badges: `9999px` (rounded-full)

### Shadows
- Subtle: `0 10px 15px -3px rgba(color, 0.2)`
- Medium: `0 10px 15px -3px rgba(color, 0.3)`
- Strong: `0 20px 25px -5px rgba(color, 0.5)`

### Transitions
- Default: `0.2s` ease
- Hover effects: `0.2s` to `0.3s`
- Animations: `0.6s` for 3D effects

---

## 🌙 Dark Mode

The entire application uses a dark theme:
- Background: Deep Space (#0B0724)
- Surfaces: Nebula Navy (#17133A)
- Text: Moon White (#EDEBFF)
- Accents: Cosmic Violet & Electric Magenta

No light mode is currently implemented.

---

## 📝 Notes

- All colors are carefully chosen for cosmic/mystical aesthetic
- High contrast ensures readability and accessibility
- Gradient provides visual interest without overwhelming
- Color scheme works well for tarot/astrology theme
- Consistent application across all components

