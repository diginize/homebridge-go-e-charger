import {CharacteristicValue, PlatformAccessory} from 'homebridge';
import {AbstractAccessory} from "./abstract.accessory";
import {AbstractPlatform} from "../platforms/abstract.platform";
import {GoEChargerLocal} from "../services/go-e-charger-local";
import * as uuid from 'uuid'
import {YesNoEnum} from "../models/api/yes-no.enum";
import {UnlockStateEnum} from "../models/api/unlock-state.enum";

export class AdvancedChargingAccessory extends AbstractAccessory {

    readonly parentName = AdvancedChargingAccessory.name;

    get displayName(): string {
        return 'Wallbox ' + this.instanceId + ' (advanced)';
    }

    private _lockTargetStateCable: CharacteristicValue = -1;

    private _lockCurrentStateCable: CharacteristicValue = -1;
    private _contactAllowPwmState: CharacteristicValue = -1;

    readonly UUID_LOCK_MECHANISM_CABLE = uuid.v5('lock-allow-unplug', this.UUID);
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

        // register lock mechanism (allow cable unplug)
        const lockCable = accessory.getService('Allow Cable Unplug') ||
            accessory.addService(this.platform.Service.LockMechanism, 'Allow Cable Unplug', this.UUID_LOCK_MECHANISM_CABLE);

        lockCable.getCharacteristic(this.platform.Characteristic.LockTargetState)
            .onSet(this.setLockTargetCable.bind(this))
            .onGet(this.getLockTargetCable.bind(this));

        // register contact sensor (allow pwm signal)
        const allowPwmSignal = accessory.getService('Allow PWM Signal') ||
            accessory.addService(this.platform.Service.ContactSensor, 'Allow PWM Signal', this.UUID_ALLOW_PWM_CONTACT_SENSOR);

        // update values asynchronously
        setInterval(async () => {
            const state = await GoEChargerLocal.getService(this.instanceId).getStatus();

            // lock (allow cable unplug)
            const lockStateCable = state.ust == UnlockStateEnum.alwaysLocked ?
                this.platform.Characteristic.LockCurrentState.SECURED :
                this.platform.Characteristic.LockCurrentState.UNSECURED;
            if (this._lockCurrentStateCable !== lockStateCable) {
                this._lockCurrentStateCable = lockStateCable;
                lockCable.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this._lockCurrentStateCable);
                this.platform.log.info('Triggering Allow Cable Unplug Lock State:', this._lockCurrentStateCable);
            }

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

    async setLockTargetCable(value: CharacteristicValue) {
        const service = GoEChargerLocal.getService(this.instanceId);
        const state = await service
            .updateValue(
                service.hostname,
                'ust',
                value === this.platform.Characteristic.LockTargetState.UNSECURED ? UnlockStateEnum.lockWhileCarPluggedIn : UnlockStateEnum.alwaysLocked
            );
        this._lockTargetStateCable = state.ust == UnlockStateEnum.alwaysLocked ?
            this.platform.Characteristic.LockTargetState.SECURED :
            this.platform.Characteristic.LockTargetState.UNSECURED;

        this.platform.log.info('Set Characteristic Lock Target Cable ->', this._lockTargetStateCable, `(received target state: ${value})`);
    }

    async getLockTargetCable(): Promise<CharacteristicValue> {
        if (this._lockTargetStateCable === -1) {
            const state = await GoEChargerLocal.getService(this.instanceId).getStatus();
            this._lockTargetStateCable = state.ust == UnlockStateEnum.alwaysLocked ?
                this.platform.Characteristic.LockTargetState.SECURED :
                this.platform.Characteristic.LockTargetState.UNSECURED;
        }

        this.platform.log.info('Get Characteristic Lock Target Cable ->', this._lockTargetStateCable);

        return this._lockTargetStateCable;
    }

}
