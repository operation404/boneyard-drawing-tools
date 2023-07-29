import {
    MODULE,
    SETTING_SIDEBAR_BUTTONS,
    LAST_TOOL
} from "./constants.js";

export function prepare_settings() {

    
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

    game.settings.register(MODULE, LAST_TOOL, {
        name: "SETTINGS.Targeting_Mode_Name",
        hint: "SETTINGS.Targeting_Mode_Hint",
        scope: 'world', // "world" = sync to db, "client" = local storage
        config: false, // false if you dont want it to show in module config
        type: String, // Number, Boolean, String, Object
        default: "stroke",
        requiresReload: false,
        //onChange: value => {}, // value is the new value of the setting
    });
    

}