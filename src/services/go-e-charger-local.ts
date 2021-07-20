import * as http from "http";
import * as https from "https";
import {Status, StatusWritable} from "../models/api/status";

export class GoEChargerLocal {

    private static _service?: GoEChargerLocal;

    public static getService(): GoEChargerLocal {
        if (!this._service) {
            this._service = new GoEChargerLocal();
        }

        return this._service;
    }

    readonly protocol = 'http';
    readonly basePath = '';

    get httpModule(): typeof http | typeof https {
        return this.protocol === 'http' ? http : https;
    }

    public hostname: string = '';

    private _status?: Status;
    private _lastUpdate?: number;

    private setStatus(status: Status): void {
        this._status = status;
        this._lastUpdate = Date.now();
    }

    async getStatus(hostname: string = this.hostname, cacheTtlMs: number = 1000): Promise<Status> {
        if (!this._lastUpdate || this._lastUpdate + cacheTtlMs <= Date.now()) {
            const status = await this.performRequest(hostname, '/status');
            this.setStatus(status);
        }

        return this._status as Status;
    }

    async updateValue<T extends StatusWritable, K extends keyof T>(hostname: string = this.hostname, payloadKey?: K, payloadValue?: T[K]): Promise<Status> {
        const status = await this.performRequest(hostname, '/mqtt', payloadKey, payloadValue);
        this.setStatus(status);

        return status;
    }

    protected getBaseUrl(hostname: string, path?: string): string {
        return `${this.protocol}://${hostname}${this.basePath}${path || ''}`;
    }

    protected performRequest<R = Status, I = StatusWritable, K extends keyof I = never>(hostname: string, path?: string, payloadKey?: K, payloadValue?: I[K]): Promise<R> {
        return new Promise<R>((resolve, reject) => {
            let url = this.getBaseUrl(hostname, path);

            if (payloadKey !== undefined && payloadValue !== undefined) {
                url += `?payload=${encodeURIComponent(payloadKey as string)}=${encodeURIComponent(payloadValue as any)}`;
            }

            this.httpModule.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (e) {
                        console.error(`[${GoEChargerLocal.name}] Error performing request to "${url}". Received response "${data}"`);
                        reject(e);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

}