const axios = require('axios');

async function notify(message) {
    const url = process.env["SLACK_WEBHOOK_URL"];
    console.log(url);
    console.log(message);
    await axios.post(url, { text : message });
}

exports.notify = notify;
