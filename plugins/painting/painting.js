var painting = function() {
	var painting = false;
	var started = false;
	var canvas = $("#paint");
	var effect = $("#effect");
	var cursor = { x:0, y:0 };
	var oldcur = cursor;
	var context = canvas[0].getContext('2d');
	var context_effect = effect[0].getContext('2d');
	var color = $('#mycolor').val();
	var noirceur = parseFloat($('#noirceur').val());
	var thickness = parseFloat($('#thickness').val());
	var alpha = 0.5;

	$('#mycolor').change(function() {
		color = $(this).val();
	})

	$('#noirceur').change(function() {
		noirceur = parseFloat($(this).val());
	})

	$('#thickness').change(function() {
		thickness = parseFloat($(this).val());
	})

	$('#clear_dessin').click(function() {
		context.clearRect(0,0, canvas.width(), canvas.height());
		context_effect.clearRect(0,0, canvas.width(), canvas.height());
		context.beginPath();
		context_effect.beginPath();
	});

	$('#capture_dessin').click(function() {

		var canvas_paint = document.getElementById("paint");
		var context_paint = canvas_paint.getContext('2d');
		var canvas_effect = document.getElementById("effect");
		var context_effect = canvas_effect.getContext('2d');

		var canvas = document.createElement('canvas');
		canvas.width = canvas_paint.width;
    		canvas.height = canvas_paint.height;
		var context_canvas = canvas.getContext('2d');

		context_canvas.drawImage(canvas_effect,0,0);
		context_canvas.drawImage(canvas_paint,0,0);
		Nemo.Media.value.push({"data":canvas.toDataURL("image/png"), "hash":CryptoJS.SHA1(canvas.toDataURL("image/png")).toString(CryptoJS.enc.Hex)});
		Interface.insertAtSelection('img', 'jntp:#DataID#/Data.Media:'+Nemo.Media.value.length);

		$('.onglet').removeClass("selected");
		$('#view_redaction').addClass("selected");
		$('#paint_window').hide();
		$('#redaction').show();
		Nemo.Media.displayInfos();
	});

	canvas.bind('touchstart mousedown', function(event){
		var ev = event.originalEvent;
		painting = true;
		cursor = capturePos(ev);
		event.preventDefault();
	});

	canvas.bind('touchend mouseup', function(event){
		painting = false;
		started = false;
	});

	canvas.bind('touchmove mousemove', function(event){
		var ev = event.originalEvent ;
		if (painting) {
			cursor = capturePos(ev);
			if (!started) {
				oldcur = cursor;
				started = true;
			}
			else
			{
				dessine([cursor.x, cursor.y]);
			}
		}
	});

	var capturePos = function(ev)
	{
		curx = (ev.pageX || ev.touches[0].pageX) - canvas.offset().left;
		cury = (ev.pageY || ev.touches[0].pageY) - canvas.offset().top;
		return { x: curx, y: cury };
	};

	var dessine = function(obj) {

		if (obj.length == 0) {
			oldcur.x = undefined;
			return;
		}

		x = Math.floor(obj[0]);
		y = Math.floor(obj[1]);
		if (typeof oldcur.x == undefined) {
			oldcur.x = x;
			oldcur.y = y;
		}
		context.beginPath();
		context.globalAlpha = alpha;
		context.moveTo(oldcur.x, oldcur.y);
		context.lineTo(x, y);
		oldcur.x = x;
		oldcur.y = y;
		context.strokeStyle = color;
		oldcur = cursor;
		context.stroke();

 		if (thickness > 0) {
			n = 0;
			img = context.getImageData(x-thickness/2, y-thickness/2, thickness, thickness);

			for (i=0; i<img.width * img.height * 4; i+=4)
			{
				alpha_pix = img.data[i+3]/256;

				if(alpha_pix > 0)
				{
					x2 = (n % thickness) - thickness/2;
					y2 = Math.floor(n/thickness) - thickness/2;
					d = 2 * Math.sqrt(x2*x2 + y2*y2)/(1.45 * thickness); 
					alpha_effect = 0.3 * Math.log(1 + noirceur) * Math.log(2 - d);

					delta_x = x2 * 0.20;
					delta_y = y2 * 0.20;
					context_effect.beginPath();
					context_effect.strokeStyle = color;
					context_effect.globalAlpha = alpha_effect;
					context_effect.moveTo(x+delta_x, y+delta_y);
					context_effect.lineTo(x+x2-delta_x, y+y2-delta_y);
					context_effect.stroke();
				}
				n++;
			}
		}

	};
}
