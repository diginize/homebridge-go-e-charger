import {PlatformConfig as HbPlatformConfig} from "homebridge";

export interface PlatformConfig extends HbPlatformConfig {
    hostname: string;
    enableAdvancedAccessories: boolean;
}