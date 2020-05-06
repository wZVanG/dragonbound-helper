var BG = chrome.extension.getBackgroundPage();

$(document).ready(function(){

	var apps = BG.Helper.getApps(), apps_wrap = $(".apps");

	for(var name in apps){
		var app = apps[name], label = app.label ? " <small>" + app.label  + "</small>" : ""
		, div = $("<div>", {html: app.title + label}).click(app.run||$.noop);
		!app.enabled && div.addClass("disabled");
		apps_wrap.append(div);
	}

})