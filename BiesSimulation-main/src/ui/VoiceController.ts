import { World } from '../core/World';
import { Controls } from './Controls';

type RecognitionCtor = new () => any;

/**
 * Experimental voice commands (start/pause/reset/faster/slower + preset names).
 * Feature-detected; no-op if SpeechRecognition is unavailable.
 */
export class VoiceController {
    private world: World;
    private controls: Controls;
    private recognition: any | null = null;
    private enabled: boolean = false;

    constructor(world: World, controls: Controls) {
        this.world = world;
        this.controls = controls;
        const ctor = this.getCtor();
        if (!ctor) return;
        this.recognition = new ctor();
        this.recognition.lang = 'en-US';
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.onresult = (ev: any) => this.handle(ev);
        this.recognition.onerror = () => this.stop();
    }

    private getCtor(): RecognitionCtor | null {
        const anyWin = window as any;
        return anyWin.SpeechRecognition || anyWin.webkitSpeechRecognition || null;
    }

    toggle(): void {
        if (!this.recognition) return;
        this.enabled ? this.stop() : this.start();
    }

    start(): void {
        if (!this.recognition || this.enabled) return;
        this.recognition.start();
        this.enabled = true;
        console.info('Voice control started');
    }

    stop(): void {
        if (!this.recognition || !this.enabled) return;
        this.recognition.stop();
        this.enabled = false;
        console.info('Voice control stopped');
    }

    private handle(event: any): void {
        const transcript = Array.from(event.results as ArrayLike<any>)
            .map((r: any) => r[0].transcript)
            .join(' ')
            .toLowerCase();

        if (transcript.includes('pause')) this.world.paused = true;
        if (transcript.includes('start') || transcript.includes('play')) this.world.paused = false;
        if (transcript.includes('reset')) this.world.reset();
        if (transcript.includes('faster')) this.controls.setSpeedMultiplier(this.world.timeScale + 0.2);
        if (transcript.includes('slower')) this.controls.setSpeedMultiplier(this.world.timeScale - 0.2);

        // Presets by name keyword
        if (transcript.includes('chaos')) this.controls.selectPreset('Chaos');
        if (transcript.includes('balanced')) this.controls.selectPreset('Balanced');
        if (transcript.includes('cooperative')) this.controls.selectPreset('CooperativeWorld');
        if (transcript.includes('hawk')) this.controls.selectPreset('HawkInvasion');
    }
}
