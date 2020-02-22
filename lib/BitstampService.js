const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');
const uuid = require('uuid/v4');
const util = require('util');
const sleep = util.promisify(setTimeout);

/**
 * Bitstamp API v2 wrapper
 */
class BitstampService {

    constructor(log = (_, __) => {}) {
        this.log = log;
    }

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

    async getOpenOrders(currencyPair) {
        return await this.postAsync("/open_orders/" + (currencyPair ? `${currencyPair}/` : "all/"));
    }

    async cancelOrder(id) {
        return await this.postAsync("/cancel_order/", { id: id });
    }

    async buy(currencyPair, amount, price, limitPrice, dailyOrder, iocOrder) {
        return await this.buyOrSell("buy", currencyPair, amount, price, limitPrice, dailyOrder, iocOrder);
    }

    async sell(currencyPair, amount, price, limitPrice, dailyOrder, iocOrder) {
        return await this.buyOrSell("sell", currencyPair, amount, price, limitPrice, dailyOrder, iocOrder);
    }

    /**
     * "error: Only one of optional parameters can be set" => only one of dailyOrder or iocOrder
     * @param {*} action 
     * @param {*} currencyPair 
     * @param {*} amount "error: Ensure that there are no more than 8 decimal places"
     * @param {*} price  "error: Ensure that there are no more than 2 decimal places"
     * @param {*} limitPrice 
     * @param {*} dailyOrder 
     * @param {*} iocOrder 
     */
    async buyOrSell(action, currencyPair, amount, price, limitPrice, dailyOrder, iocOrder) {
        const options = {
            amount: amount,
            price: price
        };

        if (limitPrice) {
            options.limit_price = limitPrice;
        }

        if (dailyOrder) {
            options.daily_order = dailyOrder;
        }

        if (iocOrder) {
            options.ioc_order = iocOrder;
        }

        return await this.postAsync(`/${action}/${currencyPair}/`, options);
    }

    async getTicker(currencyPair) {
        try {
            const response = await axios.get("https://www.bitstamp.net/api/v2" + "/ticker/" + currencyPair);
            if (response.status != 200) {
                throw new Error(`status: ${response.status} ${response.statusText}`);
            }
            return response.data;
        }
        catch (err) {
            throw err;
        }
    }

    async waitForOrderCompletion(id) {
        const waitSeconds = [0, 30, 60, 180, 300, 600, 900, 1800];
        let round = 0;
        
        for (let wait of waitSeconds) {
            this.log(`getting opened orders at round ${round}`);
            let openOrders = await this.getOpenOrders();
            this.log(null, openOrders);
            if (openOrders.filter(order => order.id == id).length == 0) {
                this.log(`order ${id} is not opened anymore`);
                return true;
            }
            await sleep(wait * 1000);
            round++;
        }
        
        this.log(`cancelling order ${id}`);
        const orderCancellation = await this.cancelOrder(id);
        this.log(`order ${id} cancelled`, orderCancellation);
        return false;
    }

    async waitForOrdersCompletion() {
        const waitSeconds = [0, 30, 60, 180, 300, 600, 900, 1800, 3600];
        let round = 0;
        let openOrders = [];

        for (let wait of waitSeconds) {
            this.log(`getting opened orders at round ${round}`);
            openOrders = await this.getOpenOrders();
            this.log(null, openOrders);
            if (openOrders.length == 0) {
                this.log(`all orders are closed`);
                return true;
            }
            await sleep(wait * 1000);
            round++;
        }
        
        this.log(`cancelling orders`);
        for (let order of openOrders) {
            const orderCancellation = await this.cancelOrder(order.id);
            this.log(`order ${order.id} cancelled`, orderCancellation);
        }

        return false;
    }
    
}

exports.BitstampService = BitstampService;
