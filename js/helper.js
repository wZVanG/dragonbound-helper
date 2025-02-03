"use strict";

$.cssEase['bounce'] = 'cubic-bezier(0,1,0.5,1.3)';
$.fx.speeds._default = 200;

var BG = chrome.extension.getBackgroundPage();
var Lang;
var GLOBALS = BG.GLOBALS || {};
var MOBILES_VALUES = new MOBILES_Class();
var ExtendUI;

var
	INDEX_MAP_NAME = 0,
	INDEX_MAP_WIDTH = 1,
	INDEX_MAP_HEIGHT = 2,
	INDEX_MAP_COLOR = 6,
	INDEX_MAP_MARGIN = 7,
	INDEX_MAP_ORDER = 8,
	INDEX_MOBILE_NAME = 0,
	INDEX_MOBILE_BOUNDS = 1;
var KEYS = $.extend($.ui.keyCode, { SHIFT: 16, CTRL: 17, W: 87, S: 83, A: 65, D: 68 });

function Helper() {
	var target = this;

	$.extend(this, { lal: 1 });

	this.config = {
		get: function (key, default_value) {
			if (typeof localStorage[key] !== "undefined") {
				return localStorage[key];
			}
			return default_value;
		},
		set: function (key, value, callback) {
			localStorage[key] = value;
			typeof callback === "function" && callback(value, target)
		}
	};

	this.selectors = {};
	this.current = {
		map: +this.config.get("config_map", DEFAULT_MAP),
		mobile: +this.config.get("config_mobile", DEFAULT_MOBILE),
		angle: +this.config.get("config_angle", 55),
		wind: { value: 0, angle: 0 }, playercapture: 0, scale: [1, 1]
	};
	this.players = {};

	this.playerIsPressed = 0;
	this.selfKey = +this.config.get("selfKey", KEYS.A);
	this.oponentKey = +this.config.get("oponentKey", KEYS.D);
	this.pressedPos = false;

	this.mapSpaceTop = 100;
	this.CanvasPlayers = new CanvasHelper(this);

	this.intervalAngleUp = 0;
	this.intervalAngleDown = 0;

	this.indexTabElement = -1;
	this.bussy = 0;
	this.loadingTimeout = 0;

	this.tabElements = {
		windValue: function () {
			$(this).select();
		},
		angle: function () {
			$(this).select();
		}
	};

	this.resize = function () {
		var x = window.innerWidth / 800, y = window.innerHeight / 600;
		target.current.scale = [x, y];
		target.$("#main").css({ 'webkit-transform': 'scale(' + x + ',' + y + ')' });
	};

	this.$ = function (selector) { //lazy
		return this.selectors[selector] || (this.selectors[selector] = $(selector));
	};

	this.addMobile = function (mobile_id) {

		//this.$("#mobile_button").text(MOBILES[mobile_id][0]);

	};

	this.addMap = function (map_id) {
		if (this.bussy) return;

		this.bussy = true;

		var obj = target.$("#graph_map")
			, mapName = MAPS[map_id][INDEX_MAP_NAME]
			//, url = 'img/maps/'+ mapName.toLowerCase().replace(/\s+/g,"")+'.png',
			, url = GLOBALS.ASSETS_DIR + 'img/maps/' + mapName.toLowerCase().replace(/\s+/g, "") + '.png'
			, image = $("<img />")
			, loaded = function () {
				var width = image[0].width, height = image[0].height;

				obj.transition({ y: 50, opacity: 0 }, function () {
					obj.css({
						background: 'transparent url(' + url + ') no-repeat 0 0',
						height: height + MAPS[map_id][INDEX_MAP_MARGIN] + "px",
					}).transition({ y: 0, opacity: 1 });
					$("body").css('background-color', MAPS[map_id][INDEX_MAP_COLOR]);
					target.$("#loading").fadeOut();
					target.updateMapSize();
				});
				target.loadingTimeout && clearTimeout(target.loadingTimeout);
				target.bussy = false;

			};

		this.loadingTimeout = setTimeout(function () {
			target.$("#loading").fadeIn();
		}, 300);

		image.attr('src', url).bind('load', loaded);
		//this.$("#map_button").text(mapName);

	};

	this.addPlayer = function () {
		return this.CanvasPlayers.addPlayer.apply(this.CanvasPlayers, arguments);
	};

	this.updateMapSize = function () {

		var map = this.getMapObj();
		target.$('#graph_players').css({
			height: Math.round(GLOBALS.GAME.FRONTWIDTH / map[INDEX_MAP_WIDTH] * map[INDEX_MAP_HEIGHT]) + target.mapSpaceTop + map[INDEX_MAP_MARGIN] + "px"
		});
		target.CanvasPlayers.updateCanvas();
	};

	this.updatePower = function (num) {
		if (!target.players[0]) return;

		var me = target.players[0], oponent = target.players[1], dir = me.gameX >= oponent.gameX;

		var mobileObj = getMobileById(target.current.mobile)[1]
			, aim = new Vector(mobileObj.aim[0][0], mobileObj.aim[0][1])
			, pos_aim = { x: 0, y: 0 }
			, adukafix = (target.current.mobile == 2 || target.current.mobile == 11) ? -1 : 1, m = {
				l: (-aim.x) * adukafix,
				t: (aim.y)
			}, reverse = !dir /*dir*/ ? 1 : -1, pos = -Utils.toAngle(Math.atan2(m.t, m.l)) * reverse;

		var top = aim.y;

		pos_aim = new Vector(20 + pos, -(m.l + m.t) / 1.5);

		if (!dir) {
			pos_aim.x = -pos_aim.x;
			pos_aim.y = -pos_aim.y;
		}

		var meX = me.gameX + Math.round(pos_aim.x);
		var meY = me.gameY + Math.round(pos_aim.y);

		function powerDone(power) {

			var offsetLeftBar = 10, powerText = Utils.powerFormat(power);

			$("#result_text").text(powerText);
			$("#result_bar").css({ width: power + offsetLeftBar + "px" });

			BG.Helper.onPowerChange({ power: powerText });
		}

		if (num === 0) return powerDone(0);

		gp(
			target.current.mobile,
			Math.round(meX),
			Math.round(meY),
			isNaN(target.current.angle) ? 45 : target.current.angle,
			me.mobiledir ? 0 : 1,
			isNaN(target.current.wind.value) ? 0 : target.current.wind.value,
			isNaN(target.current.wind.angle) ? 0 : target.current.wind.angle,
			Math.round(oponent.gameX),
			Math.round(oponent.gameY),
			0,
			powerDone
		);

	};

	this.getMapObj = function () {
		return MAPS[target.current.map];
	};

	this.keyUpdateAngle = function (up) {
		if (!this.intervalAngleUp && !this.intervalAngleDown) {

			var timeOld = Date.now(), tempAngle = target.current.angle;

			up ? (this.intervalAngleUp = setInterval(function () {
				var angle = tempAngle + Math.floor((Date.now() - timeOld) / 65);
				angle > 90 && (angle = 90);
				target.current.angle = angle;
				target.$("#angle").spinner("value", angle);

			}, 50))
				: (this.intervalAngleDown = setInterval(function () {
					var angle = tempAngle - Math.floor((Date.now() - timeOld) / 65);
					angle < 0 && (angle = 0);
					target.current.angle = angle;
					target.$("#angle").spinner("value", angle);
				}, 50))

		}
	};

	this.keyEndAngle = function (up) {
		up ? (this.intervalAngleUp = clearInterval(this.intervalAngleUp)) : (this.intervalAngleDown = clearInterval(this.intervalAngleDown));
	};

	this.init = function () {

		this.addMap(this.current.map);
		this.addMobile(this.current.mobile);

		this.CanvasPlayers.preloadedImages(function () {
			this.init($("#graph_players"));
			target.players[0] = target.addPlayer(String.fromCharCode(target.selfKey) || "!", 800 / 3, 0, 100, 100, 0.025, 1, '#00ff00', target.current.angle, true, target.current.mobile);
			target.players[1] = target.addPlayer(String.fromCharCode(target.oponentKey) || "(!)", 800 / 3 * 2, 0, 100, 100, 0.045, 1, '#ff0000', 0, false, -1);
			target.updateMapSize();
			target.updatePower(0);

			$("#self_key").val(target.selfKey);
			$("#oponent_key").val(target.oponentKey);
			$(".keycode").trigger("change");

			if (!localStorage["first_open"]) {
				localStorage["first_open"] = 1;
				setTimeout(function () {
					$("#help_button").trigger("click");
				}, 2e3);
			}

			localStorage["calculator_uses"] = (+localStorage["calculator_uses"] || 0) + 1;
			if (+localStorage["calculator_uses"] >= 3) $("#dba").addClass("enabled");
		});

		this.current.watch("mobile", function (a, e, newval) {
			target.CanvasPlayers.updateMobile(+newval);
			setTimeout(function () {
				target.updatePower(0);
			}, 1);
			target.config.set("config_mobile", newval);
			return +newval;
		});

		this.current.watch("angle", function (a, e, newval) {
			target.CanvasPlayers.updatePlayerAngle(0, newval);
			setTimeout(function () {
				target.updatePower(0);
			}, 1);
			target.config.set("config_angle", newval);
			return +newval;
		});
		this.current.wind.watch("value", function (a, e, newval) {
			setTimeout(function () {
				target.updatePower(0);
			}, 1);
			return +newval;
		});
		this.current.wind.watch("angle", function (a, e, newval) {
			setTimeout(function () {
				target.updatePower(0);
			}, 1);
			return +newval;
		});

		this.initDOM();

	};

	this.initDOM = function () {

		//lang dom objects
		Lang = new appLang({
			"VERSION": GLOBALS.EXT_DETAILS.version,
			"APPNAME": GLOBALS.EXT_DETAILS.name,
			"PAGE_URL": GLOBALS.PAGE_URL
		});

		$("[data-lang]").each(function () {
			var el = $(this), data = el.data();
			Lang.parse.call(el, data.lang, data.langparams || "");
		});
		//lang dom objects //

		$(window).bind('resize', this.resize).trigger('resize').keydown(function (e) {

			switch (e.keyCode) {
				case KEYS.SHIFT:
				case target.selfKey:
					target.playerIsPressed = 1;
					target.current.playercapture = 0;
					e.preventDefault();

					break;

				case KEYS.CTRL:
				case target.oponentKey:
					target.playerIsPressed = 1;
					target.current.playercapture = 1;
					e.preventDefault();

					break;
				case KEYS.UP: case KEYS.W:
					target.keyUpdateAngle(true);
					e.preventDefault();

					break;
				case KEYS.DOWN: case KEYS.S:
					target.keyUpdateAngle(false);
					e.preventDefault();

					break;
				case KEYS.SPACE:
					target.updatePower();
					e.preventDefault();
					e.preventDefault();
					break;
				case KEYS.TAB:

					var keyElements = Object.keys(target.tabElements)
						, oldElement = target.indexTabElement
						, indexElement = target.indexTabElement + 1 * (e.shiftKey ? -1 : 1)
						, keyElement;

					indexElement >= keyElements.length && (indexElement = 0);
					indexElement < 0 && (indexElement = keyElements.length - 1);

					target.indexTabElement = indexElement;
					keyElement = keyElements[target.indexTabElement];

					target.tabElements[keyElement].call(target.$("[data-tabindex='" + keyElement + "']"));
					target.$("[data-tabindex='" + keyElements[oldElement] + "']").blur();

					e.preventDefault();

					break;
				case KEYS.ESCAPE:
					$(".popup").hide();
					$("#dba").removeClass("active");
					break;
			}

		}).keyup(function (e) {

			switch (e.keyCode) {
				case KEYS.SHIFT:
				case KEYS.CTRL:
				case target.selfKey:
				case target.oponentKey:
					target.playerIsPressed = 0;
					target.pressedPos = false;
					target.CanvasPlayers.updatePlayersPos();
					e.preventDefault();
					e.stopPropagation();
					break;
				case KEYS.UP: case KEYS.W:
					target.keyEndAngle(true);
					e.preventDefault();
					e.stopPropagation();
					break;
				case KEYS.DOWN: case KEYS.S:
					target.keyEndAngle(false);
					e.preventDefault();
					e.stopPropagation();
					break;
			}

		}).bind('blur', function () {
			target.playerIsPressed = 0;
			target.pressedPos = false;
			target.CanvasPlayers.updatePlayersPos();

		}).bind('contextmenu selectstart', function (e) {
			e.preventDefault();
		}).bind('beforeunload', function () {
			BG.Helper.onClosePopup();
		}).mousewheel(function (e, delta) {
			target.$("#angle").spinner("step" + (delta < 0 ? "Down" : "Up"))
		});

		window.addEventListener("mousemove", function (e) {
			if (target.playerIsPressed) {

				var containerleft = 0, containerTop = 0, cameraLeft = 0, cameraTop = 0;

				var leftP = (800 / (800 * target.current.scale[0])) * (e.pageX - containerleft),
					topP = (600 / (600 * target.current.scale[1])) * (e.pageY - containerTop);

				var finalLeft = leftP - cameraLeft;
				var finalTop = topP - cameraTop;

				if (!target.pressedPos) {
					target.pressedPos = { x: finalLeft, y: finalTop };
				}
				target.CanvasPlayers.movePlayer(target.current.playercapture, finalLeft, finalTop);

				target.updatePower(0);

			}
		});

		//fx
		setTimeout(function () {
			$("#logo div").addClass('show');
			setTimeout(function () {
				target.$("#windmark").addClass('show');
				setTimeout(function () {
					target.$("#windmark").addClass('normalmove');
				}, 1050);
			}, 500);
		}, 300);
		//fx

		//config
		var dialog, dialogButtons = {}, dialogHelp = $("#help").dialog({
			autoOpen: !1,
			height: 360,
			width: 480,
			modal: !0,
			dialogClass: 'config-modal',
			hide: { effect: "fade", duration: 150 },
			buttons: dialogButtons,
			draggable: !1,
			resizable: !1,
			close: function () {

			}
		});
		/*dialogButtons["Guardar cambios"] = $.noop;
		dialogButtons["Cancelar"] = function(){
			dialog.dialog("close");
		};*/

		dialog = $("#config").dialog({
			autoOpen: !1,
			height: 360,
			width: 480,
			modal: !0,
			dialogClass: 'config-modal',
			hide: { effect: "fade", duration: 150 },
			buttons: dialogButtons,
			draggable: !1,
			resizable: !1,
			close: function () {

			}
		});

		$("#config_button").click(function () {
			dialog.dialog("open");
		});
		$("#help_button").click(function () {
			dialogHelp.dialog("open")
		});

		$("#get_power_button").click(function () {
			target.updatePower();
		});

		$("#btn-dba").click(function () {
			$("#dba").toggleClass("active");
		});
		$("#btn-close-dba").click(function () {
			$("#dba").removeClass("active");
		});

		$(".keycode").each(function () {
			var select = $(this), keys = {
				"Q": 81,
				"E": 69,
				"A": 65,
				"D": 68,
				"Z": 90,
				"C": 67,
				"X": 88,
				"SHIFT": $.ui.keyCode.SHIFT,
				"CTRL": $.ui.keyCode.CTRL,
				"ENTER": $.ui.keyCode.ENTER,
				"ESCAPE": $.ui.keyCode.ESCAPE,
			};
			$.each(keys, function (key, value) {
				select.append($("<option>", { value: value, text: "[" + key + "]" }));
			});

		}).change(function () {
			var el = $(this), type = el.data("keytype"), val = +el.val();
			target[type] = val;
			target.config.set(type, val);


			target.players[type == 'selfKey' ? 0 : 1].key = [81, 69, 65, 68, 90, 67, 88].indexOf(val) !== -1 ? String.fromCharCode(val) : "(!)";
		});

		//config //

		//element click to tab works
		$("[data-tabindex]").click(function () {
			var el = $(this), tabindex = el.data().tabindex;
			target.indexTabElement = Object.keys(target.tabElements).indexOf(tabindex);
			target.tabElements[tabindex].call(el);
		});

		//element click to tab works

		//mobile (7: RANDOM)

		var mobile_button = target.$("#mobile_button");
		$(".button_arrow", target.$("#select_mobile")).click(function () {
			mobile_button.trigger('moveDir', [$(this).data().dir]);
		})

		var i = -1, mobileItems = [];
		while (i++ + 1 < MOBILES.length) i !== 7 && mobileItems.push([i, MOBILES[i][0]]);

		mobile_button.selectList({
			items: mobileItems, id: 'mobileListWrap', clickItem: function (key) {
				target.addMobile(target.current.mobile = key);
			}
		});

		mobile_button.trigger('updateSelect', [target.current.mobile]);
		//mobile

		//angle
		var angleInput = $("#angle");
		angleInput.val(target.current.angle).spinner({
			min: 0,
			max: 90,
			spin: function (event, ui) {
				//target.$("#mobile_draw_angle").css({rotate: "-" + ui.value + "deg" });
				target.current.angle = ui.value;
				setTimeout(function () {
					angleInput.val(Utils.pad0(+angleInput.val()));
				}, 1);

			},
			change: function (event, ui) {
				//target.$("#mobile_draw_angle").css({rotate: "-" + +this.value + "deg" });
				$(this).trigger('change');
			}
		})
			.blur(function () {
				var el = this;
				setTimeout(function () {
					el.value = Utils.pad0(+el.value);
				}, 1);
			})
			.change(function () {
				target.current.angle = +this.value;
			}).keydown(function () {
				var el = this;
				setTimeout(function () {
					var val = +el.value.replace(/[^\d]+/, "");
					isNaN(val) && (val = 0);
					val > 90 && (val = 90);

					el.value = val;
					//target.$("#mobile_draw_angle").css({rotate: "-" + el.value + "deg" });
					target.current.angle = el.value;
				}, 1);
			}).bind('paste', function (e) {
				e.preventDefault();
			}).mousewheel(function (e) {
				e.stopPropagation();
			}).onlyNumber();
		//angle end

		//wind
		var windObj = target.$("#wind"), windnumInput = $("#windvalue"), windWidth = windObj.width(), windHeight = windObj.height();
		windObj.click(function (event) {
			var xSize = windWidth / 2, ySize = windHeight / 2, angle = Utils.toAngle(Math.atan2(event.offsetY - ySize, event.offsetX - xSize));

			angle = angle > 0 ? ((180 - angle) + 180) * -1 : angle;

			target.current.wind.angle = Math.abs(angle);

			target.$("#windmark").css({
				rotate: angle
			});

		}).mousewheel(function (e, a) { windnumInput.windspinner("step" + (a < 0 ? "Down" : "Up")) });

		windnumInput.windspinner({
			spin: function (event, ui) {
				Utils.windClass.call(this, ui.value);
				target.current.wind.value = ui.value;
			},
			change: function (event, ui) {
				Utils.windClass.call(this);
				$(this).trigger('change');
			}
		})//.focus(function(){windnumInput.select(); console.info('focus')})
			.change(function () {
				target.current.wind.value = +this.value;
			}).keydown(function (e) {
				var el = this;
				setTimeout(function () {
					var val = +el.value;
					isNaN(val) && (val = 0);
					val > 50 && (val = 50);
					target.current.wind.value = val;
					el.value = val;
				}, 1);
			}).blur(function () {
				var el = this;
				setTimeout(function () {
					el.value = Utils.pad0(+el.value);
				}, 1);
			}).bind('paste', function (e) {
				e.preventDefault();
			}).mousewheel(function (e) {
				e.stopPropagation()
			}).onlyNumber();
		//wind end

		// maps
		var mapbuttonWrap = target.$("#select_map"), map_button = target.$("#map_button"), MAPS_ORDER = MAPS.slice(0);

		$('.button_arrow', mapbuttonWrap).click(function () {

			if (target.bussy) return;
			map_button.trigger('moveDir', [$(this).data().dir]);

		});

		MAPS_ORDER.filter(function (map, key) {
			var _map = MAPS_ORDER[key];
			_map[INDEX_MAP_ORDER] = _map[INDEX_MAP_ORDER] || _map[INDEX_MAP_NAME].charCodeAt(0);
			map[map.length] = key;
			return !0
		});
		MAPS_ORDER.sort(function (a, b) {
			return a[INDEX_MAP_ORDER] < b[INDEX_MAP_ORDER] ? -1 : a[INDEX_MAP_ORDER] > b[INDEX_MAP_ORDER] ? 1 : 0;
		});

		var i = 0, map, maplist = [];
		while (map = MAPS_ORDER[i++]) maplist.push([map[map.length - 1], map[INDEX_MAP_NAME]]);

		map_button.selectList({
			items: maplist, id: "mapListWrap", renderItem: function (index, key, text) {
				var el = $(this)
					, image = $("<img />", { src: 'img/thumbmaps/' + text.toLowerCase().replace(/\s+/g, "") + '.png', 'class': 'icon' })
					, span = $("<span />", { text: text }), wrap = $("<span />").append(image).append(span);
				return el.append(wrap);
			}, clickItem: function (key) {
				target.addMap(target.current.map = key);
				target.config.set("config_map", key);
			}, height: 350
		});

		map_button.trigger('updateSelect', [target.current.map]);


	};
}

var wZ;
BG.Helper.onOpenPopup();

$(document).ready(function () {
	wZ = new Helper();
	wZ.init();
});


function MOBILES_Class() {

	this.ARMOR = [0, { min: 10, max: 55, aim: [[52, 33], [52, 33], [52, 33]], name: 'Tank' }];
	this.ICE = [1, { min: 20, max: 70, aim: [[58, 50], [40, 40], [40, 40]], name: 'Gum' }];
	this.ADUKA = [2, { min: 10, max: 70, aim: [[130, 40], [130, 40], [130, 40]], name: 'Aduka' }];
	this.LIGHTNING = [3, { min: 18, max: 40, aim: [[58, 44], [58, 44], [58, 44]], name: 'Lightning' }];
	this.BIGFOOT = [4, { min: 20, max: 45, aim: [[58, 50], [58, 50], [58, 50]], name: 'Big Foot' }];
	this.JD = [5, { min: 15, max: 65, aim: [[68, 45], [68, 45], [68, 45]], name: 'JD' }];
	this.ASATE = [6, { min: 20, max: 60, aim: [[40, 30], [40, 30], [40, 30]], name: 'Ufo' }];
	this.RANDOM = [7, { min: 15, max: 75, aim: [[51, 51], [51, 51], [51, 51]], name: 'Random' }];
	this.KNIGHT = [8, { min: 15, max: 75, aim: [[51, 51], [51, 51], [51, 51]], name: 'Knight' }];

	this.FOX = [9, { min: 20, max: 70, aim: [[30, 44], [30, 44], [30, 44]], name: 'Fox' }];
	//this.DRAGON 	= [10, {a:90.0,b:0.74,min:20,max:50,aim:[[58,50],[58,50],[58,50]],name:'Dragon'}];
	this.DRAGON = [10, { min: 20, max: 45, aim: [[58, 50], [58, 50], [58, 50]], name: 'DRAGON' }];

	this.NAK = [11, { min: 10, max: 55, aim: [[130, 40], [130, 40], [130, 40]], name: 'Nak' }];

	this.TRICO = [12, { min: 10, max: 55, aim: [[51, 51], [51, 51], [51, 51]], name: 'Trico' }];
	this.MAGE = [13, { min: 10, max: 55, aim: [[51, 51], [51, 51], [51, 51]], name: 'Knight' }];
	this.TURTLE = [14, { min: 10, max: 55, aim: [[51, 51], [51, 51], [51, 51]], name: 'Knight' }];
}


function getMobileById(id) {
	for (var x in MOBILES_VALUES) {
		if (MOBILES_VALUES[x][0] == id) return MOBILES_VALUES[x];
	}
	return MOBILES_VALUES.ARMOR;
}


var act;
function gp() {

	var args = Array.prototype.slice.call(arguments), callback = args.pop(), btn = $("#get_power_button div");
	btn.addClass("active");

	console.log("args", args);

	/*
		--- Aviso /!\ ---

		En esta extensión no encontrarás ninguna función o lógica para calcular la fuerza.
		Esto se consulta a la página que se muestra abajo, sin embargo hay varias restricciones
		para realizar la consulta debido a que solo nuestros sitios tendrán acceso.

		¡ No te molestes en intentarlo !

		http://dragonboundaimbot.com/app/power

	*/

	$.getJSON("https://dragonbound-helper-api.vercel.app/app/power", { d: args.map(function (a) { return ~~(+a) }).join(","), k: "daaf64feaaa5e6ffeef4ffaafdccd52a" }, function (data) {
		typeof callback === "function" && callback((data || {}).p || 0);
		btn.removeClass("active");
	});

}