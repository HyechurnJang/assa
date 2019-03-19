
var history_result = [];

function setTaskHistorySelector() {
	$.ajax({
        url: "/history",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	var selector = $("#task-history-selector");
        	selector.empty();
        	$.each(data, function(index, item) {
        		selector.append(`<option value="${item}">${item}</option>`);
        	});
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function getTaskHistoryDetail() {
	var id = $("#task-history-selector").val();
	$.ajax({
        url: "/history/" + id,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	var box = $("#task-history-box");
        	history_result = data;
        	box.empty();
        	$.each(data, function(index, device) {
        		if (device.error == true) {
        			box.append(`
<div class="col col-left-align clickable"><span class="badge badge-danger" onclick="showTaskHistoryConsolePanel(history_result[${index}]);">${device.name}</span></div>
	        		`);
        		} else {
        			box.append(`
<div class="col col-left-align clickable"><span class="badge badge-primary" onclick="showTaskHistoryConsolePanel(history_result[${index}]);">${device.name}</span></div>
	        		`);
        		}
        	});
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function delTaskHistory() {
	var id = $("#task-history-selector").val();
	$.ajax({
        url: "/history/" + id,
        type: "DELETE",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	setTaskHistorySelector();
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function showTaskHistoryConsolePanel(device) {
	var con = $("#task-history-console");
	con.empty();
	$.each(device.commands, function(index, command) {
		con.append('<p class="console-label">#### ' + command.name + " : " + command.id + " ####</p>");
		$.each(command.result, function(index_2, lines) {
			con.append(lines.join("<br/>"));
		});
	});
	
	if ($("#task-history-console-panel-wrap").hasClass("hide")) {
		$("#task-history-console-panel-wrap").removeClass("hide");
	}
}

function hideTaskHistoryConsolePanel() {
	if ($("#task-history-console-panel-wrap").hasClass("hide") == false) {
		$("#task-history-console-panel-wrap").addClass("hide");
	}
}
