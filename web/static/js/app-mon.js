
var schedule = null;
var tun_gauge = null;
var cpu_gauge = null;
var mem_gauge = null;
var dev_cpu_gauge = null;
var dev_mem_gauge = null;

function showDeviceStatusPanel(id, name) {
	if ($("#device-status-panel-wrap").hasClass("hide")) {
		$("#device-status-panel-wrap").removeClass("hide");
	}
	var con = $("#device-status-console");
	con.empty();
	$("#dev-status-name").html(name);
	$("#dev-cpu-textfield").html("-");
	dev_cpu_gauge.animationSpeed = 1;
	dev_cpu_gauge.set(0);
	$("#dev-mem-textfield").html("-");
	dev_mem_gauge.animationSpeed = 1;
	dev_mem_gauge.set(0);
	$("#dev-input-pkts").html("-");
	$("#dev-input-bytes").html("-");
	$("#dev-output-pkts").html("-");
	$("#dev-output-bytes").html("-");
	$.ajax({
        url: "/mon/device/" + id,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
    		con.html(data.show_run.join("<br/>"));
        	$("#dev-cpu-textfield").html(data.cpu + " %");
        	dev_cpu_gauge.animationSpeed = 80;
        	dev_cpu_gauge.set(data.cpu);
        	$("#dev-mem-textfield").html(data.mem + " %");
        	dev_mem_gauge.animationSpeed = 80;
        	dev_mem_gauge.set(data.mem);
        	$("#dev-input-pkts").html(data.traffic.input_pkts + " pkts");
        	$("#dev-input-bytes").html(data.traffic.input_bytes + " bytes");
        	$("#dev-output-pkts").html(data.traffic.output_pkts + " pkts");
        	$("#dev-output-bytes").html(data.traffic.output_bytes + " bytes");
        },
        error: function(xhr, status, thrown) {
			console.log("[ERROR] showShowRunPanel()");
		}
    });
}

function hideDeviceStatusPanel() {
	if ($("#device-status-panel-wrap").hasClass("hide") == false) {
		$("#device-status-panel-wrap").addClass("hide");
	}
}

function showHomeHQPanel() {
	$.ajax({
        url: "/mon/hqdev",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	var tun_per = 0;
        	if (data.tunnel.live == 0 ) {
        		tun_per = 0;
        	} else if (data.tunnel.total == data.tunnel.live) {
        		tun_per = 100;
        	} else {
        		tun_per = (data.tunnel.live * 100.0) / data.tunnel.total;
        	}
        	$("#hq-tunnel-textfield").html("<small>" + data.tunnel.live + "/" + data.tunnel.total + "=</small> " + tun_per.toFixed(1) + " %");
        	tun_gauge.set(tun_per);
        	$("#hq-cpu-textfield").html(data.cpu + " %");
        	cpu_gauge.set(data.cpu);
        	$("#hq-mem-textfield").html(data.mem + " %");
        	mem_gauge.set(data.mem);
        	$("#hq-input-pkts").html(data.traffic.input_pkts + " pkts");
        	$("#hq-input-bytes").html(data.traffic.input_bytes + " bytes");
        	$("#hq-output-pkts").html(data.traffic.output_pkts + " pkts");
        	$("#hq-output-bytes").html(data.traffic.output_bytes + " bytes");
        },
        error: function(xhr, status, thrown) {
			console.log("[ERROR] showHomeHQPanel()");
		}
    });
}

var setHomePanelGridData = null;

function showHomePanelGrid() {
	$.ajax({
        url: "/api/pool",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	setHomePanelGridData = data;
        	setHomePanelGrid(data);
        },
        error: function(xhr, status, thrown) {
        	console.log("[ERROR] showHomePanelGrid()");
		}
    });
}

function setHomePanelGrid(data) {
	var home_grid = $("#home-panel-grid");
	var vpn_panels = $("#vpn-panels");
	home_grid.empty();
	vpn_panels.empty();
	$.each(data, function(index, pool) {
		home_grid.append(`
<div class="col-2 spacing-top">
	<div class="card" onclick="showVPNPanel('${pool.id}');">
		<div id="${pool.id}-card" class="card-header mon-vpn-card-header">${pool.name}</div>
		<div class="card-body">
			<h5 id="${pool.id}-card-title" class="card-title" style="text-align:center;" total="0" good="0" bad="0"></h5>
		</div>
	</div>
</div>
		`);
		vpn_panels.append(`
<div id="${pool.id}-wrap" class="mon-vpn-result-panel-wrap">
	<div class="mon-vpn-result-panel">
		<button class="btn btn-lg btn-outline-secondary non-radius non-border" type="button" onclick="hideVPNPanel('${pool.id}');">
			<i class="fas fa-times"></i>
		</button>
		<div class="container-fluid spacing-top">
			<div id="${pool.id}" class="row container-fluid"></div>
		</div>
	</div>
</div>		
		`);
	});
	$.ajax({
        url: "/mon/vpn",
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	setVPNPanels(data);
        	setVPNPanelDetail();
        },
        error: function(xhr, status, thrown) {
        	console.log("[ERROR] setHomePanelGrid()");
		}
    });
}

function setVPNPanels(data) {
	$.each(data, function(index, device) {
		$.each(device.pool_id, function(index, pool_id) {
			var card_title = $("#" + pool_id + "-card-title");
			var total = parseInt(card_title.attr("total"));
			var good = parseInt(card_title.attr("good"));
			var bad = parseInt(card_title.attr("bad"));
			total += 1;
			if ( device.live ) {
				$("#" + pool_id).append(`
<div class="col col-left-align clickable" onclick="showDeviceStatusPanel('${device.id}','${device.name}');"><span class="badge badge-success">${device.name}</span></div>
				`);
				good += 1;
			} else {
				$("#" + pool_id).append(`
<div class="col col-left-align clickable" onclick="showDeviceStatusPanel('${device.id}','${device.name}');"><span class="badge badge-danger">${device.name}</span></div>
				`);
				bad += 1;
			}
			card_title.attr("total", total);
			card_title.attr("good", good);
			card_title.attr("bad", bad);
		});
	});
}

function setVPNPanelDetail() {
	$.each(setHomePanelGridData, function(index, pool) {
		var card = $("#" + pool.id + "-card");
		var card_title = $("#" + pool.id + "-card-title");
		var total = parseInt(card_title.attr("total"));
		var good = parseInt(card_title.attr("good"));
		var bad = parseInt(card_title.attr("bad"));
		card_title.html('<p>Good : ' + good + '</p><p>Bad : ' + bad + '</p><p>Total : ' + total + '</p>');
		if (bad > 0) {
			if ( card.hasClass("mon-vpn-alert") == false) {
				card.addClass("mon-vpn-alert");
				card.parent().addClass("mon-vpn-card-alert");
			}
		}
		else if (total == 0) {
			if ( card.hasClass("mon-vpn-empty") == false) {
				card.addClass("mon-vpn-empty");
				card.parent().addClass("mon-vpn-card-empty");
			}
		} else {
			card.parent().addClass("mon-vpn-card-good");
		}
	});
}

function showVPNPanel(pool_id) {
	if (schedule != null) {
		clearTimeout(schedule);
		schedule = null;
	}
	$("#" + pool_id + "-wrap").show();
}

function hideVPNPanel(pool_id) {
	if (schedule == null) {
		scheduleHomeHQPanel();
	}
	$("#" + pool_id + "-wrap").hide();
}

function scheduleHomeHQPanel() {
	showHomeHQPanel();
	showHomePanelGrid();
	schedule = setTimeout(function() {
		scheduleHomeHQPanel();
	}, 10000);
}

$(document).ready(function() {
	tun_gauge = new Gauge(document.getElementById("hq-tunnel-live")).setOptions({
		angle: 0.0,
		lineWidth: 0.5,
		radiusScale: 1,
		pointer: {
			length: 0.6,
			strokeWidth: 0.035,
			color: '#000000'
		},
		limitMax: false,
		limitMin: false,
		colorStart: '#6FADCF',
		colorStop: '#8FC0DA',
		strokeColor: '#E0E0E0',
		generateGradient: true,
		highDpiSupport: true,
		percentColors: [[0.0, "#ff0000"], [0.50, "#f9c802"], [1.0, "#a9d70b"]],
	});
	tun_gauge.maxValue = 100;
	tun_gauge.minValue = 0;
	tun_gauge.animationSpeed = 80;
	
	cpu_gauge = new Gauge(document.getElementById("hq-cpu-usages")).setOptions({
		angle: 0.0,
		lineWidth: 0.5,
		radiusScale: 1,
		pointer: {
			length: 0.6,
			strokeWidth: 0.035,
			color: '#000000'
		},
		limitMax: false,
		limitMin: false,
		colorStart: '#6FADCF',
		colorStop: '#8FC0DA',
		strokeColor: '#E0E0E0',
		generateGradient: true,
		highDpiSupport: true,
		percentColors: [[0.0, "#a9d70b" ], [0.50, "#f9c802"], [1.0, "#ff0000"]],
	});
	cpu_gauge.maxValue = 100;
	cpu_gauge.minValue = 0;
	cpu_gauge.animationSpeed = 80;
	
	mem_gauge = new Gauge(document.getElementById("hq-mem-usages")).setOptions({
		angle: 0.0,
		lineWidth: 0.5,
		radiusScale: 1,
		pointer: {
			length: 0.6,
			strokeWidth: 0.035,
			color: '#000000'
		},
		limitMax: false,
		limitMin: false,
		colorStart: '#6FADCF',
		colorStop: '#8FC0DA',
		strokeColor: '#E0E0E0',
		generateGradient: true,
		highDpiSupport: true,
		percentColors: [[0.0, "#a9d70b" ], [0.50, "#f9c802"], [1.0, "#ff0000"]],
	});
	mem_gauge.maxValue = 100;
	mem_gauge.minValue = 0;
	mem_gauge.animationSpeed = 80;
	
	dev_cpu_gauge = new Gauge(document.getElementById("dev-cpu-usages")).setOptions({
		angle: 0.0,
		lineWidth: 0.5,
		radiusScale: 1,
		pointer: {
			length: 0.6,
			strokeWidth: 0.035,
			color: '#000000'
		},
		limitMax: false,
		limitMin: false,
		colorStart: '#6FADCF',
		colorStop: '#8FC0DA',
		strokeColor: '#E0E0E0',
		generateGradient: true,
		highDpiSupport: true,
		percentColors: [[0.0, "#a9d70b" ], [0.50, "#f9c802"], [1.0, "#ff0000"]],
	});
	dev_cpu_gauge.maxValue = 100;
	dev_cpu_gauge.minValue = 0;
	dev_cpu_gauge.animationSpeed = 80;
	
	dev_mem_gauge = new Gauge(document.getElementById("dev-mem-usages")).setOptions({
		angle: 0.0,
		lineWidth: 0.5,
		radiusScale: 1,
		pointer: {
			length: 0.6,
			strokeWidth: 0.035,
			color: '#000000'
		},
		limitMax: false,
		limitMin: false,
		colorStart: '#6FADCF',
		colorStop: '#8FC0DA',
		strokeColor: '#E0E0E0',
		generateGradient: true,
		highDpiSupport: true,
		percentColors: [[0.0, "#a9d70b" ], [0.50, "#f9c802"], [1.0, "#ff0000"]],
	});
	dev_mem_gauge.maxValue = 100;
	dev_mem_gauge.minValue = 0;
	dev_mem_gauge.animationSpeed = 80;
	
	scheduleHomeHQPanel();
});