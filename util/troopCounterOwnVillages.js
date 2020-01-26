let villageList = {};
let unitSpeed = {};
const unitSpeedHttp = new XMLHttpRequest();
const urlUnitSpeed = "https://" + document.domain + "/interface.php?func=get_unit_info";
unitSpeedHttp.onreadystatechange = () => {
    if (unitSpeedHttp.readyState === 4 && unitSpeedHttp.status === 200) {
        const r = unitSpeedHttp.responseXML;
        for (let unit of game_data.units) {
            unitSpeed[unit] = parseFloat(r.querySelector("config > " + unit + " > speed").textContent);
        }
    }
};
// TODO: async await
unitSpeedHttp.open("GET", urlUnitSpeed, false);
unitSpeedHttp.send();
const villageListHttp = new XMLHttpRequest();
const urlVillageList = document.location.origin + "/game.php?village=" + game_data.village.id + "&screen=overview_villages&type=complete&mode=units&group=0&";
villageListHttp.onreadystatechange = () => {
    if (villageListHttp.readyState === 4 && villageListHttp.status === 200) {
        const parser = new DOMParser();
        const dom = parser.parseFromString(villageListHttp.responseText, "text/html");
        const unitsTable = dom.getElementById("units_table");
        for (let i = 1; i < unitsTable.rows.length; i += 5) {
            const villageId = parseInt(unitsTable.rows[i].getElementsByTagName("a")[0].href.match(/village=[0-9]+/)[0].replace("village=", ""));
            const villageName = unitsTable.rows[i].getElementsByClassName("quickedit-label")[0].textContent.trim();
            const villageCoord = villageName.match(/[0-9]+\|[0-9]+/)[0];
            const villageX = parseInt(villageCoord.slice(0, 3));
            const villageY = parseInt(villageCoord.slice(-3));
            const villageContinent = villageName.slice(-3);
            const ownRow = unitsTable.rows[i];
            const inVillageRow = unitsTable.rows[i + 1];
            const awayRow = unitsTable.rows[i + 2];
            const enRouteRow = unitsTable.rows[i + 3];
            const totalRow = unitsTable.rows[i + 4];


            villageList[villageId] = {
                "id": villageId,
                "name": villageName,
                "coords": villageCoord,
                "x": villageX,
                "y": villageY,
                "continent": villageContinent,
                "units": {
                    "own": {},
                    "inVillage": {},
                    "away": {},
                    "enRoute": {},
                    "total": {}
                }
            };
            // Goes through every unit cell and fetch the unit amount
            for (let j = 1; j < unitsTable.rows[0].cells.length - 1; j++) {
                if (!unitsTable.rows[0].cells[j + 1].firstElementChild) { // First row to get unit names and has one <td> more than the other rows because of rowspan
                    break;
                }
                let src = unitsTable.rows[0].cells[j + 1].firstElementChild.getAttribute("src");
                let unit = src.substring(src.lastIndexOf("/") + 1).replace("unit_", "").replace("(1)", "").split(".")[0];
                villageList[villageId]["units"]["own"][unit] = parseInt(ownRow.cells[j + 1].textContent);
                villageList[villageId]["units"]["inVillage"][unit] = parseInt(inVillageRow.cells[j].textContent);
                villageList[villageId]["units"]["away"][unit] = parseInt(awayRow.cells[j].textContent);
                villageList[villageId]["units"]["enRoute"][unit] = parseInt(enRouteRow.cells[j].textContent);
                villageList[villageId]["units"]["total"][unit] = parseInt(totalRow.cells[j].textContent);
            }
        }
    }
};
// TODO: async await
villageListHttp.open("GET", urlVillageList, false);
villageListHttp.send();


/**
 * 
 * Examples
 * 
 */

/**
 * Sums units from a location
 * @param {String} unit unit name
 * @param {String} location location of units ("own", "inVillage", "away", "enRoute", "total")
 * @param {String} continent continent of units ("K[0-99]", "all")
 * @returns {Integer} Sum of unit in the village that are in location
 */
function sumUnits(unit, location, continent) {
    let sum = 0;
    Object.keys(villageList).forEach(function (key) {
        let village = villageList[key];
        if (continent === "all" || continent === village.continent) {
            sum += village.units[location][unit];
        }
    });
    console.log(`There are ${sum} ${unit} in ${continent} that are ${location}`);
    return sum;
}
sumUnits("spear", "inVillage", "all"); // Sum of all spear in village from all continents
sumUnits("axe", "own", "K54"); // Sum of all spear that belong to you and are in the village in continent 54


/**
 * Sums units in a radius
 * @param {String} unit name of unit
 * @param {String} location location of units ("own", "inVillage", "away", "enRoute", "total")
 * @param {Integer} centerX x-coordinate of circle center
 * @param {Integer} centerY y-coordinate of circle center
 * @param {Integer} radius radius in fields of circle
 * @returns {Integer} Sum of unit in the village that are in location within the radius
 */
function sumUnitsRadius(unit, location, centerX, centerY, radius) {
    let sum = 0;
    Object.keys(villageList).forEach(function (key) {
        const village = villageList[key];
        const x = Math.abs(centerX - village.x);
        const y = Math.abs(centerY - village.y);
        const distance = Math.sqrt(x * x + y * y);
        if (distance <= radius) {
            sum += village.units[location][unit];
        }
    });
    console.log(`There are ${sum} ${unit} in ${location} within a radius of ${radius} fields from ${centerX}|${centerY}`);
    return sum;
}
sumUnitsRadius("axe", "total", 454, 562, 5); // Sum of total axe count in a radius of 5 fields from 454|562


/**
 * Gets all villages that can send a backtime to target
 * @param {Date} targetDate Date of when enemy troops return to the village
 * @param {Integer} targetX x-coordinate of enemy village
 * @param {Integer} targetY y-coordinate of enemy village
 * @param {String[]} units Array with units to include. ["all"] to include every unit
 * @returns {Object} Returns object with villages as keys that can send backtimes. Each village has units as keys that are fast enough for a backtime
 */
function backtimeVillages(targetDate, targetX, targetY, units) {
    let backtimeVillages = { "targetVillage": targetX + "|" + targetY };
    // Goes through every village in villageList and calculates the distance from village to targetVillage
    Object.keys(villageList).forEach(function (villageId) {
        const village = villageList[villageId];
        const x = Math.abs(targetX - village.x);
        const y = Math.abs(targetY - village.y);
        const distance = Math.sqrt(x * x + y * y);
        // Goes through every unit in village and calculates runtime to targetVillage
        Object.keys(village.units.own).forEach(function (unit) {
            const runtimeMs = unitSpeed[unit] * distance * 60 * 1000; // Time for unit to travel in milliseconds
            const sendBacktimeDate = new Date(targetDate - runtimeMs); // Calculates when unit has to be sent in order to arrive on targetDate
            // Checks if sendBacktimeDate is in the future (meaning sending backtime is possible) and the amount of unit that should be sent is in the village, ready to be sent
            if ((units.includes("all") || units.includes(unit)) && sendBacktimeDate > new Date() && village.units.own[unit] > 0) {
                if (!backtimeVillages[villageId]) {
                    backtimeVillages[villageId] = {
                        "coords": village.coords,
                        "y": village.y,
                        "x": village.x,
                        "name": village.name,
                        "id": village.id
                    };
                }
                backtimeVillages[villageId][unit] = {
                    "sendDate": sendBacktimeDate,
                    "amount": village.units.own[unit]
                };
            }
        });
    });
    console.log(`Villages that can send backtime to ${targetX}|${targetY} to arrive at ${targetDate}:`);
    console.log(backtimeVillages);
    console.log(Object.keys(backtimeVillages).length);
    return backtimeVillages;
}

const dateNow = new Date();
const arrivalDate = new Date(dateNow.setHours(dateNow.getHours() + 4)); // Enemy troops are returning 4 hours from now
let backUnits = backtimeVillages(arrivalDate, 447, 533, ["axe", "light", "snob"]);


/**
 * Returns a sorted array by date for each unit in the backtimeObject
 * @param {Object} backtimeObject Object returned by backtimeVillages
 * @returns Array of units by ascending date
 */
function sortUnitByDate(backtimeObject) {
    let units = [];
    // Goes through every village and entry in that village object. Creates a new array element if entry is a unit
    Object.values(backtimeObject).forEach(function (village) {
        Object.keys(village).forEach(function (unit) {
            if (game_data.units.includes(unit)) {
                let unitObj = village[unit];
                let obj = {
                    "villageId": village.id,
                    "villageName": village.name,
                    "villageCoords": village.coords,
                    "sendDate": unitObj.sendDate,
                    "unitAmount": unitObj.amount,
                    "unitName": unit
                };
                units.push(obj);
            }
        });
    });
    // Sorts array ascending by date
    units.sort(function (a, b) {
        return new Date(a.sendDate) - new Date(b.sendDate);
    });
    return units;
}
let sortedUnits = sortUnitByDate(backUnits);


/**
 * Creates a new popup window with a table of backtimes
 * @param {Object[]} sortedUnits Array of objects returned by sortUnitByDate
 */
function parseBacktime(sortedUnits) {
    let main_div = "<div id='bb_main_div' class='popup_stlye' style='display: block; top: 100px; left: 700px; z-index: 99999; position: fixed; border-radius: 8px; border: 2px #804000 solid; background-color: #F1EBDD'></div>";
    let close_button = "<div class='popup_menu'><a href='Javascript:void(0);' id='a_close'>Close</a></div>";
    let output_text = "<div class='popup_content' style='padding 8px'><h3 align='center'>Backtime</h3></br><table><thead><tr><th>Village</th><th>Unit</th><th>Amount</th><th>Send Date</th></tr></thead><tbody>";
    const rowColor = ["row_a", "row_b"];
    let counter = 0;
    $("body").append(main_div);
    $("#bb_main_div").draggable();
    $("#bb_main_div").append(close_button);
    $("#a_close").click(function () {
        $("#bb_main_div").remove();
    });
    sortedUnits.forEach(function (entry) {
        output_text += `
        <tr class="${rowColor[counter++ % 2]}">
            <td><a href="/game.php?village=${entry.villageId}&screen=overview">${entry.villageName}</a></td>
            <td><img src="${image_base}unit/unit_${entry.unitName}.png" title="${entry.unitName}" alt="" class=""></td>
            <td>${entry.unitAmount}</td>
            <td>${formatDateTW(entry.sendDate)}</td>
        </tr>`;
    });
    output_text += "</tbody></div>";
    $("#bb_main_div").append(output_text);
}
parseBacktime(sortedUnits);

/**
 * Formats date in format of game locale
 * @param {Date} date Date to be formatted
 */
function formatDateTW(date) {
    const options = {
        "weekday": "short",
        "year": "2-digit",
        "month": "2-digit",
        "day": "2-digit",
        "hour": "2-digit",
        "minute": "2-digit",
        "second": "2-digit",
        "hour12": false
    };
    return date.toLocaleDateString(game_data.locale.replace("_", "-"), options);
}