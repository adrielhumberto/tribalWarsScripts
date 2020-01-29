/**
 * Writes text into notebook
 * @param {string} text Text to write into notebook. "\n" for new line
 */
function writeNote(text) {
    let villageNote = "";
    $.get(`${document.location.origin}/game.php?village=${game_data.village.id}&screen=overview&ajax=edit_notes_popup`, function (r) {
        villageNote = (new DOMParser()).parseFromString(r, "text/html").querySelector("#message").textContent + "\n";
    }).done(function () {
        villageNote += text;
        let noteUrl = `${document.location.origin}/game.php?village=${game_data.village.id}&screen=api&ajaxaction=village_note_edit`;
        let data = {
            village_id: game_data.village.id,
            note: villageNote,
            h: game_data.csrf
        };
        $.post(noteUrl, data);
    });
}