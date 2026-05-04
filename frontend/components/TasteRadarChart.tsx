"use client";
// frontend/components/TasteRadarChart.tsx

import type { TasteInput } from "@/lib/types";

type TasteRadarChartProps = {
  features: TasteInput;
};

const AXES: {
  key: keyof TasteInput;
  label: string;
}[] = [
  { key: "brix", label: "甘さ" },
  { key: "acid", label: "酸味" },
  { key: "bitterness", label: "苦味" },
  { key: "aroma", label: "香り" },
  { key: "moisture", label: "果汁" },
  { key: "texture", label: "食感" },
];

const CENTER = 100;
const RADIUS = 64;
const MAX_VALUE = 6;

function clampValue(value: number) {
  return Math.max(0, Math.min(MAX_VALUE, value));
}

function pointFor(index: number, value: number) {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / AXES.length;
  const radius = (clampValue(value) / MAX_VALUE) * RADIUS;

  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function outerPointFor(index: number, extra = 0) {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / AXES.length;
  const radius = RADIUS + extra;

  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function polygonPointsFor(features: TasteInput) {
  return AXES.map((axis, index) => {
    const point = pointFor(index, features[axis.key]);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function gridPointsFor(level: number) {
  const value = (MAX_VALUE * level) / 3;

  return AXES.map((_, index) => {
    const point = pointFor(index, value);
    return `${point.x},${point.y}`;
  }).join(" ");
}

export default function TasteRadarChart({ features }: TasteRadarChartProps) {
  return (
    <div className="tasteRadarChart" aria-label="柑橘の味特徴レーダーチャート">
      <svg viewBox="0 0 200 200" role="img">
        {[1, 2, 3].map((level) => (
          <polygon
            key={level}
            points={gridPointsFor(level)}
            className="tasteRadarGrid"
          />
        ))}

        {AXES.map((_, index) => {
          const end = outerPointFor(index);

          return (
            <line
              key={index}
              x1={CENTER}
              y1={CENTER}
              x2={end.x}
              y2={end.y}
              className="tasteRadarAxis"
            />
          );
        })}

        <polygon
          points={polygonPointsFor(features)}
          className="tasteRadarArea"
        />

        {AXES.map((axis, index) => {
          const label = outerPointFor(index, 22);
          const value = features[axis.key];

          return (
            <g key={axis.key}>
              <text
                x={label.x}
                y={label.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                className="tasteRadarLabel"
              >
                {axis.label}
              </text>
              <text
                x={label.x}
                y={label.y + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                className="tasteRadarValueLabel"
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
