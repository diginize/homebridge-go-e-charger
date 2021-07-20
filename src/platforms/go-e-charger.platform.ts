import {API, Logger, PlatformAccessory} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from '../settings';
import {ChargingAccessory} from '../accessories/charging.accessory';
import {PlatformConfig} from "../models/platform-config";
import {AbstractAccessory} from "../accessories/abstract.accessory";
import {AbstractPlatform} from "./abstract.platform";
import {ClassConstructor} from "../helpers/class-constructor";
import {GoEChargerLocal} from "../services/go-e-charger-local";
import {AdvancedChargingAccessory} from "../accessories/advanced-charging.accessory";
import {AdvancedLightingAccessory} from "../accessories/advanced-lighting.accessory";
import {AdvancedTemperatureAccessory} from "../accessories/advanced-temperature.accessory";

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class GoEChargerPlatform extends AbstractPlatform {

    public readonly parentName = GoEChargerPlatform.name;

    // this is used to track restored cached accessories
    public readonly accessories: PlatformAccessory[] = [];

    constructor(
        log: Logger,
        config: PlatformConfig,
        api: API,
    ) {
        super(log, config, api);

        this.log.debug('Finished initializing platform:', this.config.name);

        // setup go-e api
        const apiService = GoEChargerLocal.getService(this.config.instanceId);
        apiService.log = log;
        apiService.hostname = config.hostname;

        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', () => {
            log.debug('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            this.discoverDevices();
        });
    }

    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessories from cache:', accessory.displayName);

        // add the restored accessories to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }

    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices() {

        const accessories: ClassConstructor<AbstractAccessory>[] = [
            ChargingAccessory,
        ];
        const advancedAccessories: ClassConstructor<AbstractAccessory>[] = [
            AdvancedChargingAccessory,
            AdvancedLightingAccessory,
            AdvancedTemperatureAccessory,
        ];

        const discoveredAccessories: ClassConstructor<AbstractAccessory>[] = [
            ...accessories,
            ...(this.config.enableAdvancedAccessories ? advancedAccessories : []),
        ];


        // loop over the discovered devices and register each one if it has not already been registered
        for (const discoveredAccessory of discoveredAccessories) {

            const accessory: AbstractAccessory = new discoveredAccessory(this, this.config.instanceId);

            const id = accessory.UUID;

            // see if an accessories with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === id);

            if (existingAccessory) {
                // the accessories already exists
                this.log.info('Restoring existing accessories from cache:', existingAccessory.displayName);

                // create the accessories handler for the restored accessories
                accessory.setup(existingAccessory).then();
            } else {
                // the accessories does not yet exist, so we need to create it
                this.log.info('Adding new accessories:', accessory.displayName);

                // create a new accessories
                const platformAccessory = new this.api.platformAccessory(accessory.displayName, id);

                // store a copy of the device object in the `accessories.context`
                // the `context` property can be used to store any data about the accessories you may need
                platformAccessory.context.device = accessory;

                // create the accessories handler for the newly create accessories
                accessory.setup(platformAccessory).then(() =>

                    // link the accessories to your platforms
                    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [platformAccessory])
                );

            }

        }
    }
}
