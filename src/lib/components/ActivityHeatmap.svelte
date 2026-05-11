<script lang="ts">
  import type { Activity } from '$lib/types';

  export let activities: Activity[] = [];
  export let userId: string | undefined = undefined;

  interface HeatmapCell {
    date: string;
    minutes: number;
    sessions: number;
    intensity: 'empty' | 'low' | 'medium' | 'high';
    isToday: boolean;
    isFuture: boolean;
  }

  interface WeekRow {
    cells: HeatmapCell[];
  }

  let heatmapData: WeekRow[] = [];
  let monthLabels: { month: string; weekIndex: number }[] = [];
  let hasActivities = false;

  $: {
    const filtered = userId ? activities.filter((a) => a.userId === userId) : activities;
    hasActivities = filtered.length > 0;

    if (hasActivities) {
      generateHeatmap(filtered);
    } else {
      heatmapData = [];
      monthLabels = [];
    }
  }

  function generateHeatmap(filteredActivities: Activity[]) {
    const toLocalDateStr = (d: Date): string =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const today = new Date();
    const todayStr = toLocalDateStr(today);

    // Today's day Monday-indexed (Mon=0 … Sun=6)
    const todayJsDay = today.getDay();
    const todayDayMon = todayJsDay === 0 ? 6 : todayJsDay - 1;

    // Real data window: 364 days back from today
    const realStart = new Date(today);
    realStart.setDate(realStart.getDate() - 364);

    // Rewind to the Monday of realStart's week so every column is a full Mon–Sun slice
    const realStartJsDay = realStart.getDay();
    const realStartDayMon = realStartJsDay === 0 ? 6 : realStartJsDay - 1;
    const loopStart = new Date(realStart);
    loopStart.setDate(loopStart.getDate() - realStartDayMon);

    const toDurationMinutes = (value: unknown): number => {
      if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
      if (typeof value === 'string') {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed));
      }
      return 0;
    };

    const minutesByDate = new Map<string, number>();
    const sessionsByDate = new Map<string, number>();
    filteredActivities.forEach((a) => {
      sessionsByDate.set(a.date, (sessionsByDate.get(a.date) ?? 0) + 1);
      minutesByDate.set(a.date, (minutesByDate.get(a.date) ?? 0) + toDurationMinutes(a.duration));
    });

    const rows: WeekRow[] = Array.from({ length: 7 }, () => ({ cells: [] }));
    const monthLabelMap = new Map<number, string>();
    const emptyCell = (): HeatmapCell => ({ date: '', minutes: 0, sessions: 0, intensity: 'empty', isToday: false, isFuture: false });
    const futureCell = (): HeatmapCell => ({ date: '', minutes: 0, sessions: 0, intensity: 'empty', isToday: false, isFuture: true });

    let currentDate = new Date(loopStart);
    let weekIndex = 0;
    let lastMonth = '';

    while (currentDate <= today) {
      const jsDay = currentDate.getDay();
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
      const dateStr = toLocalDateStr(currentDate);
      const isFiller = currentDate < realStart;

      const minutes = isFiller ? 0 : (minutesByDate.get(dateStr) ?? 0);
      const sessions = isFiller ? 0 : (sessionsByDate.get(dateStr) ?? 0);
      const intensity: HeatmapCell['intensity'] = isFiller
        ? 'empty'
        : minutes > 0
          ? (minutes < 60 ? 'low' : minutes < 120 ? 'medium' : 'high')
          : (sessions > 0 ? 'low' : 'empty');

      rows[dayOfWeek].cells.push({
        date: isFiller ? '' : dateStr,
        minutes,
        sessions,
        intensity,
        isToday: !isFiller && dateStr === todayStr,
        isFuture: false,
      });

      // Track month labels only for real (non-filler) dates
      if (!isFiller) {
        const monthKey = dateStr.slice(0, 7);
        if (monthKey !== lastMonth) {
          const monthName = new Date(dateStr + 'T00:00:00Z').toLocaleString('en-US', { month: 'short' });
          monthLabelMap.set(weekIndex, monthName.toUpperCase());
          lastMonth = monthKey;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
      if (dayOfWeek === 6) weekIndex++;
    }

    // Pad the trailing partial week (days after today that haven't happened yet)
    for (let d = todayDayMon + 1; d <= 6; d++) {
      rows[d].cells.push(futureCell());
    }

    const totalWeeks = rows[0].cells.length;

    heatmapData = Array.from({ length: totalWeeks }, (_, wIdx) => ({
      cells: rows.map((row) => row.cells[wIdx] ?? emptyCell()),
    }));

    monthLabels = Array.from(monthLabelMap, ([week, month]) => ({ month, weekIndex: week }));
  }

  // ── Responsive week slicing ─────────────────────────────────────────────
  let wrapperWidth = 0;

  // Compute how many weeks we can fit at the minimum comfortable cell size
  $: visibleWeekCount = (() => {
    if (!wrapperWidth || !heatmapData.length) return heatmapData.length;
    const paddingH = 32;        // 1rem each side
    const dayLabelWidth = 30;   // desktop; hidden on mobile so conservative
    const colGap = 6;           // ~0.4rem
    const cellGap = 2;
    const minCellSize = 9;
    const available = Math.max(60, wrapperWidth - paddingH - dayLabelWidth - colGap);
    const maxWeeks = Math.floor((available + cellGap) / (minCellSize + cellGap));
    return Math.min(heatmapData.length, Math.max(12, maxWeeks));
  })();

  $: weekOffset = heatmapData.length - visibleWeekCount;
  $: displayData = heatmapData.slice(-visibleWeekCount);
  $: displayMonthLabels = monthLabels
    .filter((l) => l.weekIndex >= weekOffset)
    .map((l) => ({ month: l.month, weekIndex: l.weekIndex - weekOffset }));

  function getTooltip(cell: HeatmapCell): string {
    if (!cell.date) return '';
    const date = new Date(cell.date + 'T00:00:00Z');
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    if (cell.minutes === 0) {
      return `${formatted}: No training minutes logged`;
    }

    const sessionText = `${cell.sessions} session${cell.sessions !== 1 ? 's' : ''}`;
    return `${formatted}: ${cell.minutes} minute${cell.minutes !== 1 ? 's' : ''} across ${sessionText}`;
  }
</script>

<div class="heatmap-container">
  <div class="heatmap-header">
    <div>
      <p class="heatmap-eyebrow">Attendance board</p>
      <h3 class="heatmap-title">Last 52 weeks</h3>
      <p class="heatmap-subtitle">Color shows training minutes per day: 0, 1–60m, 60m–2h, then 2h+.</p>
    </div>
    <div class="heatmap-legend" aria-hidden="true">
      <span class="legend-item">
        <span class="cell empty"></span>
        <span>0</span>
      </span>
      <span class="legend-item">
        <span class="cell low"></span>
        <span>1–60m</span>
      </span>
      <span class="legend-item">
        <span class="cell medium"></span>
        <span>60m–2h</span>
      </span>
      <span class="legend-item">
        <span class="cell high"></span>
        <span>2h+</span>
      </span>
    </div>
  </div>

  <div class="heatmap-wrapper" bind:clientWidth={wrapperWidth} style={`--weeks: ${Math.max(displayData.length, 1)}`}>
    {#if hasActivities}
      <div class="heatmap-board">
        <div class="heatmap-day-spacer"></div>
        <div class="heatmap-months">
          {#each displayMonthLabels as label}
            <div class="month-label" style={`--week-index: ${label.weekIndex}`}>
              {label.month}
            </div>
          {/each}
        </div>
        <div class="day-labels">
          <div class="day-label">Mon</div>
          <div class="day-label">Tue</div>
          <div class="day-label">Wed</div>
          <div class="day-label">Thu</div>
          <div class="day-label">Fri</div>
          <div class="day-label">Sat</div>
          <div class="day-label">Sun</div>
        </div>
        <div class="heatmap-grid" role="img" aria-label="Activity heatmap for the last 52 weeks">
          {#each displayData as week}
            <div class="heatmap-week">
              {#each week.cells as cell}
                <div
                  class="heatmap-cell cell-{cell.intensity}"
                  class:cell-future={cell.isFuture}
                  title={getTooltip(cell)}
                  aria-label={getTooltip(cell)}
                ></div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="heatmap-empty">
        <p class="heatmap-empty-title">No sessions logged yet.</p>
        <p class="heatmap-empty-copy">Log one session and this board starts showing where your training actually lives.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .heatmap-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-height: 100%;
  }

  .heatmap-header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
    width: 100%;
  }

  .heatmap-eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-accent);
    margin-bottom: 0.35rem;
  }

  .heatmap-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 0.95;
    margin-bottom: 0.35rem;
  }

  .heatmap-subtitle {
    max-width: 42ch;
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .heatmap-legend {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
  }

  .cell {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    display: inline-block;
  }

  .cell.empty {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
  }

  .cell.low {
    background: color-mix(in oklch, var(--color-primary) 35%, transparent);
  }

  .cell.medium {
    background: color-mix(in oklch, var(--color-primary) 65%, transparent);
  }

  .cell.high {
    background: var(--color-primary);
  }

  .heatmap-wrapper {
    --cell-gap: 2px;
    --day-label-width: 30px;
    --board-col-gap: 0.4rem;
    --board-row-gap: 0.3rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    min-height: 100%;
    overflow: hidden;
  }

  .heatmap-board {
    display: grid;
    grid-template-columns: var(--day-label-width) 1fr;
    grid-template-rows: auto auto;
    column-gap: var(--board-col-gap);
    row-gap: var(--board-row-gap);
    width: 100%;
  }

  .heatmap-day-spacer {
    display: block;
  }

  .heatmap-empty {
    display: grid;
    place-items: center;
    min-height: 16rem;
    text-align: center;
    gap: 0.45rem;
    padding: 1rem;
  }

  .heatmap-empty-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
  }

  .heatmap-empty-copy {
    max-width: 28ch;
    color: var(--color-text-muted);
  }

  .heatmap-months {
    position: relative;
    height: 1rem;
  }

  .month-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    white-space: nowrap;
    position: absolute;
    left: calc((var(--week-index) / var(--weeks)) * 100%);
    top: 0;
  }

  .day-labels {
    display: flex;
    flex-direction: column;
    gap: var(--cell-gap);
    align-self: stretch;
  }

  .day-label {
    flex: 1;
    font-size: 0.65rem;
    color: var(--color-text-muted);
    font-weight: 600;
    display: flex;
    align-items: center;
    min-height: 0;
  }

  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(var(--weeks), 1fr);
    gap: var(--cell-gap);
    width: 100%;
    align-items: start;
  }

  .heatmap-week {
    display: flex;
    flex-direction: column;
    gap: var(--cell-gap);
  }

  .heatmap-cell {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 2px;
    cursor: pointer;
    transition: opacity 0.15s, box-shadow 0.15s;
  }

  .heatmap-cell:hover {
    opacity: 0.8;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .heatmap-cell:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .heatmap-cell.cell-empty {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
  }

  .heatmap-cell.cell-low {
    background: color-mix(in oklch, var(--color-primary) 35%, white);
  }

  .heatmap-cell.cell-medium {
    background: color-mix(in oklch, var(--color-primary) 65%, white);
  }

  .heatmap-cell.cell-high {
    background: var(--color-primary);
  }

  .heatmap-cell.cell-future {
    opacity: 0.2;
  }

  @media (prefers-color-scheme: dark) {
    .heatmap-cell.cell-low {
      background: color-mix(in oklch, var(--color-primary) 35%, black);
    }

    .heatmap-cell.cell-medium {
      background: color-mix(in oklch, var(--color-primary) 65%, black);
    }
  }

  @media (prefers-contrast: more) {
    .heatmap-cell.cell-low    { background: oklch(85% 0.12 252); }
    .heatmap-cell.cell-medium { background: oklch(65% 0.18 252); }
    .heatmap-cell.cell-high   { background: oklch(40% 0.22 252); }
  }

  /* Responsive sizing */
  @media (max-width: 768px) {
    .heatmap-wrapper {
      padding: 0.75rem;
      --day-label-width: 24px;
    }

    .day-label {
      font-size: 0.6rem;
    }

    .heatmap-months {
      font-size: 0.6rem;
    }
  }

  @media (max-width: 480px) {
    .heatmap-wrapper {
      padding: 0.55rem;
    }

    .heatmap-board {
      grid-template-columns: 0 1fr;
      column-gap: 0;
    }

    .day-labels {
      display: none;
    }

    .heatmap-months {
      height: 0.8rem;
    }

    .month-label {
      font-size: 0.55rem;
    }
  }
</style>
