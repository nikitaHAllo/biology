export interface Section {
	id: number;
	title: string;
	slug: string;
	description?: string;
	icon?: string;
	order: number;
}

export interface TopicFile {
	id: number | string;
	name: string;
	file_type: string;
	file_size?: number;
	file_url: string;
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
	files: TopicFile[];
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
	get(arg0: string): unknown;
	files: MaterialFile[];
	section?: Section;
}

export interface SectionWithTopics extends Section {
	topics: TopicWithMaterials[];
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
	is_purchased: boolean;
	topic_id: number;
	purchased_at?: string;
	new_balance: number;
	price_paid?: number;
}

export interface TopicAccessCheck {
	has_access: boolean;
	is_purchased: boolean;
	is_default_unlocked: boolean;
	topic_id: number;
	user_id: number;
	purchased_at?: string;
}
