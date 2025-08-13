
export interface ICreateTaskControllerDTO {

	name: string;

}

export interface IOutTaskControllerDTO {

	id: string;
	name: string;
	content: string;
	createdAt: string;
	updatedAt: string;
	notifyAt: string | null;


}

export interface IInTaskControllerDTO extends IOutTaskControllerDTO {
	

};

export interface IInDelteTaskControllerDTO {

	id: string;

}
