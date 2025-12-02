import { useEffect, useState, useRef } from 'react';

export const useTimer = ({
	initialTime,
	active = true,
	onTimeout,
}: {
	initialTime: number | null;
	active: boolean;
	onTimeout: () => void;
}) => {
	const [time, setTime] = useState<number | null>(initialTime);
	const intervalRef = useRef<number | null>(null);

	const stop = () => {
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	};

	const start = () => {
		if (initialTime === null) return;
		if (!active) return;
		stop();

		intervalRef.current = window.setInterval(() => {
			setTime(prev => {
				if (prev === null) return prev;
				if (prev <= 1) {
					stop();
					onTimeout();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	useEffect(() => {
		setTime(initialTime);
		start();
		return stop;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialTime, active]);

	return {
		time,
		stop,
		reset: () => setTime(initialTime),
	};
};
