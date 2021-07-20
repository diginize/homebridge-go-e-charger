export enum ErrorEnum {
    /** Residual Current Device */
    RCCB = 1,

    /** phase disturbance */
    PHASE = 3,

    /** earthing detection */
    NO_GROUND = 8,

    /** other error */
    INTERNAL = 10,
}