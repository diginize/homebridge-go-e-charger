import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import {AbstractAccessory} from "./abstract.accessory";
import {AbstractPlatform} from "../platforms/abstract.platform";
import {GoEChargerLocal} from "../services/go-e-charger-local";
import * as uuid from 'uuid'
import {CarEnum} from "../models/api/car.enum";
import {YesNoEnum} from "../models/api/yes-no.enum";
import {UnlockStateEnum} from "../models/api/unlock-state.enum";
import {AccessStateEnum} from "../models/api/access-state.enum";

export class ChargingAccessory extends AbstractAccessory {

    readonly parentName = ChargingAccessory.name;

    get displayName(): string {
        return 'Wallbox ' + this.instanceId;
    }

    private _lockTargetStateCharging: CharacteristicValue = -1;
    private _lockTargetStateCable: CharacteristicValue = -1;

    private _lockCurrentStateCharging: CharacteristicValue = -1;
    private _lockCurrentStateCable: CharacteristicValue = -1;
    private _contactAllowPwmState: CharacteristicValue = -1;
    private _contactIsChargingState: CharacteristicValue = -1;

    readonly UUID_LOCK_MECHANISM_CHARGING = uuid.v5('lock-allow-charging', this.UUID);
    readonly UUID_LOCK_MECHANISM_CABLE = uuid.v5('lock-allow-unplug', this.UUID);
    readonly UUID_ALLOW_PWM_CONTACT_SENSOR = uuid.v5('allow-pwm-signal', this.UUID);
    readonly UUID_CHARGING_CONTACT_SENSOR = uuid.v5('contact-charging', this.UUID);

    constructor(
        platform: AbstractPlatform,
        instanceId?: string
    ) {
        super(platform, instanceId);
    }

    public async setup(accessory: PlatformAccessory): Promise<void> {
        const status = await GoEChargerLocal.getService().getStatus();

        // set accessories information
        accessory.getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'go-e')
            .setCharacteristic(this.platform.Characteristic.Model, 'HOME')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, status.sse);

        // register lock mechanism (allow charging)
        const lockCharging = accessory.getService('Allow Charging') ||
            accessory.addService(this.platform.Service.LockMechanism, 'Allow Charging', this.UUID_LOCK_MECHANISM_CHARGING);

        lockCharging.getCharacteristic(this.platform.Characteristic.LockTargetState)
            .onSet(this.setLockTargetCharging.bind(this))
            .onGet(this.getLockTargetCharging.bind(this));

        // register lock mechanism (allow cable unplug)
        const lockCable = accessory.getService('Allow Cable Unplug') ||
            accessory.addService(this.platform.Service.LockMechanism, 'Allow Cable Unplug', this.UUID_LOCK_MECHANISM_CABLE);

        lockCable.getCharacteristic(this.platform.Characteristic.LockTargetState)
            .onSet(this.setLockTargetCable.bind(this))
            .onGet(this.getLockTargetCable.bind(this));

        // register contact sensor (allow pwm signal)
        const allowPwmSignal = accessory.getService('Allow PWM Signal') ||
            accessory.addService(this.platform.Service.ContactSensor, 'Allow PWM Signal', this.UUID_ALLOW_PWM_CONTACT_SENSOR);

        // register contact sensor (car is charging)
        const carCharging = accessory.getService('Car Charging') ||
            accessory.addService(this.platform.Service.ContactSensor, 'Car Charging', this.UUID_CHARGING_CONTACT_SENSOR);

        // update values asynchronously
        setInterval(async () => {
            const state = await GoEChargerLocal.getService().getStatus();

            // lock (allow charging)
            const lockStateCharging = state.ast == AccessStateEnum.open ?
                this.platform.Characteristic.LockCurrentState.UNSECURED :
                this.platform.Characteristic.LockCurrentState.SECURED;
            if (this._lockCurrentStateCharging !== lockStateCharging) {
                this._lockCurrentStateCharging = lockStateCharging;
                lockCharging.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this._lockCurrentStateCharging);
                this.platform.log.info('Triggering Allow Charging Lock State:', this._lockCurrentStateCharging);
            }

            // lock (allow cable unplug)
            const lockStateCable = state.ust == UnlockStateEnum.alwaysLocked ?
                this.platform.Characteristic.LockCurrentState.SECURED :
                this.platform.Characteristic.LockCurrentState.UNSECURED;
            if (this._lockCurrentStateCable !== lockStateCable) {
                this._lockCurrentStateCable = lockStateCable;
                lockCable.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this._lockCurrentStateCable);
                this.platform.log.info('Triggering Allow Cable Unplug Lock State:', this._lockCurrentStateCable);
            }

            // todo: move to advanced stuff
            // contact sensor (allow pwm signal)
            const allowPwmState = state.alw == YesNoEnum.yes ?
                this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED :
                this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;
            if (this._contactAllowPwmState !== allowPwmState) {
                this._contactAllowPwmState = allowPwmState;
                allowPwmSignal.updateCharacteristic(this.platform.Characteristic.ContactSensorState, this._contactAllowPwmState);
                this.platform.log.info('Triggering Allow PWM Signal Contact Sensor:', this._contactAllowPwmState);
            }

            // contact sensor (car is charging)
            const chargingState = state.car == CarEnum.vehicleLoads ?
                this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED :
                this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;
            if (this._contactIsChargingState !== chargingState) {
                this._contactIsChargingState = chargingState;
                carCharging.updateCharacteristic(this.platform.Characteristic.ContactSensorState, this._contactIsChargingState);
                this.platform.log.info('Triggering Car Charging Contact Sensor:', this._contactIsChargingState);
            }
        }, 5000);
    }

    async setLockTargetCharging(value: CharacteristicValue) {
        const state = await GoEChargerLocal
            .getService()
            .updateValue(
                GoEChargerLocal.getService().hostname,
                'ast',
                value === this.platform.Characteristic.LockTargetState.UNSECURED ? AccessStateEnum.open : AccessStateEnum.rfidOrAppNeeded
            );
        this._lockTargetStateCharging = state.ast == AccessStateEnum.open ?
            this.platform.Characteristic.LockTargetState.UNSECURED :
            this.platform.Characteristic.LockTargetState.SECURED;

        this.platform.log.info('Set Characteristic Lock Target Charging ->', this._lockTargetStateCharging, `(received target state: ${value})`);
    }

    async getLockTargetCharging(): Promise<CharacteristicValue> {
        if (this._lockTargetStateCharging === -1) {
            const state = await GoEChargerLocal.getService().getStatus();
            this._lockTargetStateCharging = state.ast == AccessStateEnum.open ?
                this.platform.Characteristic.LockTargetState.UNSECURED :
                this.platform.Characteristic.LockTargetState.SECURED;
        }

        this.platform.log.info('Get Characteristic Lock Target Charging ->', this._lockTargetStateCharging);

        return this._lockTargetStateCharging;
    }

    async setLockTargetCable(value: CharacteristicValue) {
        const state = await GoEChargerLocal
            .getService()
            .updateValue(
                GoEChargerLocal.getService().hostname,
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
            const state = await GoEChargerLocal.getService().getStatus();
            this._lockTargetStateCable = state.ust == UnlockStateEnum.alwaysLocked ?
                this.platform.Characteristic.LockTargetState.SECURED :
                this.platform.Characteristic.LockTargetState.UNSECURED;
        }

        this.platform.log.info('Get Characteristic Lock Target Cable ->', this._lockTargetStateCable);

        return this._lockTargetStateCable;
    }

}
