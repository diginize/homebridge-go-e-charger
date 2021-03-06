import {API} from 'homebridge';

import {PLATFORM_NAME} from './settings';
import {GoEChargerPlatform} from './platforms/go-e-charger.platform';

/**
 * This method registers the platforms with Homebridge
 */
export = (api: API) => {
    api.registerPlatform(PLATFORM_NAME, GoEChargerPlatform as any);
};
