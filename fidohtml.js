var FidoHTML = function(options){
   if (!(this instanceof FidoHTML)) return new FidoHTML(options);

   if( typeof options === 'undefined' ) options = {};
   this.options = options;
};

var symbols = [
   [/  /g, ' \u00A0'],
   [/&/g, '&amp;'],
   [/</g, '&lt;'],
   [/>/g, '&gt;'],
   [/\x22/g, '&quot;'],
   [/\r?\n/g, '<br>']
];

var afterURL = function(middle){
   return symbols.reduce(function(result, symbol){
      return result.replace(symbol[0], symbol[1]);
   }, middle);
};

FidoHTML.prototype.wrapLink = function(link){
   if( this.options.dataMode ){
      return '<a href="javascript:;" data-href="'+link+'">' + link + '</a>';
   }
   return '<a href="'+link+'">' + link + '</a>';
};

FidoHTML.prototype.fromText = function(msgText){
   /* jshint -W101 */
   var _converter = this;
   var lines = msgText.replace(/(^|\r?\n) /g, '$1\u00A0').split(
      /(\b(?:https?|ftp|mailto|bitcoin|ed2k|facetime|feed|geo|irc(?:6|s)?|magnet|news|nntp|sips?|skype|sms|ssh|tel|telnet|tftp|xmpp):.*?)(?=$|[\s<>\x22\x27{}|\^\[\]`])/
   );

   return lines.map(function(line, index){
      if( index % 2 ) return _converter.wrapLink(line);
      return afterURL(line);
   }).join('');
};

module.exports = FidoHTML;
