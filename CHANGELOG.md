## 3.0.0

- **Breaking:** Requires Foundry VTT v13.
- Migrated to ApplicationV2 (`HandlebarsApplicationMixin`). The panel is now a standard Foundry window — draggable, with native title bar and close button.
- Replaced custom keyboard shortcut system with Foundry's built-in `game.keybindings` API. Shortcuts are now configured through Foundry's Configure Controls menu.
- Replaced direct WebGL `readPixels` dropper with PIXI renderer extract API.
- Updated `getSceneControlButtons` hook for v13's object-keyed controls format.
- Updated `DrawingsLayer` references to `foundry.canvas.layers.DrawingsLayer`.
- Color values from drawing defaults are now normalized to handle `Color` objects.
- Settings changes are applied in real-time (no need to close the panel).
- Window position is remembered between opens.
- Toolbar tooltip shows the current keyboard shortcut.
- Removed jQuery usage throughout.
- Removed unused `vector_math.js`.
- Fixed duplicate preset color swatches setting registration.
- Fixed dropper preview size setting type (was `String`, now `Number`).

## 2.0.9
- Updating GitHub workflows to properly link a url for the license and readme of the release.

## 2.0.8
- Updating GitHub workflows to fix bug with version field not being set in the module.json file.

## 2.0.7

- Improved fix for panel closing when clicking a button. (#4)
   - Still a workaround, but all original module functionality should be restored now.

## 2.0.6

- Fix for drawing config panel closing when clicking a button while the active game system is pf2e.
   - This is likely a temporary fix, as it doesn't fix the issue of receiving two `focusout` events, but does check if they were emitted with a non-null `sourceCapabilities` to check if an actual hardware item generated the event - i.e., the mouse.