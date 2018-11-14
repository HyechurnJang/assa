function showCommand(command_id) {
	$.ajax({
        url: "/api/command/" + command_id,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	showCommandPanel(data);
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function showCommandPanel(data) {
	$("#setting-panel-save-button-wrap").html('<button class="btn btn-lg btn-outline-secondary non-radius non-border" type="button" onclick="saveCommand();"><i class="fas fa-save"></i> Save</button>');
	if (data) {
		$("#command-title").html("Edit Command");
		$("#command-id").val(data.id);
		$("#command-name").val(data.name);
		$("#command-text").val(data.text);
		$("#command-vars").html(data.vars.join(', '));
	} else {
		$("#command-title").html("New Command");
		$("#command-id").val(null);
		$("#command-name").val("");
		$("#command-text").val("");
		$("#command-vars").html("");
	}
	showSettingPanel("setting-command");
}

function saveCommand() {
	var command_id = $("#command-id").val();
	var name = $("#command-name").val();
	var text = $("#command-text").val();
	if (command_id != "") {
		var url = "/api/command/" + command_id;
		var method = "PUT";
	} else {
		var url = "/api/command";
		var method = "POST";
	}
	$.ajax({
        url: url,
        type: method,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({name: name, text: text}),
        success: function(data) {
        	showCommand(data.id);
        	getCommandTable();
        	getWorkFlowTable();
        },
        error: function(xhr, status, thrown) {
        	window.alert("error");
		}
    });
}

function deleteCommands() {
	var id = $(".command-delete-selected:checked").map(function() {return $(this).attr("command_id");}).get();
	if (id.length > 0) {
		$.ajax({
	        url: "/api/delete/commands",
	        type: "POST",
	        contentType: "application/json; charset=utf-8",
	        dataType: "json",
	        data: JSON.stringify({id: id}),
	        success: function(data) {
	        	hideSettingPanel();
	        	getCommandTable();
	        	getWorkFlowTable();
	        },
	        error: function(xhr, status, thrown) {
	        	window.alert("error");
			}
	    });
	}
}