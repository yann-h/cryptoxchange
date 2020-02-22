const log = require('./lib/log');
const BitstampService = require('./lib/BitstampService').BitstampService;
const bitstampService = new BitstampService(log.log);
const Helpers = require('./lib/Helpers').Helpers;

async function buy(crypto, currency, feePercentage) {
    try {
        const currencyPair = `${crypto}${currency}`;

        log.log("getting balance");
        const balance = await bitstampService.getBalance(currencyPair);
        log.log(null, balance);
        const available = balance[`${currency}_available`];
        log.log(`available: ${available} ${currency}`);

        log.log("getting ticker");
        const ticker = await bitstampService.getTicker(currencyPair);
        log.log(null, ticker);

        let price = Helpers.roundToDecimals(ticker.last /* * 1.0005 */, 2);
        let amount = Helpers.roundToDecimals((( 1 - feePercentage) * available /* 30 */) / ticker.last, 8); // available <=> buy for all you have
        log.log(`buying ${crypto} at ${price} using ${amount} ${currency}`);
        const buy = await bitstampService.buy(currencyPair, amount, price, null, true, null);
        log.log(null, buy);

        await bitstampService.waitForOrderCompletion(buy.id);
    }
    catch (err) {
        log.log(null, err.toString());
    }
}

const CRYPTO = "eth";
const CURRENCY = "eur";
const FEE_PERCENTAGE = .005 + .0005;

buy(CRYPTO, CURRENCY, FEE_PERCENTAGE);
