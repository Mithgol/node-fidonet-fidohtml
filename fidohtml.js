var FidoHTML = function(){
   if (!(this instanceof FidoHTML)) return new FidoHTML();
};

var afterURL = function(middle){
   var out = middle.replace(/\r?\n/g, '<br>');
   out = out.replace(/  /g, ' \u00A0');
   return out;
};

FidoHTML.prototype.fromText = function(msgText){
   /* jshint -W101 */
   var arrHyper = msgText.split(
      /(\b(?:https?|ftp|mailto|aim|bitcoin|ed2k|facetime|feed|geo|irc(?:6|s)?|magnet|news|nntp|sips?|skype|sms|ssh|tel|telnet|tftp|xmpp):.*?)(?=$|[\s<>\x22\x27{}|\^\[\]`])/
   );
   for( var i = 0; i < arrHyper.length; i+=2 ){
      arrHyper[i] = afterURL( arrHyper[i] );
   }
   for( var j = 1; j < arrHyper.length; j+=2 ){
      arrHyper[j] = '<a href="' + arrHyper[j] + '">' + arrHyper[j] + '</a>';
   }
   return arrHyper.join('');
};

module.exports = FidoHTML;