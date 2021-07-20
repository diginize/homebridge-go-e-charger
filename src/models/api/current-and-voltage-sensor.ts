export interface CurrentAndVoltageSensor {
    /** voltage on L1 in volts */
    0: number;

    /** voltage on L2 in volts */
    1: number;

    /** voltage on L3 in volts */
    2: number;

    /** voltage on N in volts */
    3: number;

    /** Ampere on L1 in 0.1A (123 equals 12.3A) */
    4: number;

    /** Ampere on L2 in 0.1A */
    5: number;

    /** Ampere on L3 in 0.1A */
    6: number;

    /** power on L1 in 0.1kW (36 equals 3.6kW) */
    7: number;

    /** power on L2 in 0.1kW */
    8: number;

    /** power on L3 in 0.1kW */
    9: number;

    /** power on N in 0.1kW */
    10: number;

    /** total power in 0.01kW (360 equals 3.6kW) */
    11: number;

    /** power factor on L1 in % */
    12: number;

    /** power factor on L2 in % */
    13: number;

    /** power factor on L3 in % */
    14: number;

    /** power factor on N in % */
    15: number;
}