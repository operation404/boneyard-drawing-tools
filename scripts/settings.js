import {
    MODULE,
    SETTING_SIDEBAR_BUTTONS
} from "./constants.js";

export function prepare_settings() {

    // TODO This currently serves no purpose...

    game.settings.register(MODULE, SETTING_SIDEBAR_BUTTONS, {
        name: "SETTINGS.Targeting_Mode_Name",
        hint: "SETTINGS.Targeting_Mode_Hint",
        scope: 'world', // "world" = sync to db, "client" = local storage
        config: true, // false if you dont want it to show in module config
        type: Boolean, // Number, Boolean, String, Object
        default: true,
        requiresReload: true,
        //onChange: value => {}, // value is the new value of the setting
    });
    
}