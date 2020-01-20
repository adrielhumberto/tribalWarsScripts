function getMemberTroops(player_id) {
    let playerTroops = {};
    $.ajax({
        url: `${window.location.origin}/game.php?screen=ally&mode=members_troops&player_id=${player_id}&village=${game_data.village.id}`,
        type: "GET",
        headers: {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "TribalWars-Ajax": 1
        }
    }).done(function (response) {
        const parser = new DOMParser();
        let dom = parser.parseFromString(response, "text/html");
        let selection = dom.getElementsByClassName("input-nicer")[0];
        let playerName = selection[selection.selectedIndex].textContent.trim();
        let table = dom.getElementsByClassName("w100")[0];
        let units = getUnits(table);
        playerTroops[playerName] = units;
        console.log(playerTroops);
        return playerTroops;
    });
}
 
function getUnits(table) {
    let playerTroops = {};
    for (let i = 1; i < table.rows[0].cells.length; i++) {
        let src = table.rows[0].cells[i].firstElementChild.getAttribute("src");
        let unit = src.substring(src.lastIndexOf("/") + 1).replace("unit_", "").replace("(1)", "").split(".")[0];
        let unitCount = 0;
        for (let j = 1; j < table.rows.length; j++) {
            unitCount += parseInt(table.rows[j].cells[i].textContent.trim().replace(".", ""));
        }
        playerTroops[unit] = unitCount;
    }
    return playerTroops;
}