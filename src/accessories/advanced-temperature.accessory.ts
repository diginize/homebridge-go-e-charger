import {CharacteristicValue, PlatformAccessory} from 'homebridge';
import {AbstractAccessory} from "./abstract.accessory";
import {GoEChargerLocal} from "../services/go-e-charger-local";
import * as uuid from 'uuid'
import {AbstractPlatform} from "../platforms/abstract.platform";

export class AdvancedTemperatureAccessory extends AbstractAccessory {

    readonly parentName = AdvancedTemperatureAccessory.name;

    get displayName(): string {
        return 'Wallbox ' + this.instanceId + ' (temperature)';
    }

    private _currentTemperature: CharacteristicValue|Error = -1;

    readonly UUID_TEMPERATURE = uuid.v5('temperature-sensor', this.UUID);

    constructor(
        platform: AbstractPlatform,
        instanceId: string
    ) {
        super(platform, instanceId);
    }

    public async setup(accessory: PlatformAccessory): Promise<void> {
        const status = await GoEChargerLocal.getService(this.instanceId).getStatus();

        // set accessories information
        accessory.getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'go-e')
            .setCharacteristic(this.platform.Characteristic.Model, 'HOME')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, status.sse);

        // register temperature sensor
        const temperatureSensor = accessory.getService('Wallbox Temperature') ||
            accessory.addService(this.platform.Service.ContactSensor, 'Wallbox Temperature', this.UUID_TEMPERATURE);

        // update values asynchronously
        setInterval(async () => {
            const state = await GoEChargerLocal.getService(this.instanceId).getStatus();

            // contact sensor (car is charging)
            const temperature = !state.tmp ?
                new Error('Currently not available') :
                parseFloat(`${state.tmp}`);
            if (this._currentTemperature !== temperature && !(this._currentTemperature instanceof Error && temperature instanceof Error)) {
                this._currentTemperature = temperature;
                temperatureSensor.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this._currentTemperature as CharacteristicValue);
                this.platform.log.info('Triggering Temperature:', this._currentTemperature);
            }
        }, 1000);
    }

}
