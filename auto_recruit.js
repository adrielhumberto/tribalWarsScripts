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
        localStorage.autoRecruit = JSON.stringify(villageList);
    });
}

/**
 * Trains unitAmount of unit
 * @param {{}}}  recruitUnits Object of units to train "units[villageId][unit]"
 */
function recruitUnits(recruitUnits) {
    recruitUnits.h = game_data.csrf;
    $.ajax({
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
    }).done(function () { // TODO: Check which units have been recruited and notify user
        console.log("done");
    });
}