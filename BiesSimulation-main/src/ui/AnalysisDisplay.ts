/**
 * Analysis Display - Strategy vs strategy heatmap.
 */

import { World } from '../core/World';
import type { StrategyType } from '../config/globalConfig';
import type { InteractionHeatmap } from '../systems/InteractionSystem';

export class AnalysisDisplay {
    private world: World;
    private table: HTMLTableElement;
    private lastUpdate: number = 0;
    private readonly updateIntervalMs: number = 250;
    private cells: Map<string, HTMLTableCellElement> = new Map();

    private readonly strategies: StrategyType[] = ['Aggressive', 'Passive', 'Cooperative', 'TitForTat', 'Random'];
    private readonly shortLabels: Record<StrategyType, string> = {
        Aggressive: 'Agg',
        Passive: 'Pas',
        Cooperative: 'Coop',
        TitForTat: 'TfT',
        Random: 'Rnd',
    };

    constructor(world: World) {
        this.world = world;
        this.table = document.getElementById('heatmap-table') as HTMLTableElement;
        if (!this.table) {
            throw new Error('Heatmap table element not found');
        }
        this.buildTable();
    }

    update(): void {
        const now = performance.now();
        if (now - this.lastUpdate < this.updateIntervalMs) return;
        this.lastUpdate = now;

        const heatmap = this.world.getInteractionHeatmap() as InteractionHeatmap;
        this.updateCells(heatmap);
    }

    private buildTable(): void {
        this.table.replaceChildren();

        // Header
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th'));
        for (const col of this.strategies) {
            const th = document.createElement('th');
            th.textContent = this.shortLabels[col];
            th.title = col;
            headerRow.appendChild(th);
        }
        this.table.appendChild(headerRow);

        // Rows
        for (const row of this.strategies) {
            const tr = document.createElement('tr');
            const rowHeader = document.createElement('th');
            rowHeader.textContent = this.shortLabels[row];
            rowHeader.title = row;
            tr.appendChild(rowHeader);

            for (const col of this.strategies) {
                const td = document.createElement('td');
                td.textContent = '-';
                td.classList.add('heatmap-empty');
                tr.appendChild(td);
                this.cells.set(this.key(row, col), td);
            }

            this.table.appendChild(tr);
        }
    }

    private updateCells(heatmap: InteractionHeatmap): void {
        for (const row of this.strategies) {
            for (const col of this.strategies) {
                const cell = heatmap[row][col];
                const el = this.cells.get(this.key(row, col));
                if (!el) continue;

                if (cell.total === 0) {
                    el.textContent = '-';
                    el.classList.add('heatmap-empty');
                    el.style.backgroundColor = '';
                    el.title = `${row} vs ${col}: no data`;
                    continue;
                }

                const delta = cell.wins - cell.losses;
                const intensity = Math.min(1, Math.abs(delta) / Math.max(1, cell.total));
                const alpha = 0.08 + intensity * 0.35;
                const bg =
                    delta > 0
                        ? `rgba(34, 197, 94, ${alpha})`
                        : delta < 0
                            ? `rgba(239, 68, 68, ${alpha})`
                            : `rgba(255, 255, 255, ${0.06})`;

                el.classList.remove('heatmap-empty');
                el.style.backgroundColor = bg;
                el.textContent = delta > 0 ? `+${delta}` : `${delta}`;
                el.title = `${row} vs ${col}: W ${cell.wins}, L ${cell.losses}, T ${cell.ties} (n=${cell.total})`;
            }
        }
    }

    private key(row: StrategyType, col: StrategyType): string {
        return `${row}|${col}`;
    }
}

