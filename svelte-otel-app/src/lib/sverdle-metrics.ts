import { onMount } from 'svelte';
import { createCustomMetric } from '$lib/metrics.js';
import { browser } from '$app/environment';

// Define types based on your actual metric library
interface Attributes {
	[key: string]: string;
}

interface Counter<T extends Attributes> {
	add: (value: number, attributes?: T) => void;
}

interface Histogram<T extends Attributes> {
	record: (value: number, attributes?: T) => void;
}

export function useSverdleMetrics() {
	let gameStartCounter: Counter<Attributes> | null = null;
	let gameEndCounter: Counter<Attributes> | null = null;
	let guessCounter: Counter<Attributes> | null = null;
	let gameTimeHistogram: Histogram<Attributes> | null = null;
	let letterFrequencyCounter: Counter<Attributes> | null = null;
	let gameStartTime: number = 0;

	onMount(() => {
		if (browser) {
			// Initialize custom metrics
				gameStartCounter = (createCustomMetric(
					'sverdle_games_started_total',
					'counter',
					'Total number of Sverdle games started'
)) as Counter<Attributes> | null;
			
				gameEndCounter = (createCustomMetric(
					'sverdle_games_ended_total', 
					'counter',
					'Total number of Sverdle games completed'
)) as Counter<Attributes> | null;
			
				guessCounter = (createCustomMetric(
					'sverdle_guesses_total',
					'counter', 
					'Total number of guesses made'
)) as Counter<Attributes> | null;
			
				gameTimeHistogram = (createCustomMetric(
					'sverdle_game_duration',
					'histogram',
					'Time taken to complete game',
					'ms'
)) as Histogram<Attributes> | null;
			
				letterFrequencyCounter = (createCustomMetric(
					'sverdle_letter_usage_total',
					'counter',
					'Frequency of letters used in guesses'
)) as Counter<Attributes> | null;
		}
	});

	function recordGameStart(): void {
		gameStartTime = performance.now();
		gameStartCounter?.add(1, {
			'user.agent': navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
		});
	}

	function recordGuess(guess: string, guessNumber: number): void {
		guessCounter?.add(1, {
			'guess.number': guessNumber.toString(),
			'guess.length': guess.length.toString()
		});
		
		// Record letter frequency
		for (const letter of guess) {
			letterFrequencyCounter?.add(1, {
				'letter': letter.toLowerCase()
			});
		}
	}

	function recordGameEnd(won: boolean, guessesUsed: number): void {
		if (gameStartTime === 0) return; // Avoid double recording
		
		const gameEndTime = performance.now();
		const gameDuration = gameEndTime - gameStartTime;
		
		gameEndCounter?.add(1, {
			'game.result': won ? 'won' : 'lost',
			'guesses.used': guessesUsed.toString(),
			'guesses.remaining': (6 - guessesUsed).toString()
		});
		
		gameTimeHistogram?.record(gameDuration, {
			'game.result': won ? 'won' : 'lost',
			'guesses.used': guessesUsed.toString()
		});
		
		gameStartTime = 0; // Reset
	}

	return {
		recordGameStart,
		recordGuess,
		recordGameEnd
	};
}