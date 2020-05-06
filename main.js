function BackgroundHelper(){
	this.badge = function(text){
		chrome.browserAction.setBadgeText({text: text + ""})
	};

	this.onPowerChange = function(obj){
		this.badge(obj.power);
	};

	

	this.onOpenPopup = function(){

	};

	this.onClosePopup = function(){
		this.badge("");
	};

	this.getApps = function(){
		return {
			calculator: {
				title: "Calculator", 
				run: function(){
					chrome.tabs.create({
						url: chrome.extension.getURL(GLOBALS.URL_HELPER),
						active: false
					}, function(tab) {
						chrome.windows.create({
							tabId: tab.id,
							type: "popup",
							focused: true,
							width: 800,
							height: 600
						});
					});
				},
				enabled: true
			},
			findroom: {
				title: "Busca sala",
				run: function(){

				},
				label: '(pronto)',
				enabled: false
			},
			autokick: {
				title: "AutoKick",
				run: function(){

				},
				label: '(pronto)',
				enabled: false
			}
		}
	};

}

var Helper = new BackgroundHelper();

chrome.browserAction.setBadgeBackgroundColor({color:[0, 0, 0, 255]});