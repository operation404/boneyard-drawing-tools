import {
	MODULE,
	SETTING_SHORTCUT_ENABLED,
	SETTING_SHORTCUT_KEY,
	SETTING_SHORTCUT_MODIFIERS,
	SETTINGS_COLOR_SELECTOR_SIZE,
	SETTING_DROPPER_PREVIEW_SIZE,
	SETTING_DROPPER_READ_RADIUS,
	SETTINGS_PRESET_COLOR_SWATCHES,
	SETTINGS_RECENT_COLOR_HISTORY,
	SETTINGS_RECENT_COLORS,
} from './constants.js';
import { Color_Selector } from './color_selector.js';

export class Drawing_Tools extends Application {
	static hex_test = /^#[0-9A-F]{6}$/i;
	static current_tool = 'stroke';

	static init() {
		Drawing_Tools.prepare_hook_handlers();
		Drawing_Tools.prepare_shortcut_listener();
		console.log(`====== Boneyard ======\n - Drawing tools initialized`);
	}

	static mouse_pos = { x: 0, y: 0 };
	static shortcut = {
		enabled: true,
		key: 'd',
		modifiers: {
			ctrl: true,
			shift: false,
			alt: false,
		},
	};

	static set_shortcut_options() {
		Drawing_Tools.shortcut.enabled = game.settings.get(MODULE, SETTING_SHORTCUT_ENABLED);
		Drawing_Tools.shortcut.key = game.settings.get(MODULE, SETTING_SHORTCUT_KEY).toLowerCase();
		const modifiers = game.settings.get(MODULE, SETTING_SHORTCUT_MODIFIERS).split(',');
		for (const key in Drawing_Tools.shortcut.modifiers) {
			if (modifiers.includes(key)) {
				Drawing_Tools.shortcut.modifiers[key] = true;
			} else {
				Drawing_Tools.shortcut.modifiers[key] = false;
			}
		}
	}

	static prepare_shortcut_listener() {
		Drawing_Tools.set_shortcut_options();
		if (!Drawing_Tools.shortcut.enabled) return;

		function shortcut_handler(e) {
			if (
				e.key.toLowerCase() === Drawing_Tools.shortcut.key &&
				!(Drawing_Tools.shortcut.modifiers.ctrl && !e.ctrlKey) &&
				!(Drawing_Tools.shortcut.modifiers.shift && !e.shiftKey) &&
				!(Drawing_Tools.shortcut.modifiers.alt && !e.altKey)
			) {
				// Open the drawing tools panel
				e.preventDefault();
				e.stopImmediatePropagation();
				new Drawing_Tools({ x: Drawing_Tools.mouse_pos.x, y: Drawing_Tools.mouse_pos.y }).render(true);
			}
		}

		function mouse_position_handler(e) {
			Drawing_Tools.mouse_pos.x = e.clientX;
			Drawing_Tools.mouse_pos.y = e.clientY;
		}

		Hooks.on('ready', () => {
			const observer = new MutationObserver((mutationList) => {
				const new_button = mutationList[0].addedNodes[0]
					.querySelector('li[data-control="drawings"]')
					.classList.contains('active');
				const old_button = mutationList[0].removedNodes[0]
					.querySelector('li[data-control="drawings"]')
					.classList.contains('active');

				if (new_button && !old_button) {
					// drawing controls selected
					document.body.addEventListener('keydown', shortcut_handler);
					document.body.addEventListener('mousemove', mouse_position_handler);
				} else if (!new_button && old_button) {
					// drawing tools toggled off
					document.body.removeEventListener('keydown', shortcut_handler);
					document.body.removeEventListener('mousemove', mouse_position_handler);
				}
			});
			observer.observe(document.querySelector('section#ui-left'), { childList: true });
		});
	}

	static prepare_hook_handlers() {
		Hooks.on('getSceneControlButtons', (controls) => Drawing_Tools.add_control_buttons(controls));
	}

	static add_control_buttons(controls) {
		const drawing_controls = controls.find((control_set) => control_set.name === 'drawings');
		drawing_controls.tools.push({
			name: 'quick-draw-config',
			icon: 'fas fa-paint-brush',
			title: 'CONTROLS.QuickDrawConfig',
			onClick: () => {
				new Drawing_Tools().render(true);
			},
			button: true,
		});
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			template: `modules/boneyard-drawing-tools/templates/quick-draw-config.hbs`,
			id: MODULE,
			popOut: false,
		});
	}

	static generate_smooth_gradient_style(color, num_stops = 5) {
		let color_stops = '';
		for (let i = 0; i < num_stops; i++) {
			let alpha = Math.sin((i / num_stops) * (Math.PI / 2) + Math.PI) + 1; // value between 1 and 0, sin curve
			alpha = Math.min(Math.max(Math.floor(alpha * 255), 0), 255); // convert to fraction of 255 and clamp
			let color_with_alpha = color + alpha.toString(16).padStart(2, '0');
			color_stops += color_with_alpha;
			if (i + 1 < num_stops) color_stops += ', ';
		}
		return `linear-gradient(180deg, ${color_stops}, transparent 30%)`;
	}

	static get_settings() {
		let cs_size, dr_size, dr_radi, swatches, recent_count, recent;

		cs_size = (cs_size = Math.floor(game.settings.get(MODULE, SETTINGS_COLOR_SELECTOR_SIZE))) < 100 ? 100 : cs_size;
		dr_size = (dr_size = Math.floor(game.settings.get(MODULE, SETTING_DROPPER_PREVIEW_SIZE))) < 20 ? 20 : dr_size;
		dr_radi = (dr_radi = Math.floor(game.settings.get(MODULE, SETTING_DROPPER_READ_RADIUS))) < 1 ? 1 : dr_radi;
		const settings = {
			canvas_size: cs_size,
			dropper_preview_size: dr_size,
			dropper_read_size: dr_radi * 2 - 1,
		};

		// must be in #XXXXXX format, comma separated, however many the user wants
		swatches = game.settings.get(MODULE, SETTINGS_PRESET_COLOR_SWATCHES).split(',');
		for (let i = 0; i < swatches.length; i++) {
			swatches[i] = swatches[i].trim();
			if (!Drawing_Tools.hex_test.test(swatches[i])) {
				swatches = null;
				break;
			}
		}
		if (swatches !== null) settings.preset_color_swatches = swatches;

		recent_count = game.settings.get(MODULE, SETTINGS_RECENT_COLOR_HISTORY);
		recent = game.settings.get(MODULE, SETTINGS_RECENT_COLORS);
		if (recent.length < recent_count) {
			while (recent.length < recent_count) {
				recent.push('#000000');
			}
		} else if (recent.length > recent_count) {
			recent = recent.slice(0, recent_count);
		}
		settings.recent_color_history = recent_count;
		settings.recent_color_swatches = recent;

		return settings;
	}

	/**
	 * The Drawing_Tools Application window.
	 * @param {ApplicationOptions} [options]  Default Application configuration options.
	 */
	constructor(options = {}) {
		options = { ...Drawing_Tools.get_settings(), ...options };
		super(options);
		const drawing_defaults = game.settings.get('core', DrawingsLayer.DEFAULT_CONFIG_SETTING);
		this.color_selector = new Color_Selector(
			{ color: drawing_defaults[`${Drawing_Tools.current_tool}Color`], ...options },
			Drawing_Tools.mouse_pos
		);
	}

	getData() {
		const drawing_defaults = game.settings.get('core', DrawingsLayer.DEFAULT_CONFIG_SETTING);
		if (drawing_defaults === undefined) {
			console.error('Could not load DrawingsLayer Default Config Settings.');
			throw 'Could not load DrawingsLayer Default Config Settings.';
		}

		const current_color =
			Drawing_Tools.current_tool === 'stroke' ? drawing_defaults['strokeColor'] : drawing_defaults['fillColor'];
		return {
			// Send data to the html template
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
		if (this.options.x !== undefined && this.options.y !== undefined) {
			// ---- Drawing tools shortcut was pressed

			let x = this.options.x,
				y = this.options.y;
			const panel_bounds = this._element[0].getBoundingClientRect();
			x = (x -= panel_bounds.width / 2) < 0 ? 0 : x;
			x = x + panel_bounds.width / 2 > window.innerWidth ? window.innerWidth - panel_bounds.width : x;
			y = (y += 10) + panel_bounds.height > window.innerHeight ? window.innerHeight - panel_bounds.height : y;
			this._element[0].style.left = `${x}px`;
			this._element[0].style.top = `${y}px`;
		} else {
			// ---- Drawing Tools control button was pressed

			const controls_container = document.querySelector('#ui-left > #controls');
			const controls_container_style = window.getComputedStyle(controls_container);
			const sub_controls = document.querySelector('#controls > ol.sub-controls.app.control-tools.flexcol.active');
			const control = sub_controls.firstElementChild;
			const control_style = window.getComputedStyle(control);

			// offsetHeight includes padding+border but not margin
			const control_height =
				control.offsetHeight + parseFloat(control_style.marginTop) + parseFloat(control_style.marginBottom);
			const control_width =
				control.offsetWidth + parseFloat(control_style.marginLeft) + parseFloat(control_style.marginRight);
			const max_controls_per_col = Math.floor(sub_controls.offsetHeight / control_height);

			// There's always 1 main control column + potentially multiple sub-control columns
			const columns = 1 + Math.ceil(sub_controls.childElementCount / max_controls_per_col);

			const offset_left = columns * control_width + parseFloat(controls_container_style.paddingLeft);

			// The drawing sub-controls should be the active set, so just query that
			const drawing_tool = sub_controls.querySelector(`[data-tool='quick-draw-config']`);
			const drawing_tool_rect = drawing_tool.getBoundingClientRect();
			const drawing_tool_y_center = drawing_tool_rect.top + drawing_tool_rect.height / 2; // not sure if .top or .y is better

			const offset_top = drawing_tool_y_center - this._element[0].offsetHeight / 2;

			this._element[0].style.left = `${offset_left}px`;
			this._element[0].style.top = `${offset_top}px`;
		}

		// Focus the dropper button
		this._element[0].querySelector(`#by-dropper-button`).focus();
		/*
        // Focus last edited tool color
        const color_text_input = this._element[0].querySelector(`#by-quick-draw-config #by-${Drawing_Tools.current_tool}-color-text`);
        color_text_input.setSelectionRange(color_text_input.value.length, color_text_input.value.length);
        color_text_input.focus();        
        */
	}

	activateListeners(html) {
		super.activateListeners(html);
		const drawing_tools_element = html[0];

		// Color toggle buttons
		drawing_tools_element.querySelector('#by-stroke-color').addEventListener('click', (e) => {
			this.color_button_handler(e);
		});
		drawing_tools_element.querySelector('#by-fill-color').addEventListener('click', (e) => {
			this.color_button_handler(e);
		});

		// Hex color input boxes
		drawing_tools_element.querySelector('#by-stroke-color-text').addEventListener('input', (e) => {
			this.color_text_handler(e);
		});
		drawing_tools_element.querySelector('#by-fill-color-text').addEventListener('input', (e) => {
			this.color_text_handler(e);
		});

		// Alpha slider inputs
		drawing_tools_element.querySelector('#by-stroke-alpha').addEventListener('input', (e) => {
			this.alpha_slider_handler(e);
		});
		drawing_tools_element.querySelector('#by-fill-alpha').addEventListener('input', (e) => {
			this.alpha_slider_handler(e);
		});

		// Stroke width buttons
		drawing_tools_element.querySelector('#by-stroke-width-minus').addEventListener('click', (e) => {
			this.stroke_width_companion_button_handler(e);
		});
		drawing_tools_element.querySelector('#by-stroke-width-plus').addEventListener('click', (e) => {
			this.stroke_width_companion_button_handler(e);
		});

		// Close when clicking off the window
		drawing_tools_element.addEventListener('focusout', (e) => {
			this.close_window_handler(e);
		});

		// Insert the color picker html
		// Can't be done in _render because that calls super() first, which calls this function.
		// But at this point html injection should have been done, so it's safe to inject the color selector.
		const color_selector_menu = drawing_tools_element.querySelector(`#by-color-selector-menu`);
		this.color_selector.render_and_attach_html(color_selector_menu);
		this.color_selector;

		// Activate color selector's listeners
		this.color_selector.activate_listeners(html, (color) => {
			this.update_html_colors(color, Drawing_Tools.current_tool, 'selector');
		});
	}

	color_button_handler(e) {
		const tool = e.target.dataset.tool;
		Drawing_Tools.current_tool = tool;
		document.querySelector('#by-quick-draw-config #by-selected-tool').textContent = game.i18n.localize(
			`CONTROLS.${tool}_color`
		);
		const drawing_defaults = game.settings.get('core', DrawingsLayer.DEFAULT_CONFIG_SETTING);
		this.update_html_colors(drawing_defaults[`${tool}Color`], tool, 'button');
	}

	update_html_colors(color, tool, caller) {
		// caller is either "button", "text", or "selector"

		// Button color and text input for tool always updates
		if (caller !== 'button') {
			document.querySelector(`#by-quick-draw-config #by-${tool}-color`).style.setProperty('background', color);
		}
		if (caller !== 'button' && caller !== 'text') {
			document.querySelector(`#by-quick-draw-config #by-${tool}-color-text`).value = color;
		}

		// Only update color selector if updated color is for the currently selected tool
		if (tool === Drawing_Tools.current_tool) {
			document.querySelector('#by-quick-draw-config #by-tool-name-bar').style.setProperty('background', color);
			document
				.querySelector('#by-quick-draw-config #by-color-selector-background')
				.style.setProperty('background-image', Drawing_Tools.generate_smooth_gradient_style(color));

			if (caller !== 'selector') {
				this.color_selector.update_html_colors(color, 'external');
			}
		}
	}

	color_text_handler(e) {
		const tool = e.target.dataset.tool;
		const update_color = Drawing_Tools.hex_test.test(e.target.value) ? e.target.value : '#000000';
		this.update_html_colors(update_color, tool, 'text');
	}

	alpha_slider_handler(e) {
		const tool = e.target.dataset.tool;
		document.querySelector(`#by-quick-draw-config #by-${tool}-alpha-label`).textContent = e.target.value;
	}

	stroke_width_companion_button_handler(e) {
		const width_input_element = this._element[0].querySelector(`#by-stroke-width`);
		let width;
		width = !isNaN((width = width_input_element.value)) ? parseInt(width) : 12;
		width += (e.target.textContent === '-' ? -1 : +1) * (e.shiftKey ? 5 : 1);
		width_input_element.value = width < 0 ? 0 : width;
	}

	update_drawing_layer_config() {
		let config = game.settings.get('core', DrawingsLayer.DEFAULT_CONFIG_SETTING);
		if (config === undefined) {
			console.error('Could not load DrawingsLayer Default Config Settings.');
			return;
		}

		let temp;
		config[`strokeColor`] = Drawing_Tools.hex_test.test(
			(temp = this._element[0].querySelector(`#by-stroke-color-text`).value)
		)
			? temp
			: '#000000';
		config[`fillColor`] = Drawing_Tools.hex_test.test(
			(temp = this._element[0].querySelector(`#by-fill-color-text`).value)
		)
			? temp
			: '#000000';
		config[`strokeAlpha`] = this._element[0].querySelector(`#by-stroke-alpha`).value;
		config[`fillAlpha`] = this._element[0].querySelector(`#by-fill-alpha`).value;
		config[`strokeWidth`] = !isNaN((temp = this._element[0].querySelector(`#by-stroke-width`).value))
			? (temp = parseInt(temp)) < 0
				? 0
				: temp
			: 12;
		config[`fillType`] = parseInt(this._element[0].querySelector(`#by-fill-type`).value);

		game.settings.set('core', DrawingsLayer.DEFAULT_CONFIG_SETTING, config);
	}

	save_recent_colors() {
		let temp, pos;
		const stroke = Drawing_Tools.hex_test.test(
			(temp = this._element[0].querySelector(`#by-stroke-color-text`).value)
		)
			? temp
			: null;
		const fill = Drawing_Tools.hex_test.test((temp = this._element[0].querySelector(`#by-fill-color-text`).value))
			? temp
			: null;

		if (fill !== null) {
			if ((pos = this.options.recent_color_swatches.findIndex(c => c === fill)) >= 0) {
				this.options.recent_color_swatches.splice(pos, 1);
			}
			this.options.recent_color_swatches.unshift(fill);
		}
		if (stroke !== null) {
			if ((pos = this.options.recent_color_swatches.findIndex(c => c === stroke)) >= 0) {
				this.options.recent_color_swatches.splice(pos, 1);
			}
			this.options.recent_color_swatches.unshift(stroke);
		}
		
		game.settings.set(
			MODULE,
			SETTINGS_RECENT_COLORS,
			this.options.recent_color_swatches.slice(0, this.options.recent_color_history)
		);
	}

	close_window_handler(e) {
		// outermost div has tabindex="0" which allows the whole panel to be focused when clicked
		// so we only close the window if the user has clicked off the panel

		// Check if the new focus target is still a part of the drawing tools window
		if (!document.querySelector('#by-quick-draw-config').contains(e.relatedTarget)) {
			this.update_drawing_layer_config();
			this.save_recent_colors();
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
		if (!el) return (this._state = states.CLOSED);
		el.css({
			minHeight: 0,
		});

		// Dispatch Hooks for closing the base and subclass applications
		for (let cls of this.constructor._getInheritanceChain()) {
			Hooks.call(`close${cls.name}`, this, el);
		}

		return new Promise((resolve) => {
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
