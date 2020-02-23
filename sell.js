/**
 * Exemple of a selling operation automation
 * Define environment variables in keys.txt then call:
 * . keys.txt && node sell.js
 */
const log = require('./lib/log');
const notify = require('./lib/notify');
const BitstampService = require('./lib/BitstampService').BitstampService;
const bitstampService = new BitstampService(log.log);
const Helpers = require('./lib/Helpers').Helpers;
const util = require('util');
const sleep = util.promisify(setTimeout);

async function sell(crypto, currency) {
    try {
        const currencyPair = `${crypto}${currency}`;

        log.log("getting balance");
        const balance = await bitstampService.getBalance(currencyPair);
        log.log(null, balance);
        const available = balance[`${crypto}_available`];
        log.log(`available: ${available} ${crypto}`);

        const amounts = Helpers.splitTransaction([], available, 1, .5, 8);
        console.log(amounts);
        for (let amount of amounts) {
            log.log("getting ticker");
            const ticker = await bitstampService.getTicker(currencyPair);
            log.log(null, ticker);
            
            let price = Helpers.roundCeilDecimals(ticker.last /* * 1.0005 */, 2);
            log.log(`selling ${amount} ${crypto} at ${price}`);
            const sell = await bitstampService.sell(currencyPair, amount, price, null, true, null);
            log.log(null, sell);
        }

        await notify.notify("sell orders sent");
        await bitstampService.waitForOrdersCompletion();
        await notify.notify("all sell order closed");
    }
    catch (err) {
        log.log(null, err.toString());
        notify.notify("error:" + err.toString());
    }
}

const CRYPTO = "eth";

const CURRENCY = "eur";

sell(CRYPTO, CURRENCY);
