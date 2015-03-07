/**
 * @author : Julien Arlandis <julien.arlandis@laposte.net>
 * @Licence : Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

var JNTP = {

UserAgent: 'Nemo/0.996d',
url: '',
log: '',
outputLog: '',
bodyInputID: '',
favoris: {'nemo.*':'h','nemo.bavardages':'w','fr.*':'h'},
uri: '',
blacklist: [],
Newsgroups: '*',
Article: {},
ArticleUpdate: {},
media: [],
isView: [],
Fil: [],
indexJid: [],
totalArticle: 250,
confirmSendArticle: 0,
viewReferences: false,
newReferences: [],
newUserID: false,
newThreadID: '',
filter: {},
FromName: '',
FromMail: '',
ReplyTo: '',
signature: '',
tri: {"field":"InjectionDate","order":"desc","tree":false},
SecretKey: '',
HashKey: '',
maxFileSize: 1800000,
maxArticleSize: 2000000,
modeEdit: 'text',
logClient: true,
logServeur: true,
activePopup: 1,
inPopup: false,
viewlu: 'all',
authentified: false,
Session: false,
userID: '',
xhrPool: [],
xhr: false,
refreshFunction: '',

init: function(config) {
	JNTP.log = config.log;
	JNTP.outputLog = config.outputLog;
	JNTP.bodyInputID = config.bodyInputID;
	JNTP.signature = config.signature;
	JNTP.uri = JNTP.url + '/jntp/';
	JNTP.refreshFunction = config.refreshFunction;
	if(typeof localStorage.SecretKey == "undefined") {
		JNTP.storeVar('SecretKey', JNTP.generateSecretKey());
	}
	if(typeof localStorage.blacklist == "undefined" || !localStorage.blacklist) {
		localStorage.blacklist = '';
	}
	JNTP.blacklist = localStorage.blacklist.split("\n");
	JNTP.getView();
	JNTP.getVar(["SecretKey","totalArticle","confirmSendArticle","signature","favoris","activePopup"]);
},

execute: function(cmd, callback, xhrInPool) {

	if (typeof(cmd) != 'object') {
		try {
			cmd = JSON.parse(cmd);
		} catch (exception) {
			JNTP.logData(cmd, 'input');
			return JNTP.logData('Bad Syntax', 'output');
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
	}

	if(JNTP.log && JNTP.logClient) {
		JNTP.logData(cmd, 'input');
	}

	if(callbackSystem) callbackSystem(cmd);

	JNTP.xhr = $.ajax({
		type: 'POST',
		url: JNTP.uri,
		dataType: typeOfData,
		data: JSON.stringify(cmd),
		headers: { 'JNTP-Session': JNTP.Session },
		success: function(j, textStatus, xhr) {
			if(JNTP.log && JNTP.logServeur) {
				JNTP.logData(j, 'output');
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

// Param = {IDstart, IDstop, notclean, listen, listenNext}
getFil: function(params){
	JNTP.filter["Data.DataType"] = "Article";

	if(typeof JNTP.filter["Data.Newsgroups"] != "undefined") {
		JNTP.Newsgroups = JNTP.filter["Data.Newsgroups"]
	}

	if(typeof params.listen == "undefined") {
		params.listen = 0;
	}

	if(params.IDstart) {
		JNTP.filter["ID"] = [params.IDstart, 'min'];
	}
	else if(params.IDstop) {
		JNTP.filter["ID"] = [params.IDstop, 'max'];
	}else{
		delete JNTP.filter["ID"];
	}

	cmd = ["get", {
		"select":["Data.DataID","Data.Subject","Data.FromName","Data.FromMail","Data.InjectionDate","Data.ThreadID","Data.Control","@2References","Meta.Size"],
		"limit": JNTP.totalArticle,
		"filter": JNTP.filter,
		"listen": params.listen
		}
	];

	JNTP.execute(cmd, function(code, j){switch(code) {
	case "200":
		var maxID = 0;
		var res = {"firstID":0, "total":0};
		if(typeof params.notclean == "undefined") {
			JNTP.cleanFil();
		}
		if(j.body.length) {

			for(ind in j.body) {
				ID = parseInt(j.body[ind].ID);
				maxID = (ID > maxID) ? ID : maxID;
				if(!j.body[ind].Data.Control){
					j.body[ind].Data.InjectionDate = (typeof j.body[ind].Data.InjectionDate) ? j.body[ind].Data.InjectionDate.replace("T", " ").replace("Z",""): '';
					j.body[ind].Read = (typeof JNTP.getView(j.body[ind].Jid) == "undefined" || !JNTP.getView(j.body[ind].Jid)) ? 0 : 1;
					JNTP.addToFil(j.body[ind], j.body[ind].Jid);
				}else{
					if(j.body[ind].Data.Control[0] == 'cancel') {
						JNTP.deleteToFil(j.body[ind].Data.Control[1]);
					}
				}
			}

			i=JNTP.Fil.length;
			do
			   i--;
			while (typeof JNTP.Fil[i] == "undefined" && i>0);
			if(typeof JNTP.Fil[i] != "undefined") {
				res.firstID = JNTP.Fil[i].ID;
			}
		}
		if(maxID == 0) {
			maxID = params.IDstart;
		}
		if(params.listen || params.listenNext) {
			JNTP.xhrAbortAll();
			JNTP.getFil({"listen":1,"notclean":true,"IDstart":maxID});
		}

		res.total = JNTP.Fil.length;

		if(params.callback) {
			params.callback(res);
		}
		JNTP.refreshFunction(res.total);
	break;
	}}, true);
},

initSession: function(cmd, code, j){switch(code) {
	case "200":
		JNTP.HashKey = j.body.HashKey;
		JNTP.Session = j.body.Session;
		JNTP.UserID = j.body.UserID;
        	JNTP.FromName = j.body.FromName;
		JNTP.FromMail = j.body.FromMail;
		JNTP.ReplyTo = j.body.ReplyTo;
		JNTP.authentified = true;
	break;

	case "500":
		JNTP.Session = false;
		JNTP.authentified = false;
	break;
}},


closeSession: function(cmd, code, j){switch(code) {
	case "200":
		JNTP.Session = false;
		JNTP.authentified = false;
	break;
}},

getHashClient: function(art){

	var followupTo = (typeof art.FollowupTo == "undefined") ? [] : art.FollowupTo;

	var data = {
			"DataType" : art.DataType,
			"FromName" : art.FromName,
			"FromMail" : art.FromMail,
			"Subject" : art.Subject,
			"References" : art.References,
			"Newsgroups" : art.Newsgroups,
			"UserAgent" : art.UserAgent,
			"Body" : art.Body,
			"Media": art.Media,
			"FollowupTo": followupTo,
			"HashClient" : JNTP.SecretKey+JNTP.HashKey
	};

	var hashClientSecret = data.HashClient = hashString( JNTP.uniqueJSON(data) );

	var hashClientCompute = hashString( JNTP.uniqueJSON(data) );
	return {"hashClientSecret":hashClientSecret,"hashClientCompute":hashClientCompute};
},

isValidJNTP: function(article){

	var copyArticle = jQuery.extend(true, {},JNTP.Article.Data);
	if(article.Data.DataID == JNTP.Article.Jid) {
		copyArticle.DataID = "";
	}

	return ( hashString( JNTP.uniqueJSON(    copyArticle    ) ) == JNTP.Article.Jid.split('@')[0] && JNTP.Article.Data.OriginServer == JNTP.Article.Jid.split('@')[1] );
},

forgeData: function(params) {
	var data = {
		"DataType" : params.DataType,
		"FromName" : JNTP.FromName,
		"FromMail" : JNTP.FromMail,
		"Subject" : params.Subject,
		"References" : JNTP.newReferences,
		"Newsgroups" : params.Newsgroups,
		"UserAgent" : JNTP.UserAgent,
		"Body" : params.Body,
		"Media": JNTP.media,
		"FollowupTo": params.FollowupTo,
		"HashClient" : JNTP.SecretKey+JNTP.HashKey,
	};

	var sizeArticle = JSON.stringify(data).length;
	if(sizeArticle > JNTP.maxArticleSize ) {
		return {"error":"tooLong","size":sizeArticle};
	}

	copyArticle = jQuery.extend(true, {}, data);
	copyArticle.Media = JNTP.media;
	copyArticle.HashClient = hashString(JNTP.uniqueJSON(copyArticle));

	data.HashClient = hashString(JNTP.uniqueJSON(copyArticle));
	data['ThreadID'] = JNTP.newThreadID;
	if(JNTP.newUserID) {
		data.ReferenceUserID = JNTP.newUserID;
	}
	if(params.Control) {
		data.Control = params.Control;
	}

	if(params.Uri) { data.Uri = params.Uri; }
	if(params.ReplyTo) { data.ReplyTo = params.ReplyTo; }
	if(params.JidLike) { data.JidLike = params.JidLike; }
	if(params.Supersedes) { data.Supersedes = params.Supersedes; }

	if(params.Control != undefined && params.Control[0] == "cancel") { data.Media = []; }
	return {"Data":data,"error":false};
},

logData: function(msg, classCss) {
	msg = (typeof(msg) == "object") ? JNTP.syntaxHighlight(JSON.stringify(msg, undefined, 4)) : msg;
	msg = msg.replace(/[\n]/gi, "<br>" );
	$('#'+JNTP.outputLog).append('<div class="'+classCss+'">'+msg+'</div>');
	var objDiv = document.getElementById('log');
	objDiv.scrollTop = objDiv.scrollHeight;
},

minIDFil:function() {
	var minID = 1e15;
	if(JNTP.Fil.length) {
		for(var ind in JNTP.Fil) {
			ID = parseInt(JNTP.Fil[ind].ID);
			minID = (ID < minID) ? ID : minID;
		}
	}
	return minID;
},

addToFil: function(art, jid) {
	if( !JNTP.indexJid[jid]) {
		JNTP.Fil.push(art);
		JNTP.indexJid[jid] = true;
	}
},

cleanFil: function() {
	JNTP.Fil = [];
	JNTP.indexJid= [];
},

deleteToFil: function(jid) {
	for(i in JNTP.Fil) {
		if( JNTP.Fil[i].Jid == jid) {
			delete JNTP.Fil[i];
			delete JNTP.indexJid[jid];
		}
	}
},

clearMedia: function() {
	JNTP.media = [];
},

setReferences: function(refs, threadID, userid){
	if(refs.length > 10) {
		JNTP.newReferences = refs.slice(refs.length-10,refs.length);	
	}else{
		JNTP.newReferences = refs;
	}

	if(typeof threadID == "undefined" || !threadID) {
		JNTP.newThreadID = "";
	}else{
		JNTP.newThreadID = threadID;
	}

	if(userid) {
		JNTP.newUserID = userid;
	}else{
		JNTP.newUserID = false;
	}
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
				new_value['#'+tmp_array[i]] = hashString(json[tmp_array[i]]);
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


getIdentifiantValue: function(identifiant) {
	try {
		var key = identifiant.split('/');
		var value = JNTP.Article;
		for(var i in key) {
			var newKey = key[i].split(':');
			if(newKey.length > 1) {
				value = value[newKey[0]];
				idTab = parseInt(newKey[1]);
				value = value[idTab-1];
			} else {
				value = value[key[i]];
			}
		}
		if(typeof value == 'object') {
			return JSON.stringify(value)
		}else{
			return value;
		}
		return value;
	} catch (e) {
		return '';
	}
},

getVar: function(variables) {
	for(i in variables) {
		if(typeof localStorage[variables[i]] != "undefined") {
			try {
				this[variables[i]] = JSON.parse( localStorage[variables[i]] );
			} catch (exception) {
				localStorage[variables[i]] = JSON.stringify( localStorage[variables[i]] );
				this[variables[i]] = JSON.parse( localStorage[variables[i]] );
			}
		}
	}
},

storeVar: function(variable, value) {
	if(typeof value != "undefined") {
		JNTP[variable] = value;
	}
	localStorage[variable] = JSON.stringify(JNTP[variable]);
},

getView: function(Jid) {

	if(arguments.length == 1) {
		return JNTP.isView[Jid];
	}

	if(typeof localStorage.articleRead == "undefined" || !localStorage.articleRead) {
		localStorage.articleRead = '';
	}
	tab = localStorage.articleRead.split('<>');
	for(i in tab) {
		JNTP.isView[tab[i]]=true;
	}
},

isBlackListed: function(name) {
	return ( $.inArray( name, JNTP.blacklist ) != -1) ? true : false;
},

setBlacklist: function(name) {
	if(name == '') return;
	delete JNTP.blacklist[JNTP.blacklist.indexOf(name)];
	JNTP.blacklist.push(name);
	localStorage.blacklist = JNTP.blacklist.join("\n");
	localStorage.blacklist = localStorage.blacklist.replace(/\n+/g,"\n").replace(/^\n+/g,"");
},

setView: function(Jid, value) {
	JNTP.isView[Jid] = value;
	if(typeof localStorage.articleRead == "undefined" || !localStorage.articleRead) {
		localStorage.articleRead = '';
	}
	localStorage.articleRead = localStorage.articleRead.replace(new RegExp(Jid+'<>', 'g'),'');
	if(value == true) {
		localStorage.articleRead = Jid + '<>' + localStorage.articleRead;
		if(localStorage.articleRead.split('<>').length > 3000) {
			localStorage.articleRead = localStorage.articleRead.substring(0, localStorage.articleRead.lastIndexOf('<>')+1);
		}
	}

	for(ind in JNTP.Fil) {
		if (JNTP.Fil[ind].Jid == Jid) {
			JNTP.Fil[ind].Read = value;
			break;
		}
	}
},

generateSecretKey: function() {
	tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	secretKey = '';
	for(i=0;i<16;i++) {
		secretKey += tab[Math.floor((Math.random()*62)+1)-1];
	}
	return secretKey;
},

draft: function(obj) {
	if(arguments.length == 0) {
		return JSON.parse( localStorage.draft );
	}else{
		localStorage.draft = JSON.stringify(obj);
	}
},

syntaxHighlight: function(json) {
	json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
	    var cls = 'number';
	    if (/^"/.test(match)) {
	        if (/:$/.test(match)) {
	            cls = 'key';
	        } else {
	            cls = 'string';
	        }
	    } else if (/true|false/.test(match)) {
	        cls = 'boolean';
	    } else if (/null/.test(match)) {
	        cls = 'null';
	    }
	    return '<span class="' + cls + '">' + match + '</span>';
	});
},


trierFil: function() {
	if(JNTP.tri.tree) {
		if( JNTP.tri.order == "asc" && JNTP.tri.field == "InjectionDate"){
			return JNTP.getTree( JNTP.Fil.sort(JNTP.comparAsc("InjectionDate")) );
		}else{
			return JNTP.getTree( JNTP.Fil.sort(JNTP.comparDesc("InjectionDate")) );
		}
	}

	if (JNTP.tri.order == 'asc') {
		return JNTP.Fil.sort(JNTP.comparAsc(JNTP.tri.field));
	} else {
		return JNTP.Fil.sort(JNTP.comparDesc(JNTP.tri.field));
	}
},

comparAsc: function(prop) {
	return function(a,b) {
		if( a.Data[prop].toString().toLowerCase() > b.Data[prop].toString().toLowerCase()) {
			return -1;
		}else if( a.Data[prop].toString().toLowerCase() < b.Data[prop].toString().toLowerCase() ) {
			return +1;
		}
		return 0;
	}
},

comparDesc: function(prop) {
	return function(a,b) {
		if( a.Data[prop].toString().toLowerCase() > b.Data[prop].toString().toLowerCase()) {
			return +1;
		}else if( a.Data[prop].toString().toLowerCase() < b.Data[prop].toString().toLowerCase() ) {
			return -1;
		}
		return 0;
	}
},

getTree: function(liste, idArticle) {
	childs = {"/":[]};
	var index = [];
	var tree = [];
	var ind = 1;
	var level = 1;
	var ref = 'References';

	// Indexation des Jid
	for(var i in liste) {
		index[liste[i]['Jid']] = true;
	}

	var numberOfElement = 0;

	// On parcourt la liste des articles
	for(var i in liste) {
		numberOfElement++;
		if(typeof liste[i] == "undefined") {
			continue;
		}

		var bool = false;
		// Si le champ Références n'existe pas ou s'il est mal formaté on le transforme en tableau vide
		if (typeof liste[i].Data[ref] == "undefined" || !(liste[i].Data[ref] instanceof Array) ) {
			liste[i].Data[ref] = [];
		}
		// On balaye les références de l'articles depuis la fin pour détecter si une référence a été indexée
		for(var j = liste[i].Data[ref].length - 1; j >= 0; j--) {
			if(index[liste[i].Data[ref][j]]) {
				bool = true;
				break;
			}
		}

		// Si pas de références indexées l'article est enfant de la racine / sinon l'article est enfant de sa référence.
		if(!bool) {
			childs["/"].push(liste[i]); 
		}else{
			if( typeof childs[liste[i].Data[ref][j]] == "undefined" ) {
				childs[liste[i].Data[ref][j]] = [];
			}
			childs[liste[i].Data[ref][j]].push(liste[i]);
		}
	}

	tree.push({"Jid":"/", "level":0});

	var article = childs["/"].shift();
	article.level = level;
	var jid = article['Jid'];
	tree.push(article);


	while(tree.length < numberOfElement + 1) {

		//Si jid est parent on dépile l'article du tableau childs
		var ind;
		if( typeof childs[jid] != "undefined" && childs[jid].length) {

			article = childs[jid].shift();
			jid = article['Jid'];
			level++;
			article.level = level;
			tree.push(article);
			ind = tree.length - 1;
		}else{
			ind--;
		}

		if(ind < 0) {

			for(var i in childs) {
				while(childs[i].length) {
					article = childs[i].shift();
					article.level = 1;
					article.circuit = true;
					tree.push(article);
				}
			}
			tree.shift();
			return tree;
		}

		jid = tree[ind]['Jid'];
		level = tree[ind].level;
	}

	tree.shift();

	// Renvoie seulement la branche contenant jid
	if(arguments.length == 2) {

		branch = [];
		pos = 0;
		for(i in tree){
			if(tree[i].ID == idArticle) break;
			pos++;
		}

		for(i=pos; i>=0; i--){
			branch.push(tree[i]);
			if(tree[i].level == 1) break;
		}

		for(i=pos+1; i<tree.length; i++){
			if(tree[i].level == 1) break;
			branch.push(tree[i]);
		}
		return branch;
	} else {
		return tree.reverse();
	}
},

setTemplateVar: function(body) {
	var reg = /\[spoil\]([\s\S]*?)\[\/spoil\]/ig;
	body = body.replace(reg, function(s, m){return '[spoil]'+JNTP.rot13(JNTP.rot13(m).replace(/#Jid#/g, JNTP.Article.Jid))+'[/spoil]';});

	var reg = /\[var=([#@a-zA-Z0-9\/:]+)\]/g;
	body = body.replace(reg, function(s, m){return JNTP.getIdentifiantValue(m);});

	return body.replace(/#Uri#/g, JNTP.Article.Data.Uri).replace(/#Jid#/g, JNTP.Article.Jid).replace(/#ThreadID#/g, JNTP.Article.Data['ThreadID']);
},

mediaInfo: function() {
	info = [];
	for(ind in JNTP.media) {
		obj = {};
		obj.index = (parseFloat(ind)+1).toString();
		if(typeof JNTP.media[ind]['data'] == "undefined") {
			console.log("data not available");
		}else{
			obj.format = JNTP.media[ind]['data'].split(',')[0].split(';')[0].split(':')[1];
			obj.size = JNTP.media[ind]['data'].length;
		}
		if( typeof JNTP.media[ind].filename != "undefined" ) {
			obj.filename = JNTP.media[ind].filename;
		}
		info.push(obj);
	}
	return info;
},

copyMedia: function( Jid, callback ) {
	JNTP.execute(["get",{"filter":{"Data.DataType":"Article", "Jid":Jid}, "maxDataLength":0, "select":["Data.Media"]}], function(code, j){switch(code) {
		case "200":
			JNTP.media = j.body[0].Data.Media;
			callback();
			break;
		case "500":
			break;
	}});
},

addMedia: function(elt, callback, filename) {
	size = $('#'+elt)[0].files[0].size;
	if (size < JNTP.maxFileSize) {
		var fileReader = new FileReader();
		fileReader.readAsDataURL( $('#'+elt)[0].files[0] );
		fileReader.onload = function(event) {

			content = event.target.result;

			if(typeof filename != "undefined") {
				JNTP.media.push({"filename":filename, "data":content});
			}else{
				JNTP.media.push({"data":content});
			}
			$('#'+elt).val('');
			callback();
		}
		return true;
	}else{
		$('#'+elt).val('');
		return false;
	}
},

deleteMedia: function(index) {
	if(arguments.length == 1) {
		delete JNTP.media[index-1];
		arraytmp = [];
		for (i in JNTP.media){
				if (typeof JNTP.media[i] != 'undefined') {
					arraytmp.push( JNTP.media[i] );
				}
		}
		JNTP.media = arraytmp;
	}else{
		JNTP.media = [];
	}
},

HTMLEncode: function(txt) {
	try{
		if(typeof(txt)!="string") {
			txt=txt.toString();
		}
		return txt.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;");
	} catch(err){ return "";}
},

storeFavoris: function(favoris) {
	if(typeof favoris != "undefined"){
		JNTP.storeVar('favoris', favoris);
	}else{
		JNTP.storeVar('favoris', JNTP.favoris);
	}
},

triFavoris:function() {

	var favoris = [];
	var favoris2 = {};
	for(i in JNTP.favoris) {
	    favoris.push(i);
	}
	favoris.sort();
	for(i in favoris){
	    favoris2[favoris[i]] = JNTP.favoris[favoris[i]];
	};

	JNTP.storeFavoris(favoris2);
},

addFavoris: function(groupName, rwm) {
	if(typeof JNTP.favoris[groupName] == 'undefined') {
		JNTP.favoris[groupName] = rwm;
	}
	JNTP.storeFavoris();
},

deleteFavoris: function(groupName) {
	delete JNTP.favoris[groupName];
	JNTP.storeFavoris();
},

rot13: function(s) {
	var rot = function( t, u, v ) {
		return String.fromCharCode( ( ( t - u + v ) % ( v * 2 ) ) + u );
	};

	var b = [], c, i = s.length,
	a = 'a'.charCodeAt(), z = a + 26,
	A = 'A'.charCodeAt(), Z = A + 26;
	while(i--) {
		c = s.charCodeAt( i );
		if( c>=a && c<z ) { b[i] = rot( c, a, 13 ); }
		else if( c>=A && c<Z ) { b[i] = rot( c, A, 13 ); }
		else { b[i] = s.charAt( i ); }
	}
	return b.join( '' );
}

};


hashString = function(str) {
	return CryptoJS.SHA1(str).toString(CryptoJS.enc.Base64).slice(0,-1).replace(/\+/g,'-').replace(/\//g,'_');
};

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
