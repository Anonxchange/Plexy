# Design Guidelines: Pexly - P2P Cryptocurrency Marketplace

## Design Approach
**Reference-Based Design** - Direct inspiration from Paxful and NoOnes' established visual language, adapted for Pexly - a complete P2P crypto trading platform. The design prioritizes trust, clarity, and efficiency - essential for financial applications where users need confidence in transactions.

## Branding
- **Name**: Pexly
- **Logo**: Lime green lightning bolt (Zap icon) in a rounded square background
- **Primary Color**: Lime Green (#B4F22E) - 75 85% 65%
- **Color Psychology**: The vibrant lime green represents energy, growth, speed, and innovation in the fintech space

## Core Design Principles
1. **Trust & Credibility** - Professional appearance that instills confidence in financial transactions
2. **Information Clarity** - Clear data hierarchy for prices, offers, and transaction details
3. **Action-Oriented** - Prominent CTAs that guide users through trading flows
4. **Data Transparency** - Visible metrics, rates, and verification indicators

## Color Palette

### Light Mode (Primary)
- **Primary Lime**: 75 85% 65% (#B4F22E) - Main brand color for CTAs, links, trust indicators (Paxful signature color)
- **Lime Dark**: 75 85% 55% - Headers, important text, hover states
- **Success Green**: 142 76% 36% - Positive actions, completed trades, buy indicators
- **Warning Orange**: 25 95% 53% - Alerts, pending states, sell indicators
- **Neutral Gray**: 210 16% 93% - Backgrounds, cards, subtle borders
- **Text Primary**: 210 24% 16% - Main content text
- **Text Secondary**: 210 14% 53% - Supporting text, labels
- **White**: 0 0% 100% - Cards, surfaces, clean backgrounds
- **Black**: 0 0% 0% - Text on lime buttons, high contrast elements

### Dark Mode
- **Background**: 215 28% 12% - Main background (very dark, almost black)
- **Surface**: 215 25% 16% - Cards, elevated surfaces
- **Primary Lime**: 75 85% 65% (#B4F22E) - Consistent bright lime green across light/dark
- **Text Primary**: 0 0% 95% - Main text on dark
- **Text Secondary**: 210 20% 70% - Secondary text on dark

## Typography

### Font Families
- **Primary**: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif
- **Monospace**: 'JetBrains Mono', 'Courier New', monospace (for crypto addresses, amounts)

### Type Scale
- **Hero Heading**: text-5xl lg:text-6xl font-bold (48-60px)
- **Page Title**: text-4xl font-bold (36px)
- **Section Heading**: text-2xl font-semibold (24px)
- **Card Title**: text-xl font-semibold (20px)
- **Body Large**: text-lg (18px)
- **Body**: text-base (16px) - Default for most content
- **Body Small**: text-sm (14px) - Labels, metadata
- **Caption**: text-xs (12px) - Timestamps, helper text

### Font Weights
- Regular (400): Body text
- Medium (500): Emphasis, labels
- Semibold (600): Headings, important data
- Bold (700): Primary headings, CTAs

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 3, 4, 6, 8, 12, 16, 20, 24** for consistent rhythm
- Tight spacing: 2-4 (8-16px) - Within components
- Medium spacing: 6-8 (24-32px) - Between related elements
- Generous spacing: 12-20 (48-80px) - Between sections

### Container Widths
- **Full-width sections**: w-full with max-w-7xl mx-auto px-4 lg:px-8
- **Content sections**: max-w-6xl mx-auto
- **Reading content**: max-w-4xl mx-auto
- **Narrow forms**: max-w-2xl mx-auto

### Grid Systems
- **Offer Listings**: grid grid-cols-1 lg:grid-cols-3 gap-6
- **Trading Dashboard**: grid grid-cols-1 xl:grid-cols-12 gap-6 (8 cols main, 4 cols sidebar)
- **Feature Cards**: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
- **Wallet Cards**: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4

## Component Library

### Navigation
- **Top Navigation**: Sticky header with white bg, subtle shadow on scroll, h-16
- **Logo**: Primary lime green accent, medium weight
- **Navigation Items**: text-sm font-medium, hover:text-primary
- **User Menu**: Avatar + dropdown with border, rounded-lg
- **Mobile Menu**: Slide-in drawer from right, full-height overlay

### Cards & Surfaces
- **Offer Card**: White bg, border border-gray-200, rounded-lg, p-6, hover:shadow-md transition
- **Trade Card**: Elevated with shadow-sm, rounded-xl, overflow-hidden
- **Wallet Card**: Gradient background option for crypto types, rounded-2xl, p-6
- **Info Card**: bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg

### Buttons
- **Primary CTA**: bg-primary (lime green) hover:opacity-90 text-black font-semibold px-6 py-3 rounded-lg
- **Secondary**: bg-white border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg
- **Success**: bg-green-600 hover:bg-green-700 text-white (Buy actions)
- **Warning**: bg-orange-500 hover:bg-orange-600 text-white (Sell actions)
- **Ghost**: text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg
- **Icon Buttons**: p-2 rounded-full hover:bg-gray-100

### Forms & Inputs
- **Text Input**: border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg px-4 py-3
- **Select Dropdown**: Custom styled with chevron icon, same styling as text input
- **Search Bar**: Prominent with icon, bg-gray-50 focus:bg-white, rounded-full px-6 py-3
- **Toggle Switch**: Lime green active state, gray inactive, smooth transition
- **Range Slider**: Lime green track and thumb, gray background rail

### Data Display
- **Price Display**: text-3xl font-bold tabular-nums with currency symbol
- **Rate Indicator**: Inline with green/red arrow icon, percentage in same color
- **Badge**: Small rounded-full px-3 py-1 text-xs font-semibold (green for verified, lime for active, gray for pending)
- **Avatar**: Circular with user initials or image, border for verified users
- **Progress Bar**: Rounded bar with lime green fill, gray background, shows escrow/completion status

### Trading Interface Components
- **Order Book**: Table with hover states, alternating row backgrounds for buy/sell
- **Trade History**: Compact list with timestamps, amounts in monospace font
- **Chat Widget**: Fixed bottom-right or sidebar, rounded-t-2xl, shadow-2xl
- **Escrow Timer**: Countdown display with circular progress indicator

### Modals & Overlays
- **Modal**: Centered, max-w-2xl, rounded-2xl, shadow-2xl, p-8, backdrop blur
- **Drawer**: Slide from right, w-96, full-height, shadow-xl
- **Tooltip**: bg-gray-900 text-white text-xs px-3 py-2 rounded-lg, arrow indicator
- **Notification Toast**: Fixed top-right, slide-in animation, auto-dismiss, colored border-l-4

## Trading-Specific Patterns

### Offer Listing Card Structure
- Vendor avatar + verification badge (top-left)
- Payment method icon + label (prominent)
- Price per BTC with fiat currency (large, bold)
- Available amount range (secondary text)
- Trade limits (min-max in smaller text)
- "Buy/Sell" CTA button (full-width at bottom)
- Trust indicators (trades completed, response time)

### Trade Flow Screens
1. **Offer Selection**: Grid of cards with filters sidebar
2. **Trade Initiation**: Modal with amount input, terms display, confirmation
3. **Active Trade**: Split view - escrow status (left), chat (right)
4. **Payment Verification**: Step-by-step checklist with upload capability
5. **Completion**: Success state with rating prompt

### Wallet Dashboard
- Balance cards at top (grid layout, each crypto has distinct color)
- Quick actions row (Send, Receive, Swap) with icons
- Transaction history table below
- Charts/graphs for portfolio visualization (optional)

## Visual Enhancements

### Micro-interactions
- Button hover: Subtle scale (scale-105) + shadow increase
- Card hover: Lift effect with shadow-md
- Input focus: Border color shift + ring effect
- Loading states: Pulsing skeleton screens matching component shapes
- Success animations: Checkmark with scale spring animation

### Icons
Use **Heroicons** (outline for default, solid for active states)
- Trading: arrow-trending-up, arrow-trending-down, arrows-right-left
- Crypto: currency-dollar, banknotes, wallet
- Actions: plus, minus, paper-airplane, chat-bubble-left-right
- Status: check-circle, clock, exclamation-triangle, shield-check

## Images

### Hero Section
**Large Hero Image**: Yes - Financial technology/cryptocurrency themed
- **Description**: Modern illustration or photo showing diverse people using mobile devices for trading, global connectivity visualization, or abstract crypto/blockchain graphics
- **Placement**: Right side of hero (60% width on desktop), full-width background on mobile
- **Treatment**: Slight blue tint overlay to match brand, subtle animation on load

### Section Images
- **How It Works**: Step-by-step illustrations showing trade flow, 3-column layout
- **Trust/Security Section**: Photo of verified user or security badge visualization
- **Testimonials**: User avatar photos (circular, 80x80px)
- **Payment Methods**: Icon grid showing 20+ popular payment logos

### Trading Interface
- **Cryptocurrency Icons**: Use standard crypto logos (BTC, ETH, USDT, etc.)
- **Payment Method Icons**: Custom or standard bank/wallet service logos
- **User Avatars**: Placeholder with initials or uploaded profile photos

## Accessibility & Responsiveness

- Maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large)
- Focus indicators visible on all interactive elements (ring-2 ring-blue-500)
- Mobile-first breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1536px
- Touch targets minimum 44x44px on mobile
- All forms include proper labels and error states

## Page-Specific Layouts

### Homepage
- Hero with trade search widget (prominent)
- Live crypto prices ticker
- "How It Works" 3-step cards
- Payment methods showcase grid
- Trust indicators (users, volume, countries)
- Testimonials carousel
- App download CTA section

### Buy/Sell Offers Page
- Filters sidebar (collapsible on mobile)
- Offer cards grid (main content)
- Sort controls (dropdown, top-right)
- Pagination (bottom)

### Trading Interface
- Escrow status panel (prominent top)
- Trade details card (left column)
- Chat interface (right column, sticky)
- Action buttons (bottom, fixed on mobile)

### Wallet Dashboard
- Balance overview cards (top grid)
- Quick actions toolbar
- Transaction history table
- Send/Receive modal dialogs

This design system creates a trustworthy, professional P2P marketplace that mirrors Paxful's proven interface patterns while maintaining flexibility for custom features.