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

        return [hue, value, saturation];
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
        this.move_hue_marker(0); // TODO remove this and set hue slider to where it needs to be to select current color
        this.red_input = this._element.querySelector("#by-red-text");
        this.green_input = this._element.querySelector("#by-green-text");
        this.blue_input = this._element.querySelector("#by-blue-text");
        this.change_canvas_gradients(this.options.color);
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

    rgb_input_handler(e) {
        const red = Color_Selector.partial_hex_test.test(this.red_input.value) ? this.red_input.value.padStart(2,'0') : "00";
        const green = Color_Selector.partial_hex_test.test(this.green_input.value) ? this.green_input.value.padStart(2,'0') : "00";
        const blue = Color_Selector.partial_hex_test.test(this.blue_input.value) ? this.blue_input.value.padStart(2,'0') : "00";
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
        this.change_canvas_gradients(Color_Selector.color_vec_to_str(Color_Selector.hsv_vec_to_rgb([this.get_hue(), 1, 1])));
        this.update_html_colors(this.get_canvas_color(), "canvas");
    }

    get_hue() {
        return this.hue_marker.getAttribute('y') / this.options.canvas_height;
    }

    get_hue_color_old() {
        const y = this.hue_marker.getAttribute('y');
        const pixel = this.hue_sidebar_context.getImageData(0, y, 1, 1)['data'];
        const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
        return color;
    }

    get_canvas_color() {
        const hue = this.get_hue();
        const saturation = this.canvas_marker.getAttribute('cx') / this.options.canvas_width;
        const value = 1 - this.canvas_marker.getAttribute('cy') / this.options.canvas_height;        
        return Color_Selector.color_vec_to_str(Color_Selector.hsv_vec_to_rgb([hue, saturation, value]));

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


    update_canvas(color) {
        const hsv = Color_Selector.rbg_vec_to_hsv(Color_Selector.color_str_to_vec(color));
        this.move_hue_marker(Math.floor(this.options.canvas_height * hsv[0]));
        this.move_canvas_marker(Math.round(this.options.canvas_width * hsv[1]), Math.round(this.options.canvas_height * (1 - hsv[2])));
        this.change_canvas_gradients(Color_Selector.color_vec_to_str(Color_Selector.hsv_vec_to_rgb([hsv[0], 1, 1])));
    }

    /*
            https://en.wikipedia.org/wiki/Gaussian_elimination

        For a color that sits along a hue line, there are infinitely many solutions
        For a color that isn't on a hue line, there is only one solution

        bl_wh = wh - bl  (black to white)
        gr_ye = ye - gr  (green to yellow)

        bl_wh * s1 + bl = p1
        gr_ye * s2 + gr = p2

        p1_C = C - p1    (p1 to color)

        p1_C * s3 + p1 = p2
        (C - p1) * s3 + p1 = p2

        (C - bl_wh * s1 + bl) * s3 + bl_wh * s1 + bl = gr_ye * s2 + gr

        (C - bl_wh * s1) * s3 + bl_wh * s1 - gr_ye * s2 = gr

        --- s1 -> bw, s2 -> gy, s3 -> Color

        (C - As1) * s3 + As1 - Bs2 = D

        Cs3 - As1s3 + As1 - Bs2 = D

        
        
        ---

        bl_wh[x] * s1 + bl[x] + C[x] * s3 = gr_ye[x] * s2 + gr[x]
        bl_wh[y] * s1 + bl[y] + C[y] * s3 = gr_ye[y] * s2 + gr[y]
        bl_wh[z] * s1 + bl[z] + C[z] * s3 = gr_ye[z] * s2 + gr[z]

        s1 * bl_wh[x] + s2 * -1 * gr_ye[x] + s3 * C[x] = gr[x] - bl[x]
        s1 * bl_wh[y] + s2 * -1 * gr_ye[y] + s3 * C[y] = gr[y] - bl[y]
        s1 * bl_wh[z] + s2 * -1 * gr_ye[z] + s3 * C[z] = gr[z] - bl[z]

        --- 

        */
    update_canvas_old(color) {
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

        console.log(color_vec);

        if (color_vec.reduce((acc, val)=>{ if (val === 0) acc++;}, 0) >= 2) {
            // special cases if there are 2 or more 0's in the color vec
            // 2 zeros means the color vec is either pure red, green, or blue
            // 3 zeros means the color is black
            return;
        }

        let red_side   = Vector_Math.point_plane_orientation(red_white_black_plane[0],   
            red_white_black_plane[1],   red_white_black_plane[2],   color_vec);
        let green_side = Vector_Math.point_plane_orientation(green_white_black_plane[0], 
            green_white_black_plane[1], green_white_black_plane[2], color_vec);
        let blue_side  = Vector_Math.point_plane_orientation(blue_white_black_plane[0],  
            blue_white_black_plane[1],  blue_white_black_plane[2],  color_vec);

        console.log(red_side, green_side, blue_side);

        let base_point, vec;
        if (red_side >= 0 && green_side >= 0 && blue_side <= 0) { // red - purple            
            base_point = [255, 0, 0];
            vec =        [0, 0, 255];
        } else if (red_side >= 0 && green_side <= 0 && blue_side <= 0) { // purple - blue            
            base_point = [0, 0, 255];
            vec =        [255, 0, 0];
        } else if (red_side >= 0 && green_side <= 0 && blue_side >= 0) { // blue - cyan            
            base_point = [0, 0, 255];
            vec =        [0, 255, 0];
        } else if (red_side <= 0 && green_side <= 0 && blue_side >= 0) { // cyan - green            
            base_point = [0, 255, 0];
            vec =        [0, 0, 255];
        } else if (red_side <= 0 && green_side >= 0 && blue_side >= 0) { // green - yellow            
            base_point = [0, 255, 0];
            vec =        [255, 0, 0];
        } else if (red_side <= 0 && green_side >= 0 && blue_side <= 0) { // yellow - red            
            base_point = [255, 0, 0];
            vec =        [0, 255, 0];
        } else {
            // TODO edge case that I don't think should happen?
            return;
        }

        console.log(base_point);
        console.log(vec);

        // Augmented matrix
        const m =  [[255, -vec[0], color_vec[0], base_point[0]],
                    [255, -vec[1], color_vec[1], base_point[1]],
                    [255, -vec[2], color_vec[2], base_point[2]]];
        let temp, idx;

        const print_m = (i) => {
            console.log(i);
            console.log(JSON.stringify(m[0]));
            console.log(JSON.stringify(m[1]));
            console.log(JSON.stringify(m[2]));
            console.log("________________");
        };

        print_m(1);

        /*
            [[255, -255, A, 0  ],
             [255,  0,   B, 255],
             [255,  0,   C, 0  ]]

             move rows so that m0 is the only row with a non-zero value at index 1
             check if m2[2] is 0, if so swap that row with m1
             m2 - m1
             m2 / m2[2]
        */
        idx = m.findIndex(e => e[1] !== 0);
        temp = m[idx];
        m.splice(idx, 1);
        m.splice(0, 0, temp);        
        if (m[2][2] === 0) m.splice(1,0, m.pop());
        print_m(2);
        Vector_Math.subtract(m[2], m[1]);
        print_m(3);
        Vector_Math.scale(m[2], 1/m[2][2]);
        print_m(4);
        
        /*
           [[255, -255, A, 0  ],
            [255,  0,   B, 255],
            [0,    0,   1, D  ]]

            copy m2 into temp and scale by m1[2]
            m1 - temp
        */
        temp = Vector_Math.scale([...m[2]], m[1][2]);
        console.log(5, JSON.stringify(temp));
        Vector_Math.subtract(m[1], temp);
        print_m(6);
        

        /*
           [[255, -255, A, 0],
            [255,  0,   0, E],
            [0,    0,   1, D]]

            m0 - m1
            m1 / m1[0]
            copy m2 into temp and scale by m0[2]
            m0 - temp 
            m0 / m0[1]
        */
        Vector_Math.subtract(m[0], m[1]);
        print_m(7);
        Vector_Math.scale(m[1], 1/m[1][0]);
        print_m(8);
        temp = Vector_Math.scale([...m[2]], m[0][2]);
        console.log(9, JSON.stringify(temp));
        Vector_Math.subtract(m[0], temp);
        print_m(10);
        Vector_Math.scale(m[0], 1/m[0][1]);
        print_m(11);

        /*
           [[0, 1, 0, G],
            [1, 0, 0, F],
            [0, 0, 1, D]]
        */
        const s1 = m[1][3]; // 0-1
        const s2 = m[0][3]; // 0-1
        const s3 = m[2][3]; // >= 1

        console.log(s1, s2, s3);

        let hue = Vector_Math.add(Vector_Math.scale([...vec], s2), base_point);
        hue[0] = Math.round(hue[0]);
        hue[1] = Math.round(hue[1]);
        hue[2] = Math.round(hue[2]);

        console.log(hue);


        /* 
            TODO
            I'm getting the hue scalar calculated correctly it seems.
            but I'm definitely not getting the black-white scalar correctly, and 
            I'm unsure if I'm getting the color scalar correctly.
            I keep getting negative numbers for the BW scalar when it should be
            between 0 and 1 each time. Did I somehow accidentally make a vector
            going from white to black????
            Need to double check all the initial values I'm setting thoroughly,
            because if those are absolutely correct then I think my math is
            messed up somewhere
        */


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

   

}

fetch(Color_Selector._template_path).then(response => response.text()).then(data => Color_Selector._template = Handlebars.compile(data));