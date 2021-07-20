import * as http from "http";
import * as https from "https";
import {Status, StatusWritable} from "../models/api/status";
import {Logger} from "homebridge";

export class GoEChargerLocal {

    private static _services: {[instanceId: string]: GoEChargerLocal} = {};

    public static getService(instanceId: string): GoEChargerLocal {
        if (!this._services[instanceId]) {
            this._services[instanceId] = new GoEChargerLocal();
        }

        return this._services[instanceId];
    }

    readonly protocol = 'http';
    readonly basePath = '';

    get httpModule(): typeof http | typeof https {
        return this.protocol === 'http' ? http : https;
    }

    public hostname: string = '';

    public log?: Logger;

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

            this.log?.debug('Performing request to:', url);

            this.httpModule.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        this.log?.debug(`Received response for request to "${url}":`, data);

                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (e) {
                        this.log?.error(`Error performing request to "${url}":`, data);

                        reject(e);
                    }
                });
            }).on('error', (error) => {
                this.log?.error(`Error performing request to "${url}":`, error);
                reject(error);
            });
        });
    }

}