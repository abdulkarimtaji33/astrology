# Astrology (Jyotish) — Extreme UI/UX + Mobile Redesign Plan

Scope: `astrology-frontend` (Next.js 16, React 19, Tailwind v4). Backend/API/DB are **not** changed.
Goal: a visually premium, extremely user-friendly, mobile-first experience on every screen (320px → 4K), without breaking any existing feature.

Status legend: [ ] todo · [~] partly done · [x] done

---

## 0. Current-state audit (findings)

| Area | Problem today |
|---|---|
| Navigation | Single 48px top bar; 5–7 links crammed in a horizontally scrolling strip on phones; "Admin" link shown to everyone; tiny tap targets (~28px); no clear active state for "New Chart". |
| Home | Plain heading + form; no hero, no explanation of value; "My charts" list competes with form on mobile. |
| Forms | 14px inputs → iOS zoom on focus; native date/time only; city dropdown not thumb-friendly; no inline progress/feedback. |
| Chart page | Header has 4 buttons that wrap awkwardly; 6 tabs show truncated labels on mobile ("Lagn", "Moon", "Tran"); tab bar scrolls away; tables overflow (`overflow-hidden`) and clip on phones. |
| Modals | Centered desktop modals on phones, small close targets, no bottom-sheet behavior; three different modal styles (dark-only admin `Modal`, light/dark chart modals). |
| Visual system | Tailwind utilities with copy-pasted dark: variants in 40+ files; no shared button/chip/card primitives; inconsistent radii and spacing; flat background. |
| Admin | 551-line sidebar layout, 1.5k-line admin screens — desktop-first, tables unusable on phones. |
| Accessibility | Focus rings inconsistent; no reduced-motion handling; some text contrast low in light mode. |

## 1. Design direction

**"Cosmic observatory"** — deep indigo night sky, warm gold accents, parchment-tinted light mode.

- **Type:** Fraunces (display serif, headings) + Geist (UI/body) + Geist Mono (numbers/degrees).
- **Color tokens:** keep existing `--app-*` variables; add gold gradient (`#fcd34d → #f59e0b → #d97706`), indigo glow, success/warn/danger tints. Light + dark both first-class (dark default).
- **Surfaces:** layered glass cards (`.app-card`), 20px radius, soft inner highlight, deep shadow in dark.
- **Motion:** subtle fade-up on mount, press-scale on buttons, sheet slide-up; everything disabled by `prefers-reduced-motion`.
- **Background:** fixed CSS-only starfield + nebula glows (zero images, zero JS, no layout cost).
- **Touch:** every interactive element ≥ 44×44px on touch; 16px minimum input font (no iOS zoom).
- **Layout:** mobile-first; breakpoints 360 / 640 / 768 / 1024 / 1280; safe-area insets honored (notch + home indicator).

## 2. Shared primitives (Phase 1)

- [x] `design-system.css`: tokens, `.btn` (+primary/secondary/ghost/danger/sm/block), `.chip`, `.eyebrow`, `.gold-text`, `.skeleton`, `.fade-up*`, `.bottom-nav`, `.scroll-x`
- [x] Global responsive table rule (scroll inside card, never page-level overflow)
- [x] Global bottom-sheet behavior for all existing modals on ≤639px
- [x] `layout.tsx`: Fraunces font, `viewport` meta (`viewportFit: cover`, theme-color), starfield element, bottom padding for bottom nav
- [x] Reduced-motion, focus-visible, 16px inputs

## 3. App shell & navigation (Phase 2)

- [x] **Top bar (all sizes):** logo, theme toggle, account menu (avatar initial → dropdown/sheet with email, Reminders, Sign out). Desktop also shows inline links: Chart, World Events, Name Numerology, Reminders.
- [x] **Bottom tab bar (<768px):** Home (New chart), World, Numerology, Reminders (if signed in) / Sign in, More. Active state with gold indicator, 56px tall, safe-area aware.
- [x] **"More" sheet:** theme, admin link (only for signed-in users), sign out.
- [x] Remove public "Admin" prominence (moved to More/account menu).

## 4. Home, auth, onboarding (Phase 3)

- [x] **Home hero:** animated zodiac wheel (SVG, slow rotation), headline, 3 value bullets (Lagna chart · Transits & Dasha · AI analysis), primary CTA scrolls to form.
- [~] **Birth form:** big labeled inputs, helper text, inline validation, city autocomplete as full-width list (min 48px rows) with loading state and "no results" state, selected-city chip with clear, sticky submit on mobile, loading state with progress copy. _(done except sticky mobile submit)_
- [~] **My charts:** horizontal card carousel on mobile / list on desktop; whole card tappable; delete moves to a confirm bottom sheet (no tiny inline "Yes/No"). _(done as responsive card grid, not a carousel; delete is a confirm dialog)_
- [x] **Login / Register:** centered card, password show/hide, strength hint on register, autofill attributes, clear error state, link between pages, full-height on mobile.
- [x] Empty/loading/error states with skeletons everywhere on this page.

## 5. Chart page (Phase 4) — the core screen

- [~] **Header:** name (display font), birth meta as chips (date · time · city · timezone). Actions collapse: primary "✦ Analyze with AI" button + overflow menu (Edit date, Delete) on mobile; full buttons on desktop. _(done: chips + 2-col action grid on mobile instead of an overflow menu)_
- [x] **Tabs:** sticky below top bar, full labels with icons, scroll-snap, active tab auto-scrolls into view, URL hash/`?tab=` persisted so refresh/share keeps the tab.
- [~] **Chart + tables:** chart SVG scales to viewport width (max 420), Houses/Planets segmented control full-width on mobile; tables → scrollable with sticky first column; planet rows get tap-to-expand details on phones. _(done: scaled chart, full-width segmented control; table sticky column / tap-to-expand not done)_
- [ ] **Panels (Transit, Numerology, Relationships, Saturn, Mahadasha, Summary strip):** convert horizontal-only layouts to stacked cards on mobile, collapsible sections for long content, consistent card header pattern.
- [~] **Modals:** Edit date, Delete confirm, AI analysis, placement meaning → unified sheet pattern (bottom sheet on mobile, centered on desktop), large close button, scroll lock, Esc to close. _(done via global bottom-sheet CSS for all dialogs; not yet a single shared component)_
- [ ] AI analysis modal: sectioned reading layout, readable line length, copy/share button, skeleton while loading with reassuring progress text.

## 6. Other public pages (Phase 5)

- [ ] **World Events:** filter chips (scrollable), event cards instead of dense rows on mobile, date badges.
- [ ] **Name Numerology:** large input, instant result card, breakdown table scrolls, friendly empty state.
- [ ] **Reminders:** card list, toggle switches ≥44px, create/edit as bottom sheet, clear empty state and status chips.

## 7. Admin (Phase 6)

- [~] `AdminLayoutClient`: off-canvas drawer sidebar on <1024px with hamburger, sticky top bar, body scroll lock. _(already has an off-canvas drawer; verified in code, not redesigned)_
- [~] Shared `admin-ui`: tables get horizontal scroll + sticky header; forms single-column on mobile; `Modal` → sheet on mobile and theme-aware (light + dark). _(Modal made theme-aware with 40px close target; tables rely on global scroll rule)_
- [ ] Pagination bar becomes compact (prev/next + page X of Y) on phones.
- [ ] Birth records / AI analyses / reminders / geo / jyotish screens verified at 390px.

## 8. Quality bar & QA (Phase 7)

- [x] `next build` passes (types + lint-critical), no console errors.
- [~] Automated screenshots (Playwright, Chrome) at **360×740, 390×844, 768×1024, 1280×800, 1920×1080**, light and dark, for: home (signed out/in), login, register, chart (each tab), world events, numerology, reminders, admin dashboard. _(done for home, auth, chart tabs, world events, reminders, numerology; not every size/theme combination)_
- [ ] Checks per screenshot: no horizontal page scroll (`scrollWidth <= innerWidth`), no overlapped fixed elements, tap targets ≥ 44px on touch viewports, text contrast AA.
- [x] Golden-path walkthrough: register → create chart → all tabs → edit date pass end-to-end on a 390px phone viewport; delete verified via the proxy (204)
- [ ] Lighthouse-style sanity: no layout shift from fonts (`display: swap`), no blocking images.

## 9. Delivery

- [ ] Commit in logical commits on `master` (repo's deploy branch per `DEV_SERVER_PROJECTS.md`).
- [ ] Push to origin.
- [ ] Deploy to **dev server** (72.60.223.25): `git pull`, `npm ci`, `npm run build`, `pm2 restart astrology-web`; verify `:6600` responds. Backend untouched.
- [ ] Final handoff: local URL, dev URL, what changed, anything not covered.

## 10. Phase order & definition of done

1. Design system + layout shell → 2. Navigation → 3. Home/auth → 4. Chart page + panels → 5. Other pages → 6. Admin → 7. QA/fixes → 8. Push + deploy.
Each phase ends with: compiles, viewed at phone + desktop width, short log entry in this file's changelog below.

## Changelog

- Phase 1 done: design system, fonts, viewport, starfield, global sheet/table rules.
- Phase 2 done: top bar, bottom tab bar, account/More sheet.
- Phase 3 done: hero, birth form, My charts, login/register.
- Phase 4 mostly done: chart header, sticky tabs, segmented table switch.
- Phase 7 in progress: build passes, golden path running; Phases 5–6 only lightly touched.
- Bug fix found in QA: `api-proxy` returned 502 for 204/304 responses (broke Edit date and Delete chart in the UI). Fixed in `src/app/api-proxy/[...path]/route.ts`.
- Added `scroll-padding-bottom` so focused/scrolled-to controls clear the mobile tab bar.
