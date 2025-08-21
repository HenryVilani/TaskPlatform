
export type HealthServiceStatus = "Health" | "UnHealth";

export interface IHealthService {

	isHealth(): Promise<HealthServiceStatus>;

	getService<T extends any=any>(): Promise<T | null>

}
