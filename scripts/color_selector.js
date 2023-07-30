if (typeof window.Handlebars === "undefined") {
    import("handlebars").then((loaded_module_namespace) => {
        window.Handlebars = loaded_module_namespace;
    });
}

export class Color_Selector {

    static _template = null;    
    static _template_path = `modules/boneyard-drawing-tools/templates/color-selector.hbs`;

    static default_options = {
        color: "#FF0000",
        canvas_width: 100,
        canvas_height: 100,
    };

    constructor(options = {}) {
        this.options = {...Color_Selector.default_options, ...options};
    }

    render_and_attach_html(parent_element, data = {}) {
        data = {
            canvas_width: this.options.canvas_width,
            canvas_height: this.options.canvas_height,
        };
        parent_element.innerHTML = Color_Selector._template(data);
        this._element = parent_element.querySelector("#by-color-selector");
        this.canvas = this._element.querySelector("#by-color-picker-canvas");
        this.canvas_context = this.canvas.getContext('2d');
        this.update_canvas(this.options.color);
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
        this.canvas_context.fillRect(0,0, this.canvas_context.canvas.width, this.canvas_context.canvas.height);

        // vertical transparent to black
        const vertical_gradient = this.canvas_context.createLinearGradient(0, 0, 0, this.canvas_context.canvas.height);
        vertical_gradient.addColorStop(0, 'rgba(0,0,0,0');
        vertical_gradient.addColorStop(1, '#000');
        this.canvas_context.fillStyle = vertical_gradient;
        this.canvas_context.fillRect(0,0, this.canvas_context.canvas.width, this.canvas_context.canvas.height);
    }

    activate_listeners(html) {

    }

}

fetch(Color_Selector._template_path).then(response => response.text()).then(data => Color_Selector._template = Handlebars.compile(data));