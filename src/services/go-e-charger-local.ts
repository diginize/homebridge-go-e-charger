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
    private _currentRequest?: Promise<Status>;
    private _lastUpdate?: number;

    private setStatus(status: Status): void {
        this._status = status;
        this._lastUpdate = Date.now();
    }

    async getStatus(cacheTtlMs: number = 2500, hostname: string = this.hostname): Promise<Status> {
        // prevent multiple simultaneous api calls
        if (this._currentRequest) {
            return await this._currentRequest;
        }

        // try to use cached result
        if (!this._lastUpdate || this._lastUpdate + cacheTtlMs <= Date.now()) {
            this._currentRequest = new Promise<Status>(async (resolve) => {
                const status = await this.performRequest(hostname, '/status');
                this.setStatus(status);

                resolve(this._status as Status);
            });

            await this._currentRequest;
            this._currentRequest = undefined;
        }

        return this._status as Status;
    }

    async updateValue<T extends StatusWritable, K extends keyof T>(payloadKey?: K, payloadValue?: T[K], hostname: string = this.hostname): Promise<Status> {
        const status = await this.performRequest(hostname, '/mqtt?payload=' + this.transformGetParameter(payloadKey as any, payloadValue as any));
        this.setStatus(status);

        return status;
    }

    async updateValueV2<T extends StatusWritable, K extends keyof T>(payloadKey?: K, payloadValue?: T[K], hostname: string = this.hostname): Promise<Status> {
        await this.performRequest(hostname, '/api/set?' + this.transformGetParameter(payloadKey as string, JSON.stringify(payloadValue)), false);

        return await this.getStatus(0);
    }

    protected getBaseUrl(hostname: string, path?: string): string {
        return `${this.protocol}://${hostname}${this.basePath}${path || ''}`;
    }

    protected transformGetParameter(key: string, value: string): string {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }

    protected performRequest<R = Status, I = StatusWritable, K extends keyof I = never>(hostname: string, path?: string, parseResponse: boolean = true): Promise<R> {
        return new Promise<R>((resolve, reject) => {
            let url = this.getBaseUrl(hostname, path);

            this.log?.debug('Performing request to:', url);

            this.httpModule.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        this.log?.debug(`Received response for request to "${url}":`, data);

                        let result: any;
                        if (parseResponse) {
                            result = JSON.parse(data);
                        } else {
                            result = data;
                        }

                        resolve(result);
                    } catch (e) {
                        this.log?.error(`Error parsing response from request to "${url}":`, data);

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