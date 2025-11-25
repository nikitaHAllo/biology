export interface Section {
	id: number;
	title: string;
	slug: string;
	description?: string;
	icon?: string;
	order: number;
}

export interface Topic {
	id: number;
	section_id: number;
	title: string;
	slug: string;
	description: string;
	price_repcoins: number;
	is_purchased?: boolean;
	purchased_at?: string | null;
	order: number;
}

export interface MaterialFile {
	id: number;
	topic_id: number;
	name: string;
	file_url: string;
	file_type: 'word' | 'pdf' | 'other';
	file_size?: number;
	created_at: string;
}

export interface TopicWithMaterials extends Topic {
	files: MaterialFile[];
	section?: Section;
}

export interface SectionWithTopics extends Section {
	topics: Topic[];
}

export interface MaterialsCatalogResponse {
	sections: SectionWithTopics[];
}

export interface TopicDetailsResponse {
	topic: TopicWithMaterials;
}

export interface PurchaseTopicResponse {
	success: boolean;
	topic: Topic;
	remaining_coins: number;
}

export interface PurchaseTopicResult {
	topic_id: number;
	remaining_coins: number;
	section?: string;
	title?: string;
	already_owned?: boolean;
}

