<script lang="ts">
  import type { Activity } from '$lib/types';

  export let activities: Activity[] = [];
  export let userId: string | undefined = undefined;

  interface HeatmapCell {
    date: string;
    minutes: number;
    sessions: number;
    intensity: 'empty' | 'low' | 'medium' | 'high';
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
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // 52 weeks

    const minutesByDate = new Map<string, number>();
    const sessionsByDate = new Map<string, number>();
    filteredActivities.forEach((a) => {
      const sessionCount = (sessionsByDate.get(a.date) ?? 0) + 1;
      sessionsByDate.set(a.date, sessionCount);

      const minutes = a.duration ?? 0;
      const totalMinutes = (minutesByDate.get(a.date) ?? 0) + minutes;
      minutesByDate.set(a.date, totalMinutes);
    });

    // Build 7 rows (days of week), starting from Monday (1) to Sunday (0)
    const rows: WeekRow[] = Array.from({ length: 7 }, () => ({
      cells: [],
    }));

    const monthLabelMap = new Map<number, string>(); // weekIndex -> month name
    let currentDate = new Date(startDate);
    let weekIndex = 0;
    let lastMonth = '';

    while (currentDate <= today) {
      // JavaScript getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      // We want Monday-Sunday, so shift: Monday=0, Sunday=6
      const jsDay = currentDate.getDay();
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0...Sun=6

      const dateStr = currentDate.toISOString().split('T')[0];
      const minutes = minutesByDate.get(dateStr) ?? 0;
      const sessions = sessionsByDate.get(dateStr) ?? 0;

      const intensity =
        minutes === 0 ? 'empty' : minutes < 30 ? 'low' : minutes < 60 ? 'medium' : 'high';

      rows[dayOfWeek].cells.push({
        date: dateStr,
        minutes,
        sessions,
        intensity,
      });

      // Track month labels: add at the start of each month (first day of month)
      const monthKey = dateStr.slice(0, 7);
      if (monthKey !== lastMonth) {
        const monthName = new Date(dateStr + 'T00:00:00Z').toLocaleString('en-US', {
          month: 'short',
        });
        monthLabelMap.set(weekIndex, monthName);
        lastMonth = monthKey;
      }

      currentDate.setDate(currentDate.getDate() + 1);
      if (dayOfWeek === 6) weekIndex++; // Move to next week after Sunday
    }

    // Ensure all weeks have 7 days
    const maxWeeks = Math.max(...rows.map((r) => r.cells.length));
    rows.forEach((row) => {
      while (row.cells.length < maxWeeks) {
        row.cells.push({ date: '', minutes: 0, sessions: 0, intensity: 'empty' });
      }
    });

    // Transpose to weeks x days format
    heatmapData = Array.from({ length: maxWeeks }, (_, weekIdx) => ({
      cells: rows.map((row) => row.cells[weekIdx] || { date: '', minutes: 0, sessions: 0, intensity: 'empty' }),
    }));

    // Convert month label map to array, spreading across grid width
    monthLabels = Array.from(monthLabelMap, ([week, month]) => ({
      month,
      weekIndex: week,
    }));
  }

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
      <p class="heatmap-subtitle">Color shows training minutes per day: 0, 1-29, 30-59, then 60+.</p>
    </div>
    <div class="heatmap-legend" aria-hidden="true">
      <span class="legend-item">
        <span class="cell empty"></span>
        <span>0</span>
      </span>
      <span class="legend-item">
        <span class="cell low"></span>
        <span>1-29m</span>
      </span>
      <span class="legend-item">
        <span class="cell medium"></span>
        <span>30-59m</span>
      </span>
      <span class="legend-item">
        <span class="cell high"></span>
        <span>60m+</span>
      </span>
    </div>
  </div>

  <div class="heatmap-wrapper" style={`--weeks: ${Math.max(heatmapData.length, 1)}`}>
    {#if hasActivities}
      <div class="heatmap-months">
        {#each monthLabels as label}
          <div class="month-label" style={`--week-index: ${label.weekIndex}`}>
            {label.month}
          </div>
        {/each}
      </div>

      <div class="heatmap-grid-container">
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
          {#each heatmapData as week}
            <div class="heatmap-week">
              {#each week.cells as cell}
                <div
                  class="heatmap-cell cell-{cell.intensity}"
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
    overflow: hidden;
    --cell-gap: 2px;
    --day-label-width: 30px;
    --cell-size: 8px;
    background:
      linear-gradient(180deg, color-mix(in oklch, var(--color-surface) 88%, var(--color-primary) 12%), var(--color-surface));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    min-height: 100%;
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
    margin-bottom: 0.3rem;
    display: flex;
    gap: var(--cell-gap);
    padding-left: calc(var(--day-label-width) + 20px);
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

  .heatmap-grid-container {
    --grid-gap: 0.4rem;
    display: flex;
    gap: var(--grid-gap);
    align-items: stretch;
    width: 100%;
  }

  .day-labels {
    display: grid;
    grid-template-rows: repeat(7, var(--cell-size));
    gap: var(--cell-gap);
    padding-right: 0.3rem;
    flex-shrink: 0;
    width: var(--day-label-width);
  }

  .day-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    font-weight: 600;
    display: flex;
    align-items: center;
    text-align: right;
    width: 100%;
    min-height: 0;
  }

  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(var(--weeks), var(--cell-size));
    gap: var(--cell-gap);
    flex: 1;
    min-width: 0;
    align-items: start;
  }

  .heatmap-week {
    display: flex;
    flex-direction: column;
    gap: var(--cell-gap);
  }

  .heatmap-cell {
    width: var(--cell-size);
    height: var(--cell-size);
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

  @media (prefers-color-scheme: dark) {
    .heatmap-cell.cell-low {
      background: color-mix(in oklch, var(--color-primary) 35%, black);
    }

    .heatmap-cell.cell-medium {
      background: color-mix(in oklch, var(--color-primary) 65%, black);
    }
  }

  /* Responsive sizing */
  @media (max-width: 768px) {
    .heatmap-wrapper {
      padding: 0.75rem;
      --day-label-width: 24px;
      --cell-size: 7px;
    }

    .day-label {
      font-size: 0.6rem;
    }

    .day-labels {
      padding-right: 0.2rem;
    }

    .heatmap-months {
      padding-left: calc(var(--day-label-width) + 10px);
      font-size: 0.6rem;
      margin-bottom: 0.2rem;
    }
  }

  @media (max-width: 480px) {
    .heatmap-wrapper {
      padding: 0.55rem;
      --cell-gap: 1px;
      --cell-size: 5px;
    }

    .day-labels {
      display: none;
    }

    .heatmap-months {
      padding-left: 0;
      gap: 1px;
      margin-bottom: 0.15rem;
      height: 0.8rem;
    }

    .month-label {
      font-size: 0.55rem;
    }

    .heatmap-grid-container {
      gap: 0.2rem;
    }

    .heatmap-grid {
      gap: 1px;
    }

    .heatmap-week {
      gap: 1px;
    }
  }
</style>
