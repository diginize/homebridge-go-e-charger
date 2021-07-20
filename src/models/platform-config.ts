import {PlatformConfig as HbPlatformConfig} from "homebridge";

export interface PlatformConfig extends HbPlatformConfig {
    instanceId: string;
    hostname: string;
    enableAdvancedAccessories: boolean;
}