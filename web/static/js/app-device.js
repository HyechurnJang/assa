var device_account_id_selected = "";

function showDevice(device_id) {
	$.ajax({
        url: "/api/device/" + device_id,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	showDevicePanel(data);
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function showDevicePanel(data) {
	$("#setting-panel-save-button-wrap").html('<button class="btn btn-lg btn-outline-secondary non-radius non-border" type="button" onclick="saveDevice();"><i class="fas fa-save"></i> Save</button>');
	if (data) {
		$("#device-title").html("Edit Device");
		$("#device-id").val(data.id);
		$("#device-name").val(data.name);
		if (data.headquater) {
			$("#device-headquater").prop("checked", true);
		} else {
			$("#device-headquater").prop("checked", false);
		}
		$("#device-ip").val(data.ip);
		$("#device-port").val(data.port);
		$("#device-dp-ip").val(data.dp_ip);
		$("#device-vpn-net").val(data.vpn_net);
		var device_account_selector = $("#device-account-selector");
		device_account_selector.empty();
		device_account_selector.append('<option value=""></option>');
		device_account_selector.append(`<option value="${data.account_id}" selected>${data.account.name}</option>`);
		device_account_id_selected = data.account_id;
		$("#device-username").val(data.account.username);
		$("#device-password").val(data.account.password);
	} else {
		$("#device-title").html("New Device");
		$("#device-id").val(null);
		$("#device-name").val("");
		$("#device-headquater").prop("checked", false);
		$("#device-ip").val("");
		$("#device-port").val("");
		$("#device-dp-ip").val("");
		$("#device-vpn-net").val("");
		var device_account_selector = $("#device-account-selector");
		device_account_selector.empty();
		device_account_selector.append('<option value="" selected></option>');
		device_account_id_selected = ""
		$("#device-username").val("");
		$("#device-password").val("");
	}
	$.ajax({
        url: "/api/account",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	var device_account_selector = $("#device-account-selector");
        	$.each(data, function(index, account) {
        		if ( device_account_id_selected != account.id ) {
        			device_account_selector.append(`<option value="${account.id}">${account.name}</option>`);
        		}
        	});
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
	showSettingPanel("setting-device");
}

function saveDevice() {
	var device_id = $("#device-id").val();
	var name = $("#device-name").val();
	var headquater = "";
	if ($("#device-headquater").is(":checked")) { headquater = "hq" }
	var account_id = $("#device-account-selector").val();
	var username = $("#device-username").val();
	var password = $("#device-password").val();
	var ip = $("#device-ip").val();
	var port = $("#device-port").val();
	var dp_ip = $("#device-dp-ip").val();
	var vpn_net = $("#device-vpn-net").val();
	if ( ip == "" ) {
		window.alert("Input Device IP");
		return false;
	}
	if ( account_id == "" || ( username == "" && password == "" ) ) {
		window.alert("Input Account Preset or Username/Password")
		return false;
	}
	if ( device_id != "" ) {
		var url = "/api/device/" + device_id;
		var method = "PUT";
	} else {
		var url = "/api/device";
		var method = "POST";
	}
	$.ajax({
        url: url,
        type: method,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({name: name, account_id: account_id, username: username, password: password, ip: ip, port: port, dp_ip: dp_ip, vpn_net: vpn_net, headquater: headquater}),
        success: function(data) {
        	showDevice(data.id);
        	getDeviceTable();
        	getAccountTable();
        },
        error: function(xhr, status, thrown) {
        	window.alert("error");
		}
    });
}

function deleteDevices() {
	var id = $(".device-delete-selected:checked").map(function() {return $(this).attr("device_id");}).get();
	if (id.length > 0) {
		$.ajax({
	        url: "/api/delete/devices",
	        type: "POST",
	        contentType: "application/json; charset=utf-8",
	        dataType: "json",
	        data: JSON.stringify({id: id}),
	        success: function(data) {
	        	hideSettingPanel();
	        	getDeviceTable();
	        },
	        error: function(xhr, status, thrown) {
	        	window.alert("error");
			}
	    });
	}
}

$(document).ready(function() {
	$("#device-account-selector").change(function() {
		var account_id = $("#device-account-selector option:selected").attr("value");
		if ( account_id != "" ) {
			$.ajax({
		        url: "/api/account/" + account_id,
		        type: "GET",
		        contentType: "application/json; charset=utf-8",
		        dataType: "json",
		        success: function(data) {
		        	$("#device-username").val(data.username);
		    		$("#device-password").val(data.password);
		        },
		        error: function(xhr, status, thrown) {
					window.alert("error");
				}
		    });
		} else {
			$("#device-username").val("");
    		$("#device-password").val("");
		}
	});
	$("#device-username").click(function() {
		$("#device-account-selector").val(0);
		$("#device-username").val("");
		$("#device-password").val("");
	});
	$("#device-password").click(function() {
		$("#device-account-selector").val(0);
		$("#device-username").val("");
		$("#device-password").val("");
	});
});