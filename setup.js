import { prepare_settings } from './scripts/settings.js';
import { Drawing_Tools } from './scripts/drawing_tools.js';

Hooks.once('init', prepare_settings);
Hooks.once('init', Drawing_Tools.init);
