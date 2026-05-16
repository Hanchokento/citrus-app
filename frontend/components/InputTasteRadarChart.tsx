"use client";
// frontend/components/InputTasteRadarChart.tsx

import { useEffect, useMemo, useState } from "react";
import type { TasteInput } from "@/lib/types";

type InputTasteRadarChartProps = {
  values: Partial<TasteInput>;
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

const CENTER = 110;
const RADIUS = 72;
const MAX_VALUE = 6;
const ANIMATION_DURATION_MS = 650;

function clampValue(value: number) {
  return Math.max(0, Math.min(MAX_VALUE, value));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function valueOrZero(values: Partial<TasteInput>, key: keyof TasteInput) {
  const value = values[key];

  return typeof value === "number" ? value : 0;
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

function polygonPointsFor(values: Partial<TasteInput>) {
  return AXES.map((axis, index) => {
    const point = pointFor(index, valueOrZero(values, axis.key));
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

export default function InputTasteRadarChart({
  values,
}: InputTasteRadarChartProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrameId = 0;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const linearProgress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const easedProgress = easeOutCubic(linearProgress);

      setProgress(easedProgress);

      if (linearProgress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    setProgress(0);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    values.brix,
    values.acid,
    values.bitterness,
    values.aroma,
    values.moisture,
    values.texture,
  ]);

  const animatedValues = useMemo<Partial<TasteInput>>(
    () => ({
      brix: valueOrZero(values, "brix") * progress,
      acid: valueOrZero(values, "acid") * progress,
      bitterness: valueOrZero(values, "bitterness") * progress,
      aroma: valueOrZero(values, "aroma") * progress,
      moisture: valueOrZero(values, "moisture") * progress,
      texture: valueOrZero(values, "texture") * progress,
    }),
    [values, progress],
  );

  return (
    <div className="inputTasteRadarChart" aria-label="現在の選択レーダーチャート">
      <svg viewBox="0 0 220 220" role="img">
        {[1, 2, 3].map((level) => (
          <polygon
            key={level}
            points={gridPointsFor(level)}
            className="inputRadarGrid"
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
              className="inputRadarAxis"
            />
          );
        })}

        <polygon
          points={polygonPointsFor(animatedValues)}
          className="inputRadarArea"
        />

        {AXES.map((axis, index) => {
          const animatedPoint = pointFor(
            index,
            valueOrZero(animatedValues, axis.key),
          );
          const labelPoint = outerPointFor(index, 24);
          const rawValue = values[axis.key];
          const valueLabel = typeof rawValue === "number" ? String(rawValue) : "—";

          return (
            <g key={axis.key}>
              <circle
                cx={animatedPoint.x}
                cy={animatedPoint.y}
                r="3.8"
                className="inputRadarPoint"
              />

              <text
                x={labelPoint.x}
                y={labelPoint.y - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="inputRadarLabel"
              >
                {axis.label}
              </text>

              <text
                x={labelPoint.x}
                y={labelPoint.y + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                className="inputRadarValue"
              >
                {valueLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
