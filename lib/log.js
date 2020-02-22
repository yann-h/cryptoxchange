exports.log = function log(message, data) {
    if (message) {
        const now = new Date().toISOString();
        console.log(`${now}:${message}`);
    }
    if (data) {
        console.log(data);
    }
}
