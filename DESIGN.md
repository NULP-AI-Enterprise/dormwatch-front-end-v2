# DormWatch Design System

## 1. Design Philosophy

DormWatch bridges the gap between dormitory residents and housing management at LPNU. The interface must prioritize utility, accessibility, and institutional trust over flashy consumer trends.

We explicitly reject the "AI slop" aesthetic.
**Avoid:** Heavy gradients, soft glow drop-shadows, pill-shaped (`9999px`) corner radii, emojis as UI elements, and bulbous, floating components.
**Embrace:** Crisp borders, sharp edges, distinct visual hierarchy, utilitarian texture (dot grids + film grain noise), asymmetrical hover states (`4px` left-border reveal), and meaningful micro-visualizations (sparklines, progress steppers).

**Language:** The entire UI is in Ukrainian. All labels, buttons, headings, status text, and empty-state messages use Ukrainian copy. The only English text is the brand name "DormWatch" and technical identifiers (e.g. `#id`, email domains like `@lpnu.ua`).

---

## 2. Global Aesthetics & Motifs

### The "Blueprint" Texture
The application background utilizes two overlaid textures for depth: a dot matrix pattern and a film-grain noise overlay.

*   **Dot Grid:** A radial-gradient dot pattern on the `body` element.
    ```css
    /* Dark Mode */
    background-color: var(--background);
    background-image: radial-gradient(circle, rgba(120, 113, 108, 0.3) 1px, transparent 1px);
    background-size: 24px 24px;

    /* Light Mode */
    background-color: var(--background);
    background-image: radial-gradient(circle, rgba(214, 211, 209, 0.5) 1px, transparent 1px);
    background-size: 24px 24px;
    ```
*   **Noise Overlay:** A fixed, full-viewport `::after` pseudo-element with an inline SVG `feTurbulence` filter, blended at 3% opacity via `mix-blend-mode: overlay`. This adds an analog, printed-paper texture.
    ```css
    body::after {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.03;
      mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,...");
      background-size: 256px 256px;
    }
    ```

### The "Ticket" Motif
Complaint cards and data containers feel like physical work orders.
*   **Categorization:** Use the `micro-label` class — 10px uppercase, tracking-widest (0.2em), semi-bold (`font-weight: 600`), muted-foreground color.
*   **Separators:** Dashed borders via `<Separator dashed />` to divide card sections. Solid separators for page-level and header boundaries.
*   **Status Indicators:** Small, crisp, rectangular badges with high-contrast text and a subtle, translucent background fill (see Semantic Status Colors below).

### Asymmetrical Hover States
Interactions feel mechanical and precise.
*   Instead of lifting elements with a drop-shadow on hover, reveal a solid `1px` left border in the primary accent color (`blue-500`), accompanied by a slight text color shift.
*   Implemented via a `1px` absolute bar (`w-1`) that transitions from `opacity-0` to `opacity-100` on group hover.
*   The `link-hover` utility class provides an alternative pattern: `border-left: 4px solid var(--primary)` combined with `translateX(0.25rem)` and `padding-left: 0.5rem`.

### The "Auth Field" Interaction
Form inputs on the login/register pages use a custom focus treatment: a `3px` solid left border in `var(--primary)` crops in via `border-left-color` transition, accompanied by a `padding-left` shift of `0.5rem`. This creates the effect of the field "indenting" when focused.

---

## 3. Typography

A legible, highly utilitarian sans-serif font ensures readability across all devices.

*   **Primary Font Family:** Inter Variable (`'Inter Variable', Inter, system-ui, sans-serif`)
*   **Font Source:** `@fontsource-variable/inter`
*   **Scale:**
    *   **Hero Headlines:** 48px–60px (`text-5xl` / `text-6xl`) / Bold / `tracking-tight`
    *   **Page Titles (H1):** 24px–30px (`text-2xl` / `text-3xl`) / Bold / `tracking-tight`
    *   **Section Titles (H2):** 18px–20px (`text-lg` / `text-xl`) / Semi-Bold or Bold
    *   **Body Text:** 14px (`text-sm`) or 12px (`text-xs`) / Regular
    *   **Button Labels:** 12px (`text-xs`) / Medium / Uppercase / Tracking-Wider / Bold variants
    *   **Micro-Labels (Categories/Overheads):** 10px (`text-[10px]`) / Semi-Bold / Uppercase / `tracking-widest` (0.2em)
    *   **Tab Labels / Section Fire Marks:** 12px / Bold / Uppercase / `tracking-wider`

---

## 4. Color System

### CSS Custom Properties (OKLCH)
Colors are defined as OKLCH custom properties in `index.css` under `:root` and `.dark` selectors. The `.dark` class is applied to wrapper elements to activate dark mode.

**Dark Mode (Current Default) Tokens:**
| Token | OKLCH Value | Visual | Usage |
|---|---|---|---|
| `--background` | `oklch(0.147 0.004 49.25)` | `#1C1917` (Stone 900) | App background |
| `--foreground` | `oklch(0.985 0.001 106.423)` | `#FAFAF9` (Stone 50) | Primary text |
| `--card` | `oklch(0.216 0.006 56.043)` | `#292524` (Stone 800) | Surface/cards |
| `--muted` | `oklch(0.268 0.007 34.298)` | Stone 700 ilk | Muted surfaces |
| `--muted-foreground` | `oklch(0.709 0.01 56.259)` | `#A8A29E` (Stone 400) | Secondary text |
| `--primary` | `oklch(0.424 0.199 265.638)` | Blue 800 (Indigo) | Brand accent |
| `--primary-foreground` | `oklch(0.97 0.014 254.604)` | Light blue 50 | Text on primary |
| `--destructive` | `oklch(0.704 0.191 22.216)` | Red 500 | Danger / delete |
| `--border` | `oklch(1 0 0 / 10%)` | `rgba(255,255,255,0.1)` | Borders |

**Light Mode Tokens:**
| Token | OKLCH Value | Visual | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | White | App background |
| `--foreground` | `oklch(0.147 0.004 49.25)` | `#1C1917` (Stone 900) | Primary text |
| `--card` | `oklch(1 0 0)` | White | Surface/cards |
| `--muted-foreground` | `oklch(0.553 0.013 58.071)` | `#57534E` (Stone 600) | Secondary text |
| `--border` | `oklch(0.923 0.003 48.717)` | `#E7E5E4` (Stone 200) | Borders |

### Primary Accent (Brand/Action)
*   **Primary Button Default:** `bg-primary` (mapped to `blue-800` / indigo-ish blue)
*   **Primary Button Hover:** `hover:bg-primary/80`
*   **Inline Accent (dark mode):** `text-blue-400` — used for links, highlighted text, and interactive elements.
*   **Hover Left-Border Accent:** `bg-blue-500` — the 1px left-reveal bar.

### Semantic Status Colors (Tailwind-based)
Applied via custom CSS classes (`badge-pending`, `badge-progress`, etc.) using `color-mix()` for translucent backgrounds:

*   **Pending (Жовтий):** Text: `#eab308` (yellow-500), Bg: `color-mix(in oklab, #eab308 10%, transparent)`, Border: `color-mix(in oklab, #a16207 50%, transparent)`. Class: `.badge-pending`
*   **In Progress / Approved (Синій):** Text: `#3b82f6` (blue-500), Bg: `color-mix(in oklab, #3b82f6 10%, transparent)`, Border: `color-mix(in oklab, #1d4ed8 50%, transparent)`. Class: `.badge-progress`
*   **Resolved (Зелений):** Text: `#22c55e` (green-500), Bg: `color-mix(in oklab, #22c55e 10%, transparent)`, Border: `color-mix(in oklab, #15803d 50%, transparent)`. Class: `.badge-resolved`
*   **Urgent / Rejected (Червоний):** Text: `#ef4444` (red-500), Bg: `color-mix(in oklab, #ef4444 10%, transparent)`, Border: `color-mix(in oklab, #b91c1c 50%, transparent)`. Class: `.badge-urgent`

---

## 5. UI Components & Geometry

### Shape & Radius (Strictly Sharp)
*   **Standard Radius:** `rounded-none` (0px) for **all** cards, buttons, dialogs, avatars, inputs, badges, tabs, and selects.
*   **CSS Variable:** `--radius: 0` is set globally in both `:root` and `.dark`.
*   **Strict Rule:** No rounded corners anywhere. The interface relies entirely on sharp, structural 90-degree angles.

### Buttons
*   **Primary Action Buttons:** `bg-primary text-primary-foreground hover:bg-primary/80`, bold font weight, square corners, `h-8` default, `h-9` for `lg`, `h-6` for `xs`.
*   **Outline Buttons:** `border-border bg-background hover:bg-muted hover:text-foreground`.
*   **Ghost Buttons:** Used for icon-only actions, secondary triggers. `hover:bg-muted hover:text-foreground`.
*   **Destructive Buttons:** `bg-destructive/10 text-destructive hover:bg-destructive/20`.
*   **Button Labels:** Uppercase, `tracking-wider`, `font-bold`, `text-[10px]` for small labels.
*   **Focus States:** `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50`.

### Cards
*   **Card base:** `rounded-none bg-card ring-1 ring-foreground/10` with vertical internal gap (`--card-spacing`).
*   **Ticket-style cards:** `bg-stone-800 border border-stone-700` (dark mode) with the group-hover left-border reveal pattern.
*   **Card hover:** `hover:border-stone-600 transition-colors` (slight border brightening).

### Inputs
*   **Base:** `h-8 rounded-none border border-input bg-transparent px-2.5` with `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50`.
*   **Dark mode:** `dark:bg-input/30` with `dark:disabled:bg-input/80`.
*   **Autofill override (dark mode only):** WebKit autofill gets `box-shadow: 0 0 0 30px #1c1917 inset` with `text-fill-color: #fafaf9` to prevent white flash.

### Tabs
*   **Variant: `line`**: Underline-style tabs. The active tab gets a `0.5` (2px) bottom bar via an `::after` pseudo-element (`after:bg-foreground after:h-0.5 after:opacity-100`). Used in the User Dashboard.
*   **Variant: `default`**: Pill/segment style with `bg-muted` background on the list and `bg-background` on active triggers.

### Progress Stepper
Used in `TicketCard` to visualize complaint lifecycle. Three stages: "Створено" → "В роботі" → "Вирішено".
*   Rendered as three 1.5-height bars (`h-1.5`) with `gap-0.5`.
*   Completed stages: `bg-blue-500`.
*   Current stage: `bg-blue-500 animate-pulse` (for in-progress) or solid `bg-blue-500`.
*   Future stages: `bg-stone-700`.

### Sparkline
A minimal bar-chart micro-visualization used in `StatCard` for admin dashboards.
*   Rendered as `flex items-end gap-px` bars inside a `48px` height container.
*   Most recent bar uses the `color` prop at full opacity; historical bars use `currentColor` at 30% opacity.
*   Appears at the bottom of `StatCard`, fading in on group hover (`opacity-20 → opacity-100`).

### Intentional Empty States
Do not leave dead space when there is no data.
*   Use `border-dashed` box with muted icon inside a small, centered, square container (`w-12 h-12 border border-stone-600 bg-stone-800`).
*   Provide a reassuring heading + description.
*   Class: `.empty-state` — `border-dashed border-border p-8 text-center`.

### Skeleton Loading
Consistent animated skeleton placeholders for async content.
*   `animate-pulse` on the card container.
*   Interior bars use `bg-stone-700/50` for prominent elements and `bg-stone-700/30` for secondary lines.
*   Varying bar widths (`w-3/4`, `w-1/2`, `w-full`) for visual realism.

---

## 6. Iconography

The project uses **two icon libraries**:

*   **Lucide Icons** (`lucide-react`): The primary icon set. Used for navigation, status, actions, and UI chrome.
    *   **Style:** Outline, 1.5–2px stroke width.
    *   **Sizing:** Primary navigation/actions: `w-6 h-6`. Secondary/list items: `w-4 h-4` to `w-5 h-5`. Micro actions: `w-3.5 h-3.5`.
    *   **Common icons:** `Building2` (brand), `ArrowRight` (CTAs), `Search`, `Trash2`, `MessageSquare`, `Wrench`, `Bell`, `Settings`, `LogOut`, `MapPin`, `ChevronUp`.

*   **Hugeicons** (`@hugeicons/react` + `@hugeicons/core-free-icons`): Used exclusively on the Auth page for form chrome and navigation links.
    *   **Icons used:** `Building03Icon`, `ArrowRight01Icon`, `ArrowLeft01Icon`.
    *   Rendered via `<HugeiconsIcon icon={...} strokeWidth={2} className="size-8" />`.

---

## 7. Page Layouts & Architecture

### App Shell
*   **Landing/Home** (`/`): Standalone page, no `Header`/`Footer` wrapper. Own full-page `dark` wrapper.
*   **Auth** (`/auth`): Standalone, centered card layout, no `Header`/`Footer`.
*   **Admin** (`/admin/*`): Standalone layout with `AdminSidebar` + content area. No `Header`/`Footer`.
*   **Authenticated Pages** (`/user`, `/create-report`, `/dashboard`): Wrapped with `<Header />` + `<main className="flex-1">` + `<Footer />`.

### Landing Page (`/`)
The marketing/landing page for unauthenticated visitors. Auto-redirects logged-in users.
*   **Sticky nav:** `bg-stone-900/80 backdrop-blur-md sticky top-0 z-50` with `Separator` bottom border.
*   **Brand mark:** `Building2` icon + "DormWatch" in `text-blue-500 font-bold text-xl tracking-tight`.
*   **Nav links:** "Як це працює", "Поширені запитання", "Екстрені контакти" — `text-stone-300` hover to `text-stone-50`.
*   **Hero Section:** Two-column grid (`lg:grid-cols-2`). Left: headline with `text-blue-400` accent span, body text, two CTA buttons. Right: stylized mock-ticket illustration (layered borders with `rotate-3` / `-rotate-2` transforms and opacity stacking, containing skeleton ticket cards with hover left-border reveal).
*   **Stats Banner:** 4-column grid with `divide-x divide-stone-800`. Large stat numbers (`text-3xl font-bold`) + `micro-label` descriptions.
*   **Features Grid:** 3-column grid of feature cards. Each card: `bg-stone-800 border border-stone-700 p-8` with icon in `w-12 h-12 border border-stone-600 bg-stone-900` box, group-hover left-border reveal.
*   **CTA Section:** Centered text + primary button. `bg-stone-900 py-20`.

### Auth Page (`/auth`)
Dual-mode form page (login / register) controlled by `?tab=register` query param.
*   **Layout:** Centered card (`max-w-lg`) with brand mark, heading, and subtitle above.
*   **Login card:** Email (validated `@lpnu.ua`), password. "Забули пароль?" link.
*   **Register card:** First name, last name, `@lpnu.ua` email, building → room cascade (dynamic fetch), password + confirm.
*   **Cross-link card:** Below main card, a `bg-muted/50` card with `w-1 bg-muted-foreground` left accent bar, linking between login/register.
*   **Error banner:** `border border-destructive/40 bg-destructive/10` box with `text-[11px]` error text.
*   **Back link:** Below card, "Повернутися на головну" with `ArrowLeft01Icon` that translates `-x-1` on hover.

### User Dashboard (`/user`)
Tabbed dashboard for authenticated residents.
*   **Tabs:** `line` variant with two triggers: "Панель" and "Мої заявки".
*   **Dashboard tab:**
    *   Greeting: `text-3xl font-bold text-stone-50` + location with `MapPin` icon.
    *   **CTA block:** Full-width `bg-blue-800` card with `Wrench` icon in `w-12 h-12 border border-white/20 bg-white/10` box. Arrow icon translates `+x-2` on hover. Contains a gradient overlay that fades in on hover.
    *   **Active tickets:** 2/3 column. Uses `TicketCard` components (max 5 rendered). "Історія" link to `/dashboard`.
    *   **Community board:** 1/3 column. Uses `CommunityBoard` component with dashed-border empty state + `BellOff` icon.
*   **Reports tab:** Full list of user's own complaints. Same card pattern as Dashboard feed but with inline vote counts and `Trash2` delete button with `border border-red-400/30 hover:bg-red-400/10`.

### Problem Feed (`/dashboard`)
Public/semi-public view of all approved complaints with filtering and voting.
*   **Filters toolbar:** Search input (`w-48`) with inline `Search` icon, building `Select`, priority `Select` (all `h-8 text-xs`).
*   **Category pills:** Outline/default toggle buttons in `text-[10px] font-semibold uppercase tracking-widest`.
*   **Content grid:** `lg:grid-cols-3`, 2/3 for complaint list, 1/3 for sidebar action cards.
*   **Complaint cards:** Vote-up button (left column, `Separator orientation="vertical" dashed`), status + category badges, title, description, optional photo (click-to-zoom via `Dialog`), `Separator dashed`, date + comments toggle.
*   **Sidebar:** Primary-colored action card (`bg-primary text-primary-foreground`) with context-dependent CTA (admin → "Перейти в комендант-центр", user → "Створити нову заявку").

### Create Report (`/create-report`)
Multi-section form for submitting new complaints.
*   **Back button:** `border border-border hover:border-primary hover:bg-primary/5`.
*   **Category selector:** 2×2 / 4-column grid of icon+label buttons. Active: `variant="default"`, inactive: `variant="outline"`, `border-2`.
*   **Priority selector:** 3 outline/default toggle buttons (`Низький / Середній / Високий`), `flex-1`.
*   **Form fields:** Title, place name, description (`Textarea`, `min-h-36 resize-none`). All with `micro-label` above.
*   **Photo upload:** Square `aspect-square` drop zone with `border-2 border-dashed`. Shows preview with `X` overlay button when photo selected.
*   **Submit button:** Full-width, `font-bold uppercase tracking-wider`.

### Admin Dashboard (`/admin`)
Sidebar + main content layout for administrators.
*   **Sidebar:** `AdminSidebar` component with user identity (initials avatar, name, role), navigation links.
*   **Header bar:** `h-16 bg-stone-800` with page title + "Експорт даних" (outline) and "Нове замовлення" (primary) buttons.
*   **Stat cards:** 3-column grid of `StatCard` components (Очікує / В роботі / Вирішено) with colored sparklines.
*   **Recent complaints table:** `bg-stone-800 border border-stone-700` container with `Table` component. Rows are clickable, opening `ComplaintSidePanel` (sheet).

---

## 8. Component Patterns

### TicketCard
Compact complaint summary used in the User Dashboard.
*   **Props:** `id`, `title`, `description`, `category`, `date`, `status`, `location?`, `categoryLabel?`.
*   **Layout:** Category micro-label + bullet + date → status badge → title + description → `Separator` → `ProgressStepper` + `#id`.
*   **Hover:** Group hover reveals `w-1 bg-blue-500` left bar, title shifts to `text-blue-400`.

### StatCard
Metric display for admin dashboard.
*   **Props:** `icon`, `label`, `value`, `sparklineColor?`, `sparklineData?`, `loading?`.
*   **Layout:** Icon + `micro-label` → large `text-3xl font-bold` value → optional sparkline bar chart at bottom (hidden at 20% opacity, revealed to 100% on hover).
*   **Skeleton:** Custom `StatCardSkeleton` with `animate-pulse` and mock sparkline bars.

### CommunityBoard
Empty-state placeholder for building announcements.
*   Dashed-border container with `BellOff` icon in square box, heading, and description.

### CommentSection
Embedded comment panel that toggles below complaint cards.
*   Rendered inside a `bg-muted/30` (dashboard) or `bg-stone-900/30` (user page) background.
*   Separated from card content by `<Separator dashed />`.

### LoadingSpinner
Minimal CSS spinner for loading states.
*   **Sizes:** `sm` (16px, `border-2`), `md` (32px, `border-2`), `lg` (40px, `border-2`).
*   **Pattern:** `border-primary border-t-transparent animate-spin`. Sometimes customized with `className="border-blue-500"`.

### ComplaintSidePanel
Slide-out sheet (`Sheet` / `Dialog` variant) for viewing/editing individual complaints in the admin dashboard.

---

## 9. Frontend Implementation (React & shadcn/ui)

To enforce this exact design system in the React frontend, the project is initialized using `shadcn/ui` with a highly specific configuration preset.

```bash
npx shadcn@latest init --preset b1ZhP5EQy
```

**Preset Configuration:**
*   **Style:** Lyra
*   **Base Color:** Stone (warm gray)
*   **Theme / Chart Color:** Blue
*   **Font / Heading Font:** Inter Variable
*   **Radius:** None (0px)

### Key shadcn/ui Component Overrides
All components override `rounded-none` globally:

| Component | Key Overrides |
|---|---|
| `Button` | `rounded-none` on base and all sizes (`xs`, `icon-xs`, `icon-sm`). Sizes: `xs (h-6)`, `sm (h-7)`, `default (h-8)`, `lg (h-9)`, `icon (size-8)`, `icon-xs (size-6)`, `icon-sm (size-7)`, `icon-lg (size-9)`. |
| `Badge` | `rounded-none`, height `h-5`, `px-2 py-0.5`. |
| `Card` | `rounded-none`, uses `ring-1 ring-foreground/10` instead of border. `--card-spacing` token. |
| `Input` | `rounded-none h-8`, dark mode `bg-input/30`. |
| `Tabs` | `rounded-none` on list and triggers. Line variant uses `::after` pseudo for active underline. |
| `Separator` | Extended with `dashed?: boolean` prop. When dashed: `border-dashed border-t` (horizontal) or `border-l` (vertical). |
| `Table` | Standard shadcn with stone-800/700 dark palettes. |

### Custom CSS Component Classes
Defined in `@layer components` in `index.css`:

| Class | Purpose |
|---|---|
| `.micro-label` | 10px uppercase tracking-widest semi-bold muted-foreground text |
| `.badge-status` | Base badge styling (px/py, uppercase, tracking, border) |
| `.badge-pending` | Yellow status badge colors |
| `.badge-progress` | Blue status badge colors |
| `.badge-resolved` | Green status badge colors |
| `.badge-urgent` | Red status badge colors |
| `.empty-state` | Dashed-border centered container |
| `.ticket-card` | Card with accent-5% hover background |
| `.ticket-separator` | Dashed top border using `--border` |
| `.link-hover` | Left-border + translateX hover pattern |
| `.auth-field` | Left-border focus indicator for auth inputs |
| `.animate-fade-in-up` | 0.7s entrance animation (translateY 24px → 0) with `cubic-bezier(0.16, 1, 0.3, 1)`. Respects `prefers-reduced-motion`. |

---

## 10. Routing & Auth Flow

| Path | Layout | Auth Required | Role |
|---|---|---|---|
| `/` | Standalone | No (redirects if logged in) | Public |
| `/auth` | Standalone | No | Public |
| `/auth?tab=register` | Standalone | No | Public |
| `/user` | Header + Main + Footer | Yes | Resident |
| `/create-report` | Header + Main + Footer | Yes (redirects admin) | Resident |
| `/dashboard` | Header + Main + Footer | No (enhanced if logged in) | Public |
| `/admin` | Sidebar layout | Yes (admin only) | Admin |
| `/admin/complaints` | Sidebar layout | Yes (admin only) | Admin |

**Auth redirect logic:**
*   Logged-in users visiting `/` are redirected to `/user` (residents) or `/admin` (admins).
*   Admins visiting `/create-report` are redirected to `/admin`.
*   Unauthenticated users visiting `/user` are redirected to `/`.

---

## 11. Data Model (Frontend-facing)

### Complaint / Problem
| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique identifier, displayed as `#id` |
| `title` | `string` | Short headline |
| `description` | `string` | Detailed description |
| `category` | `"plumbing" \| "electricity" \| "furniture" \| "internet"` | Category key |
| `status` | `"pending" \| "approved" \| "rejected" \| "resolved"` | Lifecycle status |
| `priority` | `"low" \| "medium" \| "high" \| "critical"` | Urgency level |
| `building` | `string` | Building name |
| `placeName` | `string` | Room / location description |
| `votesCount` | `number` | Community upvotes |
| `photoUrl` | `string \| null` | Full-size photo URL |
| `thumbnail` | `string \| null` | Thumbnail photo URL |
| `createdAt` | `string` (ISO date) | Creation timestamp |
| `user_id` | `number` | Owner's user ID |

### User Profile
| Field | Type | Description |
|---|---|---|
| `user` | `number` | User ID |
| `email` | `string` | Must end in `@lpnu.ua` |
| `first_name` | `string` | Given name |
| `last_name` | `string` | Family name |
| `building` | `string` | Assigned building name |
| `room` | `string` | Assigned room number |
| `place` | `{ place_name: string }` | Full place object |
| `role` | `{ role_name: string }` | "admin" / "адміністратор" for admin access |

### Category Labels
| Key | Ukrainian Label |
|---|---|
| `plumbing` | Сантехніка |
| `electricity` | Електрика |
| `furniture` | Меблі |
| `internet` | Інтернет |

### Status Labels
| Key | Ukrainian Label |
|---|---|
| `pending` | Очікує |
| `approved` | Активно |
| `rejected` | Відхилено |
| `resolved` | Вирішено |

### Priority Labels
| Key | Ukrainian Label |
|---|---|
| `low` | Низький |
| `medium` | Середній |
| `high` | Високий |
| `critical` | Критично |
