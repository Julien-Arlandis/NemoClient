/**
 * @author : Julien Arlandis <julien.arlandis@laposte.net>
 * @Licence : Attribution-NonCommercial-ShareAlike 3.0 Unported
 */

var Nemo = {

UserAgent: 'Nemo/0.998a',
plugins:{balise:[], module:[]},

Storage: {
	SecretKey: '',
	totalArticle: 250,
	confirmSendArticle: 0,
	signature: 'Ce message a été posté avec Nemo : <#Uri#>',
	favoris: {'nemo.*':'h','nemo.bavardages':'w','fr.*':'h'},
	activePopup: 1,
	blacklist: [],
},

Tools: {
	getVar: function(variable) {

		if(typeof localStorage[variable] != "undefined") {
			try {
				Nemo.Storage[variable] = JSON.parse( localStorage[variable] );
			} catch (exception) {
				localStorage[variable] = JSON.stringify( localStorage[variable] );
				Nemo.Storage[variable] = JSON.parse( localStorage[variable] );
			}
		}
		return Nemo.Storage[variable];
	},

	storeVar: function(variable, value) {
		if(typeof value != "undefined") {
			Nemo[variable] = value;
		}
		localStorage[variable] = JSON.stringify(Nemo[variable]);
	},

	xpostMail: function(opt){
		if(opt.mail != '') {
			window.location = "mailto:"+opt.mail+"?subject="+opt.subject+"&body="+encodeURIComponent(article.Data.Body.replace(/#DataID#/g, opt.dataid).replace(/#Uri#/g, opt.uri));
		}
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
	},

	HTMLEncode: function(txt) {
		try{
			if(typeof(txt)!="string") {
				txt=txt.toString();
			}
			return txt.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;");
		} catch(err){ return "";}
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

	generateSecretKey: function() {
		var tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var secretKey = '';
		for(i=0;i<16;i++) {
			secretKey += tab[Math.floor((Math.random()*62)+1)-1];
		}
		return secretKey;
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

	date2String: function(dateUTC, format){

		var regexp = new RegExp("[\-\: TZ]+", "g");
		var tab = dateUTC.split(regexp);
		var date = new Date(tab[0], tab[1]-1, tab[2], tab[3], tab[4], tab[5]);
		var date = new Date(date.getTime() - (new Date().getTimezoneOffset()) * 60000 );

		var num_jour = ((x=date.getDate()) < 10) ? '0'+x : x;
		var heure = ((x=date.getHours()) < 10) ? '0'+x : x;
		var minute = ((x=date.getMinutes()) < 10) ? '0'+x : x;
		var mois = ((x=date.getMonth()+1) < 10) ? '0'+x : x;
		return {"day" : num_jour + '/' + mois + '/' + date.getFullYear(), "time" : heure + ':' + minute};
	},

	HTTPGet: function(name){
		var isVar = new RegExp('[\\?&]' + name).exec(window.location.href);
		var isValue = new RegExp('[\\?&]' + name + '=([^&]*)').exec(window.location.href);
		if (isVar){
			if(isValue){
				return isValue[1];
			}else{
				return true;
			}
		}else{
			return false;
		}
	}
},

Media: {
	value: {},
	maxFileSize: 1800000,

	val: function(media) {
		if(arguments.length) {
			this.value = media;
		}else{
			return this.value;
		}
	},

	info: function() {
		var info = [];
		for(ind in this.value) {
			var obj = {};
			obj.index = (parseFloat(ind)+1).toString();
			if(typeof this.value[ind]['data'] == "undefined") {
				console.log("data not available");
			}else{
				obj.format = this.value[ind]['data'].split(',')[0].split(';')[0].split(':')[1];
				obj.size = this.value[ind]['data'].length;
			}
			if( typeof this.value[ind].filename != "undefined" ) {
				obj.filename = this.value[ind].filename;
			}
			info.push(obj);
		}
		return info;
	},

	copy: function( dataID, callback ) {
		JNTP.execute(["get",{"filter":{"Data.DataType":"Article", "Data.DataID":dataID}, "maxDataLength":0, "select":["Data.Media"]}], function(code, j){switch(code) {
			case "200":
				this.value = j.body[0].Data.Media;
				callback();
				break;
			case "500":
				break;
		}}.bind(this));
	},

	add: function(elt, callback, filename) {
		size = $('#'+elt)[0].files[0].size;
		if (size < this.maxFileSize) {
			var fileReader = new FileReader();
			fileReader.readAsDataURL( $('#'+elt)[0].files[0] );
			fileReader.onload = function(event) {

				content = event.target.result;

				if(typeof filename != "undefined") {
					this.value.push({"filename":filename, "data":content});
				}else{
					this.value.push({"data":content});
				}
				$('#'+elt).val('');
				callback();
			}.bind(this)
			return true;
		}else{
			$('#'+elt).val('');
			return false;
		}
	},

	del: function(index) {
		if(arguments.length == 1) {
			delete this.value[index-1];
			arraytmp = [];
			for (i in this.value){
					if (typeof this.value[i] != 'undefined') {
						arraytmp.push( this.value[i] );
					}
			}
			this.value = arraytmp;
		}else{
			this.value = [];

		}
	}
},

Thread:{
	filter: {},
	filterOld: {},
	tri: {"field":"InjectionDate","order":"desc","tree":false},
	oldTri: [],
	viewlu: 'all',
	isView: [],
	indexDataID: [],
	value: [],
	display: function() {},

	clean: function(){
		this.value = [];
		this.indexDataID = [];
	},

	del: function( dataID ){
		for(i in this.value) {
			if( this.value[i].Data.DataID == dataID) {
				delete this.value[i];
				delete this.indexDataID[dataID];
			}
		}
	},

	getMinID: function(){
		var minID = 1e15;
		var ID;
		if(this.value.length) {
			for(var ind in this.value) {
				ID = parseInt(this.value[ind].ID);
				minID = (ID < minID) ? ID : minID;
			}
		}
		return minID;
	},

	get: function(params){

		this.filter["Data.DataType"] = "Article";

		if(typeof params.listen == "undefined") {
			params.listen = 0;
		}

		if(params.IDstart) {
			this.filter["ID"] = [params.IDstart, 'min'];
		}
		else if(params.IDstop) {
			this.filter["ID"] = [params.IDstop, 'max'];
		}else{
			delete this.filter["ID"];
		}

		cmd = ["get", {
			"select":["Data.DataID","Data.Subject","Data.FromName","Data.FromMail","Data.InjectionDate","Data.ThreadID","Data.Control","@2References","Meta.Size"],
			"limit": Nemo.Tools.getVar('totalArticle'),
			"filter": this.filter,
			"listen": params.listen
			}
		];

		JNTP.execute(cmd, function(code, j){switch(code) {
		case "200":
			var maxID = 0;
			var res = {"firstID":0, "total":0};
			if(typeof params.notclean == "undefined") {
				this.clean();
			}
			if(j.body.length) {

				for(ind in j.body) {
					ID = parseInt(j.body[ind].ID);
					maxID = (ID > maxID) ? ID : maxID;
					if(!j.body[ind].Data.Control){
						j.body[ind].Data.InjectionDate = (typeof j.body[ind].Data.InjectionDate) ? j.body[ind].Data.InjectionDate.replace("T", " ").replace("Z",""): '';
						j.body[ind].Read = (typeof this.getView(j.body[ind].Data.DataID) == "undefined" || !this.getView(j.body[ind].Data.DataID)) ? 0 : 1;

						if( !this.indexDataID[j.body[ind].Data.DataID]) {
							this.value.push(j.body[ind]);
							this.indexDataID[j.body[ind].Data.DataID] = true;
						}

					}else{
						if(j.body[ind].Data.Control[0] == 'cancel') {
							this.del(j.body[ind].Data.Control[1]);
						}
					}
				}

				i=this.value.length;
				do
				   i--;
				while (typeof this.value[i] == "undefined" && i>0);
				if(typeof this.value[i] != "undefined") {
					res.firstID = this.value[i].ID;
				}
			}
			if(maxID == 0) {
				maxID = params.IDstart;
			}
			if(params.listen || params.listenNext) {
				JNTP.xhrAbortAll();
				this.get({"listen":1,"notclean":true,"IDstart":maxID});
			}

			res.total = this.value.length;

			if(params.callback) {
				params.callback(res);
			}
			this.display();
		break;
		}}.bind(this), true);
	},

	sort: function(){
		if(this.tri.tree) {
			if( this.tri.order == "asc" && this.tri.field == "InjectionDate"){
				return this.tree( this.value.sort(Nemo.Tools.comparAsc("InjectionDate")) );
			}else{
				return this.tree( this.value.sort(Nemo.Tools.comparDesc("InjectionDate")) );
			}
		}

		if (this.tri.order == 'asc') {
			return this.value.sort(Nemo.Tools.comparAsc(this.tri.field));
		} else {
			return this.value.sort(Nemo.Tools.comparDesc(this.tri.field));
		}
	},

	getView: function(dataID) {

		if(arguments.length == 1) {
			return this.isView[dataID];
		}

		if(typeof localStorage.articleRead == "undefined" || !localStorage.articleRead) {
			localStorage.articleRead = '';
		}
		tab = localStorage.articleRead.split('<>');
		for(i in tab) {
			this.isView[tab[i]]=true;
		}
	},

	setView: function(dataID, value) {
		this.isView[dataID] = value;
		if(typeof localStorage.articleRead == "undefined" || !localStorage.articleRead) {
			localStorage.articleRead = '';
		}
		localStorage.articleRead = localStorage.articleRead.replace(new RegExp(dataID+'<>', 'g'),'');
		if(value == true) {
			localStorage.articleRead = dataID + '<>' + localStorage.articleRead;
			if(localStorage.articleRead.split('<>').length > 3000) {
				localStorage.articleRead = localStorage.articleRead.substring(0, localStorage.articleRead.lastIndexOf('<>')+1);
			}
		}

		for(ind in this.value) {
			if (this.value[ind].Data.DataID == dataID) {
				this.value[ind].Read = value;
				break;
			}
		}
	},

	tree: function(idArticle) {
		
		var childs = {"/":[]};
		var index = [];
		var tree = [];
		var ind = 1;
		var level = 1;

		// Indexation des dataID
		for(var i in this.value) {
			index[this.value[i].Data.DataID] = true;
		}

		var numberOfElement = 0;

		// On parcourt la liste des articles
		for(var i in this.value) {
			numberOfElement++;
			if(typeof this.value[i] == "undefined") {
				continue;
			}

			var bool = false;
			// Si le champ Références n'existe pas ou s'il est mal formaté on le transforme en tableau vide
			if (typeof this.value[i].Data.References == "undefined" || !(this.value[i].Data.References instanceof Array) ) {
				this.value[i].Data.References = [];
			}
			// On balaye les références de l'articles depuis la fin pour détecter si une référence a été indexée
			for(var j = this.value[i].Data.References.length - 1; j >= 0; j--) {
				if(index[this.value[i].Data.References[j]]) {
					bool = true;
					break;
				}
			}

			// Si pas de références indexées l'article est enfant de la racine / sinon l'article est enfant de sa référence.
			if(!bool) {
				childs["/"].push(this.value[i]); 
			}else{
				if( typeof childs[this.value[i].Data.References[j]] == "undefined" ) {
					childs[this.value[i].Data.References[j]] = [];
				}
				childs[this.value[i].Data.References[j]].push(this.value[i]);
			}
		}

		tree.push({"Data":{"DataID":"/"}, "level":0});

		var article = childs["/"].shift();
		article.level = level;
		var dataID = article.Data.DataID;
		tree.push(article);


		while(tree.length < numberOfElement + 1) {

			//Si dataID est parent on dépile l'article du tableau childs
			var ind;
			if( typeof childs[dataID] != "undefined" && childs[dataID].length) {

				article = childs[dataID].shift();
				dataID = article.Data.DataID;
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

			dataID = tree[ind].Data.DataID;
			level = tree[ind].level;
		}

		tree.shift();

		// Renvoie seulement la branche contenant dataID
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
	}
},

Favoris: {
	store: function(favoris){
		if(typeof favoris != "undefined"){
			Nemo.Tools.storeVar('favoris', favoris);
		}else{
			Nemo.Tools.storeVar('favoris', Nemo.Tools.getVar('favoris'));
		}
	},

	sort: function(){
		var favoris = [];
		var favoris2 = {};
		for(i in Nemo.Tools.getVar('favoris')) {
		    favoris.push(i);
		}
		favoris.sort();
		for(i in favoris){
		    favoris2[favoris[i]] = Nemo.Tools.getVar('favoris')[favoris[i]];
		};

		this.store(favoris2);
	},

	add: function(groupName, rwm) {
		if(typeof Nemo.Tools.getVar('favoris')[groupName] == 'undefined') {
			Nemo.Tools.getVar('favoris')[groupName] = rwm;
		}
		this.store();
	},

	del: function(groupName) {
		delete Nemo.Tools.getVar('favoris')[groupName];
		this.store();
	}
},

Blacklist: {
	list: [],
	getList: function() {
		return localStorage.blacklist;
	},
	load: function() {
		if(typeof localStorage.blacklist == "undefined" || !localStorage.blacklist) {
			localStorage.blacklist = '';
		}
		this.list = localStorage.blacklist.split("\n");
	},
	set: function(name) {
		if(name == '') return;
		delete this.list[this.list.indexOf(name)];
		this.list.push(name);
		localStorage.blacklist = this.list.join("\n");
		localStorage.blacklist = localStorage.blacklist.replace(/\n+/g,"\n").replace(/^\n+/g,"");
	},
	isInList: function(name) {
		return ( $.inArray( name, this.list ) != -1) ? true : false;
	}
}

}

Nemo.Article = function() {
	this.value = {};
	this.owner = false;
	this.isValid = false;

	// options = ID,DataID,read,source,surligne,callback;
	this.get = function(options){
		this.owner = false;
		if(options.ID) {
			cmd = ["get",{"filter":{"Data.DataType":"Article","ID":options.ID}}];
		}else if(options.DataID) {
			cmd = ["get",{"filter":{"Data.DataType":"Article","Data.DataID":options.DataID}}];
		}else if(options.Jid) {
			cmd = ["get",{"filter":{"Data.DataType":"Article","Jid":options.Jid}}];
		}
		JNTP.execute(cmd, function(code, j, callback){
			switch(code) {
				case "200":
					this.value = j.body[0].Data;
					if(this.value.DataType == 'Article') {
						if( JNTP.Packet.isValid(j.body[0]) ){
							this.isValid = true;
							if(this.value.HashClient == JNTP.getHashClient(this.value,  Nemo.Tools.getVar('SecretKey')).hashClientCompute) {
								this.owner = true;
							}

						}else{
							this.isValid = false;
						}
					}

					if(options.callback) { 
						options.callback(options);
					}

					if(options.read) {
						Nemo.Thread.setView(this.value.DataID, true);
					}
				break;

				case "500":
				break;
			}
			options.graphicRefresh(options, code, j);
		}.bind(this));
	};

	this.diffuse = function(options){
		this.set({
			"DataType" : 'Article',
			"Media" : Nemo.Media.val(),
			"ReplyTo" : JNTP.ReplyTo,
			"Uri": JNTP.url + '/?DataID=#DataID#'
		});

		var article = JNTP.forgeDataArticle(this.value, Nemo.Tools.getVar('SecretKey'));
		JNTP.execute([ "diffuse" , { "Data" : article.Data } ], function(code, j){
			switch(code) {
				case "200":
					Nemo.Media.del();
				break;
			}
			options.callback(options, code, j);
		});
	};

	this.ban = function(options){
		var articleToDelete = new Nemo.Article().set({
			"DataType" : "Article",
			"FollowupTo" : [],
			"Control" : ["cancel", this.value.DataID, "This hash is not correct because generated by Nemo Admin (temporary)"],
			"Body" : "Article d'annulation posté via Nemo.",
			"Subject" : "[CANCEL] <"+this.value.DataID+">",
			"ThreadID": this.value.ThreadID,
			"Newsgroups": this.value.Newsgroups,
			"FromName": JNTP.Storage.FromName,
			"FromMail": JNTP.Storage.FromMail,
			"Media": []
		}).diffuse(options);
	};

	this.del = function(options){
		var articleToDelete = new Nemo.Article().set({
			"DataType" : "Article",
			"FollowupTo" : [],
			"Control" : ["cancel", this.value.DataID, JNTP.getHashClient(this.value, Nemo.Tools.getVar('SecretKey')).hashClientSecret],
			"Body" : "Article d'annulation posté via Nemo.",
			"Subject" : "Annulation de <"+this.value.DataID+">",
			"ThreadID": this.value.ThreadID,
			"Newsgroups": this.value.Newsgroups,
			"FromName": JNTP.Storage.FromName,
			"FromMail": JNTP.Storage.FromMail,
			"Media": []
		}).diffuse(options);
	};

	this.setReferences = function(refs){
		if(refs.length > 10) {
			this.value.References = refs.slice(refs.length-10,refs.length);
			this.value.References[0] = refs[0];
		}else{
			this.value.References = refs;
		}
		return this;
	};

	this.set = function(json) {
		for(key in json){
			this.value[key] = json[key];
		}
		return this;
	};

	this.clone = function(body) {
		var clone = jQuery.extend(true, {}, this);
		clone.value.Body = body;
		return clone;
	};

	this.renduQuote = function() {

	 	var body = Nemo.Tools.HTMLEncode( this.value.Body );
		var rt_alea = '@'+Math.floor(Math.random()*1e10)+'@';
		var rt = "\n";
		var reg = /\[([a-z]+)\][\s\S]*?\[\/\1\]/g;
		body = body.replace(reg, function(s, m){ return s.replace(/\n/g, rt_alea);});
		body = body.split(rt);

		for (i in body)
		{
			motif = body[i].match(/^(&gt;| )+\s?/gi);

			if(motif) {
				n = motif[0].split("&gt;").length - 1;
				pos = (n > 0) ? (motif[0].length - motif[0].lastIndexOf("&gt;") - 5) : motif[0].length;
				ligne = body[i].substr(motif[0].length - pos, body[i].length);
			}else{
				n = 0;
				ligne = body[i];
			}
			if(ligne == ''){
				body[i] = '<span style="display:block" data-line="'+(i).toString()+'" data-cite="'+(n).toString()+'">&nbsp;</span>';
			}else{
				body[i] = '<span style="display:block" data-line="'+(i).toString()+'" data-cite="'+(n).toString()+'">'+ligne+'</span>';
			}
		}

		body = body.join('');
		reg = new RegExp(rt_alea, "g"); 
		body = body.replace(reg, "\n");
		
		return this.clone(body);
	};

	this.renduFont = function() {
		var body = this.value.Body;
		var reg = /(\[b\])([\s\S]*?)(\[\/b\])/ig;
		body = body.replace(reg,'<b>$2</b>');
		var reg = /(\[u\])([\s\S]*?)(\[\/u\])/ig;
		body = body.replace(reg,'<u>$2</u>');
		var reg = /(\[i\])([\s\S]*?)(\[\/i\])/ig;
		body = body.replace(reg,'<i>$2</i>');
		var reg = /(\[s\])([\s\S]*?)(\[\/s\])/ig;
		body = body.replace(reg,'<strike>$2</strike>');
		
		return this.clone(body);
	};

	this.setBalise = function(json) {
		var reg = '\\['+json['name']+'\\]((?:(?!\\['+json['name']+'\\])[\\S\\s])*)\\[\\/'+json['name']+'\\]';
		return this.clone( this.value.Body.replace(new RegExp(reg, 'g'), json['replace']) );
	};

	this.setTemplateVar = function() {
		var body = this.value.Body;
		var reg = /\[spoil\]([\s\S]*?)\[\/spoil\]/ig;
		body = body.replace(reg, function(s, m){return '[spoil]'+Nemo.Tools.rot13(Nemo.Tools.rot13(m).replace(/#DataID#/g, this.value.DataID))+'[/spoil]';});

		var reg = /\[var=([#@a-zA-Z0-9\/:]+)\]/g;
		if(this.value.DataID) {
			body = body.replace(reg, function(s, m){return this.getIdentifiantValue(m);}); // à revoir
			body = body.replace(/#Uri#/g, this.value.Uri).replace(/#DataID#/g, this.value.DataID).replace(/#ThreadID#/g, this.value.ThreadID);
		}
		return this.clone(body);
	};

	this.clearCitations = function(boolean){
		var body = this.value.Body;
		if (boolean) {
			var reg = new RegExp("(>>.*\n)", "g");
			if(reg.test(body)) {
				// Supprime la première ligne citée.
				body = body.replace(/(>.*\n)/,'').replace(reg,'');
			}
		}
		return this.clone(body);
	};

	this.clearSignature = function() {
		var reg = /(\[signature\])([\s\S]*?)(\[\/signature\])/ig;
		return this.clone(this.value.Body.replace(reg,''));
	};

	this.quote = function(options) {
		// Citations
		var body = this.value.Body;
		var chevron = '>'+Math.floor(Math.random()*1e10)+'<';
		body = body.replace(/^>/gm, chevron+">" ).replace(/^(?!>)/gm, chevron+" " );
		var from = (options.FromName) ? options.FromName : options.FromMail;
		var artDate = Nemo.Tools.date2String(options.date);
		body = "Le " + artDate.day + " à " + artDate.time + ", " + from + " a écrit :\n" + body + "\n";
		var reg = /\[([a-z]+)\][\s\S]*?\[\/\1\]/g;
		body = body.replace(reg, function(s, m){ reg = new RegExp(chevron+" ", "g"); return s.replace(reg,'');});
		var reg = new RegExp(chevron, "g");
		body = body.replace(reg, '>');

		return this.clone(body);
	};

	this.getSelectLines = function(){
		var body = this.value.Body;
		var html = "";
		var startLine = -1;
		var endLine = -1;
		if (typeof window.getSelection != "undefined") {
			var sel = window.getSelection();
			if (sel.rangeCount) {
				var container = document.createElement("div");
				for (var i = 0, len = sel.rangeCount; i < len; ++i) {
					container.appendChild(sel.getRangeAt(i).cloneContents());
				}
				html = container.innerHTML;
				var regexp = /<(div|br|span).*?data-line="([0-9]+)".*?>/g;
				var matches = html.match(regexp);

				if(matches != null) {
					startLine = parseInt($(matches[0]).attr('data-line'));
					endLine = parseInt($(matches[matches.length-1]).attr('data-line'));
				}
			}
		}
		if(startLine != -1) {
			body = body.split("\n");
			var newBody = '';
			for(i in body){
				if(i >= startLine && i <= (endLine + 1)){
					newBody = newBody + body[i] + "\n";
				}
			}
			body = newBody;
		}
		return this.clone(body);
	};

	this.renduHTML = function(div, interpretPlugin) {
		var newArticle = this.setTemplateVar();
		var reg = /(\s|^)(https?|ftp)(:\/\/[-A-Z0-9+@#\/%?=~_|*&$!:,.;\(\)]+)(?=\s|$)/ig;
		newArticle.clone( newArticle.value.Body.replace(reg,'$1[a]$2$3[/a]') );

		var reg = /(\s|^|\(|<)(https?|ftp)(:\/\/[-A-Z0-9+@#\/%?=~_|*&$!:,.;\(\)]+)(\s|>|$)/igm;
		newArticle.clone( newArticle.value.Body.replace(reg,'$1[a]$2$3[/a]$4') );

		newArticle = newArticle.renduQuote().setBalise({
			"name":"signature",
			"replace":'<div class="signature">$1</div>'
		});

		var reg = /(\[a\])(https?|ftp)(:\/\/[-A-Z0-9+@#\/%?=~_|*&$!:,.;\(\)]+)(\[\/a\])/ig;
		newArticle.clone( newArticle.value.Body.replace(reg,'<a class="link" href="$2$3" target="_blank">$2$3</a>') );

		if (1==1 || arguments.length == 2 || this.isValid) {

			newArticle = newArticle.renduFont().setBalise({
				"name": "cite",
				"replace": '<center class="cite"><cite>$1</cite></center>'
			}).setBalise({
				"name": "spoil",
				"replace": function(s, m){return '<button class="button" onclick="$(this).next().show(); $(this).hide();">Voir</button><span style="display:none">'+Nemo.Tools.rot13(m)+'</span>';}
			}).setBalise({
				"name": "table",
				"replace": '<table class="table">$1</table>'
			}).setBalise({
				"name": "td",
				"replace": '<td>$1</td>'
			}).setBalise({
				"name": "tr",
				"replace": '<tr>$1</tr>'
			});

			var reg = /(\[size=([0-9]+)\])([\s\S]*?)(\[\/size\])/g;
			newArticle.clone( newArticle.value.Body.replace(reg,'<span style="font-size:$2px;">$3</span>') );

			var reg = /\[file name=(.+?)\]\s?(.+?)\s?\[\/file\]/g;
			newArticle.clone( newArticle.value.Body.replace(reg,'<a class="file link" href="$2">$1</a>') );

			var reg = /(\[size=([0-9]+)\])([\s\S]*?)(\[\/size\])/g;
			newArticle.clone( newArticle.value.Body.replace(reg,'<span style="font-size:$2px;">$3</span>') );

			var reg = /(\[font=([a-zA-Z0-9 ]+)\])([\s\S]*?)(\[\/font\])/g;
			newArticle.clone( newArticle.value.Body.replace(reg,'<span style="font-family:\'$2\';">$3</span>') );

			var reg = /\[pdf\]\s?(jntp:.+?)\s?\[\/pdf\]/g;
			newArticle.clone( newArticle.value.Body.replace(reg, function(s, m){return this.displayResource(m, 'pdf');}) );

			var reg = /\[pdf\]\s?(.+?)\s?\[\/pdf\]/g;
			newArticle.clone( newArticle.value.Body.replace(reg, '<embed type="application/pdf" width="95%" height="950" src="$1">') );

			var reg = /\[img\]\s?(jntp:.+?)\s?\[\/img\]/g;
			newArticle.clone( newArticle.value.Body.replace(reg, function(s, m){return this.displayResource(m, 'img');}) );

			var reg = /\[img\]\s?(.+?)\s?\[\/img\]/g;
			newArticle.clone( newArticle.value.Body.replace(reg, "\n"+'<a class="popin" href="$1"><img src="$1"></a>') );

			var reg = /\[audio\]\s?(.+?)\s?\[\/audio\]/g;
			newArticle.clone( newArticle.value.Body.replace(reg,'<audio controls src="$1"></audio>') );

			var reg = /\[youtube\]([a-zA-Z0-9_\-]*)\[\/youtube\]/g;
			newArticle.clone( newArticle.value.Body.replace(reg,'<iframe width="420" height="315" src="http://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>') );

			var reg = /\[dailymotion\]([a-zA-Z0-9_\-]*)\[\/dailymotion\]/g;
			newArticle.clone( newArticle.value.Body.replace(reg,'<iframe width="480" height="270" src="http://www.dailymotion.com/embed/video/$1" frameborder="0" allowfullscreen></iframe>') );

			var reg = /(news:)([-A-Z0-9+#\/%?=~_|$!:,.;]+@[-A-Z0-9+#\/%?=~_|$!:,.;]+)/ig;
			newArticle.clone( newArticle.value.Body.replace(reg,'<a class="link" href="/?DataID=$2" target="_blank">$1 $2</a>') );

			var reg = /(news:)([A-Z0-9+#.*@]+)/ig;
			newArticle.clone( newArticle.value.Body.replace(reg,'<a class="link" href="/?Newsgroup=$2" target="_blank">$1 $2</a>') );

			var reg = /"(jntp:)([-A-Z0-9+@#\/%?=~_|!:,.;]+)"/ig;
			newArticle.clone( newArticle.value.Body.replace(reg,JNTP.uri+'$2') );

			// set [c=x]
			var reg = /\[c=(x?[0-9a-fA-F]+)\]/g;
			newArticle.clone( newArticle.value.Body.replace(reg, function(s,m) {
				val = (m[0] != 'x') ? parseInt(m) : parseInt(m.substr(1),16);
				if(val < 0xFFFF) {
					return String.fromCharCode(val);
				}else{
					val -= 0x10000;
					return String.fromCharCode(0xD800 + (val>>10), 0xDC00 + (val&0x3FF));
				}
			}) );

			$('#'+div).html( newArticle.value.Body );

			// set Plugins
			for(plugin in Nemo.plugins.balise) {
				reg = '(\\['+plugin+'\\])([\\s\\S]*)(\\[\\/'+plugin+'\\])';
				reg = new RegExp(reg, 'i');
				if(reg.test( $('#'+div).html() )) {
					params = { div : div };
					Nemo.plugins.balise[plugin].load(params);
				}
			}

			$('[data-media]').each(function(i){
				num = $(this).attr('data-media') - 1;
				$(this).attr('src', (typeof Nemo.Media.value[num] == "object") ? Nemo.Media.value[num].data : Nemo.Media.value[num]);
			})

			$('embed').show();
			$(".popin").colorbox({photo:true, maxWidth:"95%", maxHeight:"95%"});

		}else{
			$('#'+div).html( newArticle.value.Body );
		}
	};

	displayResource = function(resource, type) {
		var resources = resource.split(':');
		var path = resources[1];
		var paths = path.split('/');
		var num = resources[2];
		var dataid = paths[0];

		if(paths.length == 2 && paths[1] == 'Data.Media') {
			if(dataid == '#DataID#'){
				if(type == 'img') {
					return '<img data-media="' + num + '">';
				}else if(type == 'pdf') {
					return '<embed data-media="' + num + '" type="application/pdf" width="95%" height="950" style="display:none">';
				}
			}else{
				url = JNTP.uri + resources[1] + ':' + resources[2];
				if(type == 'img') {
					return '<a class="popin" href="' + url + '"><img src="' + url + '"></a>';
				}else if(type == 'pdf') {
					return '<embed src="' + url + '" type="application/pdf" width="95%" height="950" style="display:none">';
				}
			}
		}
	};

	getIdentifiantValue = function(identifiant) {
		try {
			var key = identifiant.split('/');
			var value = this.value;
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
	};
}

