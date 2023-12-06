See my other modules in the [Boneyard Collection](https://github.com/operation404/boneyard-collection).

# Boneyard Drawing Tools

- [Quick drawing settings adjuster](#quick-drawing-settings-adjuster)
- [Stroke and Fill settings](#stroke-and-fill-settings)
- [Color selector](#color-selector)
- [Shortcut](#shortcut)
- [Settings](#settings)
- [Dropper mode additional notes](#dropper-mode-additional-notes)
- [Known Issues](#known-issues)
- [TODO](#todo)

## Quick drawing settings adjuster

A new tool is added to the Drawing Layer control sidebar. This tool will open the Drawing Tools configuration panel. This panel allows you to quickly adjust the color, opacity, stroke width, and fill type of your drawing settings. The panel closes automatically upon losing focus and the new settings are saved upon closing.

The Drawing Tools panel is divided into two sections. The left side of the panel has the Stroke and Fill configuration options. Each has a field for inputting a color as a hex string, a slider to change opacity, and options for changing stroke width and fill type. The right side of the panel provides a color selector for more fine tuned control over color selection.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/drawing_tools_panel_example.png?raw=true" width=40%>

## Stroke and Fill settings

The input fields for colors must be in 6-digit hexadecimal formats. If the input text does not match that exact pattern, the panel will treat it as black.

The alpha sliders range between 0 and 1 with a 0.1 step size, the same as Foundry's standard slider for drawing opacity.

For the stroke width input, a number can be manually entered or the +/- minus buttons can be used. The buttons add or subtract 1 normally and 5 when shift-clicked. The input number cannot be less than 0 and if a negative manual input is given, it will be treated as 0.

Though fill type can be set to pattern from the panel, the path to the pattern must still be chosen from within Foundry's normal menu for editing drawing settings.

The buttons at the top of the Stroke and Fill sections toggle which tool the color selector portion of the panel will modify.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/stroke_fill_button_example.png?raw=true" width=40%>

The Drawing Tools panel will remember the last edited tool, and will set that as the active tool for the color selector when the panel is opened again.

## Color selector

The color selector canvas gives a visual interface for picking colors. You can click and drag along the canvas to preview colors in real time and the hue slider on the right adjusts the canvas color gradient.

Below the color selector canvas are input fields for the individual RGB components of the currently selected color, show as 2 digit hexadecimal numbers. These can be manually edited to adjust the color.

The dropper button allows you to select a color from the game canvas directly. When in dropper mode, a small preview window will follow the cursor around and show a zoomed in view of the pixels the user is currently hovering over. Clicking on the canvas will grab the color from the selected pixel.

The random button will generate a new rolor by randomly selecting 3 values between 0 and 255 for the red, green, and blue color components.

The color swatches provide a quickly accessible list of preset colors. The first set of color swatches are manually configured and are always the same. The second set of swatches is the color history, which track your recently used colors in case you wish to reuse one.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/dropper_preview_example.png?raw=true" width=60%>

When the drawing panel is first opened the dropper button is focused automatically, allowing you to instantly enter dropper mode by pressing the space or enter key.

While in dropper mode the preview window will update as you move your cursor. However, the preview can only fetch pixel data from the canvas while it's currently hovered, so the preview window won't update when the cursor is over UI elements. Left clicking while hovering the canvas will grab the color from the currently hovered pixel and exit dropper mode. Any other mouse or keyboard press will exit dropper mode without grabbing a color. The mouse or keyboard press used to exit dropper mode won't interact with canvas elements.

## Shortcut

While the Drawing Layer is currently active, the Drawing Tools panel can be opened with a keyboard shortcut. When opened in this way, the panel will appear slightly below the current cursor location. The default shortcut is 'Ctrl + D', but can be changed. If the shortcut used happens to also be bound to other actions, those should be blocked while the Drawing Layer is currently active, though it's possible some browser-level actions may still take precendent.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/shortcut_example.png?raw=true" width=50%>

## Settings

The shortcut can be disabled if you wish to only access the Drawing Tools panel from the Drawing Layer control sidebar. You are also able to change the shortcut.

The color selector and dropper preview size adjust how large or small the respective elements are and are measured in pixels. The color selector has a minimum size of 100 and the dropper preview a minimum size of 20.

The dropper read radius controls how many pixels around the cursor are show in the dropper preview. A larger number shows more pixels in the preview window.

The preset color swatches is a string of comma separated hex color codes. These colors must be in the format '#XXXXXX' and you can add as many as desired. There are up to 10 color swatches in a row, and as many rows as needed to fit the given swatches.

The recent color history sets how many colors the Drawing Tools app will record to list as swatches. These swatches are displayed in the same fashion as the preset swatches.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/settings.png?raw=true" width=50%>

## Dropper mode additional notes

While functional, the dropper does have a few quirks.

First, if your monitor has UI scaling the dropper preview window may be slightly off from what pixel is actually hovered by the cursor. While the mouse click event does give precise coordinates for the clicked location, the mouse hover event coordinates are rounded according to the UI scaling value. This means that with UI scaling, the dropper preview window may be a pixel off of what is actually the currently hovered pixel.

Second, the dropper preview or grabbed color may rarely be black even if the currently hovered area of the canvas is not. This is because the dropper must fetch the pixel data from the canvas drawing buffer as it is being drawn, as the buffer is black outside of an draw event. Foundry uses PIXI for handling the rendering of the canvas, and the drawing event isn't publicly exposed. Rather than try to find a way to hook into the drawing event directly, the dropper instead uses the native requestAnimationFrame call which is normally used to adjust animations before the next canvas repaint. While this works the vast majority of the time, there are occasions where the dropper will fail to grab pixel data before the repaint finishes, hence why you may sometimes see the dropper preview turn black for a frame. This should be a rare occurence however, and the dropper can simply be used again in the unlucky situation where it happened to grab a color after a repaint already finished.

## Known Issues

## TODO

- [x] ~~Add ability to open the menu by some modified click, such as ctrl-click. Need to find a modifier key that isn't used by drawing tools already.~~
- [x] ~~Add +/- buttons for adjusting line width.~~
- [x] ~~Add the ability to choose color by using a dropper tool and selecting the color from the canvas.~~
- [x] ~~Add selectable color swatches with preset colors and a used color history.~~
- [ ] Modify siderbar button style so that rather than a gray brush icon, the button shows the current stroke/fill color.

