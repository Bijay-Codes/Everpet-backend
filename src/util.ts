

export function formatAsRows(data: object): [string, string, unknown[]] {
    const columns = Object.keys(data);
    const rows = Object.values(data);
    const columnsQuerry = columns.join(', ');
    const rowsQuerry = rows.map((_, i) => `$${i + 1}`).join(', ');
    return [columnsQuerry, rowsQuerry, rows];
}
export function isValidInitialData(petData: { name: string, age: number, species: string }) {
    if (petData.name && petData.name.length <= 40) {
        if (petData.species) {
            return true;
        }
    } else {
        return false;
    }
}

