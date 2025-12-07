async function readJsonFile(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error("Could not load JSON file:", filename, e);
        return null;
    }
}

function makeMat4(arr) {
    return [[arr[0], arr[1], arr[2], arr[3]], [arr[4], arr[5], arr[6], arr[7]], [arr[8], arr[9], arr[10], arr[11]], [arr[12], arr[13], arr[14], arr[15],]];
}

function xform(tx, ty, tz) {
    return makeMat4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1]);
}
