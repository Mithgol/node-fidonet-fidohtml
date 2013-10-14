var FidoHTML = function(){
   if (!(this instanceof FidoHTML)) return new FidoHTML();
};

FidoHTML.prototype.fromText = function(msgText){
   var out = msgText.replace(/\r?\n/g, '<br>');
   out = out.replace(/  /g, ' \u00A0');
   return out;
};

module.exports = FidoHTML;