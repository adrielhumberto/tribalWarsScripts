// ==UserScript==
// @name Save inc in village notes
// @description Writes incoming attacks into village notes
// @author FunnyPocketBook
// @version 0.2.1
// @namespace FunnyPocketBook
// @include https://*/game.php?*
// ==/UserScript==

"use strict";

setInterval(() => {
    if (document.getElementById("incomings_amount").textContent != localStorage.incomingAttacks) {
        getAttacks();
    }
    localStorage.incomingAttacks = document.getElementById("incomings_amount").textContent;
}, 1000);

function getAttacks() {
    let incUrl = window.location.origin + "/game.php?village=" + game_data.village.id + "&screen=overview_villages&mode=incomings&subtype=attacks";
    $.get(incUrl, function (r) {
        let dom = (new DOMParser()).parseFromString(r, "text/html");
        parseAttacks(dom);
    });
}

function parseAttacks(dom) {
    let incRows = dom.getElementById("incomings_table").rows;
    let text = [];
    for (let i = 1; i < incRows.length - 1; i++) {
        text.push(getAttackInfo(incRows[i].querySelectorAll("td")));
    }
    writeNote(text);
}

function getAttackInfo(r) {
    let ret = [];
    r.forEach((row) => {
        ret.push(row.innerText.trim());
    });
    return ret;
}

function writeNote(text) {
    let villageNote = "";
    text.forEach((t) => {
        villageNote += t.join(", ") + "\n";
    })
    let noteUrl = window.location.origin + "/game.php?village=" + game_data.village.id + "&screen=api&ajaxaction=village_note_edit";
    let data = {
        village_id: game_data.village.id,
        note: villageNote,
        h: game_data.csrf
    };
    $.post(noteUrl, data);
}