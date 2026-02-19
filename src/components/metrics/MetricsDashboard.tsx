"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useBoardContext } from "@/lib/board-context";
import type { MetricsResponse } from "@/app/api/metrics/route";
import { generateMetricsCSV } from "@/lib/csv-export";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function StatCard({
  title,
  value,
  unit,
  icon,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsDashboard() {
  const { currentBoard } = useBoardContext();
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!currentBoard?.id) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ boardId: currentBoard.id });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/metrics?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setMetrics(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [currentBoard?.id, from, to]);

  function handleExportCSV() {
    if (!metrics) return;
    const csv = generateMetricsCSV(metrics, metrics.cards ?? []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `metrics-${currentBoard?.name ?? "board"}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No board selected.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading metrics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Error: {error}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Icons.metrics className="h-6 w-6" />
            Metrics — {currentBoard.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Performance overview · Last 30 days
          </p>
        </div>

        {/* Date range + Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
            />
          </div>
          {(from || to) && (
            <button
              onClick={() => { setFrom(""); setTo(""); }}
              className="text-xs text-muted-foreground underline"
            >
              Clear
            </button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            disabled={!metrics}
            className="gap-1"
          >
            <Icons.metrics className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Avg Cycle Time"
          value={metrics.cycleTime.average}
          unit="h"
          icon={<Icons.metrics className="h-4 w-4" />}
        />
        <StatCard
          title="Avg Lead Time"
          value={metrics.leadTime.average}
          unit="h"
          icon={<Icons.metrics className="h-4 w-4" />}
        />
        <StatCard
          title="Throughput (avg/day)"
          value={metrics.throughput.average}
          unit="cards"
          icon={<Icons.metrics className="h-4 w-4" />}
        />
        <StatCard
          title="Stalled Cards"
          value={metrics.stallTime.count}
          icon={<Icons.metrics className="h-4 w-4" />}
        />
      </div>

      {/* Throughput chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Throughput (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.throughput.daily.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.throughput.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Cards Done" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Cycle & Lead Time per card */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cycle Time per Card (hours)</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.cycleTime.perCard.length === 0 ? (
              <p className="text-muted-foreground text-sm">No completed cards yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={metrics.cycleTime.perCard}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="card_id" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.slice(0, 6)} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => `Card: ${v}`}
                  />
                  <Bar dataKey="hours" name="Cycle Time (h)" fill="hsl(var(--chart-1, 220 70% 50%))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Time per Card (hours)</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.leadTime.perCard.length === 0 ? (
              <p className="text-muted-foreground text-sm">No completed cards yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={metrics.leadTime.perCard}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="card_id" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.slice(0, 6)} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => `Card: ${v}`}
                  />
                  <Line type="monotone" dataKey="hours" name="Lead Time (h)" stroke="hsl(var(--chart-2, 160 60% 45%))" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stall Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Stalled Cards
            {metrics.stallTime.count > 0 && (
              <Badge variant="destructive">{metrics.stallTime.count}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.stallTime.stalledCards.length === 0 ? (
            <p className="text-muted-foreground text-sm">No stalled cards 🎉</p>
          ) : (
            <div className="space-y-2">
              {metrics.stallTime.stalledCards.map((c) => (
                <div
                  key={c.card_id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">{c.card_id.slice(0, 8)}…</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      Since {new Date(c.stalledSince).toLocaleDateString()}
                    </span>
                    <Badge variant="destructive">{c.hoursStalled}h</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
