const Web3 = require("web3");
const dotenv = require('dotenv').config();
const config = require("./config");
const AWS = require('aws-sdk');
AWS.config.update({
    region: 'us-east-1'
});

let lastMailSentTimeETH = 1654021000;
let lastMailSentTimeBSC = 1654021000;
let lastMailSentTimeGTH = 1654021000;
let emailInterval = parseInt(process.env.EMAIL_INTERVAL);
let recheckInterval = parseInt(process.env.RECHECK_INTERVAL);
let ethLimit = parseInt(process.env.ETH_LIMIT);
let bscLimit = parseInt(process.env.BSC_LIMIT);
let gthLimit = parseInt(process.env.GTH_LIMIT);
let ethgasLimit = parseFloat(process.env.ETH_GASLIMIT);
let bscgasLimit = parseFloat(process.env.BSC_GASLIMIT);
let gthgasLimit = parseFloat(process.env.GTH_GASLIMIT);

async function sendEmail(keyword, gasfees, wallet_Address, coin_Balance, network, coin, gasnetwork) {
    var params = {
        Destination: {
            /* required */
            CcAddresses: (process.env.Cc_EMAIL).split(','),
            ToAddresses: (process.env.TO_EMAIL).split(','),
        },
        Message: {
            /* required */
            Body: {
                /* required */
                Html: {
                    Charset: "UTF-8",
                    Data: `Hi,<br>\n ${keyword}  ${gasfees} of ${wallet_Address} on ${network} is now low.<br>\nCurrent balance is ${coin_Balance} ${coin}. Please add more ${gasnetwork} to this address as soon as possible.</p>`
                },
                Text: {
                    Charset: "UTF-8",
                    Data: ""
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'Low Liquidity balance alert'
            }
        },
        Source: process.env.BASE_EMAIL,
    };
    var sendPromise = new AWS.SES({
        apiVersion: '2010-12-01'
    }).sendEmail(params).promise();

    sendPromise.then(
        function (data) {
            console.log(data.MessageId);
        }).catch(
        function (err) {
            console.error(err, err.stack);
        });
    lastMailSentTimeETH = Date.now();
}

async function SendEmailIfLowBalance() {
    let balance = await intervalBalance();
    console.log('Ethereum expected min balance - ' + ethLimit + '. Current balance - ' + balance[0]);
    if ((balance[0]) < ethLimit) {
        await sendEmail('Liquidity','balance', process.env.ETH_WALLET, balance[0], 'Ethereum', 'GTH', 'Liquidity');
       
    }
    const rpcURL = process.env.API_URL_ETHINFURA;
    const web3 = new Web3(rpcURL);
    var ETHCoinBalance = await web3.eth.getBalance(process.env.ETH_BALWALLET);
    ETHCoinBalance = web3.utils.fromWei(ETHCoinBalance);
    console.log('Ethereum expected min coin balance - ' + ethgasLimit + '. Current coin balance - ' + ETHCoinBalance);
    if (ETHCoinBalance < ethgasLimit) {
        await sendEmail('ETH balance', "(to cover the gas fees)", process.env.ETH_BALWALLET, ETHCoinBalance, 'Ethereum', 'ETH', 'ETH');
        
    }
    console.log('BSC expected min balance - ' + bscLimit + '. Current balance - ' + balance[1]);
    if ((balance[1]) < bscLimit  && Date.now() - lastMailSentTimeBSC > emailInterval) {
        await sendEmail('Liquidity','balance', process.env.BSC_WALLET, balance[1], 'BSC', 'GTH', 'Liquidity');
        
    }
    const rpcURL1 = process.env.API_URL_BSCMAINNET;
    const web3_ = new Web3(rpcURL1);
    var BSCoinBalance = await web3_.eth.getBalance(process.env.BSC_BALWALLET);
    BSCoinBalance = web3.utils.fromWei(BSCoinBalance);
    console.log('BSC expected min coin balance - ' + bscgasLimit + '. Current coin balance - ' + BSCoinBalance );
    if (BSCoinBalance < bscgasLimit  && Date.now() - lastMailSentTimeBSC > emailInterval) {
        await sendEmail('BNB balance', "(to cover the gas fees)", process.env.BSC_BALWALLET, BSCoinBalance, 'BSC', 'BNB', 'BNB');
        
    }
    console.log('Gather expected min balance - ' + gthLimit + '. Current balance - ' + balance[2]);
    if ((balance[2]) < gthLimit && Date.now() - lastMailSentTimeGTH > emailInterval) {
        await sendEmail('Liquidity','balance', process.env.GTH_WALLET, balance[2], 'Gather', 'GTH', 'Liquidity');
        
    }
    const rpcURL2 = process.env.API_URL_NATIVEGTH;;
    const web3gth = new Web3(rpcURL2);
    var GTHCoinBalance = await web3gth.eth.getBalance(process.env.BSC_BALWALLET);
    GTHCoinBalance = web3.utils.fromWei(GTHCoinBalance);
    console.log('Gather expected min coin balance - ' + gthgasLimit + '. Current coin balance - ' + GTHCoinBalance );
    if (GTHCoinBalance < gthgasLimit  && Date.now() - lastMailSentTimeGTH > emailInterval) {
        await sendEmail('GTH balance', "(to cover the gas fees)", process.env.GTH_BALWALLET, GTHCoinBalance, 'Gather', 'GTH', 'GTH');
        
    }
}
async function intervalBalance() {
    /*------ For Ethereum Blockchain GTH Token Balance check------- */
    async function getBalanceETH() {
        const rpcURL = process.env.API_URL_ETHINFURA;
        const web3 = new Web3(rpcURL);
        var instanceETH = new web3.eth.Contract(config.ETH.ABI, config.ETH.CONTRACT_ADDRESS);
        const ETHBalance = await instanceETH.methods.balanceOf(process.env.ETH_WALLET).call();
        console.log('GTH Balance on Ethereum: ' + web3.utils.fromWei(ETHBalance));
        return parseFloat(web3.utils.fromWei(ETHBalance));
    }
    const GTHEthBalance = await getBalanceETH();

    /*------ For Binance Blockchain  GTH Token Balance check------- */
    async function getBalanceBSC() {
        const rpcURL1 = process.env.API_URL_BSCMAINNET;
        const web3 = new Web3(rpcURL1);
        var instanceBSC = new web3.eth.Contract(config.BSC.ABI, config.BSC.CONTRACT_ADDRESS);
        const BSCBalance = await instanceBSC.methods.balanceOf(process.env.BSC_WALLET).call();
        console.log('GTH Balance on BSC: ' + web3.utils.fromWei(BSCBalance));
        return parseFloat(web3.utils.fromWei(BSCBalance));
    }
    const GTHBscBalance = await getBalanceBSC();

    /*------ For Gather Blockchain GTH Token Balance check------- */
    async function GTHBalanceCheck() {
        const rpcURL2 = process.env.API_URL_NATIVEGTH;
        const web3 = new Web3(rpcURL2);
        var GTHBalance = await web3.eth.getBalance(process.env.GTH_WALLET);
        console.log('GTH Native balance: ' + web3.utils.fromWei(GTHBalance));
        return parseFloat(web3.utils.fromWei(GTHBalance));
    }
    const GTHNativeBalance = await GTHBalanceCheck();

    return [GTHEthBalance, GTHBscBalance, GTHNativeBalance];
}

setInterval(async () => {
    await SendEmailIfLowBalance();
}, recheckInterval);
