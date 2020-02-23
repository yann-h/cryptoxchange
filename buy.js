/**
 * Exemple of a buying operation automation
 * Define environment variables in keys.txt then call:
 * . keys.txt && node buy.js
 */
const log = require('./lib/log');
const notify = require('./lib/notify');
const BitstampService = require('./lib/BitstampService').BitstampService;
const bitstampService = new BitstampService(log.log);
const Helpers = require('./lib/Helpers').Helpers;
const util = require('util');
const sleep = util.promisify(setTimeout);

async function buy(crypto, currency, feePercentage) {
    try {
        const currencyPair = `${crypto}${currency}`;

        log.log("getting balance");
        const balance = await bitstampService.getBalance(currencyPair);
        log.log(null, balance);
        const available = balance[`${currency}_available`];
        log.log(`available: ${available} ${currency}`);

        log.log("getting last");
        const last = Number((await bitstampService.getTicker(currencyPair)).last);
        log.log(null, last);

        const amounts = Helpers.splitTransaction([], (1 - feePercentage) * available, last, last / 2, 8);
        console.log(amounts);
        console.log(amounts.reduce((sum, amount) => sum + amount, 0) * 1.005);
        for (let amount of amounts) {
            log.log("getting ticker");
            const ticker = await bitstampService.getTicker(currencyPair);
            log.log(null, ticker);

            let price = Helpers.roundCeilDecimals(ticker.last /* * 1.0005 */, 2);
            log.log(`buying ${crypto} at ${price} using ${amount} ${currency}`);
            const buy = await bitstampService.buy(currencyPair, amount, price, null, true, null);
            log.log(null, buy);
        }

        await notify.notify("buy orders sent");
        await bitstampService.waitForOrdersCompletion();
        await notify.notify("all buy order closed");
    }
    catch (err) {
        log.log(null, err.toString());
    }
}

const CRYPTO = "eth";
const CURRENCY = "eur";
const FEE_PERCENTAGE = .005 + .0005;

buy(CRYPTO, CURRENCY, FEE_PERCENTAGE);
