export interface LessonProgress {
	lesson_id: number;
	lesson_title: string;
	course_title: string;
	status: string;
	updated_at: string;
}

export interface CourseProgress {
	course_id: number;
	course_title: string;
	course_description: string;
	total_lessons: number;
	completed_lessons: number;
	in_progress_lessons: number;
	progress_percentage: number;
	lessons: LessonProgress[];
}

export interface CourseProgressResponse {
	courses: CourseProgress[];
}

