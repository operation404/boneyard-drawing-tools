See my other modules in the [Boneyard Collection](https://github.com/operation404/boneyard-collection).

# Boneyard Drawing Tools

A Foundry VTT module that provides quick-access tools for adjusting drawing properties and colors.

**Compatibility:** Foundry VTT v13

- [Quick Drawing Settings](#quick-drawing-settings)
- [Stroke and Fill Settings](#stroke-and-fill-settings)
- [Color Selector](#color-selector)
- [Keyboard Shortcut](#keyboard-shortcut)
- [Settings](#settings)

## Quick Drawing Settings

A new tool button is added to the Drawing Layer control sidebar. Clicking it opens the Quick Draw Config window, which lets you adjust color, opacity, stroke width, and fill type for your drawings. Changes are applied in real-time as you make them, so you can keep the window open while drawing.

The window is a standard Foundry application window — draggable, with a close button in the title bar. It remembers its position between opens.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/drawing_tools_panel_example.png?raw=true" width=40%>

## Stroke and Fill Settings

The left side of the panel has Stroke and Fill configuration:

- **Color input** — 6-digit hex format (`#RRGGBB`). Invalid input is treated as black.
- **Opacity slider** — ranges from 0 to 1 with 0.1 step size.
- **Stroke width** — enter a number directly or use the +/- buttons (shift-click for +/- 5). Minimum 0.
- **Fill type** — None, Solid, or Pattern. Pattern paths must still be set through Foundry's default drawing configuration.

The color buttons at the top of each section toggle which tool (Stroke or Fill) the color selector modifies. The last edited tool is remembered across opens.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/stroke_fill_button_example.png?raw=true" width=40%>

## Color Selector

The right side of the panel provides a visual color picker:

- **Color canvas** — click and drag to pick colors by saturation and value.
- **Hue slider** — vertical slider on the right adjusts the hue.
- **RGB inputs** — individual 2-digit hex fields for fine-tuning red, green, and blue components.
- **Dropper tool** — sample a color directly from the game canvas. A preview grid follows your cursor showing the pixels around it. Left-click to grab a color, any other key or mouse button cancels.
- **Random button** — generates a random color.
- **Color swatches** — preset colors (configurable) and a recent color history.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/dropper_preview_example.png?raw=true" width=60%>

## Keyboard Shortcut

The Quick Draw Config window can be toggled with a keyboard shortcut. The default is **Ctrl+D**. The shortcut can be customized through Foundry's built-in **Configure Controls** menu (Game Settings > Configure Controls).

The current shortcut is displayed in the toolbar button tooltip.

## Settings

Module settings are found under **Game Settings > Module Settings**:

- **Color Selector Size** — size of the color picker canvas in pixels (minimum 100).
- **Dropper Preview Size** — size of the dropper preview window in pixels (minimum 20).
- **Dropper Read Radius** — how many pixels around the cursor are shown in the dropper preview.
- **Preset Color Swatches** — comma-separated hex color codes (`#RRGGBB` format). Displayed as clickable swatches below the color selector.
- **Recent Color History** — how many recently used colors to track and display as swatches.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/settings.png?raw=true" width=50%>
