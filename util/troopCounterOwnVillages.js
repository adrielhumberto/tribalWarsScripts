let unitsTable = document.getElementById("units_table");
let villageList = {};
for (let i = 1; i < unitsTable.rows.length; i += 5) {
    let villageId = unitsTable.rows[i].getElementsByTagName("a")[0].href.match(/village=[0-9]+/)[0].replace("village=", "");
    let villageName = unitsTable.rows[i].getElementsByClassName("quickedit-label")[0].textContent.trim();
    let villageCoord = villageName.match(/[0-9]+\|[0-9]+/)[0];
    let villageX = villageCoord.slice(0,3);
    let villageY = villageCoord.slice(4);
    let ownRow = unitsTable.rows[i];
    let inVillageRow = unitsTable.rows[i+1];
    let awayRow = unitsTable.rows[i+2];
    let enRouteRow = unitsTable.rows[i+3];
    let totalRow = unitsTable.rows[i+4];

    
    villageList[villageName] = {
        "id": villageId,
        "name": villageName,
        "coords": villageCoord,
        "x": villageX,
        "y": villageY,
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