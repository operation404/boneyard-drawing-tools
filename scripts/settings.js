import {
	MODULE,
	SETTINGS_COLOR_SELECTOR_SIZE,
	SETTING_DROPPER_PREVIEW_SIZE,
	SETTING_DROPPER_READ_RADIUS,
	SETTINGS_PRESET_COLOR_SWATCHES,
	SETTINGS_RECENT_COLOR_HISTORY,
	SETTINGS_RECENT_COLORS,
} from './constants.js';
import { Drawing_Tools } from './drawing_tools.js';

export function prepare_settings() {
	// Register keybinding for opening the drawing tools panel
	game.keybindings.register(MODULE, 'openPanel', {
		name: 'CONTROLS.QuickDrawConfig',
		hint: 'SETTINGS.HINT.shortcut_enabled',
		editable: [
			{ key: 'KeyD', modifiers: ['Control'] },
		],
		onDown: () => {
			Drawing_Tools.toggle();
			return true;
		},
		restricted: false,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});

	game.settings.register(MODULE, SETTINGS_COLOR_SELECTOR_SIZE, {
		name: 'SETTINGS.NAME.color_selector_size',
		hint: 'SETTINGS.HINT.color_selector_size',
		scope: 'client',
		config: true,
		type: Number,
		default: 150,
		requiresReload: false,
	});

	game.settings.register(MODULE, SETTING_DROPPER_PREVIEW_SIZE, {
		name: 'SETTINGS.NAME.dropper_preview_size',
		hint: 'SETTINGS.HINT.dropper_preview_size',
		scope: 'client',
		config: true,
		type: Number,
		default: 50,
		requiresReload: false,
	});

	game.settings.register(MODULE, SETTING_DROPPER_READ_RADIUS, {
		name: 'SETTINGS.NAME.dropper_read_radius',
		hint: 'SETTINGS.HINT.dropper_read_radius',
		scope: 'client',
		config: true,
		type: Number,
		default: 3,
		requiresReload: false,
	});

	game.settings.register(MODULE, SETTINGS_PRESET_COLOR_SWATCHES, {
		name: 'SETTINGS.NAME.preset_color_swatches',
		hint: 'SETTINGS.HINT.preset_color_swatches',
		scope: 'client',
		config: true,
		type: String,
		default:
			'#cc0000,#ea9999,#e69138,#f9cb9c,#f1c232,#ffe599,#6aa84f,#b6d7a8,#45818e,#a2c4c9,#3c78d8,#a4c2f4,#674ea7,#b4a7d6,#c41d70,#ec83b7,#7e3426,#8f674f,#000000,#808080',
		requiresReload: false,
	});

	game.settings.register(MODULE, SETTINGS_RECENT_COLOR_HISTORY, {
		name: 'SETTINGS.NAME.recent_color_history',
		hint: 'SETTINGS.HINT.recent_color_history',
		scope: 'client',
		config: true,
		type: Number,
		default: 10,
		requiresReload: false,
	});

	game.settings.register(MODULE, SETTINGS_RECENT_COLORS, {
		scope: 'client',
		config: false,
		type: Array,
		default: [],
		requiresReload: false,
	});
}
