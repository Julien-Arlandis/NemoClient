var Paint = function() {

	this.painting = false;
	this.started = false;
	this.cursor = { x:0, y:0 };
	this.oldcur = { x:0, y:0 };
	this.color = $('#mycolor').val();
	this.noirceur = parseFloat($('#noirceur').val());
	this.thickness = parseFloat($('#thickness').val());
	this.alpha = 0.5;
	this.canvas = $("#paint");
	this.context = document.getElementById("paint").getContext('2d');
	this.context_effect = document.getElementById("effect").getContext('2d');

	this.initInterface = function() {
		$('.menu-paint').hide();
		$('.menu-paint[data-menu=color]').show();

		$('#paint-button-color').click(function() {
			$('.menu-paint').hide();
			$('.menu-paint[data-menu=color]').show();
			if( $(this).hasClass("selected") ) {
console.log('not selected');
				$(this).removeClass("selected"); 
			}else{
				$(this).addClass("selected");
console.log('selected');
			}
		})

		$('#paint-button-noirceur').click(function() {
			$('.menu-paint').hide();
			$('.menu-paint[data-menu=noirceur]').show();
			if( $(this).hasClass("selected") ) {
				$(this).removeClass("selected"); 
			}else{
				$(this).addClass("selected");
			}
		})

		$('#paint-button-thickness').click(function() {
			$('.menu-paint').hide();
			$('.menu-paint[data-menu=thickness]').show();
			if( $(this).hasClass("selected") ) {
				$(this).removeClass("selected"); 
			}else{
				$(this).addClass("selected");
			}
		})

		$('#paint-button-erase').click(function() {
			$('.menu-paint').hide();
			if( $(this).hasClass("selected") ) {
				$(this).removeClass("selected"); 
			}else{
				$(this).addClass("selected");
			}
		})

		$('#mycolor').change(function() {
			this.color = $('#mycolor').val();
		}.bind(this))

		$('#noirceur').change(function() {
			this.noirceur = parseFloat($('#noirceur').val());
		}.bind(this))

		$('#thickness').change(function() {
			this.thickness = parseFloat($('#thickness').val());
		}.bind(this))

		$('#clear_dessin').click(function() {
			this.context.clearRect(0,0, this.canvas.width(), this.canvas.height());
			this.context_effect.clearRect(0,0, this.canvas.width(), this.canvas.height());
			this.context.beginPath();
			this.context_effect.beginPath();
		}.bind(this));

		$('#capture_dessin').click(function() {
			var newCanvas = document.createElement('canvas');
			newCanvas.width = this.canvas.width();
	    		newCanvas.height = this.canvas.height();
			newCanvas.getContext('2d').drawImage(document.getElementById("effect"),0,0);
			newCanvas.getContext('2d').drawImage(document.getElementById("paint"),0,0);

			Nemo.Media.value.push({"data":newCanvas.toDataURL("image/png")});
			Interface.insertBaliseAtSelection('paint', 'jntp:#DataID#/Data.Media:'+Nemo.Media.value.length);
			Interface.displayMediaInfos();

			$('.onglet').removeClass("selected");
			$('#view_redaction').addClass("selected");
			$('#paint_window').hide();
			$('#redaction').show();
		}.bind(this));

		this.canvas.bind('touchstart mousedown', function(event) {
			this.painting = true;
			this.cursor = this.capturePos( event.originalEvent );
			event.preventDefault();
		}.bind(this));

		this.canvas.bind('touchend mouseup', function(event) {
			this.painting = false;
			this.started = false;
		}.bind(this));

		this.canvas.bind('touchmove mousemove', function(event) {
			var ev = event.originalEvent;
			if (this.painting) {
				this.cursor = this.capturePos(ev);
				if (!this.started) {
					this.oldcur = this.cursor;
					this.started = true;
				}else{
					this.dessine({x:this.cursor.x, y:this.cursor.y});
				}
			}
		}.bind(this));
	};

	this.capturePos = function(ev) {
		return {
			x: Math.floor( (ev.pageX || ev.touches[0].pageX) - this.canvas.offset().left), 
			y: Math.floor((ev.pageY || ev.touches[0].pageY) - this.canvas.offset().top)
		};
	};

	this.dessine = function(obj) {

		this.context.beginPath();
		this.context.globalAlpha = this.alpha;
		this.context.moveTo(this.oldcur.x, this.oldcur.y);
		this.context.lineTo(obj.x, obj.y);
		this.oldcur.x = obj.x;
		this.oldcur.y = obj.y;
		this.context.strokeStyle = this.color;
		this.oldcur = this.cursor;
		this.context.stroke();

 		if (this.thickness > 0) {
			var n = 0;
			var img = this.context.getImageData(obj.x-this.thickness/2, obj.y-this.thickness/2, this.thickness, this.thickness);
			for (var i=0; i<img.width * img.height * 4; i+=4) {
				if(img.data[i+3]/256 > 0) {
					var x2 = (n % this.thickness) - this.thickness/2;
					var y2 = Math.floor(n/this.thickness) - this.thickness/2;
					var d = 2 * Math.sqrt(x2*x2 + y2*y2)/(1.45 * this.thickness); 
					var alpha_effect = 0.3 * Math.log(1 + this.noirceur) * Math.log(2 - d);
					var delta_x = x2 * 0.20;
					var delta_y = y2 * 0.20;

					this.context_effect.beginPath();
					this.context_effect.strokeStyle = this.color;
					this.context_effect.globalAlpha = alpha_effect;
					this.context_effect.moveTo(obj.x+delta_x, obj.y+delta_y);
					this.context_effect.lineTo(obj.x+x2-delta_x, obj.y+y2-delta_y);
					this.context_effect.stroke();
				}
				n++;
			}
		}

	}
}
