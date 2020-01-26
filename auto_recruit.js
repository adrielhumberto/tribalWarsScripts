/**
 * Get total amount of units that belong to the village and current resources
 * @param {{}}} villageList Object with villages as entry
 */
function getVillageInfo(villageList) {
    $.get(`${document.location.origin}/game.php?village=${game_data.village.id}&screen=train&mode=mass&page=-1`, function (data) {
        const doc = new DOMParser().parseFromString(data, "text/html");
        const unitRecruitTable = doc.getElementById("mass_train_table").rows;
        for (let i = 1; i < unitRecruitTable.length; i++) {
            const id = parseInt(unitRecruitTable[i].cells[0].getElementsByTagName("a")[0].getAttribute("href").match(/village=[0-9]*/)[0].replace("village=", ""));
            const name = unitRecruitTable[i].cells[0].getElementsByTagName("a")[0].textContent;
            const wood = parseInt(unitRecruitTable[i].cells[1].querySelector(".res.wood").textContent.replace(".", ""));
            const stone = parseInt(unitRecruitTable[i].cells[1].querySelector(".res.stone").textContent.replace(".", ""));
            const iron = parseInt(unitRecruitTable[i].cells[1].querySelector(".res.iron").textContent.replace(".", ""));
            const farm = unitRecruitTable[i].cells[2].textContent.split("/");
            const farmSpace = parseInt(farm[1]) - parseInt(farm[0]);
            let units = {};
            for (let j = 3; j < unitRecruitTable[i].cells.length; j++) {              
                let src = unitRecruitTable[0].cells[j].firstElementChild.getAttribute("src");
                let unitName = src.substring(src.lastIndexOf("/") + 1).replace("unit_", "").replace("(1)", "").split(".")[0];
                let unitAmount = parseInt(unitRecruitTable[i].cells[j].firstElementChild.textContent.trim());
                units[unitName] = unitAmount;
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
        localStorage.autoRecruit = JSON.stringify(villageList);
    });
}

/**
 * Trains unitAmount of unit
 * @param {string}  unit        Name of unit
 * @param {number} unitAmount  Amount of unit to train
 */
function recruitUnit(unit, unitAmount) {
    let data = {h: game_data.csrf};
    data["units[" + unit + "]"] = unitAmount;
    TribalWars.post("train", {ajaxaction: "train", mode: "train"}, data, function(r) {
        if (r.success) {
            console.log(`Trained ${unitAmount} of ${unit}`);
            if (document.getElementsByClassName("current_prod_wrapper")[0]) {
                document.getElementsByClassName("current_prod_wrapper")[0].innerHTML = r.current_order;
            }
        }
    });
}


/**
 * - Get units in training -> Where? Don't send too many requests
 * - Only get units in current training for one village
 */