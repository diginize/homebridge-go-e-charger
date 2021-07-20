import {CharacteristicValue, PlatformAccessory} from 'homebridge';
import {AbstractAccessory} from "./abstract.accessory";
import {GoEChargerLocal} from "../services/go-e-charger-local";
import * as uuid from 'uuid'
import {LedSaveEnergyEnum} from "../models/api/led-save-energy.enum";
import {AbstractPlatform} from "../platforms/abstract.platform";

export class AdvancedLightingAccessory extends AbstractAccessory {

    readonly parentName = AdvancedLightingAccessory.name;

    get displayName(): string {
        return 'Wallbox ' + this.instanceId + ' (lighting)';
    }

    private _lightCurrentBrightness: CharacteristicValue = -1;
    private _lightCurrentBrightnessIO: CharacteristicValue = -1;
    private _lightLastBrightness: CharacteristicValue = -1;
    private _switchLedSaveEnergyStatus: CharacteristicValue = -1;

    readonly UUID_LED_BRIGHTNESS = uuid.v5('led-brightness', this.UUID);
    readonly UUID_LED_SAVE_ENERGY = uuid.v5('led-save-energy', this.UUID);

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

        // register light bulb (led brightness)
        const ledBrightnessLightbulb = accessory.getService('Status LED') ||
            accessory.addService(this.platform.Service.Lightbulb, 'Status LED', this.UUID_LED_BRIGHTNESS);

        ledBrightnessLightbulb.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setLedBrightnessIO.bind(this));

        ledBrightnessLightbulb.getCharacteristic(this.platform.Characteristic.Brightness)
            .onSet(this.setLedBrightness.bind(this));

        // register switch (led save energy)
        const ledSaveEnergySwitch = accessory.getService('LED Save Energy') ||
            accessory.addService(this.platform.Service.Switch, 'LED Save Energy', this.UUID_LED_SAVE_ENERGY);

        ledSaveEnergySwitch.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setLedSaveEnergy.bind(this));

        // update values asynchronously
        setInterval(async () => {
            const state = await GoEChargerLocal.getService(this.instanceId).getStatus();

            // light bulb (led brightness)
            const ledBrightness = Math.round(parseInt(`${state.lbr}`) / 255 * 100);
            if (this._lightCurrentBrightness !== ledBrightness) {
                this._lightCurrentBrightness = ledBrightness;
                this._lightCurrentBrightnessIO = this._lightCurrentBrightness > 0;
                ledBrightnessLightbulb.updateCharacteristic(this.platform.Characteristic.On, this._lightCurrentBrightness > 0);
                ledBrightnessLightbulb.updateCharacteristic(this.platform.Characteristic.Brightness, this._lightCurrentBrightness);
                this.platform.log.info('Triggering LED Brightness State:', this._lightCurrentBrightness);
            }

            // switch (led save energy)
            const ledSaveEnergy = state.lse == LedSaveEnergyEnum.activated;
            if (this._switchLedSaveEnergyStatus !== ledSaveEnergy) {
                this._switchLedSaveEnergyStatus = ledSaveEnergy;
                ledSaveEnergySwitch.updateCharacteristic(this.platform.Characteristic.On, this._switchLedSaveEnergyStatus);
                this.platform.log.info('Triggering LED Save Energy State:', this._switchLedSaveEnergyStatus);
            }
        }, 1000);
    }

    async setLedBrightnessIO(value: CharacteristicValue) {
        if (!value) {
            await this.setLedBrightness(0);
        } else if (!this._lightCurrentBrightnessIO) {
            await this.setLedBrightness(this._lightLastBrightness);
        }

        this._lightCurrentBrightnessIO = value > 0;
    }

    async setLedBrightness(value: CharacteristicValue) {
        if (value === 0 && this._lightCurrentBrightness > 0) {
            this._lightLastBrightness = this._lightCurrentBrightness;
        }

        const service = GoEChargerLocal.getService(this.instanceId);
        const state = await service
            .updateValue(
                service.hostname,
                'lbr',
                Math.round((value as number) / 100 * 255)
            );
        this._lightCurrentBrightness = Math.round(parseInt(`${state.lbr}`) / 255 * 100);

        this.platform.log.info('Set Characteristic LED Brightness ->', this._lightCurrentBrightness, `(received target state: ${value})`);
    }

    async setLedSaveEnergy(value: CharacteristicValue) {
        const service = GoEChargerLocal.getService(this.instanceId);
        const state = await service
            .updateValue(
                service.hostname,
                'r2x',
                value ? LedSaveEnergyEnum.activated : LedSaveEnergyEnum.deactivated
            );
        this._switchLedSaveEnergyStatus = state.lse == LedSaveEnergyEnum.activated;

        this.platform.log.info('Set Characteristic LED Save Energy  ->', this._switchLedSaveEnergyStatus, `(received target state: ${value})`);
    }

}
