/**
 * @author : Julien Arlandis <julien.arlandis@laposte.net>
 * @Licence : Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

var JNTP = {

version: '1.0',
log: false,
logServeur: true,
logClient: true,
url: '',
uri: '',
maxArticleSize: 2000000,
authentified: false,
xhrPool: [],
xhr: {},

Storage: {
	HashKey: '',
	Session: false,
	UserID: '',
	FromName: '',
	FromMail: '',
	ReplyTo: '',
},

setUrl: function(url) {
	JNTP.url = url;
	JNTP.uri = JNTP.url + '/jntp/';
},

Packet: {
	value: {},
	val: function(pack) {
		if(arguments.length) {
			this.value = pack;
		}else{
			return this.value;
		}
	},
	isValid: function(pack) {
		if(pack) {
			JNTP.Packet.val(pack);
		}
		var copyArticle = jQuery.extend(true, {},JNTP.Packet.value.Data);
		if(copyArticle.DataID == JNTP.Packet.value.Jid) {
			copyArticle.DataID = "";
		}
		return ( JNTP.hashString( JNTP.uniqueJSON( copyArticle ) ) == JNTP.Packet.value.Jid.split('@')[0] && copyArticle.OriginServer == JNTP.Packet.value.Jid.split('@')[1] );
	}
},

execute: function(cmd, callback, xhrInPool) {

	if (typeof(cmd) != 'object') {
		try {
			cmd = JSON.parse(cmd);
		} catch (exception) {
			JNTP.logFunction(cmd, 'input');
			return JNTP.logFunction('Bad Syntax', 'output');
		}
	}

	var callbackSystem = false;
	var typeOfData = 'json';
	if(cmd[0] == 'quit') {
		callbackSystem = JNTP.closeSession;
	}else if(cmd[0] == 'auth' || cmd[0] == 'whoami') {
		callbackSystem = JNTP.initSession;
	}else if(cmd[0] == 'help') {
		typeOfData = 'text';
	}else if(cmd[0] == 'set' && cmd.length > 1) {
		if(cmd[1].FromName) JNTP.Storage.FromName = cmd[1].FromName;
		if(cmd[1].FromMail) JNTP.Storage.FromMail = cmd[1].FromMail;
		if(cmd[1].ReplyTo) JNTP.Storage.ReplyTo = cmd[1].ReplyTo;
	}

	if(JNTP.log && JNTP.logClient) {
		JNTP.logFunction(cmd, 'input');
	}

	if(callbackSystem) callbackSystem(cmd);

	JNTP.xhr = $.ajax({
		type: 'POST',
		url: JNTP.uri,
		dataType: typeOfData,
		data: JSON.stringify(cmd),
		headers: { 'JNTP-Session': JNTP.Storage.Session },
		success: function(j, textStatus, xhr) {
			if(JNTP.log && JNTP.logServeur) {
				JNTP.logFunction(j, 'output');
			}
			code = (typeof(j) == 'object') ? j.code : "200";
			code = (typeof(j) == undefined) ? "500" : code;
			if(callbackSystem) callbackSystem(cmd, code, j);
			if(callback) callback(code, j);
		}
 	});

	if(xhrInPool) {
		JNTP.xhrPool.push(JNTP.xhr);
	}
	return;
},

xhrAbortAll : function() {
	$(JNTP.xhrPool).each(function(idx, jqXHR) {
		jqXHR.abort();
	});
	JNTP.xhrPool = [];
},

initSession: function(cmd, code, j){switch(code) {
	case "200":
		JNTP.Storage.HashKey = j.body.HashKey;
		JNTP.Storage.Session = j.body.Session;
		JNTP.Storage.UserID = j.body.UserID;
        	JNTP.Storage.FromName = j.body.FromName;
		JNTP.Storage.FromMail = j.body.FromMail;
		JNTP.Storage.ReplyTo = j.body.ReplyTo;
		JNTP.authentified = true;
	break;

	case "500":
		JNTP.Storage.Session = false;
		JNTP.authentified = false;
	break;
}},


closeSession: function(cmd, code, j){switch(code) {
	case "200":
		JNTP.Storage.HashKey = '';
		JNTP.Storage.Session = false;
		JNTP.authentified = false;
	break;
}},

getHashClient: function(art, secretKey){

	var followupTo = (typeof art.FollowupTo == "undefined") ? [] : art.FollowupTo;

	var data = {
			"DataType" : art.DataType,
			"FromName" : art.FromName,
			"FromMail" : art.FromMail,
			"Subject" : art.Subject,
			"References" : art.References,
			"Newsgroups" : art.Newsgroups,
			"Body" : art.Body,
			"Media": art.Media,
			"FollowupTo": followupTo,
			"HashClient" : secretKey+JNTP.Storage.HashKey
	};

	var hashClientSecret = data.HashClient = JNTP.hashString( JNTP.uniqueJSON(data) );
	var hashClientCompute = JNTP.hashString( JNTP.uniqueJSON(data) );

	return {"hashClientSecret":hashClientSecret,"hashClientCompute":hashClientCompute};
},

forgeDataArticle: function(params, secretKey) {

	var data = {
		"DataType" : params.DataType,
		"FromName" : params.FromName,
		"FromMail" : params.FromMail,
		"Subject" : params.Subject,
		"References" : params.References,
		"Newsgroups" : params.Newsgroups,
		"Body" : params.Body,
		"Media": params.Media,
		"FollowupTo": params.FollowupTo,
		"HashClient" : secretKey+JNTP.Storage.HashKey,
	};

	var sizeArticle = JSON.stringify(data).length;
	if(sizeArticle > JNTP.maxArticleSize ) {
		return {"error":"tooLong","size":sizeArticle};
	}

	data.HashClient = JNTP.hashString(JNTP.uniqueJSON(data));
	data.HashClient = JNTP.hashString(JNTP.uniqueJSON(data));
	data.ThreadID = params.ThreadID;
	if(params.ReferenceUserID) { data.ReferenceUserID = params.ReferenceUserID; }
	if(params.Control) { data.Control = params.Control; }
	if(params.Uri) { data.Uri = params.Uri; }
	if(params.ReplyTo) { data.ReplyTo = params.ReplyTo; }
	if(params.DataIDLike) { data.DataIDLike = params.DataIDLike; }
	if(params.Supersedes) { data.Supersedes = params.Supersedes; }
	if(params.UserAgent) { data.UserAgent = params.UserAgent; }

	if(params.Control != undefined && params.Control[0] == "cancel") { data.Media = []; }

	return {"Data":data,"error":false};

},

uniqueJSON: function(json, isrecursiv) {
	if (typeof json == 'object' && !(json instanceof Array)) {
		var tmp_array = [];
		for (var key in json) {
			tmp_array.push(key);
		}

		var new_value = {};
		for (var i in tmp_array) {

			var re = /([\u0080-\u07FF\uD800-\uDFFF])|([\u0800-\uFFFF])/g;

			if (typeof json[tmp_array[i]] == 'string' && json[tmp_array[i]].replace(re, "$1$1$2$2$2").length > 27) {
				new_value['#'+tmp_array[i]] = JNTP.hashString(json[tmp_array[i]]);
			}else{
				new_value[tmp_array[i]] = JNTP.uniqueJSON(json[tmp_array[i]], true);
			}
		}
		return (!isrecursiv) ? JSON.stringify(JNTP.sortJSON(new_value)) : new_value;
	}

	if (json instanceof Array) {
		var new_value = [];
		for(var i in json) {
			new_value.push(JNTP.uniqueJSON(json[i], true));
		}
		return new_value;
	}
	return json;
},

sortJSON: function(json, isrecursiv) {
	if (typeof json == 'object' && !(json instanceof Array)) {
		var tmp_array = [];
		for (var key in json) {
			tmp_array.push(key);
		}
		tmp_array.sort();

		var new_value = {};
		for (var i in tmp_array) {
			new_value[tmp_array[i]] = JNTP.sortJSON(json[tmp_array[i]], true);
		}
		return new_value;
	}

	if (json instanceof Array) {
		var new_value = [];
		for(var i in json) {
			new_value.push(JNTP.sortJSON(json[i], true));
		}
		return new_value;
	}
	return json;
},

hashString: function(str) {
	return CryptoJS.SHA1(str).toString(CryptoJS.enc.Base64).slice(0,-1).replace(/\+/g,'-').replace(/\//g,'_');
}

}

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
n=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,
2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},
k=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,
f)).finalize(b)}}});var s=p.algo={};return p}(Math);
(function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^
k)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();

(function(){var h=CryptoJS,j=h.lib.WordArray;h.enc.Base64={stringify:function(b){var e=b.words,f=b.sigBytes,c=this._map;b.clamp();b=[];for(var a=0;a<f;a+=3)for(var d=(e[a>>>2]>>>24-8*(a%4)&255)<<16|(e[a+1>>>2]>>>24-8*((a+1)%4)&255)<<8|e[a+2>>>2]>>>24-8*((a+2)%4)&255,g=0;4>g&&a+0.75*g<f;g++)b.push(c.charAt(d>>>6*(3-g)&63));if(e=c.charAt(64))for(;b.length%4;)b.push(e);return b.join("")},parse:function(b){var e=b.length,f=this._map,c=f.charAt(64);c&&(c=b.indexOf(c),-1!=c&&(e=c));for(var c=[],a=0,d=0;d<
e;d++)if(d%4){var g=f.indexOf(b.charAt(d-1))<<2*(d%4),h=f.indexOf(b.charAt(d))>>>6-2*(d%4);c[a>>>2]|=(g|h)<<24-8*(a%4);a++}return j.create(c,a)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();
