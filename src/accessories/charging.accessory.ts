import {CharacteristicValue, PlatformAccessory} from 'homebridge';
import {AbstractAccessory} from "./abstract.accessory";
import {GoEChargerLocal} from "../services/go-e-charger-local";
import * as uuid from 'uuid'
import {CarEnum} from "../models/api/car.enum";
import {AccessStateEnum} from "../models/api/access-state.enum";
import {AbstractPlatform} from "../platforms/abstract.platform";

export class ChargingAccessory extends AbstractAccessory {

    readonly parentName = ChargingAccessory.name;

    get displayName(): string {
        return 'Wallbox ' + this.instanceId;
    }

    private _lockTargetStateCharging: CharacteristicValue = -1;

    private _lockCurrentStateCharging: CharacteristicValue = -1;
    private _contactIsChargingState: CharacteristicValue = -1;

    readonly UUID_LOCK_MECHANISM_CHARGING = uuid.v5('lock-allow-charging', this.UUID);
    readonly UUID_CHARGING_CONTACT_SENSOR = uuid.v5('contact-charging', this.UUID);

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

        // register lock mechanism (allow charging)
        const lockCharging = accessory.getService('Allow Charging') ||
            accessory.addService(this.platform.Service.LockMechanism, 'Allow Charging', this.UUID_LOCK_MECHANISM_CHARGING);

        lockCharging.getCharacteristic(this.platform.Characteristic.LockTargetState)
            .onSet(this.setLockTargetCharging.bind(this))
            .onGet(this.getLockTargetCharging.bind(this));

        // register contact sensor (car is charging)
        const carCharging = accessory.getService('Car Charging') ||
            accessory.addService(this.platform.Service.ContactSensor, 'Car Charging', this.UUID_CHARGING_CONTACT_SENSOR);

        // update values asynchronously
        setInterval(async () => {
            const state = await GoEChargerLocal.getService(this.instanceId).getStatus();

            // lock (allow charging)
            const lockStateCharging = state.ast == AccessStateEnum.open ?
                this.platform.Characteristic.LockCurrentState.UNSECURED :
                this.platform.Characteristic.LockCurrentState.SECURED;
            if (this._lockCurrentStateCharging !== lockStateCharging) {
                this._lockCurrentStateCharging = lockStateCharging;
                lockCharging.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this._lockCurrentStateCharging);
                this.platform.log.info('Triggering Allow Charging Lock State:', this._lockCurrentStateCharging);
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
        }, 1000);
    }

    async setLockTargetCharging(value: CharacteristicValue) {
        const service = GoEChargerLocal.getService(this.instanceId);
        const state = await service
            .updateValue(
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
            const state = await GoEChargerLocal.getService(this.instanceId).getStatus();
            this._lockTargetStateCharging = state.ast == AccessStateEnum.open ?
                this.platform.Characteristic.LockTargetState.UNSECURED :
                this.platform.Characteristic.LockTargetState.SECURED;
        }

        this.platform.log.info('Get Characteristic Lock Target Charging ->', this._lockTargetStateCharging);

        return this._lockTargetStateCharging;
    }

}
