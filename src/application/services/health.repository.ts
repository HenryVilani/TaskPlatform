
export interface IHealthServiceRepository {

	checkService(): Promise<boolean>;
	waitToConnect(): Promise<boolean>;

}