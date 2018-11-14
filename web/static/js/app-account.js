function showAccount(account_id) {
	$.ajax({
        url: "/api/account/" + account_id,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
        	showAccountPanel(data);
        },
        error: function(xhr, status, thrown) {
			window.alert("error");
		}
    });
}

function showAccountPanel(data) {
	$("#setting-panel-save-button-wrap").html('<button class="btn btn-lg btn-outline-secondary non-radius non-border" type="button" onclick="saveAccount();"><i class="fas fa-save"></i> Save</button>');
	if (data) {
		$("#account-title").html("Edit Account");
		$("#account-id").val(data.id);
		$("#account-name").val(data.name);
		$("#account-username").val(data.username);
		$("#account-password").val(data.password);
	} else {
		$("#account-title").html("New Account");
		$("#account-id").val(null);
		$("#account-name").val("");
		$("#account-username").val("");
		$("#account-password").val("");
	}
	showSettingPanel("setting-account");
}

function saveAccount() {
	var account_id = $("#account-id").val();
	var name = $("#account-name").val();
	var username = $("#account-username").val();
	var password = $("#account-password").val();
	if (account_id != "") {
		var url = "/api/account/" + account_id;
		var method = "PUT";
	} else {
		var url = "/api/account";
		var method = "POST";
	}
	if ( username == "" && password == "" ) {
		window.alert("Input Username and Password");
		return false
	}
	$.ajax({
        url: url,
        type: method,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({name: name, username: username, password: password}),
        success: function(data) {
        	showAccount(data.id);
        	getAccountTable();
        	getDeviceTable();
        },
        error: function(xhr, status, thrown) {
        	window.alert("error");
		}
    });
}

function deleteAccounts() {
	var id = $(".account-delete-selected:checked").map(function() {return $(this).attr("account_id");}).get();
	if (id.length > 0) {
		$.ajax({
	        url: "/api/delete/accounts",
	        type: "POST",
	        contentType: "application/json; charset=utf-8",
	        dataType: "json",
	        data: JSON.stringify({id: id}),
	        success: function(data) {
	        	hideSettingPanel();
	        	getAccountTable();
	        	getDeviceTable();
	        },
	        error: function(xhr, status, thrown) {
	        	window.alert("error");
			}
	    });
	}
}