var FidoHTML = function(){
   if (!(this instanceof FidoHTML)) return new FidoHTML();
};

FidoHTML.prototype.fromText = function(msgText){
   return msgText.replace(/\r?\n/g, '<br>');
};

module.exports = FidoHTML;