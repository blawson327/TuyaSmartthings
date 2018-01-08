/*
TuyAPI node.js

Derived from
Dave Gutheinz's TP-LinkHub - Version 1.0

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at:
		http://www.apache.org/licenses/LICENSE-2.0
		
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

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
	//Create TuyaDevice here
	//var command = request.headers["tplink-command"]
	//var deviceIP = request.headers["tplink-iot-ip"]
	
	var deviceIP = request.headers["tuyapi-ip"]
	var deviceID = request.headers["tuyapi-devid"]
	var localKey = request.headers["tuyapi-localkey"]
	var command =  request.headers["tuyapi-command"]
	
	//console.log("IP: " + deviceIP)
	//console.log("Device ID: " + deviceID)
	//console.log("LocalKey: " + localKey)
	//console.log("Tuya Command: " + command)

	var respMsg = "deviceCommand sending to IP: " + deviceIP + " Command: " + command
	console.log(respMsg)

	var tuya = new TuyaDevice({
	  type: 'outlet',
	  ip: deviceIP,
	  id: deviceID,
	  key: localKey});

	switch(command) {
		case "off":
			tuya.setStatus(0, function(error, result) {
		                  if (error) { return console.log(error); }
		                  console.log('Result of setting status to 0 : ' + result);
				  //response.setHeader("cmd-response", result)
				  response.end()
				  tuya.destroy();
			});
		break

		case "on":
			tuya.setStatus(1, function(error, result) {
		                  if (error) { return console.log(error); }
		                  console.log('Result of setting status to 1 : ' + result);
				  //response.setHeader("cmd-response", result)
				  response.end()
				  tuya.destroy();
			});		
		break

		case "status":
			tuya.getStatus(function(error, status) {
				if (error) { return console.log(error); }
				if (status == true) {
					status = "on";
				} else {
					status = "off";
				}
				response.setHeader("cmd-response", status );
				console.log("Status (" + status + ") sent to SmartThings.")
				response.end()
				tuya.destroy();
			});
		break

		default:
			console.log('Unknown request')
	
	}  	
}

//----- Utility - Response Logging Function ------------------------
function logResponse(respMsg) {
	if (logFile == "yes") {
		fs.appendFileSync("error.log", "\r" + respMsg)
	}
}
