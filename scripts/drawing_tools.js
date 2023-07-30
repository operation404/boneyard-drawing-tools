import {
    MODULE, SETTING_SIDEBAR_BUTTONS, LAST_TOOL
} from "./constants.js";

export class Drawing_Tools extends Application {

    static current_tool = 'stroke';

    static init() {
        Drawing_Tools.prepare_hook_handlers();
        console.log(`====== Boneyard ======\n - Drawing tools initialized`);
    }

    static prepare_hook_handlers() {
        if (game.settings.get(MODULE, SETTING_SIDEBAR_BUTTONS)) {
            Hooks.on("getSceneControlButtons", (controls) => Drawing_Tools.add_control_buttons(controls));
        }
    }

    static add_control_buttons(controls) {
        const drawing_controls = controls.find(control_set => control_set.name === "drawings");
        drawing_controls.tools.push({
            "name": "quick-draw-config",
            "icon": "fas fa-paint-brush",
            "title": "CONTROLS.QuickDrawConfig",
            "onClick": () => {
                new Drawing_Tools().render(true); // TODO should this be defaulted to stroke?
            },
            button: true,
        });
    }

    /**
     * The Drawing_Tools_2 Application window.
     * @param {string} [current_tool]         Which tool the menu starts with selected, 'stroke' or 'fill'.
     * @param {ApplicationOptions} [options]  Default Application configuration options.
     */
    constructor(options = {}) {
        super(options);        
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/boneyard-drawing-tools/templates/quick-draw-config.html`,
            id: MODULE,
            popOut: false,
        });
    }

    getData() {
        const drawing_defaults = game.settings.get("core", DrawingsLayer.DEFAULT_CONFIG_SETTING);
        if (drawing_defaults === undefined) {
            console.error("Could not load DrawingsLayer Default Config Settings.");
            throw "Could not load DrawingsLayer Default Config Settings.";
        }

        const current_color = Drawing_Tools.current_tool === "stroke" ? drawing_defaults['strokeColor'] : drawing_defaults['fillColor'];
        return { // Send data to the html template
            appId: this.appId,
            current_tool: Drawing_Tools.current_tool,
            current_tool_tooltip: game.i18n.localize(`CONTROLS.${Drawing_Tools.current_tool}_color`),
            name_bar_color: current_color,
            start_gradient: Drawing_Tools.generate_smooth_gradient_style(current_color),
            stroke_color: drawing_defaults['strokeColor'],
            stroke_alpha: drawing_defaults['strokeAlpha'],
            fill_color: drawing_defaults['fillColor'],
            fill_alpha: drawing_defaults['fillAlpha'],
            stroke_width: drawing_defaults.strokeWidth,
            none_selected: drawing_defaults.fillType === 0 ? 'selected' : '',
            solid_selected: drawing_defaults.fillType === 1 ? 'selected' : '',
            pattern_selected: drawing_defaults.fillType === 2 ? 'selected' : '',
        };
    }

    _injectHTML(html) {
        $('body').append(html);
        this._element = html;
    }

    async _render(force = false, options = {}) {
        await super._render(force, options);

        // ---- Set the proper coordinates for the window ----

        const controls_container = document.querySelector('#ui-left > #controls');
        const controls_container_style = window.getComputedStyle(controls_container);
        const sub_controls = document.querySelector('#controls > ol.sub-controls.app.control-tools.flexcol.active');
        const control = sub_controls.firstElementChild;
        const control_style = window.getComputedStyle(control);

        // offsetHeight includes padding+border but not margin
        const control_height = control.offsetHeight + parseFloat(control_style.marginTop) + parseFloat(control_style.marginBottom);
        const control_width = control.offsetWidth + parseFloat(control_style.marginLeft) + parseFloat(control_style.marginRight);
        const max_controls_per_col = Math.floor(sub_controls.offsetHeight / control_height);

        // There's always 1 main control column + potentially multiple sub-control columns
        const columns = 1 + Math.ceil(sub_controls.childElementCount / max_controls_per_col);

        const offset_left = (columns * control_width) + parseFloat(controls_container_style.paddingLeft);

        // The drawing sub-controls should be the active set, so just query that
        const drawing_tool = sub_controls.querySelector(`[data-tool='quick-draw-config']`);
        const drawing_tool_rect = drawing_tool.getBoundingClientRect();
        const drawing_tool_y_center = drawing_tool_rect.top + (drawing_tool_rect.height / 2); // not sure if .top or .y is better

        const offset_top = drawing_tool_y_center - (this._element[0].offsetHeight / 2);

        this._element[0].style.left = `${offset_left}px`;
        this._element[0].style.top = `${offset_top}px`;

        // Focus last edited tool color
        const color_text_input = this._element[0].querySelector(`#by-quick-draw-config #by-${Drawing_Tools.current_tool}-color-text`);
        color_text_input.setSelectionRange(color_text_input.value.length, color_text_input.value.length);
        color_text_input.focus();
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Color toggle buttons
        document.querySelector("#by-quick-draw-config #by-stroke-color")
            .addEventListener("click", (e) => {this.color_button_handler(e);});
        document.querySelector("#by-quick-draw-config #by-fill-color")
            .addEventListener("click", (e) => {this.color_button_handler(e);});
        
        // Hex color input boxes
        document.querySelector("#by-quick-draw-config #by-stroke-color-text")
            .addEventListener("input", (e) => {this.color_text_handler(e);});
        document.querySelector("#by-quick-draw-config #by-fill-color-text")
            .addEventListener("input", (e) => {this.color_text_handler(e);});

        // Alpha slider inputs
        document.querySelector("#by-quick-draw-config #by-stroke-alpha")
            .addEventListener("input", (e) => {this.alpha_slider_handler(e);});
        document.querySelector("#by-quick-draw-config #by-fill-alpha")
            .addEventListener("input", (e) => {this.alpha_slider_handler(e);});

        // Stroke width input
        document.querySelector("#by-quick-draw-config #by-stroke-width")
            .addEventListener("change", (e) => {this.stroke_width_handler(e);});
        document.querySelector("#by-quick-draw-config #by-stroke-width-minus")
            .addEventListener("click", (e) => {this.stroke_width_companion_button_handler(e);});
        document.querySelector("#by-quick-draw-config #by-stroke-width-plus")
            .addEventListener("click", (e) => {this.stroke_width_companion_button_handler(e);});

        // Fill type input
        document.querySelector("#by-quick-draw-config #by-fill-type")
            .addEventListener("change", (e) => {this.fill_type_handler(e);});

        document.querySelector("#by-quick-draw-config").addEventListener("focusout", (e) => {
            this.close_window_handler(e);
        });
    }

    color_button_handler(e) {
        const tool = e.target.dataset.tool;
        Drawing_Tools.current_tool = tool;
        document.querySelector("#by-quick-draw-config #by-selected-tool").textContent = game.i18n.localize(`CONTROLS.${tool}_color`);
        const drawing_defaults = game.settings.get("core", DrawingsLayer.DEFAULT_CONFIG_SETTING);
        this.update_html_colors(drawing_defaults[`${tool}Color`], tool, "button");
    }

    update_html_colors(color, tool, caller) {
        // Button color and text input for tool always updates
        if (caller !== "button") {
            document.querySelector(`#by-quick-draw-config #by-${tool}-color`).style.setProperty("background", color);
        }
        if (caller !== "button" && caller !=="text") {
            document.querySelector(`#by-quick-draw-config #by-${tool}-color-text`).value = color;
        }        

        // Only update color selector if updated color is for the currently selected tool
        if (tool === Drawing_Tools.current_tool) {

            document.querySelector("#by-quick-draw-config #by-tool-name-bar").style.setProperty("background", color);
            document.querySelector("#by-quick-draw-config #by-color-selector-background").style
                .setProperty("background-image", Drawing_Tools.generate_smooth_gradient_style(color));

            if (caller !== "selector") {
                // TODO Update color selector here when I finally implement it
            }
        }
    }

    static generate_smooth_gradient_style(color, num_stops = 5) {
        let color_stops = "";
        for (let i = 0; i < num_stops; i++) {
            let alpha = Math.sin((i / num_stops)*(Math.PI / 2) + Math.PI) + 1; // value between 1 and 0, sin curve
            alpha = Math.min(Math.max(Math.floor(alpha * 255), 0), 255); // convert to fraction of 255 and clamp
            let color_with_alpha = color + alpha.toString(16).padStart(2, '0');
            color_stops += color_with_alpha;
            if (i+1 < num_stops) color_stops += ", ";
        }
        return `linear-gradient(180deg, ${color_stops}, transparent 30%)`;
    }

    static hex_test = /^#[0-9A-F]{6}$/i;
    color_text_handler(e) {
        const tool = e.target.dataset.tool;
        const update_color = Drawing_Tools.hex_test.test(e.target.value) ? e.target.value : '#000000';
        this.update_html_colors(update_color, tool, "text");
        this.update_default_colors(tool, update_color);
    }

    update_default_colors(tool, color) {
        let new_drawing_defaults = game.settings.get("core", DrawingsLayer.DEFAULT_CONFIG_SETTING);
        if (new_drawing_defaults === undefined) {
            console.error("Could not load DrawingsLayer Default Config Settings.");
            return;
        }
        new_drawing_defaults[`${tool}Color`] = color;
        game.settings.set("core", DrawingsLayer.DEFAULT_CONFIG_SETTING, new_drawing_defaults);
    }

    alpha_slider_handler(e) {
        const tool = e.target.dataset.tool;
        document.querySelector(`#by-quick-draw-config #by-${tool}-alpha-label`).textContent = e.target.value;
        let new_drawing_defaults = game.settings.get("core", DrawingsLayer.DEFAULT_CONFIG_SETTING);
        if (new_drawing_defaults === undefined) {
            console.error("Could not load DrawingsLayer Default Config Settings.");
            return;
        }
        new_drawing_defaults[`${tool}Alpha`] = parseFloat(e.target.value);
        game.settings.set("core", DrawingsLayer.DEFAULT_CONFIG_SETTING, new_drawing_defaults);
    }

    stroke_width_handler(e) {
        const width = !isNaN(e.target.value) ? parseInt(e.target.value) : 12; // Foundry default is 12?
        this.update_stroke_width(width);
    }

    stroke_width_companion_button_handler(e) {
        const action = e.target.textContent;
        const shift_pressed = e.shiftKey;
        const width_input_element = document.querySelector(`#by-quick-draw-config #by-stroke-width`);
        let width = parseInt(width_input_element.value);
        const width_delta = (action === "-" ? -1 : +1) * (shift_pressed ? 5 : 1);
        width += width_delta;
        width_input_element.value = width;
        this.update_stroke_width(width);
    }

    update_stroke_width(width) {
        let new_drawing_defaults = game.settings.get("core", DrawingsLayer.DEFAULT_CONFIG_SETTING);
        if (new_drawing_defaults === undefined) {
            console.error("Could not load DrawingsLayer Default Config Settings.");
            return;
        }
        new_drawing_defaults['strokeWidth'] = width;
        game.settings.set("core", DrawingsLayer.DEFAULT_CONFIG_SETTING, new_drawing_defaults);
    }

    fill_type_handler(e) {
        let new_drawing_defaults = game.settings.get("core", DrawingsLayer.DEFAULT_CONFIG_SETTING);
        if (new_drawing_defaults === undefined) {
            console.error("Could not load DrawingsLayer Default Config Settings.");
            return;
        }
        new_drawing_defaults['fillType'] = parseInt(e.target.value);
        game.settings.set("core", DrawingsLayer.DEFAULT_CONFIG_SETTING, new_drawing_defaults);
    }

    close_window_handler(e) {
        // outermost div has tabindex="0" which allows the whole panel to be focused when clicked
        // so we only close the window if the user has clicked off the panel

        // Check if the new focus target is still a part of the drawing tools window
        if (!document.querySelector("#by-quick-draw-config").contains(e.relatedTarget)) {
            this.close();
        }
    }

    // Overriden to remove the jQuery slideUp animation
    async close(options = {}) {
        const states = Application.RENDER_STATES;
        if (!options.force && ![states.RENDERED, states.ERROR].includes(this._state)) return;
        this._state = states.CLOSING;

        // Get the element
        let el = this.element;
        if (!el) return this._state = states.CLOSED;
        el.css({
            minHeight: 0
        });

        // Dispatch Hooks for closing the base and subclass applications
        for (let cls of this.constructor._getInheritanceChain()) {
            Hooks.call(`close${cls.name}`, this, el);
        }

        return new Promise(resolve => {
            el.remove();
            // Clean up data
            this._element = null;
            delete ui.windows[this.appId];
            this._minimized = false;
            this._scrollPositions = null;
            this._state = states.CLOSED;
            resolve();
        });
    }

}
