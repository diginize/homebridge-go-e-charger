import {
    API,
    Characteristic,
    DynamicPlatformPlugin,
    Logger,
    PlatformAccessory,
    Service
} from 'homebridge';
import {ClassConstructor} from "../helpers/class-constructor";
import * as uuid from "uuid";
import {PlatformConfig} from "../models/platform-config";

export abstract class AbstractPlatform implements DynamicPlatformPlugin {

    public readonly platformUuidNs = '5e5e897a-659f-4b2d-aca7-9fea360ebb38';
    abstract get parent(): ClassConstructor<AbstractPlatform>;

    public getPlatformUuid<T extends AbstractPlatform>(): string {
        return uuid.v5(this.parent.name, this.platformUuidNs);
    }

    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    protected constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) { }

    public abstract configureAccessory(accessory: PlatformAccessory): void;

}
