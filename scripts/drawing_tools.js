import {
	MODULE,
	SETTINGS_COLOR_SELECTOR_SIZE,
	SETTING_DROPPER_PREVIEW_SIZE,
	SETTING_DROPPER_READ_RADIUS,
	SETTINGS_PRESET_COLOR_SWATCHES,
	SETTINGS_RECENT_COLOR_HISTORY,
	SETTINGS_RECENT_COLORS,
} from './constants.js';
import { Color_Selector } from './color_selector.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class Drawing_Tools extends HandlebarsApplicationMixin(ApplicationV2) {
	static hex_test = /^#[0-9A-F]{6}$/i;
	static current_tool = 'stroke';
	static mouse_pos = { x: 0, y: 0 };

	/**
	 * Normalize a color value to a hex string (#RRGGBB).
	 * Handles hex strings, Color objects, and numeric values.
	 */
	static toHexString(value) {
		if (typeof value === 'string' && Drawing_Tools.hex_test.test(value)) return value;
		if (value instanceof foundry.utils.Color) return value.css.slice(0, 7);
		if (typeof value === 'string') return value;
		if (typeof value === 'number') return '#' + value.toString(16).padStart(6, '0');
		return '#000000';
	}

	/** @type {Drawing_Tools|null} */
	static _instance = null;

	static DEFAULT_OPTIONS = {
		id: 'boneyard-drawing-tools',
		classes: ['by-drawing-tools'],
		window: {
			title: 'CONTROLS.QuickDrawConfig',
			icon: 'fas fa-paint-brush',
			resizable: false,
		},
		position: {
			width: 'auto',
			height: 'auto',
		},
		actions: {
			strokeColor: Drawing_Tools.#onColorButton,
			fillColor: Drawing_Tools.#onColorButton,
			strokeWidthMinus: Drawing_Tools.#onStrokeWidthButton,
			strokeWidthPlus: Drawing_Tools.#onStrokeWidthButton,
		},
	};

	static PARTS = {
		main: {
			template: 'modules/boneyard-drawing-tools/templates/quick-draw-config.hbs',
		},
	};

	static init() {
		Drawing_Tools.#prepareHookHandlers();
		console.log(`====== Boneyard ======\n - Drawing tools initialized`);
	}

	/**
	 * Toggle the drawing tools panel open/closed.
	 */
	static toggle() {
		if (Drawing_Tools._instance?.rendered) {
			Drawing_Tools._instance.close();
			return;
		}
		const settings = Drawing_Tools.#getSettings();
		Drawing_Tools._instance = new Drawing_Tools(settings);
		Drawing_Tools._instance.render(true);
	}

	static #prepareHookHandlers() {
		Hooks.on('getSceneControlButtons', (controls) => Drawing_Tools.#addControlButtons(controls));
	}

	static #addControlButtons(controls) {
		controls.drawings.tools['quick-draw-config'] = {
			name: 'quick-draw-config',
			icon: 'fas fa-paint-brush',
			title: 'CONTROLS.QuickDrawConfig',
			onChange: () => {
				Drawing_Tools.toggle();
			},
			button: true,
		};
	}

	static generate_smooth_gradient_style(color, num_stops = 5) {
		let color_stops = '';
		for (let i = 0; i < num_stops; i++) {
			let alpha = Math.sin((i / num_stops) * (Math.PI / 2) + Math.PI) + 1;
			alpha = Math.min(Math.max(Math.floor(alpha * 255), 0), 255);
			let color_with_alpha = color + alpha.toString(16).padStart(2, '0');
			color_stops += color_with_alpha;
			if (i + 1 < num_stops) color_stops += ', ';
		}
		return `linear-gradient(180deg, ${color_stops}, transparent 30%)`;
	}

	static #getSettings() {
		let cs_size, dr_size, dr_radi, swatches, recent_count, recent;

		cs_size = (cs_size = Math.floor(game.settings.get(MODULE, SETTINGS_COLOR_SELECTOR_SIZE))) < 100 ? 100 : cs_size;
		dr_size = (dr_size = Math.floor(game.settings.get(MODULE, SETTING_DROPPER_PREVIEW_SIZE))) < 20 ? 20 : dr_size;
		dr_radi = (dr_radi = Math.floor(game.settings.get(MODULE, SETTING_DROPPER_READ_RADIUS))) < 1 ? 1 : dr_radi;
		const settings = {
			canvas_size: cs_size,
			dropper_preview_size: dr_size,
			dropper_read_size: dr_radi * 2 - 1,
		};

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

	constructor(settings = {}) {
		super();
		this._settings = settings;
		const drawing_defaults = game.settings.get('core', foundry.canvas.layers.DrawingsLayer.DEFAULT_CONFIG_SETTING);
		this.color_selector = new Color_Selector(
			{ color: Drawing_Tools.toHexString(drawing_defaults[`${Drawing_Tools.current_tool}Color`]), ...settings },
			Drawing_Tools.mouse_pos
		);
	}

	async _prepareContext(options) {
		const drawing_defaults = game.settings.get('core', foundry.canvas.layers.DrawingsLayer.DEFAULT_CONFIG_SETTING);
		if (drawing_defaults === undefined) {
			console.error('Could not load DrawingsLayer Default Config Settings.');
			throw new Error('Could not load DrawingsLayer Default Config Settings.');
		}

		const stroke_color = Drawing_Tools.toHexString(drawing_defaults['strokeColor']);
		const fill_color = Drawing_Tools.toHexString(drawing_defaults['fillColor']);
		const current_color = Drawing_Tools.current_tool === 'stroke' ? stroke_color : fill_color;
		return {
			current_tool: Drawing_Tools.current_tool,
			current_tool_tooltip: game.i18n.localize(`CONTROLS.${Drawing_Tools.current_tool}_color`),
			name_bar_color: current_color,
			start_gradient: Drawing_Tools.generate_smooth_gradient_style(current_color),
			stroke_color: stroke_color,
			stroke_alpha: drawing_defaults['strokeAlpha'],
			fill_color: fill_color,
			fill_alpha: drawing_defaults['fillAlpha'],
			stroke_width: drawing_defaults.strokeWidth,
			none_selected: drawing_defaults.fillType === 0 ? 'selected' : '',
			solid_selected: drawing_defaults.fillType === 1 ? 'selected' : '',
			pattern_selected: drawing_defaults.fillType === 2 ? 'selected' : '',
		};
	}

	_onRender(context, options) {
		const el = this.element;

		// Attach non-action event listeners
		el.querySelector('#by-stroke-color-text')?.addEventListener('input', (e) => this.#colorTextHandler(e));
		el.querySelector('#by-fill-color-text')?.addEventListener('input', (e) => this.#colorTextHandler(e));
		el.querySelector('#by-stroke-alpha')?.addEventListener('input', (e) => this.#alphaSliderHandler(e));
		el.querySelector('#by-fill-alpha')?.addEventListener('input', (e) => this.#alphaSliderHandler(e));
		el.querySelector('#by-fill-type')?.addEventListener('change', () => this.#updateDrawingLayerConfig());

		// Insert the color picker
		const color_selector_menu = el.querySelector('#by-color-selector-menu');
		this.color_selector.render_and_attach_html(color_selector_menu);
		this.color_selector.activate_listeners(el, (color) => {
			this.#updateHtmlColors(color, Drawing_Tools.current_tool, 'selector');
		});
	}

	// --- Action handlers (static, called via data-action) ---

	static #onColorButton(event, target) {
		const app = this;
		const tool = target.dataset.tool;
		Drawing_Tools.current_tool = tool;
		const el = app.element;
		el.querySelector('#by-selected-tool').textContent = game.i18n.localize(`CONTROLS.${tool}_color`);
		const drawing_defaults = game.settings.get('core', foundry.canvas.layers.DrawingsLayer.DEFAULT_CONFIG_SETTING);
		app.#updateHtmlColors(Drawing_Tools.toHexString(drawing_defaults[`${tool}Color`]), tool, 'button');
	}

	static #onStrokeWidthButton(event, target) {
		const app = this;
		const width_input = app.element.querySelector('#by-stroke-width');
		let width = !isNaN(width_input.value) ? parseInt(width_input.value) : 12;
		width += (target.textContent === '-' ? -1 : +1) * (event.shiftKey ? 5 : 1);
		width_input.value = width < 0 ? 0 : width;
		app.#updateDrawingLayerConfig();
	}

	// --- Instance event handlers ---

	#colorTextHandler(e) {
		const tool = e.target.dataset.tool;
		const update_color = Drawing_Tools.hex_test.test(e.target.value) ? e.target.value : '#000000';
		this.#updateHtmlColors(update_color, tool, 'text');
	}

	#alphaSliderHandler(e) {
		const tool = e.target.dataset.tool;
		this.element.querySelector(`#by-${tool}-alpha-label`).textContent = e.target.value;
		this.#updateDrawingLayerConfig();
	}

	#updateHtmlColors(color, tool, caller) {
		const el = this.element;
		if (!el) return;
		if (caller !== 'button') {
			el.querySelector(`#by-${tool}-color`)?.style.setProperty('background', color);
		}
		if (caller !== 'button' && caller !== 'text') {
			const textInput = el.querySelector(`#by-${tool}-color-text`);
			if (textInput) textInput.value = color;
		}

		if (tool === Drawing_Tools.current_tool) {
			el.querySelector('#by-tool-name-bar')?.style.setProperty('background', color);
			el.querySelector('#by-color-selector-background')?.style.setProperty(
				'background-image',
				Drawing_Tools.generate_smooth_gradient_style(color)
			);

			if (caller !== 'selector') {
				this.color_selector.update_html_colors(color, 'external');
			}
		}

		this.#updateDrawingLayerConfig();
	}

	async close(options = {}) {
		this.#updateDrawingLayerConfig();
		this.#saveRecentColors();
		Drawing_Tools._instance = null;
		return super.close(options);
	}

	#updateDrawingLayerConfig() {
		const el = this.element;
		if (!el) return;
		let config = game.settings.get('core', foundry.canvas.layers.DrawingsLayer.DEFAULT_CONFIG_SETTING);
		if (config === undefined) {
			console.error('Could not load DrawingsLayer Default Config Settings.');
			return;
		}

		let temp;
		config['strokeColor'] = Drawing_Tools.hex_test.test(
			(temp = el.querySelector('#by-stroke-color-text').value)
		) ? temp : '#000000';
		config['fillColor'] = Drawing_Tools.hex_test.test(
			(temp = el.querySelector('#by-fill-color-text').value)
		) ? temp : '#000000';
		config['strokeAlpha'] = parseFloat(el.querySelector('#by-stroke-alpha').value);
		config['fillAlpha'] = parseFloat(el.querySelector('#by-fill-alpha').value);
		config['strokeWidth'] = !isNaN((temp = el.querySelector('#by-stroke-width').value))
			? (temp = parseInt(temp)) < 0 ? 0 : temp
			: 12;
		config['fillType'] = parseInt(el.querySelector('#by-fill-type').value);

		game.settings.set('core', foundry.canvas.layers.DrawingsLayer.DEFAULT_CONFIG_SETTING, config);
	}

	#saveRecentColors() {
		const el = this.element;
		if (!el) return;
		let temp, pos;
		const stroke = Drawing_Tools.hex_test.test(
			(temp = el.querySelector('#by-stroke-color-text').value)
		) ? temp : null;
		const fill = Drawing_Tools.hex_test.test(
			(temp = el.querySelector('#by-fill-color-text').value)
		) ? temp : null;

		const swatches = this._settings.recent_color_swatches || [];
		const presets = this._settings.preset_color_swatches || [];

		if (fill !== null && !presets.includes(fill)) {
			if ((pos = swatches.findIndex((c) => c === fill)) >= 0) {
				swatches.splice(pos, 1);
			}
			swatches.unshift(fill);
		}
		if (stroke !== null && !presets.includes(stroke)) {
			if ((pos = swatches.findIndex((c) => c === stroke)) >= 0) {
				swatches.splice(pos, 1);
			}
			swatches.unshift(stroke);
		}

		game.settings.set(
			MODULE,
			SETTINGS_RECENT_COLORS,
			swatches.slice(0, this._settings.recent_color_history || 10)
		);
	}
}
