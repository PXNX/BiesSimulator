import type { WorldStats } from '../core/World';

export class Hints {
    private el: HTMLElement | null;
    private lastKey: string = '';

    constructor() {
        this.el = document.getElementById('hint-bar');
    }

    update(stats: WorldStats): void {
        if (!this.el) return;
        const hint = this.pickHint(stats);
        if (!hint) {
            this.el.classList.add('hidden');
            return;
        }
        this.el.classList.remove('hidden');
        if (hint.key !== this.lastKey) {
            this.el.innerHTML = hint.text;
            this.lastKey = hint.key;
        }
    }

    private pickHint(stats: WorldStats): { key: string; text: string } | null {
        const total = Math.max(1, stats.totalAgents);
        const aggro = stats.strategyCounts.Aggressive / total;
        const coop = stats.strategyCounts.Cooperative / total;
        const tft = stats.strategyCounts.TitForTat / total;
        const foodPerAgent = stats.totalFood / total;

        if (aggro > 0.45) {
            return {
                key: 'conflict',
                text: '<strong>Konfliktlastig</strong>: Aggressive >45%. Tipp: Reduziere Fight Cost oder erhöhe Food.',
            };
        }
        if (coop + tft > 0.5 && foodPerAgent > 0.8) {
            return {
                key: 'cooperative',
                text: '<strong>Kooperation</strong>: Coop/TfT dominieren. Beobachte Heatmap und senke Mutation, um Stabilität zu testen.',
            };
        }
        if (stats.averageEnergy < 40) {
            return {
                key: 'low-energy',
                text: '<strong>Niedrige Energie</strong>: Erhöhe Food Value oder Food Rate, reduziere Fight Cost.',
            };
        }
        if (foodPerAgent < 0.5) {
            return {
                key: 'scarcity',
                text: '<strong>Knappheit</strong>: Wenig Food/Agent. Preset "Abundance" oder Food Rate anheben.',
            };
        }
        return {
            key: 'observe',
            text: 'Tipp: Klick auf einen Agenten für Inspector. Expert Mode zeigt Regeln & Debug.',
        };
    }
}
