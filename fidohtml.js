var ASTree = require('astree');
var colorsCSS = require('colors.css');
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
      origin: colorsCSS.maroon,
      tearline: colorsCSS.olive,
      tagline: colorsCSS.orange
   },
   styleCodes: 'Yes'
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

   // detect (and isolate) UUE code fragments
   this.ASTree.defineSplitter(function(inputData){
      if( typeof inputData !== 'string' ) return inputData;

      // destroy `\n` adjacent to UUE blocks
      return UUE.split(inputData).map(function(chunk, idx, chunkList){
         if( typeof chunk !== 'string' ) return chunk;

         if( idx < chunkList.length - 1 ){ // not the last chunk
            if( _s.endsWith(chunk, '\n') ){
               chunk = chunk.slice(0, chunk.length - 1);
            }
         }

         if( idx > 0 ){ // not the first chunk
            if( _s.startsWith(chunk, '\n') ){
               chunk = chunk.slice(1, chunk.length);
            }
         }

         return chunk;
      });
   });
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
               '<div class="linkUUE"><a href="',
               Dauria.getBase64DataURI(objectUUE.data, mimeType),
               '">',
               objectUUE.source,
               '</a></div>'
            ].join('');
         }
      }
   });

   // quotes
   var quoteSplitter = function(textWithQuotes){
      if( typeof textWithQuotes !== 'string' ) return textWithQuotes;

      var lines = textWithQuotes.split('\n');

      var arrayAccum = []; // accumulates AST nodes to be returned
      var accum = ''; // accumulates the content for the current AST node
      var modeQuote = false; // initial mode is plain text, not inside a quote
      var initialMode = true; // when `accum` is initially empty
      var authorID; // (possibly empty) initials before the `>`
      var quoteLevel; // how many `>` are there
      var matches; // keeps matches from a regexp
      var newlines; // contains newlines from the tail of a quote

      var grabNewlinesFromQuote = function(){
         newlines = '';
         while( _s.endsWith(accum, '\n') ){
            accum = accum.slice(0, accum.length - 1);
            newlines += '\n';
         }
      };

      var pushCurrentQuote = function(){
         arrayAccum.push({
            type: 'quote',
            authorID: authorID,
            quoteLevel: quoteLevel,
            quotedText: quoteSplitter(accum)
         });
      };

      lines.forEach(function(nextLine){
         if( !modeQuote ){ // plain text mode, not in a quote
            if( /^\s*[^\s>]*>+/.test(nextLine) ){
               // a quote is found
               // abort the plain text mode, start the quote mode
               if( initialMode ){
                  initialMode = false;
               } else arrayAccum.push(accum);
               modeQuote = true;
               matches = /^\s*([^\s>]*)(>+)\s*(.*)$/.exec(nextLine);
               authorID = matches[1];
               quoteLevel = matches[2].length;
               accum = matches[3];
               return;
            }
            // a quote is not found, continue the plain text mode
            if( initialMode ){
               accum = nextLine;
               initialMode = false;
               return;
            }
            accum += '\n' + nextLine;
            return;
         }
         // we are inside a quote AND `initialMode` is already false
         matches = /^\s*([^\s>]*)(>+)\s*(.*)$/.exec(nextLine);
         if( matches === null ){ // a quote is not detected
            if( /^\s*$/.test(nextLine) ){ // but the line is visually empty
               accum += '\n' + nextLine;
               return;
            }
            // abort the quote mode, start the plain text mode
            grabNewlinesFromQuote();
            pushCurrentQuote();
            modeQuote = false;
            accum = newlines + nextLine;
            return;
         }
         // some quote is detected
         if(
            authorID === matches[1] &&
            quoteLevel === matches[2].length
         ){ // visually equivalent to the current quote
            accum += '\n' + matches[3];
            return;
         }
         // a different quote is detected
         // TODO: process nested quotes correctly
         grabNewlinesFromQuote();
         pushCurrentQuote();
         arrayAccum.push(newlines);
         authorID = matches[1];
         quoteLevel = matches[2].length;
         accum = matches[3];
      });

      // correctly flush the accumulated result
      if( modeQuote ){
         grabNewlinesFromQuote();
         pushCurrentQuote();
         arrayAccum.push(newlines);
         return arrayAccum;
      }
      arrayAccum.push(accum);
      return arrayAccum;
   };
   this.ASTree.defineSplitter(quoteSplitter);
   this.ASTree.defineRenderer(['quote'], function(quote, render){
      var outputHTML = _s.repeat(
         '<blockquote class="fidoQuoteOuter">', quote.quoteLevel - 1
      );
      outputHTML += '<blockquote ';
      if( _converter.options.dataMode ){
         outputHTML += 'data-authorID="';
         outputHTML += _s.escapeHTML(quote.authorID);
         outputHTML += '" data-quoteLevel="';
         outputHTML += _s.escapeHTML(quote.quoteLevel);
         outputHTML += '" ';
      }
      outputHTML += 'class="fidoQuote">';
      outputHTML += render(quote.quotedText);
      outputHTML += _s.repeat('</blockquote>', quote.quoteLevel);

      return outputHTML;
   });

   // if an empty line appears immediately before tagline-tearline-origin,
   // or immediately before (or after) some quoted text,
   // or in the beginning of the whole message,
   // then add a non-breaking space on that line
   this.ASTree.defineSplitter(function(sourceText){
      if( typeof sourceText !== 'string' ) return sourceText;

      if( sourceText === '\n' ){
         sourceText = '\u00A0';
      } else {
         if( _s.startsWith(sourceText, '\n') ){
            sourceText = '\u00A0' + sourceText;
         }
         if( _s.endsWith(sourceText, '\n') ) sourceText += '\u00A0';
      }

      return sourceText;
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

   // wrap lines in <code> where fixed character width is necessary
   this.ASTree.defineSplitter(function(textLinesBlock){
      if( typeof textLinesBlock !== 'string' ) return textLinesBlock;

      var accum = '';
      var arrAccum = [];
      var modeFixedWidth = false;
      var initialMode = true;

      var pushMonospace = function(){
         arrAccum.push({
            type: 'monospaceBlock',
            content: accum
         });
      };

      textLinesBlock.split('\n').forEach(function(nextLine){
         // Box Drawing:     http://www.unicode.org/charts/PDF/U2500.pdf
         // Block Elements:  http://www.unicode.org/charts/PDF/U2580.pdf
         if( /[\u2501-\u259F]/.test(nextLine) ){ // fixed width characters
            initialMode = false;
            if( modeFixedWidth ){ // continue fixed width mode
               accum += '\n' + nextLine;
            } else { // start fixed width mode
               if( accum !== '' ) arrAccum.push(accum);
               modeFixedWidth = true;
               accum = nextLine;
            }
         } else { // variable width characters
            if( !modeFixedWidth ){ // continue variable width mode
               if( initialMode ){
                  accum = nextLine;
                  initialMode = false;
               } else accum += '\n' + nextLine;
            } else { // start variable width mode
               pushMonospace();
               modeFixedWidth = false;
               accum = nextLine;
            }
         }
      });
      // all lines are processed, push the accumulator
      if( modeFixedWidth ){
         pushMonospace();
      } else arrAccum.push(accum);

      return arrAccum;
   }, [
      { type: 'quote', props: [ 'quotedText' ] },
      { type: 'origin', props: ['preParens', 'addrText'] },
      { type: 'tearline', props: ['content'] },
      { type: 'tagline', props: ['content'] }
   ]);
   this.ASTree.defineRenderer(['monospaceBlock'], function(msBlock, render){
      return [
         '<div class="monospaceBlock"><code>',
         render( msBlock.content ),
         '</code></div>'
      ].join('');
   });

   // convert URLs to hyperlinks
   this.ASTree.defineSplitter(function(sourceCode){
      /* jshint -W101 */
      if( typeof sourceCode !== 'string' ) return sourceCode;
      return sourceCode.split(
         /(\b(?:https?|ftp|mailto|bitcoin|dchub|ed2k|facetime|feed|geo|irc(?:6|s)?|magnet|mms|news|nntp|sips?|skype|sms|ssh|tel|telnet|tftp|xmpp):[^\s<>\x22\x27{}\^\[\]`]+)/
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
      { type: 'monospaceBlock', props: [ 'content' ] },
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
   // *) in monospace text
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
      { type: 'monospaceBlock', props: [ 'content' ] },
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
