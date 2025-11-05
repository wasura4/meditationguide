# Theme Configuration Guide

## Overview

All theme colors are centralized in **`src/constants/theme.ts`**. This single file controls the entire app's color scheme.

## How to Update Colors

### Step 1: Update Theme File

Edit `src/constants/theme.ts` to change any color:

```typescript
export const THEME = {
  primary: {
    500: '#6b9e7a', // Change this to your desired primary color
    // ... other shades
  },
  // ... other colors
}
```

### Step 2: Update CSS Variables

After updating `theme.ts`, you need to sync the values to `src/app/globals.css`:

1. Copy the color values from `theme.ts`
2. Paste them into the corresponding CSS variables in `globals.css`

**Note:** In the future, we can automate this with a build script, but for now, manual sync is required.

## Color Structure

### Primary Colors
- Used for main actions, buttons, and brand elements
- Located at: `THEME.primary`

### Secondary Colors
- Used for secondary actions and accents
- Located at: `THEME.secondary`

### Background Colors
- `background.light`: Main page background
- `background.dark`: Secondary background areas
- `background.card`: Card backgrounds
- `background.sidebar`: Sidebar background

### Text Colors
- `text.primary`: Main text color
- `text.secondary`: Secondary text
- `text.muted`: Disabled/muted text

### Accent Colors
Status colors for different purposes:
- `accent.blue`: Information, links
- `accent.green`: Success, positive actions
- `accent.red`: Errors, destructive actions
- `accent.yellow`: Warnings
- `accent.purple`: Special features
- `accent.orange`: Alerts

## Usage in Components

### Using CSS Variables (Recommended)

```tsx
<div style={{ backgroundColor: 'var(--color-primary-500)' }}>
  Content
</div>
```

### Using Theme Constants (TypeScript)

```tsx
import { THEME } from '@/constants';

<div style={{ backgroundColor: THEME.primary[500] }}>
  Content
</div>
```

### Using Tailwind Classes

The theme colors are available as Tailwind utilities:
- `bg-primary-500` → `var(--color-primary-500)`
- `text-primary-500` → `var(--color-primary-500)`
- `border-primary-500` → `var(--color-primary-500)`

## Quick Color Change Examples

### Change Primary Color to Blue

1. In `theme.ts`:
```typescript
primary: {
  500: '#3b82f6', // Blue
  // ... update other shades accordingly
}
```

2. In `globals.css`, update:
```css
--color-primary-500: #3b82f6;
```

### Change Background to Light Gray

1. In `theme.ts`:
```typescript
background: {
  light: '#f3f4f6', // Light gray
  // ...
}
```

2. In `globals.css`, update:
```css
--color-background-light: #f3f4f6;
```

## Best Practices

1. **Always update `theme.ts` first** - This is the source of truth
2. **Keep CSS variables in sync** - Update `globals.css` after changing `theme.ts`
3. **Use semantic color names** - Don't use color names like "blue" or "green" directly, use semantic names like "primary", "success", etc.
4. **Test accessibility** - Ensure sufficient contrast between text and background colors
5. **Maintain consistency** - Use the same color scale throughout the app

## Future Improvements

- Automated sync script from `theme.ts` to `globals.css`
- Theme preview tool
- Dark mode support (currently disabled)
- Theme presets (light, dark, high contrast, etc.)

