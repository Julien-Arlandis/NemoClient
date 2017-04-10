/**
 * @author : Julien Arlandis <julien.arlandis@laposte.net>
 * @Licence : Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

var JNTP = {

version: '0.22.2',
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
	hashkey: '',
	Session: '',
	UserID: '',
	FromName: '',
	FromMail: '',
	ReplyTo: ''
},

setUrl: function(url) {
	JNTP.url = url;
	JNTP.uri = JNTP.url + '/jntp/?';
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
		if(copyArticle.DataID.substring(0,27) == JNTP.Packet.value.Jid) {
			copyArticle.DataID = copyArticle.DataID.substring(27);
		}
		return ( JNTP.hashString( JNTP.uniqueJSON( copyArticle ) ) == JNTP.Packet.value.Jid );
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
	if(cmd[0] == 'quit') {
		callbackSystem = JNTP.closeSession;
	}else if(cmd[0] == 'auth' || cmd[0] == 'whoami') {
		callbackSystem = JNTP.initSession;
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
		dataType: 'json',
		data: JSON.stringify(cmd),
		headers: { 'JNTP-Session': JNTP.Storage.Session },
		success: function(j, textStatus, xhr) {
			if(JNTP.log && JNTP.logServeur) {
				JNTP.logFunction(j, 'output');
			}
			if(typeof j.info != "undefined") {
				JNTP.logFunction(j.info, 'output');
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
		JNTP.Storage.hashkey = j.body.hashkey;
		JNTP.Storage.Session = j.body.Session;
		JNTP.Storage.UserID = j.body.UserID;
        	JNTP.Storage.FromName = j.body.FromName;
		JNTP.Storage.FromMail = j.body.FromMail;
		JNTP.Storage.ReplyTo = j.body.ReplyTo;
		JNTP.authentified = true;
	break;

	case "400":
		JNTP.Storage.Session = false;
		JNTP.authentified = false;
	break;
}},


closeSession: function(cmd, code, j){switch(code) {
	case "200":
		JNTP.Storage.hashkey = '';
		JNTP.Storage.Session = false;
		JNTP.authentified = false;
	break;
}},

getHashClient: function(art, secretKey, returnData){
	var data = {
			"DataType" : art.DataType,
			"FromName" : art.FromName,
			"FromMail" : art.FromMail,
			"Subject" : art.Subject,
			"References" : art.References,
			"Newsgroups" : art.Newsgroups,
			"Body" : art.Body,
			"Media": art.Media,
			"FollowupTo": art.FollowupTo,
			"HashClient" : secretKey
	};

	var hashClientSecret = data.HashClient = JNTP.hashString( JNTP.uniqueJSON(data) );
	var hashClientCompute = JNTP.hashString( JNTP.uniqueJSON(data) );
	return {"hashClientSecret":hashClientSecret, "hashClientCompute":hashClientCompute, "data": (returnData) ? data : {} };
},

forgeDataArticle: function(art, secretKey) {
	var sizeArticle = JSON.stringify(art).length;
	if(sizeArticle > JNTP.maxArticleSize ) {
		return {"error":"tooLong","size":sizeArticle};
	}
	
	var hash = JNTP.getHashClient(art, secretKey, true);
	var data = hash.data;
	data.HashClient = hash.hashClientSecret;
	data.HashClient = hash.hashClientCompute;

	var allowedKeys = ['ThreadID','ReferenceUserID','Control','Uri','ReplyTo','DataIDLike','Supersedes','UserAgent'];
	$.each(allowedKeys, function(key, value){
		if(typeof art[value] != "undefined") { data[value] = art[value]; }
	});

	if(art.Control != undefined && art.Control[0] == "cancel") { data.Media = []; }

	return {"Data":data,"error":false};
},

uniqueJSON: function(json, isrecursiv) {
	if (typeof json == 'object' && !(json instanceof Array)) {
		if (json == null) return null;
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
		if (json == null) return null;
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

