if (typeof window.Handlebars === "undefined") {
    import("handlebars").then((loaded_module_namespace) => window.Handlebars = loaded_module_namespace);
}

export class Color_Selector {

    static _template = null;    
    static _template_path = `modules/boneyard-drawing-tools/templates/color-selector.hbs`;

    static default_options = {
        canvas_width: 100,
        canvas_height: 100,
        color: "#FF0000",
    };

    constructor(options = {}) {
        this.options = {...Color_Selector.default_options, ...options};
        this.down = false;
    }

    render_and_attach_html(parent_element, data = {}) {
        data = {
            canvas_width: this.options.canvas_width,
            canvas_height: this.options.canvas_height,
            ...data,
            hue_height: data.canvas_height + 4,
            red: this.options.color.slice(1,3),
            green: this.options.color.slice(3,5),
            blue: this.options.color.slice(5,7),
        };
        parent_element.innerHTML = Color_Selector._template(data);
        this._element = parent_element.querySelector("#by-color-selector");
        this.canvas = this._element.querySelector("#by-color-picker-canvas");
        this.canvas_context = this.canvas.getContext('2d', { willReadFrequently: true });
        this.update_canvas(this.options.color);
        this.canvas_marker = this._element.querySelector("#by-color-picker-marker");
        this.hue_sidebar = this._element.querySelector("#by-hue-siderbar");
        this.hue_sidebar_context = this.hue_sidebar.getContext('2d', { willReadFrequently: true });
        this.hue_marker = this._element.querySelector("#by-hue-sidebar-marker");
        this.hue_marker_container = this._element.querySelector("#by-hue-siderbar-marker-container");
        this.initialize_hue_sidebar();
        this.move_hue_marker(0);
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

    update_canvas(color) {
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

        this.color_update_listener = color_update_listener;
    }

    move_canvas_marker(x, y) {
        x = Math.min(this.options.canvas_width-1, Math.max(0, x));
        y = Math.min(this.options.canvas_height-1, Math.max(0, y));
        this.canvas_marker.setAttribute('cx', x);
        this.canvas_marker.setAttribute('cy', y);
    }

    move_hue_marker(y) {
        y = Math.min(this.options.canvas_height-1, Math.max(0, y));
        this.hue_marker.setAttribute('y', y);        
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
        this.get_canvas_color();
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
        this.get_hue_color();
    }

    get_hue_color() {
        const y = this.hue_marker.getAttribute('y');
        const pixel = this.hue_sidebar_context.getImageData(0, y, 1, 1)['data'];
        const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
        this.update_default_colors(color);
    }

    get_canvas_color() {
        const x = this.canvas_marker.getAttribute('cx');
        const y = this.canvas_marker.getAttribute('cy');
        const pixel = this.canvas_context.getImageData(x, y, 1, 1)['data'];
        const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
        this.color_update_listener?.(color);
    }

    update_default_colors(color) {
        this.update_canvas(color);
        this.get_canvas_color();
    }

}

fetch(Color_Selector._template_path).then(response => response.text()).then(data => Color_Selector._template = Handlebars.compile(data));