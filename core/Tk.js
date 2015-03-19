tk = function(langFile, callback) {
	$.ajax({
		type: "GET",
		url: langFile,
		dataType: "xml",
		success: function(xml) {
			$(xml).find('t').each(function() {
				var selector = $(this).attr('k');
				var trad = $(this).html();

				if( selector[0] == '!' ) {
					var key = selector.substr(1,selector.length);
					var selector = "[tk='"+key+"']";
					tk[key] = trad;
				}

				if(!$(this).attr('attr')) {
					$(selector).html(trad);
				}else{
					$(selector).attr($(this).attr('attr'),trad);
				}
			});
			if(callback) callback.call();
		}
	});
}
