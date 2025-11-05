# 🎨 Centralized Theme System

## Quick Start

**To change colors across the entire app, edit ONE file:**

📁 `src/constants/theme.ts`

Then sync the values to `src/app/globals.css` (we'll automate this soon).

## Example: Change Primary Color

### Step 1: Edit `src/constants/theme.ts`

```typescript
export const THEME = {
  primary: {
    500: '#3b82f6', // Change from #6b9e7a to blue
    // ... update other shades
  },
}
```

### Step 2: Sync to `src/app/globals.css`

```css
:root {
  --color-primary-500: #3b82f6; /* Updated from theme.ts */
}
```

That's it! The entire app will use the new color.

## Available Theme Colors

- **Primary**: Main brand color (buttons, links, accents)
- **Secondary**: Secondary actions and accents
- **Background**: Page and component backgrounds
- **Text**: Text colors for different contexts
- **Border**: Border and divider colors
- **Accent**: Status colors (blue, green, red, yellow, purple, orange)
- **Gray**: Neutral grayscale palette

## Usage

### In Components (TypeScript)

```tsx
import { THEME } from '@/constants';

<div style={{ backgroundColor: THEME.primary[500] }}>
  Content
</div>
```

### In CSS/Classes

```css
.my-element {
  background-color: var(--color-primary-500);
  color: var(--color-text-primary);
}
```

### In Tailwind Classes

The theme colors are available as utilities:
- `bg-primary-500`
- `text-primary-500`
- `border-primary-500`

## Full Documentation

See `THEME_GUIDE.md` for complete documentation.

