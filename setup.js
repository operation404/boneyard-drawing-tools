import { prepare_settings } from './scripts/settings.js';
import { Drawing_Tools } from './scripts/drawing_tools.js';
import { Color_Selector } from './scripts/color_selector.js';

Hooks.once('init', async () => {
	prepare_settings();
	await Color_Selector.loadTemplate();
	Drawing_Tools.init();
});
