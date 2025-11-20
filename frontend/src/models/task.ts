export type TaskSource = 'ege' | 'fipi' | 'other';

export interface DownloadableTask {
	id: number;
	title: string;
	source: TaskSource;
	description?: string;
	file_url: string;
	file_type: 'word' | 'pdf' | 'zip';
	file_size?: number;
	year?: number;
	subject?: string;
	created_at: string;
}

export interface TaskCollection {
	id: number;
	title: string;
	source: TaskSource;
	description?: string;
	tasks: DownloadableTask[];
	total_tasks: number;
	total_size?: number;
	created_at: string;
}

export interface DownloadTasksRequest {
	task_ids?: number[];
	collection_id?: number;
	source?: TaskSource;
	format?: 'single' | 'archive';
}

export interface DownloadTasksResponse {
	download_url: string;
	file_name: string;
	file_size: number;
	expires_at: string;
}

export interface TasksListResponse {
	tasks: DownloadableTask[];
	collections: TaskCollection[];
}

export interface TaskCollectionResponse {
	collection: TaskCollection;
}

