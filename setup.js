import { prepare_settings } from "./scripts/settings.js";
import { Drawing_Tools, Drawing_Tools_2 } from "./scripts/drawing_tools.js";

console.log("\n\n\ndrawing tools testing\n\n\n");

export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        // main templates
        'modules/boneyard-drawing-tools/templates/quick-draw-config.html',
        // partials
        'modules/boneyard-drawing-tools/templates/color-selector.html'
    ];
    return loadTemplates(templatePaths);
};

Hooks.once("init", async function () {await preloadHandlebarsTemplates();});

Hooks.once("init", prepare_settings);
//Hooks.once("init", Drawing_Tools.init); // This may need to be 'setup'
Hooks.once("init", Drawing_Tools_2.init); // This may need to be 'setup'

