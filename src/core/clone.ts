// A deep copy of plain data (numbers, strings, booleans, arrays, objects): what a battle or a run is made of. JSON is enough
// and works in the pure core (no DOM or Node API); never use it for dates, functions or class instances.
export const cloneData = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
