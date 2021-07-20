import {AbstractPlatform} from "../platforms/abstract.platform";
import * as uuid from 'uuid';
import {ClassConstructor} from "../helpers/class-constructor";
import {PlatformAccessory} from "homebridge";

export abstract class AbstractAccessory {

    public abstract get parent(): ClassConstructor<AbstractAccessory>;

    public get UUID(): string {
        return this.getAccessoryUuid(this.platform, this.instanceId);
    }

    public abstract get displayName(): string;

    protected constructor(
        public readonly platform: AbstractPlatform,
        public instanceId?: string
    ) { }

    public abstract setup(accessory: PlatformAccessory): Promise<void>;

    public getAccessoryUuid<T extends AbstractPlatform>(platform: T, instanceId?: string): string {
        let id = uuid.v5(this.parent.name, platform.getPlatformUuid());

        if (instanceId) {
            id = uuid.v5(instanceId, id);
        }

        return id;
    }

}