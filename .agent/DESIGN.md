# Frontend Design Principles & System

> [!IMPORTANT]
> This document defines the core design language for the project. When using Stitch to generate or modify UI screens, follow these principles and components strictly.

## 1. Visual Identity & Aesthetics
- **Theme**: Modern, "Gen-Z Vibe", Premium, and Clean.
- **Typography**: Primary font is **Space Grotesk** (Google Font).
- **Core Palette**:
  - **Primary**: `#2BD4BD` (Mint Turquoise) - Used for primary buttons, active states, and successful actions.
  - **Secondary/Accent**: `#7f13ec` (Deep Purple) - Used for progress bars, highlights, and loaders.
  - **Background**: `#ffffff` (Light) / `#0a0a0a` (Dark).
  - **Surface/Card**: `#f8fafc` or `#f1f5f9` for subtle backgrounds.
- **Effects**:
  - **Glassmorphism**: Use for overlays and floating panels.
  - **Shadows**: Soft, multi-layered shadows (e.g., `box-shadow: 0 4px 14px rgba(43, 212, 189, 0.4)`).
  - **Border Radius**: 
    - Buttons: Pill-shaped (`100px`) or Rounded (`12px`).
    - Cards/Containers: `16px` to `24px`.
    - Inputs/Selects: `14px`.

## 2. Component System (Common UI)
Always use/extend these components from `app/components/common`:

| Component | Purpose | Key Attributes |
|-----------|---------|----------------|
| `AppButton` | Action button | Pill-shaped, uses `.btn-primary-vibe` or `.btn-side-quest`. |
| `AppGrid` | Data table | Circular checkboxes, `.custom-app-grid` styling, mint headers. |
| `AppStatCard` | Metric display | Vibrant colors, trend indicators, semi-transparent backgrounds. |
| `AppLayout` | Main shell | Responsive sidebar, unified header with search. |
| `AppPopup` | Modal/Dialog | Smooth fade-in, rounded corners, overlay backdrop. |

## 3. Interaction & Animation
- **Transitions**: 
  - Use `framer-motion` for layout transitions and micro-interactions.
  - Page transitions should use `.page-transition` (fade-in + slight upward slide).
- **Micro-animations**:
  - Button hover: `scale: 1.02` or slight lift (`translateY(-2px)`).
  - Table row hover: Subtle background change to `#f8fafc`.
- **Loading**: Use `nextjs-toploader` with color `#7f13ec`.

## 4. UI Patterns & Layout
- **Navigation**: Left-aligned sidebar with vertically stacked menu items. Use the "Sidebar Upgrade Card" pattern for call-to-actions in the sidebar.
- **Forms**: 
  - Inputs should have no focus ring or a subtle mint one.
  - Placeholder text color: `#94a3b8`.
- **Tables**:
  - Headers: Uppercase, bold (`font-weight: 800`), font size `10px - 11px`, tracking `0.15em`.
  - Checkboxes: **Must be circular**, not square.
  - Pagination: Total items on the left, pill/circle page numbers on the right.

## 5. Technology Constraints
- **Framework**: Next.js 16 (App Router) + React 19.
- **Library**: Ant Design 6.x (wrapped in `App*` components).
- **Styling**: TailwindCSS 4 (Utility-first) + CSS Modules for overrides.
- **Icons**: Lucide React.
- **i18n**: All text must be wrapped in `t()` from `useTranslation`.

## 6. Stitch Integration Rule
When Stitch generates code:
1. Prefer `Tailwind` classes for layout and spacing.
2. Use `App*` components for core UI (Buttons, Grids, Cards).
3. Apply `.btn-primary-vibe` to primary CTAs.
4. Ensure all colors follow the Primary (`#2BD4BD`) and Secondary (`#7f13ec`) palette.
5. Use `framer-motion` for list items appearing one by one.
