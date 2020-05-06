window.requestAnimFrame=(function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a,b){window.setTimeout(callback,1000/60)}})();
if(!Object.prototype.watch){Object.defineProperty(Object.prototype,"watch",{enumerable:false,configurable:true,writable:false,value:function(b,c){var d=this[b],newval=d,getter=function(){return newval},setter=function(a){d=newval;return newval=c.call(this,b,d,a)};if(delete this[b]){Object.defineProperty(this,b,{get:getter,set:setter,enumerable:true,configurable:true})}}})}if(!Object.prototype.unwatch){Object.defineProperty(Object.prototype,"unwatch",{enumerable:false,configurable:true,writable:false,value:function(a){var b=this[a];delete this[a];this[a]=b}})};

var Utils = {
	toAngle: function(rad){
		return 180 * rad / Math.PI
	},
	toRad: function(angle){
		 return angle * Math.PI / 180;
	},
	windClass: function(val){
		val = val || this.value;
		$(this).attr("class", "ui-spinner-input wind-level-" + (val >= 20 ? 2 : val >= 10 ? 1 : 0));
	},
	getMobileUrl : function(mobile){
		return "../img/mobiles/" + MOBILES[mobile][0].toLowerCase() + ".png";
	},
	pad0: function(num){
		return num <= 9 ? "0" + num : num
	},
	rand: function(a, b) {
    		return Math.floor(Math.random() * (b - a + 1) + a);
	},
	powerFormat: function(power){
		return (power/100).toFixed(2);
	}
};

$.widget("ui.windspinner", $.ui.spinner, {
	options: {
		min: 0,
		max: 50,
		create: function(a,e){
			$(this).bind('keydown',function(){
				var _this = this;
				setTimeout(function(){
					Utils.windClass.call(_this);
				},1);
			}).click(function(e){
				e.stopPropagation();
			});
		}
	},
	_format: function(value) {
		return Utils.pad0(value);
	}
});

$.fn.onlyNumber = function(){
	return this.each(function(){
		$(this).keydown(function(e){
			// Allow: backspace, delete, tab, escape, enter and . 116:F5
			if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190, 116]) !== -1 ||
			// Allow: Ctrl+A
			(e.keyCode == 65 && e.ctrlKey === true) || 
			// Allow: home, end, left, right, down, up
			(e.keyCode >= 35 && e.keyCode <= 40)) {
			// let it happen, don't do anything
				return;
			}
			// Ensure that it is a number and stop the keypress
			if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
				e.preventDefault();
			}
		});
	});
};

$.fn.selectList = function(customoptions){

	var class_selectable_button = "popup_item";

	var options = {
		renderItem: function(index,key,text){
			return $(this).append(text);
		}
	}

	$.extend(options, customoptions);

	if(!$.bindPopupClicked){
		$.bindPopupClicked = true;

		$(document).click(function(e){
			var className = String(e.target.className);
			if(className.indexOf(class_selectable_button) < 0){
				$(".popup").hide();
			}
		});
	}

	return this.each(function(){
		var button = $(this), i = 0, item, offsetButton = button.position()
		, wrap = $("<div />", {id: options.id, 'class': 'selectableList abs noshow popup ' + class_selectable_button})
		, buttonContent = $("<span />",{'class': 'button_content'})
		, list = $("<ul />");
		while(item = options.items[i++]){
			var li = $("<li />",{'class':class_selectable_button}).data({key: item[0], selectindex: i-1});
			list.append(options.renderItem.call(li, i-1, item[0], item[1]));
		}

		button.data({current: 0, value: options.items[0][0]});
		buttonContent.html(options.items[0][1]);
		
		button.empty().append(
			buttonContent,
			wrap
			.css({left: - 5 + "px", top: 1 + button.height() +"px",width: (options.width || button.width()) +"px", height: options.height || "auto"})
			.append(list)
		);
		/*button.after(
			wrap
			.css({left:offsetButton.left - 5 + "px", top:offsetButton.top + 1 + button.height() +"px",width: (options.width || button.width()) +"px", height: options.height || "auto"})
			.append(list)
		);*/

		var lies = list.find('> li'), press = function(){
			var el = $(this), data = el.data();
			lies.removeClass('selected');
			el.addClass('selected');
			options.clickItem.call(el,data.key);
			wrap.hide();
			button.data({current: data.selectindex, value: data.key});
			buttonContent.html(options.items[data.selectindex][1]);
		};

		lies.click(press);

		wrap.mousewheel(function(e){
			e.stopPropagation();
		}).click(function(e){
			e.stopPropagation();
		});

		buttonContent.addClass(class_selectable_button).click(function(e){
			$(".popup").filter(function(){
				return this.id != options.id
			}).hide();
			wrap.toggle();
		});

		button.on('updateSelect',function(event,val){
			
			press.call(lies.filter(function(){
				return $(this).data('key') == val;
			}));

		}).on('moveDir',function(event,dir){

			var sum = dir == "left" ? -1 : 1, val = button.data('current') + sum;
			val = val == options.items.length ? 0 : val < 0 ? options.items.length - 1 : val;
			press.call(lies.eq(val));
		});
	});

}

function appLang(vars){

	var target = this;

	this.vars = vars;

	this.parse = function(phrase,params,newparams){
		
		params = params.split(",");
		newparams = [];
		for(var x in params){
			newparams.push(target.vars[params[x]] || "@" + params[x]);
		}
		$(this).text(target.get(phrase,newparams));

	}

	this.get = function(phrase,params){
		return chrome.i18n.getMessage(phrase, params||[]);
	}

}

function Vector(a, c) {
    this.ang = a;
    this.size = c;
    this.x = Math.cos(Utils.toRad(a)) * c;
    this.y = -Math.sin(Utils.toRad(a)) * c;
}

var LAL;
function HelperExtend(target){
	
	this.constructMaps = function(){

		
		//maps //
	}
}

function CanvasHelper(main){

	var target = this, context;

	this.started = false;
	this.wrap = null;
	this.canvas = {};
	this.map = {};
	this.images = {};
	this.imagesLen = 0;
	this.imagesLoaded = 0;
	this.players = [];
	this.cfg = {
		font: "17px Arial black", 
		textBaseline: "alphabetic", 
		shadowColor: "#000", 
		shadowOffsetX: 1,
		shadowOffsetY: 1,
		shadowBlur: 1,
		fillStyle: "#fff",
		angleColor: "#FFE800"
	};
	//this.mobilePosition = {left:80, bottom: 15};
	this.mobileScale = 0.65;
	this.mobileAnimateSpeed = 0.2; //0~1

	this.constructCanvas = function(){

		this.canvas = document.createElement("canvas");
		context = this.canvas.getContext("2d");

		this.updateCanvas();

		$(this.canvas).appendTo(this.wrap);
	};

	this.init = function(appendTo){
		this.wrap = appendTo;
		this.constructCanvas();
	};

	this.addPreloadImage = function(id, url, callbackLoaded){
		if(typeof callbackLoaded == "undefined"){ //misc images
			$("<img />",{src: url});
			return;
		}

		this.imagesLen++;
		this.images[id] = new Image();
		this.images[id].onload = function(){
			target.imagesLoaded++;
			target.imagesLoaded >= target.imagesLen && (callbackLoaded.call(target));

		};
		this.images[id].src = url;
	};

	this.preloadedImages = function(callbackLoaded){
		var i = 0, j = 0;
		while(i < MOBILES.length){
			var mobileImageID = "mobile_" + i;
			this.addPreloadImage(mobileImageID,Utils.getMobileUrl(i), callbackLoaded);
			i++;
		}
		
		//preload misc
		while(j < MAPS.length){
			(MAPS[j][INDEX_MAP_ORDER]||1e3 < 4) && 
			this.addPreloadImage(0, GLOBALS.ASSETS_DIR + 'img/maps/'+ MAPS[j][INDEX_MAP_NAME].toLowerCase().replace(/\s+/g,"") +'.png');
			j++;
		}
	};

	this.updateCanvas = function(){
		var map = main.getMapObj();
		var mapWidth = GLOBALS.GAME.FRONTWIDTH; //800
		var mapHeight = Math.round(mapWidth / map[INDEX_MAP_WIDTH] * map[INDEX_MAP_HEIGHT]);

		this.map = {obj: map, width: mapWidth, height: mapHeight};

		this.canvas.width = this.map.width;
		this.canvas.height = this.map.height + main.mapSpaceTop + map[INDEX_MAP_MARGIN];

		context.font = target.cfg.font;
		context.textBaseline = target.cfg.textBaseline; //middle
		context.shadowColor = target.cfg.shadowColor;
		context.shadowOffsetX = target.cfg.shadowOffsetX;
		context.shadowOffsetY = target.cfg.shadowOffsetY;
		context.shadowBlur = target.cfg.shadowBlur;
		context.fillStyle = target.cfg.fillStyle;
		context.globalAlpha = 1;

	};

	
	this.addPlayer = function(key, x, y, width, height, velocity, direction, color, angle, drawAngle, mobile){

		var playerCount = this.players.push({
			key: key,
			x: x, 
			y: y,
			_x: 0,
			_y: 0,
			gameX: this.map.obj[INDEX_MAP_WIDTH] / this.map.width * x,
			gameY: this.map.obj[INDEX_MAP_HEIGHT] / this.map.height * y,
			width: width, 
			height: height, 
			velocity: velocity, 
			direction: direction,
			color: color,
			strength: !direction ? 0 : 1,
			angle: angle,
			drawAngle: !!drawAngle,
			mobile: mobile,
			mobiledir: 0,
			mobileanim: {frame: 0, offsetX: 0, time_anim: 0},
			data: {size:  Math.max(width,height) * 0.35}
		});

		this.updatePlayersPos();

		!this.started && (this.started = true, update());

		return this.players[playerCount - 1];

	};

	this.movePlayer = function(player, x, y){

		var X = 0, Y = 0;

		if(main.pressedPos){
			var left = Math.round(x - main.pressedPos.x);
			X = left + this.players[player]._x;
			X <= 0 && (X = 0);
			X >= this.map.width && (X = this.map.width);

			var top = Math.round(y - main.pressedPos.y);
			Y = top + this.players[player]._y;
			Y <= 0 && (Y = 0);
			Y >= this.map.height && (Y = this.map.height);
		}

		this.players[player].x = X;
		this.players[player].y = Y;
		this.players[player].gameX = this.map.obj[INDEX_MAP_WIDTH] / this.map.width * X;
		this.players[player].gameY = this.map.obj[INDEX_MAP_HEIGHT] / this.map.height * Y;

		this.players[0].mobiledir = this.players[0].x <= this.players[1].x ? 0 : 1;

	};

	this.updatePlayersPos = function(initialPosNoUpdate){
		var x = 0, player;
		while(player = this.players[x++]){
			player._x = player.x;
			player._y = player.y;
		}
	};

	this.updatePlayerAngle = function(player, angle){
		this.players[player].angle = angle;
	};

	this.updateMobile = function(mobileid){
		if(!this.players.length) return;

		this.players[0].mobileanim = {frame: 0, offsetX: 0, time_anim: 0};
		this.players[0].mobile = mobileid;
	};

	function drawPlayer(player){

		var textWidth;

		!player.direction ? (player.strength -= player.velocity) : (player.strength += player.velocity);
		!player.direction ? player.strength < 0 && (player.strength = 1) : player.strength > 1 && (player.strength = 0);

		context.save();

		context.shadowColor = '#fff';
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = 1;
		context.strokeStyle = player.color;

		context.beginPath();
		context.arc(player.x, player.y + main.mapSpaceTop, Math.max(player.data.size * player.strength - 2, 0), 0, Math.PI * 2, true);
		context.lineWidth = 4;
		context.globalAlpha = 0.3 * ( 1 - player.strength);
		context.stroke();

		context.beginPath();
		context.arc(player.x , player.y + main.mapSpaceTop, player.data.size * player.strength, 0, Math.PI * 2, true );
		context.lineWidth = 1;
		context.globalAlpha = 0.8 * ( 1 - player.strength );
		context.stroke();
		
		context.restore();


		if(player.drawAngle){
			drawAngle(player);
		}
		if(player.mobile !== -1){
			drawMobile(player);
		}else{

			context.shadowOffsetX = target.cfg.shadowOffsetX;
			context.shadowOffsetY = target.cfg.shadowOffsetY;
			context.fillStyle = "#ff0000";
			textWidth = context.measureText(player.key).width + target.cfg.shadowBlur;
			context.fillText(player.key, player.x - textWidth/2 , player.y + main.mapSpaceTop);

		}

	}

	function drawMobile(player){

		var mobileIndex = player.mobile, mobile = MOBILES[mobileIndex], mobileName = mobile[0], mobileOffsets = mobile[1];

		if(player.mobileanim.frame >= mobileOffsets.length){
			player.mobileanim.frame = 0;
			player.mobileanim.offsetX = 0;
		}

		var flipHOrig = !player.mobiledir
		, flipH = player.mobile == 2 || player.mobile == 11 ? !flipHOrig : flipHOrig
		, sourceWidth = mobileOffsets[player.mobileanim.frame][0]
		, sourceHeight = mobileOffsets[player.mobileanim.frame][1]
		, sourceX = player.mobileanim.offsetX
		, sourceY = 0
		, destWidth = sourceWidth * target.mobileScale
		, destHeight = sourceHeight * target.mobileScale
		/*, destX = target.mobilePosition.left + mobileOffsets[player.mobileanim.frame][2]
		, destY = target.canvas.height - target.mobilePosition.bottom - mobileOffsets[player.mobileanim.frame][3]*/
		, destX = player.x + mobileOffsets[player.mobileanim.frame][2] * target.mobileScale * (flipH ? 1 : -1)
		, destY = player.y - mobileOffsets[player.mobileanim.frame][3] * target.mobileScale + main.mapSpaceTop ;
		
		context.save();

		if(flipH){
			destX = target.canvas.width - destX;
			context.translate(target.canvas.width, 0);
			context.scale(-1, 1);
		}

        	context.drawImage(target.images["mobile_" + mobileIndex], sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
        	context.restore();

		player.mobileanim.time_anim += target.mobileAnimateSpeed;

		if(player.mobileanim.time_anim >= 1){
			player.mobileanim.time_anim = 0;
			player.mobileanim.frame++;
			player.mobileanim.offsetX += sourceWidth + 1;
		}
        	
		
	}

	function drawLine(){
		var player;

		if(!(player = target.players[main.current.playercapture])) return;
		
		context.save();

		context.lineWidth = 1;
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = 0;
		context.strokeStyle = player.color;

		context.beginPath();
		context.moveTo(player.x, 0);
		context.lineTo(player.x, target.map.height + main.mapSpaceTop);
		context.stroke();

		context.beginPath();
		context.moveTo(0, player.y + main.mapSpaceTop);
		context.lineTo(target.map.width, player.y + main.mapSpaceTop);
		context.stroke();

		context.restore();

	}

	function drawAngle(player){

		var angle = player.mobiledir ? 180 - player.angle : player.angle
		, circle = player.mobiledir ? 180 : 270, circlespacing = player.width / 8, textWidthAngle, textAngle;


		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = 0;

		//background
		context.beginPath();
		//context.arc(player.x, player.y + player.height, player.width / 4, Utils.toRad(0), Utils.toRad(360));
		context.arc(player.x, player.y + main.mapSpaceTop, player.width / 4, Utils.toRad(0), Utils.toRad(360));
		context.lineWidth = player.width/2;
		context.strokeStyle = "rgba(0,255,0,0.05)";
		context.stroke();

		//angle portion
		context.beginPath();
		context.arc(player.x, player.y + main.mapSpaceTop, player.width / 4 + (circlespacing/2), Utils.toRad(circle), Utils.toRad(circle+90));
		context.lineWidth = player.width/2 - circlespacing;
		context.strokeStyle = "rgba(0,255,0,0.25)";
		context.stroke();

		//angle line
		context.save();
		context.beginPath();
		context.strokeStyle = "#00ff00";
		context.translate( player.x, player.y + main.mapSpaceTop);
		context.rotate(-Utils.toRad(angle));
		context.translate( - player.x, - (player.y + main.mapSpaceTop));
		context.lineWidth = 1;
		context.moveTo(player.x, player.y + main.mapSpaceTop);
		context.lineTo(player.x + player.width /2, player.y + main.mapSpaceTop);
		context.stroke();
		context.restore();
		/*context.save();
		context.beginPath();
		context.strokeStyle = "#00ff00";
		context.translate( player.x, player.y + player.height);
		context.rotate(-Utils.toRad(angle));
		context.translate( - player.x, - (player.y + player.height));
		context.lineWidth = 1;
		context.moveTo(player.x, player.y + player.height);
		context.lineTo(player.x + player.width /2, player.y + player.height);
		context.stroke();
		context.restore();*/

		//angle 
		/*textAngle = player.angle + "";
		context.save();
		context.shadowOffsetX = 1;
		context.shadowOffsetY = 1;
		context.shadowBlur = 2;
		context.font = "22px Arial black";
		context.fillStyle = target.cfg.angleColor;
		
		textWidthAngle = context.measureText(textAngle).width + context.shadowBlur;

		context.fillText(textAngle, player.x - textWidthAngle/2 , player.y + player.height - player.height/4);
		context.restore();*/

	}

	function render(){
		main.playerIsPressed && drawLine();
		var i = 0, player;

		while(player = target.players[i++]){
			drawPlayer(player);
		}
	}

	function update(){
		context.clearRect( 0, 0, target.canvas.width, target.canvas.height);
		render();
		requestAnimFrame(update);
	};

}
