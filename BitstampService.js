const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');
const uuid = require('uuid/v4');

/**
 * Bitstamp API v2 wrapper
 */
class BitstampService {

    constructor() {}

    getAPICredentials() {
        return {
            clientId: process.env["BITSTAMP_CLIENT_ID"],
            apiKey: process.env["BITSTAMP_API_KEY"],
            apiSecret: process.env["BITSTAMP_API_SECRET"]
        };
    }

    getHmacDigest(secret, message) {
        const hmac = crypto.createHmac("sha256", secret);    
        hmac.update(message);
        return hmac.digest("hex");
    }

    async postAsync(uriPath, payload = {dummy:1}) { // 403 if nothing is posted...?
        const credentials = this.getAPICredentials();
        const timestamp = new Date().getTime();
        const nonce = uuid();
        const contentType = "application/x-www-form-urlencoded";
        const payloadString = querystring.stringify(payload);
        const message = "BITSTAMP " + credentials.apiKey + "POST" + "www.bitstamp.net" + "/api/v2" + uriPath
            + contentType + nonce + timestamp + "v2" + payloadString;
        const signature = this.getHmacDigest(credentials.apiSecret, message);

        try {
            const response = await axios.post("https://www.bitstamp.net/api/v2" + uriPath, payloadString, {
                headers: {
                    "X-Auth": "BITSTAMP " + credentials.apiKey,
                    "X-Auth-Signature": signature,
                    "X-Auth-Nonce": nonce,
                    "X-Auth-Timestamp": timestamp,
                    "X-Auth-Version": 'v2',
                    "Content-Type": contentType        
                },
                responseType: "arraybuffer"
            });
            if (response.status == 200 || response.status == 204) {
                var buffer = Buffer.from(response.data, "binary");
                var body = buffer.toString();
                const message = nonce + timestamp + response.headers["content-type"] + body;
                const signature = this.getHmacDigest(credentials.apiSecret, message);
                if (response.headers["x-server-auth-signature"] != signature) {
                    throw new Error("signatures do not match");
                }
                return JSON.parse(body);
            }
            else {
                throw new Error(`status: ${response.status} ${response.statusText}`);
            }
        }
        catch (err) {
            throw err;
        }
    }

    async getUserTransactionsAsync(offset) {
        return await this.postAsync("/user_transactions/", { "offset": offset});
    }

    async getBalance(currencyPair) {
        return await this.postAsync("/balance/" + (currencyPair ? `${currencyPair}/` : ""));
    }

}
exports.BitstampService = BitstampService;

exports.bitstampService = new BitstampService();
