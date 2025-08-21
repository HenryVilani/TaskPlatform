
export type ServiceStatus = "Health" | "UnHealth";

export interface IBaseService {

	checkHealth(): Promise<ServiceStatus>

	waitToConnect(): Promise<ServiceStatus>

	getService<T extends any=any>(): Promise<T | null>

}
