// The ground tiles of `maps.json` terrain in the admin: their names and the colours they are drawn in. Pure (the publish checks read
// the names too, outside the page).

/** The tiles of `maps.json` terrain, with their names in the admin. */
export const GROUND = [['.', 'Đất'], [',', 'Đường'], ['=', 'Cầu'], ['#', 'Vách / tường'], ['~', 'Nước'], ['^', 'Đất cao'], ['s', 'Bậc đá'], ['c', 'Đất tha hóa'], ['F', 'Vách cao nguyên'], ['w', 'Thác nước']] as const;
export const COLOUR: Record<string, string> = { '.': '#bfe09f', ',': '#e6d3a3', '=': '#c49a68', '#': '#5c7a4a', '~': '#7fc4e8', '^': '#d6efb8', s: '#cdb68a', c: '#c9a8dc', F: '#8a7a62', w: '#b8e4f8' };
