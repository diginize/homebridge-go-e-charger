<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

[![npm](https://badgen.net/npm/v/homebridge-go-e-charger/latest?icon=npm&label)](https://www.npmjs.com/package/homebridge-go-e-charger)
[![npm](https://badgen.net/npm/dt/homebridge-go-e-charger?label=downloads)](https://www.npmjs.com/package/homebridge-go-e-charger)
[![release](https://badgen.net/github/release/diginize/homebridge-go-e-charger)](https://github.com/diginize/homebridge-go-e-charger/releases)
[![license](https://badgen.net/github/license/diginize/homebridge-go-e-charger)](https://github.com/diginize/homebridge-go-e-charger/blob/main/LICENSE)
[![Node.js Package](https://github.com/diginize/homebridge-go-e-charger/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/diginize/homebridge-go-e-charger/actions/workflows/npm-publish.yml)
[![Node.js CI](https://github.com/diginize/homebridge-go-e-charger/actions/workflows/npm-test.yml/badge.svg?branch=main)](https://github.com/diginize/homebridge-go-e-charger/actions/workflows/npm-test.yml)

# Homebridge go-eCharger

A homebridge integration for the go-eCharger wallbox.

> :warning: This plugin is currently beta. It should work but is only tested in a small variety of different cases. Please feel free to install it, use it and give feedback.

## Prerequisites

- go-eCharger installed and connected to the same network
- activated HTTP API v1 (App / Internet / Erweiterte Einstellungen / Aktiviere lokale HTTP API v1)
- activated HTTP API v2 (App / Internet / Erweiterte Einstellungen / Aktiviere lokale HTTP API v2)

## Configuration

You can use this plugin to add multiple go-eChargers to HomeKit. Therefore, multiple platform configurations are needed.
If you are using [homebridge-config-ui-x](https://github.com/oznu/homebridge-config-ui-x) you can simply use the ui to configure the plugin.

Basically each platform configuration consists of three configuration values:

| key | type | description |
|---|---|---|
| instanceId | string | Some identifier for your wallbox. May be any string. | 
| hostname | string | The dns hostname or ip address of your go-eCharger. |
| enableAdvancedAccessories | boolean | Enables advanced accessories. This is meant for users who want to have more control via HomeKit. | 

## Available Accessories

The following accessories are available in HomeKit, when using this plugin:

| name | type | advanced mode | description |
|---|---|---|---|
| Allow Charging | lock | | If unlocked everyone can charge. Locked state restricts charging to authenticated users (RFID / app). |
| Car Charging | contact sensor | | Notifies you when a car is plugged in and starts or ends charging. |
| Allow PWM Signal | contact sensor | X | Alerts you if the charger was unlocked via RFID card, app or because Allow Charging was unlocked |
| Allow Cable Unplug | lock | X | If unlocked the type 2 cable (on the side of the charger) can only be unplugged when no car is connected. If locked the type 2 cable will be always locked. If you want the plug to be unlocked after charging, this must be set using the go-eCharger app. As soon as changed via HomeKit this setting will be set again as described. |
| Status LED | light bulb | X | With this accessory you can control the brightness of the LEDs of your wallbox. |
| LED Save Energy | switch | X | If enabled, the LEDs will turn off after 10 seconds of standby. |
| Wallbox Temperature | temperature sensor | X | When charging, the go-eCharger returns the current temperature in degrees celsius. If this setting is not returned by your charger, the accessory will display an error. |

## Support & Contribution

This project is not commercially developed or maintained.
Therefore, it might take some time after opening an issue until it is solved.
But anyway: If you experience any bugs feel free to open an issue or create a pull request.
Contribution is always welcome.

## Further information

To get further information about the go-eCharger please visit the manufacturer's website [go-e.co](https://go-e.co/).

The API documentation can be found in the following repository [goecharger/go-eCharger-API-v1](https://github.com/goecharger/go-eCharger-API-v1).