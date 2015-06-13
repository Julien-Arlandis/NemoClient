$(document).ready(function() {

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
})
