/*
TuyAPI node.js

Derived from
Dave Gutheinz's TP-LinkHub - Version 1.0

*/

//##### Options for this program ###################################
var logFile = "yes"	//	Set to no to disable error.log file.
var hubPort = 8083	//	Synched with Device Handlers.
//##################################################################

//---- Determine if old Node version, act accordingly -------------
console.log("Node.js Version Detected:   " + process.version)
var oldNode = "no"
if (process.version == "v6.0.0-pre") {
	oldNode ="yes"
	logFile = "no"
}

//---- Program set up and global variables -------------------------
var http = require('http')
var net = require('net')
var fs = require('fs')
const TuyaDevice = require('tuyapi')

var server = http.createServer(onRequest)

//---- Start the HTTP Server Listening to SmartThings --------------
server.listen(hubPort)
console.log("TuyAPI Hub Console Log")
logResponse("\n\r" + new Date() + "\rTuyAPI Hub Error Log")

//---- Command interface to Smart Things ---------------------------
function onRequest(request, response){
	var command = 	request.headers["command"]
	var deviceIP = 	request.headers["tuyapi-ip"]
	
	var cmdRcvd = "\n\r" + new Date() + "\r\nIP: " + deviceIP + " sent command " + command
	console.log(" ")
	console.log(cmdRcvd)
		
	switch(command) {
		//---- (BridgeDH - Poll for Server APP ------------------
		case "pollServer":
			response.setHeader("cmd-response", "ok")
			response.end()
			var respMsg = "Server Poll response sent to SmartThings"
			console.log(respMsg)
		break

		//---- TP-Link Device Command ---------------------------
		case "deviceCommand":
			processDeviceCommand(request, response)
			break
	
		default:
			response.setHeader("cmd-response", "InvalidHubCmd")
			response.end()
			var respMsg = "#### Invalid Command ####"
			var respMsg = new Date() + "\n\r#### Invalid Command from IP" + deviceIP + " ####\n\r"
			console.log(respMsg)
			logResponse(respMsg)
	}
}

//---- Send deviceCommand and send response to SmartThings ---------
function processDeviceCommand(request, response) {
	
	var deviceIP = request.headers["tuyapi-ip"]
	var deviceID = request.headers["tuyapi-devid"]
	var localKey = request.headers["tuyapi-localkey"]
	var command =  request.headers["tuyapi-command"]
        var dps = request.headers["dps"]
        var action = request.headers["action"]

	response.setHeader("action", action)
        

	var respMsg = "deviceCommand sending to IP: " + deviceIP + " Command: " + command
	console.log(respMsg)

	var tuya = new TuyaDevice({
	  
	  
	  id: deviceID,
          key: localKey,
          dps: '4',
          ip: '192.168.1.75'});

	switch(command) {
		case "off":
			//tuya.resolveIds().then(() => {  
  tuya.get({'dps': dps}).then(status => {
    console.log('Status: ' + status);

    tuya.set({set: false, 'dps': dps}).then(result => {
               console.log('Result of setting status to ' + false + ': ' + result);
               response.setHeader("cmd-response", !status );
               response.setHeader("onoff", "off");
	        console.log("Status (" + status + ") sent to SmartThings.");
	        response.end();
               
      
        return;
      
    });
  //});
});
		break

		case "on":
		//tuya.resolveIds().then(() => {  
  tuya.get({'dps': dps}).then(status => {
    console.log('Status: ' + status);

    tuya.set({set: true, 'dps': dps}).then(result => {
               console.log('Result of setting status to ' + true + ': ' + result);
               response.setHeader("cmd-response", !status );
               response.setHeader("onoff", "on");
	        console.log("Status (" + status + ") sent to SmartThings.");
	        response.end();
               
      
        return;
      
    });
  //});
});
		break

		case "status":
			  //tuya.resolveIds().then(() => {  
  tuya.get({'dps': dps}).then(status => {
    console.log('Status: ' + status);

    
               response.setHeader("cmd-response", status );
               response.setHeader("onoff", "on");
	        console.log("Status (" + status + ") sent to SmartThings.");
	        response.end();
               
      
        return;
      
    
  //});
});
		break

		default:
			tuya.destroy();
			console.log('Unknown request');
	
	}  	
}

//----- Utility - Response Logging Function ------------------------
function logResponse(respMsg) {
	if (logFile == "yes") {
		fs.appendFileSync("error.log", "\r" + respMsg)
	}
}
