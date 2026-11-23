---
name: Smart Kos Energi
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  metric-currency:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  metric-kwh:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  label-status:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

The design system is engineered for utility-first clarity, psychological peace of mind, and effortless operational monitoring by residential property proprietors (such as boarding house / *indekos* owners). The visual narrative fuses **Tactile Modernism** with crisp **Utility-Grade Functionalism**: actionable data is presented with high contrast, calm hierarchy, and immediate sensory feedback.

The target audience manages micro-utilities under time pressure. Therefore, the emotional response must evoke:
- **Tenang & Terkendali (Calm & In Control):** Zero cognitive clutter or ambiguous graphs.
- **Transparan & Akurat (Clear & Legible):** Large numeric callouts for Indonesian Rupiah (Rp) and Kilowatt-hour (kWh) values that can be read under midday glare or poor lighting.
- **Ramah & Akrab (Approachable Utility):** Reassuring, conversational Indonesian microcopy paired with explicit state badges (`AMAN`, `WASPADA`, `BAHAYA`) that avoid technical intimidation.

Visual surfaces feature clean crisp white/slate cards set against a structured deep slate canvas, utilizing purposeful status tokens to flag overconsumption, pending token balances, and circuit trip risks instantly.

## Colors

The palette establishes an immediate operational hierarchy anchored by physical status conditions:

- **Primary (`#0D9488` / Deep Pine Teal):** Anchors brand touchpoints, active tab controls, primary action buttons, and confirmed system operations.
- **Secondary (`#0F172A` / Deep Slate Navy):** Used for solid canvas contrasts, high-priority metric titles, dark state badges, and crisp typography.
- **Status Tiers (Strict Semantic Mapping):**
  - **Status AMAN / Normal (`#10B981` / Emerald Green):** Denotes stable consumption, paid bills, and active safe voltage. Paired with soft tint backgrounds (`#ECFDF5`).
  - **Status WASPADA / Alert (`#F59E0B` / Vivid Amber):** Denotes power usage exceeding 80% limit, running low on prepaid tokens (< 10 kWh), or pending tenant billings. Paired with tint (`#FFFBEB`).
  - **Status BAHAYA / Critical (`#EF4444` / Coral Crimson):** Denotes MCB trip risk, negative balance, or abnormal voltage spike. Paired with tint (`#FEF2F2`).
- **Neutral Palette:**
  - Canvas Background: `#F8FAFC` (Clean porcelain slate).
  - Surface Card Background: `#FFFFFF`.
  - Subtle Stroke: `#E2E8F0`.
  - Body Text: `#334155`.
  - Muted Label / Caption: `#64748B`.

## Typography

Typography pairs human warmth with raw metric precision:

- **Plus Jakarta Sans** serves as the primary visual voice for interface chrome, headings, explanations, and friendly Indonesian microcopy (`"Kamar 04 aman terkendali"`, `"Tagihan siap dikirim"`).
- **JetBrains Mono** is introduced strictly for financial amounts (e.g., `Rp 148.500`), kilowatt measurements (`182.4 kWh`), room numbers (`KMR-102`), and device timestamps. The monospaced baseline guarantees tabular number alignment when scanning multiple boarding rooms simultaneously.
- **Rupiah Value Legibility:** Currency symbols (`Rp`) are kept visually secondary or vertically aligned, while numeric totals use `metric-currency` with high tabular contrast to eliminate reading errors.

## Layout & Spacing

The layout is built mobile-first, targeting frictionless single-thumb navigation on smartphone screens while comfortably adapting to tablets used at reception counters:

- **Mobile Canvas (Under 640px):** Single-column stack with dynamic safe area insets. Margins are locked to `1rem` (16px) with an edge-to-edge feeling that maximizes usable viewport for telemetry metrics. Room cards use a tight `0.75rem` vertical spacing.
- **Tablet / Responsive Canvas (641px - 1024px):** Transitions to a structured 2-column asymmetric grid: quick status indicators on the left, telemetry room grid on the right. Margin expands to `1.5rem`.
- **Rhythm & Padding:** Component internal padding uses strict multiples of 4px. Primary telemetry cards rely on `space-md` (16px) for interior padding to preserve high touch targets (minimum 48px height) for interactive switches and alert dismissal.

## Elevation & Depth

This system avoids heavy drop shadows, instead using **Tonal Layering** accompanied by **Subtle Ambient Micro-Shadows** to reflect crisp tactile surfaces:

- **Level 0 (App Canvas):** `#F8FAFC`. Completely flat base with zero elevation.
- **Level 1 (Card & Modular Modules):** `#FFFFFF` paired with a delicate outline `1px solid #E2E8F0` and an ultra-soft ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Active Focus & Sticky Bar):** Floating bottom navigation and operational drawer sheets use `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)` combined with top rim-light border `1px solid #FFFFFF`.
- **Status State Glows:** Critical alerts (`BAHAYA`) reject standard gray shadows in favor of a soft tinted perimeter beacon: `0 0 0 3px rgba(239, 68, 68, 0.15)`.

## Shapes

The interface embraces a balanced modern radius:
- Base controls, text fields, and primary buttons use standard `0.5rem` (8px).
- Main telemetry overview cards and room monitoring modules use `rounded-lg` (`1rem` / 16px) to communicate modular physical hardware boxes.
- Status chips (`AMAN`, `WASPADA`, `BAHAYA`) and quick-filter pills employ full pill-radius (`9999px`) to immediately differentiate informative tags from rectangular interactive buttons.

## Components

### Status Badges (Pills)
- **AMAN:** Background `#ECFDF5`, text `#065F46`, stroke `#A7F3D0`. Includes a small filled 6px emerald dot. Microcopy: `"AMAN - Normal"`.
- **WASPADA:** Background `#FFFBEB`, text `#92400E`, stroke `#FDE68A`. Includes a small blinking amber triangle/dot icon. Microcopy: `"WASPADA - Boros"` or `"WASPADA - Sisa 8 kWh"`.
- **BAHAYA:** Background `#FEF2F2`, text `#991B1B`, stroke `#FECACA`. Microcopy: `"BAHAYA - Beban Lebih"`. Accompanied by quick-action button `"Matikan Saklar"`.

### Room Telemetry Card (`Kartu Kamar`)
- Surface: Crisp white with `rounded-lg` border radius and a 1px border matching the room's current state (or `#E2E8F0` for normal).
- Header: Room number in bold `JetBrains Mono` (`Kamar 101`), tenant name in body text, and current status pill aligned right.
- Metrics Core: Two-column split displaying live consumption (`Watt / kWh`) on the left and estimated bill (`Rp`) on the right using large monospace weights.
- Micro-actions: Embedded IoT toggle switch to cut or restore relay power, plus a shortcut button: `"Kirim Tagihan WA"`.

### Buttons
- **Primary:** Background `#0D9488`, active pressed `#0F766E`, text white, height 48px for thumb comfort.
- **Secondary / WhatsApp Utility:** Background `#F1F5F9`, text `#0F172A`, border `1px solid #CBD5E1`.
- **Emergency Action:** Background `#EF4444`, text white. Requires a 1.5-second press-and-hold mechanism to avoid accidental breaker trips.

### Form Inputs & Threshold Sliders
- Input fields display an integrated prefix badge (e.g., `Rp` or `Watt`) with a focused border glow in teal (`#0D9488`).
- Sliders for setting max power limit (MCB limiter) have high-contrast filled tracks with magnetic tick stops at standard Indonesian PLN allocations: `450 VA`, `900 VA`, `1300 VA`, `2200 VA`.

### Quick Filter Chips
- Horizontally scrollable row on mobile: `"Semua Kamar (12)"`, `"Kritis (2)"`, `"Token Hampir Habis (3)"`, `"Lunas (7)"`.
- Inactive: Background `#F1F5F9`, text `#475569`.
- Active: Background `#0F172A`, text white.