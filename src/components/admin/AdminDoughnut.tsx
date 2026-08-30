"use client";

import { useEffect, useRef } from "react";
import { ArcElement, Chart, DoughnutController, Tooltip } from "chart.js";

Chart.register(DoughnutController, ArcElement, Tooltip);

type Props = {
  labels: string[];
  values: number[];
  colors: string[];
  cutout?: string;
};

export function AdminDoughnut({ labels, values, colors, cutout = "70%" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<"doughnut"> | null>(null);

  const key = JSON.stringify({ labels, values, colors, cutout });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parsed = JSON.parse(key) as Props;
    const payload =
      parsed.values && parsed.values.length
        ? parsed
        : { labels: ["—"], values: [1], colors: ["#e5e7eb"], cutout: parsed.cutout };
    const border = document.documentElement.classList.contains("dark") ? "#0F1E33" : "#FFFFFF";
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: payload.labels,
        datasets: [
          {
            data: payload.values,
            backgroundColor: payload.colors,
            borderWidth: 3,
            borderColor: border,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: payload.cutout,
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true,
            callbacks: {
              label(context) {
                return ` ${context.label}: ${context.parsed}`;
              },
            },
          },
        },
      },
    });

    const observer = new MutationObserver(() => {
      const next = document.documentElement.classList.contains("dark") ? "#0F1E33" : "#FFFFFF";
      const chart = chartRef.current;
      if (!chart) return;
      chart.data.datasets[0].borderColor = next;
      chart.update();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [key]);

  return <canvas ref={canvasRef} />;
}
