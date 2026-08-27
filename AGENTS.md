# AGENTS.md

## Repository overview

Corso-Velle is a Shopify Online Store 2.0 theme rather than a conventional application with a build pipeline. The repository is organized around Shopify theme directories and is rendered by Shopify’s Liquid runtime. The default branch is `main`. At the time of inspection, the repository contained **478 tracked files**, including Liquid templates, JSON templates and schemas, JavaScript modules, CSS, and localization data.

The theme presents itself as **Corso Velle V2**, a 3D-ready e-commerce experience. The implementation is primarily Liquid (`284` tracked files), with JavaScript (`82`), JSON (`70`), and CSS (`3`) providing client-side behavior, theme configuration, templates, and styling.

## Source tree

| Directory | Files | Responsibility |
| --- | ---: | --- |
| `assets/` | 125 | JavaScript custom elements/modules, theme CSS, icons, images, and other static assets. |
| `blocks/` | 95 | Reusable Online Store 2.0 theme blocks, commonly rendered through section composition. |
| `config/` | 2 | Theme editor settings schema and persisted settings data. |
| `layout/` | 2 | Top-level Liquid document wrappers, including `theme.liquid` and the password layout. |
| `locales/` | 51 | Translation dictionaries and localized theme/editor strings. |
| `sections/` | 47 | Configurable page sections and section-level Liquid markup/schema. |
| `snippets/` | 141 | Reusable Liquid partials for UI, data formatting, styling, accessibility, and shared behavior. |
| `templates/` | 14 | JSON or Liquid templates for index, product, collection, cart, search, blog, article, pages, password, gift card, and 404 routes. |

The repository currently has no tracked `package.json`, lockfile, test suite, or application server. Do not introduce Node-based build assumptions unless a future change explicitly adds them.

## How Shopify rendering is composed

Shopify begins with a route template under `templates/`. JSON templates select and configure sections; sections provide configurable page regions and render blocks; snippets provide the smallest reusable presentation and behavior units. The top-level layout wraps the rendered page, loads global metadata and assets, and supplies Shopify’s standard content placeholders.

The principal rendering path is:

```text
Shopify route
  -> templates/*.json or templates/*.liquid
  -> layout/theme.liquid
  -> sections/*.liquid
  -> blocks/*.liquid
  -> snippets/*.liquid
  -> assets/*.js, assets/*.css, and theme-hosted media
```

When adding a new configurable page feature, prefer a section or block with a valid `{% schema %}` over hard-coding it in a template. When markup is shared across multiple sections, extract it into a snippet. Keep route-specific composition in `templates/` and global document concerns in `layout/`.

## Important files and subsystems

| Area | Files or patterns to inspect first | Notes |
| --- | --- | --- |
| Global document | `layout/theme.liquid`, `layout/password.liquid` | Own the outer HTML document, global metadata, theme styles, and global scripts. Changes here affect every storefront route. |
| Theme settings | `config/settings_schema.json`, `config/settings_data.json` | `settings_schema.json` defines Theme Editor controls; `settings_data.json` stores configured values and presets. Preserve valid Shopify schema types and IDs. |
| Route composition | `templates/*.json`, `templates/*.liquid` | JSON templates define section order and settings. Keep JSON valid and use existing section type names. |
| Page sections | `sections/*.liquid` | Sections expose editor settings and block definitions in `{% schema %}`. Keep schema IDs stable after publication. |
| Reusable UI | `snippets/*.liquid` | Includes product cards, cart UI, navigation, media, typography, spacing, forms, filters, drawers, and style helpers. Prefer existing snippets before creating duplicates. |
| Reusable blocks | `blocks/*.liquid` | Designed for Online Store 2.0 section/block composition. Maintain their schema and expected settings contract. |
| Client behavior | `assets/*.js` | Uses ES modules and Shopify theme imports such as `@theme/component` and `@theme/utilities`; many files register custom elements with `customElements.define`. |
| Product hover preview | `snippets/card-gallery.liquid`, `assets/product-card.js` | Uses the first native Shopify `video` media item as a muted desktop hover preview; external iframe videos are skipped. The existing image slideshow remains the fallback and continues to receive pointer preview/reset behavior. |
| Styling | `assets/base.css` and other CSS assets | Uses CSS custom properties driven by theme settings and utility-style snippets for spacing, typography, palettes, borders, and component styles. |
| Localization | `locales/*.json` | Keep translation keys synchronized when adding user-facing text. Prefer translation keys over hard-coded storefront strings. |

The JavaScript layer includes behavior for accordions, anchored popovers, announcement bars, cart drawers, predictive search, quick add, product media, filters, slideshow controls, localization forms, and other interactive theme components. Before adding a new custom element, search `assets/` for an existing component with the same responsibility and follow its lifecycle and naming pattern.

Product cards can show a muted native Shopify product video on desktop hover when a product contains a `video` media item. `snippets/card-gallery.liquid` renders the first native video as a `card-gallery__hover-video` overlay with autoplay disabled until interaction, looping, muted playback, and no controls. `assets/product-card.js` binds `pointerenter` and `pointerleave`, adds `is-hover-video-playing` only after `video.play()` succeeds, and pauses/resets the video on leave. Touch devices and reduced-motion users keep the normal image slideshow. Preserve the `data-hover-video-wrapper`, `card-gallery__hover-video`, and `is-hover-video-playing` hooks when changing this interaction.

## Development workflow

The README documents the Shopify CLI workflow:

```bash
shopify login --store your-store.myshopify.com
shopify theme dev
shopify theme push
```

Use `shopify theme dev` for a local preview and theme-editor development session. Use `shopify theme push` only when the intended store and deployment target are confirmed. Authentication, store names, and deployment choices must never be committed to the repository.

The Shopify CLI is not installed in the inspected sandbox, and no project-specific test or lint command is defined in the repository. In an environment with Shopify CLI available, run the appropriate theme validation/check command before pushing. At minimum, validate JSON syntax, inspect Liquid schema blocks, and use a development theme preview for visual and interactive regression testing.

## Editing conventions

Use Shopify Liquid idioms and the existing naming style. Keep filenames lowercase and hyphen-separated, as used throughout `assets/`, `snippets/`, `sections/`, and `blocks/`. Prefer descriptive names tied to the component responsibility, such as `product-card.liquid`, `cart-drawer.liquid`, or `predictive-search-styles.liquid`.

Preserve the separation between markup, behavior, and styling. Liquid should compose data and markup; JavaScript should own interactive state and DOM behavior; CSS should own presentation and responsive rules. Reuse existing snippets and CSS-variable conventions before introducing parallel implementations.

For JavaScript, preserve ES-module syntax and the existing `@theme/*` import aliases. Follow the established custom-element lifecycle pattern, guard against missing DOM nodes, and avoid registering the same element name more than once. Keep browser behavior progressively safe when an optional element or setting is absent.

For Liquid, use Shopify objects and filters consistently with neighboring files. Preserve escaping and URL/image filters at output boundaries. Be careful with product, variant, cart, customer, and localization data because these values can be absent depending on the route and store configuration.

For section and block schemas, keep the JSON-like schema inside the Liquid file syntactically valid. Maintain stable setting IDs, defaults, presets, block types, and `limit` values unless the change intentionally migrates the Theme Editor contract. After changing schema IDs, check all corresponding references in the section markup and settings data.

For translations, add keys to the relevant locale files and use the translation key in Liquid or JavaScript. Do not silently remove existing keys because the same key may be referenced by multiple templates or editor settings.

For assets, use Shopify-compatible asset URLs and the repository’s existing loading mechanism. Avoid embedding large inline scripts or styles in templates when a reusable asset or snippet is appropriate. Keep image and 3D/media handling compatible with Shopify-hosted URLs and lazy/deferred loading patterns already used by neighboring components.

## Safe change workflow

Before editing, identify the route or Theme Editor feature being changed and trace its template, section, block, snippet, and asset dependencies. Search for existing render/include calls, custom-element names, setting IDs, translation keys, and CSS variables before creating new ones.

After editing, inspect the diff and verify that only intended files changed. Validate every modified JSON file with a JSON parser. Check Liquid schema blocks carefully because a malformed schema can prevent a section from loading in the Theme Editor. For UI changes, test desktop and mobile layouts, keyboard focus, drawers/popovers, cart interactions, predictive search, product variants, and empty/error states when applicable.

A useful local review sequence is:

```bash
git status --short
git diff --check
git diff --stat
# Validate a changed JSON file:
node -e "JSON.parse(require('fs').readFileSync('path/to/file.json', 'utf8')); console.log('valid JSON')"
```

Use `git diff --check` for whitespace errors. Do not commit generated inspection reports, local credentials, Shopify store tokens, or temporary preview artifacts.

## Commit guidance

Commits in the existing history use short, imperative-style prefixes such as `feat:` and `docs:`. Keep commits focused and use a conventional prefix when appropriate:

```text
feat: add a configurable editorial collection block
tweak: refine product card responsive behavior
fix: guard quick add when a variant is unavailable
docs: update theme setup instructions
```

Describe schema changes, route changes, and storefront behavior in the commit body when they are not obvious from the subject. Avoid mixing unrelated documentation, styling, and behavior changes in one commit.

## Scope and caution areas

The theme configuration contains a substantial Theme Editor surface, including typography, palettes, buttons, cart behavior, drawers, inputs, badges, and spacing. Changes to settings names or IDs can affect existing merchant configuration, so treat them as compatibility-sensitive.

Cart, product, variant, search, localization, and customer-facing form code is distributed across sections, snippets, and JavaScript custom elements. A change that appears local may affect multiple templates. Trace shared snippets and event/custom-element contracts before modifying them.

The current branch is `main`, and the latest inspected commit is `495f3a1` (`docs: update emoji asset paths in README to correct directory structure`). Keep `AGENTS.md` synchronized with future changes to tooling, directory responsibilities, or deployment workflow.
