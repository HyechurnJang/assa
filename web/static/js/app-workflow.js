function showWorkFlow(workflow_id) {
	$.ajax({
        url: "/api/workflow/" + workflow_id,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	showWorkFlowPanel(data);
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function showWorkFlowPanel(data) {
	$.ajax({
        url: "/api/command",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	var workflow_selector = $("#workflow-selector");
        	workflow_selector.empty();
        	$.each(data, function(index, command) {
        		workflow_selector.append(`<option value="${command.id}">${command.name}</option>`);
        	});
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
	$("#setting-panel-save-button-wrap").html('<button class="btn btn-lg btn-outline-secondary non-radius non-border" type="button" onclick="saveWorkFlow();"><i class="fas fa-save"></i> Save</button>');
	if (data) {
		$("#workflow-title").html("Edit Workflow");
		$("#workflow-id").val(data.id);
		$("#workflow-name").val(data.name);
		var workflow_items = $("#workflow-items");
		workflow_items.empty();
		$.each(data.commands, function(index, command) {
			workflow_items.append(`
<div class="input-group">
	<span class="form-control gbox-middle workflow-command-selected" command_id="${command.id}">${command.name}</span>
	<div class="input-group-append">
		<button class="btn btn-outline-secondary gbox-middle" type="button" onclick="$(this).parent().parent().remove();">
			<small><i class="fas fa-minus"></i></small>
		</button>
	</div>
</div>
			`);
		});
	} else {
		$("#workflow-title").html("New Workflow");
		$("#workflow-id").val(null);
		$("#workflow-name").val("");
		$("#workflow-items").empty();
	}
	showSettingPanel("setting-workflow");
}

function saveWorkFlow() {
	var workflow_id = $("#workflow-id").val();
	var name = $("#workflow-name").val();
	var commands = $(".workflow-command-selected").map(function() {return $(this).attr("command_id");}).get();
	if (workflow_id != "") {
		var url = "/api/workflow/" + workflow_id;
		var method = "PUT";
	} else {
		var url = "/api/workflow";
		var method = "POST";
	}
	$.ajax({
        url: url,
        type: method,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({name: name, commands: commands}),
        success: function(data) {
        	showWorkFlow(data.id);
        	getWorkFlowTable();
        },
        error: function(xhr, status, thrown) {
        	window.alert("error");
		}
    });
}

function deleteWorkFlows() {
	var id = $(".workflow-delete-selected:checked").map(function() {return $(this).attr("workflow_id");}).get();
	if (id.length > 0) {
		$.ajax({
	        url: "/api/delete/workflows",
	        type: "POST",
	        contentType: "application/json; charset=utf-8",
	        dataType: "json",
	        data: JSON.stringify({id: id}),
	        success: function(data) {
	        	hideSettingPanel();
	        	getWorkFlowTable();
	        },
	        error: function(xhr, status, thrown) {
	        	window.alert("error");
			}
	    });
	}
}

function addWorkFlowCommand() {
	$("#workflow-items").append(`
<div class="input-group">
	<span class="form-control gbox-middle workflow-command-selected" command_id="${$("#workflow-selector").val()}">${$("#workflow-selector option:selected").text()}</span>
	<div class="input-group-append">
		<button class="btn btn-outline-secondary gbox-middle" type="button" onclick="$(this).parent().parent().remove();">
			<small><i class="fas fa-minus"></i></small>
		</button>
	</div>
</div>`);
}
