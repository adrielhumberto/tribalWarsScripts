# Global Variables in Tribal Wars

## Everywhere
- `game_data`: Game data such as player info, village info, csrf token...
- `csrf_token`: csrf token
- `premium`: `true` or `false`
- `image_base`: Base URL for images
- `BotProtect`: Google ReCaptcha, use `BotProtect.show()` to trigger ReCaptcha
- `Timing`: Server timings, offset etc.
    - `doGlobalTiming`, `getElapsedTimeSinceLoad`, `getElapsedTimeSinceData`, `getReturnTimeFromServer`, `tickHandlers`
- `Quests`: Quest infos
- `UI`: UI elements
    - `SuccessMessage("content")`
    - `ErrorMessage("content")`
    - `InfoMessage("content")`
    - `Notification`: Object
        - `show(imageUrl, "title", "content")`: Displays new notification
- `Resources`:
    - `names`: Array with resource names in local language
- `Format`: Format numbers, dates etc.
- `VillageContext`: Context menu for village, where you can select stuff like village overview, train, show in map, village info
    - `init($(element))`: Parent element of where village context should appear. It has to have the class `village_anchor`

## Village Overview
- `VillageOverview`: Group stuff, unit stuff for that particular village
    - `units`: Each element corresponds to the index in `unit_groups`  
        - `unit`: Shows every unit and its info, such as speed, local name, stealth (for spies in worlds with unit levels), amount, cost, build time etc.

        