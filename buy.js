const bitstampService = require('./BitstampService').bitstampService;

async function go() {
    try {
        console.log(await bitstampService.getUserTransactionsAsync(1));
        console.log(await bitstampService.getBalance());
        console.log(await bitstampService.getBalance("etheur"));
    }
    catch (err) {
        console.log(err);
    }
}

go();
