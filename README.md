# Boneyard Collection
- [Boneyard Drawing Tools](https://github.com/operation404/boneyard-drawing-tools)
- [Boneyard Template Tools](https://github.com/operation404/boneyard-template-tools)
- [Boneyard Socketlib Companion](https://github.com/operation404/boneyard-socketlib-companion)

# Boneyard Drawing Tools
- [Quick drawing settings adjuster](#quick-drawing-settings-adjuster)
- [TODO](#todo)

## Quick drawing settings adjuster
A new tool is added to the Drawing Layer control sidebar. This tool will open the Drawing Tools configuration panel. This panel allows you to quickly adjust the color, opacity, stroke width, and fill type of your drawing settings. The panel closes automatically upon losing focus and the new settings are saved upon closing.

The panel is divided into two sections. The left side of the 

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/drawing_tools_panel_example.png?raw=true" width=25%>




-----------------------------------------------------------------------------------------

## Quick drawing settings adjuster
Two new tools are added to the Drawing sidebar. These tools open a popup menu that allows fast adjustment of stroke or fill color, opacity, line width, and fill type. The changes to drawing settings are continuously updated as you make adjustments on the panel, and it can be closed by clicking anywhere off of it.

The first tool controls line settings. The menu for lines contains options for changing stroke color, opacity, and line width.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/stroke_example.png?raw=true" width=25%>

The second tool controls fill settings. The menu for fill contains options for changing fill color, opacity, and fill type.

<img src="https://github.com/operation404/boneyard-drawing-tools/blob/master/images/fill_example.png?raw=true" width=25%>

## TODO
- [ ] Add ability to open the menu by some modified click, such as ctrl-click. Need to find a modifier key that isn't used by drawing tools already.
- [ ] Modify button style so that rather than a brush or paint can icon, the buttons have a box showing the current stroke or fill color.
- [ ] Add +/- buttons for adjusting line width.
- [ ] Add the ability to choose color by using a dropper tool and selecting the color from the canvas.
