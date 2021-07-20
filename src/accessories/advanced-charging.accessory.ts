import {CharacteristicValue, PlatformAccessory} from 'homebridge';
import {AbstractAccessory} from "./abstract.accessory";
import {AbstractPlatform} from "../platforms/abstract.platform";
import {GoEChargerLocal} from "../services/go-e-charger-local";
import * as uuid from 'uuid'
import {YesNoEnum} from "../models/api/yes-no.enum";

export class AdvancedChargingAccessory extends AbstractAccessory {

    readonly parentName = AdvancedChargingAccessory.name;

    get displayName(): string {
        return 'Wallbox ' + this.instanceId + ' (advanced)';
    }

    private _contactAllowPwmState: CharacteristicValue = -1;

    readonly UUID_ALLOW_PWM_CONTACT_SENSOR = uuid.v5('allow-pwm-signal', this.UUID);

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

        // register contact sensor (allow pwm signal)
        const allowPwmSignal = accessory.getService('Allow PWM Signal') ||
            accessory.addService(this.platform.Service.ContactSensor, 'Allow PWM Signal', this.UUID_ALLOW_PWM_CONTACT_SENSOR);

        // update values asynchronously
        setInterval(async () => {
            const state = await GoEChargerLocal.getService(this.instanceId).getStatus();

            // contact sensor (allow pwm signal)
            const allowPwmState = state.alw == YesNoEnum.yes ?
                this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED :
                this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;
            if (this._contactAllowPwmState !== allowPwmState) {
                this._contactAllowPwmState = allowPwmState;
                allowPwmSignal.updateCharacteristic(this.platform.Characteristic.ContactSensorState, this._contactAllowPwmState);
                this.platform.log.info('Triggering Allow PWM Signal Contact Sensor:', this._contactAllowPwmState);
            }
        }, 5000);
    }

}
