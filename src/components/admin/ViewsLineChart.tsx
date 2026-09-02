"use client";

import { useEffect, useRef } from "react";
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler, Legend, Tooltip);

type Props = {
  labels: string[];
  quran: number[];
  kids: number[];
  music: number[];
  hidden: boolean;
};

function tickColor() {
  return document.documentElement.classList.contains("dark") ? "#94a3b8" : "#64748b";
}

function gridColor() {
  return document.documentElement.classList.contains("dark")
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(11, 31, 58, 0.06)";
}

export function ViewsLineChart({ labels, quran, kids, music, hidden }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "USB القرآن الكريم",
            data: quran,
            borderColor: "#D4AF37",
            backgroundColor: "rgba(212, 175, 55, 0.12)",
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: "#D4AF37",
            hidden,
          },
          {
            label: "USB تعليم الأطفال",
            data: kids,
            borderColor: "#38BDF8",
            backgroundColor: "rgba(56, 189, 248, 0.08)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: "#38BDF8",
            hidden,
          },
          {
            label: "USB الموسيقى",
            data: music,
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: "#10B981",
            hidden,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 650, easing: "easeOutQuart" },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            rtl: true,
            labels: {
              color: tickColor(),
              font: { family: "Tajawal, sans-serif", size: 11, weight: 700 },
              boxWidth: 12,
              padding: 16,
            },
          },
          tooltip: {
            rtl: true,
            callbacks: {
              label(context) {
                const value = context.parsed.y ?? 0;
                return ` ${context.dataset.label}: ${value.toLocaleString("en-US")}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor() },
            ticks: { color: tickColor(), font: { family: "Tajawal, sans-serif", size: 10 }, maxRotation: 0, maxTicksLimit: 8 },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor() },
            ticks: {
              color: tickColor(),
              font: { family: "Tajawal, sans-serif", size: 10 },
              callback(value) {
                return Number(value).toLocaleString("en-US");
              },
            },
          },
        },
      },
    });

    const observer = new MutationObserver(() => {
      const chart = chartRef.current;
      if (!chart) return;
      const ticks = tickColor();
      const grid = gridColor();
      if (chart.options.plugins?.legend?.labels) chart.options.plugins.legend.labels.color = ticks;
      if (chart.options.scales?.x) {
        chart.options.scales.x.ticks = { ...chart.options.scales.x.ticks, color: ticks };
        chart.options.scales.x.grid = { ...chart.options.scales.x.grid, color: grid };
      }
      if (chart.options.scales?.y) {
        chart.options.scales.y.ticks = { ...chart.options.scales.y.ticks, color: ticks };
        chart.options.scales.y.grid = { ...chart.options.scales.y.grid, color: grid };
      }
      chart.update("none");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // Recreate only when the axis labels change (today vs week vs month).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels.join("|")]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.datasets[0].data = quran;
    chart.data.datasets[1].data = kids;
    chart.data.datasets[2].data = music;
    chart.data.datasets.forEach((dataset) => {
      dataset.hidden = hidden;
    });
    chart.update(hidden ? "none" : "active");
  }, [quran, kids, music, hidden]);

  return <canvas ref={canvasRef} />;
}
