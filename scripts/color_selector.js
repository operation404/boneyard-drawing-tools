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
            hue_height: this.options.canvas_height + 4,
            red: this.options.color.slice(1,3),
            green: this.options.color.slice(3,5),
            blue: this.options.color.slice(5,7),
        };
        parent_element.innerHTML = Color_Selector._template(data);
        this._element = parent_element.querySelector("#by-color-selector");
        this.canvas = this._element.querySelector("#by-color-picker-canvas");
        this.canvas_context = this.canvas.getContext('2d', { willReadFrequently: true });
        this.change_canvas_gradients(this.options.color);
        this.canvas_marker = this._element.querySelector("#by-color-picker-marker");
        this.canvas_marker_outline = this._element.querySelector("#by-color-picker-marker-outline");
        this.hue_sidebar = this._element.querySelector("#by-hue-siderbar");
        this.hue_sidebar_context = this.hue_sidebar.getContext('2d', { willReadFrequently: true });
        this.hue_marker = this._element.querySelector("#by-hue-sidebar-marker");
        this.hue_marker_container = this._element.querySelector("#by-hue-siderbar-marker-container");
        this.initialize_hue_sidebar();
        this.move_hue_marker(0); // TODO remove this and set hue slider to where it needs to be to select current color
        this.red_input = this._element.querySelector("#by-red-text");
        this.green_input = this._element.querySelector("#by-green-text");
        this.blue_input = this._element.querySelector("#by-blue-text");
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

        this.color_update_listener = color_update_listener;
    }

    move_canvas_marker(x, y) {
        x = Math.min(this.options.canvas_width-1, Math.max(0, x));
        y = Math.min(this.options.canvas_height-1, Math.max(0, y));
        this.canvas_marker.setAttribute('cx', x);
        this.canvas_marker.setAttribute('cy', y);
        this.canvas_marker_outline.setAttribute('cx', x);
        this.canvas_marker_outline.setAttribute('cy', y);
    }

    move_hue_marker(y) {
        y = Math.min(this.options.canvas_height-1, Math.max(0, y));
        this.hue_marker.setAttribute('y', y);        
    }

    static partial_hex_test = /^[0-9A-F]{2}$/i;
    rgb_input_handler(e) {
        const red = Color_Selector.partial_hex_test.test(this.red_input.value) ? this.red_input.value : "00";
        const green = Color_Selector.partial_hex_test.test(this.green_input.value) ? this.green_input.value : "00";
        const blue = Color_Selector.partial_hex_test.test(this.blue_input.value) ? this.blue_input.value : "00";
        const color = `#${red}${green}${blue}`;
        this.update_html_colors(color, "rgb");
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
        this.change_canvas_gradients(this.get_hue_color());
        this.update_html_colors(this.get_canvas_color(), "canvas");
    }

    get_hue_color() {
        const y = this.hue_marker.getAttribute('y');
        const pixel = this.hue_sidebar_context.getImageData(0, y, 1, 1)['data'];
        const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
        return color;
    }

    get_canvas_color() {
        const x = this.canvas_marker.getAttribute('cx');
        const y = this.canvas_marker.getAttribute('cy');
        const pixel = this.canvas_context.getImageData(x, y, 1, 1)['data'];
        const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
        return color;
    }
    
    update_html_colors(color, caller) {
        // caller is either "canvas", "rgb", or "external"
        if (caller !== "canvas") this.update_canvas(color);
        if (caller !== "rgb") this.update_rgb_fields(color);
        if (caller !== "external") this.color_update_listener?.(color);
    }

    update_rgb_fields(color) {
        this.red_input.value = color.slice(1,3);
        this.green_input.value = color.slice(3,5);
        this.blue_input.value = color.slice(5,7);
    }

    /*
            https://en.wikipedia.org/wiki/Gaussian_elimination

            [[bl_wh[x], -1 * gr_ye[x], C[x], gr[x] - bl[x]],
             [bl_wh[y], -1 * gr_ye[y], C[y], gr[y] - bl[y]],
             [bl_wh[z], -1 * gr_ye[z], C[z], gr[z] - bl[z]]]

            [[1, -1 * gr_ye[x], C[x], gr[x]],
             [1, -1 * gr_ye[y], C[y], gr[y]],
             [1, -1 * gr_ye[z], C[z], gr[z]]]
            
            [[1, -1, C[x], 0],
             [1,  0, C[y], 1],
             [1,  0, C[z], 0]]
        

        bl_wh = wh - bl
        gr_ye = ye - gr

        bl_wh * s1 + bl = p1
        gr_ye * s2 + gr = p2

        p1 + C * s3 = p2

        bl_wh * s1 + bl + C * s3 = gr_ye * s2 + gr
        
        ---

        bl_wh[x] * s1 + bl[x] + C[x] * s3 = gr_ye[x] * s2 + gr[x]
        bl_wh[y] * s1 + bl[y] + C[y] * s3 = gr_ye[y] * s2 + gr[y]
        bl_wh[z] * s1 + bl[z] + C[z] * s3 = gr_ye[z] * s2 + gr[z]

        s1 * bl_wh[x] + s2 * -1 * gr_ye[x] + s3 * C[x] = gr[x] - bl[x]
        s1 * bl_wh[y] + s2 * -1 * gr_ye[y] + s3 * C[y] = gr[y] - bl[y]
        s1 * bl_wh[z] + s2 * -1 * gr_ye[z] + s3 * C[z] = gr[z] - bl[z]  // No blue green -> yellow line, so z=0 for those

        --- 

        s1 * bl_wh[x] + s2 * -1 * gr_ye[x] + s3 * C[x] = gr[x] - bl[x]
        s1 * bl_wh[y] + s2 * -1 * gr_ye[y] + s3 * C[y] = gr[y] - bl[y]
        s1 * bl_wh[z] + s3 * C[z] = -1 * bl[z]

        aX + bY + cZ = d
        eX + fY + gZ = h
        iX + jZ = k

        bY = d - aX - cZ
        fY = h - eX - gZ
        bY = l * fY
        l * fY = l * (h - eX - gZ)
        d - aX - cZ = l * (h - eX - gZ)
        d - aX - cZ = lh - leX - lgZ
        aX - leX + cZ - lgZ = d - lh
        (a - le)X + (c - lg)Z = (d - lh)
        mX + nZ = o

        jZ = k - iX
        nZ = o - mX
        jZ = p * nZ
        p * nZ = p * (o - mX)
        k - iX = p * (o - mX)
        k - iX = po - pmX
        pmX - iX = po - k
        (pm - i)X = (po - k)
        qX = r
        X = r/q

        */
    update_canvas(color) {
        // Need to find the correct hue to use to make a gradient, then position marker on the right spot
        // TODO this will involve some math...
        const red_white_black_plane =   [[0,   0,   0], 
                                         [255, 255, 255], 
                                         [255, 0,   0]];
        const green_white_black_plane = [[0,   0,   0], 
                                         [255, 255, 255], 
                                         [0,   255, 0]];
        const blue_white_black_plane =  [[0,   0,   0], 
                                         [255, 255, 255], 
                                         [0,   0,   255]];
        const color_vec = [parseInt(color.slice(1,3), 16), parseInt(color.slice(3,5), 16), parseInt(color.slice(5,7), 16)];

        const red_side   = Color_Selector.point_plane_orientation(red_white_black_plane[0],   
            red_white_black_plane[1],   red_white_black_plane[2],   color_vec) >= 0;
        const green_side = Color_Selector.point_plane_orientation(green_white_black_plane[0], 
            green_white_black_plane[1], green_white_black_plane[2], color_vec) >= 0;
        const blue_side  = Color_Selector.point_plane_orientation(blue_white_black_plane[0],  
            blue_white_black_plane[1],  blue_white_black_plane[2],  color_vec) >= 0;


        let base_point, vec;
        if (red_side && green_side) {
            // red - purple
            base_point = [255, 0, 0];
            vec =        [0, 0, 255];
        } else if (!green_side && !blue_side) {
            // purple - blue
            base_point = [0, 0, 255];
            vec =        [255, 0, 0];
        } else if (red_side && blue_side) {
            // blue - cyan
            base_point = [0, 0, 255];
            vec =        [0, 255, 0];
        } else if (!red_side && !green_side) {
            // cyan - green
            base_point = [0, 255, 0];
            vec =        [0, 0, 255];
        } else if (green_side && blue_side) {
            // green - yellow
            base_point = [0, 255, 0];
            vec =        [255, 0, 0];
        } else if (!red_side && !blue_side) {
            // yellow - red
            base_point = [255, 0, 0];
            vec =        [0, 255, 0];
        }

        // Augmented matrix
        const m = [[1, -vec[0], color_vec[0], base_point[0]],[1, -vec[1], color_vec[1], base_point[1]],[1, -vec[2], color_vec[2], base_point[2]]];

        /*
            [[1, -1, A, 0],
             [1,  0, B, 1],
             [1,  0, C, 0]]
        */
        if (m[0][1] !== 0) { // m2 - m1 -> m2/m2[2]
            m[2] = [0, 0, 1, (m[2][3] - m[1][3]) / (m[2][2] - m[1][2])];
        } else if (m[1][1] !== 0) { // m2 - m0 -> m2/m[2]
            m[2] = [0, 0, 1, (m[2][3] - m[0][3]) / (m[2][2] - m[0][2])];
        } else { // m1 - m0 -> m1/m1[2]
            m[1] = [0, 0, 1, (m[1][3] - m[0][3]) / (m[1][2] - m[0][2])];
        }

        /*
           [[1, -1, A, 0],
            [1,  0, B, 1],
            [0,  0, 1, D]]
        */
        if (m[0][0] === 0) { // m2 - m1
            m[2] = [0, m[2][1] - m[1][1], m[2][2] - m[1][2], m[2][3] - m[1][3]];
        } else if (m[1][0] === 0) { // m2 - m0
            m[2] = [0, m[2][1] - m[0][1], m[2][2] - m[0][2], m[2][3] - m[0][3]];
        } else { // m1 - m0
            m[1] = [0, m[1][1] - m[0][1], m[1][2] - m[0][2], m[1][3] - m[0][3]];
        }

        /*
           [[1, -1, A, 0],
            [0,  1, E, 1],
            [0,  0, 1, D]]
        */
        if (m[0][0] !== 0) {
            if (m[1][1] !== 0) { // m1 - m1[2]*m2 -> m1[1]*m1 (turn m1[1] positive if it's negative)
                // the above comment about negation won't work cause im using vals of 0-255 instead of 0-1, so
                // that field will be a -255 instead of a -1, or 255 instead of 1
                // TODO fix this
                m[1] = [0, m[1][1], ]
            } else {

            }
        } else if (m[1][0] !== 0) {
            if (m[0][1] !== 0) {

            } else {

            }
        } else {
            if (m[0][1] !== 0) {

            } else {

            }
        }
        


    }

    // All parameters must be 3-points, with ABC determining the plane and X.
    // All points are arrays in xyz order. The points making up the top side of the plane should be in clockwise order.
    // Positive result means X is on the same side as the plane's normal, negative is opposite, 0 is on the plane.
    static point_plane_orientation(A, B, C, X) {
        const BA = [B[0]-A[0], B[1]-A[1], B[2]-A[2]]; // a d g
        const CA = [C[0]-A[0], C[1]-A[1], C[2]-A[2]]; // b e h
        const XA = [X[0]-A[0], X[1]-A[1], X[2]-A[2]]; // c f i
        const determinant = (BA[0] * CA[1] * XA[2]) +
                            (CA[0] * XA[2] * BA[2]) +
                            (XA[0] * BA[1] * CA[2]) -
                            (XA[0] * CA[1] * BA[2]) -
                            (CA[0] * BA[1] * XA[2]) -
                            (BA[0] * XA[1] * CA[2]);
        return determinant;
    }

   

}

fetch(Color_Selector._template_path).then(response => response.text()).then(data => Color_Selector._template = Handlebars.compile(data));