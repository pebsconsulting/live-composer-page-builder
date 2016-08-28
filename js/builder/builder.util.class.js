/**
 * Custom utils
 */

'use strict';

LiveComposer.Utils = {
	addslashes: function(str)
	{
		 str = str.replace(/\\/g, '\\\\');
		 str = str.replace(/\'/g, '\\\'');
		 str = str.replace(/\"/g, '\\"');
		 str = str.replace(/\0/g, '\\0');
		 return str;
	},

	basename: function(path)
	{
		return path.split(/[\\/]/).pop();
	},

	/**
	 * Check if browser is IE
	 */
	msieversion: function() {

	    var ua = window.navigator.userAgent;
	    var msie = ua.indexOf("MSIE ");

	    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))  // If Internet Explorer, return version number
	    {
	        return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)));
	    }
	    else  // If another browser, return 0
	    {
	        return false;
	    }
	},

	/**
	 * Check if variables in array is desired types
	 * @param  {array} array
	 * @return {boolean}
	 */
	checkParams: function(array)
	{
		if(!Array.isArray(array))
		{
			throw ('Param is not array');
		}

		/// Instead of switch construction
		var types = {
			integer: function(param)
			{
				return isNaN(parseInt(param));
			},
			float: function(param)
			{
				return isNaN(parseFloat(param));
			},
			string: function(param)
			{
				return param != null && param != undefined && typeof param == 'string';
			},
			array: function(param)
			{
				return Array.isArray(param);
			},
			object: function(param)
			{
				return typeof param == 'object';
			}
		}

		/// Check it!
		array.map(function(item){
			if(!types[item[1]](item[0])){
				throw('Param ' + item[0] + ' is not ' + item[1]);
			}
		});
	},

	/**
	 * Converts UTF-8 to base64
	 *
	 * @param  {string} t utf-8
	 * @return {string}   b64
	 */
	utf8_to_b64: function(t) {

		return window.btoa(unescape(encodeURIComponent(t)));

	 },

	 /**
	  * Converts base64 to UTF-8
	  *
	  * @param  {string} str in b64
	  * @return {string}   in utf-8
	  */
	 b64_to_utf8: function(str) {

		return decodeURIComponent(escape(window.atob(str)));

	 },

	 /**
	  * Get Page Params
	  *
	  * @return {array}
	  */
	 get_page_params: function()
	 {
		return decodeURIComponent(window.location.search.slice(1)).split('&').reduce(function _reduce ( a, b) { b = b.split('='); a[b[0]] = b[1]; return a; }, {});
	 },

	get_unique_id: function() {
		return Math.random().toString(32).slice(2);
	},

	encode: function (code) {
		// Serialize
		code = this.serialize( code );

		// Encode
		code = this.utf8_to_b64( code );

		return code;
	},

	decode: function (code) {

		// Decode base64 to utf8
		code = this.b64_to_utf8( code );

		// Unserialize decoded code into the object
		code = this.unserialize( code );

		return code;
	},

	/**
	 * Update module option in raw base64 code (dslc_code) of the module
	 *
	 * @param  {DOM element} module    Module Element
	 * @param  {string} property_name  Name of the option we change
	 * @param  {string} property_value Value of the option we change
	 * @return {void}
	 */
	update_module_property_raw: function (module, property_name, property_value ) {

		// Hidden textarea element with raw base64 code of the module
		// <textarea class="dslca-module-code">YTo2On....iOjE7fQ==</textarea>
		var module_code_container = module.getElementsByClassName('dslca-module-code')[0];

		// Hidden textarea element with value of this particular setting
		// <textarea data-id="property_name">property_value</textarea>
		var property_container = module.querySelector( '.dslca-module-option-front[data-id="' + property_name + '"]' );

		// Get module raw code
		var module_code = module_code_container.value;

	 	// Decode
		module_code = this.decode( module_code );

		// Change module property
		module_code[property_name] = property_value;

		// Encode
		module_code = this.encode( module_code );

		// Update raw code
		module_code_container.value = module_code;
		module_code_container.innerHTML = module_code; // See comment block below

		// Change the property in hidden textarea as well
		property_container.value = property_value;
		property_container.innerHTML  = property_value; // See comment block below

		/**
		 * FireFox will not duplicate textarea value properly using .cloneNode(true)
		 * if we don't use .innerHTML statement (Chrome works fine with .value only).
		 *
		 * See bug report: https://bugzilla.mozilla.org/show_bug.cgi?id=237783
		 */
	},

	/**
	 * Provide custom events publish
	 *
	 * @param  {string} eventName
	 * @param  {object||string||null||numeric} eventData [description]
	 */
	publish: function( eventName, eventData ) {

		eventData = eventData ? eventData : {};

		this.checkParams( [
			[eventName, 'string'],
			[eventData, 'object']
		] );

		jQuery.event.trigger( {
			type: eventName,
			message: {details: eventData}
		} );
	},
	serialize: function(mixedValue) {

		var self = this;
		'use strict';

	  //  discuss at: http://locutus.io/php/serialize/
	  // original by: Arpad Ray (mailto:arpad@php.net)
	  // improved by: Dino
	  // improved by: Le Torbi (http://www.letorbi.de/)
	  // improved by: Kevin van Zonneveld (http://kvz.io/)
	  // bugfixed by: Andrej Pavlovic
	  // bugfixed by: Garagoth
	  // bugfixed by: Russell Walker (http://www.nbill.co.uk/)
	  // bugfixed by: Jamie Beck (http://www.terabit.ca/)
	  // bugfixed by: Kevin van Zonneveld (http://kvz.io/)
	  // bugfixed by: Ben (http://benblume.co.uk/)
	  // bugfixed by: Codestar (http://codestarlive.com/)
	  //    input by: DtTvB (http://dt.in.th/2008-09-16.string-length-in-bytes.html)
	  //    input by: Martin (http://www.erlenwiese.de/)
	  //      note 1: We feel the main purpose of this function should be to ease
	  //      note 1: the transport of data between php & js
	  //      note 1: Aiming for PHP-compatibility, we have to translate objects to arrays
	  //   example 1: serialize(['Kevin', 'van', 'Zonneveld'])
	  //   returns 1: 'a:3:{i:0;s:5:"Kevin";i:1;s:3:"van";i:2;s:9:"Zonneveld";}'
	  //   example 2: serialize({firstName: 'Kevin', midName: 'van'})
	  //   returns 2: 'a:2:{s:9:"firstName";s:5:"Kevin";s:7:"midName";s:3:"van";}'

	  var val, key, okey
	  var ktype = ''
	  var vals = ''
	  var count = 0

	  var _utf8Size = function (str) {
	    var size = 0
	    var i = 0
	    var l = str.length
	    var code = ''
	    for (i = 0; i < l; i++) {
	      code = str.charCodeAt(i)
	      if (code < 0x0080) {
	        size += 1
	      } else if (code < 0x0800) {
	        size += 2
	      } else {
	        size += 3
	      }
	    }
	    return size
	  }

	  var _getType = function (inp) {
	    var match
	    var key
	    var cons
	    var types
	    var type = typeof inp

	    if (type === 'object' && !inp) {
	      return 'null'
	    }

	    if (type === 'object') {
	      if (!inp.constructor) {
	        return 'object'
	      }
	      cons = inp.constructor.toString()
	      match = cons.match(/(\w+)\(/)
	      if (match) {
	        cons = match[1].toLowerCase()
	      }
	      types = ['boolean', 'number', 'string', 'array']
	      for (key in types) {
	        if (cons === types[key]) {
	          type = types[key]
	          break
	        }
	      }
	    }
	    return type
	  }

	  var type = _getType(mixedValue)

	  switch (type) {
	    case 'function':
	      val = ''
	      break
	    case 'boolean':
	      val = 'b:' + (mixedValue ? '1' : '0')
	      break
	    case 'number':
	      val = (Math.round(mixedValue) === mixedValue ? 'i' : 'd') + ':' + mixedValue
	      break
	    case 'string':
	      val = 's:' + _utf8Size(mixedValue) + ':"' + mixedValue + '"'
	      break
	    case 'array':
	    case 'object':
	      val = 'a'
	      /*
	      if (type === 'object') {
	        var objname = mixedValue.constructor.toString().match(/(\w+)\(\)/);
	        if (objname === undefined) {
	          return;
	        }
	        objname[1] = serialize(objname[1]);
	        val = 'O' + objname[1].substring(1, objname[1].length - 1);
	      }
	      */

	      for (key in mixedValue) {
	        if (mixedValue.hasOwnProperty(key)) {
	          ktype = _getType(mixedValue[key])
	          if (ktype === 'function') {
	            continue
	          }

	          okey = (key.match(/^[0-9]+$/) ? parseInt(key, 10) : key)
	          vals += self.serialize(okey) + self.serialize(mixedValue[key])
	          count++
	        }
	      }
	      val += ':' + count + ':{' + vals + '}'
	      break
	    case 'undefined':
	    default:
	      // Fall-through
	      // if the JS object has a property which contains a null value,
	      // the string cannot be unserialized by PHP
	      val = 'N'
	      break
	  }
	  if (type !== 'object' && type !== 'array') {
	    val += ';'
	  }

	  return val
	},
	unserialize: function(data) {

		var self = this;
		'use strict';

	   //  discuss at: http://locutus.io/php/unserialize/
	   // original by: Arpad Ray (mailto:arpad@php.net)
	   // improved by: Pedro Tainha (http://www.pedrotainha.com)
	   // improved by: Kevin van Zonneveld (http://kvz.io)
	   // improved by: Kevin van Zonneveld (http://kvz.io)
	   // improved by: Chris
	   // improved by: James
	   // improved by: Le Torbi
	   // improved by: Eli Skeggs
	   // bugfixed by: dptr1988
	   // bugfixed by: Kevin van Zonneveld (http://kvz.io)
	   // bugfixed by: Brett Zamir (http://brett-zamir.me)
	   //  revised by: d3x
	   //    input by: Brett Zamir (http://brett-zamir.me)
	   //    input by: Martin (http://www.erlenwiese.de/)
	   //    input by: kilops
	   //    input by: Jaroslaw Czarniak
	   //      note 1: We feel the main purpose of this function should be
	   //      note 1: to ease the transport of data between php & js
	   //      note 1: Aiming for PHP-compatibility, we have to translate objects to arrays
	   //   example 1: unserialize('a:3:{i:0;s:5:"Kevin";i:1;s:3:"van";i:2;s:9:"Zonneveld";}')
	   //   returns 1: ['Kevin', 'van', 'Zonneveld']
	   //   example 2: unserialize('a:2:{s:9:"firstName";s:5:"Kevin";s:7:"midName";s:3:"van";}')
	   //   returns 2: {firstName: 'Kevin', midName: 'van'}

	   var $global = (typeof window !== 'undefined' ? window : GLOBAL)

	   var utf8Overhead = function (chr) {
	     // http://locutus.io/php/unserialize:571#comment_95906
	     var code = chr.charCodeAt(0)
	     var zeroCodes = [
	       338,
	       339,
	       352,
	       353,
	       376,
	       402,
	       8211,
	       8212,
	       8216,
	       8217,
	       8218,
	       8220,
	       8221,
	       8222,
	       8224,
	       8225,
	       8226,
	       8230,
	       8240,
	       8364,
	       8482
	     ]
	     if (code < 0x0080 || code >= 0x00A0 && code <= 0x00FF || zeroCodes.indexOf(code) !== -1) {
	       return 0
	     }
	     if (code < 0x0800) {
	       return 1
	     }
	     return 2
	   }
	   var error = function (type,
	     msg, filename, line) {

	   	try {

	     	throw new $global[type](msg, filename, line)
	   	}catch(e) {

	   		dslca_generate_error_report ( e.error, e.file, e.line, e.char, 'LC unserialize bug data: ' + data );
	   	}
	   }
	   var readUntil = function (data, offset, stopchr) {
	     var i = 2
	     var buf = []
	     var chr = data.slice(offset, offset + 1)

	     while (chr !== stopchr) {
	       if ((i + offset) > data.length) {
	         error('Error', 'Invalid')
	       }
	       buf.push(chr)
	       chr = data.slice(offset + (i - 1), offset + i)
	       i += 1
	     }
	     return [buf.length, buf.join('')]
	   }
	   var readChrs = function (data, offset, length) {
	     var i, chr, buf

	     buf = []
	     for (i = 0; i < length; i++) {
	       chr = data.slice(offset + (i - 1), offset + i)
	       buf.push(chr)
	       length -= utf8Overhead(chr)
	     }
	     return [buf.length, buf.join('')]
	   }
	   var _unserialize = function (data, offset) {
	     var dtype
	     var dataoffset
	     var keyandchrs
	     var keys
	     var contig
	     var length
	     var array
	     var readdata
	     var readData
	     var ccount
	     var stringlength
	     var i
	     var key
	     var kprops
	     var kchrs
	     var vprops
	     var vchrs
	     var value
	     var chrs = 0
	     var typeconvert = function (x) {
	       return x
	     }

	     if (!offset) {
	       offset = 0
	     }
	     dtype = (data.slice(offset, offset + 1)).toLowerCase()

	     dataoffset = offset + 2

	     switch (dtype) {
	       case 'i':
	         typeconvert = function (x) {
	           return parseInt(x, 10)
	         }
	         readData = readUntil(data, dataoffset, ';')
	         chrs = readData[0]
	         readdata = readData[1]
	         dataoffset += chrs + 1
	         break
	       case 'b':
	         typeconvert = function (x) {
	           return parseInt(x, 10) !== 0
	         }
	         readData = readUntil(data, dataoffset, ';')
	         chrs = readData[0]
	         readdata = readData[1]
	         dataoffset += chrs + 1
	         break
	       case 'd':
	         typeconvert = function (x) {
	           return parseFloat(x)
	         }
	         readData = readUntil(data, dataoffset, ';')
	         chrs = readData[0]
	         readdata = readData[1]
	         dataoffset += chrs + 1
	         break
	       case 'n':
	         readdata = null
	         break
	       case 's':
	         ccount = readUntil(data, dataoffset, ':')
	         chrs = ccount[0]
	         stringlength = ccount[1]
	         dataoffset += chrs + 2

	         readData = readChrs(data, dataoffset + 1, parseInt(stringlength, 10))
	         chrs = readData[0]
	         readdata = readData[1]
	         dataoffset += chrs + 2
	         if (chrs !== parseInt(stringlength, 10) && chrs !== readdata.length) {
	           error('SyntaxError', 'String length mismatch')
	         }
	         break
	       case 'a':
	         readdata = {}

	         keyandchrs = readUntil(data, dataoffset, ':')
	         chrs = keyandchrs[0]
	         keys = keyandchrs[1]
	         dataoffset += chrs + 2

	         length = parseInt(keys, 10)
	         contig = true

	         for (i = 0; i < length; i++) {
	           kprops = _unserialize(data, dataoffset)
	           kchrs = kprops[1]
	           key = kprops[2]
	           dataoffset += kchrs

	           vprops = _unserialize(data, dataoffset)
	           vchrs = vprops[1]
	           value = vprops[2]
	           dataoffset += vchrs

	           if (key !== i) {
	             contig = false
	           }

	           readdata[key] = value
	         }

	         if (contig) {
	           array = new Array(length)
	           for (i = 0; i < length; i++) {
	             array[i] = readdata[i]
	           }
	           readdata = array
	         }

	         dataoffset += 1
	         break
	       default:
	         error('SyntaxError', 'Unknown / Unhandled data type(s): ' + dtype)
	         break
	     }
	     return [dtype, dataoffset - offset, typeconvert(readdata)]
	   }

	   return _unserialize((data + ''), 0)[2]
	}
};
