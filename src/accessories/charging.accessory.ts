import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import {AbstractAccessory} from "./abstract.accessory";
import {AbstractPlatform} from "../platforms/abstract.platform";
import {GoEChargerLocal} from "../services/go-e-charger-local";
import * as uuid from 'uuid'
import {CarEnum} from "../models/api/car.enum";
import {YesNoEnum} from "../models/api/yes-no.enum";
import {UnlockStateEnum} from "../models/api/unlock-state.enum";

export class ChargingAccessory extends AbstractAccessory {

    readonly parentName = ChargingAccessory.name;

    get displayName(): string {
        return 'Wallbox ' + this.instanceId;
    }

    private _lockTargetStateCharging: CharacteristicValue = -1;
    private _lockTargetStateCable: CharacteristicValue = -1;

    readonly UUID_LOCK_MECHANISM_CHARGING = uuid.v5('lock-allow-charging', this.UUID);
    readonly UUID_LOCK_MECHANISM_CABLE = uuid.v5('lock-allow-unplug', this.UUID);
    readonly UUID_CONTACT_SENSOR = uuid.v5('contact-charging', this.UUID);

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

        // register contact sensor
        const carCharging = accessory.getService('Car Charging') ||
            accessory.addService(this.platform.Service.ContactSensor, 'Car Charging', this.UUID_CONTACT_SENSOR);

        // update values asynchronously
        setInterval(async () => {
            const state = await GoEChargerLocal.getService().getStatus();

            // lock (allow charging)
            const lockStateCharging = state.alw == YesNoEnum.yes ?
                this.platform.Characteristic.LockCurrentState.UNSECURED :
                this.platform.Characteristic.LockCurrentState.SECURED;
            lockCharging.updateCharacteristic(this.platform.Characteristic.LockCurrentState, lockStateCharging);
            this.platform.log.debug('Triggering Allow Charging Lock State:', lockStateCharging);

            // lock (allow cable unplug)
            const lockStateCable = state.ust == UnlockStateEnum.alwaysLocked ?
                this.platform.Characteristic.LockCurrentState.SECURED :
                this.platform.Characteristic.LockCurrentState.UNSECURED;
            lockCable.updateCharacteristic(this.platform.Characteristic.LockCurrentState, lockStateCable);
            this.platform.log.debug('Triggering Allow Cable Unplug Lock State:', lockStateCable);

            // contact sensor
            const contactState = state.car == CarEnum.vehicleLoads ?
                this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED :
                this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;
            carCharging.updateCharacteristic(this.platform.Characteristic.ContactSensorState, contactState);
            this.platform.log.debug('Triggering Car Charging Contact Sensor:', contactState);
        }, 1000);
    }

    async setLockTargetCharging(value: CharacteristicValue) {
        const state = await GoEChargerLocal
            .getService()
            .updateValue(
                GoEChargerLocal.getService().hostname,
                'alw',
                value === this.platform.Characteristic.LockTargetState.UNSECURED ? YesNoEnum.no : YesNoEnum.yes
            );
        this._lockTargetStateCharging = state.alw == YesNoEnum.yes ?
            this.platform.Characteristic.LockTargetState.UNSECURED :
            this.platform.Characteristic.LockTargetState.SECURED;

        this.platform.log.info('Set Characteristic Lock Target Charging ->', this._lockTargetStateCharging, `(received target state: ${value}`);
    }

    async getLockTargetCharging(): Promise<CharacteristicValue> {
        if (this._lockTargetStateCharging === -1) {
            const state = await GoEChargerLocal.getService().getStatus();
            this._lockTargetStateCharging = state.alw == YesNoEnum.yes ?
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

        this.platform.log.info('Set Characteristic Lock Target Cable ->', this._lockTargetStateCable, `(received target state: ${value}`);
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
