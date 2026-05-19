import { useState } from 'react';
import type { TopicFile } from '../../models/material';

export function useFileDownload() {
	const [downloading, setDownloading] = useState<string | null>(null);

	const downloadFile = (file: TopicFile) => {
		setDownloading(file.id.toString());

		const a = document.createElement('a');
		a.href = file.file_url;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		setTimeout(() => setDownloading(null), 500);
	};

	return { downloadFile, downloading };
}
