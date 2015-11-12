Interface = {

inPopup: false,
bodyInputID: "formulaire_body",
articleToRead: new Nemo.Article(),
articleToWrite: new Nemo.Article(),
articleToDelete: new Nemo.Article(),
modeEdit: 'text',
currentSkin: "classic",
isCtrlPress: false,
isShiftPress: false,
viewReferences: false,
listCmd: [],
cursorCmd: 0,
windowLoaded: false,


/* Déclarations des thèmes */
listeSkin: {
	"classic" : ["Classique",1],
	"amazonie" : ["Amazonie",1],
	"gothique": ["Gothique",1],
	"tahiti" : ["Tahiti",1],
	"abricot" : ["Abricot",1]
},

Char: {
	reserved: {'[':'[',']':']','#':'#'},
	math: ['±','×','⁄','÷','≠','≡','≤','≥','²','³','√','⟦','⟧','⟨','⟩','⟪','⟫','∛','∜','∞','¼','½','¾','⅕','⅙','⅛','∀','∂','∃','∈','∉','∋','∏','∧','∨','∩','∪','∫','⊂','⊃','ℜ'],
	money: ['€','$','₤','¥','₽'],
	grec: ['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','π','ρ','ς','σ','τ','υ','φ','χ','ψ','ω',' ','Γ','Δ','Θ','Λ','Ξ','Π','Ρ','Σ','Φ','Ψ','Ω'],
	ponctuation: [' ','« ',' »','“','”','À','Ç','É','È','Ê','Ë','Î','Ï','Ô','Ù','Û','ÿ','Ÿ','æ','Æ','œ','Œ','¶','©','®','™'],
	smiley: ['😃','😇','😉','😁','😎','😞']
},

bodyTransform: function(option, body) {
	if(option == 'toTxt') {
		body = body.replace(/<div data-cite="0"><br data-newline="0"><\/div>/g,"\n");
		body = body.replace(/<br data-newline="0">/g,"\n");
		body = body.replace(/&nbsp;|<div>/g,"");
		body = body.replace(/(<\/div>|<\/span>)/g,"\n");
		body = body.replace(/<b>/g,"[b]").replace(/<i>/g,"[i]").replace(/<u>/g,"[u]").replace(/<strike>/g,"[s]");
		body = body.replace(/<\/b>/g,"[/b]").replace(/<\/i>/g,"[/i]").replace(/<\/u>/g,"[/u]").replace(/<\/strike>/g,"[/s]");
		var reg = /<(span|div|br).*?data-cite="([0-9]+)".*?>/g;
		body = body.replace(reg, function(m, p1, p2){ cite = ''; for(i=0;i<p2;i++) {cite += '>'} return (cite=='')?cite:cite+' ';});
		body = body.replace(/(<\/?.*?>)/g,"");
		body = body.replace( /&gt;/g,'>').replace( /&lt;/g,'<');

	}else if(option == 'toHTML') {
		body = new Nemo.Article().set({"Body": body}).renduQuote().renduFont().value.Body;
	}
	return body;
},

enterNewlineOrTab: function(e) {
	if(e.which == 13) {
		if(typeof $(window.getSelection().anchorNode.parentNode).attr('data-line') != 'undefined') {
			document.execCommand('insertHTML',false,' ');
			document.execCommand('delete');
			document.execCommand('insertHTML',false,'<div data-cite="0"><br data-newline="0"></div>');
			return false;
		}
	}
	else if(e.which == 9) {
		document.execCommand('insertHTML',false,"\t");
		return false;
	}
},

getBody: function() {
	if(Interface.modeEdit == 'html') {
		return Interface.bodyTransform('toTxt', $('#formulaire_body_html').html() );
	}else{
		return $('#'+Interface.bodyInputID).val();
	}
},

setBody: function(body) {
	if(Interface.modeEdit == 'html') {
		$('#formulaire_body_html').html( Interface.bodyTransform('toHTML', body) );
	}else{
		$('#'+Interface.bodyInputID).val(body);
	}
},

selectModeEdition: function(mode) {
	Interface.modeEdit = mode;
	if(Interface.modeEdit == 'html') {
		$('#'+Interface.bodyInputID).hide();
		$('#formulaire_body_html').show();
		$('#mode_html').addClass('activated');
		Interface.setBody( $('#'+Interface.bodyInputID).val() );
	}else{
		$('#'+Interface.bodyInputID).show();
		$('#formulaire_body_html').hide();
		$('#mode_html').removeClass('activated');
		Interface.setBody( Interface.bodyTransform('toTxt', $('#formulaire_body_html').html() ) );
	}
},

getTextAtSelection: function() {
	if(Interface.modeEdit == 'text') {
		var posStart = document.getElementById(Interface.bodyInputID).selectionStart;
		var posEnd = document.getElementById(Interface.bodyInputID).selectionEnd;		
		var inBalise = Interface.getBody().substring(posStart, posEnd);
	}else{
		var inBalise = window.getSelection().getRangeAt(0).cloneContents().textContent;
	}
	return inBalise;
},

insertBaliseAtSelection: function(balise, inBalise) {
	if(typeof inBalise == "undefined") inBalise = '';
	var firstBalise = (balise != '') ? ('['+balise+']') : '';
	var endBalise = (balise != '') ? ('[/'+balise.split(/[ =]+/)[0]+']') : '';

	if(Interface.modeEdit == 'text') {
		var posStart = document.getElementById(Interface.bodyInputID).selectionStart;
		var posEnd = document.getElementById(Interface.bodyInputID).selectionEnd;		
		var body = Interface.getBody().substring(0, posStart) + firstBalise + inBalise + endBalise + Interface.getBody().substring(posEnd);
		var decalCursor = posEnd + firstBalise.length + inBalise.length + endBalise.length;

		Interface.setBody( body );
		document.getElementById(Interface.bodyInputID).selectionEnd = decalCursor;
		document.getElementById(Interface.bodyInputID).selectionStart = decalCursor;
		$('#'+Interface.bodyInputID).focus();
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
			document.execCommand('insertText','', firstBalise + inBalise + endBalise);
		}
	}
},

draft: function(obj) {
	if(arguments.length == 0) {
		return JSON.parse( localStorage.draft );
	}else{
		localStorage.draft = JSON.stringify(obj);
	}
},

// options = ID,DataID,read,source,surligne,callback;
callbackGetArticle: function(options, code, j){
	switch(code) {
	case "200":
		if(j.body.length == 0) {
			$("#dialog-alert").dialog({ modal: true, buttons:{} }).html('<p>Article non trouvé</p>');
			$('#chargement').hide();
			return;
		}

		if(typeof options.surligne != "undefined") {
			Interface.surligneArticle(options.surligne);
		}

		if(options.read) {
			$('#fil [data-DataID="'+Interface.articleToRead.value.DataID+'"]').addClass("lu");
		}

		if(options.source) {
			$('#article_source, #hide_source').show();
			$('#view_source').hide();
		}

		$('#references, #article_fu2, #article_newsgroup, #article_date, #article_subject, #article_from, #article_size, #article_body').html('');
		$('#article_deleted, #article_updated, #references, #voir_references, #hide_source, #article_header_fu2, #article_source, #supprimer_article, #modifier_article, #revoir_citations, #delete_citations, #voir_supersede, #champ_article_replyto, #chargement').hide();
		if(!j.body.length) { $('#article_body').html("Cet article n'existe pas ou a été supprimé"); break; }
		$('#article_header, #view_source').show();

		var reg = new RegExp("(> ?>.*\n)", "g");

		if(reg.test(Interface.articleToRead.value.Body)) {
			 $('#delete_citations').show();
		}

		$('#article_certification').attr('class', '');


		if( Interface.articleToRead.isProtected ) {
			$('#article_certification').attr('class', 'is_protected');
			$('#article_certification').attr('data-info', 'Article publié par '+Interface.articleToRead.value.UserID);
			if(Interface.articleToRead.owner) {
				$('#supprimer_article, #modifier_article').show();
			}
		}

		if( !Interface.articleToRead.isJNTPValid ) {
			$('#article_certification').attr('class', 'not_jntp');
		}

		var str = JSON.stringify(j.body[0], undefined, 4);
		$('#article_size').html('('+str.length+' octets)');

		if (Interface.articleToRead.value.Supersedes){
				$('#voir_supersede').show();
		}

		$('#article_source').html(Nemo.Tools.syntaxHighlight(str));
		$('#article_from').html(Nemo.Tools.HTMLEncode(Interface.articleToRead.value.FromName + " <" + Interface.articleToRead.value.FromMail + "> "));
		$('#article_subject').html(Nemo.Tools.HTMLEncode(Interface.articleToRead.value.Subject));
		var date_article = Nemo.Tools.date2String(Interface.articleToRead.value.InjectionDate);
		$('#article_date').html(date_article.day + ' à ' + date_article.time);

		for(i in Interface.articleToRead.value.Newsgroups){
			$('#article_newsgroup').append('<span class="newsgroup" data-name="'+Nemo.Tools.HTMLEncode(Interface.articleToRead.value.Newsgroups[i])+'">'+Nemo.Tools.HTMLEncode(Interface.articleToRead.value.Newsgroups[i])+'</span>');
		}

		if( typeof Interface.articleToRead.value.References != "undefined" && Interface.articleToRead.value.References.length ){

			if(Interface.viewReferences){
				$('#references').show();
			}

			for(i in Interface.articleToRead.value.References){
				$("#references").append('<div><span data-DataID="'+Nemo.Tools.HTMLEncode(Interface.articleToRead.value.References[i])+'" class="reference">'+Nemo.Tools.HTMLEncode(Interface.articleToRead.value.References[i])+'</span></div>');
			}
			$('#voir_references').show();

			$('.reference').off("click").click(function() {
				dataid = $(this).attr('data-DataID');
				Interface.articleToRead.get({"DataID":dataid, "read":1, "surligne":true, "graphicRefresh":Interface.callbackGetArticle});
			});
		}

		if(typeof Interface.articleToRead.value.ReplyTo != "undefined"){
			$('#champ_article_replyto').show();
			$('#article_replyto').html('<a class="champ_value replyto" href="mailto:'+Interface.articleToRead.value.ReplyTo+'">'+Interface.articleToRead.value.ReplyTo+'</a>');
		}

		if(typeof Interface.articleToRead.value.FollowupTo != "undefined" && Interface.articleToRead.value.FollowupTo.length){
			$('#article_header_fu2').show();
			for(i in Interface.articleToRead.value.FollowupTo){
				$('#article_fu2').append('<span class="newsgroup" data-name="'+Nemo.Tools.HTMLEncode(Interface.articleToRead.value.FollowupTo[i])+'">'+Nemo.Tools.HTMLEncode(Interface.articleToRead.value.FollowupTo[i])+'</span>');
			}
		}

		Interface.articleToRead.setTemplateVar().renduHTML( 'article_body' );

		if(Interface.articleToRead.value.DataType == 'ListGroup') {
			$("#article_body").html( $("#article_body").html() + "<br>" + Nemo.Tools.HTMLEncode(JSON.stringify(Interface.articleToRead.value.ListGroup, undefined, 4)) );
		}
		var nbLike = (typeof j.body[0].Meta.Like == "undefined") ? 0 : j.body[0].Meta.Like;
		$('#compteur_like').html(nbLike);
		Interface.reloadEvent();
	break;

	case "500":
		$('#chargement').hide();
	break;

	default:
		$('#chargement').show();
	break;
	}
},

selectOrder: function(field, order, tree) {

	if(typeof tree != "undefined") {
		Nemo.Thread.tri.tree = tree;
	}
	if(field) {
		Nemo.Thread.tri.field = field;
	}
	if(order) { 
		if(order == "changeOrder") {
			Nemo.Thread.tri.order = (Nemo.Thread.tri.order == "asc") ? "desc" : "asc";
		}else{
			Nemo.Thread.tri.order = order;
		}
	}

	if(Nemo.Thread.tri.tree > 0) {
		$('#tree').removeClass('liste').addClass('arbo');
	}else{
		$('#tree').removeClass('arbo').addClass('liste');
	}
	$("#eye").attr('class', Nemo.Thread.viewlu);
	$("#Subject, #FromName, #InjectionDate").removeClass('asc desc').addClass("none");
	$("#"+Nemo.Thread.tri.field).addClass(Nemo.Thread.tri.order);
	$("#"+field).addClass(order);
},

surligneArticle: function(scroll) {
	$('#fil tr').removeClass("selected");
	$('#fil [data-DataID="'+Interface.articleToRead.value.DataID+'"]').addClass("selected");
	if(scroll && $('#fil [data-DataID="'+Interface.articleToRead.value.DataID+'"]').length ) {
		$('#scrollFil').animate({scrollTop: $('#fil [data-DataID="'+Interface.articleToRead.value.DataID+'"]').position().top + $('#scrollFil').scrollTop() - 200}, 'fast');
	}
},

alterLineColor: function(){
	$("#fil tr").removeClass("color");
	$("#fil tr.visible").each(function(i) {
		if(i%2) { $(this).addClass("color"); }
	})
},

displayMediaInfos: function() {
	obj = Nemo.Media.info();
	div = '';
	for(i in obj){
		 div = div + '<div class="file"><span class="delete_media" data-index="'+obj[i].index+'">&nbsp;</span>jntp:#DataID#/Data.Media:'  + obj[i].index + ' (' + obj[i].format + ') '+(obj[i].size/1000).toFixed(1)+' ko</div>';
	}
	$("#medias_info").html( div );

	$('.delete_media').off("click").click(function(){
		index = parseFloat( $(this).attr('data-index') );
		obj = Nemo.Media.info();
		for(i=index; i<=obj.length ; i++) {
			if(i == index) {
				Interface.setBody( Interface.getBody().replace('jntp:#DataID#/Data.Media:'+index,'') );
			}else{
				Interface.setBody( Interface.getBody().replace('jntp:#DataID#/Data.Media:'+(i).toString(), 'jntp:#DataID#/Data.Media:'+(i-1).toString()  ) );
			}
		}
		Nemo.Media.del( index );
		Interface.displayMediaInfos();
	});
},

displayThread: function(params){
	$('#fil').html('');
	var groupName = Nemo.Thread.filter["Data.Newsgroups"];
	if(groupName) {
		$('.actif').removeClass("actif");
		$('.newsgroup[data-name="'+groupName+'"]').addClass("actif");
	}
	$('#accueil').hide();
	$('#panneau_principal, #accueil_nemo').show();

	if(Nemo.Thread.value.length == 0) {
		$('#fil_info').show();
		var groupName = (typeof Nemo.Thread.filter["Data.Newsgroups"] != "undefined") ? Nemo.Thread.filter["Data.Newsgroups"]+ ' : ' : '';
		$('#fil_info').html(groupName  + "Pas d'articles");
		$('#fil').html('');
		return;
	}
	
	Interface.selectOrder();
	var liste = Nemo.Thread.sort();
	$('#fil_info').hide();

	var line = 0;
	for(var ind in liste) {

		var date_article = Nemo.Tools.date2String(liste[ind].Data.InjectionDate);
		var lu = '';
		var x = this.getState(liste[ind].Data.DataID);
		if( x%10 == 1) lu = ' lu';
		if(Math.floor(x/10) == 1 ) lu += ' favori';


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
		if(liste[ind].level && Nemo.Thread.tri.tree) {
			for(i=1; i<liste[ind].level; i++) { decal += '<span style="margin-left:15px;"></span>'; }
			circuit = (liste[ind].circuit) ? ' circuit' : '';
			level = liste[ind].level;
		}
		if( !Nemo.Blacklist.isInList(liste[ind].Data.FromName + ',' + liste[ind].Data.FromMail) ) {
			ligne = '<tr class="visible'+position+lu+circuit+'" data-line="'+ line++ +'" data-DataID="'+Nemo.Tools.HTMLEncode(liste[ind].Data.DataID)+'" data-level="'+level+'">';
			ligne += '<td class="tree"></td>';
			ligne += '<td class="Subject">' + decal + Nemo.Tools.HTMLEncode(liste[ind].Data.Subject) + '&nbsp;</td>';
			ligne += '<td class="FromName">' + Nemo.Tools.HTMLEncode(fromName) + '&nbsp;</td>';
			ligne += '<td class="day">' + date_article.day + '</td>';
			ligne += '<td class="time">'+ date_article.time + '</td>';
			ligne += '<td class="taille">' + Math.ceil(size/1000) + ' ko</td>';
			ligne += '<td class="attach '+attach+'"></td>'
			ligne += '</tr>';
			$('#fil').prepend(ligne);
		}
	}

	if(Nemo.Thread.tri.tree == 1) {
		// On cache les enfants
		$('#fil .child').removeClass('visible').addClass('invisible');

		// Toutes les flèches à droite
		$('#fil .parent .tree').removeClass('down').addClass('right');

		// On part de l'article et on remonte
		dataid = Interface.articleToRead.value.DataID;
		level = $('#fil [data-DataID="'+dataid+'"]').attr('data-level');
		while(level >= 1) {
			// On affiche l'article
			$('#fil [data-DataID="'+dataid+'"]').removeClass('invisible').addClass('visible');
			if(typeof dataid == "undefined" || level == 1) {
				// On met une flèche en bas pour le parent
				$('#fil [data-DataID="'+dataid+'"] .tree').removeClass('right').addClass('down');
				break;
			}
			// On remonte d'un article
			dataid = $('#fil [data-DataID="'+dataid+'"]').prev("tr").attr('data-DataID');
			level = $('#fil [data-DataID="'+dataid+'"]').attr('data-level');
		}

		// On part de l'article et on redescend
		dataid = Interface.articleToRead.value.DataID;

		while( 1==1) {
			// On redescend d'un article
			dataid = $('#fil [data-DataID="'+dataid+'"]').next("tr").attr('data-DataID');
			level = $('#fil [data-DataID="'+dataid+'"]').attr('data-level');
		
			if(typeof dataid == "undefined" || level == 1) {
				break;
			}else{
				// On affiche l'article
				$('#fil [data-DataID="'+dataid+'"]').removeClass('invisible').addClass('visible');
			}
		}
	}else{
		if (Nemo.Thread.viewlu == 'lu') {
			$('#fil tr.lu').removeClass('invisible').addClass('visible');
		}else if (Nemo.Thread.viewlu == 'nonlu') {
			$('#fil tr:not(.lu)').removeClass('invisible').addClass('visible');
		}else if (Nemo.Thread.viewlu == 'all') {
			$('#fil tr').removeClass('invisible').addClass('visible');
		}
	}

	if (Nemo.Thread.viewlu == 'lu') {
		$('#fil tr:not(.lu,.selected)').removeClass('visible').addClass('invisible');
	}else if (Nemo.Thread.viewlu == 'nonlu') {
		$('#fil tr.lu:not(.selected)').removeClass('visible').addClass('invisible');
	}

	Interface.alterLineColor();
	Interface.reloadEvent();
	Interface.surligneArticle(true);
},

logData: function(msg, classCss) {
	msg = (typeof(msg) == "object") ? Nemo.Tools.syntaxHighlight(JSON.stringify(msg, undefined, 4)) : msg;
	msg = msg.replace(/[\n]/gi, "<br>" );
	$('#log').append('<div class="'+classCss+'">'+msg+'</div>');
	var objDiv = document.getElementById('log');
	objDiv.scrollTop = objDiv.scrollHeight;
},

displayFavoris: function() {
	$('#favoris').empty();
	try{
		for(var groupName in Nemo.get('favoris')) {
			var rwm = Nemo.get('favoris')[groupName];
			$('#favoris').append('<div class="blocNewsgroup"><div class="icon_favori" data-name="'+groupName+'" data-rwm="'+rwm+'"></div><div class="tri_favoris newsgroup '+rwm+'" data-name="'+groupName+'" data-rwm="'+rwm+'">'+groupName+'</div></div>');
		}
	} catch(e){ console.log(e)}
	Interface.reloadEvent();
},

loadMenuSkin: function() {
	for(var key in Interface.listeSkin) {
		var actif = (Interface.listeSkin[key][1] == 1) ? '' : 'disabled';
		$('#styleName').append('<option value="'+key+'" '+actif+'>'+Interface.listeSkin[key][0]+'</option>');
	}
},

changeSkin: function(skin) {
	if(Interface.listeSkin[skin][1] == 1) {
		$('link[data-theme=general]').attr('href','skins/'+skin+'/style.css');
		$('#styleName option[value="'+skin+'"]').prop('selected', true);
		Interface.currentSkin = skin;
	}
},

startConnexion: function() {
	this.inPopup = false;
	$('#nemo_version').html(Nemo.UserAgent);
	$("#chargement").show();
	$('#jntp_server').html('Tentative de connexion à jntp://' + JNTP.url.replace('http://',''));

	JNTP.execute(["whoami"], function(code, j){switch(code) {
	case "200":
		$('#jntp_server').html('Connecté à jntp://' + JNTP.url.replace('http://',''));

		$("#authentification").hide();
		$("#deconnexion, #historique").show();
		$('#deconnect').attr('data-info','Se déconnecter du compte ' + j.body.email);
		$('#identity').html(j.body.FromName);
		$('#email').val(j.body.email);
		if(j.body.privilege == 'admin' || j.body.privilege == 'moderator') {
			$("#ban_article").show();
		}
		$('#box_inscription').html('<strong>Vous êtes actuellement connectés sous votre identifiant ' + j.body.email+'</strong>');
		$("#chargement").hide();
	break;
	case "500":
		$('#jntp_server').html('Connecté à jntp://' + JNTP.url.replace('http://',''));
		$("#chargement").hide();
	break;
	}});
},

authentification: function() {
	JNTP.execute(["auth", { "user":$('#user').val(), "password":$('#password').val() }], function(code, j){switch(code) {
	case "200":
		$("#password, #user").val('');
		$("#authentification").hide();
		$("#historique, #deconnexion").show();
		$('#message_accueil').html('Bienvenue ' + j.body.email);
		$('#identity').html(j.body.FromName);
		$('#email').val(j.body.email);
		if(typeof Interface.articleToRead.value.DataID != "undefined" ) {
			Interface.articleToRead.get({"DataID":Interface.articleToRead.value.DataID, "graphicRefresh":Interface.callbackGetArticle});
		}

		if(j.body.privilege == 'admin' || j.body.privilege == 'moderator') {
			$("#ban_article").show();
		}
		$('#box_inscription').html('<strong>Bienvenue sur Nemo, vous êtes actuellement connectés avec ' + j.body.email+'</strong>');
		$('#deconnect').attr('data-info','Se déconnecter du compte ' + j.body.email);

		$('#formulaire_from').val(JNTP.Storage.FromName);
		$('#formulaire_email').val(JNTP.Storage.FromMail);
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

deconnexion: function(){
	JNTP.execute(["quit"], function(code, j){switch(code) {
	case "200":
		$("#authentification").show();
		$('#email').val('');
		$("#deconnexion, #historique, #ban_article").hide();
		if(typeof Interface.articleToRead.value.DataID  != "undefined" ) {
			Interface.articleToRead.get({"DataID":Interface.articleToRead.value.DataID, "graphicRefresh":Interface.callbackGetArticle});
		}
		$('#box_inscription').html('<strong>Au revoir</strong>');
	break;

	case "500":
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

displayNewsgroupsCategory: function() {
	JNTP.execute(["getNewsgroup", {"category":true}], function(code, j){switch(code) {
		case "200":
		$('#newsgroupsL1').empty();
		var cat = [];
		// set categories
		for(var i=0; i< j.body.length;i++) {
			if( $.inArray( j.body[i]['category'], cat ) == -1) {
				cat.push(j.body[i]['category']);
				if(i>0) $('#newsgroupsL1').append('<hr>');
				$('#newsgroupsL1').append('<div class="categorie_groups" data-name="'+j.body[i]['category']+'">'+j.body[i]['category']+'</div>');
			}
		}

		// set hierarchies
		for(var i=j.body.length-1; i>=0; i--) {
			$('#newsgroupsL1 [data-name="'+j.body[i]['category']+'"]').after('<div class="icon_favori" data-name="'+j.body[i]['name']+'" data-rwm="h"></div><div class="newsgroup h" data-name="'+j.body[i]['name']+'" data-rwm="h">'+j.body[i]['name']+'</div>');
		}

		Interface.setFavoriIcon();
		Interface.reloadEvent();
		break;
	}})
},

getNewsgroups: function(params){
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
			rwm = (j.body[ind].rules['m'] == 1) ? 'm' : rwm;
			var description = (typeof j.body[ind].description != "undefined") ? j.body[ind].description : '';
			$('#newsgroups').append('<div class="icon_favori" data-name="'+groupName+'" data-rwm="'+rwm+'"></div><div class="newsgroup '+rwm+'" data-name="'+groupName+'" data-info="'+description+'" data-rwm="'+rwm+'">'+groupName+'</div>');
		}

		Interface.reloadEvent();
		Interface.setFavoriIcon(params.name);

	break;
	}});
},

setFavoriIcon: function(groupName, rwm) {
	$('.icon_favori').removeClass('del_favori add_favori');
	$('.newsgroup[data-name="'+groupName+'"]').each(function() {
		if(typeof Nemo.get('favoris')[groupName] == 'undefined') {
			$('.icon_favori[data-name="'+groupName+'"]').removeClass('del_favori').addClass('add_favori');
		}else{
			$('.icon_favori[data-name="'+groupName+'"]').removeClass('add_favori').addClass('del_favori');
		}
	});

	$('.add_favori').off().click(function() {
		var groupName = $(this).attr('data-name');
		var rwm = $(this).attr('data-rwm');
		Nemo.Favoris.add(groupName, rwm);
		Interface.displayFavoris();
		$('.icon_favori').removeClass('del_favori add_favori');
	});
	
	$('.del_favori').off().click(function() {
		var groupName = $(this).attr('data-name');
		Nemo.Favoris.del(groupName);
		Interface.displayFavoris();
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
			Nemo.Favoris.store(favoris);
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
		Interface.setFavoriIcon(groupName, rwm);
		if(groupName.indexOf('.*') != -1) {
			Interface.getNewsgroups({"name":groupName,"level":1});
		}
		Nemo.Thread.filter = {"Data.Newsgroups":groupName};

		Nemo.Thread.get({
			"listenNext":1, 
			"callback": function(res) {
				if(res.firstID) Interface.articleToRead.get({"ID":res.firstID, "read":0, "surligne":true, "graphicRefresh":Interface.callbackGetArticle});
			}
		});
	});


	$('#fil tr').attr('oncontextmenu','return false').off("click").click(function(e) {
		var dataid = $(this).attr('data-DataID');
		if(Interface.isCtrlPress) {
			if($('#fil [data-DataID="'+dataid+'"]').hasClass("selected") ) {
				$('#fil [data-DataID="'+dataid+'"]').removeClass("selected");
			}else{
				$('#fil [data-DataID="'+dataid+'"]').addClass("selected");
			}
			return;
		}else if(Interface.isShiftPress) {
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
			Interface.articleToRead.get({"DataID":dataid,"read":1, "surligne":false, "graphicRefresh":Interface.callbackGetArticle});
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
		if(Nemo.Thread.getState(dataid)) {
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

			case "view_articles_author":
				for(var i in Nemo.Thread.value) {
					if(Nemo.Thread.value[i].Data.DataID == dataid ) {
						Nemo.Thread.filter = {};
						Nemo.Thread.filter["Data.FromName"] = [Nemo.Thread.value[i].Data.FromName, 'contain'];
						Nemo.Thread.filter["Data.FromMail"] = [Nemo.Thread.value[i].Data.FromMail, 'contain'];
						Nemo.Thread.get({
							"callback": function(res) {
								if(res.firstID) Interface.articleToRead.get({"ID":res.firstID, "read":0, "surligne":true, "graphicRefresh":Interface.callbackGetArticle});
							}
						});
						break;
					}
				}
				break;
			case "blacklist":
				for(var i in Nemo.Thread.value) {
					if(Nemo.Thread.value[i].Data.DataID == dataid ) {
						Nemo.Blacklist.set(Nemo.Thread.value[i].Data.FromName + ',' + Nemo.Thread.value[i].Data.FromMail);
						Interface.refreshBlackList();
						Nemo.Thread.display();
					}
				}
				break;
			case "openBlacklistConfig":
				Interface.openConfigWindow({"numPanel":3});
				break;
			case "open_window":
				winskin = (Interface.currentSkin != 'classic') ? '&skin='+Interface.currentSkin : '';
				window.open('/?DataID=' + dataid + winskin);
				break;
			case "mark_nonlu":
				$('#fil .selected').each(function() { 
					Nemo.Thread.setState($(this).attr('data-DataID'), 0);
					$('#fil [data-DataID="'+$(this).attr('data-DataID')+'"]').removeClass("lu");
				})
				break;
			case "mark_favori":
				$('#fil .selected').each(function() {
					Nemo.Thread.setState($(this).attr('data-DataID'), 10);
					$('#fil [data-DataID="'+$(this).attr('data-DataID')+'"]').addClass("favori");
				})
				break;	
			case "mark_lu":
				$('#fil .selected').each(function() {
					Nemo.Thread.setState($(this).attr('data-DataID'), 1);
					$('#fil [data-DataID="'+$(this).attr('data-DataID')+'"]').addClass("lu");
				})
				break;			
			case "mark_nonlu_tous":
				$('#fil tr').removeClass("lu");
				for(i in Nemo.Thread.value) {
					Nemo.Thread.setState(Nemo.Thread.value[i].Data.DataID, 0);
				}
				break;			
			case "mark_lu_tous":
				$('#fil tr').addClass("lu");
				for(i in Nemo.Thread.value) {
					Nemo.Thread.setState(Nemo.Thread.value[i].Data.DataID, 1);
				}
				break;
			case "mark_nonlu_branche":
				var branch = Nemo.Thread.tree(dataid);
				$(branch).each(function(i) {
					$('#fil [data-DataID="'+branch[i].Data.DataID+'"]').removeClass("lu");
					Nemo.Thread.setState(branch[i].Data.DataID, 0);
				})
				break;
			case "mark_lu_branche":
				var branch = Nemo.Thread.tree(dataid);
				$(branch).each(function(i) {
					$('#fil [data-DataID="'+branch[i].Data.DataID+'"]').addClass("lu");
					Nemo.Thread.setState(branch[i].Data.DataID, 1);
				})
				break;
			case "load_more":
				Nemo.Thread.get({"IDstop":Nemo.Thread.getMinID(), "notclean":true});
				break;
			case "viewThread":
				winskin = (Interface.currentSkin != 'classic') ? '&skin='+Interface.currentSkin : '';
				window.open('/?ThreadID=' + Interface.articleToRead.value.ThreadID + '&DataID=' + dataid + winskin);
				break;
			}
			$('#contextMenu').hide();
		});

	});
 
	$('#fil .parent .tree').off("click").click(function() {

		id = $(this).parent().attr('data-DataID');
		level = $(this).parent().attr('data-level');
		if ($(this).hasClass('right') ) {
			$(this).removeClass('right').addClass('down');
			do {
				id = $('#fil [data-DataID="'+id+'"]').next("tr").attr('data-DataID');
				level = $('#fil [data-DataID="'+id+'"]').next("tr").attr('data-level');
				$('#fil [data-DataID="'+id+'"]').removeClass('invisible').addClass('visible');
			} while (level > 1)
		}else{
			$(this).removeClass('down').addClass('right');
			do {
				id = $('#fil [data-DataID="'+id+'"]').next("tr").attr('data-DataID');
				level = $('#fil [data-DataID="'+id+'"]').next("tr").attr('data-level');
				$('#fil [data-DataID="'+id+'"]').removeClass('visible').addClass('invisible');
			} while (level > 1)
		}
		if (Nemo.Thread.viewlu == 'lu') {
			$('#fil tr:not(.lu)').removeClass('visible').addClass('invisible');
		}else if (Nemo.Thread.viewlu == 'nonlu') {
			$('#fil tr.lu').removeClass('visible').addClass('invisible');
		}
		Interface.alterLineColor();
		return false;

	});
},

closeRedactionWindow: function() {
	if (this.inPopup){
		window.close();
	}else{
		$("#send_form").dialog('close');
	}
},

refreshBlackList: function() {
	$('#blacklist').html('');
	for(i in Nemo.Storage.blacklist) {
		$('#blacklist').append('<li>'+Nemo.Storage.blacklist[i]+'</li>');
	}
	if( Nemo.Storage.blacklist.length == 0) {
		$('#blacklist').append('<i>Aucun utilisateur dans la liste noire</i>');
	}else{
		$('#blacklist').prepend("<i>Cliquez sur un auteur pour le retirer de la liste noire</i><p>");
	}

	$('#blacklist li').click(function() {
		Nemo.Blacklist.del( $(this).html() );
		Interface.refreshBlackList();
		Nemo.Thread.display();
	});
},

openConfigWindow: function( options, callback ) {
	$("#config_nemo").dialog({ 
		minHeight: 500, minWidth:750, close: function() {} 
	});
	$('.accordeon').accordion({
		active: (options && options.numPanel) ? options.numPanel : 0
	});

	$("#total_article").val(Nemo.get('totalArticle'));
	$('output').text(Nemo.get('totalArticle'));
	$('#secret_key').val(Nemo.get('secretKey'));
	$('#signature').val(Nemo.get('signature'));
	$('#fromname').val(JNTP.Storage.FromName);
	$('#frommail').val(JNTP.Storage.FromMail);
	$('#replyto').val(JNTP.Storage.ReplyTo);
	$('#use_hashkey').attr('checked', (Nemo.get('useHashKey') == 1) ? true : false);
	$('#signature_auto').attr('checked', (Nemo.get('signatureAuto') == 1) ? true : false);
	$("#confirm_send_article").attr('checked', (Nemo.get('confirmSendArticle') == 1) ? true : false);
	$('#active_popup').attr('checked', (Nemo.get('activePopup') == 1) ? true : false);
	$('#active_html').attr('checked', (Nemo.get('activeHTML') == 1) ? true : false);

	if( Nemo.get('useHashKey') == 1 ) {
		$('#plus_hashkey').show();
	}else{
		$('#plus_hashkey').hide();
	}

	Interface.refreshBlackList();

	if(callback) callback();
},

openRedactionWindow: function( callback1, callback2 ) {
	if( !Nemo.get('activePopup') ) {
		win = winParent = window;
		callback1()
		$('#send_form').dialog({ 
			height: 600, 
			width:900,
			title: 'Rédaction',
	 		position: { my: "center top", at: "center top", of: window },
			close: function(ev, ui) { $('#new_sujet, #repondre, #modifier_article').removeAttr("disabled"); }
		});
		if (callback2) callback2(); // Before opening window to not lost focus
	}else{
		winskin = (Interface.currentSkin != 'classic') ? '&skin='+Interface.currentSkin : '';
		winParent = window;
		win = window.open("?post"+winskin+"&server="+JNTP.url,"","width=900,height=600");
		win.onload = function() {
			win.$('#accueil, #leftnav, #rightnav').hide();
			win.$('#send_form').show();
			win.JNTP.Storage = JNTP.Storage;
			win.JNTP.execute(["whoami"]);
			win.Interface.inPopup = true;
			callback1();
			callback2();
		};
	}
},

initRedaction:function() {
	Nemo.Media.del();
	Interface.displayMediaInfos();
	Interface.reloadEvent();
	Interface.selectModeEdition( (Nemo.get("activeHTML") == 1) ? 'html' : 'text' );

	if(Nemo.get('signatureAuto') == 1) {
		$('#insert_signature').hide();
	}else{
		$('#insert_signature').show();
	}

	$('#contextMenu, #box_formulaire_fu2').hide();
	$('#formulaire_from').val(JNTP.Storage.FromName);
	$('#formulaire_email').val(JNTP.Storage.FromMail);
	$('#redaction, #formulaire_send').show();
	$('#rendu, #paint_window, .insert_media, #formulaire_update').hide();
	$('#'+Interface.bodyInputID+', #formulaire_subject, #formulaire_fu2, #formulaire_newsgroup, #add_img_url, #add_pdf_url, #add_file, #add_pdf, #add_img').val('');
	$('#new_sujet, #repondre, #modifier_article').attr("disabled", "disabled");
	$('.onglet').removeClass("selected");
	$(".onglet[data-div='redaction']").addClass("selected");

	if(Interface.windowLoaded) return;

	Interface.windowLoaded = true;
	Nemo.plugins.module.paint.load();

	$('#view_rendu').click(function() {
		if (!$(this).hasClass('selected')) {
			Interface.articleToWrite.set( {'Body':Interface.getBody()} ).addSignature().renduHTML('rendu', true);
		}
	});

	$('#form_post').submit(function() {

		var postForm = function() {
			$("#chargement").show();
			$("#send_form").hide();

			if (Interface.inPopup){
				$('#chargement2').show();
			}

			var followupTo = [];
			if($('#formulaire_fu2').val()) {
				followupTo = $('#formulaire_fu2').val().replace(/ /g,"").replace(/,\s*$/g,"").split(',');
			}

			Interface.articleToWrite.set({
				"FollowupTo": followupTo,
				"Newsgroups":$('#formulaire_newsgroup').val().replace(/ /g,"").replace(/,\s*$/g,"").split(','),
				"FromName": $('#formulaire_from').val(),
				"FromMail": $('#formulaire_email').val(),
				"Body": Interface.getBody().replace(/\?\?/g,"? ? "),
				"Subject": $('#formulaire_subject').val().replace(/\?\?/g,"? ? ")
			})
			.addSignature()
			.diffuse({"callback":function(options, code, j){switch(code) {
				case "200":
					Interface.articleToWrite.xpostMail({
						dataid: j.body.Data.DataID, 
						uri: JNTP.url + '/?DataID='+j.body.Data.DataID,
						mail: $("#formulaire_xpostmail").val(),
						subject: $('#formulaire_subject').val()
					});
					$('#formulaire_subject, #'+Interface.bodyInputID+', #add_img, #formulaire_xpostmail').val('');
					$("#chargement, #chargement2").hide();
					if(Interface.articleToWrite.value.Supersedes) {
						Interface.articleToDelete.del({"callback":function(options, code, j){switch(code) {
							case "200":
								$('#article_header').hide();
								$('#article_updated').show();
							break;
							case "500":
								$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
							break;
							}}
						});
					}
					Interface.closeRedactionWindow();
				break;

				case "500":
					$("#dialog-alert").dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
					$("#chargement, #chargement2").hide();
					$("#send_form").show();
				break;
				}}
			});
		}

		if( Nemo.get('confirmSendArticle') ) {
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

	$( "#button_formulaire_fu2" ).click(function() {
		$( "#box_formulaire_fu2" ).toggle( "fast" );
	});

	$('.onglet').click(function() {
		var div_click = $(this).attr('data-div');
		$('.onglet').removeClass("selected");
		$('.onglet').each(function(i){
			if(div_click == $(this).attr('data-div') ) {
				$('#'+$(this).attr('data-div')).show();
				$(this).addClass("selected");
			}else{
				$('#'+$(this).attr('data-div')).hide();
			}
 		});
	});

	$('#submit_img_url').click(function() {
		Interface.insertBaliseAtSelection('img', $('#add_img_url').val());
		$('.insert_img').hide();
		$('#add_img_url').val('');
	});

	$('#submit_audio_url').click(function() {
		Interface.insertBaliseAtSelection('audio', $('#add_audio_url').val());
		$('.insert_audio').hide();
		$('#add_audio_url').val('');
	});

	$('#submit_pdf_url').click(function() {
		Interface.insertBaliseAtSelection('pdf', $('#add_pdf_url').val());
		$('.insert_pdf').hide();
		$('#add_pdf_url').val('');
	});

	$('#add_pdf').change(function() {
		var uri = 'jntp:#DataID#/Data.Media:'+(parseInt(Nemo.Media.value.length) + 1);
		if(Nemo.Media.add('add_pdf', Interface.displayMediaInfos)) {
			Interface.insertBaliseAtSelection('pdf', uri);
			$('.insert_media').hide();
		}else{
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Fichier trop volumineux</p>");
		}
	});

	$('#add_file').change(function() {
		var uri = 'jntp:#DataID#/Data.Media:'+(parseInt(Nemo.Media.value.length) + 1);
		filename = $('#add_file').val().replace("C:\\fakepath\\", "");
		if(Nemo.Media.add('add_file', Interface.displayMediaInfos, filename)) {
			Interface.insertBaliseAtSelection('file name=' + filename, uri);
			$('.insert_media').hide();
		}else{
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Fichier trop volumineux</p>");
		}
	});

	$('#add_img').change(function() {
		var uri = 'jntp:#DataID#/Data.Media:'+(parseInt(Nemo.Media.value.length) + 1);
		if(Nemo.Media.add('add_img', Interface.displayMediaInfos)) {
			Interface.insertBaliseAtSelection('img', uri);
			$('.insert_media').hide();
		}else{
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Fichier trop volumineux</p>");
		}
	});

	$('#insert_a, #insert_b, #insert_i, #insert_u, #insert_s, #insert_tex, #insert_code, #insert_cite, #insert_youtube, #insert_dailymotion, #insert_map, #insert_abc').click(function() {
		Interface.insertBaliseAtSelection($(this).val(), Interface.getTextAtSelection() );
	});

	$('#insert_spoil').click(function() {
		var txt = Interface.getTextAtSelection();
		if (txt == '') {
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html("<p>Vous devez d'abord sélectionner votre texte</p>");
		}else{
			Interface.insertBaliseAtSelection($(this).val(), Nemo.Tools.rot13(txt));
		}
	});

	$('#insert_other').change(function() {
		Interface.insertBaliseAtSelection($(this).val(), Interface.getTextAtSelection());
		$('#insert_other').val('');
	});

	$('#insert_audio').click(function() {
		if($('.'+$(this).attr('id')).is(':hidden')){
			$('.insert_media').hide();
			$('.'+$(this).attr('id')).show();
			$('#add_audio_url').val( Interface.getTextAtSelection() );
		}else{
			$('.insert_media').hide();
		}
	});

	$('#insert_img').click(function() {
		if($('.'+$(this).attr('id')).is(':hidden')){
			$('.insert_media').hide();
			$('.'+$(this).attr('id')).show();
			$('#add_img_url').val( Interface.getTextAtSelection() );
		}else{
			$('.insert_media').hide();
		}
	});

	$('#insert_pdf').click(function() {
		if($('.'+$(this).attr('id')).is(':hidden')){
			$('.insert_media').hide();
			$('.'+$(this).attr('id')).show();
			$('#add_pdf_url').val( Interface.getTextAtSelection() );
		}else{
			$('.insert_media').hide();
		}
	});

	$('#insert_file, #insert_c').click(function() {
		if($('.'+$(this).attr('id')).is(':hidden')){
			$('.insert_media').hide();
			$('.'+$(this).attr('id')).show();
		}else{
			$('.insert_media').hide();
		}
	});

	$('#insert_paint').click(function() {
		$('.onglet').removeClass("selected");
		$('.onglet').each(function(i){
			$('#'+$(this).attr('data-div')).hide();
 		});
		$('#paint_window').show();
	});

	$('#insert_signature').click(function() {
		var sign = "[signature]" + Nemo.get('signature') + "[/signature]";
		Interface.setBody( Interface.getBody()+"\n" + sign);
		if(Interface.modeEdit == 'text') {
			var objDiv = document.getElementById(Interface.bodyInputID);
			objDiv.scrollTop = objDiv.scrollHeight;
		}else{
			$('#formulaire_body_html').html( new Nemo.Article().set({"Body": Interface.getBody()}).renduQuote().value.Body );
		}
	});

	$('#typeChar [data-value]').click(function() {
		var typeChar = $(this).attr('data-value');
		$('#listeChar').empty();
		for (var i in Interface.Char[typeChar] ){
			var value = (Interface.Char[typeChar] instanceof Array) ? Interface.Char[typeChar][i] : i;
			$('#listeChar').append('<div class="oneChar" data-value="'+Interface.Char[typeChar][i]+'">'+value+'</div>');
		}
		$('.oneChar').off("click").click(function() {
			Interface.insertBaliseAtSelection('', $(this).attr('data-value'));
		});
	});

	$('#mode_html').click(function() {
		if (Interface.modeEdit == 'text') {
			Interface.selectModeEdition('html');
		}else{
			Interface.selectModeEdition('text');
		}
		
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
		  if (terms.length > 2) $('#box_formulaire_fu2').show();
		  return false;
        }
      });

	$("#formulaire_body_html").keydown(function(e) {
		return Interface.enterNewlineOrTab(e);
	});

	var periodicDraft = setInterval(function(){
		Interface.draft({
			"Subject" : $('#formulaire_subject').val(),
			"Newsgroups" : $('#formulaire_newsgroup').val(),
			"Body" : Interface.getBody(),
			"FollowupTo": $('#formulaire_fu2').val(),
			"References": Interface.articleToWrite.value.References,
			"Supersedes" : Interface.articleToWrite.value.Supersedes,
			"ThreadID": Interface.articleToWrite.value.ThreadID,
			"ReferenceUserID": Interface.articleToWrite.value.ReferenceUserID
		});
	}, 10000);

	if( Nemo.Tools.HTTPGet('server') ) {
		JNTP.setUrl( Nemo.Tools.HTTPGet('server') );
	}
},

init: function() {

	$('#mailAuthor').attr('href', 'mailto:julien.arlandis@laposte.net');
	$('#panneau_principal, #fil_info').hide();

	$('#Subject').click(function() {
		Interface.selectOrder("Subject", "changeOrder", 0);
		Nemo.Thread.display();
	});

	$('#FromName').click(function() {
		Interface.selectOrder("FromName", "changeOrder", 0);
		Nemo.Thread.display();
	});

	$('#InjectionDate').click(function() {
		Interface.selectOrder("InjectionDate", "changeOrder");
		Nemo.Thread.display();
	});

	$('#eye').click(function() {
		if (Nemo.Thread.viewlu == 'all') {
			Nemo.Thread.viewlu = 'lu';
		}else if (Nemo.Thread.viewlu == 'lu') {
			Nemo.Thread.viewlu = 'nonlu';
		}else if (Nemo.Thread.viewlu == 'nonlu') {
			Nemo.Thread.viewlu = 'all';
		}
		Nemo.Thread.display();
	});

	$('#tree').click(function() {
		Nemo.Thread.tri.tree = (Nemo.Thread.tri.tree) ? 0 : 1;
		if(Nemo.Thread.tri.tree > 0) {
			order = (Nemo.Thread.tri.field == "InjectionDate") ? Nemo.Thread.tri.order : "desc";
			Interface.selectOrder("InjectionDate", order, Nemo.Thread.tri.tree);
		}
		Nemo.Thread.display();
	});

	$('#new_sujet').click(function() {
		Interface.openRedactionWindow(
			function(){
				var $=win.$;
				win.Interface.articleToWrite = new win.Nemo.Article().set({
					"ThreadID": ""
				}).setReferences( [] );
				win.Interface.initRedaction();
				if( Nemo.Thread.filter['Data.Newsgroups'] && Nemo.Thread.filter['Data.Newsgroups'].indexOf('*') == -1) {
					$('#formulaire_newsgroup').val( Nemo.Thread.filter['Data.Newsgroups'] );
				}
			},function(){
				$('#formulaire_subject').focus();
			}
		);
	});

	$("#modifier_article").click(function() {
		Interface.openRedactionWindow(function(){
			var $=win.$;
			win.Interface.articleToWrite = new win.Nemo.Article().set({
				"Body": Interface.articleToRead.clearSignature().value.Body,
				"ThreadID": Interface.articleToRead.value.ThreadID,
				"Supersedes": Interface.articleToRead.value.DataID,
				"References": Interface.articleToRead.value.References
			})

			win.Interface.articleToDelete = Interface.articleToRead.clone();
			win.Interface.initRedaction();
			$('#formulaire_send').hide();
			$('#formulaire_update').show();
			$('#formulaire_subject').val( Interface.articleToRead.value.Subject );
			$('#formulaire_newsgroup').val(Interface.articleToRead.value.Newsgroups.join(', '));
			$('#formulaire_fu2').val(Interface.articleToRead.value.FollowupTo.join(', '));
			win.Nemo.Media.copy( Interface.articleToRead.value.DataID, win.Interface.displayMediaInfos);
			win.Interface.setBody( win.Interface.articleToWrite.value.Body );


		},function() {
			var $=win.$; var document=win.document;
			// positionne le curseur à la fin
			var val = $('#'+Interface.bodyInputID).val();
			$('#'+Interface.bodyInputID).focus().val('').val(val);
			var objDiv = document.getElementById(win.Interface.bodyInputID);
			objDiv.scrollTop = objDiv.scrollHeight;
		});
	});

	$("#repondre").click(function(e) {
		Interface.openRedactionWindow(
			function() {
				var $=win.$; var document=win.document;

				// References
				var refs = (typeof Interface.articleToRead.value.References != "undefined") ? Interface.articleToRead.value.References.slice() : [];
				refs.push( Interface.articleToRead.value.DataID );
				win.Interface.articleToWrite = new win.Nemo.Article()
					.set({
						"ReferenceUserID": (typeof Interface.articleToRead.value.UserID != "undefined") ? Interface.articleToRead.value.UserID : false,
						"ThreadID": Interface.articleToRead.value.ThreadID,
						"Body": Interface.articleToRead.setTemplateVar().getSelectLines().value.Body
					})
					.setReferences( refs )
					.clearCitations( !winParent.$('#delete_citations').is(':visible') )
					.clearSignature()
					.quote({
						"date":Interface.articleToRead.value.InjectionDate,
						"FromName": Interface.articleToRead.value.FromName,
						"FromMail": Interface.articleToRead.value.FromMail
					});
			},function() {
				var $=win.$; var document=win.document;
				win.Interface.initRedaction();

				// Sujet
				var suf = (Interface.articleToRead.value.Subject.substring(0, 3) != 'Re:')? 'Re: ' : '';
				$('#formulaire_subject').val(suf + Interface.articleToRead.value.Subject);

				// Newsgroups
				if(Interface.articleToRead.value.FollowupTo && Interface.articleToRead.value.FollowupTo.length){
					$('#formulaire_newsgroup').val(Interface.articleToRead.value.FollowupTo.join( ', ' ));
				}else{
					$('#formulaire_newsgroup').val(Interface.articleToRead.value.Newsgroups.join( ', ' ));
				}

				if( $('#formulaire_newsgroup').val().split(',').length > 1) $('#box_formulaire_fu2').show();

				// positionne le curseur à la fin
				win.Interface.setBody( win.Interface.articleToWrite.value.Body );
				var val = $('#'+Interface.bodyInputID).val()+"\n";
				$('#'+Interface.bodyInputID).focus().val('').val(val);
				var objDiv = document.getElementById(win.Interface.bodyInputID);
				objDiv.scrollTop = objDiv.scrollHeight;
		});

	});

	$('#articles_draft').click(function() {
		Interface.openRedactionWindow(function(){
			var Interface=win.Interface; var $=win.$; var document=win.document;
			var art = Interface.draft();

			Interface.articleToWrite = new win.Nemo.Article().set({
					"ReferenceUserID": (typeof art.ReferenceUserID != "undefined") ? art.ReferenceUserID : false,
					"ThreadID": art.ThreadID,
					"References": art.References
				})

			Interface.initRedaction();
			Interface.setBody( art.Body );
			$('#formulaire_subject').val( art.Subject );
			$('#formulaire_newsgroup').val( art.Newsgroups );
			$('#formulaire_fu2').val( art.FollowupTo );
			document.getElementById(Interface.bodyInputID).selectionStart = Interface.getBody().length;
			document.getElementById(Interface.bodyInputID).selectionEnd = document.getElementById(Interface.bodyInputID).selectionStart;
			$('#'+Interface.bodyInputID).focus();
			var objDiv = document.getElementById(Interface.bodyInputID);
			objDiv.scrollTop = objDiv.scrollHeight;
		});
	});

	$('#supprimer_article').click(function() {
		$( "#dialog-alert" ).dialog({ 
			modal: true,
			buttons: {
				"Oui": function() {
					Interface.articleToRead.del({"callback":function(options, code, j){switch(code) {
						case "200":
							$('#article_deleted').show();
							$('#article_header').hide();
						break;
						case "500":
							$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
						break;
						}}
					});
				  	$( this ).dialog( "close" );
				},
				"Non": function() {
				  $( this ).dialog( "close" );
				}
			}
			}).html("<p>Confirmer l'annulation de l'article?</p>");
	});

	$('#parametres').click(function() {
		Interface.openConfigWindow();
	});

	$('#form_authentification').submit(function() {
		Interface.authentification();
		return false;
	});

	$('#form_inscription').submit(function() {
		Interface.inscription();
		return false;
	});

	$('#deconnect').click(function() {
		Interface.deconnexion();
	});

	$('#articles_send').click(function() {
		Nemo.Thread.filter = {"Data.UserID": JNTP.Storage.UserID};
		Nemo.Thread.get({
			"listenNext":1, 
			"callback": function(res) {
				if(res.firstID) Interface.articleToRead.get({"ID":res.firstID, "read":0, "surligne":true, "graphicRefresh":Interface.callbackGetArticle});
				$('.actif').removeClass("actif");
				$('#articles_send').addClass("actif");
			}
		});
	});

	$('#articles_response').click(function() {
		Nemo.Thread.filter = {"Data.ReferenceUserID": JNTP.Storage.UserID};
		Nemo.Thread.get({
			"listenNext":1, 
			"callback": function(res) {
				if(res.firstID) Interface.articleToRead.get({"ID":res.firstID, "read":0, "surligne":true, "graphicRefresh":Interface.callbackGetArticle});
				$('.actif').removeClass("actif");
				$('#articles_response').addClass("actif");
			}
		});
	});

	$('#recherche_article_go').click(function() {
		Nemo.Thread.filter = {};
		Nemo.Thread.filter[$('#article_filter1').val()] = [$('#article_value1').val(), 'contain'];
		Nemo.Thread.filter["Data.Protocol"] = $('#article_protocol').val();
		Nemo.Thread.filter["Data.Newsgroups"] = $('#newsgroups_value').val();
		Nemo.Thread.get({
			"callback": function(res) {
				if(res.firstID) Interface.articleToRead.get({"ID":res.firstID, "read":0, "surligne":true, "graphicRefresh":Interface.callbackGetArticle});
			}
		});
	});

	$('#recherche_article_dataid').click(function() {
		Nemo.Thread.filter = { "Data.DataID": $('#dataid_value').val() };
		Nemo.Thread.get({
			"callback": function(res) {
				if(res.firstID) Interface.articleToRead.get({"ID":res.firstID, "read":0, "surligne":true, "graphicRefresh":Interface.callbackGetArticle});
			}
		});
	});

	$('#search_newsgroup').keyup(function() {
		motif = $('#search_newsgroup').val();
		if( motif.charAt(motif.length - 1) != '*') { motif = '*'+motif+'*'; }
		if(motif.length > 3) {
			if(motif.indexOf('.*') != -1) {
				Interface.getNewsgroups({"name":motif,"level":1});
			}else{
				Interface.getNewsgroups({"name":motif});
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
		$("#config_recherche").dialog({ minHeight: 250, minWidth:680 });
	});

	$('.forget_password').click(function() {
		$("#recup_password").dialog({ minHeight: 200, minWidth:410 });
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
					Nemo.initStorage();
					$( this ).dialog( "close" );
				},
				"Non": function() {
					$( this ).dialog( "close" );
				}
			}
			}).html("<p>Ceci entrainera la suppression de vos paramètres de configuration de Nemo. <br>Confirmer?</p>");
	});

	$('#export_localStorage').click(function() {
		$('#txt_localStorage').val( JSON.stringify( localStorage ));
	});

	$('#import_localStorage').click(function() {
		$( "#dialog-alert" ).dialog({
			modal: true,
			buttons: {
				"Oui": function() {
					var json = JSON.parse( $('#txt_localStorage').val() );
					for (var key in json) {
						localStorage[key] = json[key];
					}
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
			Interface.articleToRead.ban({"callback":function(options, code, j){switch(code) {
				case "200":
					$('#article_header').hide();
					$('#article_deleted').show();
				break;
				case "500":
					$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
				break;
				}}
			});
		}
	});

	$("#voir_references").click(function() {
		if(Interface.viewReferences) {
			Interface.viewReferences = false;
			$("#references").hide();
			$("#voir_references").html('Voir les références');
		}else{
			Interface.viewReferences = true;
			$("#references").show();
			$("#voir_references").html('Cacher les références');
		}	
	});

	$("#voir_allThread").click(function() {
		$('#retour').show();
		$('#voir_allThread').hide();
		Nemo.Thread.filterOld = Nemo.Thread.filter;
		Nemo.Thread.filter = {"Data.ThreadID":Interface.articleToRead.value.ThreadID};
		Nemo.Thread.oldTri = [Nemo.Thread.tri.field, Nemo.Thread.tri.order, Nemo.Thread.tri.tree];
		Nemo.Thread.get({"listenNext":1, "limit":1000});
		Interface.selectOrder("InjectionDate", "desc", 1);
	});

	$("#retour").click(function() {
		$('#retour').hide();
		$('#voir_allThread').show();
		Nemo.Thread.filter = Nemo.Thread.filterOld;
		Interface.selectOrder(Nemo.Thread.oldTri[0], Nemo.Thread.oldTri[1], Nemo.Thread.oldTri[2]);
		Nemo.Thread.get({"listenNext":1});
	});

	$('#delete_citations').click(function() {
		$('#revoir_citations').show();
		$(this).hide();
		Interface.articleToRead.clearCitations().renduHTML('article_body');
	});

	$('#revoir_citations').click(function() {
		$(this).hide();
		$('#delete_citations').show();
		Interface.articleToRead.renduHTML('article_body');
	});

	$('#like').click(function() {

		var params = {
			"DataType" : "Like", 
			"Newsgroups" : Interface.articleToRead.value.Newsgroups, 
			"Body" : JNTP.Storage.FromName + ' a aimé cet article', 
			"FollowupTo" : Interface.articleToRead.value.FollowupTo, 
			"Subject" : Interface.articleToRead.value.Subject,
			"ReplyTo": JNTP.Storage.ReplyTo,
			"Uri": JNTP.url + '/?DataID=#DataID#',
			"DataIDLike": Interface.articleToRead.value.DataID
		};

		var article = JNTP.forgeDataArticle(params, Nemo.get('secretKey'));
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
		Interface.changeSkin($(this).val());
	});

	$("#console").keypress(function(e) {
		if(e.keyCode==13) {
			var cmd = $('#console').val();
			JNTP.execute(cmd);
			Interface.listCmd.push(cmd);
			Interface.cursorCmd = Interface.listCmd.length;
			$('#console').val('');
		}
	});

	$('#generate_secret_key').click(function() {
		Nemo.set("secretKey", Nemo.Tools.generateSecretKey());
		$('#secret_key').val(Nemo.get('secretKey'));
	});

	$("#use_hashkey").on('change', function(){
		Nemo.set("useHashKey", $(this).is(':checked') ? 1 : 0);
		if($(this).is(':checked')) {
			$('#plus_hashkey').show();
		}else{
			$('#plus_hashkey').hide();
		}
	});

	$("#secret_key").on('change', function(){
		Nemo.set("secretKey", $(this).val() );
	});

	$("#confirm_send_article").on('change', function(){
		value = $(this).is(':checked') ? 1 : 0;
		Nemo.set("confirmSendArticle", value);
	});

	$("#active_popup").on('change', function(){
		Nemo.set("activePopup", $(this).is(':checked') ? 1 : 0);
	});

	$("#active_html").on('change', function(){
		Nemo.set("activeHTML", $(this).is(':checked') ? 1 : 0);
		Interface.modeEdit = $(this).is(':checked') ? 'html' : 'text';
	});

	$("#total_article").on('change', function(){
		Nemo.set("totalArticle", $(this).val());
		$('output').text(Nemo.get('totalArticle'));
	});

	$("#signature").on('change', function(){
		Nemo.set("signature", $('#signature').val());
	});

	$("#signature_auto").on('change', function(){
		var bool = $('#signature_auto').is(':checked') ? 1 : 0;
		Nemo.set("signatureAuto", bool );
	});

	$("#fromname").on('change', function(){
		
		JNTP.execute(["set", {"FromName":$('#fromname').val()}], function(code, j){switch(code) {
		case "200":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.body+'</p>');
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
			break;

		case "500":
			$( "#dialog-alert" ).dialog({ modal: true, buttons:{} }).html('<p>'+j.error+'</p>');
			break;
		}});
	});

	$("#host_jntp").on('change', function(){
		JNTP.setUrl( $('#host_jntp').val() );
		JNTP.Storage.hashkey = '';
		JNTP.Storage.Session = false;
		JNTP.authentified = false;
		$("#authentification").show();
		$('#email').val('');
		$("#deconnexion, #historique, #ban_article").hide();
		if(typeof Interface.articleToRead.value.DataID  != "undefined" ) {
			Interface.articleToRead.get({"DataID":Interface.articleToRead.value.DataID, "graphicRefresh":Interface.callbackGetArticle});
		}
		Interface.startConnexion();
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
		Interface.displayNewsgroupsCategory();
		$('#liste_hierarchies').dialog({
			height: 380, 
			width:300,
			title: 'Liste des hiérarchies',
	 		position: { my: "right top", at: "center top", of: window },
			close: function(ev, ui) { }
		});
	});

	$(document).bind('keydown', function(e) {
		if(e.which == 38 && Interface.isCtrlPress) {
			if(dataid = $('#fil [data-DataID="'+Interface.articleToRead.value.DataID+'"]').prev().attr('data-DataID')) {
				Interface.articleToRead.get({"DataID":dataid,"read":1, "surligne":true, "graphicRefresh":Interface.callbackGetArticle});
			}
			return false;
		}

		else if(e.which == 40 && Interface.isCtrlPress) {
			if(dataid = $('#fil [data-DataID="'+Interface.articleToRead.value.DataID+'"]').next().attr('data-DataID')) {
				Interface.articleToRead.get({"DataID":dataid,"read":1,"surligne":true, "graphicRefresh":Interface.callbackGetArticle});
			}
			return false;
		}
		if(e.which == 38 && $('#console').is(":focus")) {
			Interface.cursorCmd = (Interface.cursorCmd > 0) ? --Interface.cursorCmd : 0;
			$('#console').val(Interface.listCmd[Interface.cursorCmd]);
		}
		if(e.which == 40 && $('#console').is(":focus")) {
			Interface.cursorCmd = (Interface.cursorCmd < Interface.listCmd.length-1) ? ++Interface.cursorCmd : Interface.listCmd.length-1;
			$('#console').val(Interface.listCmd[Interface.cursorCmd]);
		}
	});


	$(document).bind('keyup', function(e){
		var upOrDown = (e.which == 38 || e.which == 40);
		if(!upOrDown) {
			Interface.isShiftPress = false;
			Interface.isCtrlPress = false;
		}
	} );

	$(document).bind('keydown', function(e){
		Interface.isShiftPress = e.shiftKey;
		Interface.isCtrlPress = e.ctrlKey;
	} );

	$('.limit_size_file').html(Math.round(Nemo.Media.maxFileSize/1024) + ' ko');
	$('#host_jntp').val(JNTP.url);

	if(Newsgroup = Nemo.Tools.HTTPGet('Newsgroup')) {
		Nemo.Thread.filter["Data.Newsgroups"] = Newsgroup;
		Nemo.Thread.get({
			"listenNext":1, 
			"callback": function(res) {
				if(res.firstID) Interface.articleToRead.get({"ID":res.firstID,"read":0,"surligne":true,"graphicRefresh":Interface.callbackGetArticle});
			}
		});
	}

	if(ThreadID = Nemo.Tools.HTTPGet('ThreadID')) {
		Interface.selectOrder("InjectionDate", "desc", 2);
		Nemo.Thread.filter["Data.ThreadID"] = ThreadID;
		Nemo.Thread.get({
			"listenNext":1, 
			"callback": function(res) {
				if(res.firstID) Interface.articleToRead.get({"ID":res.firstID,"read":0,"surligne":true,"graphicRefresh":Interface.callbackGetArticle});
			}
		});
	}
	else if(dataid = Nemo.Tools.HTTPGet('DataID')) {
		Interface.articleToRead.get({"DataID":dataid, "read":1, "surligne":true, "graphicRefresh":Interface.callbackGetArticle, "callback": function() {
			Nemo.Thread.filter["Data.Newsgroups"] = Interface.articleToRead.value.Newsgroups[0];
			Nemo.Thread.get({"listenNext":1});
		}});
	}

	if(faq = Nemo.Tools.HTTPGet('faq')) {
		$(".reponse").hide();
		$(".img-swap").removeClass("moins").addClass("plus");
		$("#faq").dialog({height:750, width:760, position:"center top" }).load( "faq.html", function() {  
			if(faq = Nemo.Tools.HTTPGet('faq')) {
				$(".reponse[data-faq="+faq+"]").toggle(500); 
			}
		}).scrollTop(0);
	}


	// Stop scrolling
	$('#'+Interface.bodyInputID+', #'+Interface.bodyInputID+'_html, #scrollFil, #newsgroups').on('DOMMouseScroll mousewheel', function(ev) {
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


	Interface.loadMenuSkin();
	Interface.displayFavoris();
}

}

$(document).ready(function() {
 	$.ajaxSetup({cache: true});

	Nemo.Thread.display = Interface.displayThread;
	JNTP.logFunction = Interface.logData;

	if(window.location.host.length == 0) {
		JNTP.setUrl( 'http://devnews.nemoweb.net' );
	}else{
		if ($('#host_jntp').val().length == 0) {
			JNTP.setUrl( 'http://'+window.location.host );
		}else{
			JNTP.setUrl( $('#host_jntp').val() );
		}
	}

	Nemo.initStorage();

	if(skin = Nemo.Tools.HTTPGet('skin')) {
		Interface.changeSkin(skin);
	}

	if( !Nemo.Tools.HTTPGet('post')) {
		Interface.init();
		Interface.startConnexion();
	}
})



