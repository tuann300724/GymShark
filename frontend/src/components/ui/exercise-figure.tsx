import type { ExerciseFigureData, Gear, Pose } from '@/lib/exercise-figures';

/** Toạ độ điểm → chuỗi "x,y" cho SVG */
function p(pt: [number, number]): string {
  return `${pt[0]},${pt[1]}`;
}

function GearShape({ gear }: { gear: Gear }) {
  switch (gear.type) {
    case 'plate':
      return (
        <g className="fill-none stroke-neon/70" strokeWidth={2.2}>
          <circle cx={gear.at[0]} cy={gear.at[1]} r={gear.r} />
          <circle className="fill-neon/70 stroke-none" cx={gear.at[0]} cy={gear.at[1]} r={1.6} />
        </g>
      );
    case 'dumbbell':
      return (
        <g className="stroke-neon/70" strokeWidth={2}>
          <line x1={gear.at[0] - 5} y1={gear.at[1]} x2={gear.at[0] + 5} y2={gear.at[1]} />
          <circle
            className="fill-neon/70 stroke-none"
            cx={gear.at[0] - 5}
            cy={gear.at[1]}
            r={2.6}
          />
          <circle
            className="fill-neon/70 stroke-none"
            cx={gear.at[0] + 5}
            cy={gear.at[1]}
            r={2.6}
          />
        </g>
      );
    case 'bench':
      return (
        <g className="fill-none stroke-muted" strokeLinecap="round">
          <line
            x1={gear.from[0]}
            y1={gear.from[1]}
            x2={gear.to[0]}
            y2={gear.to[1]}
            strokeWidth={5}
          />
          {gear.legs && (
            <>
              <line
                x1={gear.from[0]}
                y1={gear.from[1]}
                x2={gear.from[0]}
                y2={100}
                strokeWidth={2.2}
              />
              <line x1={gear.to[0]} y1={gear.to[1]} x2={gear.to[0]} y2={100} strokeWidth={2.2} />
            </>
          )}
        </g>
      );
    case 'beam':
      return (
        <line
          className="fill-none stroke-muted"
          strokeLinecap="round"
          strokeWidth={3.5}
          x1={gear.from[0]}
          y1={gear.from[1]}
          x2={gear.to[0]}
          y2={gear.to[1]}
        />
      );
    case 'post':
      return (
        <line
          className="fill-none stroke-muted/70"
          strokeWidth={3}
          x1={gear.from[0]}
          y1={gear.from[1]}
          x2={gear.to[0]}
          y2={gear.to[1]}
        />
      );
    case 'cable':
      return (
        <line
          className="stroke-neon/50"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          x1={gear.from[0]}
          y1={gear.from[1]}
          x2={gear.to[0]}
          y2={gear.to[1]}
        />
      );
    case 'box':
      return (
        <rect
          className="fill-none stroke-neon/70"
          strokeWidth={2}
          x={gear.x}
          y={gear.y}
          width={gear.w}
          height={gear.h}
          rx={2}
        />
      );
  }
}

function Frame({ pose }: { pose: Pose }) {
  return (
    <g>
      {/* mặt đất */}
      <line className="stroke-line" strokeWidth={1.5} x1={4} y1={100} x2={108} y2={100} />

      {/* thân người */}
      <g
        className="fill-none stroke-muted"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1={pose.shoulder[0]} y1={pose.shoulder[1]} x2={pose.hip[0]} y2={pose.hip[1]} />
        {pose.shoulderLine && (
          <line
            x1={pose.shoulderLine[0][0]}
            y1={pose.shoulderLine[0][1]}
            x2={pose.shoulderLine[1][0]}
            y2={pose.shoulderLine[1][1]}
            strokeWidth={2.4}
          />
        )}
        {pose.arms.map((arm, i) => (
          <polyline key={`arm-${i}`} points={`${p(arm.from)} ${p(arm.elbow)} ${p(arm.hand)}`} />
        ))}
        {pose.legs.map((leg, i) => (
          <polyline key={`leg-${i}`} points={`${p(pose.hip)} ${p(leg.knee)} ${p(leg.foot)}`} />
        ))}
        <circle className="fill-muted stroke-none" cx={pose.head[0]} cy={pose.head[1]} r={6.5} />
      </g>

      {/* dụng cụ vẽ đè lên thân người */}
      {pose.gear?.map((gear, i) => (
        <GearShape key={`gear-${i}`} gear={gear} />
      ))}
    </g>
  );
}

interface ExerciseFigureProps {
  figure: ExerciseFigureData;
  /** Mô tả tiếng Việt cho screen reader */
  label: string;
  className?: string;
}

/**
 * Minh hoạ 2 khung "bắt đầu → kết thúc" của một bài tập,
 * vẽ hoàn toàn bằng SVG (không cần ảnh).
 */
export function ExerciseFigure({ figure, label, className }: ExerciseFigureProps) {
  return (
    <svg
      viewBox="0 0 240 108"
      className={className}
      role="img"
      aria-label={`Hướng dẫn động tác: ${label}`}
    >
      <g>
        <text className="fill-neon/70" x={4} y={12} fontSize={9} fontWeight={700}>
          1
        </text>
        <Frame pose={figure.start} />
      </g>
      {/* mũi tên chuyển khung */}
      <polyline
        className="fill-none stroke-neon/60"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points="115,48 121,54 115,60"
      />
      <g transform="translate(128,0)">
        <text className="fill-neon/70" x={4} y={12} fontSize={9} fontWeight={700}>
          2
        </text>
        <Frame pose={figure.end} />
      </g>
    </svg>
  );
}
