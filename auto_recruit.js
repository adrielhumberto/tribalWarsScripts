const locales = {
    "en": {
        "train": {
            "errorTrainUnit": "A problem occurred recruiting some units.",
            "successTrainUnit": "All units have been recruited successfully."
        },
        "fields": {
            "recruitUnits": "Recruit",
            "selectGroup": "Select Group",
            "village": "Village",
            "units": "Units",
            "puffer": "Puffer"
        },
        "util": {
            "lookAtConsole": "Please open the browser console for more information."
        }
    },
    "de": {
        "train": {
            "errorTrainUnit": "Es gab ein Problem bei der Rekrutierung einiger Einheiten.",
            "successTrainUnit": "Alle Einheiten wurden erfolgreich rekrutiert."
        },
        "fields": {
            "recruitUnits": "Rekrutieren",
            "selectGroup": "Gruppe Auswählen",
            "village": "Dorf",
            "units": "Einheiten",
            "puffer": "Puffer"
        },
        "util": {
            "lookAtConsole": "Bitte öffne die Browser-Konsole für mehr Informationen."
        }
    }
};
const locale = locales[game_data.locale.split("_")[0]];

/**
 * Get total amount of units that belong to the village, current resources and group info
 * @param {{}} villageList Object with villages as entry
 */
function getVillageInfo(villageList) {
    return $.get(`${document.location.origin}/game.php?village=${game_data.village.id}&screen=train&mode=mass&page=-1`, function (data) {
        const doc = new DOMParser().parseFromString(data, "text/html");
        const unitRecruitTable = doc.getElementById("mass_train_table").rows;
        for (let i = 1; i < unitRecruitTable.length; i++) {
            const id = parseInt(unitRecruitTable[i].cells[0].getElementsByTagName("a")[0].getAttribute("href").match(/village=[0-9]*/)[0].replace("village=", ""));
            const name = unitRecruitTable[i].cells[0].getElementsByTagName("a")[0].textContent;
            const wood = parseInt(unitRecruitTable[i].cells[1].querySelector(".wood").textContent.replace(".", ""));
            const stone = parseInt(unitRecruitTable[i].cells[1].querySelector(".stone").textContent.replace(".", ""));
            const iron = parseInt(unitRecruitTable[i].cells[1].querySelector(".iron").textContent.replace(".", ""));
            const farm = unitRecruitTable[i].cells[2].textContent.split("/");
            const farmSpace = parseInt(farm[1]) - parseInt(farm[0]);
            let units = {};
            // Gets unit info
            for (let j = 3; j < unitRecruitTable[i].cells.length; j++) {
                let src = unitRecruitTable[0].cells[j].firstElementChild.getAttribute("src");
                let unitName = src.substring(src.lastIndexOf("/") + 1).replace("unit_", "").replace("(1)", "").split(".")[0];
                let unitAmount = parseInt(unitRecruitTable[i].cells[j].firstElementChild.textContent.trim());
                if (isNaN(unitAmount)) {
                    unitAmount = 0;
                }
                let unitInTraining = 0;
                if (unitRecruitTable[i].cells[j].firstElementChild.getElementsByTagName("img")[0]) {
                    unitInTraining = parseInt(unitRecruitTable[i].cells[j].firstElementChild.getElementsByTagName("img")[0].getAttribute("title"));
                }
                let unitTrainableAmount = parseInt(unitRecruitTable[i].cells[j].children[3].textContent.replace(/\(|\)/g, ""));
                if (isNaN(unitTrainableAmount)) {
                    unitTrainableAmount = 0;
                }
                units[unitName] = {
                    "currentAmount": unitAmount,
                    "trainableAmount": unitTrainableAmount,
                    "inTraining": unitInTraining
                };
            }
            if (!villageList[id]) {
                villageList[id] = {};
            }
            villageList[id].villageInfo = {
                "id": id,
                "name": name,
                "wood": wood,
                "stone": stone,
                "iron": iron,
                "farmSpace": farmSpace
            };
            villageList[id].units = units;
        }
        
        TribalWars.get("groups", { ajax: "load_groups" }, function (response) {
            villageList.groups = response.result;
        });
        localStorage.autoRecruit = JSON.stringify(villageList);
    });
}

/**
 * Trains units
 * @param {{}}  recruitUnits Object of units to train "units[villageId][unit]"
 */
function recruitUnits(recruitUnits) {
    recruitUnits.h = game_data.csrf;
    return $.ajax({
        url: `${document.location.origin}/game.php?village=${game_data.village.id}&screen=train&mode=success&action=train_mass&page=-1`,
        type: "post",
        data: recruitUnits,
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Content-Type": "application/x-www-form-urlencoded",
            "Upgrade-Insecure-Requests": 1
        },
        // Remove "X-Requested-With" header
        xhr: function () {
            let xhr = $.ajaxSettings.xhr();
            let setRequestHeader = xhr.setRequestHeader;
            xhr.setRequestHeader = function (name, value) {
                if (name == "X-Requested-With") return;
                setRequestHeader.call(this, name, value);
            };
            return xhr;
        },
    })
        // Nofity user what has been recruited and if there were any problems
        .done(function (r) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(r, "text/html");
            let errors = doc.getElementsByClassName("error_box");
            if (errors.length !== 0) {
                let villageName = doc.getElementById("menu_row2_village").textContent.trim();
                let villageCoord = doc.getElementById("menu_row2_village").nextElementSibling.textContent.trim();
                UI.ErrorMessage(locale.train.errorTrainUnit + ".\n " + locale.util.lookAtConsole);
                console.log(locale.train.errorTrainUnit);
                for (let error of errors) {
                    console.log(`${villageName} ${villageCoord} ${error.textContent.trim()}`);
                }
            } else {
                console.log(locale.train.successTrainUnit);
                const table = doc.getElementsByClassName("vis")[0].rows;
                for (let i = 1; i < table.length; i++) {
                    const villageName = table[i].cells[0].textContent.trim();
                    const unitsNodes = table[i].cells[1].childNodes;
                    let units = "";
                    for (let j = 1; j < unitsNodes.length; j += 2) {
                        var unitName = unitsNodes[j].getAttribute("title");
                        units += unitName + ": " + parseInt(unitsNodes[j + 1].textContent.trim()) + ", ";
                    }
                    console.log(villageName + ": " + units.substring(0, units.length - 2));
                }
            }
        });
}

/**
 * Creates a table in any screen to setup auto recruit
 * @param {Object} villageList Object generated by getVillageInfo()
 */
function createTable(villageList) {
    const rowColor = ["row_a", "row_b"];
    let counter = 0;
    let table = `
    <table class="vis" width="100%">
        <thead>
            <tr>
                <th>${locale.fields.village}</th>
                <th>${locale.fields.puffer}</th>`;
    for (let unit of game_data.units) {
        if (!unit.includes("snob") && !unit.includes("militia") && !unit.includes("knight")) {
            table += `
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="${unit}">
                    <img src="${image_base}unit/unit_${unit}.png" title="${unit}" alt="" class="">
                </a>
            </th>`;
        }
    }
    table += "</thead>";
    Object.keys(villageList).forEach(function (villageId) {
        let village = villageList[villageId];
        let villageName = village.villageInfo.name;
        let units = village.units;
        table += `
        <tr class="${rowColor[counter++ % 2]}">
            <td class="vis_item">
                <input class="am_troops_edit" type="checkbox" name="edit[]" value="${villageId}" style="float: left;">
                <span>
                    <span class="village_anchor" data-player="${game_data.player.id}" data-id="${villageId}">
                        <a href="${game_data.link_base_pure}info_village&id=${villageId}">${villageName}</a>
                    </span>
                </span>
            </td>
            <td>
                <span class="icon header wood"></span>
                 
                <span data-field="buffer_wood">${village.villageInfo.wood}</span>
                 
                <span class="icon header stone"></span>
                 
                <span data-field="buffer_stone">${village.villageInfo.stone}</span>
                 
                <span class="icon header iron"></span>
                 
                <span data-field="buffer_iron">${village.villageInfo.iron}</span>
                 
                <span class="icon header population"></span>
                 
                <span data-field="buffer_pop">${village.villageInfo.farmSpace}</span>
            </td>`;
        for (let unitName of game_data.units) {
            if (!unitName.includes("snob") && !unitName.includes("militia") && !unitName.includes("knight")) {
                table += `
                <td>
                    <span>${units[unitName].currentAmount}</span>
                    <br>
                    <span">${units[unitName].inTraining}</span>
                    <br>
                    <span data-field="${unitName}">${units[unitName].trainableAmount}</span>
                </td>`;
            }
        }
    });
    table += "</tbody></table>";
    document.getElementById("content_value").innerHTML = table;
    VillageContext.init($("#content_value"));
}

/**
 * Asynchronous version of createTable()
 * @param {Object} villageList Object generated by getVillageInfo()
 */
async function createTableAsync(villageList) {
    await getVillageInfo(villageList);
    createTable(villageList);
}

let villageList = {};
createTableAsync(villageList);