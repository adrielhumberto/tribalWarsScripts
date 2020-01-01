let playerList = [];

let inputIncludePlayer = "<h4>Get coordinates of players</h4><div><textarea id='playerList' name='playerList'></textarea></div> <button id='playerListOk' class='btn'>OK</button><p><span id='errorPlayer'></span></p><p><span id='addedVillages'></span></p>";
let inputExcludePlayer = "<h4>Get coordinates of all players except</h4><div><textarea id='playerExcludeList' name='playerExcludeList'></textarea></div> <button id='playerExcludeOk' class='btn'>OK</button><p>";
let outputCoords = "<h4>Resulting coordinates</h4><div><textarea id='coordTextarea' name='coordTextarea'></textarea></div>";
let targetElement = $("#overviewtable");
targetElement.prepend($(outputCoords));
targetElement.prepend($(inputExcludePlayer));
targetElement.prepend($(inputIncludePlayer));

$("#playerExcludeOk").click(function () {
    localStorage.villageList = "";
    let lines = $("#playerExcludeList").val().split('\n');
    for (let i = 0; i < lines.length; i++) {
        let player = lines[i].replace(" ", "+");
        if (player === "") {
            continue;
        }
        if (!playerList.includes(player)) {
            playerList.push(player);
        } else {
            document.querySelector("#addedVillages").innerHTML += player + " is already in here! <br />";
        }
    }
    console.log(playerList);
    $.get("/map/player.txt", function (playerData) {
        $.get("/map/village.txt", function (villageData) {
            let allPlayers = parsePlayer(playerData, villageData);
            let allCoords = getVillagesAllFormatted(allPlayers, playerList, "exclude");
            $("#coordTextarea").val(allCoords);
            playerList = [];
        });
    });
});

$("#playerListOk").click(function () {
    localStorage.villageList = "";
    let lines = $("#playerList").val().split('\n');
    for (let i = 0; i < lines.length; i++) {
        playerList.push(lines[i].replace(" ", "+"));
    }
    console.log(playerList);
    $.get("/map/player.txt", function (playerData) {
        $.get("/map/village.txt", function (villageData) {
            let allPlayers = parsePlayer(playerData, villageData);
            let allCoords = getVillagesAllFormatted(allPlayers, playerList, "include");
            $("#coordTextarea").val(allCoords);
            playerList = [];
        });
    });
});

function parsePlayer(playerData, villageData) {
    let allPlayers = {};
    let tempPlayers = [];
    let tempVillages = [];
    playerData.split("\n").forEach((p) => {
        tempPlayers.push(p.split(","));
    });
    villageData.split("\n").forEach((v) => {
        tempVillages.push(v.split(","));
    });
    tempPlayers.forEach((p) => {
        allPlayers[p[1]] = {
            id: p[0],
            name: p[1],
            tribe_id: p[2],
            village_amount: p[3],
            points: p[4],
            rank: p[5],
            villages: []
        };
    });
    allPlayers.Barbarian = { villages: []};
    tempVillages.forEach((v) => {
        if (v[4] === "0") {
            let playerName = "Barbarian";
            allPlayers[playerName].villages.push({
                id: v[0],
                name: v[1],
                x: v[2],
                y: v[3],
                player_id: v[4],
                points: v[5],
                rank: v[6],
                formatted: v[0] + "&" + v[2] + "|" + v[3]
            });
        } else {
            let playerName = idToPlayer(v[4], playerData);
            if (playerName != undefined) {
                allPlayers[playerName].villages.push({
                    id: v[0],
                    name: v[1],
                    x: v[2],
                    y: v[3],
                    player_id: v[4],
                    points: v[5],
                    rank: v[6],
                    formatted: v[0] + "&" + v[2] + "|" + v[3]
                });
            }
        }
    });
    return allPlayers;
}


function idToPlayer(id, playerData) {
    let r;
    playerData.split("\n").forEach((p) => {
        let player = p.split(",");
        if (player[0] == id) {
            r = player[1];
        }
    });
    return r;
}

function getPlayerVillagesFormatted(playerName, allPlayers) {
    let villages = [];
    let counter = 0;
    allPlayers[playerName].villages.forEach((v) => {
        counter++;
        villages.push(v.formatted);
    });
    return [villages, counter];
}

function getVillagesAllFormatted(allPlayers, playerList, exOrIn) {
    let villages = "";
    let counter = 0;
    if (exOrIn == "exclude") {
        Object.keys(allPlayers).forEach((k) => {
            if (!playerList.includes(k) && allPlayers[k].village_amount > 0) {
                villagesFormatted = getPlayerVillagesFormatted(k, allPlayers);
                counter += villagesFormatted[1];
                if (villages == "") {
                    villages += villagesFormatted[0].join(",");
                } else {
                    villages += "," + villagesFormatted[0].join(",");
                }
            }
        });
        if (!playerList.includes("Barbarian")) {
            villageBarbs = getAllBarbs(allPlayers);
            villages += "," + villageBarbs[0];
            counter += villageBarbs[1];
        }
    } else if (exOrIn == "include") {
        Object.keys(allPlayers).forEach((k) => {
            if (playerList.includes(k) && allPlayers[k].village_amount > 0) {
                villagesFormatted = getPlayerVillagesFormatted(k, allPlayers);
                counter += villagesFormatted[1];
                if (villages == "") {
                    villages += villagesFormatted[0].join(",");
                } else {
                    villages += "," + villagesFormatted[0].join(",");
                }
            }
        });
        if (playerList.includes("Barbarian")) {
            villageBarbs = getAllBarbs(allPlayers);
            counter += villageBarbs[1];
            if (villages === "") {
                villages += villageBarbs[0];
            } else {
                villages += "," + getAllBarbs(allPlayers)[0];
            }
        }
    }
    console.log("Collected coords: " + counter);
    return villages;
}


function getAllBarbs(allPlayers) {
    let villageList = allPlayers.Barbarian.villages;
    let villages = "";
    let counter = 0;
    villageList.forEach((v) => {
        counter++;
        if (villages == "") {
            villages += v.formatted;
        } else {
            villages += "," + v.formatted;
        }
    });
    return [villages, counter];
} 
