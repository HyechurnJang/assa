
function getWorkFlowTable() {
	$("#workflow-table-wrap").html('<table id="workflow-table" class="table display" style="width:100%"><thead><tr><th>Name</th><th>Commands</th><th>Delete</th></tr></thead></table>');
	$("#workflow-table").DataTable({
		"ajax": "/api/datatable/workflow",
		"columns": [
			{ "data": "name" },
			{ "data": "commands" },
			{ "data": "check" }
		]
	});
}

function getCommandTable() {
	$("#command-table-wrap").html('<table id="command-table" class="table display" style="width:100%"><thead><tr><th>Name</th><th>CLI Context</th><th>Variables</th><th>Delete</th></tr></thead></table>');
	$("#command-table").DataTable({
		"ajax": "/api/datatable/command",
		"columns": [
			{ "data": "name" },
			{ "data": "text" },
			{ "data": "vars" },
			{ "data": "check" }
		]
	});
}

function getPoolTable() {
	$("#pool-table-wrap").html('<table id="pool-table" class="table display" style="width:100%"><thead><tr><th>Name</th><th># Devices</th><th>Delete</th></tr></thead></table>');
	$("#pool-table").DataTable({
		"ajax": "/api/datatable/pool",
		"columns": [
			{ "data": "name" },
			{ "data": "devices" },
			{ "data": "check" }
		]
	});
}

function getDeviceTable() {
	$("#device-table-wrap").html('<table id="device-table" class="table display" style="width:100%"><thead><tr><th>Name</th><th>IP</th><th>Port</th><th>Datapath IP</th><th>VPN Network</th><th>Account</th><th>Role</th><th>Delete</th></tr></thead></table>');
	$("#device-table").DataTable({
		"ajax": "/api/datatable/device",
		"columns": [
			{ "data": "name" },
			{ "data": "ip" },
			{ "data": "port" },
			{ "data": "dp_ip" },
			{ "data": "vpn_net" },
			{ "data": "account" },
			{ "data": "headquater" },
			{ "data": "check" }
		]
	});
}

function getAccountTable() {
	$("#account-table-wrap").html('<table id="account-table" class="table display" style="width:100%"><thead><tr><th>Name</th><th>Username</th><th>Password</th><th>Token</th><th>Delete</th></tr></thead></table>');
	$("#account-table").DataTable({
		"ajax": "/api/datatable/account",
		"columns": [
			{ "data": "name" },
			{ "data": "username" },
			{ "data": "password" },
			{ "data": "token" },
			{ "data": "check" }
		]
	});
}

function showSettingPanel(setting_item) {
	$(".setting-panel-item").hide();
	$("#" + setting_item).show();
	if ($("#setting-panel").hasClass("hide")) {
		$("#setting-panel").removeClass("hide");
	}
}

function hideSettingPanel() {
	if ($("#setting-panel").hasClass("hide") == false) {
		$("#setting-panel").addClass("hide");
	}
}

$(document).ready(function() {
	getWorkFlowTable();
	getCommandTable();
	getPoolTable();
	getDeviceTable();
	getAccountTable();
});