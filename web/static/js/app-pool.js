
var device_list = [];
var select_device_list = [];

function showPool(pool_id) {
	$.ajax({
        url: "/api/pool/" + pool_id,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	showPoolPanel(data);
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function showPoolPanel(data) {
	$.ajax({
        url: "/api/device",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	device_list = data;
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
	$("#setting-panel-save-button-wrap").html('<button class="btn btn-lg btn-outline-secondary non-radius non-border" type="button" onclick="savePool();"><i class="fas fa-save"></i> Save</button>');
	select_device_list = [];
	if (data) {
		$("#pool-title").html("Edit Pool");
		$("#pool-id").val(data.id);
		$("#pool-name").val(data.name);
		var pool_items = $("#pool-items");
		pool_items.empty();
		$.each(data.devices, function(index, device) {
			pool_items.append(`
<div class="col col-left-align"><span class="badge badge-secondary badge-delete-btn pool-device" onclick="delDeviceFromPool($(this));" device_id="${device.id}">${device.name} <small><i class="fas fa-times"></i></small></span></div>
			`);
			select_device_list.push(device.id);
		});
	} else {
		$("#pool-title").html("New Pool");
		$("#pool-id").val(null);
		$("#pool-name").val("");
		$("#pool-items").empty();
	}
	showSettingPanel("setting-pool");
}

function savePool() {
	var pool_id = $("#pool-id").val();
	var name = $("#pool-name").val();
	if (pool_id != "") {
		var url = "/api/pool/" + pool_id;
		var method = "PUT";
	} else {
		var url = "/api/pool";
		var method = "POST";
	}
	$.ajax({
        url: url,
        type: method,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({name: name, devices: select_device_list}),
        success: function(data) {
        	showPool(data.id);
        	getPoolTable();
        },
        error: function(xhr, status, thrown) {
        	window.alert("error");
		}
    });
}

function deletePools() {
	var id = $(".pool-delete-selected:checked").map(function() {return $(this).attr("pool_id");}).get();
	if (id.length > 0) {
		$.ajax({
	        url: "/api/delete/pools",
	        type: "POST",
	        contentType: "application/json; charset=utf-8",
	        dataType: "json",
	        data: JSON.stringify({id: id}),
	        success: function(data) {
	        	hideSettingPanel();
	        	getPoolTable();
	        },
	        error: function(xhr, status, thrown) {
	        	window.alert("error");
			}
	    });
	}
}

function addDeviceToPoolByName() {
	var name = $("#search-device-by-name").val();
	if ( name != "" ) {
		var pool_items = $("#pool-items");
		$.each(device_list, function(index, device) {
			console.log(name, device.name);
			if( device.name.indexOf(name) != -1 ) {
				if ( select_device_list.indexOf(device.id) == -1 ) {
					pool_items.append(`
<div class="col col-left-align"><span class="badge badge-secondary badge-delete-btn pool-device" onclick="delDeviceFromPool($(this));" device_id="${device.id}">${device.name} <small><i class="fas fa-times"></i></small></span></div>
					`);
					select_device_list.push(device.id);
				}
			}
		});
	}
	$("#search-device-by-name").val("");
	$("#search-device-by-ip").val("");
}

function addDeviceToPoolByIP() {
	var ip = $("#search-device-by-ip").val();
	if ( ip != "" ) {
		var ip_split = ip.split(".");
		if ( ip_split.length != 4 ) { window.alert("Incorrect IP Style"); return false; }
		var ip_regex_str = "^";
		$.each(ip_split, function(index, ip_str) {
			if (ip_str == "*") {
				ip_regex_str += "[0-9]+";
			} else {
				ip_regex_str += ip_str;
			}
			if (index != 3) {
				ip_regex_str += "\.";
			}
		});
		ip_regex_str += "$";
		var ip_regex = new RegExp(ip_regex_str);
		var pool_items = $("#pool-items");
		$.each(device_list, function(index, device) {
			if( ip_regex.test(device.ip) ) {
				if ( select_device_list.indexOf(device.id) == -1 ) {
					pool_items.append(`
<div class="col col-left-align"><span class="badge badge-secondary badge-delete-btn pool-device" onclick="delDeviceFromPool($(this));" device_id="${device.id}">${device.name} <small><i class="fas fa-times"></i></small></span></div>
					`);
					select_device_list.push(device.id);
				}
			}
		});
	}
	$("#search-device-by-name").val("");
	$("#search-device-by-ip").val("");
}

function delDeviceFromPool(badge) {
	select_device_list.splice($.inArray(badge.attr("device_id"), select_device_list), 1);
	badge.parent().remove();
}

$(document).ready(function() {
	$("#search-device-by-name").keypress(function(event) {
		if (event.keyCode == 13) { addDeviceToPoolByName(); }
	});
	$("#search-device-by-ip").keypress(function(event) {
		if (event.keyCode == 13) { addDeviceToPoolByIP(); }
	});
});