# 6. Branding & Style Guide

## 6.1 Color Palette (WCAG AA Compliant)

| Color Name | Hex | Usage | Contrast Ratio | shadcn Token |
|------------|-----|-------|----------------|--------------|
| Poker Felt Green | `#0D4F3C` | Primary background | 7.2:1 | `primary` |
| Gold Chip | `#FFD700` | Accent, success states | 8.1:1 | `accent` |
| Silver Chip | `#C0C0C0` | Secondary actions | 4.7:1 | `muted` |
| Red Chip | `#DC143C` | Warnings, debt indicators | 6.2:1 | `destructive` |
| White Text | `#FFFFFF` | Primary text | 21:1 | `foreground` |
| Warm Gray | `#2D2D30` | Card backgrounds | 12.3:1 | `card` |
| Casino Black | `#1A1A1A` | App background | 15.8:1 | `background` |
| Celebration Gold | `#FFA500` | Party animations | 6.8:1 | `warning` |

## 6.2 Typography Scale

```css
/* shadcn base + poker-optimized sizing for mobile gameplay */
:root {
  --font-size-xs: 12px;    /* Helper text, timestamps */
  --font-size-sm: 14px;    /* Body text, descriptions */
  --font-size-base: 16px;  /* Default text, buttons */
  --font-size-lg: 20px;    /* Important info, labels */
  --font-size-xl: 24px;    /* Player names, section headers */
  --font-size-2xl: 32px;   /* Money amounts, balances */
  --font-size-3xl: 48px;   /* Big celebrations, pot totals */
  
  /* Touch-friendly spacing for poker gameplay */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-base: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-touch: 44px;        /* Minimum touch target */
  --spacing-comfortable: 88px;   /* Poker-friendly large targets */
}
```

## 6.3 Animation Guidelines

**Celebration Animations:**
- Buy-in success: Chip stack building animation (300ms ease-out)
- Big wins: Confetti burst with haptic feedback (1000ms)
- Perfect balance: Sparkle effect around amount (500ms)
- Settlement complete: Fireworks overlay (2000ms)

**Micro-interactions:**
- Button press: Scale down to 0.95 with haptic (100ms)
- Card reveal: Slide up with shadow (250ms ease-out)
- Voice activation: Microphone pulse animation (continuous)
- Balance updates: Number counting animation (500ms)

**Accessibility Compliance:**
- Respect `prefers-reduced-motion` system setting
- Provide static alternatives for all animations
- Ensure animations don't cause seizures (no flashing >3Hz)
