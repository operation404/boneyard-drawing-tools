# Plan: Upgrade to Foundry VTT v13

## Goal
Migrate boneyard-drawing-tools from Foundry v9–v11 to v13, adopting the ApplicationV2 framework and resolving all breaking changes.

---

## Phase 1: Module Manifest & Boilerplate

- [ ] **Update `module.json`**
  - Set `compatibility.minimum` to `13`
  - Set `compatibility.verified` to current v13 release
  - Remove `_only_if_breaking__maximum`
  - Remove legacy `minimumCoreVersion` / `compatibleCoreVersion` fields
  - Fix `library` from string `"false"` to boolean `false`

- [ ] **Update `setup.js`**
  - Verify `loadTemplates()` still works in v13 (it does)
  - Adjust template paths if PARTS system replaces preloading

---

## Phase 2: Application v1 → ApplicationV2

This is the largest change. `Drawing_Tools` currently extends `Application` (v1).

- [ ] **Convert `Drawing_Tools` to ApplicationV2**
  - Extend `foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2)`
  - Replace `static get defaultOptions()` with `static DEFAULT_OPTIONS = {}`
  - Define `static PARTS` for templates instead of `template` in options
  - Replace `getData()` with `async _prepareContext(options)`
  - Replace `activateListeners(html)` with the actions system (`data-action` attributes) and `_attachPartListeners()` for complex listeners
  - Replace custom `_injectHTML()` / `_render()` overrides with v2 lifecycle
  - Update `close()` override to v2 signature

- [ ] **Update templates for ApplicationV2**
  - Add `data-action="..."` attributes to interactive elements in `quick-draw-config.hbs`
  - Remove any jQuery-dependent markup patterns

---

## Phase 3: Scene Controls Hook

The `getSceneControlButtons` hook changed from an array to a keyed object in v13.

- [ ] **Update `add_control_buttons()` in `drawing_tools.js`**
  - Old: `controls.find(c => c.name === 'drawings')` then `tools.push(...)`
  - New: `controls.drawings.tools.myTool = { ... }` (object assignment)
  - Verify tool properties: `name`, `title`, `icon`, `button`, `onClick`/`onChange`, `order`

---

## Phase 4: jQuery Removal

v13 moves away from jQuery. Replace all usages with vanilla DOM.

- [ ] **`drawing_tools.js`**
  - `$('body').append(html)` → `document.body.append(...)`
  - `el.css({...})` → `el.style.minHeight = ...`
  - `el.remove()` → native `element.remove()`

- [ ] **`color_selector.js`**
  - Audit for any jQuery usage and replace

---

## Phase 5: Drawing Layer & Settings API

- [ ] **Verify `DrawingsLayer.DEFAULT_CONFIG_SETTING`**
  - Check if this constant still exists in v13
  - If removed/renamed, find the v13 equivalent for reading/writing drawing defaults
  - Update all references in `drawing_tools.js` (getData, color_button_handler, update_drawing_layer_config)

- [ ] **Review settings registration (`settings.js`)**
  - Verify `game.settings.register()` API is unchanged
  - Fix duplicate registration of `SETTINGS_PRESET_COLOR_SWATCHES` (appears twice)
  - Verify `requiresReload`, `type`, `choices` properties still work

---

## Phase 6: Color Selector & Template Loading

- [ ] **Update `color_selector.js` Handlebars usage**
  - Currently uses dynamic `import('handlebars')` and `fetch()` to load templates
  - Switch to Foundry's built-in template API (`renderTemplate()` or `Handlebars.compile()`)
  - Verify `Handlebars` is still globally available in v13

- [ ] **Replace custom WebGL dropper with Foundry/PIXI canvas APIs**
  - Current implementation grabs a raw `webgl2` context on `canvas#board` and calls `gl.readPixels()` directly
  - Replace with PIXI's extract API via `canvas.app.renderer.extract` (e.g. `extract.pixels()`) to read pixel data from the rendered stage
  - This avoids fragile direct WebGL access and stays compatible with any future renderer changes
  - Convert screen coordinates to canvas world coordinates using `canvas.clientCoordinatesFromEvent(event)` or equivalent
  - Keep the dropper preview grid UX (mousemove updates pixel swatches, click selects final color, keydown cancels)

---

## Phase 7: DOM Selectors & Keyboard Shortcuts

- [ ] **Audit fragile DOM selectors**
  - `li[data-control="drawings"]` — verify v13 sidebar HTML structure
  - `section#ui-left` — verify still exists
  - Control button positioning selectors — update as needed

- [ ] **Replace custom keyboard shortcut system with `game.keybindings`**
  - Remove the custom MutationObserver-based shortcut listener entirely
  - Remove custom shortcut settings (`shortcut_enabled`, `shortcut_key`, `shortcut_modifiers`) from `settings.js`
  - Register keybinding via `game.keybindings.register()` in `settings.js` or `setup.js`
  - The keybinding should open/toggle the quick-draw panel
  - Users will configure the key combo through Foundry's built-in Configure Controls UI

---

## Phase 8: CSS / Styling

- [ ] **Update styles for v13 theming**
  - v13 introduces CSS Layers — existing styles may be overridden or broken
  - Review `module.css` and `color_selector.css` against v13's new theme
  - Use CSS variables where Foundry provides them
  - Recompile SCSS if changes are made

---

## Phase 9: Testing & Cleanup

- [ ] Launch Foundry v13, enable the module, verify it loads without errors
- [ ] Test opening the quick-draw panel (via button and keyboard shortcut)
- [ ] Test stroke/fill color changes and verify they persist
- [ ] Test color selector (canvas, hue slider, RGB inputs, swatches)
- [ ] Test dropper tool
- [ ] Test settings page
- [ ] Remove `vector_math.js` if still unused after upgrade
- [ ] Update CLAUDE.md compatibility line to reflect v13

---

## Reference
- [Foundry v13 API Docs](https://foundryvtt.com/api/v13/)
- [ApplicationV2 API](https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html)
- [getSceneControlButtons v13](https://foundryvtt.com/api/functions/hookEvents.getSceneControlButtons.html)
- [ApplicationV2 Development Guide](https://docs.rayners.dev/seasons-and-stars/applicationv2-development/)
