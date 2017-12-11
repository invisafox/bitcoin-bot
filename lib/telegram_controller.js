const config = require('config');

class telegram_controller {

  constructor(){
    this.last_messaged = {
      reason: null,
      date: null
    };
    this.repeat_message_interval = 10;
  }

  is_a_stranger(chatId){
    if (config.telegram.allowed_chat_ids.indexOf(chatId) === -1){
      return true;
    }else{
      return false;
    }
  }

  set_last_messaged(reason){
    this.last_messaged = {
      reason: reason,
      date: new Date()
    };
  }

  get_minutes_since_messaged(reason){
    if (reason === this.last_messaged.reason){
      var now = new Date();

      var difference = now.getTime() - this.last_messaged.date.getTime();
      var minutesDifference = Math.floor(difference/1000/60);

      return minutesDifference;
    }else{
      return -1;
    }
  }

}

module.exports = new telegram_controller();