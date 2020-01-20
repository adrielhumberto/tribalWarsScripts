let unitsTable = document.getElementById("units_table");
let villageList = {};
for (let i = 1; i < unitsTable.rows.length; i += 5) {
    let villageId = parseInt(unitsTable.rows[i].getElementsByTagName("a")[0].href.match(/village=[0-9]+/)[0].replace("village=", ""));
    let villageName = unitsTable.rows[i].getElementsByClassName("quickedit-label")[0].textContent.trim();
    let villageCoord = villageName.match(/[0-9]+\|[0-9]+/)[0];
    let villageX = parseInt(villageCoord.slice(0, 3));
    let villageY = parseInt(villageCoord.slice(-3));
    let villageContinent = villageName.slice(-3);
    let ownRow = unitsTable.rows[i];
    let inVillageRow = unitsTable.rows[i + 1];
    let awayRow = unitsTable.rows[i + 2];
    let enRouteRow = unitsTable.rows[i + 3];
    let totalRow = unitsTable.rows[i + 4];


    villageList[villageName] = {
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
    }
    // Go through every unit celll
    for (let j = 1; j < unitsTable.rows[0].cells.length - 1; j++) {
        if (!unitsTable.rows[0].cells[j + 1].firstElementChild) { // First row to get unit names and has one <td> more than the other rows because of rowspan
            break;
        }
        let src = unitsTable.rows[0].cells[j + 1].firstElementChild.getAttribute("src");
        let unit = src.substring(src.lastIndexOf("/") + 1).replace("unit_", "").replace("(1)", "").split(".")[0];
        villageList[villageName]["units"]["own"][unit] = parseInt(ownRow.cells[j].textContent);
        villageList[villageName]["units"]["inVillage"][unit] = parseInt(inVillageRow.cells[j].textContent);
        villageList[villageName]["units"]["away"][unit] = parseInt(awayRow.cells[j].textContent);
        villageList[villageName]["units"]["enRoute"][unit] = parseInt(enRouteRow.cells[j].textContent);
        villageList[villageName]["units"]["total"][unit] = parseInt(totalRow.cells[j].textContent);
    }
}

/**
 * 
 * Examples
 * 
 */

// Sum units from a location
let sumUnits = function (unit, location, continent) {
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

// Sum units in a radius
let sumUnitsRadius = function (unit, location, centerX, centerY, radius) {
    let sum = 0;
    Object.keys(villageList).forEach(function (key) {
        let village = villageList[key];
        let x = Math.abs(centerX - village.x);
        let y = Math.abs(centerY - village.y);
        let distance = Math.sqrt(x * x + y * y);
        if (distance <= radius) {
            sum += village.units[location][unit];
        }
    });
    console.log(`There are ${sum} ${unit} within a radius of ${radius} fields from ${centerX}|${centerY}`);
    return sum;
}
sumUnitsRadius("axe", "total", 454, 562, 5) // Sum of total axe count in a radius of 5 fields from 454|562