var ASTree = require('astree');
var Dauria = require('dauria');
var extend = require('extend');
var Fiunis = require('fiunis');
var MIME = require('mime');
var UUE = require('uue');
var _s = require('underscore.string');

var defaults = {
   dataMode: false,
   fontColor: false,
   color: {
      origin: '#85144b',
      tearline: '#3d9970',
      tagline: '#ff851b'
   }
};

var FidoHTML = function(options){
   if (!(this instanceof FidoHTML)) return new FidoHTML(options);

   this.options = extend(true, {}, defaults, options);

   var _converter = this;
   this.ASTree = ASTree();

   // do not break spaces in the beginning of the lines
   // note: this replacement cannot be further down,
   //       because then it would treat the beginning of a fragment
   //       as a beginning of a line (e.g. a space after a hyperlink)
   this.ASTree.defineSplitter(function(sourceText){
      return sourceText.replace(/(^|\n) /g, '$1\u00A0');
   });

   // origin line
   // FTS-0004.001, “Conference Mail Message Control Information”, section 3
   this.ASTree.defineSplitter(function(sourceText){
      // dot does NOT match `'\n'`
      var results =
      /^((?:\n|.)*)\n(\u00A0?\* Origin: .*)\(([^)]+)\)\s*$/.exec(
         sourceText
      );
      if( results === null ) return sourceText; // no origin
      return [
         results[1], // pre-origin text
         {
            type: 'origin',
            preParens: results[2], // before parentheses
            addrSource: results[3],
            addrText: results[3]
         }
      ];
   });
   this.ASTree.defineRenderer(['origin'], function(origin, render){
      var outputHTML = '<div class="originLine">';
      if( _converter.options.fontColor ){
         outputHTML += '<font color="' +
            _converter.options.color.origin +
         '">';
      }
      outputHTML += render(origin.preParens);
      outputHTML += '(<span data-addr="';
      outputHTML += _s.escapeHTML(origin.addrSource);
      outputHTML += '">';
      outputHTML += render(origin.addrText);
      outputHTML += '</span>)';
      if( _converter.options.fontColor ){
         outputHTML += '</font>';
      }
      outputHTML += '</div>';

      return outputHTML;
   });

   // tearline
   // FTS-0004.001, “Conference Mail Message Control Information”, section 2
   this.ASTree.defineSplitter(function(sourceText){
      if( typeof sourceText !== 'string' ) return sourceText;

      // dot does NOT match `'\n'`
      var results = /^((?:\n|.)*)\n(-{3}(?: .*)?)$/.exec(
         sourceText
      );
      if( results === null ) return sourceText; // no tearline
      return [
         results[1], // pre-tearline text
         {
            type: 'tearline',
            content: results[2]
         }
      ];
   });
   this.ASTree.defineRenderer(['tearline'], function(tearline, render){
      var outputHTML = '<div class="tearline">';
      if( _converter.options.fontColor ){
         outputHTML += '<font color="' +
            _converter.options.color.tearline +
         '">';
      }
      outputHTML += render(tearline.content);
      if( _converter.options.fontColor ){
         outputHTML += '</font>';
      }
      outputHTML += '</div>';

      return outputHTML;
   });

   // tagline
   this.ASTree.defineSplitter(function(sourceText){
      if( typeof sourceText !== 'string' ) return sourceText;

      // dot does NOT match `'\n'`
      var results = /^((?:\n|.)*)\n(\.{3}.*)$/.exec(
         sourceText
      );
      if( results === null ) return sourceText; // no tearline
      return [
         results[1], // pre-tearline text
         {
            type: 'tagline',
            content: results[2]
         }
      ];
   });
   this.ASTree.defineRenderer(['tagline'], function(tagline, render){
      var outputHTML = '<div class="tagline">';
      if( _converter.options.fontColor ){
         outputHTML += '<font color="' +
            _converter.options.color.tagline +
         '">';
      }
      outputHTML += render(tagline.content);
      if( _converter.options.fontColor ){
         outputHTML += '</font>';
      }
      outputHTML += '</div>';

      return outputHTML;
   });

   this.ASTree.defineSplitter(function(textWithQuotes){
      if( typeof textWithQuotes !== 'string' ) return textWithQuotes;

      return textWithQuotes.split( // there are always initial and final `\n`
         /(\n\s*([^\s\n>]*>+).*\n(?:\s*\2.*\n)*)/
      ).map(function(textFragment, fragmentIndex, fragmentList){
         if( fragmentIndex % 3 === 0 ){ // simple fragment's index: 0, 3...
            return textFragment;
         } else if( fragmentIndex % 3 === 2 ){ // author ID's index: 2, 5...
            return null;
         } else { // regex-captured fragment's index: 1, 4, 7...
            var textWithRemovedQuotes = textFragment.split(
               /\n\s*[^\s\n>]*>+\s*/
            ).join(
               '\n' // \n followed by some authorID is replaced with simple \n
            );
            textWithRemovedQuotes = textWithRemovedQuotes.slice(
               1,textWithRemovedQuotes.length-1 // kill initial and final `\n`
            );
            return {
               type: 'quote',
               authorID: fragmentList[ fragmentIndex + 1 ],
               quotedText: textWithRemovedQuotes
            };
         }
      }).filter(function(nextFragment){
         return nextFragment !== null;
      });
   });
   this.ASTree.defineRenderer(['quote'], function(quote, render){
      var outputHTML = '<blockquote ';
      outputHTML += 'data-authorID="';
      outputHTML += _s.escapeHTML(quote.authorID);
      outputHTML += '" class="fidoQuote">';
      outputHTML += render(quote.quotedText);
      outputHTML += '</blockquote>';

      return outputHTML;
   });

   // if an empty line appears immediately before tagline-tearline-origin,
   // or immediately before some quoted text,
   // then add a non-breaking space on that line
   this.ASTree.defineSplitter(function(sourceText){
      if( typeof sourceText !== 'string' ) return sourceText;

      if( sourceText[sourceText.length - 1] !== '\n' ) return sourceText;

      return sourceText + '\u00A0';
   });

   // detect (and isolate) UUE code fragments
   this.ASTree.defineSplitter(function(inputData){
      if( typeof inputData !== 'string' ) return inputData;
      return UUE.split(inputData);
   }, [
      { type: 'quote', props: [ 'quotedText' ] }
   ]);
   this.ASTree.defineRenderer(['UUE'], function(objectUUE /*, render*/){
      var mimeType = MIME.lookup(objectUUE.name);
      if([
         'image/jpeg',
         'image/png',
         'image/gif',
         'image/svg+xml'
      ].indexOf(mimeType) >= 0 ){ // image
         var addSourceData = '';
         if( _converter.options.dataMode ){
            addSourceData = [
               ' data-source="',
               Buffer(
                  objectUUE.source
               ).toString('base64'),
               '"'
            ].join('');
         }
         return [
            '<div class="imageUUE" ',
            'data-name="',
            _s.escapeHTML( objectUUE.name ),
            '"',
            addSourceData,
            '>',
            '<img src="',
            Dauria.getBase64DataURI(objectUUE.data, mimeType),
            '">',
            '</div>'
         ].join('');
      } else { // not an image
         if( _converter.options.dataMode ){
            return [
               '<div class="fileUUE" data-name="',
               _s.escapeHTML( objectUUE.name ),
               '" data-content="',
               objectUUE.data.toString('base64'),
               '">',
               objectUUE.source,
               '</div>'
            ].join('');
         } else { // not an image, and not in dataMode
            return [
               '<a class="fileUUE" href="',
               Dauria.getBase64DataURI(objectUUE.data, mimeType),
               '">',
               objectUUE.source,
               '</a>'
            ].join('');
         }
      }
   });

   // convert Fidonet Unicode substrings (but not in UUE blocks)
   this.ASTree.defineSplitter(function(sourceWithFiunis){
      if( typeof sourceWithFiunis !== 'string' ) return sourceWithFiunis;
      return Fiunis.decode(sourceWithFiunis);
   }, [
      { type: 'quote', props: [ 'quotedText' ] },
      { type: 'origin', props: ['preParens', 'addrText'] },
      { type: 'tearline', props: ['content'] },
      { type: 'tagline', props: ['content'] }
   ]);

   // convert URLs to hyperlinks
   this.ASTree.defineSplitter(function(sourceCode){
      /* jshint -W101 */
      if( typeof sourceCode !== 'string' ) return sourceCode;
      return sourceCode.split(
         /(\b(?:https?|ftp|mailto|bitcoin|ed2k|facetime|feed|geo|irc(?:6|s)?|magnet|mms|news|nntp|sips?|skype|sms|ssh|tel|telnet|tftp|xmpp):[^\s<>\x22\x27{}|\^\[\]`]+)/
      ).map(function(sourceFragment, fragmentIndex){
         if( fragmentIndex % 2 === 0 ){ // simple fragment's index: 0, 2...
            return sourceFragment;
         } else { // regex-captured fragment's index: 1, 3, 5...
            return {
               type: 'hyperlink',
               URL: sourceFragment,
               textURL: sourceFragment
            };
         }
      });
   }, [
      { type: 'quote', props: [ 'quotedText' ] },
      { type: 'origin', props: ['preParens'] },
      { type: 'tearline', props: ['content'] },
      { type: 'tagline', props: ['content'] }
   ]);
   this.ASTree.defineRenderer(['hyperlink'], function(hyperlink /*, render*/){
      if( _converter.options.dataMode ){
         return '<a href="javascript:;" data-href="' + hyperlink.URL + '">' +
                hyperlink.textURL + '</a>';
      }
      return '<a href="' + hyperlink.URL + '">' + hyperlink.textURL + '</a>';
   });

   // perform character replacements:
   // *) in plain text
   // *) in quoted text
   // *) in UUE code blocks
   // *) in the text of URLs
   // *) in the text of origins (including address)
   // *) in tearlines and taglines
   this.ASTree.defineSplitter(function(sourceNode){
      if( typeof sourceNode !== 'string' ) return sourceNode;

      var replacements = [
         [/  /g, ' \u00A0'],
         [/&/g, '&amp;'],
         [/</g, '&lt;'],
         [/>/g, '&gt;'],
         [/\x22/g, '&quot;'],
         [/\n/g, '<br>']
      ];

      return replacements.reduce(function(result, replacement){
         return result.replace(replacement[0], replacement[1]);
      }, sourceNode);
   }, [
      { type: 'quote', props: [ 'quotedText' ] },
      { type: 'UUE', props: [ 'source' ] },
      { type: 'hyperlink', props: [ 'textURL' ] },
      { type: 'origin', props: ['preParens', 'addrText'] },
      { type: 'tearline', props: ['content'] },
      { type: 'tagline', props: ['content'] }
   ]);
};

FidoHTML.prototype.fromText = function(msgText){
   return this.ASTree.render(msgText);
};

module.exports = FidoHTML;
