## 2.0.6
- Fix for drawing config panel closing when clicking a button while the active game system is pf2e.
    - This is likely a temporary fix, as it doesn't fix the issue of receiving two `focusout` events, but does check if they were emitted with a non-null `sourceCapabilities` to check if an actual hardware item generated the event - i.e., the mouse.