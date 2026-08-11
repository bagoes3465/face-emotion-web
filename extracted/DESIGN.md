---
name: Neural Dark
colors:
  surface: '#0d1320'
  surface-dim: '#0d1320'
  surface-bright: '#333947'
  surface-container-lowest: '#070e1a'
  surface-container-low: '#151c28'
  surface-container: '#19202c'
  surface-container-high: '#232a37'
  surface-container-highest: '#2e3542'
  on-surface: '#dce2f4'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dce2f4'
  inverse-on-surface: '#2a313e'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#dcb8ff'
  on-secondary: '#480081'
  secondary-container: '#7701d0'
  on-secondary-container: '#dcb7ff'
  tertiary: '#f2f6fa'
  on-tertiary: '#2c3134'
  tertiary-container: '#d6dade'
  on-tertiary-container: '#5b5f63'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#efdbff'
  secondary-fixed-dim: '#dcb8ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6700b5'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#0d1320'
  on-background: '#dce2f4'
  surface-variant: '#2e3542'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-lg:
    fontFamily: Space Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.05em
  data-sm:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Space Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

This design system is engineered for high-stakes AI analysis, specifically facial emotion detection. The brand personality is clinical yet sophisticated—evoking the feeling of a high-end laboratory or a futuristic monitoring station. 

The design style utilizes a **Cyber-Minimalist** approach. It leans into a dark, immersive interface with high-contrast data overlays. It prioritizes clarity and precision, ensuring that the AI’s complex telemetry is readable at a glance. The emotional response should be one of "calm authority"—the user should feel like they are operating an advanced, reliable piece of technology that sees beyond the surface.

## Colors

The palette is rooted in a "Neural Dark" spectrum. The primary background surfaces use a deep, desaturated navy to minimize eye strain and maximize the pop of data visualizations.

- **Primary (Cyan):** Used for "Active" states, detection bounding boxes, and successful recognition events.
- **Secondary (Violet):** Reserved for secondary data streams, emotional intensity graphs, and "Processing" states.
- **Neutrals:** A range of slates and charcoals are used to define hierarchy within the UI panels without breaking the dark immersion.
- **Semantic Colors:** Critical alerts use a high-vibrancy Red-Orange, while "Confidence Scores" scale from the secondary violet to the primary cyan.

## Typography

This design system employs a dual-typeface strategy to distinguish between "Interface" and "Intelligence."

**Inter** is the workhorse for the UI. It provides a clean, neutral foundation for navigation, settings, and general communication. It is chosen for its exceptional legibility in dark modes.

**Space Mono** is utilized for all AI-generated data, coordinates, timestamps, and confidence percentages. This monospaced font reinforces the "technical" nature of the facial detection engine and ensures that numerical data aligns perfectly in scanning grids and sidebars.

## Layout & Spacing

The layout follows a **Technical Grid** model. The primary focus is the live video feed or static image analysis area, which typically occupies a 12-column fluid space. Control panels and data telemetry are docked in sidebars (fixed width) or floating "HUD" style overlays.

- **Desktop:** A multi-pane layout with a fixed left-hand navigation and a collapsible right-hand "Intelligence" panel.
- **Mobile:** A single-column view where the video feed is pinned to the top, and data insights are presented in an expandable bottom sheet.
- **Spacing Rhythm:** Based on a 4px baseline. Use 16px (4 units) for most component spacing to maintain a compact, "instrument-heavy" feel.

## Elevation & Depth

In this design system, depth is conveyed through **Tonal Layering** and **Subtle Glows** rather than traditional shadows.

1.  **Base Layer:** The deepest navy (#0B121E).
2.  **Surface Layer:** A slightly lighter slate (#1A222F) for panels and containers.
3.  **Overlay Layer:** Semi-transparent blurs (Backdrop-filter: blur(12px)) for floating HUD elements, allowing the video feed to remain partially visible behind data.
4.  **Luminescence:** Active elements (like the detected facial box) utilize a soft outer glow in the primary cyan color to simulate a light-emitting screen.

Avoid heavy drop shadows; instead, use 1px inner borders in a slightly lighter shade of the surface color to define element edges.

## Shapes

The shape language is **Soft-Geometric**. We use a 0.25rem (4px) base radius to ensure the interface feels modern without appearing "bubbly" or overly casual.

- **Bounding Boxes:** These must remain sharp (0px radius) to emphasize mathematical precision.
- **UI Buttons & Cards:** Use the `rounded` (4px) standard.
- **Data Points:** Small circular pips are used in line graphs to provide a organic contrast to the rigid grid.

## Components

### Buttons
Primary buttons are solid Cyan with black text for maximum contrast. Secondary buttons use a ghost style (Cyan border, no fill) with text that glows slightly on hover.

### Data Chips
Small, rectangular tags using **Space Mono**. Used for displaying specific detected emotions (e.g., "JOY: 88%"). Backgrounds should be low-opacity versions of the secondary violet.

### Detection Bounding Boxes
Ultra-thin (1px) Cyan lines that frame the face. The corners should have "L-bracket" reinforcements to lean into the futuristic scanner aesthetic.

### Telemetry Lists
Vertical lists of data. Each row is separated by a 1px slate divider. The labels use `label-caps` and the values use `data-lg`.

### Input Fields
Dark backgrounds with a simple bottom-border highlight. When focused, the bottom border glows Cyan.

### Intelligence Cards
Cards containing deep-dive analytics. These use a subtle 1px border (#ffffff10) and a very dark background to separate them from the main canvas.