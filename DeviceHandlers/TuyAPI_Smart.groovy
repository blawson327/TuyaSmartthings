import groovy.json.JsonSlurper
/*
TuyAPI SmartPlug Device Handler

Derived from
	TP-Link HS Series Device Handler
	Copyright 2017 Dave Gutheinz
Original smartthings work and node server created by Ben Lawson


Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at:
		http://www.apache.org/licenses/LICENSE-2.0
		
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Supported models and functions:  This device supports smart plugs that use the Tuya Smart Life app

Update History
05-23-2018 - Updated to control all powerstrip plugs from one device. Fixed status response - should now be accurate. Node script update with changes by Dave Gutheinz.
05-22-2018 - Updated to make on off commands work and make compatible with Hubitat
01-04-2018	- Initial release
*/
metadata {
	definition (name: "TuyAPI Smart Plug", namespace: "cwwilson08", author: "Chris Wilson") {
		capability "Refresh"
		capability "Actuator"
        command "togglePower", ["NUMBER"]
        attribute "Plug_1", "string"
        attribute "Plug_2", "string"
        attribute "Plug_3", "string"
        attribute "Plug_4", "string"
        attribute "Plug_5", "string"
        attribute "Plug_6", "string"
	}
}
preferences {
	input(name: "deviceIP", type: "text", title: "Device IP", required: true, displayDuringSetup: true)
	input(name: "gatewayIP", type: "text", title: "Gateway IP", required: true, displayDuringSetup: true)
	input(name: "deviceID", type: "text", title: "Device ID", required: true, displayDuringSetup: true)
	input(name: "localKey", type: "text", title: "Local Key", required: true, displayDuringSetup: true)
   // input(name: "dps", type: "text", title: "dps", required: true, displayDuringSetup: true)
}

def installed() {
	updated()
}

def updated() {
	unschedule()
	runEvery15Minutes(refresh)
	runIn(2, refresh)
}
//	----- BASIC PLUG COMMANDS ------------------------------------
def togglePower(deviceNo) {
    deviceNo = deviceNo.toString()
//	deleted the cmds on and off.  Replace with this.
//	assume that states are on or off.  Offline will try to turn on.
//	added deviceNo.  This will pass through the system to the response method and allow proper parsing.
    def plugState = device.currentValue("Plug_${deviceNo}")
    if (plugState == "on") {
		sendCmdtoServer("off", deviceNo, "deviceCommand", "onOffResponse")
    } else {
		sendCmdtoServer("on", deviceNo, "deviceCommand", "onOffResponse")
    }
}

def onOffResponse(response, deviceNo){
//    deviceNo = deviceNo.toString()
//	Changed switch to plug_$(deviceNo}.  device no comes from the original toggle (carried
//	all commands and responses.
	if (cmdResponse == "TcpTimeout") {
		log.error "$device.name $device.label: Communications Error"
        sendEvent(name: "Plug_${deviceNo}", value: "offline", descriptionText: "ERROR - OffLine - mod onOffResponse")
	} else {

		log.info "${device.name} ${device.label}: Power: ${response}"
		sendEvent(name: "Plug_${deviceNo}", value: response)
	}
}
//	----- REFRESH ------------------------------------------------
def refresh(){
//	Will do all six switches on refresh, one second apart.
    def rfrsh = []
	rfrsh << sendCmdtoServer("status", "1", "deviceCommand", "refreshResponse")
	rfrsh << pauseExecution(500)
	rfrsh << sendCmdtoServer("status", "2", "deviceCommand", "refreshResponse")
	rfrsh << pauseExecution(500)
	rfrsh << sendCmdtoServer("status", "3", "deviceCommand", "refreshResponse")
	rfrsh << pauseExecution(500)
	rfrsh << sendCmdtoServer("status", "4", "deviceCommand", "refreshResponse")
    rfrsh << pauseExecution(500)
    rfrsh << sendCmdtoServer("status", "5", "deviceCommand", "refreshResponse")
    rfrsh << pauseExecution(500)
    rfrsh << sendCmdtoServer("status", "6", "deviceCommand", "refreshResponse")
    rfrsh
}
def refreshResponse(cmdResponse, deviceNo){
    log.debug "cmdresponse ${cmdResponse}"
    def status
	if (cmdResponse == "TcpTimeout") {
		log.error "$device.name $device.label: Communications Error"
		sendEvent(name: "Plug_${deviceNo}", value: "offline", descriptionText: "ERROR - OffLine - mod onOffResponse")
	} else {
        if (cmdResponse == true){
            status = "on"
        }else{
            status = "off"
		}
		log.info "${device.name} ${device.label}: Power: ${status}"
		sendEvent(name: "Plug_${deviceNo}", value: status)
	}
}
//	----- SEND COMMAND DATA TO THE SERVER -------------------------------------

private sendCmdtoServer(command, deviceNo, hubCommand, action){
//	added deviceNo to items put in header.
//	Will add to the node.js script to extract then add to response.
   // def deviceIP
   // def deviceID
    def dps 
    switch(deviceNo) {
        case "1":
    		deviceIP = deviceIP
    		deviceID = deviceID
            dps = deviceNo
        	break
        case "2":
    		deviceIP = deviceIP
    		deviceID = deviceID
            dps = deviceNo
        	break
        case "3":
    		deviceIP = deviceIP
    		deviceID = deviceID
            dps = deviceNo
        	break
        case "4":
    		deviceIP = deviceIP
    		deviceID = deviceID
            dps = deviceNo
        	break
         case "5":
    		deviceIP = deviceIP
    		deviceID = deviceID
            dps = deviceNo
        	break
         case "6":
    		deviceIP = deviceIP
    		deviceID = deviceID
            dps = deviceNo
        	break
        default:
            break
    }
	def headers = [:] 
	headers.put("HOST", "$gatewayIP:8083")	//	SET TO VALUE IN JAVA SCRIPT PKG.
	headers.put("tuyapi-ip", deviceIP)
	headers.put("tuyapi-devid", deviceID)
	headers.put("tuyapi-localkey", localKey)
	headers.put("tuyapi-command", command)
    headers.put("action", action)
	headers.put("command", hubCommand)
    headers.put("deviceNo", deviceNo)
    headers.put("dps", dps)
   // log.debug "${hubCommand}"
	def hubCmd = new hubitat.device.HubAction([
        method: "GET",
		headers: headers]
    
	)
    log.debug "${hubCmd}"
    hubCmd
    
}

def parse(response) {
//	extract also deviceNo from header to pass to parse methods.
	def resp = parseLanMessage(response)
	def action = resp.headers["action"]
    def deviceNo = resp.headers["deviceNo"]
	def jsonSlurper = new JsonSlurper()
	def cmdResponse = jsonSlurper.parseText(resp.headers["cmd-response"])
    def onoff = resp.headers["onoff"]
log.error onoff
log.error deviceNo
log.error cmdResponse
    
    if (cmdResponse == "TcpTimeout") {
		log.error "$device.name $device.label: Communications Error"
		sendEvent(name: "switch", value: "offline", descriptionText: "ERROR at hubResponseParse TCP Timeout")
		sendEvent(name: "deviceError", value: "TCP Timeout in Hub")
	} else {
        log.debug "line 175 ${action} and ${cmdResponse}"
		actionDirector(action, cmdResponse, onoff, deviceNo)
		sendEvent(name: "deviceError", value: "OK")
	}
}
def actionDirector(action, cmdResponse, onoff, deviceNo) {
	switch(action) {
		case "onOffResponse":
        onOffResponse(onoff, deviceNo)
			break

		case "refreshResponse":
        log.debug "line 188 ${cmdResponse}"
			refreshResponse(cmdResponse, deviceNo)
			break

		default:
			log.debug "at default"
	}
}
