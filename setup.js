import { prepare_settings } from "./scripts/settings.js";
import { Drawing_Tools } from "./scripts/drawing_tools.js";

export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        // main templates
        'modules/boneyard-drawing-tools/templates/quick-draw-config.hbs'
    ];
    return loadTemplates(templatePaths);
};

Hooks.once("init", async function () {await preloadHandlebarsTemplates();});

Hooks.once("init", prepare_settings);
Hooks.once("init", Drawing_Tools.init);

