<h1 align="center">
  <br>
  CORSO VELLE — Custom Shopify Theme
  <br>
</h1>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=18&duration=3500&pause=600&color=111111&background=fce6bb&center=true&vCenter=true&width=600&lines=A+bespoke+luxury+Shopify+storefront+for+Corso+Velle;Timeless+basics%2C+modern+experience;Built+with+Liquid+%7C+CSS+%7C+JavaScript" alt="Typing animation" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Shopify-96BF48?style=for-the-badge&logo=shopify&logoColor=white" />
  <img src="https://img.shields.io/badge/Liquid-7AB55C?style=for-the-badge&logo=shopify&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/Status-Private-111111?style=for-the-badge&labelColor=fce6bb" />
</p>

---

## 🏠 Homepage

The homepage opens with an immersive full-screen hero section — bold typography, custom call-to-action buttons, and seamless auto-looping background video. Below the hero sits the **New Arrivals** interactive product carousel, allowing customers to drag, swipe, and explore the latest drops effortlessly.

* **Full-Width Hero Section**: Responsive video playback with zero latency and mobile-specific media overrides.
* **New Arrivals Carousel**: Smooth touch and arrow navigation displaying 4:5 proportioned cards.
* **Lookbook & Curated Stories**: Editorial photo grids that showcase seasonal collections and brand aesthetics.

---

## 🗂️ Collections & Product Cards

The collection pages present the product catalog in an elegant, evenly spaced grid with modern hover interactions.

* **Hover Video & Slideshow**: Moving the cursor over any card instantly streams high-res video preview or alternates gallery images with smooth fade and zoom.
* **Bold Product Typography**: Distinctive high-contrast product titles set in the signature *Inter / Newsreader* typography system.
* **Smart Badges**: Sale, Sold Out, and New Arrival badges rendered in Corso Velle's warm champagne gold (`#fce6bb`) palette.
* **Direct Add & Quick Buy**: Seamless drawer addition without page refreshes.

---

## 🧥 Product Details Page (PDP)

Built for maximum clarity, storytelling, and high conversion.

* **Pure Photo Gallery**: Clean, uncluttered photo carousel with interactive thumbnail navigation, dot indicators, and full-resolution zoom dialog.
* **Standalone Video Showcase**: Product showcase videos are extracted from the photo gallery and presented in a dedicated video showcase below the product images. Plays automatically, muted, looping, and inline with zero intrusive overlay buttons.
* **Sticky Add-to-Cart Bar**: Floats cleanly at the bottom as customers scroll through long descriptions and media.
* **Accordion Care & Sizing Guides**: Built-in guides for clothing, linen, knitwear, denim, and genuine leather care.

---

## 🛒 Cart Drawer & Sticky Buy

A high-performance slide-in cart drawer that keeps the customer inside the shopping flow.

* **Slide-In Drawer**: Real-time item updates, cart notes, and subtotal calculation.
* **Sticky Purchase Bar**: Keeps the product title, image, price, and Add to Cart button pinned within reach across desktop and mobile.
* **Optimized Checkout Navigation**: Instant redirect to Shopify's secure checkout.

---

## ✨ Features Matrix

| Feature | Details |
|---|---|
| 🛍️ **Product Pages** | Pure photo carousel, variant dropdowns, live price updates, standalone showcase video |
| 🎬 **Hover Video Cards** | Pre-buffered MP4 hover stream on collection cards with zero lag |
| 🛒 **Cart Drawer** | Slide-in drawer with live cart item management and sticky buy bar |
| 🎠 **Interactive Carousels** | Touch-friendly drag and arrow sliders across New Arrivals and Hero sections |
| 📐 **Accordion Care Guides** | Embedded care instructions for cotton, linen, suede, and leather footwear |
| 🔍 **Search & Filters** | Predictive live search drawer with instant thumbnail previews |
| 📱 **Mobile First** | Native touch gestures, responsive 16px screen padding, and edge protection |
| 🎨 **Theme Customizer** | Fully configurable JSON architecture for Section Everywhere |

---

## 🎨 Design System

Corso Velle's luxury aesthetic balances rich deep blacks, warm champagne accents, and crisp modern typography:

| Token | Value | Purpose |
|---|---|---|
| **Background** | `#FFFFFF` | Clean editorial background |
| **Foreground / Text** | `#111111` | High-contrast deep black typography |
| **Accent / Badge** | `#fce6bb` | Signature warm champagne gold |
| **Primary Font** | `Inter, Helvetica Neue, Arial` | Clean modern product titles, body, pricing, buttons |
| **Editorial Serif** | `Newsreader, serif` | Timeless editorial headings and accents |

---

## 🗂️ Project Structure

```
corso-velle-v2/
├── assets/
│   ├── base.css                     # Master global styles & typography
│   ├── product-card.js              # Hover video and card interactions
│   ├── media-gallery.js             # Photo carousel & zoom controller
│   └── *.js / *.css                 # Optimized ES modules & component styles
│
├── sections/
│   ├── hero.liquid                  # Fullscreen responsive video/image hero
│   ├── product-information.liquid   # PDP main layout & media grid
│   ├── product-list.liquid          # New arrivals & featured collections
│   ├── header.liquid                # Header navigation & logo
│   └── footer.liquid                # Footer links & copyright
│
├── blocks/
│   ├── _product-card.liquid         # Modular product card block
│   ├── _product-details.liquid      # Price, variants, and CTA group
│   └── _slide.liquid                # Slideshow slide definitions
│
├── snippets/
│   ├── product-showcase-video.liquid# Standalone showcase video player
│   ├── card-gallery.liquid          # Card hover video & photo stream
│   ├── product-media-gallery-content.liquid # PDP photo gallery engine
│   ├── theme-styles-variables.liquid# Global CSS custom properties
│   └── fonts.liquid                 # Google Fonts preloader
│
├── templates/                       # JSON page & section templates
├── layout/theme.liquid              # Master HTML shell
└── config/settings_data.json        # Theme settings and typography presets
```

---

## 🚀 Local Development

```bash
# Authenticate with Shopify CLI
shopify login --store corso-velle.myshopify.com

# Start local development server with hot-reload
shopify theme dev

# Pull latest settings from live store
shopify theme pull

# Deploy changes to theme
shopify theme push
```

---

<p align="center">
  <sub>Handcrafted for <b>Corso Velle</b> • Built by Osayeid Zaber</sub>
</p>
