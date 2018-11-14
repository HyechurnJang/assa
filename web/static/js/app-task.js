
var task_result = [];

function setSelector(selector_name, data) {
	var selector = $("#" + selector_name);
	selector.empty();
	selector.append('<option value=""></option>');
	$.each(data, function(index, item) {
		selector.append(`<option value="${item.id}">${item.name}</option>`);
	});
}

function setTaskDeviceSelector() {
	$.ajax({
        url: "/api/device",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	setSelector("task-device-selector", data);
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function setTaskPoolSelector() {
	$.ajax({
        url: "/api/pool",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	setSelector("task-pool-selector", data);
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function setTaskCommandSelector() {
	$.ajax({
        url: "/api/command",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	setSelector("task-command-selector", data);
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function setTaskWorkFlowSelector() {
	$.ajax({
        url: "/api/workflow",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	setSelector("task-workflow-selector", data);
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function setTaskSelectors() {
	setTaskDeviceSelector();
	setTaskPoolSelector();
	setTaskCommandSelector();
	setTaskWorkFlowSelector();
}

function requestTask() {
	var device_id = $("#task-device-selector").val();
	var pool_id = $("#task-pool-selector").val();
	var command_id = $("#task-command-selector").val();
	var workflow_id = $("#task-workflow-selector").val();
	
	var data = new Object();
	if ( device_id != "" ) { data.device_id = device_id; }
	if ( pool_id != "" ) { data.pool_id = pool_id; }
	if ( command_id != "" ) { data.command_id = command_id; }
	if ( workflow_id != "" ) { data.workflow_id = workflow_id; }
	
	if (device_id == "" && pool_id == "") { window.alert("Input Device or Pool"); return false; }
	if (command_id == "" && workflow_id == "") { window.alert("Input Command or WorkFlow"); return false; }
	
	data.vars = $(".var-value").map(function() {return $(this).val();}).get();
	$("#task-progress-panel-wrap").fadeIn("fast");
	$.ajax({
        url: "/task/request",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(data),
        success: function(data) {
        	checkTaskProgress();
        },
        error: function(xhr, status, thrown) {
        	window.alert("error");
		}
    });
}

function checkTaskProgress() {
	setTimeout(function() {
		$.ajax({
	        url: "/task/status",
	        type: "GET",
	        contentType: "application/json; charset=utf-8",
	        dataType: "json",
	        success: function(data) {
	        	if (data.status == "error") {
	        		getTaskResult();
	        		window.alert(data.error);
        			$("#task-progress-panel-wrap").fadeOut("slow", function() {
	        			$("#task-progress-bar").attr("style", "width:0%");
	        		});
	        	} else if (data.status == "ready") {
	        		getTaskResult();
	        		$("#task-progress-bar").attr("style", "width:100%");
	        		setTimeout(function() {
	        			$("#task-progress-panel-wrap").fadeOut("slow", function() {
		        			$("#task-progress-bar").attr("style", "width:0%");
		        		});
	        		}, 1000);
	        	} else {
	        		$("#task-progress-bar").attr("style", "width:" + data.progress + "%");
	        		checkTaskProgress();
	        	}
	        },
	        error: function(xhr, status, thrown) {
				checkTaskProgress();
			}
	    });
	}, 500);
}

function getTaskResult() {
	$.ajax({
        url: "/task/result",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	var result = $("#task-result-box");
        	result.empty();
        	task_result = data;
        	$.each(data, function(index, device) {
        		if (device.error == true) {
        			result.append(`
<div class="col col-left-align clickable"><span class="badge badge-danger" onclick="showTaskResultConsolePanel(task_result[${index}]);">${device.name}</span></div>
	        		`);
        		} else {
        			result.append(`
<div class="col col-left-align clickable"><span class="badge badge-success" onclick="showTaskResultConsolePanel(task_result[${index}]);">${device.name}</span></div>
	        		`);
        		}
        	});
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function showTaskResultConsolePanel(device) {
	var con = $("#task-result-console");
	con.empty();
	$.each(device.commands, function(index, command) {
		con.append('<p class="console-label">#### ' + command.name + " : " + command.id + " ####</p>");
		$.each(command.result, function(index_2, lines) {
			con.append(lines.join("<br/>"));
		});
	});
	
	if ($("#task-result-console-panel-wrap").hasClass("hide")) {
		$("#task-result-console-panel-wrap").removeClass("hide");
	}
}

function hideTaskResultConsolePanel() {
	if ($("#task-result-console-panel-wrap").hasClass("hide") == false) {
		$("#task-result-console-panel-wrap").addClass("hide");
	}
}

function showDevPoolSelector() {
	$("#task-dev-pool-selector").val("device");
	$("#task-device-selector").val(0);
	$("#task-pool-selector").val(0);
	$("#task-command-selector").val(0);
	$("#task-workflow-selector").val(0);
	$("#task-com-flow-selector-wrap").hide();
	$("#task-com-vars-wrap").hide();
	$("#task-device-selector").show();
	$("#task-pool-selector").hide();
	$("#execute-button").hide();
	$("#task-dev-pool-selector").change(function() {
		$("#task-device-selector").val(0);
		$("#task-pool-selector").val(0);
		$("#task-command-selector").val(0);
		$("#task-workflow-selector").val(0);
		$("#task-com-flow-selector-wrap").hide();
		$("#task-com-vars-wrap").hide();
		$("#task-com-vars").empty();
		$("#execute-button").hide();
		var dev_pool = $("#task-dev-pool-selector option:selected").attr("value");
		if (dev_pool == "device") {
			$("#task-device-selector").show();
			$("#task-pool-selector").hide();
		} else {
			$("#task-device-selector").hide();
			$("#task-pool-selector").show();
		}
	});
	$("#task-device-selector").change(function() {
		$("#task-command-selector").val(0);
		$("#task-workflow-selector").val(0);
		$("#task-com-flow-selector-wrap").hide();
		$("#task-com-vars-wrap").hide();
		$("#task-com-vars").empty();
		$("#execute-button").hide();
	});
	$("#task-pool-selector").change(function() {
		$("#task-command-selector").val(0);
		$("#task-workflow-selector").val(0);
		$("#task-com-flow-selector-wrap").hide();
		$("#task-com-vars-wrap").hide();
		$("#task-com-vars").empty();
		$("#execute-button").hide();
	});
}

function showComFlowSelector() {
	if (!$("#task-device-selector").val() && !$("#task-pool-selector").val()) { return false; }
	$("#task-com-flow-selector-wrap").show("command");
	$("#task-command-selector").val(0);
	$("#task-workflow-selector").val(0);
	$("#task-com-flow-selector-wrap").show();
	$("#task-com-vars-wrap").hide();
	$("#task-com-vars").empty();
	$("#task-command-selector").show();
	$("#task-workflow-selector").hide();
	$("#execute-button").hide();
	$("#task-com-flow-selector").change(function() {
		$("#task-command-selector").val(0);
		$("#task-workflow-selector").val(0);
		$("#task-com-vars-wrap").hide();
		$("#task-com-vars").empty();
		$("#execute-button").hide();
		var com_flow = $("#task-com-flow-selector option:selected").attr("value");
		if (com_flow == "command") {
			$("#task-command-selector").show();
			$("#task-workflow-selector").hide();
		} else {
			$("#task-command-selector").hide();
			$("#task-workflow-selector").show();
		}
	});
	$("#task-command-selector").change(function() {
		$("#task-com-vars-wrap").hide();
		$("#task-com-vars").empty();
		$("#execute-button").hide();
	});
	$("#task-pool-selector").change(function() {
		$("#task-com-vars-wrap").hide();
		$("#task-com-vars").empty();
		$("#execute-button").hide();
	});
}

function showCommandVars() {
	var command_id = $("#task-command-selector").val();
	var workflow_id = $("#task-workflow-selector").val();
	if (!command_id && !workflow_id) { return false; }
	
	if (command_id) {
		$.ajax({
	        url: "/api/command/" + command_id,
	        type: "GET",
	        contentType: "application/json; charset=utf-8",
	        dataType: "json",
	        success: function(data) {
	        	var panel = $("#task-com-vars");
	        	panel.empty();
	        	$.each(data.vars, function(index, var_name) {
	        		panel.append(`
<li class="list-group-item non-border var-item">
	<div class="input-group">
		<div class="input-group-prepend">
			<span class="input-group-text var-label">${data.name} >> ${var_name}</span>
		</div>
		<input type="text" class="form-control var-value">
	</div>
</li>
		        	`);
	        	});
	        	$("#task-com-vars-wrap").show();
	        	$("#execute-button").show();
	        },
	        error: function(xhr, status, thrown) {
				window.alert("error");
			}
	    });
	} else {
		$.ajax({
	        url: "/api/workflow/" + workflow_id,
	        type: "GET",
	        contentType: "application/json; charset=utf-8",
	        dataType: "json",
	        success: function(data) {
	        	var panel = $("#task-com-vars");
	        	panel.empty();
	        	
	        	$.each(data.commands, function(i, command) {
		        	$.each(command.vars, function(j, var_name) {
		        		panel.append(`
<li class="list-group-item non-border var-item">
	<div class="input-group">
		<div class="input-group-prepend">
			<span class="input-group-text var-label">#${i} >> ${command.name} >> ${var_name}</span>
		</div>
		<input type="text" class="form-control var-value">
	</div>
</li>
			        	`);
		        	});
	        	});
	        	$("#task-com-vars-wrap").show();
	        	$("#execute-button").show();
	        },
	        error: function(xhr, status, thrown) {
				window.alert("error");
			}
	    });
	}
}

function showExecutePanel() {
	setTaskSelectors();
	showDevPoolSelector();
	if ($("#execute-panel").hasClass("hide")) {
		$("#execute-panel").removeClass("hide");
	}
}

function hideExecutePanel() {
	if ($("#execute-panel").hasClass("hide") == false) {
		$("#execute-panel").addClass("hide");
	}
}

$(document).ready(function() {
});