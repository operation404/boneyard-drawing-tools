class Drawing_Tools extends Application {

    static init() {
        Drawing_Tools.prepare_hook_handlers();
        console.log(`====== Boneyard ======\n - Drawing tools initialized`);
    }

    static prepare_hook_handlers() {
        Hooks.on("getSceneControlButtons", (controls) => Drawing_Tools.add_control_buttons(controls));
    }

    static add_control_buttons(controls) {
        const drawing_controls = controls.find(control_set => control_set.name === "drawings");
        drawing_controls.tools.push({
            "name": "set-strokeColor",
            "icon": "fas fa-paint-brush",
            "title": "CONTROLS.DrawingStrokeColor",
            "onClick": () => {
                new Drawing_Tools('stroke').render(true);
            },
            button: true,
        });
        drawing_controls.tools.push({
            "name": "set-fillColor",
            "icon": "fas fa-fill-drip",
            "title": "CONTROLS.DrawingFillColor",
            "onClick": () => {
                new Drawing_Tools('fill').render(true);
            },
            button: true,
        });
    }

    /**
     * The Drawing_Tools Application window.
     * @param {string} [color_type]           Which tool color to modify, 'stroke' or 'fill'
     * @param {ApplicationOptions} [options]  Default Application configuration options.
     */
    constructor(color_type = null, options = {}) {
        super(options);
        switch (color_type) {

            case "stroke":
                this.color_type = `${color_type}Color`;
                this.alpha_type = `${color_type}Alpha`;
                break;

            case "fill":
                this.color_type = `${color_type}Color`;
                this.alpha_type = `${color_type}Alpha`;
                break;

            default:
                console.error(`Improper 'color_type' value: ${color_type}`);
                throw `Improper 'color_type' value: ${color_type}`;
        }

    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/boneyard/templates/color_selector.html`,
            id: 'drawing_tools',
            popOut: false,
        });
    }

    getData() {
        const drawing_defaults = game.settings.get("core", DrawingsLayer.DEFAULT_CONFIG_SETTING);
        if (drawing_defaults === undefined) {
            console.error("Could not load DrawingsLayer Default Config Settings.");
            throw "Could not load DrawingsLayer Default Config Settings.";
        }

        return { // Send data to the html template
            appId: this.appId,
            color: drawing_defaults[this.color_type],
            alpha: drawing_defaults[this.alpha_type],
            is_stroke: this.color_type === 'strokeColor',
            is_fill: this.color_type === 'fillColor',
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

        // the drawing sub-controls should be the active set, so just query that
        const drawing_tool = sub_controls.querySelector(`[data-tool='set-${this.color_type}']`);
        const drawing_tool_rect = drawing_tool.getBoundingClientRect();
        const drawing_tool_y_center = drawing_tool_rect.top + (drawing_tool_rect.height / 2); // not sure if .top or .y is better

        const offset_top = drawing_tool_y_center - (this._element[0].offsetHeight / 2);

        this._element[0].style.left = `${offset_left}px`;
        this._element[0].style.top = `${offset_top}px`;

        const color_text_input = this._element[0].querySelector("#by-color-selector > div #by-color-text");
        color_text_input.setSelectionRange(color_text_input.value.length, color_text_input.value.length);
        color_text_input.focus();
    }

    activateListeners(html) {
        super.activateListeners(html);

        document.querySelector("#by-color-selector > div #by-color-dropper").addEventListener("input", (e) => {
            this.color_dropper_handler(e);
        });
        document.querySelector("#by-color-selector > div #by-color-text").addEventListener("input", (e) => {
            this.color_text_handler(e);
        });
        document.querySelector("#by-color-selector > div #by-alpha").addEventListener("change", (e) => {
            this.alpha_slider_handler(e);
        });

        // These fields aren't guaranteed to exist, only one should be present at a time
        document.querySelector("#by-color-selector > div #by-stroke-width")?.addEventListener("change", (e) => {
            this.stroke_width_handler(e);
        });
        document.querySelector("#by-color-selector > div #by-fill-type")?.addEventListener("change", (e) => {
            this.fill_type_handler(e);
        });

        document.querySelector("#by-color-selector").addEventListener("focusout", (e) => {
            this.close_window_handler(e);
        });
    }

    color_dropper_handler(e) {
        document.querySelector("#by-color-selector > div #by-color-text").value = e.target.value;
        this.update_default_colors(e.target.value);
    }

    static hex_test = /^#[0-9A-F]{6}$/i;

    color_text_handler(e) {
        const update_color = Drawing_Tools.hex_test.test(e.target.value) ? e.target.value : '#000000';
        document.querySelector("#by-color-selector > div #by-color-dropper").value = update_color;
        this.update_default_colors(update_color);
    }

    update_default_colors(color) {
        let new_drawing_defaults = game.settings.get("core", DrawingsLayer.DEFAULT_CONFIG_SETTING);
        if (new_drawing_defaults === undefined) {
            console.error("Could not load DrawingsLayer Default Config Settings.");
            return;
        }
        new_drawing_defaults[this.color_type] = color;
        game.settings.set("core", DrawingsLayer.DEFAULT_CONFIG_SETTING, new_drawing_defaults);
    }

    alpha_slider_handler(e) {
        document.querySelector("#by-color-selector > div div span.range-value").textContent = e.target.value;
        let new_drawing_defaults = game.settings.get("core", DrawingsLayer.DEFAULT_CONFIG_SETTING);
        if (new_drawing_defaults === undefined) {
            console.error("Could not load DrawingsLayer Default Config Settings.");
            return;
        }
        new_drawing_defaults[this.alpha_type] = parseFloat(e.target.value);
        game.settings.set("core", DrawingsLayer.DEFAULT_CONFIG_SETTING, new_drawing_defaults);
    }

    stroke_width_handler(e) {
        const width = !isNaN(e.target.value) ? parseInt(e.target.value) : 0;
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
        // Check if the new focus target is still a part of the drawing tools window
        if (!document.querySelector("#by-color-selector").contains(e.relatedTarget)) {
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

Drawing_Tools.init();