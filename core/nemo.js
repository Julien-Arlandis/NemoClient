/**
 * @author : Julien Arlandis <julien.arlandis@laposte.net>
 * @Licence : Attribution-NonCommercial-ShareAlike 3.0 Unported
 */
var Nemo = {

/* Déclarations des thèmes */
listeSkin: {
	"classic" : ["Classique",1],
	"amazonie" : ["Amazonie",1],
	"gothique": ["Gothique",1],
	"tahiti" : ["Tahiti",1],
	"abricot" : ["Abricot",1]
},

plugins:{balise:[], module:[]},
currentSkin: "classic",
isCtrlPress: false,
isShiftPress: false,
listCmd: [],
cursorCmd: 0,
oldTri: [],
filterOld: {},
windowLoaded: false,
validJNTP: false,
char: {
	reserved: {'[':'[',']':']','#':'#'},
	math: ['±','×','⁄','÷','≠','≡','≤','≥','²','³','√','⟦','⟧','⟨','⟩','⟪','⟫','∛','∜','∞','¼','½','¾','⅕','⅙','⅛','∀','∂','∃','∈','∉','∋','∏','∧','∨','∩','∪','∫','⊂','⊃','ℜ'],
	money: ['€','$','₤','¥','₽'],
	grec: ['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','π','ρ','ς','σ','τ','υ','φ','χ','ψ','ω',' ','Γ','Δ','Θ','Λ','Ξ','Π','Ρ','Σ','Φ','Ψ','Ω'],
	ponctuation: [' ','«','»','“','”','œ','Œ','æ','Æ','ÿ','Ÿ','¶','©','®','™'],
	smiley: ['😃','😇','😉','😁','😎','😞']
},

startConnexion: function(){
	JNTP.inPopup = false;
	$('#nemo_version').html(JNTP.UserAgent);
	$('#jntp_server').html('Tentative de connexion à jntp://' + JNTP.url.replace('http://',''));

	JNTP.execute(["whoami"], function(code, j){switch(code) {
	case "200":
		$('#jntp_server').html('Connecté à jntp://' + JNTP.url.replace('http://',''));
		$("#authentification").hide();
		$("#deconnexion, #historique").show();
		$('#deconnect').attr('data-info','Se déconnecter du compte ' + j.body.email);
		$('#identity').html(j.body.FromName);
		$('#email').val(j.body.email);
		if(j.body.privilege == 'admin') {
			$("#ban_article").show();
		}
		$('#box_inscription').html('<strong>Vous êtes actuellement connectés sous votre identifiant ' + j.body.email+'</strong>');
	break;

	case "500":
		$('#jntp_server').html('Connecté à jntp://' + JNTP.url.replace('http://',''));
		$("#authentification").show();
		$("#deconnexion, #historique").hide();
	break;
	}});
},

authentification: function(){
	JNTP.execute(["auth", { "user":$('#user').val(), "password":$('#password').val() }], function(code, j){switch(code) {
	case "200":
		$("#password, #user").val('');
		$("#authentification").hide();
		$("#historique, #deconnexion").show();
		$('#message_accueil').html('Bienvenue ' + j.body.email);
		$('#identity').html(j.body.FromName);
		$('#email').val(j.body.email);
		if(typeof JNTP.Article.ID != "undefined" ) {
			Nemo.getArticle({"ID":JNTP.Article.ID});
		}
		
		if(j.body.privilege == 'admin') {
			$("#ban_article").show();
		}
		$('#box_inscription').html('<strong>Bienvenue sur Nemo, vous êtes actuellement connectés avec ' + j.body.email+'</strong>');
		$('#deconnect').attr('data-info','Se déconnecter du compte ' + j.body.email);
		break;

	case "400":
		$("#password").val('');
		$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Le compte n'a pas encore été validé, si vous n'avez pas reçu le mail de validation vérifiez dans votre dossier spam ou bien contactez l'administrateur du service le cas échéant.</p>");
		break;

	case "500":
		$("#password").val('');
		$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>Mauvaise authentification</p>');
		break;
	}});
},

inscription: function(){
	var cmd = ["inscription",{"password":$('#inscription_password').val(), "email":$('#inscription_email').val()}];
	JNTP.execute(cmd, function(code, j){switch(code) {
	case "200":
		$('#box_inscription').html('Un mail de validation va vous être envoyé.');
	break;

	case "500":
		$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
	break;
	}});
},

deconnexion: function(){
	JNTP.execute(["quit"], function(code, j){switch(code) {
	case "200":
		$("#authentification").show();
		$('#email').val('');
		$("#deconnexion, #historique, #ban_article").hide();
		if(typeof JNTP.Article.ID  != "undefined" ) {
			Nemo.getArticle({"ID":JNTP.Article.ID});
		}
		$('#box_inscription').html('<strong>Au revoir</strong>');
	break;

	case "500":
	break;
	}});
},

displayFavoris: function() {
	$('#favoris').empty();
	try{
		for(var groupName in JNTP.favoris) {
			var rwm = JNTP.favoris[groupName];
			$('#favoris').append('<div class="blocNewsgroup"><div class="icon_favori" data-name="'+groupName+'" data-rwm="'+rwm+'"></div><div class="tri_favoris newsgroup '+rwm+'" data-name="'+groupName+'" data-rwm="'+rwm+'">'+groupName+'</div></div>');
		}
	} catch(e){ console.log(e)}
	Nemo.reloadEvent();
},

displayNewsgroupsCategory: function() {
	JNTP.execute(["getNewsgroup", {"category":true}], function(code, j){switch(code) {
		case "200":
		$('#newsgroupsL1').empty();
		var cat = [];
		for(var i=0;i < j.body.length;i++) {
			if( $.inArray( j.body[i]['category'], cat ) == -1) {
				cat.push(j.body[i]['category']);
				if(i>0) $('#newsgroupsL1').append('<hr>');
				$('#newsgroupsL1').append('<div class="categorie_groups" data-name="'+j.body[i]['category']+'">'+j.body[i]['category']+'</div>');
			}
		}

		for(var i=0;i < j.body.length;i++) {
			$('#newsgroupsL1 [data-name="'+j.body[i]['category']+'"]').after('<div class="icon_favori" data-name="'+j.body[i]['name']+'" data-rwm="h"></div><div class="newsgroup h" data-name="'+j.body[i]['name']+'" data-rwm="h">'+j.body[i]['name']+'</div>');
		}

		Nemo.setFavoriIcon();
		Nemo.reloadEvent();
		break;
	}})
},

getNewsgroups: function(params){
	JNTP.Newsgroups = params.name;
	JNTP.execute(["getNewsgroup", params], function(code, j){switch(code) {
	case "200":
		$('#newsgroups').empty();
		if(j.body.length > 0 && typeof params.name != "undefined" && params.name.indexOf('.*') != -1) {
			if(params.name.match(/\./g).length > 1) {
				parent = params.name.substr(0, params.name.length-3);
				parent = parent.substr(0, parent.lastIndexOf('.'))+'.*';
				$('#newsgroups').append('<div class="icon_favori" data-name="'+parent+'" data-rwm="h"></div><div class="newsgroup h" data-name="'+parent+'" data-rwm="h">'+parent+'</div>');
			}	
			$('#newsgroups').append('<div class="icon_favori" data-name="'+params.name+'" data-rwm="h"></div><div class="newsgroup h" data-name="'+params.name+'" data-rwm="h">'+params.name+'</div>');
		}

		for(ind in j.body) {
			var groupName = j.body[ind].name;
			var rwm = (groupName.indexOf('.*') == -1) ? ((j.body[ind].rules['w'] == 1) ? 'w' : 'r') : 'h';
			var description = (typeof j.body[ind].description != "undefined") ? j.body[ind].description : '';
			$('#newsgroups').append('<div class="icon_favori" data-name="'+groupName+'" data-rwm="'+rwm+'"></div><div class="newsgroup '+rwm+'" data-name="'+groupName+'" data-info="'+description+'" data-rwm="'+rwm+'">'+groupName+'</div>');
		}

		Nemo.reloadEvent();
		var groupName = JNTP.filter["Data.Newsgroups"];
		Nemo.setFavoriIcon(groupName);

	break;
	}});
},

// options = ID,Jid,read,source,surligne,callback;
getArticle: function(options){

	$('#chargement').show();
	if(options.ID) {
		cmd = ["get",{"filter":{"Data.DataType":"Article","ID":options.ID}}];
	}else if(options.Jid) {
		cmd = ["get",{"filter":{"Data.DataType":"Article","Jid":options.Jid}}];
	}
	JNTP.execute(cmd, function(code, j){switch(code) {

	case "200":
		$('#chargement').hide();
		if(j.body.length == 0) {
			$("#dialog-alert").dialog({ modal: true, buttons:{} }).html('<p>Article non trouvé</p>');
			return;
		}

		JNTP.Article = j.body[0]; // À déclarer dans lib.jntp.js...

		if(options.callback) { 
			options.callback();
		}

		if(typeof options.surligne != "undefined") {
			Nemo.surligneArticle(JNTP.Article.ID, options.surligne);
		}

		if(options.read) {
			$('#fil [data-ID="'+JNTP.Article.ID+'"]').addClass("lu");
			JNTP.setView(JNTP.Article.Jid, true);
		}

		if(options.source) {
			$('#article_source, #hide_source').show();
			$('#view_source').hide();
		}

		$('#references, #article_fu2, #article_newsgroup, #article_date, #article_subject, #article_from, #article_size, #article_body').html('');
		$('#article_deleted, #references, #voir_references, #hide_source, #article_header_fu2, #article_source, #supprimer_article, #modifier_article, #revoir_citations, #delete_citations, #voir_supersede, #champ_article_replyto').hide();
		if(!j.body.length) { $('#article_body').html("Cet article n'existe pas ou a été supprimé"); break; }
		$('#view_source').show();

		var reg = new RegExp("(>>.*\n)", "g");
	
		if(reg.test(JNTP.Article.Data.Body)) {
			 $('#delete_citations').show();
		}

		$('#article_certification').attr('class', '');
		if(JNTP.Article.Data.DataType == 'Article') {
			if( JNTP.isValidJNTP(JNTP.Article) ){
				Nemo.validJNTP = true;
				$('#article_certification').attr('data-info', 'Article publié par '+JNTP.Article.Data.UserID);
				$('#article_certification').attr('class', 'jntp_valid');
				if(JNTP.Article.Data.HashClient == JNTP.getHashClient(JNTP.Article.Data).hashClientCompute) {
					$('#supprimer_article, #modifier_article').show();
				}

			}else{
				$('#article_certification').attr('class', 'jntp_invalid');
			}
		}

		var str = JSON.stringify(JNTP.Article, undefined, 4);
		$('#article_size').html('('+str.length+' octets)');

		if (JNTP.Article.Data.Supersedes){
				$('#voir_supersede').show();
				$('#article_supersede').html(JNTP.Article.Data.Supersedes);
		}

		$('#article_source').html(JNTP.syntaxHighlight(str));

		$('#article_from').html(JNTP.HTMLEncode(JNTP.Article.Data.FromName + " <" + JNTP.Article.Data.FromMail + "> "));
		$('#article_subject').html(JNTP.HTMLEncode(JNTP.Article.Data.Subject));
		var date_article = Nemo.date2String(JNTP.Article.Data.InjectionDate);
		$('#article_date').html(date_article.day + ' à ' + date_article.time);

		for(i in JNTP.Article.Data.Newsgroups){
			$('#article_newsgroup').append('<span class="newsgroup" data-name="'+JNTP.HTMLEncode(JNTP.Article.Data.Newsgroups[i])+'">'+JNTP.HTMLEncode(JNTP.Article.Data.Newsgroups[i])+'</span>');
		}


		if( typeof JNTP.Article.Data.References != "undefined" && JNTP.Article.Data.References.length ){

			if(JNTP.viewReferences){
				$('#references').show();
			}

			for(i in JNTP.Article.Data.References){
				$("#references").append('<div><span data-jid="'+JNTP.HTMLEncode(JNTP.Article.Data.References[i])+'" class="reference">'+JNTP.HTMLEncode(JNTP.Article.Data.References[i])+'</span></div>');
			}
			$('#voir_references').show();

			$('.reference').off("click").click(function() {
				Jid = $(this).attr('data-jid');
				Nemo.getArticle({"Jid":Jid, "read":1, "surligne":true});
			});
		}

		if(typeof JNTP.Article.Data.ReplyTo != "undefined"){
			$('#champ_article_replyto').show();
			$('#article_replyto').html('<a class="champ_value replyto" href="mailto:'+JNTP.Article.Data.ReplyTo+'">'+JNTP.Article.Data.ReplyTo+'</a>');
		}

		if(typeof JNTP.Article.Data.FollowupTo != "undefined" && JNTP.Article.Data.FollowupTo.length){
			$('#article_header_fu2').show();
			for(i in JNTP.Article.Data.FollowupTo){
				$('#article_fu2').append('<span class="newsgroup" data-name="'+JNTP.HTMLEncode(JNTP.Article.Data.FollowupTo[i])+'">'+JNTP.HTMLEncode(JNTP.Article.Data.FollowupTo[i])+'</span>');
			}
		}

		Nemo.renduHTML( JNTP.setTemplateVar( JNTP.Article.Data.Body ), 'article_body');

		if(JNTP.Article.Data.DataType == 'ListGroup') {
			$("#article_body").html( $("#article_body").html() + "<br>" + JNTP.HTMLEncode(JSON.stringify(JNTP.Article.Data.ListGroup, undefined, 4)) );
		}
		var nbLike = (typeof JNTP.Article.Meta.Like == "undefined") ? 0 : JNTP.Article.Meta.Like;
		$('#compteur_like').html(nbLike);
		Nemo.reloadEvent();
	break;

	case "500":
		$('#chargement').hide();
	break;
	}});

},

diffuseArticle: function(){

	$("#chargement").show();
	$("#send_form").hide();
	if (JNTP.inPopup){
		$('#chargement2').show();
	}
	var newsgroups = $('#formulaire_newsgroup').val().replace(/ /g,"").replace(/,\s*$/g,"").split(',');

	if(JNTP.modeEdit == 'html') {
		JNTP.modeEdit = 'text';
		Nemo.selectModeEdition();
	}

	var body = Nemo.bodyEdit().replace(/\?\?/g,"? ? ");

	JNTP.FromName = $('#formulaire_from').val();
	JNTP.FromMail = $('#formulaire_email').val();

	var followupTo = [];
	if($('#formulaire_fu2').val()) {
		followupTo = $('#formulaire_fu2').val().replace(/ /g,"").replace(/,\s*$/g,"").split(',');
	}

	var params = {
			"DataType" : "Article", 
			"Newsgroups" : newsgroups, 
			"Body" : body, 
			"FollowupTo" : followupTo, 
			"Subject" : $('#formulaire_subject').val().replace(/\?\?/g,"? ? "),
			"Supersedes" : $('#formulaire_supersede').val(),
			"ReplyTo": JNTP.ReplyTo,
			"Uri": JNTP.url + '/?Jid=#Jid#'
	};

	var article = JNTP.forgeData(params);
	if(article.error == "tooLong") {
		$("#dialog-alert").dialog({ modal: true, buttons:{} }).html('<p>Article trop long (' + Math.round(article.size/1024) + ' ko), taille maximale autorisée : ' + Math.round(JNTP.maxArticleSize/1024) + ' ko</p>');
		$("#chargement").hide();
		$("#send_form").show();
		return ;
	}

	JNTP.execute([ "diffuse" , { "Data" : article.Data } ], function(code, j){switch(code) {

	case "200":

		Nemo.xpostMail(j.body.Jid, JNTP.url + '/?Jid='+j.body.Jid);
		$('#formulaire_subject, #'+JNTP.bodyInputID+', #add_img, #formulaire_xpostmail').val('');
		$("#chargement, #chargement2").hide();
		JNTP.media = [];
		Nemo.closeRedactionWindow();
	break;

	case "500":
		$("#dialog-alert").dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
		$("#chargement, #chargement2").hide();
		$("#send_form").show();
	break;


	}});
},

deleteArticle: function(art){

	var params = {
		"DataType" : "Article",
		"Newsgroups" : art.Data.Newsgroups, 
		"Body" : "Article d'annulation posté via Nemo.",
		"Subject" : "Annulation de <"+art.Jid+">",
		"FollowupTo" : (typeof art.Data.FollowupTo == "array") ? art.Data.FollowupTo : [] ,
		"Control" : ["cancel", art.Jid, JNTP.getHashClient(art.Data).hashClientSecret]
	};

	var article = JNTP.forgeData(params);

	var cmd = [ "diffuse" , { "Data" : article.Data } ];

	JNTP.execute(cmd, function(code, j){switch(code) {
	case "200":
		$('#supprimer_article').hide();
		$('#article_deleted').show();
		JNTP.media = [];
		break;

	case "500":
		$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
		break;

	}});
},

banArticle: function(art){
	var params = {
		"DataType" : "Article",
		"Newsgroups" : art.Data.Newsgroups, 
		"Body" : "Article d'annulation émis par un modérateur JNTP via Nemo.",
		"Subject" : "[Modération JNTP] Annulation de <"+art.Jid+">",
		"FollowupTo" : (typeof art.Data.FollowupTo == "array") ? art.Data.FollowupTo : [],
		"Control" : ["cancel", art.Jid, "This hash is not correct because generated by JNTP Admin (temporary)"]
	};

	var article = JNTP.forgeData(params);

	var cmd = [ "diffuse" , { "Data" : article.Data } ];

	JNTP.execute(cmd, function(code, j){switch(code) {
	case "200":
		$('#supprimer_article').hide();
		$('#article_deleted').show();
		JNTP.media = [];
		break;

	case "500":
		$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
		break;

	}});
},

loadMenuSkin: function() {
        for(var key in Nemo.listeSkin) {
		var actif = (Nemo.listeSkin[key][1] == 1) ? '' : 'disabled';
        	$('#styleName').append('<option value="'+key+'" '+actif+'>'+Nemo.listeSkin[key][0]+'</option>');
        }
},

changeTheme: function(skin) {
	if(Nemo.listeSkin[skin][1] == 1) {
		$('link[data-theme=general]').attr('href','skins/'+skin+'/style.css');
		$('#styleName option[value="'+skin+'"]').prop('selected', true);
		Nemo.currentSkin = skin;
	}
},

xpostMail: function(jid, uri){
	if($("#formulaire_xpostmail").val() != '') {
		window.location = "mailto:"+$("#formulaire_xpostmail").val()+"?subject="+$('#formulaire_subject').val()+"&body="+encodeURIComponent(article.Data.Body.replace(/#Jid#/g, jid).replace(/#Uri#/g, uri));
	}
},

setFavoriIcon: function(groupName, rwm) {
	$('.icon_favori').removeClass('del_favori add_favori');
	$('.newsgroup[data-name="'+groupName+'"]').each(function() {
		if(typeof JNTP.favoris[groupName] == 'undefined') {
			$('.icon_favori[data-name="'+groupName+'"]').removeClass('del_favori').addClass('add_favori');
		}else{
			$('.icon_favori[data-name="'+groupName+'"]').removeClass('add_favori').addClass('del_favori');
		}
	});

	$('.add_favori').off().click(function() {
		var groupName = $(this).attr('data-name');
		var rwm = $(this).attr('data-rwm');
		JNTP.addFavoris(groupName, rwm);
		Nemo.displayFavoris();
		$('.icon_favori').removeClass('del_favori add_favori');
	});
	
	$('.del_favori').off().click(function() {
		var groupName = $(this).attr('data-name');
		JNTP.deleteFavoris(groupName);
		Nemo.displayFavoris();
		$('.icon_favori').removeClass('del_favori add_favori');
	});
},

reloadEvent: function() {

	$( "#favoris" ).sortable({
		stop: function( event, ui ) {
			var favoris = {};
			$("#favoris .newsgroup").each(function( ) {
				favoris[$(this).attr('data-name')] =  $(this).attr('data-rwm');
			});
			JNTP.storeFavoris(favoris);
		}
	});

	$("[data-info]").mousemove(function(e) {
		var data = $(this).attr('data-info');
		if(data) {
			$('#infobulle').html(data);
			$('#infobulle').css({'left':e['pageX']+15,'top':e['pageY']+15}).show();
		}
	}).mouseout(function(e) {
		$('#infobulle').hide();
	});

	$('.newsgroup').attr('oncontextmenu','return false').off("click").click(function(e) {
		var groupName = $(this).attr('data-name');
		var rwm = $(this).attr('data-rwm');
		Nemo.setFavoriIcon(groupName, rwm);
		if(groupName.indexOf('.*') != -1) {
			Nemo.getNewsgroups({"name":groupName,"level":1});
		}
		JNTP.filter = {"Data.Newsgroups":groupName};
		JNTP.getFil({
			"listenNext":1, 
			"callback": function(res) {
				if(res.firstID) Nemo.getArticle({"ID":res.firstID,"read":0,"surligne":true});
			}
		});
	});


	$('#fil tr').attr('oncontextmenu','return false').off("click").click(function(e) {
		var ID = $(this).attr('data-ID');
		var Jid = $(this).attr('data-jid');

		if(Nemo.isCtrlPress) {
			if($('#fil [data-ID="'+ID+'"]').hasClass("selected") ) {
				$('#fil [data-ID="'+ID+'"]').removeClass("selected");
			}else{
				$('#fil [data-ID="'+ID+'"]').addClass("selected");
			}
			return;
		}else if(Nemo.isShiftPress) {
			var lastLine = $('#fil .selected:last').attr('data-line');
			var selectLine = $(this).attr('data-line');
			var minLine = Math.min(lastLine,selectLine);
			var maxLine = Math.max(lastLine,selectLine)
			for (var i=maxLine; i>=minLine; i--) {
				$('#fil [data-line="'+i+'"]').addClass("selected");
			}
			return;
		}

		if(!$(this).hasClass("selected")) {
			Nemo.getArticle({"Jid":Jid,"read":1,"surligne":false});
			if ($('#contextMenu').is(':visible')) { 
				$('#contextMenu').hide();
			}
			return;
		}
		
		if ($('#contextMenu').is(':visible')) { 
			$('#contextMenu').hide();
			return;
		}
		$('[data-menu]').addClass('select');
		if(JNTP.getView(Jid)) {
			$('[data-menu="mark_lu"]').removeClass('select');
		}else{
			$('[data-menu="mark_nonlu"]').removeClass('select');
		}
		if($('#fil .selected').length > 1) {
			$('[data-menu]').removeClass('select');
			$('[data-menu="mark_nonlu"]').addClass('select');
			$('[data-menu="mark_lu"]').addClass('select');
		}

		$('#contextMenu').css({'left':e['pageX'],'top':e['pageY']}).show();

		$('#contextMenu .select').off("click").click(function() {
			switch ($(this).attr('data-menu')) {
			case "blacklist":
				for(i in JNTP.Fil) {
					if(JNTP.Fil[i].ID == ID ) {
						JNTP.setBlacklist(JNTP.Fil[i].Data.FromName + ',' + JNTP.Fil[i].Data.FromMail);
						Nemo.refreshFil();
					}
				}
				break;
			case "open_window":
				winskin = (Nemo.currentSkin != 'classic') ? '&skin='+Nemo.currentSkin : '';
				window.open('/?Jid=' + Jid + winskin);
				break;
			case "mark_nonlu":
				$('#fil .selected').each(function() { 
					JNTP.setView($(this).attr('data-Jid'), false);
					$('#fil [data-ID="'+$(this).attr('data-ID')+'"]').removeClass("lu");
				})
				break;		
			case "mark_lu":
				$('#fil .selected').each(function() {
					JNTP.setView($(this).attr('data-Jid'), true);
					$('#fil [data-ID="'+$(this).attr('data-ID')+'"]').addClass("lu");
				})
				break;			
			case "mark_nonlu_tous":
				$('#fil tr').removeClass("lu");
				for(i in JNTP.Fil) {
					JNTP.setView(JNTP.Fil[i].Jid, false);
				}
				break;			
			case "mark_lu_tous":
				$('#fil tr').addClass("lu");
				for(i in JNTP.Fil) {
					JNTP.setView(JNTP.Fil[i].Jid, true);
				}
				break;
			case "mark_nonlu_branche":
				branch = JNTP.getTree(JNTP.Fil, ID);
				$(branch).each(function(i) {
					$('#fil [data-ID="'+branch[i].ID+'"]').removeClass("lu");
					JNTP.setView(branch[i].Jid, false);
				})
				break;
			case "mark_lu_branche":
				branch = JNTP.getTree(JNTP.Fil, ID);
				$(branch).each(function(i) {
					$('#fil [data-ID="'+branch[i].ID+'"]').addClass("lu");
					JNTP.setView(branch[i].Jid, true);
				})
				break;
			case "load_more":
				JNTP.getFil({"IDstop":JNTP.minIDFil(), "notclean":true});
				break;
			case "viewThread":
				winskin = (Nemo.currentSkin != 'classic') ? '&skin='+Nemo.currentSkin : '';
				window.open('/?ThreadID=' + JNTP.Article.Data['ThreadID'] + '&Jid=' + Jid + winskin);
				break;
			}
			$('#contextMenu').hide();
		});

	});
 
	$('#fil .parent .tree').off("click").click(function() {

		id = $(this).parent().attr('data-ID');
		level = $(this).parent().attr('data-level');
		if ($(this).hasClass('right') ) {
			$(this).removeClass('right').addClass('down');
			do {
				id = $('#fil [data-ID="'+id+'"]').next("tr").attr('data-ID');
				level = $('#fil [data-ID="'+id+'"]').next("tr").attr('data-level');
				$('#fil [data-ID="'+id+'"]').removeClass('invisible').addClass('visible');
			} while (level > 1)
		}else{
			$(this).removeClass('down').addClass('right');
			do {
				id = $('#fil [data-ID="'+id+'"]').next("tr").attr('data-ID');
				level = $('#fil [data-ID="'+id+'"]').next("tr").attr('data-level');
				$('#fil [data-ID="'+id+'"]').removeClass('visible').addClass('invisible');
			} while (level > 1)
		}
		if (JNTP.viewlu == 'lu') {
			$('#fil tr:not(.lu)').removeClass('visible').addClass('invisible');
		}else if (JNTP.viewlu == 'nonlu') {
			$('#fil tr.lu').removeClass('visible').addClass('invisible');
		}
		Nemo.alterLineColor();
		return false;

	});
},

renduFont: function(body) {
	var reg = /(\[b\])([\s\S]*?)(\[\/b\])/ig;
	body = body.replace(reg,'<b>$2</b>');
	var reg = /(\[u\])([\s\S]*?)(\[\/u\])/ig;
	body = body.replace(reg,'<u>$2</u>');
	var reg = /(\[i\])([\s\S]*?)(\[\/i\])/ig;
	body = body.replace(reg,'<i>$2</i>');
	var reg = /(\[s\])([\s\S]*?)(\[\/s\])/ig;
	body = body.replace(reg,'<strike>$2</strike>');
	return body;
},

renduQuote: function(body, putNumLine, setFormat) {

 	body = JNTP.HTMLEncode( body );
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
	return body;
},

setBalise: function(json, body) {
	var reg = '\\['+json['name']+'\\]((?:(?!\\['+json['name']+'\\])[\\S\\s])*)\\[\\/'+json['name']+'\\]';
	return body.replace(new RegExp(reg, 'g'), json['replace']);
},

renduHTML: function(body, div, interpretPlugins) {

	$('#accueil').hide();
	$('#panneau_principal').show();

	var reg = /(\s|^)(https?|ftp)(:\/\/[-A-Z0-9+@#\/%?=~_|*&$!:,.;\(\)]+)(?=\s|$)/ig;
	body = body.replace(reg,'$1[a]$2$3[/a]');
	var reg = /(\s|^|\(|<)(https?|ftp)(:\/\/[-A-Z0-9+@#\/%?=~_|*&$!:,.;\(\)]+)(\s|>|$)/igm;
	body = body.replace(reg,'$1[a]$2$3[/a]$4');

	body = Nemo.renduQuote( body );

	body = Nemo.setBalise({
		"name":"signature",
		"replace":'<div class="signature">$1</div>'
	},body);

	var reg = /(\[a\])(https?|ftp)(:\/\/[-A-Z0-9+@#\/%?=~_|*&$!:,.;\(\)]+)(\[\/a\])/ig;
	body = body.replace(reg,'<a class="link" href="$2$3" target="_blank">$2$3</a>');

	if (arguments.length == 3 || Nemo.validJNTP) {

		body = Nemo.renduFont( body );

		body = Nemo.setBalise({
			"name": "cite",
			"replace": '<center class="cite"><cite>$1</cite></center>'
		},body);

		body = Nemo.setBalise({
			"name": "spoil",
			"replace": function(s, m){return '<button class="button" onclick="$(this).next().show(); $(this).hide();">Voir</button><span style="display:none">'+JNTP.rot13(m)+'</span>';}
		},body);

		body = Nemo.setBalise({
			"name": "table",
			"replace": '<table class="table">$1</table>'
		},body);

		body = Nemo.setBalise({
			"name": "td",
			"replace": '<td>$1</td>'
		},body);

		body = Nemo.setBalise({
			"name": "tr",
			"replace": '<tr>$1</tr>'
		},body);

		var reg = /(\[size=([0-9]+)\])([\s\S]*?)(\[\/size\])/g;
		body = body.replace(reg,'<span style="font-size:$2px;">$3</span>');

		var reg = /\[file name=(.+?)\]\s?(.+?)\s?\[\/file\]/g;
		body = body.replace(reg,'<a class="file link" href="$2">$1</a>');

		var reg = /(\[size=([0-9]+)\])([\s\S]*?)(\[\/size\])/g;
		body = body.replace(reg,'<span style="font-size:$2px;">$3</span>');

		var reg = /(\[font=([a-zA-Z0-9 ]+)\])([\s\S]*?)(\[\/font\])/g;
		body = body.replace(reg,'<span style="font-family:\'$2\';">$3</span>');

		var reg = /\[pdf\]\s?(jntp:.+?)\s?\[\/pdf\]/g;
		body = body.replace(reg, function(s, m){return Nemo.getResource(m, 'pdf');});

		var reg = /\[pdf\]\s?(.+?)\s?\[\/pdf\]/g;
		body = body.replace(reg, '<embed type="application/pdf" width="95%" height="950" src="$1">');

		var reg = /\[img\]\s?(jntp:.+?)\s?\[\/img\]/g;
		body = body.replace(reg, function(s, m){return Nemo.getResource(m, 'img');});

		var reg = /\[img\]\s?(.+?)\s?\[\/img\]/g;
		body = body.replace(reg, "\n"+'<a class="popin" href="$1"><img src="$1"></a>');

		var reg = /\[audio\]\s?(.+?)\s?\[\/audio\]/g;
		body = body.replace(reg,'<audio controls src="$1"></audio>');


		var reg = /\[youtube\]([a-zA-Z0-9_\-]*)\[\/youtube\]/g;
		body = body.replace(reg,'<iframe width="420" height="315" src="http://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>');

		var reg = /\[dailymotion\]([a-zA-Z0-9_\-]*)\[\/dailymotion\]/g;
		body = body.replace(reg,'<iframe width="480" height="270" src="http://www.dailymotion.com/embed/video/$1" frameborder="0" allowfullscreen></iframe>');

		var reg = /(news:)([-A-Z0-9+#\/%?=~_|$!:,.;]+@[-A-Z0-9+#\/%?=~_|$!:,.;]+)/ig;
		body = body.replace(reg,'<a class="link" href="/?Jid=$2" target="_blank">$1 $2</a>');

		var reg = /(news:)([A-Z0-9+#.*@]+)/ig;
		body = body.replace(reg,'<a class="link" href="/?Newsgroup=$2" target="_blank">$1 $2</a>');

		var reg = /"(jntp:)([-A-Z0-9+@#\/%?=~_|!:,.;]+)"/ig;
		body = body.replace(reg,JNTP.uri+'$2');

		$('#'+div).html( body );

		for(plugin in Nemo.plugins.balise) {
			reg = '(\\['+plugin+'\\])([\\s\\S]*)(\\[\\/'+plugin+'\\])';
			reg = new RegExp(reg, 'i');
			if(reg.test( $('#'+div).html() )) {
				params = { div : div };
				Nemo.plugins.balise[plugin].load(params);
			}
		}

		var reg = /\[c=(x?[0-9a-fA-F]+)\]/g;

		body = $('#'+div).html();
		body = body.replace(reg, function(s,m) {
			val = (m[0] != 'x') ? parseInt(m) : parseInt(m.substr(1),16);
			if(val < 0xFFFF) {
				return String.fromCharCode(val);
			}else{
				val -= 0x10000;
				return String.fromCharCode(0xD800 + (val>>10), 0xDC00 + (val&0x3FF));
			}
		});

		$('#'+div).html( body );

		$('[data-media]').each(function(i){
			num = $(this).attr('data-media') - 1;
			$(this).attr('src', (typeof JNTP.Article.Data.Media[num] == "object") ? JNTP.Article.Data.Media[num].data : JNTP.Article.Data.Media[num]);
		})

		$('[data-media_local]').each(function(i){
			num = $(this).attr('data-media_local') - 1;
			$(this).attr('src', (typeof JNTP.media[num] == "object") ? JNTP.media[num]['data'] : JNTP.media[num]);
		})

		$('embed').show();

	}else{
		$('#'+div).html( body );
	}
	$(".popin").colorbox({photo:true, maxWidth:"95%", maxHeight:"95%"});
},

getResource: function(resource, type) {
	var resources = resource.split(':');
	var path = resources[1];
	var paths = path.split('/');
	var num = resources[2];
	var Jid = paths[0];

	if(paths.length == 2 && paths[1] == 'Data.Media') {
		if(Jid == '#Jid#'){
			if(type == 'img') {
				return '<img data-media_local="' + num + '">';
			}else if(type == 'pdf') {
				return '<embed data-media_local="' + num + '" type="application/pdf" width="95%" height="950" style="display:none">';
			}
		}else if (typeof JNTP.Article.Jid != "undefined" && Jid == JNTP.Article.Jid &&  typeof JNTP.Article.Data.Media[num-1] != "undefined" && typeof JNTP.Article.Data.Media[num-1].data != "undefined") {
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
},

bodyEdit: function(body, format){

	if (arguments.length > 0) {
		if(format == 'html'){
			body = body.replace(/&nbsp;/g,"");
			body = body.replace(/<div>/g,"");
			body = body.replace(/(<\/div>|<br.*?>|<\/span>)/g,"\n");
			body = body.replace(/\n$/,"");

			body = body.replace(/<b>/g,"[b]");
			body = body.replace(/<i>/g,"[i]");
			body = body.replace(/<u>/g,"[u]");
			body = body.replace(/<strike>/g,"[s]");
			body = body.replace(/<\/b>/g,"[/b]");
			body = body.replace(/<\/i>/g,"[/i]");
			body = body.replace(/<\/u>/g,"[/u]");
			body = body.replace(/<\/strike>/g,"[/s]");

			var reg = /<(span|div|br).*?data-cite="([0-9]+)".*?>/g;
			body = body.replace(reg, function(m, p1, p2){ cite = ''; for(i=0;i<p2;i++) {cite += '>'} return (cite=='')?cite:cite+' ';});
			body = body.replace( /&gt;/g,'>').replace( /&lt;/g,'<');
		}
		$('#'+JNTP.bodyInputID).val(body);
	}
	return $('#'+JNTP.bodyInputID).val();
},

alterLineColor: function(){
	$("#fil tr").removeClass("color");
	$("#fil tr.visible").each(function(i) {
		if(i%2) { $(this).addClass("color"); }
	})
},

refreshFil: function(total){
	var groupName = JNTP.filter["Data.Newsgroups"];
	if(groupName) {
		$('.actif').removeClass("actif");
		$('.newsgroup[data-name="'+groupName+'"]').addClass("actif");
	}
	$('#accueil').hide();
	$('#panneau_principal, #accueil_nemo').show();

	if(typeof total != "undefined" && total == 0) {
		$('#fil_info').show();
		$('#fil_info').html(JNTP.filter["Data.Newsgroups"] + " : Pas d'articles");
		$('#fil').html('');
		return;
	}

	Nemo.selectOrder();
	liste = JNTP.trierFil();
	table = '';
	$('#fil_info').hide();
	$('#fil').html('');
	var line = 0;
	for(ind in liste) {

		var date_article = Nemo.date2String(liste[ind].Data.InjectionDate);
		var lu = (liste[ind].Read) ? ' lu' : '';
		var attach = (liste[ind].Meta.Size.length > 1) ? 'trombone' : 'none';
		var fromName = (liste[ind].Data.FromName != "") ? liste[ind].Data.FromName : liste[ind].Data.FromMail;
		var decal = '';
		var position = ' child';
		var circuit = ''; // Arborescence circulaire
		var size = 0;
		$.each(liste[ind].Meta.Size, function() { size+=this;});
		var level = 1;
		if(liste[ind].level == 1) {
			position = (typeof liste[ind-1] != "undefined" && liste[ind-1].level != 1) ? ' parent' : ' nochild';
		}
		if(liste[ind].level && JNTP.tri.tree) {
			for(i=1; i<liste[ind].level; i++) { decal += '<span style="margin-left:15px;"></span>'; }
			circuit = (liste[ind].circuit) ? ' circuit' : '';
			level = liste[ind].level;
		}
		if( !JNTP.isBlackListed(liste[ind].Data.FromName + ',' + liste[ind].Data.FromMail) ) {
			ligne = '<tr class="visible'+position+lu+circuit+'" data-line="'+ line++ +'" data-ID="'+JNTP.HTMLEncode(liste[ind].ID)+'" data-Jid="'+JNTP.HTMLEncode(liste[ind].Jid)+'" data-level="'+level+'">';
			ligne += '<td class="tree"></td>';
			ligne += '<td class="Subject">' + decal + JNTP.HTMLEncode(liste[ind].Data.Subject) + '&nbsp;</td>';
			ligne += '<td class="FromName">' + JNTP.HTMLEncode(fromName) + '&nbsp;</td>';
			ligne += '<td class="day">' + date_article.day + '</td>';
			ligne += '<td class="time">'+ date_article.time + '</td>';
			ligne += '<td class="taille">' + Math.ceil(size/1000) + ' ko</td>';
			ligne += '<td class="attach '+attach+'"></td>'
			ligne += '</tr>';
			$('#fil').prepend(ligne);
		}
	}

	if(JNTP.tri.tree == 1) {
		// On cache les enfants
		$('#fil .child').removeClass('visible').addClass('invisible');

		// Toutes les flèches à droite
		$('#fil .parent .tree').removeClass('down').addClass('right');

		// On part de l'article et on remonte
		id = JNTP.Article.ID;
		level = $('#fil [data-ID="'+id+'"]').attr('data-level');
		while(level >= 1) {
			// On affiche l'article
			$('#fil [data-ID="'+id+'"]').removeClass('invisible').addClass('visible');
			if(typeof id == "undefined" || level == 1) {
				// On met une flèche en bas pour le parent
				$('#fil [data-ID="'+id+'"] .tree').removeClass('right').addClass('down');
				break;
			}
			// On remonte d'un article
			id = $('#fil [data-ID="'+id+'"]').prev("tr").attr('data-ID');
			level = $('#fil [data-ID="'+id+'"]').attr('data-level');
		}

		// On part de l'article et on redescend
		id = JNTP.Article.ID;

		while( 1==1) {
			// On redescend d'un article
			id = $('#fil [data-ID="'+id+'"]').next("tr").attr('data-ID');
			level = $('#fil [data-ID="'+id+'"]').attr('data-level');
			
			if(typeof id == "undefined" || level == 1) {
				break;
			}else{
				// On affiche l'article
				$('#fil [data-ID="'+id+'"]').removeClass('invisible').addClass('visible');
			}
		}
	}else{
		if (JNTP.viewlu == 'lu') {
			$('#fil tr.lu').removeClass('invisible').addClass('visible');
		}else if (JNTP.viewlu == 'nonlu') {
			$('#fil tr:not(.lu)').removeClass('invisible').addClass('visible');
		}else if (JNTP.viewlu == 'all') {
			$('#fil tr').removeClass('invisible').addClass('visible');
		}
	}

	Nemo.surligneArticle(JNTP.Article.ID, true);

	if (JNTP.viewlu == 'lu') {
		$('#fil tr:not(.lu,.selected)').removeClass('visible').addClass('invisible');
	}else if (JNTP.viewlu == 'nonlu') {
		$('#fil tr.lu:not(.selected)').removeClass('visible').addClass('invisible');
	}


	Nemo.alterLineColor();
	Nemo.reloadEvent();
},

clearCitations: function(txt){
	var reg = new RegExp("(>>.*\n)", "g");
	if(reg.test(txt)) {
		// Supprime la première ligne citée.
		txt = txt.replace(/(>.*\n)/,'');
		txt = txt.replace(reg,'');
	}
	return txt;
},

quoteArticle: function(body) {

	// Citations
	var chevron = '>'+Math.floor(Math.random()*1e10)+'<';
	var body = body.replace(/^>/gm, chevron+">" ).replace(/^(?!>)/gm, chevron+" " );
	var from = (JNTP.Article.Data.FromName) ? JNTP.Article.Data.FromName : JNTP.Article.Data.FromMail;
	var artDate = Nemo.date2String(JNTP.Article.Data.InjectionDate);
	body = "Le " + artDate.day + " à " + artDate.time + ", " + from + " a écrit :\n" + body + "\n";
	var reg = /\[([a-z]+)\][\s\S]*?\[\/\1\]/g;
	body = body.replace(reg, function(s, m){ reg = new RegExp(chevron+" ", "g"); return s.replace(reg,'');});
	var reg = new RegExp(chevron, "g");
	return body.replace(reg, '>');
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

draftArticle: function() {
	Nemo.openRedactionWindow(function(){
		win.Nemo.initRedactionInterface();
		var art = JNTP.draft();
		win.Nemo.bodyEdit( art.Body );
		win.$('#formulaire_subject').val( art.Subject );
		win.$('#formulaire_newsgroup').val( art.Newsgroups );
		win.$('#formulaire_fu2').val( art.FollowupTo );
		win.$('#formulaire_supersede').val( art.Supersedes )
		win.JNTP.setReferences( art.References, art.ThreadID, art.ReferenceUserID );
		win.document.getElementById(JNTP.bodyInputID).selectionStart = Nemo.bodyEdit().length;
		win.document.getElementById(JNTP.bodyInputID).selectionEnd = document.getElementById(JNTP.bodyInputID).selectionStart;
		win.$('#'+JNTP.bodyInputID).focus();
		var objDiv = document.getElementById(JNTP.bodyInputID);
		objDiv.scrollTop = objDiv.scrollHeight;
	});
},

displayMediaInfos: function() {
	obj = JNTP.mediaInfo();
	div = '';
	for(i in obj){
		 div = div + '<div class="file"><span class="delete_media" data-index="'+obj[i].index+'">&nbsp;</span>jntp:#Jid#/Data.Media:'  + obj[i].index + ' (' + obj[i].format + ') '+(obj[i].size/1000).toFixed(1)+' ko</div>';
	}
	$("#medias_info").html( div );

	$('.delete_media').off("click").click(function(){
		index = parseFloat( $(this).attr('data-index') );
		obj = JNTP.mediaInfo();
		for(i=index; i<=obj.length ; i++) {
			if(i == index) {
				Nemo.bodyEdit( Nemo.bodyEdit().replace('jntp:#Jid#/Data.Media:'+index,'') );
			}else{
				Nemo.bodyEdit( Nemo.bodyEdit().replace('jntp:#Jid#/Data.Media:'+(i).toString(), 'jntp:#Jid#/Data.Media:'+(i-1).toString()  ) );
			}
		}
		JNTP.deleteMedia( index );
		Nemo.displayMediaInfos();
	});
},

selectModeEdition: function() {
	if(JNTP.modeEdit == 'html') {
		$('#'+JNTP.bodyInputID).hide();
		$('#formulaire_body_html').show();
		$('#formulaire_body_html').html( Nemo.renduQuote( Nemo.bodyEdit() ));
		$('#mode_html').addClass('activated');
	}else{
		$('#'+JNTP.bodyInputID).show();
		$('#formulaire_body_html').hide();
		Nemo.bodyEdit( $('#formulaire_body_html').html(), "html" );
		$('#mode_html').removeClass('activated');
	}
},

surligneArticle: function(id, scroll) {
	$('#fil tr').removeClass("selected");
	$('#fil [data-ID="'+id+'"]').addClass("selected");
	if(scroll && $('#fil [data-ID="'+id+'"]').length ) {
		$('#scrollFil').animate({scrollTop: $('#fil [data-ID="'+id+'"]').position().top + $('#scrollFil').scrollTop() - 200}, 'fast');
	}
},

selectOrder: function(field, order, tree) {

	if(typeof tree != "undefined") {
		JNTP.tri.tree = tree;
	}
	if(field) {
		JNTP.tri.field = field;
	}
	if(order) { 
		if(order == "changeOrder") {
			JNTP.tri.order = (JNTP.tri.order == "asc") ? "desc" : "asc";
		}else{
			JNTP.tri.order = order;
		}
	}

	if(JNTP.tri.tree > 0) {
		$('#tree').removeClass('liste').addClass('arbo');
	}else{
		$('#tree').removeClass('arbo').addClass('liste');
	}
	$("#eye").attr('class', JNTP.viewlu);
	$("#Subject, #FromName, #InjectionDate").removeClass('asc desc').addClass("none");
	$("#"+JNTP.tri.field).addClass(JNTP.tri.order);
	$("#"+field).addClass(order);
},

getSelectLines: function(body){
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
	return body;
},

insertAtSelection: function(balise, txt) {

	endBalise = balise.split(" ")[0];
	txt = (typeof txt == "undefined") ? '' : txt;
	if(JNTP.modeEdit == 'text') {
		posStart = document.getElementById(JNTP.bodyInputID).selectionStart;
		posEnd = document.getElementById(JNTP.bodyInputID).selectionEnd;		
		beforeBalise = Nemo.bodyEdit().substring(0, posStart);
		afterBalise = Nemo.bodyEdit().substring(posEnd);
		n = balise.length;
		if(arguments.length == 1) {
			inBalise = Nemo.bodyEdit().substring(posStart, posEnd);
			if(balise == 'spoil') {
				if (posStart == posEnd) {
					$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Vous devez d'abord sélectionner votre texte</p>");
					$('#'+JNTP.bodyInputID).focus();
					return;
				}else{
					inBalise = JNTP.rot13(inBalise);
				}
			}
		}else{
			inBalise = txt;
		}
		if(balise != ''){
			body = beforeBalise + "["+balise+"]" + inBalise + "[/"+endBalise+"]" + afterBalise;
			decalCursor = posEnd + balise.length + endBalise.length + 5 + txt.length;
		}else{
			body = beforeBalise + inBalise + afterBalise;
			decalCursor = posEnd + balise.length + endBalise.length + txt.length;
		}
		Nemo.bodyEdit( body );
		document.getElementById(JNTP.bodyInputID).selectionEnd = decalCursor;
		document.getElementById(JNTP.bodyInputID).selectionStart= decalCursor;
		$('#'+JNTP.bodyInputID).focus();
	}else{

		if(balise == 'b') {
			document.execCommand('bold','','');
		}
		else if(balise == 'i') {
			document.execCommand('italic','','');
		}
		else if(balise == 'u') {
			document.execCommand('underline','','');
		}
		else if(balise == 's') {
			document.execCommand('strikeThrough','','');
		}
		else{
			if(arguments.length == 1) {
				txt = window.getSelection().getRangeAt(0).cloneContents().textContent;
				if(balise == 'spoil') {
					if (txt=='') {
						$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Vous devez d'abord sélectionner votre texte</p>");
					}else{
						txt = JNTP.rot13(txt);
					}
				}
			}
			txt = "["+balise+"]" + txt + "[/"+endBalise+"]";
			document.execCommand('insertText','', txt);

		}
	}
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
},

enterNewlineOrTab: function(e) {
	if(e.which == 13) {
		if(typeof $(window.getSelection().anchorNode.parentNode).attr('data-line') != 'undefined') {
			document.execCommand('insertHTML',false,' ');
			document.execCommand('delete');
			document.execCommand('insertHTML',false,'<div data-cite="0"><br></div>');
			return false;
		}
	}
	else if(e.which == 9) {
		document.execCommand('insertHTML',false,"\t");
		return false;
	}
},

closeRedactionWindow: function() {
	if (JNTP.inPopup){
		window.close();
		$('#accueil, #leftnav, #rightnav').show();
		$('#send_form').hide();
	}else{
		$("#send_form").dialog('close');
	}
},

openRedactionWindow: function( callback ) {
	if( !JNTP.activePopup ) {
		win = window;
		$('#send_form').dialog({ 
			height: 600, 
			width:900,
			title: 'Rédaction',
	 		position: { my: "center top", at: "center top", of: window },
			close: function(ev, ui) { $('#new_sujet, #repondre, #modifier_article').removeAttr("disabled"); }
		});
		callback();
	}else{
		winskin = (Nemo.currentSkin != 'classic') ? '&skin='+Nemo.currentSkin : '';
		if (window.navigator.userAgent.match(/iPhone/i)) {
			//JNTP.xhrAbortAll();
		}

		win = window.open("?post"+winskin+"&server="+JNTP.url,"","width=900,height=600");
		win.onload = function() {
			win.$('#accueil, #leftnav, #rightnav').hide();
			win.$('#send_form').show();
			win.JNTP.Session = JNTP.Session;
			win.JNTP.FromName = JNTP.FromName;
			win.JNTP.FromMail = JNTP.FromMail;
			win.JNTP.execute(["whoami"]);
			win.JNTP.inPopup = true;
			callback();
		};
	}
},

initRedactionInterface:function() {
	Nemo.reloadEvent();
	JNTP.clearMedia();
	JNTP.modeEdit = 'text';
	//Nemo.displayMediaInfos();
	Nemo.selectModeEdition();

	$('#contextMenu').hide();
	$('#formulaire_from').val(JNTP.FromName);
	$('#formulaire_email').val(JNTP.FromMail);
	$('#redaction, #formulaire_send').show();
	$('#rendu, #paint_window, .insert_media, #formulaire_update').hide();
	$('#'+JNTP.bodyInputID+', #formulaire_subject, #formulaire_fu2, #formulaire_newsgroup, #add_img_url, #add_pdf_url, #add_file, #add_pdf, #add_img, #formulaire_supersede').val('');
	$('#new_sujet, #repondre, #modifier_article').attr("disabled", "disabled");
	$('.onglet').removeClass("selected");
	$(".onglet[data-div='redaction']").addClass("selected");

	if(Nemo.windowLoaded) return;

	Nemo.windowLoaded = true;
	Nemo.plugins.module.painting.load();

	$('#view_rendu').click(function() {
		if (!$(this).hasClass('selected')) {
			Nemo.renduHTML(Nemo.bodyEdit(), 'rendu', true);
		}
	});

	$('#form_post').submit(function() {

		postForm = function() {
			if($('#formulaire_update').is(':visible')) {
				Nemo.deleteArticle(JNTP.ArticleUpdate);
			}
			Nemo.diffuseArticle();
		}

		if( JNTP.confirmSendArticle ) {

			$( "#dialog-alert" ).dialog({ 
				modal: true,
				buttons: {
					"Oui": function() {
						postForm();
						$( this ).dialog( "close" );
					},
					"Non": function() {
						$( this ).dialog( "close" );
					}
				}
			}).html("<p>Confirmer l'envoi de l'article?</p>");
		}else{
			postForm();
		}
		return false;
	});

	$('.onglet').click(function() {
		div_click = $(this).attr('data-div');
		$('.onglet').removeClass("selected");
		$('.onglet').each(function(i){
			div = $(this).attr('data-div');
			if(div_click == div) {
				$('#'+div).show();
				$(this).addClass("selected");
			}else{
				$('#'+div).hide();
			}
 		});
	});

	$('#submit_img_url').click(function() {
		Nemo.insertAtSelection('img', $('#add_img_url').val());
		$('.insert_img').hide();
		$('#add_img_url').val('');
	});

	$('#submit_pdf_url').click(function() {
		Nemo.insertAtSelection('pdf', $('#add_pdf_url').val());
		$('.insert_pdf').hide();
		$('#add_pdf_url').val('');
	});

	$('#add_pdf').change(function() {
		uri = 'jntp:#Jid#/Data.Media:'+(parseInt(JNTP.media.length) + 1);
		if(JNTP.addMedia('add_pdf', Nemo.displayMediaInfos)) {
			Nemo.insertAtSelection('pdf', uri);
			$('.insert_media').hide();
		}else{
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Fichier trop volumineux</p>");
		}
	});

	$('#add_file').change(function() {
		uri = 'jntp:#Jid#/Data.Media:'+(parseInt(JNTP.media.length) + 1);
		filename = $('#add_file').val().replace("C:\\fakepath\\", "");
		if(JNTP.addMedia('add_file', Nemo.displayMediaInfos, filename)) {
			Nemo.insertAtSelection('file name=' + filename, uri);
			$('.insert_media').hide();
		}else{
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Fichier trop volumineux</p>");
		}
	});

	$('#add_img').change(function() {
		uri = 'jntp:#Jid#/Data.Media:'+(parseInt(JNTP.media.length) + 1);

		if(JNTP.addMedia('add_img', Nemo.displayMediaInfos)) {
			Nemo.insertAtSelection('img', uri);
			$('.insert_media').hide();
		}else{
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Fichier trop volumineux</p>");
		}
	});

	$('#insert_a, #insert_b, #insert_i, #insert_u, #insert_s, #insert_spoil, #insert_tex, #insert_code, #insert_cite').click(function() {
		Nemo.insertAtSelection($(this).val());
	});

	$('#insert_other').change(function() {
		Nemo.insertAtSelection($(this).val());
		$('#insert_other').val('');
	});

	$('#mode_html').click(function() {
		JNTP.modeEdit = (JNTP.modeEdit == 'text') ? 'html' : 'text';
		Nemo.selectModeEdition();
	});

	$('#insert_pdf, #insert_file, #insert_img, #insert_c').click(function() {
		if($('.'+$(this).attr('id')).is(':hidden')){
			$('.insert_media').hide();
			$('.'+$(this).attr('id')).show();
		}else{
			$('.insert_media').hide();
		}
	});

	$('#insert_signature').click(function() {
		sign = "[signature]" + JNTP.signature + "[/signature]";
		if(JNTP.modeEdit == 'text') {
			Nemo.bodyEdit( Nemo.bodyEdit()+"\n" + sign);
			var objDiv = document.getElementById(JNTP.bodyInputID);
			objDiv.scrollTop = objDiv.scrollHeight;
		}else{
			Nemo.bodyEdit( Nemo.bodyEdit()+"\n" + sign);
			$('#formulaire_body_html').html( Nemo.renduQuote( Nemo.bodyEdit() ));
		}
	});

	$('#typeChar [data-value]').click(function() {
		var typeChar = $(this).attr('data-value');
		$('#listeChar').empty();
		for (var i in Nemo.char[typeChar] ){
			var value = (Nemo.char[typeChar] instanceof Array) ? Nemo.char[typeChar][i] : i;
			$('#listeChar').append('<div class="oneChar" data-value="'+Nemo.char[typeChar][i]+'">'+value+'</div>');
		}
		$('.oneChar').off("click").click(function() {
			Nemo.insertAtSelection('', $(this).attr('data-value'));
		});
	});

	$("textarea").keydown(function(e) {
		if(e.keyCode === 9) {
			var start = this.selectionStart;
			end = this.selectionEnd;
			$(this).val($(this).val().substring(0, start) + "\t" + $(this).val().substring(end));
			this.selectionStart = this.selectionEnd = start + 1;
			return false;
		}
	});

	$( "#formulaire_newsgroup, #formulaire_fu2" ).bind( "keydown", function( event ) {
		if ( event.keyCode === $.ui.keyCode.TAB &&
		    $( this ).data( "ui-autocomplete" ).menu.active ) {
		  event.preventDefault();
		}
	}).autocomplete({
		source: function( request, response ) {
			groupe = request.term.split( /[, ]\s*/ ).pop();
			JNTP.execute(["getNewsgroup", {"name" : groupe+'*', "total":10, "type":"N"}], function(code, j){switch(code) {
			case "200":

				response( $.map( j.body, function( item ) {
				      return {
					label: item.name,
					value: item.name
				      }
				}))

			break;

			}});
		},
		search: function() {
		  // custom minLength
		  var term = this.value.split( /[, ]\s*/ ).pop() ;
		  if ( term.length < 2 ) {
		    return false;
		  }
		},
		focus: function() {
		  // prevent value inserted on focus
		  return false;
		},
		appendTo: "#select_newsgroups",
		select: function( event, ui ) {
		  var terms = this.value.split( /[, ]\s*/ );
		  // remove the current input
		  terms.pop();
		  // add the selected item
		  terms.push( ui.item.value );
		  // add placeholder to get the comma-and-space at the end
		  terms.push( "" );
		  this.value = terms.join( ", " );
		  return false;
        }
      });

	$("#formulaire_body_html").keydown(function(e) {
		return Nemo.enterNewlineOrTab(e);
	});

	var periodicDraft = setInterval(function(){
		JNTP.draft({
			"Subject" : $('#formulaire_subject').val(),
			"Newsgroups" : $('#formulaire_newsgroup').val(),
			"Body" : Nemo.bodyEdit(),
			"FollowupTo": $('#formulaire_fu2').val(),
			"References": JNTP.newReferences,
			"Supersedes" : $('#formulaire_supersede').val(),
			"ThreadID": JNTP.newThreadID,
			"ReferenceUserID": JNTP.newUserID
		});
	}, 6000);

	if( Nemo.HTTPGet('server') ) {
		JNTP.uri = Nemo.HTTPGet('server') + '/jntp/';
	}
},

initInterface: function( ) {

	$('#mailAuthor').attr('href', 'mailto:julien.arlandis@laposte.net');
	$('#panneau_principal, #fil_info').hide();

	$('#Subject').click(function() {
		Nemo.selectOrder("Subject", "changeOrder", 0);
		Nemo.refreshFil();
	});

	$('#FromName').click(function() {
		Nemo.selectOrder("FromName", "changeOrder", 0);
		Nemo.refreshFil();
	});

	$('#InjectionDate').click(function() {
		Nemo.selectOrder("InjectionDate", "changeOrder");
		Nemo.refreshFil();
	});

	$('#eye').click(function() {
		if (JNTP.viewlu == 'all') {
			JNTP.viewlu = 'lu';
		}else if (JNTP.viewlu == 'lu') {
			JNTP.viewlu = 'nonlu';
		}else if (JNTP.viewlu == 'nonlu') {
			JNTP.viewlu = 'all';
		}
		Nemo.refreshFil();
	});

	$('#tree').click(function() {
		JNTP.tri.tree = (JNTP.tri.tree) ? 0 : 1;
		if(JNTP.tri.tree > 0) {
			order = (JNTP.tri.field == "InjectionDate") ? JNTP.tri.order : "desc";
			Nemo.selectOrder("InjectionDate", order, JNTP.tri.tree);
		}
		Nemo.refreshFil();
	});

	$("#repondre").click(function(e) {
		var body = JNTP.setTemplateVar( JNTP.Article.Data.Body );
		var reg = /(\[signature\])([\s\S]*?)(\[\/signature\])/ig;
		body = body.replace(reg,'');
		body = $('#delete_citations').is(':visible') ? body : Nemo.clearCitations( body );
		body = Nemo.getSelectLines(body);
		body = Nemo.quoteArticle(body);
		Nemo.openRedactionWindow(function() {
			win.JNTP.Article = JNTP.Article;

			// References
			var refs = (typeof JNTP.Article.Data.References != "undefined") ? JNTP.Article.Data.References : [];
			refs.push( JNTP.Article.Jid );
			var userid = (typeof JNTP.Article.Data.UserID != "undefined") ? JNTP.Article.Data.UserID : false;
			win.JNTP.setReferences( refs, JNTP.Article.Data['ThreadID'], userid);

			win.Nemo.initRedactionInterface();

			// Sujet
			var suf = (JNTP.Article.Data.Subject.substring(0, 3) != 'Re:')? 'Re: ' : '';
			win.$('#formulaire_subject').val(suf + JNTP.Article.Data.Subject);

			// Newsgroups
			if(typeof JNTP.Article.Data.FollowupTo != "undefined" && JNTP.Article.Data.FollowupTo.length){
				win.$('#formulaire_newsgroup').val(JNTP.Article.Data.FollowupTo.join( ', ' ));
			}else{
				win.$('#formulaire_newsgroup').val(JNTP.Article.Data.Newsgroups.join( ', ' ));
			}

			// Ouvre la popup, positionne le curseur
			win.Nemo.bodyEdit( body );
			win.document.getElementById(JNTP.bodyInputID).selectionStart = win.Nemo.bodyEdit().length;
			win.document.getElementById(JNTP.bodyInputID).selectionEnd = win.document.getElementById(JNTP.bodyInputID).selectionStart;
			win.$('#'+JNTP.bodyInputID).focus();
			var objDiv = win.document.getElementById(JNTP.bodyInputID);
			objDiv.scrollTop = objDiv.scrollHeight;
		});
	});

	$("#modifier_article").click(function() {
		Nemo.openRedactionWindow(function(){
			win.JNTP.ArticleUpdate = JNTP.Article;
			var referenceUserid = (typeof JNTP.Article.Data.ReferenceUserID != "undefined") ? JNTP.Article.Data.ReferenceUserID : false;
			win.JNTP.setReferences( JNTP.Article.Data.References, JNTP.Article.Data['ThreadID'], referenceUserid );

			win.Nemo.initRedactionInterface();
			win.$('#formulaire_send').hide();
			win.$('#formulaire_update').show();
			win.$('#formulaire_supersede').val( JNTP.Article.Jid );
			win.$('#formulaire_subject').val( JNTP.Article.Data.Subject );
			win.$('#formulaire_newsgroup').val(JNTP.Article.Data.Newsgroups.join(', '));
			win.$('#formulaire_fu2').val(JNTP.Article.Data.FollowupTo.join(', '));
			win.JNTP.copyMedia( JNTP.Article.Jid, win.Nemo.displayMediaInfos);

			win.Nemo.bodyEdit( JNTP.Article.Data.Body );
		});
	});

	$('#new_sujet').click(function() {
		Nemo.openRedactionWindow(function(){
			win.JNTP.setReferences( [], "", false );
			win.Nemo.initRedactionInterface();
			win.$('#formulaire_subject').focus();
			if( JNTP.Newsgroups.indexOf('*') == -1) {
				win.$('#formulaire_newsgroup').val( JNTP.Newsgroups );
			}
		});
	});

	$('#articles_draft').click(function() {
		Nemo.draftArticle();
	});


	$('#generate_secret_key').click(function() {
		JNTP.storeVar("SecretKey", JNTP.generateSecretKey());
		$('#secret_key').html(JNTP.SecretKey);
	});

	$('#supprimer_article').click(function() {
		$( "#dialog-alert" ).dialog({ 
			modal: true,
			buttons: {
				"Oui": function() {
				  Nemo.deleteArticle(JNTP.Article);
				  $( this ).dialog( "close" );
				},
				"Non": function() {
				  $( this ).dialog( "close" );
				}
			}
			}).html("<p>Confirmer l'annulation de l'article?</p>");
	});

	$('#parametres').click(function() {
		$("#config_nemo").dialog({ 
			minHeight: 500, minWidth:750, close: function() {} 
		});
		$('.accordeon').accordion();
		$("#confirm_send_article").attr('checked', (JNTP.confirmSendArticle == 1) ? true : false);
		$("#total_article").val(JNTP.totalArticle);
		$('output').text(JNTP.totalArticle);
		$('#secret_key').html(JNTP.SecretKey);
		$('#signature').val(JNTP.signature);
		$('#fromname').val(JNTP.FromName);
		$('#frommail').val(JNTP.FromMail);
		$('#replyto').val(JNTP.ReplyTo);
		$('#active_popup').attr('checked', (JNTP.activePopup == 1) ? true : false);
		$('#blacklist').val(localStorage.blacklist);
	});

	$('#form_authentification').submit(function() {
		Nemo.authentification();
		return false;
	});

	$('#form_inscription').submit(function() {
		Nemo.inscription();
		return false;
	});

	$('#deconnect').click(function() {
		Nemo.deconnexion();
	});

	$('#articles_send').click(function() {
		JNTP.filter = {"Data.UserID": JNTP.UserID};
		JNTP.getFil({
			"listenNext":1, 
			"callback": function(res) {
				if(res.firstID) Nemo.getArticle({"ID":res.firstID,"read":0,"surligne":true});
				$('.actif').removeClass("actif");
				$('#articles_send').addClass("actif");
			}
		});
	});

	$('#articles_response').click(function() {
		JNTP.filter = {"Data.ReferenceUserID": JNTP.UserID};
		JNTP.getFil({
			"listenNext":1, 
			"callback": function(res) {
				if(res.firstID) Nemo.getArticle({"ID":res.firstID,"read":0,"surligne":true});
				$('.actif').removeClass("actif");
				$('#articles_response').addClass("actif");
			}
		});
	});

	$('#recherche_article_go').click(function() {
		JNTP.filter = {};
		JNTP.filter[$('#article_filter1').val()] = [$('#article_value1').val(), 'contain'];
		JNTP.filter["Data.Protocol"] = $('#article_protocol').val();
		JNTP.filter["Data.Newsgroups"] = $('#newsgroups_value').val();
		JNTP.getFil({
			"callback": function(res) {
				if(res.firstID) Nemo.getArticle({"ID":res.firstID,"read":0,"surligne":true});
			}
		});
	});

	$('#recherche_article_jid').click(function() {
		JNTP.filter = { "Jid": $('#jid_value').val() };
		JNTP.getFil({
			"callback": function(res) {
				if(res.firstID) Nemo.getArticle({"ID":res.firstID,"read":0,"surligne":true});
			}
		});
	});

	$('#search_newsgroup').keyup(function() {
		motif = $('#search_newsgroup').val();
		if( motif.charAt(motif.length - 1) != '*') { motif = '*'+motif+'*'; }
		if(motif.length > 3) {
			if(motif.indexOf('.*') != -1) {
				Nemo.getNewsgroups({"name":motif,"level":1});
			}else{
				Nemo.getNewsgroups({"name":motif});
			}
		}
	});


	$('#active_console').click(function() {
		JNTP.log = true;
		$("#content_console").dialog("open");
		$('#active_console').hide();
		$('#console').val('["help"]');
	});

	$("#content_console" ).dialog({
		autoOpen: false,  height: 625, width:1100,
		close: function( event, ui ) {
			JNTP.log = false;
			$('#active_console').show();
		}
	});

	$('#recherche_article').click(function() {
		$("#config_recherche").dialog({ minHeight: 400, minWidth:750 });
	});

	$('.forget_password').click(function() {
		$("#recup_password").dialog({ minHeight: 250, minWidth:500 });
	});

	$('#valid_config').click(function() {
		$('#config_nemo').dialog( "close" );
	});

	$('#delete_localStorage').click(function() {
		$( "#dialog-alert" ).dialog({ 
			modal: true,
			buttons: {
				"Oui": function() {
				  localStorage.clear();
				  $( this ).dialog( "close" );
				},
				"Non": function() {
				  $( this ).dialog( "close" );
				}
			}
			}).html("<p>Ceci entrainera la suppression de vos paramètres de configuration de Nemo. <br>Confirmer?</p>");
	});

	$('#view_source').click(function() {
		$('#article_source').show();
		$(this).hide();
		$('#hide_source').show();
	});

	$('#hide_source').click(function() {
		$('#article_source').hide();
		$(this).hide();
		$('#view_source').show();
	});

	$('#ban_article').click(function() {
		if(confirm('Voulez-vous vraiment supprimer cet article du serveur?')) {
			Nemo.banArticle(JNTP.Article);
		}
	});

	$("#voir_references").click(function() {
		if(JNTP.viewReferences) {
			JNTP.viewReferences = false;
			$("#references").hide();
			$("#voir_references").html('Voir les références');
		}else{
			JNTP.viewReferences = true;
			$("#references").show();
			$("#voir_references").html('Cacher les références');
		}	
	});

	$("#voir_allThread").click(function() {
		$('#retour').show();
		$('#voir_allThread').hide();
		Nemo.filterOld = JNTP.filter;
		JNTP.filter = {"Data.ThreadID":JNTP.Article.Data['ThreadID']};
		Nemo.oldTri = [JNTP.tri.field, JNTP.tri.order, JNTP.tri.tree];
		JNTP.getFil({"listenNext":1});
		Nemo.selectOrder("InjectionDate", "desc", 1);
	});

	$("#retour").click(function() {
		$('#retour').hide();
		$('#voir_allThread').show();
		JNTP.filter = Nemo.filterOld;
		Nemo.selectOrder(Nemo.oldTri[0], Nemo.oldTri[1], Nemo.oldTri[2]);
		JNTP.getFil({"listenNext":1});
	});

	$('#delete_citations').click(function() {
		$('#revoir_citations').show();
		$(this).hide();
		Nemo.renduHTML( Nemo.clearCitations( JNTP.setTemplateVar( JNTP.Article.Data.Body ) ), 'article_body');
	});

	$('#revoir_citations').click(function() {
		$(this).hide();
		$('#delete_citations').show();
		Nemo.renduHTML( JNTP.setTemplateVar( JNTP.Article.Data.Body ), 'article_body');
	});

	$('#like').click(function() {

		var params = {
			"DataType" : "Like", 
			"Newsgroups" : JNTP.Article.Data.Newsgroups, 
			"Body" : JNTP.FromName + ' a aimé cet article', 
			"FollowupTo" : JNTP.Article.Data.FollowupTo, 
			"Subject" : JNTP.Article.Data.Subject,
			"ReplyTo": JNTP.ReplyTo,
			"Uri": JNTP.url + '/?Jid=#Jid#',
			"JidLike": JNTP.Article.Jid
		};

		var article = JNTP.forgeData(params);
		var cmd = [ "diffuse" , { "Data" : article.Data } ];
		JNTP.execute(cmd, function(code, j){switch(code) {
		case "200":
			$('#compteur_like').html(  parseInt($('#compteur_like').html()) + 1 );
			break;

		case "500":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
			break;
		}});
	});

	$('#change_email').click(function() {
		JNTP.execute(["set", {"email":$("#email").val()}], function(code, j){switch(code) {
		case "200":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
			break;

		case "500":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.error+'</p>');
			break;
		}});
	});

	$('#change_password').click(function() {
		JNTP.execute(["set", {"password":$("#newPassword").val(), "oldPassword":$("#oldPassword").val() }], function(code, j){switch(code) {
		case "200":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
			break;

		case "500":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.error+'</p>');
			break;
		}});
		$('#oldPassword, #newPassword').val('');
	});

	$('#valid_recup_password').click(function() {
		JNTP.execute(["changePassword", {"email":$("#email_recup_password").val() }], function(code, j){switch(code) {
		case "200":
			$( "#info_recup_password" ).html('<p>'+j.body+'</p>');
			break;

		case "500":
			$( "#info_recup_password" ).html('<p>'+j.body+'</p>');
			break;
		}});
	});

	$('#styleName').change(function() {
		Nemo.changeTheme($(this).val());
	});

	$('#blacklist').change(function() {
		localStorage.blacklist = $('#blacklist').val().replace(/\n+/g,"\n").replace(/^\n+/g,"");
		JNTP.blacklist = localStorage.blacklist.split("\n");
		Nemo.refreshFil();
	});

	$("#console").keypress(function(e) {
		if(e.keyCode==13) {
			var cmd = $('#console').val();
			JNTP.execute(cmd);
			Nemo.listCmd.push(cmd);
			Nemo.cursorCmd = Nemo.listCmd.length;
			$('#console').val('');
		}
	});

	$("#confirm_send_article").on('change', function(){
		value = $(this).is(':checked') ? 1 : 0;
		JNTP.storeVar("confirmSendArticle", value);
	});

	$("#active_popup").on('change', function(){
		value = $(this).is(':checked') ? 1 : 0;
		JNTP.storeVar("activePopup", value);
	});

	$("#total_article").on('change', function(){
		JNTP.storeVar("totalArticle", $(this).val());
		$('output').text(JNTP.totalArticle);
	});

	$("#signature").on('change', function(){
		JNTP.storeVar("signature", $('#signature').val());
	});

	$("#fromname").on('change', function(){
		
		JNTP.execute(["set", {"FromName":$('#fromname').val()}], function(code, j){switch(code) {
		case "200":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
			JNTP.FromName = $('#fromname').val();
			break;

		case "500":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.error+'</p>');
			break;
		}});
	});

	$("#frommail").on('change', function(){
		JNTP.execute(["set", {"FromMail":$('#frommail').val()}], function(code, j){switch(code) {
		case "200":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
			JNTP.FromMail = $('#frommail').val();
			break;

		case "500":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.error+'</p>');
			break;
		}});
	});

	$("#replyto").on('change', function(){
		JNTP.execute(["set", {"ReplyTo":$('#replyto').val()}], function(code, j){switch(code) {
		case "200":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
			JNTP.ReplyTo = $('#replyto').val();
			break;

		case "500":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.error+'</p>');
			break;
		}});
	});

	$("#host_jntp").on('change', function(){
		JNTP.url = $('#host_jntp').val(),
		JNTP.uri = JNTP.url + '/jntp/';
	});

	$("#req_client").on('change', function(){
		JNTP.logClient = $('#req_client').is(':checked');
	});

	$("#req_serveur").on('change', function(){
		JNTP.logServeur = $('#req_serveur').is(':checked');
	});

	$('.faq_nemo').click(function(){
		$("#faq").dialog({height:700, width:550, position:"right top"}).load("faq.html").scrollTop;
	});

	$('#accueil_nemo').off("click").click(function(){
		$('#accueil').show();
		$('#panneau_principal, #accueil_nemo').hide();
	});


	$('#voir_hierarchies').click(function(){
		Nemo.displayNewsgroupsCategory();
		$('#liste_hierarchies').dialog({
			height: 380, 
			width:300,
			title: 'Liste des hiérarchies',
	 		position: { my: "right top", at: "center top", of: window },
			close: function(ev, ui) { }
		});
	});

	$(document).bind('keydown', function(e) {
		if(e.which == 38 && Nemo.isCtrlPress) {
			if(jid = $('#fil [data-jid="'+JNTP.Article.Jid+'"]').prev().attr('data-jid')) {
				Nemo.getArticle({"Jid":jid,"read":1, "surligne":true});
			}
			return false;
		}

		else if(e.which == 40 && Nemo.isCtrlPress) {
			if(jid = $('#fil [data-jid="'+JNTP.Article.Jid+'"]').next().attr('data-jid')) {
				Nemo.getArticle({"Jid":jid,"read":1,"surligne":true});
			}
			return false;
		}
		if(e.which == 38 && $('#console').is(":focus")) {
			Nemo.cursorCmd = (Nemo.cursorCmd > 0) ? --Nemo.cursorCmd : 0;
			$('#console').val(Nemo.listCmd[Nemo.cursorCmd]);
		}
		if(e.which == 40 && $('#console').is(":focus")) {
			Nemo.cursorCmd = (Nemo.cursorCmd < Nemo.listCmd.length-1) ? ++Nemo.cursorCmd : Nemo.listCmd.length-1;
			$('#console').val(Nemo.listCmd[Nemo.cursorCmd]);
		}
	});


	$(document).bind('keyup', function(e){
		var upOrDown = (e.which == 38 || e.which == 40);
		if(!upOrDown) {
			Nemo.isShiftPress = false;
			Nemo.isCtrlPress = false;
		}
	} );

	$(document).bind('keydown', function(e){
		Nemo.isShiftPress = e.shiftKey;
		Nemo.isCtrlPress = e.ctrlKey;
	} );

	$('.limit_size_file').html(Math.round(JNTP.maxFileSize/1024) + ' ko');
	$('#host_jntp').val(JNTP.url);

	if(Newsgroup = Nemo.HTTPGet('Newsgroup')) {
		JNTP.filter["Dat.Newsgroups"] = Newsgroup;
		JNTP.getFil({
			"listenNext":1, 
			"callback": function(res) {
				if(res.firstID) Nemo.getArticle({"ID":res.firstID,"read":0,"surligne":true});
			}
		});
	}

	if(ThreadID = Nemo.HTTPGet('ThreadID')) {
		Nemo.selectOrder("InjectionDate", "desc", 2);
		JNTP.filter["Data.ThreadID"] = ThreadID;
		JNTP.getFil({"listenNext":1});
		if(ID = Nemo.HTTPGet('ID')) {
			Nemo.getArticle({"ID":ID, "read":1, "surligne":true});
		}
		if(Jid = HTTPGet('Jid')) {
			Nemo.getArticle({"Jid":Jid, "read":1, "surligne":true});
		}
	}else if(Jid = Nemo.HTTPGet('Jid')) {
		Nemo.getArticle({"Jid":Jid, "read":1, "surligne":true, "callback": function() {
			JNTP.filter["Data.Newsgroups"] = JNTP.Article.Data.Newsgroups[0];
			JNTP.getFil({"listenNext":1});
		}});
	}

	if(faq = Nemo.HTTPGet('faq')) {
		$(".reponse").hide();
		$(".img-swap").removeClass("moins").addClass("plus");
		$("#faq").dialog({height:750, width:760, position:"center top" }).load( "faq.html", function() {  
			if(faq = HTTPGet('faq')) {
				$(".reponse[data-faq="+faq+"]").toggle(500); 
			}
		}).scrollTop(0);
	}

	Nemo.loadMenuSkin();
	Nemo.displayFavoris();
}

}


$(document).ready(function() {

 	$.ajaxSetup({
		cache: true, 
    	});

	Nemo.plugins.balise.code = {
		load: function(params) {
			var div = 'code' + Math.floor(Math.random()*1e10);
			$.getScript(JNTP.url+"/plugins/code/run_prettify.js").done(function(script, textStatus) {
				var reg = '(\\[code\\])([\\s\\S]*?)(\\[\\/code\\])';
				var reg = new RegExp(reg, 'g');
				$('#'+params.div).html( $('#'+params.div).html().replace(reg,'<div id="'+div+'" class="code"><code class="prettyprint linenums">$2</code></div>') );
				$(".popin").colorbox({photo:true, maxWidth:"95%", maxHeight:"95%"});
			})
		}
	};

	Nemo.plugins.balise.tex = {
		load: function(params) {
			$.getScript("http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_HTML.js").done(function(script, textStatus) {
				MathJax.Hub.Config({tex2jax: {inlineMath: [['[tex]','[/tex]']], displayMath: []}});
				MathJax.Hub.Queue(["Typeset",MathJax.Hub, params.div]);
			})
		}
	};

	Nemo.plugins.balise.abc = {
		load: function(params) {
			var reg = '(\\[abc\\])([\\s\\S]*?)(\\[\\/abc\\])';
			reg = new RegExp(reg, 'g');
			var abcdiv = 'abc' + Math.floor(Math.random()*1e10);
			var abccode = 'abccode' + Math.floor(Math.random()*1e10);
			$('#'+params.div).html( $('#'+params.div).html().replace(reg,'<span id="'+abccode+'" style="display:none">$2</span><center><div id="'+abcdiv+'"></div></center>') );
			$.getScript("plugins/abc/abcjs_basic_1.7-min.js").done(function(script, textStatus) {
				ABCJS.renderAbc(abcdiv, $('#'+abccode).html());
				$('#'+params.div).html( $('#'+params.div).html() );
				$(".popin").colorbox({photo:true, maxWidth:"95%", maxHeight:"95%"});
			})
		}
	};

	Nemo.plugins.balise.map = {
		load: function(params) {
			$.getScript("http://maps.google.com/maps/api/js?sensor=true&callback=initialize").done(function(script, textStatus) {
				initialize = function() {
					var mapdiv = 'gmap' + Math.floor(Math.random()*1e10);
					var reg = '(\\[map\\])([0-9,.\\s]*?)(\\[\\/map\\])';
					reg = new RegExp(reg, 'g');
					var res = reg.exec($('#'+params.div).html());
					var coord = res[2].split(',');
					$('#'+params.div).html( $('#'+params.div).html().replace(reg,'<div style="width:600px; height:600px;"><div id="'+mapdiv+'" style="width:100%; height:100%;"></div></div>') );
					$(".popin").colorbox({photo:true, maxWidth:"95%", maxHeight:"95%"});
					new google.maps.Map(document.getElementById(mapdiv), {
						zoom: 8, 
						center: new google.maps.LatLng(coord[0], coord[1]),
						mapTypeId: google.maps.MapTypeId.ROADMAP
					});
				}
			})
		}
	};

	Nemo.plugins.balise.twitter = {
		load: function(params) {
			var reg = '(\\[twitter\\])([\\s\\S]*?)(\\[\\/twitter\\])';
			reg = new RegExp(reg, 'g');
			$('#'+params.div).html( $('#'+params.div).html().replace(reg,'<center><blockquote class="twitter-tweet"><a href="https://twitter.com/twitterapi/status/$2"></a></blockquote></center>') );
			$(".popin").colorbox({photo:true, maxWidth:"95%", maxHeight:"95%"});
			$.getScript("//platform.twitter.com/widgets.js").done(function(script, textStatus) {
			})
		}
	};

	Nemo.plugins.module.painting = {
		load: function(params) {
			$.getScript(JNTP.url+"/plugins/painting/painting.js").done(function(script, textStatus) {
				painting();
			})
		}
	};

	Nemo.plugins.balise.plot = {
		load: function(params) {

			var reg = /\[plot\]([\s\S]*?)\[\/plot\]/g;
			var plots = [];
			var content = $('#'+params.div).html().replace(reg, function(s, expr){
				var div = 'plot' + Math.floor(Math.random()*1e10);
				plots.push([expr, div]);
				return '<div id="'+div+'" class="jxgbox" style="width:600px; height:400px;"></div>';
			});
			$('#'+params.div).html(content);
			$(".popin").colorbox({photo:true, maxWidth:"95%", maxHeight:"95%"});

			$.getScript("plugins/plot/jsxgraphcore.js").done(function() {
				var plot = function(myfunction, div) {
					var board = JXG.JSXGraph.initBoard(div, {boundingbox:[-5,8,8,-5], axis:true});
					var f, curve; // global objects

					f = board.jc.snippet(myfunction, true, 'x', true);
					curve = board.create('functiongraph',[f,
						function(){
							var c = new JXG.Coords(JXG.COORDS_BY_SCREEN,[0,0],board);
							return c.usrCoords[1];
						},
						function(){ 
							var c = new JXG.Coords(JXG.COORDS_BY_SCREEN,[board.canvasWidth,0],board);
							return c.usrCoords[1];
						}
					],{name:myfunction, withLabel:true});
					var q = board.create('glider', [2, 1, curve], {withLabel:false});
					var t = board.create('text', [
						function(){ return q.X()+0.1; },
						function(){ return q.Y()+0.1; },
					], 
					{fontSize:15});
				}
				for(i in plots) {
					plot(plots[i][0], plots[i][1]);
				}
			})
		}
	};

	if(window.location.host.length == 0) {
		JNTP.url = 'http://devnews.nemoweb.net';
	}else{
		if ($('#host_jntp').val().length == 0) {
			JNTP.url = 'http://'+window.location.host;
		}
	}

	JNTP.init({
		log: false,
		bodyInputID: "formulaire_body",
		outputLog: "log",
		signature: 'Ce message a été posté avec Nemo : <#Uri#>',
		refreshFunction: Nemo.refreshFil
	});

	if(skin = Nemo.HTTPGet('skin')) {
		Nemo.changeTheme(skin);
	}

	if( !Nemo.HTTPGet('post')) {
		Nemo.initInterface();
		Nemo.startConnexion();
	}

	// Stop scrolling
	$('#'+JNTP.bodyInputID+', #'+JNTP.bodyInputID+'_html, #scrollFil, #newsgroups').on('DOMMouseScroll mousewheel', function(ev) {
	    var $this = $(this),
		scrollTop = this.scrollTop,
		scrollHeight = this.scrollHeight,
		height = $this.height(),
		delta = (ev.type == 'DOMMouseScroll' ?
		    ev.originalEvent.detail * -40 :
		    ev.originalEvent.wheelDelta),
		up = delta > 0;

	    var prevent = function() {
		ev.stopPropagation();
		ev.preventDefault();
		ev.returnValue = false;
		return false;
	    }

	    if (!up && -delta > scrollHeight - height - scrollTop) {
		// Scrolling down, but this will take us past the bottom.
		$this.scrollTop(scrollHeight);
		return prevent();
	    } else if (up && delta > scrollTop) {
		// Scrolling up, but this will take us past the top.
		$this.scrollTop(0);
		return prevent();
	    }
	});
})
