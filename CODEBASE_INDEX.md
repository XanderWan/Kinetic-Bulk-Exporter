### CODEBASE INDEX

This document provides a navigable index of the codebase with key entry points and components.

## Overview
- **Framework**: Next.js (App Router)
- **Languages**: TypeScript, TSX
- **Styles**: CSS (global styles in `app/globals.css` and `styles/globals.css`)
- **UI**: Custom components under `components/ui`

## Top-level Structure
- `app/`
  - `layout.tsx`: Root layout for the App Router
  - `page.tsx`: Home page route
  - `globals.css`: Global styles for the `app` directory
- `components/`
  - `theme-provider.tsx`: Theme context/provider
  - `top-nav.tsx`: Top navigation component
  - `ui/`: Reusable UI primitives (see UI Components)
- `hooks/`
  - `use-mobile.ts`: Mobile viewport detection hook
  - `use-toast.ts`: Toast hook
- `lib/`
  - `utils.ts`: Utility helpers (e.g., class name composition)
- `public/`: Static assets (images, logos)
- `styles/`
  - `globals.css`: Additional global styles
- `tsconfig.json`: TypeScript configuration
- `next.config.mjs`: Next.js config
- `postcss.config.mjs`: PostCSS config
- `components.json`: Component registry/config
- `package.json`: Project dependencies and scripts
- `pnpm-lock.yaml`: Lockfile

## Key Entry Points
- **App shell**: `app/layout.tsx`
- **Home page**: `app/page.tsx`
- **Theme context**: `components/theme-provider.tsx`
- **Navigation**: `components/top-nav.tsx`

## Hooks
- `hooks/use-mobile.ts`
- `hooks/use-toast.ts`
- `components/ui/use-mobile.tsx`
- `components/ui/use-toast.ts`

## Library
- `lib/utils.ts`

## UI Components (components/ui)
- `accordion.tsx`
- `alert-dialog.tsx`
- `alert.tsx`
- `aspect-ratio.tsx`
- `avatar.tsx`
- `badge.tsx`
- `breadcrumb.tsx`
- `button.tsx`
- `calendar.tsx`
- `card.tsx`
- `carousel.tsx`
- `chart.tsx`
- `checkbox.tsx`
- `collapsible.tsx`
- `command.tsx`
- `context-menu.tsx`
- `dialog.tsx`
- `drawer.tsx`
- `dropdown-menu.tsx`
- `form.tsx`
- `hover-card.tsx`
- `input-otp.tsx`
- `input.tsx`
- `label.tsx`
- `menubar.tsx`
- `navigation-menu.tsx`
- `pagination.tsx`
- `popover.tsx`
- `progress.tsx`
- `radio-group.tsx`
- `resizable.tsx`
- `scroll-area.tsx`
- `select.tsx`
- `separator.tsx`
- `sheet.tsx`
- `sidebar.tsx`
- `skeleton.tsx`
- `slider.tsx`
- `sonner.tsx`
- `switch.tsx`
- `table.tsx`
- `tabs.tsx`
- `textarea.tsx`
- `toast.tsx`
- `toaster.tsx`
- `toggle-group.tsx`
- `toggle.tsx`
- `tooltip.tsx`
- `use-mobile.tsx`
- `use-toast.ts`

## Public Assets (public)
- `placeholder-logo.png`, `placeholder-logo.svg`
- `placeholder-user.jpg`
- `placeholder.jpg`, `placeholder.svg`
- `video-hook.png`

## Notes
- The `components/ui` directory contains self-contained, reusable primitives that are generally importable across pages.
- Global styles exist in both `app/globals.css` and `styles/globals.css`. Prefer `app/globals.css` for styles affecting the App Router.


