import { Vector_Math } from "./vector_math.js";
if (typeof window.Handlebars === "undefined") {
    import("handlebars").then((loaded_module_namespace) => window.Handlebars = loaded_module_namespace);
}

export class Color_Selector {

    static _template = null;    
    static _template_path = `modules/boneyard-drawing-tools/templates/color-selector.hbs`;

    static default_options = {
        canvas_width: 150,
        canvas_height: 150,
        color: "#FF0000",
        dropper_preview_size: 50,
        dropper_read_size: 5,
    };

    static partial_hex_test = /^[0-9A-F]{1,2}$/i;
    
    static color_str_to_vec(color) {
        return [parseInt(color.slice(1,3), 16), parseInt(color.slice(3,5), 16), parseInt(color.slice(5,7), 16)];
    }

    static color_vec_to_str(color) {
        return `#${color[0].toString(16).padStart(2,'0')}${color[1].toString(16).padStart(2,'0')}${color[2].toString(16).padStart(2,'0')}`;
    }

    // returns a 3-vec with values ranging from 0 to 1
    static rbg_vec_to_hsv(rgb_vec) {
        const red   = rgb_vec[0] / 255;
        const green = rgb_vec[1] / 255;
        const blue  = rgb_vec[2] / 255;
        const cmax = Math.max(red, green, blue);
        const cmin = Math.min(red, green, blue);
        const chroma = cmax - cmin; // If delta = 0, color is grayscale

        const value = cmax;
        let hue = 0;
        let saturation = 0;

        if (chroma !== 0) {
            if (cmax === red)   hue = (green - blue) / chroma % 6;
            if (cmax === green) hue = (blue - red)   / chroma + 2;
            if (cmax === blue)  hue = (red - green)  / chroma + 4;
            saturation = chroma / cmax; // cmax can't be 0 if delta isn't 0
        }
        hue /= 6;
        if (hue < 0) hue += 1;

        return [hue, saturation, value];
    }

    // returns a 3-vec with values ranging from 0 to 255
    static hsv_vec_to_rgb(hsv_vec) {
        const h = hsv_vec[0] * 6;
        let chroma = hsv_vec[1] * hsv_vec[2];
        let x = chroma * (1 - Math.abs(h % 2 - 1));
        const m = hsv_vec[2] - chroma;
        chroma = (chroma + m);
        x = (x + m);

        const index = Math.floor(h) % 6;
        const red =   [chroma, x, m, m, x, chroma][index];
        const green = [x, chroma, chroma, x, m, m][index];
        const blue =  [m, m, x, chroma, chroma, x][index];

        return [
            Math.round(red * 255),
            Math.round(green * 255),
            Math.round(blue * 255)
        ];

    }

    constructor(options = {}) {
        this.options = {...Color_Selector.default_options, ...options};
        this.down = false;
    }

    render_and_attach_html(parent_element, data = {}) {
        data = {
            canvas_width: this.options.canvas_width,
            canvas_height: this.options.canvas_height,
            ...data,
            hue_height: this.options.canvas_height + 4,
            red: this.options.color.slice(1,3),
            green: this.options.color.slice(3,5),
            blue: this.options.color.slice(5,7),
        };
        parent_element.innerHTML = Color_Selector._template(data);
        this._element = parent_element.querySelector("#by-color-selector");
        this.canvas = this._element.querySelector("#by-color-picker-canvas");
        this.canvas_context = this.canvas.getContext('2d', { willReadFrequently: true });
        this.canvas_marker = this._element.querySelector("#by-color-picker-marker");
        this.canvas_marker_outline = this._element.querySelector("#by-color-picker-marker-outline");
        this.hue_sidebar = this._element.querySelector("#by-hue-siderbar");
        this.hue_sidebar_context = this.hue_sidebar.getContext('2d', { willReadFrequently: true });
        this.hue_marker = this._element.querySelector("#by-hue-sidebar-marker");
        this.hue_marker_container = this._element.querySelector("#by-hue-siderbar-marker-container");
        this.initialize_hue_sidebar();
        this.red_input = this._element.querySelector("#by-red-text");
        this.green_input = this._element.querySelector("#by-green-text");
        this.blue_input = this._element.querySelector("#by-blue-text");
        this.change_canvas_gradients(this.options.color);
        this.update_canvas(this.options.color);        
        this.dropper_button = this._element.querySelector("#by-dropper-button");
        this.random_button = this._element.querySelector("#by-random-button");
        this.initialize_dropper();
    }

    initialize_hue_sidebar() {
        const vertical_gradient = this.hue_sidebar_context.createLinearGradient(0, 0, 0, this.hue_sidebar_context.canvas.height);
        vertical_gradient.addColorStop(0/6, '#f00');
        vertical_gradient.addColorStop(1/6, '#ff0');
        vertical_gradient.addColorStop(2/6, '#0f0');
        vertical_gradient.addColorStop(3/6, '#0ff');
        vertical_gradient.addColorStop(4/6, '#00f');
        vertical_gradient.addColorStop(5/6, '#f0f');
        vertical_gradient.addColorStop(6/6, '#f00');
        this.hue_sidebar_context.fillStyle = vertical_gradient;
        this.hue_sidebar_context.fillRect(0, 0, this.hue_sidebar_context.canvas.width, this.hue_sidebar_context.canvas.height);
    }

    change_canvas_gradients(color) {
        if (this._element === undefined) {
            console.error("No Color_Selector HTML element rendered.");
            throw "No Color_Selector HTML element rendered.";
        }
        // horizontal white to passed color
        const horizontal_gradient = this.canvas_context.createLinearGradient(0, 0, this.canvas_context.canvas.width, 0);
        horizontal_gradient.addColorStop(0, '#fff');
        horizontal_gradient.addColorStop(1, color);
        this.canvas_context.fillStyle = horizontal_gradient;
        this.canvas_context.fillRect(0, 0, this.canvas_context.canvas.width, this.canvas_context.canvas.height);

        // vertical transparent to black
        const vertical_gradient = this.canvas_context.createLinearGradient(0, 0, 0, this.canvas_context.canvas.height);
        vertical_gradient.addColorStop(0, 'rgba(0,0,0,0)');
        vertical_gradient.addColorStop(1, '#000');
        this.canvas_context.fillStyle = vertical_gradient;
        this.canvas_context.fillRect(0, 0, this.canvas_context.canvas.width, this.canvas_context.canvas.height);
    }

    activate_listeners(html, color_update_listener) {
        const color_selector_element = html[0];
        
        // Canvas has no proper drag event, so have to do mouseup, mousedown, and mousemove
        // Also need a click listener as mousemove doesn't handle single clicks
        this.canvas_mousemove_wrapper = this.canvas_mousemove_handler.bind(this);
        color_selector_element.querySelector("#by-color-picker-canvas").addEventListener('mousedown', (e) => this.canvas_mousedown_handler(e));
        color_selector_element.querySelector("#by-color-picker-canvas").addEventListener('click', (e) => this.canvas_click_handler(e));

        this.hue_mousemove_wrapper = this.hue_mousemove_handler.bind(this);
        color_selector_element.querySelector("#by-hue-siderbar-marker-container").addEventListener('mousedown', (e) => this.hue_mousedown_handler(e));
        color_selector_element.querySelector("#by-hue-siderbar-marker-container").addEventListener('click', (e) => this.hue_click_handler(e));

        document.addEventListener('mouseup', (e) => this.mouseup_handler(e));

        this.red_input.addEventListener("input", (e) => this.rgb_input_handler(e));
        this.green_input.addEventListener("input", (e) => this.rgb_input_handler(e));
        this.blue_input.addEventListener("input", (e) => this.rgb_input_handler(e));
    
        this.dropper_button.addEventListener("click", (e) => this.dropper_button_handler(e));
        this.random_button.addEventListener("click", (e) => this.random_button_handler(e));

        this.color_update_listener = color_update_listener;
    }

    initialize_dropper() {
        this.offset = Math.floor(this.options.dropper_read_size / 2);
        let pixel_id_list = [...Array(this.options.dropper_read_size * this.options.dropper_read_size).keys()];
        const ls = [];
        for (let i = 0; i < this.options.dropper_read_size; i++) ls.push(pixel_id_list.slice(i*this.options.dropper_read_size, (i+1)*this.options.dropper_read_size));
        this.pixel_ids = ls.reverse().flat();
        this.pixels = new Uint8Array(this.options.dropper_read_size * this.options.dropper_read_size * 4);
        this.dropper_preview_template = `
            <div class="by-circle" id="by-dropper-preview" style="width: {{width}}; height: {{height}}; grid-template-columns: repeat({{p_count}}, 1fr);">
                {{#each p_ids}}
                    <div id="by-pixel-{{this}}" style="background-color: #000000;"></div>
                {{/each}}
            </div>
        `;       
        this.move_dropper = (x, y) => {
            x = (x -= this.options.dropper_preview_size) < 0 ? 0 : x;
            y = (y -= this.options.dropper_preview_size) < 0 ? 0 : y;
            this.dropper.style.left = `${x}px`;
            this.dropper.style.top = `${y}px`;
        }
        this.gl = document.querySelector("canvas#board").getContext("webgl2"); // only context foundry canvas supports from what I can tell
        this.dropper = null;
    }

    dropper_button_handler(e) {
        const element_template = document.createElement('template');
        element_template.innerHTML = (Handlebars.compile(this.dropper_preview_template))({
            p_ids: this.pixel_ids,
            width: `${this.options.dropper_preview_size}px`,
            height: `${this.options.dropper_preview_size}px`,
            p_count: this.options.dropper_read_size
        }).trim();
        this.dropper = element_template.content.firstChild;
        document.body.appendChild(this.dropper);
        this.move_dropper(e.clientX, e.clientY);

        // Add click listener to document, check if target is canvas
        const document_pointerdown_handler = (e) => {  
            if (e.target.id === 'board' && e.target.nodeName === 'CANVAS') {
                window.requestAnimationFrame(() => {
                    this.gl.readPixels(
                        e.clientX * window.devicePixelRatio,
                        this.gl.drawingBufferHeight - (e.clientY * window.devicePixelRatio) - 1,
                        1,
                        1,
                        this.gl.RGBA,
                        this.gl.UNSIGNED_BYTE,
                        this.pixels,
                    );
                    this.update_html_colors(Color_Selector.color_vec_to_str([...this.pixels.slice(0,3)]), "dropper");
                });
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            exit_dropper_mode();
        }

        // Add mousemove listener too, preview color as mouse moves
        const document_mousemove_handler = (e) => {
            this.move_dropper(e.clientX, e.clientY);
            if (e.target.id === 'board' && e.target.nodeName === 'CANVAS') {
                window.requestAnimationFrame(() => {
                    this.gl.readPixels(
                        e.clientX * window.devicePixelRatio - this.offset,
                        this.gl.drawingBufferHeight - (e.clientY * window.devicePixelRatio - this.offset) - 1,
                        this.options.dropper_read_size,
                        this.options.dropper_read_size,
                        this.gl.RGBA,
                        this.gl.UNSIGNED_BYTE,
                        this.pixels,
                    );
                    this.pixel_ids.forEach(p => this.dropper.querySelector(`#by-pixel-${p}`).style['background-color'] = Color_Selector.color_vec_to_str(this.pixels.slice(p*4, p*4+3)));
                });                
            }
            e.stopImmediatePropagation();
        }

        // Add key press listener, pressing any key cancels dropper mode
        const document_keydown_handler = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            exit_dropper_mode();
        }

        // remove all listeners at the end after a click or key press happens
        const exit_dropper_mode = () => {
            document.removeEventListener("pointerdown", document_pointerdown_handler, {capture: true});
            document.removeEventListener("mousemove", document_mousemove_handler, {capture: true});
            document.removeEventListener("keydown", document_keydown_handler, {capture: true});
            this.dropper.remove();
            this.dropper = null;
        }

        e.stopImmediatePropagation();
        document.addEventListener("pointerdown", document_pointerdown_handler, {capture: true});
        document.addEventListener("mousemove", document_mousemove_handler, {capture: true});
        document.addEventListener("keydown", document_keydown_handler, {capture: true});
    }
    
    random_button_handler(e) {
        const v = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
        const s = Color_Selector.color_vec_to_str(v);
        this.update_html_colors(s, "random");
    }

    rgb_input_handler(e) {
        const red = Color_Selector.partial_hex_test.test(this.red_input.value) ? this.red_input.value.padStart(2,'0') : "00";
        const green = Color_Selector.partial_hex_test.test(this.green_input.value) ? this.green_input.value.padStart(2,'0') : "00";
        const blue = Color_Selector.partial_hex_test.test(this.blue_input.value) ? this.blue_input.value.padStart(2,'0') : "00";
        this.update_html_colors(`#${red}${green}${blue}`, "rgb");
    }

    canvas_mousedown_handler(e) {
        this.down = true;
        document.addEventListener('mousemove', this.canvas_mousemove_wrapper);
    }

    mouseup_handler(e) {
        this.down = false;
        document.removeEventListener('mousemove', this.canvas_mousemove_wrapper);
        document.removeEventListener('mousemove', this.hue_mousemove_wrapper);
    }

    canvas_mousemove_handler(e) {
        if (!this.down) return;
        this.canvas_click_handler(e);
    }

    canvas_click_handler(e) {
        const { x: canvas_x, y: canvas_y } = this.canvas.getBoundingClientRect();
        this.move_canvas_marker(e.clientX - Math.floor(canvas_x), e.clientY - Math.floor(canvas_y));
        this.update_html_colors(this.get_canvas_color(), "canvas");
    }

    hue_mousedown_handler(e) {
        this.down = true;
        document.addEventListener('mousemove', this.hue_mousemove_wrapper);
    }

    hue_mousemove_handler(e) {
        if (!this.down) return;
        this.hue_click_handler(e);
    }

    hue_click_handler(e) {
        const container_y = this.hue_marker_container.getBoundingClientRect().y;
        this.move_hue_marker(e.clientY - Math.floor(container_y));
        this.change_canvas_gradients(Color_Selector.color_vec_to_str(Color_Selector.hsv_vec_to_rgb([this.get_hue(), 1, 1])));
        this.update_html_colors(this.get_canvas_color(), "canvas");
    }

    move_canvas_marker(x, y) {
        x = Math.min(this.options.canvas_width, Math.max(0, x));
        y = Math.min(this.options.canvas_height, Math.max(0, y));
        this.canvas_marker.setAttribute('cx', x);
        this.canvas_marker.setAttribute('cy', y);
        this.canvas_marker_outline.setAttribute('cx', x);
        this.canvas_marker_outline.setAttribute('cy', y);
    }

    move_hue_marker(y) {
        y = Math.min(this.options.canvas_height, Math.max(0, y));
        this.hue_marker.setAttribute('y', y);        
    }

    get_hue() {
        return this.hue_marker.getAttribute('y') / this.options.canvas_height;
    }

    get_canvas_color() {
        const hue = this.get_hue();
        const saturation = this.canvas_marker.getAttribute('cx') / this.options.canvas_width;
        const value = 1 - this.canvas_marker.getAttribute('cy') / this.options.canvas_height;        
        return Color_Selector.color_vec_to_str(Color_Selector.hsv_vec_to_rgb([hue, saturation, value]));
    }
    
    update_html_colors(color, caller) {
        // caller can be "canvas", "rgb", "external", "dropper", "random"
        if (caller !== "canvas") this.update_canvas(color);
        if (caller !== "rgb") this.update_rgb_fields(color);
        if (caller !== "external") this.color_update_listener?.(color);
    }

    update_rgb_fields(color) {
        this.red_input.value = color.slice(1,3);
        this.green_input.value = color.slice(3,5);
        this.blue_input.value = color.slice(5,7);
    }

    update_canvas(color) {
        const hsv = Color_Selector.rbg_vec_to_hsv(Color_Selector.color_str_to_vec(color));
        this.move_hue_marker(Math.floor(this.options.canvas_height * hsv[0]));
        this.move_canvas_marker(Math.round(this.options.canvas_width * hsv[1]), Math.round(this.options.canvas_height * (1 - hsv[2])));
        this.change_canvas_gradients(Color_Selector.color_vec_to_str(Color_Selector.hsv_vec_to_rgb([hsv[0], 1, 1])));
    }

}

fetch(Color_Selector._template_path).then(response => response.text()).then(data => Color_Selector._template = Handlebars.compile(data));