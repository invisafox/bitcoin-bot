const RestClient = require("deribit-api").RestClient;
const TelegramBot = require('node-telegram-bot-api');
const config = require('config');

const tc = require('./lib/telegram_controller');

const restClient = new RestClient(config.deribit.access_key, config.deribit.secret);

const bot = new TelegramBot(config.telegram.bot_token, {polling: true});
bot.sendMessage(config.telegram.my_chat_id, 'The bitcoin bot is starting up.');

bot.on('message', (msg) => {
    console.log(msg);
    const chatId = msg.chat.id;
    if (tc.is_a_stranger(chatId)){
        bot.sendMessage(chatId, 'Sorry. I\'m not allowed to talk to strangers.');
        bot.sendMessage(config.telegram.my_chat_id, 'A stranger tried to message the bot just now.');
        return false;
    }

    switch(msg.text.toLowerCase()){
      case '/status':
        restClient.account().then((result) => {
          result = result.result;
          var rawMaintenance = result.maintenanceMargin / result.equity;
          var maintenance = 100*((result.maintenanceMargin / result.equity).toFixed(4));

          restClient.index().then((priceResult) => {
            priceResult = priceResult.result;
	  var cashMoney = result.equity * priceResult.btc;
            bot.sendMessage(chatId, 'maintenance: '+maintenance+'\n'+'equity: '+result.equity+'\n'+'BTC price:' +priceResult.btc +'\n'+'your balance: $'+cashMoney);
          });
	restClient.positions().then((positionsResult) => {
            console.log(positionsResult);
            positionsResult = positionsResult.result;
            console.log(positionsResult);
            bot.sendMessage(chatId, 'positions: '+positionsResult[0].size+'\n'+'profit: '+positionsResult[0].profitLoss+'\n'+'Futures Price: '+positionsResult[0].markPrice);
          });
        });

        break;

      default:
        bot.sendMessage(chatId, 'The bot received your message but is not sure what to do with it.');
        break;
    }
});


function intervalFunc(restClient, tc, bot) {
  restClient.account().then((result) => {
    result = result.result;
    var rawMaintenance = result.maintenanceMargin / result.equity;
    var maintenance = 100*((result.maintenanceMargin / result.equity).toFixed(4));
    /*
    console.log();
    console.log(rawMaintenance);
    console.log(maintenance);
    console.log(result.equity);
    */

    if (
      maintenance < 4 && maintenance > 2 
      && 
      ( 
        tc.get_minutes_since_messaged('maint_below_four') === -1 
        || tc.get_minutes_since_messaged('maint_below_four') > 29
      )
    ){
      console.log();
      console.log('Maintenance margin has fallen below 4%.');
      bot.sendMessage(config.telegram.my_chat_id, 'Maintenance margin has fallen below 4%. Currently at: '+maintenance+'%');
      tc.set_last_messaged('maint_below_four', Date.now() );
    } else if (
      maintenance > 8 
      && 
      ( 
        tc.get_minutes_since_messaged('maint_above_eight') === -1 
        || tc.get_minutes_since_messaged('maint_above_eight') > 29
      )
    ){
      console.log();
      console.log('Maintenance margin has gone above 8%.');
      bot.sendMessage(config.telegram.my_chat_id, 'Maintenance margin has gone above 8%. Currently at: '+maintenance+'%');
      tc.set_last_messaged('maint_above_eight', Date.now() );
    }
    

  });
}
  
setInterval(function(){
  intervalFunc(restClient, tc, bot);
}, 30000);
