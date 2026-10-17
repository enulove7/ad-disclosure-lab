import type { GroupStat } from "@/lib/stats";

/**
 * 조건별 평균 막대 그래프 (서버 렌더 SVG, 라이브러리 없음).
 * - 범주색은 고정 순서로 배정(dataviz 검증 통과 팔레트), 값은 직접 라벨 + 표로도 제공
 * - 95% CI 를 얇은 오차 막대로 표시, <title> 로 호버 툴팁
 */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];

export function GroupedBarChart({
  groups,
  labels,
  scaleMax,
  title,
  width = 420,
}: {
  groups: GroupStat[];
  labels: Record<string, string>;
  scaleMax: number;
  title: string;
  width?: number;
}) {
  const padL = 32;
  const padR = 12;
  const padT = 10;
  const padB = 28;
  const h = 200;
  const plotW = width - padL - padR;
  const plotH = h - padT - padB;
  const n = Math.max(1, groups.length);
  const gap = 8;
  const barW = Math.min(56, (plotW - gap * (n - 1)) / n);
  const totalBars = barW * n + gap * (n - 1);
  const x0 = padL + (plotW - totalBars) / 2;
  const yMin = 1;
  const y = (v: number) => padT + plotH - ((v - yMin) / (scaleMax - yMin)) * plotH;
  const ticks = Array.from({ length: scaleMax - yMin + 1 }, (_, i) => yMin + i);

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${width} ${h}`} width="100%" role="img" aria-label={title} className="max-w-full font-sans">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke="#e1e0d9" strokeWidth={1} />
            <text x={padL - 6} y={y(t) + 3} fontSize={10} fill="#898781" textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <line x1={padL} x2={width - padR} y1={y(yMin)} y2={y(yMin)} stroke="#c3c2b7" strokeWidth={1} />
        {groups.map((g, i) => {
          const x = x0 + i * (barW + gap);
          const has = Number.isFinite(g.mean) && g.n > 0;
          const top = has ? y(g.mean) : y(yMin);
          const barH = has ? y(yMin) - top : 0;
          const color = SERIES[i % SERIES.length];
          const label = labels[g.key] ?? g.key;
          return (
            <g key={g.key}>
              <title>{`${label}: M=${has ? g.mean.toFixed(2) : "–"} SD=${has ? g.sd.toFixed(2) : "–"} n=${g.n}`}</title>
              <rect x={x} y={top} width={barW} height={barH} rx={barH > 4 ? 4 : 0} fill={color} />
              {has && barH > 4 && <rect x={x} y={y(yMin) - 4} width={barW} height={4} fill={color} />}
              {has && g.n > 1 && (
                <line x1={x + barW / 2} x2={x + barW / 2} y1={y(Math.min(scaleMax, g.mean + g.ci95))} y2={y(Math.max(yMin, g.mean - g.ci95))} stroke="#0b0b0b" strokeWidth={1.5} strokeOpacity={0.6} />
              )}
              <text x={x + barW / 2} y={Math.max(padT + 10, top - 6)} fontSize={11} fill="#0b0b0b" textAnchor="middle" fontWeight={600}>
                {has ? g.mean.toFixed(2) : "–"}
              </text>
              <text x={x + barW / 2} y={h - padB + 14} fontSize={11} fill="#52514e" textAnchor="middle">
                {label}
              </text>
              <text x={x + barW / 2} y={h - padB + 26} fontSize={10} fill="#898781" textAnchor="middle">
                n={g.n}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
