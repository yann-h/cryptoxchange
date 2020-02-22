class Helpers {
    
    static roundFloorDecimals(value, decimals) {
        const pow = Math.pow(10, decimals);
        return Math.floor(value * pow) / pow;
    }

    static roundCeilDecimals(value, decimals) {
        const pow = Math.pow(10, decimals);
        return Math.ceil(value * pow) / pow;
    }

    static splitTransaction(amounts, balance, base, variation, decimals) {
        if (balance <= base + 2 * variation) {
            amounts.push(Helpers.roundFloorDecimals(balance, decimals));
            return amounts;
        }
        else {
            let amount = Helpers.roundFloorDecimals(base + Math.random() * variation, decimals);
            amounts.push(amount);
            return Helpers.splitTransaction(amounts, balance - amount, base, variation, decimals);
        }
    }

}

exports.Helpers = Helpers;
