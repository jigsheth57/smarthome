// set up ========================
var express = require('express');
var session = require('express-session');
var request = require('request');
var morgan = require('morgan'); // log requests to the console (express4)
var bodyParser = require('body-parser'); // pull information from HTML POST

var app = express(); // create our app w/ express

// configuration =================

app.use(session({
	secret : 'ssshhhhh'
}));
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users

app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({
	'extended' : 'true'
})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({
	type : 'application/vnd.api+json'
})); // parse application/vnd.api+json as json

// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("SmarthomeApp is listening on port 8080");

// Global Variable
var sess;
var client_id = "sample clientid";
var apikey = "APIKey " + client_id;
var endpoint = "https://private-anon-645bd75f4-insteon.apiary-mock.com/api/v2"; // mockup endpoint
//var endpoint = "https://connect.insteon.com/api/v2";  // actual working endpoint

// routes ======================================================================

// api ---------------------------------------------------------------------

// get all devices
app.get('/api/devices', function(req, res) {
	var url = endpoint + "/devices?properties=all";
	getInsteonObjs(url, req, res);
});

//get device by id
app.get('/api/devices/:id', function(req, res) {
	var url = endpoint + "/devices/"+req.params.id;
	getInsteonObjs(url, req, res);
});

// get all rooms
app.get('/api/rooms', function(req, res) {
	var url = endpoint + "/rooms?properties=all";
	getInsteonObjs(url, req, res);
});

// get all scenes
app.get('/api/scenes', function(req, res) {
	var url = endpoint + "/scenes?properties=all";
	getInsteonObjs(url, req, res);
});

//get scene by id
app.get('/api/scenes/:id', function(req, res) {
	var url = endpoint + "/scenes/"+req.params.id;
	getInsteonObjs(url, req, res);
});

//get command status by id
app.get('/api/status/:id', function(req, res) {
	var url = endpoint + "/commands/"+req.params.id;
	getInsteonObjs(url, req, res);
});

//execute command
app.get('/api/commands/:id/:status', function(req, res) {
	var url = endpoint + "/commands";
	sendCommand(url, req, res);
});

// get all houses
app.get('/api/houses', function(req, res) {
	var url = endpoint + "/houses?properties=all";
	getInsteonObjs(url, req, res);
});

function sendCommand(url, req, res) {
	sess = req.session;
	if (sess.token) {
		//console.log("sess.token: " + sess.token);
		var authtoken = "Bearer " + sess.token;
		command = "{\n    \"command\": \""+req.params.status+"\",\n    \"device_id\": "+req.params.id+"\n}";
		request({
			url : url,
			headers : {
				"Content-Type" : "application/json",
				"Authentication" : apikey,
				"Authorization" : authtoken
			},
			body: command,
			method : "POST"
		}, function(error, response, body) {
			res.setHeader("Content-Type", "application/json");
			//console.log("Status", response.statusCode);
			//console.log("Headers", JSON.stringify(response.headers));
			//console.log("Response received", body);
			(response.statusCode >= 200 && response.statusCode <= 299) ? res.end(body) : res.end(error);
		});
	} else {
		login(sess, res, req.path);
	}
}

function getInsteonObjs(url, req, res) {
	sess = req.session;
	if (sess.token) {
		//console.log("sess.token: " + sess.token);
		var authtoken = "Bearer " + sess.token;
		request({
			url : url,
			headers : {
				"Content-Type" : "application/json",
				"Authentication" : apikey,
				"Authorization" : authtoken
			},
			method : "GET"
		}, function(error, response, body) {
			res.setHeader("Content-Type", "application/json");
			//console.log("Status", response.statusCode);
			//console.log("Headers", JSON.stringify(response.headers));
			//console.log("Response received", body);
			(response.statusCode >= 200 && response.statusCode <= 299) ? res.end(body) : res.end(error);
		});
	} else {
		login(sess, res, req.path);
	}
}

function login(sess, res, uri) {
	var url = endpoint + "/oauth2/token";
	var uid = "john@yahoo.com";
	var pwd = "passowrd";
	var fbody = "grant_type=password&username=" + uid + "&password=" + pwd
			+ "&client_id=" + client_id;
	request({
		url : url,
		body : fbody,
		headers : {
			"Content-Type" : "application/x-www-form-urlencoded"
		},
		method : "POST"
	}, function(error, response, body) {
		//console.log("Status", response.statusCode);
		//console.log("Headers", JSON.stringify(response.headers));
		//console.log("Response received", body);
		if (response.statusCode == 200) {
			var jsonObj = JSON.parse(body);
			//console.log("token: " + jsonObj.access_token);
			sess.token = jsonObj.access_token;
			res.redirect(uri);
		}
	});
}

// application -------------------------------------------------------------
app.get('*', function(req, res) {
	res.sendfile('./public/index.html'); // load the single view file
											// (angular will handle the page
											// changes on the front-end)
});
