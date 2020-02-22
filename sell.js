const log = require('./lib/log');
const BitstampService = require('./lib/BitstampService').BitstampService;
const bitstampService = new BitstampService(log.log);
const Helpers = require('./lib/Helpers').Helpers;

async function sell(crypto, currency) {
    try {
        const currencyPair = `${crypto}${currency}`;

        log.log("getting balance");
        const balance = await bitstampService.getBalance(currencyPair);
        log.log(null, balance);
        const available = balance[`${crypto}_available`];
        log.log(`available: ${available} ${crypto}`);

        const amounts = Helpers.splitTransaction([], available, 1, .5, 8);
        for (let amount in amounts) {
            log.log("getting ticker");
            const ticker = await bitstampService.getTicker(currencyPair);
            log.log(null, ticker);
            
            let price = Helpers.roundCeilDecimals(ticker.last /* * 1.0005 */, 2);
            log.log(`selling ${amount} ${crypto} at ${price}`);
            const sell = await bitstampService.sell(currencyPair, amount, price, null, true, null);
            log.log(null, sell);
        }

        await bitstampService.waitForOrdersCompletion();
    }
    catch (err) {
        log.log(null, err.toString());
    }
}

const CRYPTO = "eth";

const CURRENCY = "eur";

sell(CRYPTO, CURRENCY);

1,23
0,75
2,5
Math.random()*2