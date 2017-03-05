var ASTree = require('astree');
var colorsCSS = require('colors.css');
var Dauria = require('dauria');
var extend = require('extend');
var Fiunis = require('fiunis');
var escapeHTML = require('lodash.escape');
var MIME = require('mime');
var UUE = require('uue');

var defaults = {
   dataMode: false,
   fontColor: false,
   color: {
      origin: colorsCSS.maroon,
      tearline: colorsCSS.olive,
      tagline: colorsCSS.orange
   },
   styleCodes: 'Yes',
   fileURLParts: false,
   URLPrefixes: {
      '*': ''
   }
};

// linkURLPrefixed = getPrefixedURL(
//    _converter.options.URLPrefixes, loneURL.URLScheme, loneURL.URL
// );
var getPrefixedURL = function(convPrefixes, URLScheme, theURL){
   var linkURLPrefix;
   if( typeof convPrefixes[ URLScheme ] !== 'undefined' ){
      linkURLPrefix = convPrefixes[URLScheme];
   } else if( typeof convPrefixes[ '*' ] !== 'undefined' ){
      linkURLPrefix = convPrefixes[ '*' ];
   } else linkURLPrefix = '';

   if( typeof linkURLPrefix === 'function' ) return linkURLPrefix(theURL);

   return linkURLPrefix + theURL;
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
      outputHTML += escapeHTML(origin.addrSource);
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
            if( chunk.endsWith('\n') ){
               chunk = chunk.slice(0, chunk.length - 1);
            }
         }

         if( idx > 0 ){ // not the first chunk
            if( chunk.startsWith('\n') ){
               chunk = chunk.slice(1, chunk.length);
            }
         }

         return chunk;
      });
   });
   this.ASTree.defineRenderer(['UUE'], function(objectUUE /*, render*/){
      var mimeType = MIME.lookup(objectUUE.name);
      if( [
         'image/jpeg',
         'image/png',
         'image/gif',
         'image/svg+xml'
      ].includes(mimeType) ){ // image
         var addSourceData = '';
         if( _converter.options.dataMode ){
            addSourceData = [
               ' data-source="',
               Buffer.from(
                  objectUUE.source
               ).toString('base64'),
               '"'
            ].join('');
         }
         var imageURL;
         if( Array.isArray(_converter.options.fileURLParts) ){
            imageURL = [
               _converter.options.fileURLParts[0],
               encodeURIComponent( objectUUE.name ),
               _converter.options.fileURLParts[1]
            ].join('');
         } else {
            imageURL = Dauria.getBase64DataURI(objectUUE.data, mimeType);
         }
         return [
            '<div class="imageUUE" ',
            'data-name="',
            escapeHTML( objectUUE.name ),
            '"',
            addSourceData,
            '>',
            '<img src="',
            escapeHTML( imageURL ),
            '">',
            '</div>'
         ].join('');
      } else { // not an image
         if( _converter.options.dataMode ){
            return [
               '<div class="fileUUE" data-name="',
               escapeHTML( objectUUE.name ),
               '" data-content="',
               objectUUE.data.toString('base64'),
               '">',
               objectUUE.source,
               '</div>'
            ].join('');
         } else { // not an image, and not in dataMode
            var fileURL;
            if( Array.isArray(_converter.options.fileURLParts) ){
               fileURL = [
                  _converter.options.fileURLParts[0],
                  encodeURIComponent( objectUUE.name ),
                  _converter.options.fileURLParts[1]
               ].join('');
            } else {
               fileURL = Dauria.getBase64DataURI(objectUUE.data, mimeType);
            }
            return [
               '<div class="linkUUE"><a href="',
               escapeHTML( fileURL ),
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
         while( accum.endsWith('\n') ){
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
            if( /^\s*[^\s<>]*>+/.test(nextLine) ){
               // a quote is found
               // abort the plain text mode, start the quote mode
               if( initialMode ){
                  initialMode = false;
               } else arrayAccum.push(accum);
               modeQuote = true;
               matches = /^\s*([^\s<>]*)(>+)\s*(.*)$/.exec(nextLine);
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
         matches = /^\s*([^\s<>]*)(>+)\s*(.*)$/.exec(nextLine);
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
      var outputHTML = '<blockquote class="fidoQuoteOuter">'.repeat(
         quote.quoteLevel - 1
      );
      outputHTML += '<blockquote ';
      if( _converter.options.dataMode ){
         outputHTML += 'data-authorID="';
         outputHTML += escapeHTML(quote.authorID);
         outputHTML += '" data-quoteLevel="';
         outputHTML += escapeHTML(quote.quoteLevel);
         outputHTML += '" ';
      }
      outputHTML += 'class="fidoQuote">';
      outputHTML += render(quote.quotedText);
      outputHTML += '</blockquote>'.repeat(quote.quoteLevel);

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
         if( sourceText.startsWith('\n') ){
            sourceText = '\u00A0' + sourceText;
         }
         if( sourceText.endsWith('\n') ) sourceText += '\u00A0';
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

   // convert [link text](URL "title") to hyperlinks
   this.ASTree.defineSplitter(function(sourceCode){
      /* jshint -W101 */
      if( typeof sourceCode !== 'string' ) return sourceCode;

      // http://blog.stevenlevithan.com/archives/mimic-lookbehind-javascript
      // an unsupported lookbehind is mimicked by:
      // *) resersing the incoming string by .split('').reverse().join('')
      // *) using a regex that is written backwards
      // *) using a lookahead instead of a lookbehind
      // *) reversing the (array) results of .split
      // *) reversing each (string) element in the results of .split
      // CAUTION: use an inner subregex similar to inline image regex,
      //          but accept any URL scheme (because typos should not explode)
      return sourceCode.split('').reverse().join('').split(
         /\)(?:"((?:[^"]|"\\)*)")?\s*([^()\s<>\x22\x27{}\^\[\]`]+:(s?ptth|ptf|otliam|nioctib|buhcd|k2de|emitecaf|deef|sf|oeg|(?:6|s)?cri|tengam|smm|swen|ptnn|s?pis|epyks|sms|hss|let|tenlet|ptft|ppmx|liamten|xifaera|liamohce|aera|vresqaf|ohcef|qerf))\(\]((?:[^\]]|\)(?:"(?:[^"]|"\\)*")?\s*[^()\s<>\x22\x27{}\^\[\]`]+:[a-z0-9]*[a-z]{2,}\(\](?:[^\]]|]\\)*\[!|]\\)*)\[(?![!\\])/
      ).reverse().map(unreversed => {
         if( typeof unreversed === 'undefined' ) return unreversed;
         return unreversed.split('').reverse().join('');
      }).map(function(sourceFragment, fragmentIndex, fragmentArray){
         if( fragmentIndex % 5 === 0 ){ // simple fragment's index: 0, 5...
            if( fragmentIndex === fragmentArray.length - 1 ){ // final
               return sourceFragment;
            }
            return sourceFragment.replace(/\\\[$/g, '[');
         } else if( fragmentIndex % 5 === 1 ){
            // link text's index: 1, 6, 11...
            // next(+1) is the URL scheme's index: 2, 7, 12...
            // next(+2) is the whole URL's index: 3, 8, 13...
            // next(+3) is the title's index: 4, 9, 14...
            // TODO: the order of +1 and +2 becomes reversed
            //       if ECMAScript 7 introduces lookbehind assertions
            var linkTitle = fragmentArray[ fragmentIndex + 3 ];
            if( typeof linkTitle === 'undefined' ){
               linkTitle = '';
            } else linkTitle = linkTitle.replace(/\\"/g, '"');
            return {
               type: 'inlineHyperlink',
               linkText: sourceFragment.replace(
                  /^\n+/g, '' // remove initial newlines from the link text
               ).replace(
                  /\n+$/g, '' // remove final newlines from the link text
               ).split(
                  // CAUTION: use an inner subregex similar to inline image,
                  //          but accept any URL scheme
                  //          (because typos should not explode)
                  /(!\[(?:[^\]]|\\])*\]\([a-z]{2,}[a-z0-9]*:[^()\s<>\x22\x27{}\^\[\]`]+\s*(?:"(?:[^"]|\\")*")?\))/
               ).map(function(linkTextFragment, linkTextFragmentIndex){
                  if( linkTextFragmentIndex % 2 === 0 ){
                     // simple fragment's index: 0, 2...
                     return linkTextFragment.replace(
                        /\\]/g, ']'
                     );
                  } else return linkTextFragment; // inline image → verbatim
               }),
               linkURL: fragmentArray[ fragmentIndex + 2 ],
               URLScheme: fragmentArray[ fragmentIndex + 1 ],
               linkTitle: linkTitle
            };
         } else return null;
      }).filter( elem => elem !== null );
   }, [
      { type: 'quote', props: [ 'quotedText' ] },
      { type: 'monospaceBlock', props: [ 'content' ] },
      { type: 'origin', props: ['preParens'] },
      { type: 'tearline', props: ['content'] },
      { type: 'tagline', props: ['content'] }
   ]);
   this.ASTree.defineRenderer(
      ['inlineHyperlink'],
      function(inlineHyperlink, render){
         if( _converter.options.dataMode ){
            return [
               '<a href="javascript:;" data-href="',
               getPrefixedURL(
                  _converter.options.URLPrefixes,
                  inlineHyperlink.URLScheme,
                  inlineHyperlink.linkURL
               ),
               '" title="',
   	         inlineHyperlink.linkTitle,
	            '">',
               render( inlineHyperlink.linkText ),
               '</a>'
            ].join('');
         }
         return [
            '<a href="',
            getPrefixedURL(
               _converter.options.URLPrefixes,
               inlineHyperlink.URLScheme,
               inlineHyperlink.linkURL
            ),
            '" title="',
	         inlineHyperlink.linkTitle,
	         '">',
            render( inlineHyperlink.linkText ),
            '</a>'
         ].join('');
      }
   );

   // convert ![alt](URL "title") to images
   this.ASTree.defineSplitter(function(sourceCode){
      /* jshint -W101 */
      if( typeof sourceCode !== 'string' ) return sourceCode;
      // TODO: add area|faqserv|fecho|freq support
      // CAUTION: inlineHyperlink should use similar regex twice
      return sourceCode.split(
         /!\[((?:[^\]]|\\])*)\]\(((https?|ftp|fs):[^()\s<>\x22\x27{}\^\[\]`]+)\s*(?:"((?:[^"]|\\")*)")?\)/
      ).map(function(sourceFragment, fragmentIndex, fragmentArray){
         if( fragmentIndex % 5 === 0 ){ // simple fragment's index: 0, 5...
            return sourceFragment;
         } else if( fragmentIndex % 5 === 1 ){
            // alt text's index: 1, 6, 11...
            // next(+1) is the whole URL's index: 2, 7, 12...
            // next(+2) is the URL scheme's index: 3, 8, 13...
            // next(+3) is the title's index: 4, 9, 14...
            var imageTitle = fragmentArray[ fragmentIndex + 3 ];
            if( typeof imageTitle === 'undefined' ){
               imageTitle = '';
            } else imageTitle = imageTitle.replace(/\\"/g, '"');
            return {
               type: 'inlineImage',
               textAlt: sourceFragment.replace(
                  /\\]/g, ']'
               ).replace(
                  /^\n+/g, '' // remove initial newlines from the alt text
               ).replace(
                  /\n+$/g, '' // remove final newlines from the alt text
               ).replace(
                  /\n/g, ' ' // where <br> would appear in further processing
               ),
               imageURL: fragmentArray[ fragmentIndex + 1 ],
               URLScheme: fragmentArray[ fragmentIndex + 2 ],
               imageTitle: imageTitle
            };
         } else return null;
      }).filter( elem => elem !== null );
   }, [
      { type: 'quote', props: [ 'quotedText' ] },
      { type: 'monospaceBlock', props: [ 'content' ] },
      { type: 'origin', props: ['preParens'] },
      { type: 'tearline', props: ['content'] },
      { type: 'tagline', props: ['content'] },
      { type: 'inlineHyperlink', props: ['linkText'] }
   ]);
   this.ASTree.defineRenderer(['inlineImage'], function(inlineImage){
      if( _converter.options.dataMode ){
         return [
            '<img src="',
            'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
            '" data-src="',
            getPrefixedURL(
               _converter.options.URLPrefixes,
               inlineImage.URLScheme,
               inlineImage.imageURL
            ),
	         '" alt="',
	         inlineImage.textAlt,
	         '" title="',
	         inlineImage.imageTitle,
	         '">'
         ].join('');
      }
      return [
         '<img src="',
         getPrefixedURL(
            _converter.options.URLPrefixes,
            inlineImage.URLScheme,
            inlineImage.imageURL
         ),
         '" alt="',
         inlineImage.textAlt,
         '" title="',
         inlineImage.imageTitle,
         '">'
      ].join('');
   });

   // convert lone URLs to hyperlinks
   this.ASTree.defineSplitter(function(sourceCode){
      /* jshint -W101 */
      if( typeof sourceCode !== 'string' ) return sourceCode;
      return sourceCode.split(
         /(\b(https?|ftp|mailto|bitcoin|dchub|ed2k|facetime|feed|fs|geo|irc(?:6|s)?|magnet|mms|news|nntp|sips?|skype|sms|ssh|tel|telnet|tftp|xmpp|netmail|areafix|echomail|area|faqserv|fecho|freq):[^\s<>\x22\x27{}\^\[\]`]+)/
      ).map(function(sourceFragment, fragmentIndex, fragmentArray){
         if( fragmentIndex % 3 === 0 ){ // simple fragment's index: 0, 3...
            return sourceFragment;
         } else if( fragmentIndex % 3 === 1 ){
            // whole regex-captured fragment's index: 1, 4, 7...
            return {
               type: 'loneURL',
               URL: sourceFragment,
               textURL: sourceFragment,
               URLScheme: fragmentArray[ fragmentIndex + 1 ]
            };
         } else return null;
      }).filter( elem => elem !== null );
   }, [
      { type: 'quote', props: [ 'quotedText' ] },
      { type: 'monospaceBlock', props: [ 'content' ] },
      { type: 'origin', props: ['preParens'] },
      { type: 'tearline', props: ['content'] },
      { type: 'tagline', props: ['content'] }
   ]);
   this.ASTree.defineRenderer(['loneURL'], function(loneURL /*, render*/){
      if( _converter.options.dataMode ){
         return [
            '<a href="javascript:;" data-href="',
            getPrefixedURL(
               _converter.options.URLPrefixes, loneURL.URLScheme, loneURL.URL
            ),
            '">',
            loneURL.textURL,
            '</a>'
         ].join('');
      }
      return [
         '<a href="',
         getPrefixedURL(
            _converter.options.URLPrefixes, loneURL.URLScheme, loneURL.URL
         ),
         '">',
         loneURL.textURL,
         '</a>'
      ].join('');
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

      return replacements.reduce(
         (result, nextRep) => result.replace(nextRep[0], nextRep[1]),
         sourceNode
      );
   }, [
      { type: 'quote', props: [ 'quotedText' ] },
      { type: 'monospaceBlock', props: [ 'content' ] },
      { type: 'UUE', props: [ 'source' ] },
      { type: 'loneURL', props: [ 'textURL' ] },
      { type: 'inlineHyperlink', props: ['linkText', 'linkTitle'] },
      { type: 'inlineImage', props: [ 'textAlt', 'imageTitle' ] },
      { type: 'origin', props: ['preParens', 'addrText'] },
      { type: 'tearline', props: ['content'] },
      { type: 'tagline', props: ['content'] }
   ]);
};

FidoHTML.prototype.setOptions = function(options){
   this.options = extend(true, {}, this.options, options);
};

FidoHTML.prototype.fromText = function(msgText){
   return this.ASTree.render(msgText);
};

module.exports = FidoHTML;
