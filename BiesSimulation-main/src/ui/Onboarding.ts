/**
 * Lightweight onboarding overlay with a few contextual steps.
 */

import type { Controls } from './Controls';

interface Step {
    title: string;
    desc: string;
    onNext?: () => void;
}

const STORAGE_KEY = 'bies-onboarding-v1';

export class Onboarding {
    private overlay: HTMLElement;
    private titleEl: HTMLElement;
    private descEl: HTMLElement;
    private nextBtn: HTMLButtonElement;
    private skipBtn: HTMLButtonElement;
    private steps: Step[];
    private index: number = 0;
    private controls: Controls;

    constructor(controls: Controls) {
        this.controls = controls;
        this.overlay = document.getElementById('onboarding-overlay') as HTMLElement;
        this.titleEl = document.getElementById('onboarding-title') as HTMLElement;
        this.descEl = document.getElementById('onboarding-desc') as HTMLElement;
        this.nextBtn = document.getElementById('onboarding-next') as HTMLButtonElement;
        this.skipBtn = document.getElementById('onboarding-skip') as HTMLButtonElement;

        this.steps = [
            {
                title: 'Willkommen!',
                desc: 'Starte/Pause über die Top-Buttons, passe Speed an. Tipp: Space pausiert.',
            },
            {
                title: 'Presets & Szenarien',
                desc: 'Wähle Presets (z.B. Chaos vs. Cooperative) und beobachte Population & Heatmap.',
                onNext: () => this.controls.selectPreset('Chaos'),
            },
            {
                title: 'Experten-Features',
                desc: 'Schalte Expert Mode frei, um Regeln, Debug & Config zu sehen.',
                onNext: () => this.controls.setExpertMode(true),
            },
            {
                title: 'Inspector & Analyse',
                desc: 'Klicke Agenten an (Inspector) und nutze die Heatmap für Strategien. Viel Spaß!',
            },
        ];

        this.nextBtn.addEventListener('click', () => this.next());
        this.skipBtn.addEventListener('click', () => this.complete());
        document.addEventListener('onboarding:start', () => this.start(true));
    }

    start(force = false): void {
        if (!force && localStorage.getItem(STORAGE_KEY) === 'done') return;
        this.index = 0;
        this.overlay.classList.remove('hidden');
        this.render();
    }

    private next(): void {
        const step = this.steps[this.index];
        if (step?.onNext) step.onNext();
        this.index += 1;
        if (this.index >= this.steps.length) {
            this.complete();
            return;
        }
        this.render();
    }

    private render(): void {
        const step = this.steps[this.index];
        if (!step) {
            this.complete();
            return;
        }
        this.titleEl.textContent = step.title;
        this.descEl.textContent = step.desc;
    }

    private complete(): void {
        this.overlay.classList.add('hidden');
        localStorage.setItem(STORAGE_KEY, 'done');
    }
}
