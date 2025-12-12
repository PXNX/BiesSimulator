/**
 * Agent Inspector - click an agent to inspect its state & memory.
 */

import { World } from '../core/World';
import type { Agent } from '../models/Agent';
import type { EncounterMemory } from '../strategies/IStrategy';

export class AgentInspector {
    private world: World;
    private canvas: HTMLCanvasElement;

    private panel: HTMLDivElement;
    private headerTitle: HTMLSpanElement;
    private closeBtn: HTMLButtonElement;
    private body: HTMLDivElement;
    private memoryList: HTMLDivElement;

    private lastUpdate: number = 0;
    private readonly updateIntervalMs: number = 100;
    private readonly pickRadiusPx: number = 28;

    constructor(world: World, canvasId: string = 'sim-canvas') {
        this.world = world;
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id ${canvasId} not found`);
        }

        this.panel = document.createElement('div');
        this.panel.className = 'agent-inspector hidden';

        const header = document.createElement('div');
        header.className = 'agent-inspector-header';

        this.headerTitle = document.createElement('span');
        this.headerTitle.className = 'agent-inspector-title';
        this.headerTitle.textContent = 'Agent';

        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'agent-inspector-close';
        this.closeBtn.type = 'button';
        this.closeBtn.title = 'Close';
        this.closeBtn.textContent = '×';

        header.appendChild(this.headerTitle);
        header.appendChild(this.closeBtn);

        this.body = document.createElement('div');
        this.body.className = 'agent-inspector-body';

        const memoryHeader = document.createElement('div');
        memoryHeader.className = 'agent-inspector-section';
        memoryHeader.textContent = 'Recent Encounters';

        this.memoryList = document.createElement('div');
        this.memoryList.className = 'agent-inspector-memory';

        this.body.appendChild(memoryHeader);
        this.body.appendChild(this.memoryList);

        this.panel.appendChild(header);
        this.panel.appendChild(this.body);
        document.body.appendChild(this.panel);

        this.installEventHandlers();
    }

    update(): void {
        const selected = this.world.getSelectedAgent();
        if (!selected) {
            this.hide();
            return;
        }

        const now = performance.now();
        if (now - this.lastUpdate < this.updateIntervalMs) return;
        this.lastUpdate = now;

        this.renderAgent(selected);
        this.positionPanel(selected);
        this.show();
    }

    private installEventHandlers(): void {
        this.canvas.addEventListener('click', (e) => {
            const pos = this.getCanvasPosition(e);
            const picked = this.pickNearestAgent(pos.x, pos.y, this.pickRadiusPx);
            if (picked) {
                this.world.selectAgent(picked.id);
                this.update();
            } else {
                this.world.selectAgent(null);
                this.hide();
            }
        });

        this.closeBtn.addEventListener('click', () => {
            this.world.selectAgent(null);
            this.hide();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.world.selectAgent(null);
                this.hide();
            }
        });
    }

    private getCanvasPosition(e: MouseEvent): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return { x, y };
    }

    private pickNearestAgent(x: number, y: number, radiusPx: number): Agent | null {
        const r2 = radiusPx * radiusPx;
        let best: Agent | null = null;
        let bestDist2 = r2;

        for (const agent of this.world.agents) {
            if (agent.isDead) continue;
            const dx = agent.position.x - x;
            const dy = agent.position.y - y;
            const d2 = dx * dx + dy * dy;
            if (d2 <= bestDist2) {
                bestDist2 = d2;
                best = agent;
            }
        }

        return best;
    }

    private renderAgent(agent: Agent): void {
        this.headerTitle.textContent = `${agent.strategyType}`;

        // Rebuild body (keep memory section)
        const rows = document.createElement('div');
        rows.className = 'agent-inspector-rows';

        rows.appendChild(this.makeRow('ID', agent.id));
        rows.appendChild(this.makeRow('Energy', agent.energy.toFixed(1)));
        rows.appendChild(this.makeRow('Age (s)', agent.age.toFixed(1)));
        rows.appendChild(this.makeRow('Traits', this.formatTraits(agent)));

        // Replace previous rows if present
        const existing = this.body.querySelector('.agent-inspector-rows');
        if (existing) existing.remove();
        this.body.insertBefore(rows, this.body.firstChild);

        this.renderMemories(agent.getRecentEncounters(5));
    }

    private renderMemories(memories: EncounterMemory[]): void {
        this.memoryList.replaceChildren();
        if (memories.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'agent-inspector-empty';
            empty.textContent = 'No encounters yet.';
            this.memoryList.appendChild(empty);
            return;
        }

        for (const mem of memories) {
            const line = document.createElement('div');
            line.className = 'agent-inspector-memory-line';

            const left = document.createElement('span');
            left.className = 'mem-left';
            left.textContent = `t=${mem.timestamp}`;

            const mid = document.createElement('span');
            mid.className = 'mem-mid';
            mid.textContent = `${mem.agentId.slice(0, 8)}…`;
            mid.title = mem.agentId;

            const right = document.createElement('span');
            right.className = 'mem-right';
            right.textContent = `${mem.lastAction} / ${mem.outcome}`;

            line.appendChild(left);
            line.appendChild(mid);
            line.appendChild(right);
            this.memoryList.appendChild(line);
        }
    }

    private formatTraits(agent: Agent): string {
        const t = agent.traits;
        return `spd ${t.speed.toFixed(2)}, vis ${t.vision.toFixed(2)}, agg ${t.aggression.toFixed(2)}, sta ${t.stamina.toFixed(2)}`;
    }

    private makeRow(label: string, value: string): HTMLDivElement {
        const row = document.createElement('div');
        row.className = 'agent-inspector-row';

        const k = document.createElement('span');
        k.className = 'agent-inspector-key';
        k.textContent = label;

        const v = document.createElement('span');
        v.className = 'agent-inspector-val';
        v.textContent = value;

        row.appendChild(k);
        row.appendChild(v);
        return row;
    }

    private positionPanel(agent: Agent): void {
        const rect = this.canvas.getBoundingClientRect();
        const rawLeft = rect.left + agent.position.x + 14;
        const rawTop = rect.top + agent.position.y - 10;

        // Temporarily unhide for measuring
        this.panel.classList.remove('hidden');
        const { width, height } = this.panel.getBoundingClientRect();

        const padding = 8;
        const maxLeft = window.innerWidth - width - padding;
        const maxTop = window.innerHeight - height - padding;

        const left = Math.max(padding, Math.min(maxLeft, rawLeft));
        const top = Math.max(padding, Math.min(maxTop, rawTop));

        this.panel.style.left = `${left}px`;
        this.panel.style.top = `${top}px`;
    }

    private show(): void {
        this.panel.classList.remove('hidden');
    }

    private hide(): void {
        this.panel.classList.add('hidden');
    }
}

