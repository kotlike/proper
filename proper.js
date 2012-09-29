//     Proper is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/michael/proper

// Goals:
//
// * Annotations (strong, em, code, link) are exclusive. No text can be both
//   emphasized and strong.
// * The output is semantic, valid HTML.
// * Cross-browser compatibility: Support the most recent versions of Chrome,
//   Safari, Firefox and Internet Explorer. Proper should behave the same on
//   all these platforms (if possible).
//
// Proper uses contenteditable to support these features. Unfortunately, every
// browser handles contenteditable differently, which is why many
// browser-specific workarounds are required.

(function(){

  // Refences to the native implementations of the standard functions to facilitate life a little
  var
    ecmaFilter = Array.prototype.filter,
    ecmaForEach = Array.prototype.forEach,
    ecmaIndexOf = Array.prototype.indexOf,
    ecmaIsArray = Array.isArray,
    ecmaMap = Array.prototype.map,
    ecmaSlice = Array.prototype.slice,
    ecmaTrim = String.prototype.trim;

  // Object encapsulating the most functions needed for collection and string manipulations (Borrowed from Underscore.js)
  var help = {};

  // Collection function

  // Extend a given object with all the properties in passed-in object(s).
  help.extend = function(obj) {
    help.each( ecmaSlice.call(arguments, 1), function(s) {
      for (var p in s) obj[p] = s[p];
    });
    return obj;
  };

  help.map = function(obj, iterator, context) {
    var res = [];
    if (ecmaMap && obj.map === ecmaMap) return obj.map(iterator, context);
    help.each(obj, function(value, index, list) {
      res[res.length] = iterator.call(context, value, index, list);
    });
    return res;
  };

  help.filter = function(obj, iterator, context) {
    var res = [];
    if (ecmaFilter && obj.filter === ecmaFilter) return obj.filter(iterator, context);
    help.each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) res[res.length] = value;
    });
    return res;
  };

  help.each = function(obj, iterator, context) {
    // XUI provides a fallback implementation of native forEach so it should be fine
    if (ecmaForEach && obj.forEach === ecmaForEach) return obj.forEach(iterator, context);
    else if ( typeof obj.length == 'number'){
      for (var i = 0, l = obj.length; i < l; i++)
        if (iterator.call(context, obj[i], i, obj) === false) return;
    }
    else{
      for (var key in obj){
        if (Object.prototype.hasOwnProperty.call(obj, key))
          if (iterator.call(context, obj[key], key, obj) === false) return;
      }
    }
  };

  help.indexOf = function(a, e) {
    if (ecmaIndexOf && a.indexOf === ecmaIndexOf) return a.indexOf(e);
    for (var i = 0, l = a.length; i < l; ++i) if ( e === a[i]) return i;
    return -1;
  };

  help.clone = function(obj) {
    return help.isArray(obj) ? obj.slice() : help.extend({}, obj);
  };

  help.isArray = ecmaIsArray || function(obj) {
    return !!(obj && obj.concat && obj.unshift && !obj.callee);
  };

  // String functions

  // jQuery implementation
  help.trim = ecmaTrim && !ecmaTrim.call("\uFEFF\xA0") ?
    function( text ) {
      return text == null ?
        "" :
        ecmaTrim.call( text );
    } :
    // Otherwise use our own trimming functionality
    function( text ) {
      return text == null ?
        "" :
        text.toString().replace( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "" );
  };

  help.stripTags = function(input, allowed) {
    // Strips HTML and PHP tags from a string
    //
    // version: 1009.2513
    // discuss at: http://phpjs.org/functions/strip_tags
    allowed = (((allowed || "") + "")
      .toLowerCase()
      .match(/<[a-z][a-z0-9]*>/g) || [])
      .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
      commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(tags, function($0, $1){
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
  };

  // Helpers for handling the DOM

  // Check if the current elements name equals to the given one
  help.isNode = function(elem, name){
    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  };
  // Get all sibling nodes of n != elem of type Element
  help.elemSiblings = function( n, elem ) {
    var r = [];

    for ( ; n; n = n.nextSibling ) {
      if ( n.nodeType === 1 && n !== elem ) {
        r.push( n );
      }
    }

    return r;
  };
  // Get `dir` sibling node of type Element starting from `cur`
  help.sibling = function( cur, dir ){
    do {
      cur = cur[ dir ];
    } while ( cur && cur.nodeType !== 1 );

    return cur;
  };
  // Sizzle's utility function
  help.text = function( elems ) {
    var ret = "", elem;

    for ( var i = 0; elems[i]; i++ ) {
      elem = elems[i];

      // Get the text from text nodes and CDATA nodes
      if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
        ret += elem.nodeValue;

        // Traverse everything else, except comment nodes
      } else if ( elem.nodeType !== 8 ) {
        ret += help.text( elem.childNodes );
      }
    }

    return ret;
  };

  // Borrowed from jQuery.browser, slightly modified though
  var browser = {};
  // We do not want to pollute our object with unnecessary variables
  (function(){

    var matched = (function( ua ) {
      ua = ua.toLowerCase();

      var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
        /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
        /(msie) ([\w.]+)/.exec( ua ) ||
        ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
        [];

      return {
        browser: match[ 1 ] || "",
        version: match[ 2 ] || "0"
      };
    })(window.navigator.userAgent);

    if ( matched.browser ) {
      browser[ matched.browser ] = true;
      browser.version = matched.version;
    }
  })();

  // Chrome is Webkit, but Webkit is also Safari.
  if ( browser.chrome ) {
    browser.webkit = true;
  } else if ( browser.webkit ) {
    browser.safari = true;
  }



  // extend XUI with functionality it lacks ( adopted most of the jQuery's methods to work with XUI)

  if(typeof window.xui != 'undefined' &&
     typeof window.x$ != undefined){

    x$.extend({
      // Pass each element in the current matched set through a function,
      // producing a new XUI object containing the return values.
      //
      //     `element` is the current element
      //     `index` is the element index in the XUI collection
      //     `args` is optional argument you may pass to the function
      //     function( element, index, args ) {
      //         `this` is the current element
      //     }
      //
      // In case the function returns null value it won't be included in the resulting set of elements
      map: function(fn, args){
        var ret = [];
        // capture only non-null values
        help.map(ecmaSlice.call(this), function(el, i){
          var val = fn.call(el, el, i, args);
          if ( val != null ) {
            ret[ ret.length ] = val;
          }
        }, this);
        // construct a new XUI object with flattened array of elements
        return this.set(ret.concat.apply([], ret));
      },
      // Reduce the set of matched elements to the one at the specified index.
      eq: function( i ) {
        i = +i;
        return i === -1 ?
          this.slice( i ) :
          this.slice( i, i + 1 );
      },
      // Returns the first element in the matched set
      first: function() {
        return this.eq( 0 );
      },
      // Returns the last element in the matched set
      last: function() {
        return this.eq( -1 );
      },
      // Pipe the matched set of elements through the core Array.prototype.slice method
      slice: function() {
        return this.set( ecmaSlice.apply( this, arguments ));
      },
      // Retrieve the DOM elements matched by the XUI object.
      // If called with no arguments Converts XUI Collection to plain Array
      get: function(n){
        return n === undefined || typeof n != 'number' ?
          // Return a 'clean' array
          ecmaSlice.call(this) :
          // Otherwise return the n-th object
          ( n < 0 ? this[ this.length + n ] : this[ n ] );
      },
      // Check the current matched set of elements against a selector, callback in the form of function(elem, index)
      // element, or XUI object and return true if at least one of these
      // elements matches the given arguments.
      is: function(q){
        var list = this;
        return !!q && (
          typeof q == "string" ?
            // to be more efficient, that is not to search in a context of the document
            // get the parents of our elements and then filter results
            // TODO: maybe use Sizzle library at a later time
            this.parent().find(q).filter(function(){
              var found, s = this;
              list.each(function(el){
                return found = s === el;
              });
              return found;
            }).length > 0 :
            this.filter( function(i){
              if ( typeof q == 'function' ) {
                return !!q.call(this, this, i);
              } else if ( q.nodeType ) {
                return this === q;
              }
              return help.indexOf(q, this) >= 0;
            } ).length > 0 );
      },
      // Get the combined text contents of each element in the set of matched elements, including their descendants.
      // Set the content of each element in the set of matched elements to the specified text.
      text: function( val ) {
          return val === undefined ?
            help.text( this ) :
            this.empty().bottom( ( this[0] && this[0].ownerDocument || document ).createTextNode( val ) );
      },
      // removes the set of matched elements from the DOM
      // optionally filtered by a selector.
      remove: function(q){
        return q === undefined ?
          this.html('remove') :
          this.filter(function(i){ // TODO: .each may be more efficient, but references to removed elements will remain
            var elem = x$(this),
              match = elem.is(q);
            if(match) elem.html('remove');

            return !match;
          });
      },
      // Remove all child nodes of the set of matched elements from the DOM.
      empty: function(){
        return this.each(function(el){
          while(el.firstChild) el.removeChild(el.firstChild);
        });
      },
      // Replace each element in the set of matched elements with the provided new content.
      //
      // value is either a string of html, element or a callback
      // `index` - elements index
      // `old` - old HTML
      // function(index, old_content){
      //     `this` is the element itself
      // }
      //
      // .replace() is an alias for html('outer', value) and outer(value)
      // except those two do not accept a callback
      replace: function(value){
        if(typeof value == 'function'){
          return this.each(function(el, i){
            var s = x$(el),
              old = s.html();
            s.replace( value.call( el, i , old ) );
          });
        }

        return xui.fn.html.call(this, 'outer', value);
      },
      // Wrap an HTML structure around all elements in the set of matched elements.
      wrap: function(html){
        var isFunc = typeof html == 'function';
        return this.each(function(el, i){
          // The elements to wrap the target around
          var s = x$(this),
              wrapper = x$( isFunc ? html.call(el, el, i) : html, this.ownerDocument ).eq(0);

          if ( this.parentNode ) {
            s.before(wrapper);
          }

          wrapper.map(function() {
            var elem = this;

            while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
              elem = elem.firstChild;
            }

            return elem;
          }).bottom( s.remove() );

        });
      },
      // Remove the parents of the set of matched elements from the DOM,
      // leaving the matched elements in their place.
      unwrap: function() {
        return this.parent().each(function() {
          if ( !help.isNode( this, "body" ) ) {
            x$( this ).replace( x$(this.childNodes) ); // XUI cannot accept the NodeList as a parameter to .html('outer', --> elem <-- );
          }
        });
      },
      // simple function to call the original element's focus function
      // if it exists on an element and return XUI collection back
      focus: function(){
        var el = this.get(0);
        el.focus && setTimeout( function(){
          try{
            el.focus();
          }catch(e){}
        }, 1);
        return this;
      }
    });

    // Bulk extend XUI with commonly used traversal methods
    help.each({
        // Get the parent of each element in the current set of matched elements,
        // optionally filtered by a selector.
        parent: function( elem ) {
          var parent = elem.parentNode;
          return parent && parent.nodeType !== 11 ? parent : null;
        },
        // Get the immediately following sibling of each element in the set of matched elements.
        // If a selector is provided, it retrieves the next sibling only if it matches that selector.
        next: function( elem ) {
          return help.sibling( elem, "nextSibling" );
        },
        // Get the immediately preceding sibling of each element in the set of matched elements,
        // optionally filtered by a selector.
        prev: function( elem ) {
          return help.sibling( elem, "previousSibling" );
        },
        // Get the siblings of each element in the set of matched elements,
        // optionally filtered by a selector.
        siblings: function( elem ) {
          return help.elemSiblings( ( elem.parentNode || {} ).firstChild, elem );
        },
        // Get the children of each element in the set of matched elements,
        // optionally filtered by a selector.
        children: function( elem ) {
          return help.elemSiblings( elem.firstChild );
        },
        // Get the children of each element in the set of matched elements,
        // including text and comment nodes.
        contents: function( elem ) {
          return help.isNode( elem, "iframe" ) ?
            elem.contentDocument || elem.contentWindow.document :
            [].concat(elem.childNodes);

        }
      },
      function( fn, name ) {
        xui.fn[ name ] = function( selector ) {
          return selector && typeof selector === "string" ? this.map(fn).find(selector) : this.map(fn);
        };
      }, this);
  }
  // Kind of a plug-in for XUI not to pollute the namespace with bunch of variables
  // Adds the ability to bind a keyboard shortcut to the XUI collection
  //
  //         keydown | keyup | keypress(shortcut, callback);
  //
  // use .un( 'keydown' | 'keyup' | 'keypress') to unbind all of the previously bound handlers
  (function(xui){

    var shortcuts = {
      specialKeys: {
        8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
        20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
        37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
        96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
        104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
        112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
        120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
      },

      shiftNums: {
          "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
          "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
          ".": ">",  "/": "?",  "\\": "|"
      }
    };

    function shortcutHandler(short, callback){
      short = short.toLowerCase();
      // We do not process keyboard shortcuts for input and textarea fields
      // Change this if necessary later
      if(help.isNode(this.target, 'input') || help.isNode(this.target, 'textarea')) return;

      var code = this.keyCode || this.which,
          plain = String.fromCharCode( code ).toLowerCase(),
          special = this.type !== "keypress" && shortcuts.specialKeys[ code ],
          modifier = '',
          variations = [];

      // check combinations (alt|ctrl|shift+anything)
      if ( this.altKey && special !== "alt" ) {
        modifier += "alt+";
      }

      if ( this.ctrlKey && special !== "ctrl" ) {
        modifier += "ctrl+";
      }

      if ( this.metaKey && !this.ctrlKey && special !== "meta" ) {
        modifier += "meta+";
      }

      if ( this.shiftKey && special !== "shift" ) {
        modifier += "shift+";
      }

      if ( special ) {
        variations[ modifier + special ] = true;

      } else {
        variations[ modifier + plain ] = true;
        variations[ modifier + shortcuts.shiftNums[ plain ] ] = true;

        // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
        if ( modifier === "shift+" ) {
          variations[ shortcuts.shiftNums[ plain ] ] = true;
        }
      }

      if(variations[short]){
        return callback(this);
      }

 }

    help.each(['keydown', 'keyup', 'keypress'], function(name){
      xui.fn[ name ] = function(short, fn){
        return this.on(name, function(e){
          // TODO: make one central dispatcher that looks through the [ shortcut -> handler ] mapping array for each element only ones
          return shortcutHandler.call(e, short, fn);
        });
      }
    });
  })(xui);



  // borrowed from Backbone.js)
  // ------------------------------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may `bind` or `unbind` a callback function to an event;
  // `trigger`-ing an event fires all callbacks in succession.
  //
  //     var object = {};
  //     help.extend(object, Backbone.Events);
  //     object.bind('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //

  var Events = window.Backbone ? Backbone.Events : {
    // Bind an event, specified by a string name, `ev`, to a `callback` function.
    // Passing `"all"` will bind the callback to all events fired.
    bind : function(ev, callback) {
      var calls = this._callbacks || (this._callbacks = {});
      var list  = this._callbacks[ev] || (this._callbacks[ev] = []);
      list.push(callback);
      return this;
    },

    // Remove one or many callbacks. If `callback` is null, removes all
    // callbacks for the event. If `ev` is null, removes all bound callbacks
    // for all events.
    unbind : function(ev, callback) {
      var calls;
      if (!ev) {
        this._callbacks = {};
      } else if (calls = this._callbacks) {
        if (!callback) {
          calls[ev] = [];
        } else {
          var list = calls[ev];
          if (!list) return this;
          for (var i = 0, l = list.length; i < l; i++) {
            if (callback === list[i]) {
              list.splice(i, 1);
              break;
            }
          }
        }
      }
      return this;
    },

    // Trigger an event, firing all bound callbacks. Callbacks are passed the
    // same arguments as `trigger` is, apart from the event name.
    // Listening for `"all"` passes the true event name as the first argument.
    trigger : function(ev) {
      var list, calls, i, l;
      if (!(calls = this._callbacks)) return this;
      if (list = calls[ev]) {
        for (i = 0, l = list.length; i < l; i++) {
          list[i].apply(this, ecmaSlice.call(arguments, 1));
        }
      }
      if (list = calls['all']) {
        for (i = 0, l = list.length; i < l; i++) {
          list[i].apply(this, arguments);
        }
      }
      return this;
    }
  };

  /* Adapted from http://github.com/hasenj/proper */
  function getDirection(text, guesstimate) {
    function getWordDir(word) {
      // regexes to identify ltr and rtl characters
      // stolen from google's i18n.bidi
      var ltr_re_ =
          'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' +
          '\u2C00-\uFB1C\uFE00-\uFE6F\uFEFD-\uFFFF';

      var rtl_re_ = '\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC';
      // end of google steal
      var ltr_re = RegExp('[' + ltr_re_ + ']+');
      var rtl_re = RegExp('[' + rtl_re_ + ']+');
      if(ltr_re.exec(word)) {
          return 'L';
      } else if (rtl_re.exec(word)) {
          return 'R';
      } else {
          return 'N';
      }
    }

    if (guesstimate == null) guesstimate = false;

    // TODO: check first character is a unicode dir character!
    var is_word = function(word) {
        return word.length > 0; // && word.match(/\w+/) 
        // wops! \w only matches ascii characters :(
    }
    var words = help.filter(text.split(' '), is_word);

    var dirs = help.map(words,getWordDir);

    var func_same_direction = function(dir) { 
        return function(d) { return d == dir; }; 
    }
    var is_non_neutral_dir = function(d) { return d != 'N'; };
    var other_direction = function(dir) { return {'L':'R', 'R':'L'}[dir]; };

    // should be really the same as dirs because we already filtered out
    // things that are not words!
    var X = 100;
    var hard_dirs = help.filter(dirs, is_non_neutral_dir).slice(0, X);

    if (hard_dirs.length == 0) { return 'N'; }
    var candidate = hard_dirs[0];

    if(guesstimate === false) {
        return candidate;
    }

    var DIR_COUNT_THRESHOLD = 10;
    if (hard_dirs.length < DIR_COUNT_THRESHOLD) return candidate;

    var cand_words = hard_dirs.filter(func_same_direction(candidate));
    var other_words = hard_dirs.filter(func_same_direction(other_direction(candidate)));

    if (other_words.length == 0) return candidate;
    var other_dir = other_words[0];

    var MIN_RATIO = 0.4; // P
    var ratio = cand_words.length / other_words.length;
    if (ratio >= MIN_RATIO) {
        return candidate;
    } else {
        return other_dir;
    }
  }

  // Initial Setup
  // -------------

  var controlsTpl = ' \
    <div class="proper-commands"> \
      <a href="#" title="Emphasis (CTRL+SHIFT+E)" class="command em" command="em"><div>Emphasis</div></a> \
      <a href="#" title="Strong (CTRL+SHIFT+S)" class="command strong" command="strong"><div>Strong</div></a> \
      <a href="#" title="Inline Code (CTRL+SHIFT+C)" class="command code" command="code"><div>Code</div></a> \
      <a title="Link (CTRL+SHIFT+L)" href="#" class="command link" command="link"><div>Link</div></a>\
      <a href="#" title="Bullet List (CTRL+SHIFT+B)" class="command ul" command="ul"><div>Bullets List</div></a>\
      <a href="#" title="Numbered List (CTRL+SHIFT+N)" class="command ol" command="ol"><div>Numbered List</div></a>\
      <a href="#" title="Indent (TAB)" class="command indent" command="indent"><div>Indent</div></a>\
      <a href="#" title="Outdent (SHIFT+TAB)" class="command outdent" command="outdent"><div>Outdent</div></a>\
      <br class="clear"/>\
    </div>';
  
  // Proper
  // ------
  
  this.Proper = function(options) {
    var $activeElement = null, // element that's being edited (this is an instance of XUI so that we do not need to call x$() each time we need XUI's functionality)
        $controls,
        direction = "left",
        events = help.extend({}, Events),
        pendingChange = false,
        options = {},
        defaultOptions = { // default options
          multiline: true,
          markup: true,
          placeholder: 'Enter Text',
          startEmpty: false,
          codeFontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
        },
        Node = window.Node || { // not available in IE
          TEXT_NODE: 3,
          COMMENT_NODE: 8
        };
    
    
    // Commands
    // --------
    
    function exec(cmd) {
      var command = commands[cmd];
      if (command.exec) {
        command.exec();
      } else {
        if (command.isActive()) {
          command.toggleOff();
        } else {
          command.toggleOn();
        }
      }
      updateCommandState();
      setTimeout(function() { events.trigger('changed'); }, 10);
    }

    function removeFormat() {
      document.execCommand('removeFormat', false, true);
      help.each(['em', 'strong', 'code'], function (cmd) {
        var command = commands[cmd];
        if (command.isActive()) {
          command.toggleOff();
        }
      });
    }

    // Give code elements (= monospace font) the class `proper-code`.
    function addCodeClasses() {
      $activeElement.find('font').addClass('proper-code');
    }

    var nbsp = x$('<span>&nbsp;</span>').text();

    var commands = {
      em: {
        isActive: function() {
          try{return document.queryCommandState('italic', false, true);} catch(e) {return false;}
        },
        toggleOn: function() {
          removeFormat();
          document.execCommand('italic', false, true);
        },
        toggleOff: function() {
          document.execCommand('italic', false, true);
        }
      },

      strong: {
        isActive: function() {
          try{return document.queryCommandState('bold', false, true);} catch(e) {return false;}
        },
        toggleOn: function() {
          removeFormat();
          document.execCommand('bold', false, true);
        },
        toggleOff: function () {
          document.execCommand('bold', false, true);
        }
      },

      code: {
        isActive: function() {
          return cmpFontFamily(document.queryCommandValue('fontName'), options.codeFontFamily);
        },
        toggleOn: function() {
          removeFormat();
          document.execCommand('fontName', false, options.codeFontFamily);
          addCodeClasses();
        },
        toggleOff: function () {
          var sel;
          if (browser.webkit && (sel = saveSelection()).collapsed) {
            // Workaround for Webkit. Without this, the user wouldn't be
            // able to disable <code> when there's no selection.
            var container = sel.endContainer
            ,   offset = sel.endOffset;
            container.data = container.data.slice(0, offset)
                           + nbsp
                           + container.data.slice(offset);
            var newSel = document.createRange();
            newSel.setStart(container, offset);
            newSel.setEnd(container, offset+1);
            restoreSelection(newSel);
            document.execCommand('removeFormat', false, true);
          } else {
            document.execCommand('removeFormat', false, true);
          }
        }
      },

      link: {
        exec: function() {
          removeFormat();
          document.execCommand('createLink', false, window.prompt('URL:', 'http://'));
        }
      },

      ul: {
        isActive: function() {
          try{return document.queryCommandState('insertUnorderedList', false, true);} catch(e) {return false;}
        },
        exec: function() {
          document.execCommand('insertUnorderedList', false, true);
        }
      },

      ol: {
        isActive: function() {
          try{return document.queryCommandState('insertOrderedList', false, true);} catch(e) {return false;}
        },
        exec: function() {
          document.execCommand('insertOrderedList', false, true);
        }
      },

      indent: {
        exec: function() {
          try{
            if (document.queryCommandState('insertOrderedList', false, true) ||
                document.queryCommandState('insertUnorderedList', false, true)) {
              document.execCommand('indent', false, true);
            }
          } catch(e) {}
        }
      },

      outdent: {
        exec: function() {
          try{
            if (document.queryCommandState('insertOrderedList', false, true) ||
                document.queryCommandState('insertUnorderedList', false, true)) {
              document.execCommand('outdent', false, true);
            }
          } catch(e) {}
        }
      }
    };
    
    // Returns true if a and b is the same font family. This is used to check
    // if the current font family (`document.queryCommandValue('fontName')`)
    // is the font family that's used to style code.
    function cmpFontFamily(a, b) {
      function normalizeFontFamily(s) {
        return (''+s).replace(/\s*,\s*/g, ',').replace(/'/g, '"');
      }
      
      a = normalizeFontFamily(a);
      b = normalizeFontFamily(b);
      // Internet Explorer's `document.queryCommandValue('fontName')` returns
      // only the applied font family (e.g. `Consolas`), not the full font
      // stack (e.g. `Monaco, Consolas, "Lucida Console", monospace`).
      if (browser.msie) {
        if (a.split(',').length === 1) {
          return help.indexOf(b.split(','), a) > -1;
        } else if (b.split(',').length === 1) {
          return help.indexOf(a.split(','), b) > -1;
        } else {
          return a === b;
        }
      } else {
        return a === b;
      }
    }
    
    
    // Semantify/desemantify content
    // -----------------------------
    
    function escape(text) {
      return text.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;');
    }

    function unescape(text) {
      return text.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ');
    }

    function updateDirection() {
      var dir = getDirection($activeElement.text());
      direction = dir === "R" ? "right" : "left";
      $activeElement.setStyle('direction', dir === "R" ? "rtl" : "ltr");
    }
    
    // Recursively walks the dom and returns the semantified contents. Replaces
    // presentational elements (e.g. `<b>`) with their semantic counterparts
    // (e.g. `<strong>`).
    function semantifyContents(node) {
      function replace(presentational, semantic) {
        node.find(presentational).each(function () {
          x$(this).replace(x$(document.createElement(semantic)).html(x$(this).html()));
        });
      }
      replace('i', 'em');
      replace('b', 'strong');
      replace('.proper-code', 'code');
      replace('div', 'p');
      //replace('span', 'span');

      node.find('span').each(function () {
        if (this.firstChild) {
          x$(this.firstChild).unwrap();
        }
      });
      
      node.find('p, ul, ol').each(function () {
        while (x$(this).parent().is('p')) {
          x$(this).unwrap();
        }
      });
      
      // Fix nested lists
      node.find('ul > ul, ul > ol, ol > ul, ol > ol').each(function () {
        var s = x$(this),
            prev = s.prev();
        if (prev.length) {
          prev.bottom(this);
        } else {
          s.wrap(x$('<li />'));
        }
      });
      
      (function () {
        var currentP = [];
        function wrapInP() {
          if (currentP.length) {
            var p = x$(currentP[0]).before('<p />').prev();
            for (var i = 0, l = currentP.length; i < l; i++) {
              p.bottom( x$(currentP[i]).remove() );
            }
            currentP = [];
          }
        }

        // help.clone is necessary because it turns the `childNodes` live
        // dom collection into a static array.
        var children = help.clone(node.get(0).childNodes);
        for (var i = 0, l = children.length; i < l; i++) {
          var child = children[i];
          if (!x$(child).is('p, ul, ol') &&
              !(child.nodeType === Node.TEXT_NODE && (/^\s*$/).exec(child.data))) {
            currentP.push(child);
          } else {
            wrapInP();
          }
        }
        wrapInP();
      })();
      
      // Remove unnecessary br's
      node.find('br').each(function () {
        if (this.parentNode.lastChild === this) {
          x$(this).remove();
        }
      });
      
      // Remove all spans
      node.find('span').each(function () {
        x$(this).children().first().unwrap();
      });
    }
    
    // Replaces semantic elements with their presentational counterparts
    // (e.g. <em> with <i>).
    function desemantifyContents(node) {
      doWithSelection(function () {
        function replace(semantic, presentational) {
          node.find(semantic).each(function () {
            var presentationalEl = x$(presentational).get(0);
            
            var child;
            while (child = this.firstChild) {
              presentationalEl.appendChild(child);
            }
            
            x$(this).replace(presentationalEl);
          });
        }
        replace('em', '<i />');
        replace('strong', '<b />');
        replace('code', '<font class="proper-code" face="'+escape(options.codeFontFamily)+'" />');
      });
    }
    
    // Update the control buttons' state.
    function updateCommandState() {
      if (!options.markup) return;
      
      $controls.find('.command').removeClass('selected');
      help.each(commands, function(command, name) {
        if (command.isActive && command.isActive()) {
          $controls.find('.command.'+name).addClass('selected');
        }
      });
    }
    
    
    // Placeholder
    // -----------
    
    // If the $activeElement has no content, display the placeholder and give
    // the element the class `empty`.
    function maybeInsertPlaceholder() {
      if (help.trim($activeElement.text()).length === 0) {
        $activeElement.addClass('empty');
        $activeElement.html( options.markup ? '<p>'+options.placeholder+'</p>' : options.placeholder );
      }
    }
    
    // If the $activeElement has the class `empty`, remove the placeholder and
    // the class.
    function maybeRemovePlaceholder() {
      if ($activeElement.hasClass('empty')) {
        $activeElement.removeClass('empty');
        selectAll();
        document.execCommand('delete', false, "");
      }
    }
    
    
    // DOM Selection
    // -------------
    
    // Returns the current selection as a dom range.
    function saveSelection() {
      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
          return sel.getRangeAt(0);
        }
      } else if (document.selection && document.selection.createRange) { // IE
        return document.selection.createRange();
      }
      return null;
    }
    
    // Selects the given dom range.
    function restoreSelection(range) {
      if (range) {
        if (window.getSelection) {
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (document.selection && range.select) { // IE
          range.select();
        }
      }
    }
    
    // Selects the whole editing area.
    function selectAll() {
      var el = $activeElement.get(0),
        range;
      
      if (document.body.createTextRange) { // IE < 9
        range = document.body.createTextRange();
        range.moveToElementText(el);
        range.select();
      } else {
        range = document.createRange();
        range.selectNodeContents(el);
      }

      restoreSelection(range);
    }
    
    // Applies fn and tries to preserve the user's selection and cursor
    // position.
    function doWithSelection (fn) {
      // Before
      var sel = saveSelection()
      if (sel) {
        var startContainer = sel.startContainer
        ,   startOffset    = sel.startOffset
        ,   endContainer   = sel.endContainer
        ,   endOffset      = sel.endOffset;
      }
      
      fn();
      
      if (sel) {
        // After
        function isInDom(node) {
          if (node) {
            if (node === document.body) return true;
            if (node.parentNode) return isInDom(node.parentNode);
          }
          return false;
        }
        if (isInDom(startContainer)) {
          sel.setStart(startContainer, startOffset);
        }
        if (isInDom(endContainer)) {
          sel.setEnd(endContainer, endOffset);
        }
        restoreSelection(sel);
      }
    }
    
    
    // Handle events
    // -------------
    
    // Should be called during a paste event. Removes the focus from the
    // currently focused element. Expects a callback function that will be
    // called with a node containing the pasted content.
    function getPastedContent (callback) {

      var tmpEl =  x$(document.body).bottom('<div id="proper_tmp_el" contenteditable="true" />').children().last() // append to the end of the body and switch to appended element
        .css({
          position: 'fixed', top: '20px', left: '20px',
          opacity: '0', 'z-index': '10000',
          width: '1px', height: '1px'
        })
        .focus();

      setTimeout(function () {
        tmpEl.remove();
        callback(tmpEl.html());
      }, 10);
    }

    function cleanPastedContent (node) {
      var allowedTags = {
        p: [], ul: [], ol: [], li: [],
        strong: [], code: [], em: [], b: [], i: [], a: ['href']
      };
      
      function traverse (node) {
        // Remove comments
        x$(node).contents().filter(function () {
          return this.nodeType === Node.COMMENT_NODE
        }).remove();
        
        x$(node).children().each(function () {
          var tag = this.tagName.toLowerCase();
          traverse(this);
          if (allowedTags[tag]) {
            var oldOne  = x$(this)
            ,   newOne = x$(document.createElement(tag));
            newOne.html(oldOne.html());
            help.each(allowedTags[tag], function (name) {
              newOne.attr(name, oldOne.attr(name));
            });
            oldOne.replace(newOne);
          } else if (tag === 'font' && x$(this).hasClass('proper-code')) {
            // do nothing
          } else {
            x$(this).contents().first().unwrap();
          }
        });
      }
      
      x$(node).find('script, style').remove();
      // Remove double annotations
      var annotations = 'strong, em, b, i, code, a';
      x$(node).find(annotations).each(function () {
        x$(this).find(annotations).each(function () {
          x$(this).contents().first().unwrap();
        });
      });
      traverse(node);
    }
    
    // Removes <b>, <i> and <font> tags
    function removeAnnotations (node) {
      x$(node).find('b, i, font').each(function () {
        x$(this).contents().first().unwrap();
      });
    }

    function handlePaste(e){
      var isAnnotationActive = commands.strong.isActive() ||
                               commands.em.isActive() ||
                               commands.code.isActive();
      var selection = saveSelection();

      getPastedContent(function (html) {
        var s = x$('<div />').bottom(unescape(html));
        restoreSelection(selection);
        $activeElement.focus();
        cleanPastedContent(s);
        desemantifyContents(s);
        if (isAnnotationActive) removeAnnotations(s);
        // For some reason last </p> gets injected anyway
        if( (html = s.html()) ) document.execCommand('insertHTML', false, html);
        // make a hint that the content is changed
        setTimeout(function() { events.trigger('changed'); }, 10);
      });
    }
    
    function bindEvents($el) {

      function isTag(node, tag) {
        if (!node || node === $activeElement) return false;
        if (node.tagName && node.tagName.toLowerCase() === tag) return true;
        return isTag(node.parentNode, tag);
      }
      
      $el = x$($el); // not to call x$(el) every time
      
      $el
        .un('paste')
        .un('keydown')
        .un('keyup')
        .un('focus')
        .un('blur');
      
      $el.on('paste', handlePaste);
      
      // Prevent multiline
      $el.on('keydown', function(e) {
        if (!options.multiline && e.keyCode === 13) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (e.keyCode === 8 &&
            help.trim($activeElement.text()) === '' &&
            $activeElement.find('p, li').length === 1) {
          // backspace is pressed and the editor is empty
          // prevent the removal of the last paragraph
          e.preventDefault();
        }
        // By default, Firefox doesn't create paragraphs. Fix this.
        if (browser.mozilla) {
          var selectionStart = saveSelection().startContainer;
          if (options.multiline && !isTag(selectionStart, 'p') && !isTag(selectionStart, 'ul')) {
            document.execCommand('insertParagraph', false, true);
          }
          if (e.keyCode === 13 && !e.shiftKey) {
            window.setTimeout(function () {
              if (!isTag(selectionStart, 'ul')) {
                document.execCommand('insertParagraph', false, true);
              }
            }, 10);
          }
        }
      });
      
      $el
        .on('focus', maybeRemovePlaceholder)
        .on('blur', maybeInsertPlaceholder)
        .on('click', updateCommandState);
      
      $el.on('keyup', function(e) {
        updateCommandState();
        addCodeClasses();
        
        updateDirection();

        // Trigger change events, but consolidate them to 200ms time slices
        setTimeout(function() {
          // Skip if there's already a change pending
          if (!pendingChange) {
            pendingChange = true;
            setTimeout(function() {
              pendingChange = false;
              events.trigger('changed');
            }, 200);
          }
        }, 10);
        return true;
      });
    }
    
    // Instance methods
    // -----------

    function deactivate () {
      if($activeElement){
        $activeElement
          .attr('contenteditable', "false")
          .un('paste')
          .un('keydown');
        x$('.proper-commands').remove();
        events.unbind('changed');
      }
    };
    
    // Activate editor for a given element
    function activate (el, opts) {
      var newElem = x$(el);

      // Check if this is not the same element
      if( $activeElement && $activeElement.get(0) === newElem.get(0) ) return;

      options = help.extend({}, defaultOptions, opts);

      // Deactivate previously active element
      deactivate();

      // Make editable
      $activeElement = newElem;
      newElem.attr('contenteditable', true);
      bindEvents(newElem);


      // Setup controls
      if (options.markup && options.controlsTarget) {
        $controls = x$(controlsTpl);
        x$(options.controlsTarget).bottom($controls);
      }

      // Keyboard bindings
      if (options.markup) {
        function execLater(cmd) {
          return function(e) {
            e.preventDefault();
            exec(cmd);
          };
        }

        $activeElement
          .keydown('ctrl+shift+e', execLater('em'))
          .keydown('ctrl+shift+s', execLater('strong'))
          .keydown('ctrl+shift+c', execLater('code'))
          .keydown('ctrl+shift+l', execLater('link'))
          .keydown('ctrl+shift+b', execLater('ul'))
          .keydown('ctrl+shift+n', execLater('ol'))
          .keydown('tab',          execLater('indent'))
          .keydown('shift+tab',    execLater('outdent'));

      }

      if (!options.startEmpty)
        $activeElement.focus();
      else
        maybeInsertPlaceholder();
      
      updateCommandState();
      desemantifyContents($activeElement);
      
      // Use <b>, <i> and <font face="monospace"> instead of style attributes.
      // This is convenient because these inline element can easily be replaced
      // by their more semantic counterparts (<strong>, <em> and <code>).
      try {
        document.execCommand('styleWithCSS', false, false);
      } catch (exc) {
        // This fails in Firefox.
      }

      
      x$('.proper-commands a.command').click(function(e) {
        e.preventDefault();
        $activeElement.focus();
        exec(x$(e.currentTarget).attr('command'));
      });
      // make a hint that the content is changed when we switch between editable fields
      setTimeout(function() { events.trigger('changed'); }, 10);
    };
    
    // Get current content
    function content () {
      if (!$activeElement || $activeElement.hasClass('empty')) return '';
      
      if (options.markup) {
        var clone = x$($activeElement.html());
        semantifyContents(clone);
        return clone.html();
      } else {
        return help.trim( help.stripTags( !options.multiline ?
            $activeElement.html() :
            $activeElement.html().replace(/<div>/g, '\n').replace(/<\/div>/g, '')
        ));
      }
    };
    
    // Get current content but stripped
    function contentStripped () {
      return help.stripTags(this.content());
    };
    
    // Expose public API
    // -----------------
    
    return {
      bind:    function () { events.bind.apply(events, arguments); },
      unbind:  function () { events.unbind.apply(events, arguments); },
      trigger: function () { events.trigger.apply(events, arguments); },
      
      activate: activate,
      deactivate: deactivate,
      content: content,
      contentStripped: contentStripped,
      exec: exec,
      commands: commands,
      direction: function() { return direction; }
    };
  };
})();
