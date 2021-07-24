import {VersionEnum} from "./version.enum";
import {CarEnum} from "./car.enum";
import {ErrorEnum} from "./error.enum";
import {AccessStateEnum} from "./access-state.enum";
import {YesNoEnum} from "./yes-no.enum";
import {StopStateEnum} from "./stop-state.enum";
import {Type2CableAmpereEncodingEnum} from "./type-2-cable-ampere-encoding.enum";
import {AdapterInEnum} from "./adapter-in.enum";
import {WifiStateEnum} from "./wifi-state.enum";
import {CurrentAndVoltageSensor} from "./current-and-voltage-sensor";
import {SwitchEnum} from "./switch.enum";
import {AwattarPriceZoneEnum} from "./awattar-price-zone.enum";
import {AmpereLevelEnum} from "./ampere-level.enum";
import {LedSaveEnergyEnum} from "./led-save-energy.enum";
import {UnlockStateEnum} from "./unlock-state.enum";
import {InterfaceSettingsEnum} from "./interface-settings.enum";
import {CloudEnabledStatusEnum} from "./cloud-enabled-status.enum";
import {MqttStateEnum} from "./mqtt-state.enum";
import {Writable} from "../../helpers/conditional-types";

export interface Status {

    readonly version: VersionEnum | number;

    /**
     * reboot_counter
     */
    readonly rbc: number;

    /**
     * reboot_timer
     */
    readonly rbt: number;

    /**
     * Status PWM Signaling
     */
    readonly car: CarEnum | number;

    /**
     * Ampere value for PWM signaling in whole ampere of 6-32A
     */
    amp: number;

    /**
     * Like amp, but will be reset to the last amp value after reboot
     */
    amx: number;

    readonly err: ErrorEnum | number;

    ast: AccessStateEnum | number;

    /**
     * Allow charging
     *
     * PWM signal may be present
     */
    alw: YesNoEnum | number;

    stp: StopStateEnum | number;

    readonly cbl: Type2CableAmpereEncodingEnum | number;

    /**
     * Phases before and after the contactor
     * binary flags: 0b00ABCDEF
     * A ... phase 3, in front of the contactor
     * B ... phase 2 in front of the contactor
     * C ... phase 1 in front of the contactor
     * D ... phase 3 after the contactor
     * E ... phase 2 after the contactor
     * F ... phase 1 after the contactor
     * @example 0b00001000: Phase 1 is available
     * @example 0b00111000: Phase 1-3 is available
     */
    readonly pha: number;

    /** @type {number} Temperature of the controller in degrees celsius */
    readonly tmp: number;

    /**
     * Charges energy in deca-watt seconds
     * @example 100'000 means, 1'000'000 Ws (= 277Wh = 0.277kWh) were charged during this charging process
     */
    readonly dws: number;

    /**
     * Stop value in 0.1kWh if stp==2, for dws parameter
     *
     * Charging station logic: if(dwo!=0 && dws/36000>=dwo)alw=0
     *
     * @example 105 for 10.5 kWh
     */
    dwo: number;

    readonly adi: AdapterInEnum | number;

    /**
     * Unlocked by
     *
     * Number of the rfid card that has activated the current charging process
     */
    readonly uby: number;

    /**
     * Total charged energy in 0.1kWh
     * @example 130 means 13kWh charged
     */
    readonly eto: number;

    readonly wst: WifiStateEnum | number;

    /**
     * Array with values of the current and voltage sensor
     *
     * App logic:
     * if (Math.floor(pha/8) ==1 && parseInt(nrg[3]) > parseInt(nrg[0])) {
     *   nrg[0]=nrg[3]
     *   nrg[7]=nrg[10]
     *   nrg[12]=nrg[15]
     * }
     */
    readonly nrg: CurrentAndVoltageSensor;

    /** Firmware version */
    readonly fwv: string;

    /** Serial number */
    readonly sse: string;

    /** Wifi SSID */
    wss: string;

    /**
     * Wifi Key
     * @example "****" for fwv after 020
     * @example "password" for fwv before 020
     */
    wke: string;

    /** @type {SwitchEnum} Wifi enabled */
    wen: SwitchEnum | number;

    /**
     * Time zone in hours for internal battery powered clock +100
     * @example 101 is GMT + 1
     */
    tof: number;

    /**
     * Daylight saving time offset (summer time) in hours
     * @example 1 for Central Europe
     */
    tds: number;

    /**
     * LED brightness from 0-255
     *
     * 0 = LED off
     *
     * 255 = LED brightness maximum
     */
    lbr: number;

    /**
     * Minimum number of hours in which to load with "electricity price - automatic"
     * @example 2 ("Car is full enough after 2 hours")
     */
    aho: number;

    /**
     * Hour (time) in which with "electricity price - automatic" the charge mus have lasted at least aho hours.
     * @example 7 ("Done until 7:00, so before at least 2 hours loaded")
     */
    afi: number;
    
    azo: AwattarPriceZoneEnum | number;

    /**
     * Absolute max. Ampere: Maximum value for ampere setting
     * @example 20 (cannot be set to more than 20A in the app)
     */
    ama: number;

    /**
     * Ampere Level 1 for push button on device.
     * 
     * 6-32: Ampere level activated
     * 
     * 0: level deactivated (is skipped)
     */
    al1: AmpereLevelEnum | number;
    
    /**
     * Ampere Level 2 for push button on device.
     * 
     * Must be either 0 or >al1
     */
    al2: AmpereLevelEnum | number;

    /**
     * Ampere Level 3 for push button on device.
     *
     * Must be either 0 or >al2
     */
    al3: AmpereLevelEnum | number;

    /**
     * Ampere Level 4 for push button on device.
     *
     * Must be either 0 or >al3
     */
    al4: AmpereLevelEnum | number;

    /**
     * Ampere Level 5 for push button on device.
     *
     * Must be either 0 or >al4
     */
    al5: AmpereLevelEnum | number;

    /**
     * Color idle: color value for standby (no car plugged in) as number
     * @example parseInf('#00FFFF'): 65535 (blue / green, default)
     */
    cid: number;

    /**
     * Color charging: color value for charging active, as number
     * @example parseInf('#0000FF'): 255 (blue, default)
     */
    cch: number;

    /**
     * Color charging: color value for completed charging, as number
     * @example parseInf('#00FF00'): 65280 (green, default)
     */
    cfi: number;

    lse: LedSaveEnergyEnum | number | boolean;

    ust: UnlockStateEnum | number;

    /**
     * Wifi Hotspot Password
     * @example "abdef0123456"
     */
    wak: string;

    /**
     * Flags
     *
     * 0b1: HTTP Api in the WLAN network activated (0: no, 1: yes)
     *
     * 0b10: End-to-end encryption enabled (0: no, 1: yes)
     */
    r1x: InterfaceSettingsEnum | number;

    /**
     * Remaining time in milliseconds remaining on activation by electricity prices
     *
     * App logic:
     *
     * if (json.car==1) message = "Zuerst Auto anstecken"
     * else message = "Restzeit: …"
     */
    dto: number;

    /** @type {SwitchEnum} Norway mode activated */
    nmo: SwitchEnum | number;

    /**
     * Charged energy for rfid card 1 in 0.1kWh
     * @example 1400 = 140kWh charged on card 1
     */
    readonly eca: number;

    /**
     * Charged energy for rfid card 2 in 0.1kWh
     * @example 1400 = 140kWh charged on card 2
     */
    readonly ecr: number;

    /**
     * Charged energy for rfid card 3 in 0.1kWh
     * @example 1400 = 140kWh charged on card 3
     */
    readonly ecd: number;

    /**
     * Charged energy for rfid card 4 in 0.1kWh
     * @example 1400 = 140kWh charged on card 4
     */
    readonly ec4: number;

    /**
     * Charged energy for rfid card 5 in 0.1kWh
     * @example 1400 = 140kWh charged on card 5
     */
    readonly ec5: number;

    /**
     * Charged energy for rfid card 6 in 0.1kWh
     * @example 1400 = 140kWh charged on card 6
     */
    readonly ec6: number;

    /**
     * Charged energy for rfid card 7 in 0.1kWh
     * @example 1400 = 140kWh charged on card 7
     */
    readonly ec7: number;

    /**
     * Charged energy for rfid card 8 in 0.1kWh
     * @example 1400 = 140kWh charged on card 8
     */
    readonly ec8: number;

    /**
     * Charged energy for rfid card 9 in 0.1kWh
     * @example 1400 = 140kWh charged on card 9
     */
    readonly ec9: number;

    /**
     * Charged energy for rfid card 10 in 0.1kWh
     * @example 1400 = 140kWh charged on card 10
     */
    readonly ec1: number;

    /**
     * ID of rfid card 1
     */
    readonly rca: string;

    /**
     * ID of rfid card 2
     */
    readonly rcr: string;

    /**
     * ID of rfid card 3
     */
    readonly rcd: string;

    /**
     * ID of rfid card 4
     */
    readonly rc4: string;

    /**
     * ID of rfid card 5
     */
    readonly rc5: string;

    /**
     * ID of rfid card 6
     */
    readonly rc6: string;

    /**
     * ID of rfid card 7
     */
    readonly rc7: string;

    /**
     * ID of rfid card 8
     */
    readonly rc8: string;

    /**
     * ID of rfid card 9
     */
    readonly rc9: string;

    /**
     * ID of rfid card 10
     */
    readonly rc1: string;

    /**
     * Name of rfid card 1
     */
    rna: string;

    /**
     * Name of rfid card 2
     */
    rnr: string;

    /**
     * Name of rfid card 3
     */
    rne: string;

    /**
     * Name of rfid card 4
     */
    rn4: string;

    /**
     * Name of rfid card 5
     */
    rn5: string;

    /**
     * Name of rfid card 6
     */
    rn6: string;

    /**
     * Name of rfid card 7
     */
    rn7: string;

    /**
     * Name of rfid card 8
     */
    rn8: string;

    /**
     * Name of rfid card 9
     */
    rn9: string;

    /**
     * Name of rfid card 10
     */
    rn1: string;

    /**
     * Current time, formatted as ddmmyyhhmm
     * @example 0104191236 corresponds to 01.04.2019 12:36
     */
    tme: string;

    /**
     * Scheduler settings (base64 encoded)
     *
     * Functions for encode and decode are here: https://gist.github.com/peterpoetzi/6cd2fad2a915a2498776912c5aa137a8
     *
     * The settings can be set in this way:
     *
     * r21=Math.floor(encode(1))
     *
     * r31=Math.floor(encode(2))
     *
     * r41=Math.floor(encode(3))
     *
     * Direct setting of sch = is not supported
     */
    sch: string;

    /**
     * Scheduler double press
     *
     * Activates charge after double pressing the button if the load has just been interrupted by the scheduler
     * @example 1 = Function disabled
     * @example 2 = Allow charge immediately
     */
    sdp: SwitchEnum | number;

    /**
     * Update available
     *
     * only available if connected via go-e server
     */
    upd: YesNoEnum | number;

    /**
     * Cloud disabled
     */
    cdi: CloudEnabledStatusEnum | number;

    /**
     * Load balancing enabled
     * @example 0 = load balancing disabled
     * @example 1 = load balancing activated via cloud
     */
    loe: SwitchEnum | number;

    /**
     * Load balancing group total ampere
     */
    lot: number;

    /**
     * Load balancing minimum amperage
     */
    lom: number;

    /**
     * Load balancing priority
     */
    lop: number;

    /**
     * Load balancing group ID
     */
    readonly log: string;

    /**
     * Load balancing expected number of charging stations
     */
    readonly lon: number;

    /**
     * Load balancing fallback amperage
     */
    readonly lof: number;

    /**
     * Load balancing ampere (current permitted charging current)
     */
    readonly loa: number;

    /**
     * Load balancing seconds since the last current flow while the car is still plugged in
     * @example 0 when charging is in progress
     */
    readonly lch: number;

    /**
     * MQTT custom enabled
     *
     * Connect to your own MQTT server
     */
    mce: SwitchEnum | number;

    /**
     * MQTT custom server (hostname without protocol specification)
     * @example "test.mosquitto.org"
     */
    mcs: string;

    /**
     * MQTT custom port
     * @example 1883
     */
    mcp: number;

    /**
     * MQTT custom username
     */
    mcu: string;

    /**
     * MQTT custom key
     *
     * For MQTT authentication
     */
    mck: string;

    /**
     * MQTT custom connected
     */
    readonly mcc: MqttStateEnum | number;

}

export type StatusWritable = Writable<Status> & {
    /**
     * Setter for lse in v1 api
     */
    r2x: LedSaveEnergyEnum | number;
};