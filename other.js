const BitstampService = require('./lib/BitstampService').BitstampService;
const bitstampService = new BitstampService();

async function go() {
    try {
        const balance = 
        console.log(await bitstampService.getUserTransactionsAsync(1));
        console.log(await bitstampService.getBalance());
        console.log(await bitstampService.getBalance("etheur"));
    }
    catch (err) {
        console.log(err);
    }
}

go();
