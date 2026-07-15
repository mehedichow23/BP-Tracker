"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { HouseholdMember } from "@/lib/household";

type TrendReading = {
  user_id: string;
  systolic: number;
  diastolic: number;
  taken_at: string;
};

const PALETTE = [
  { systolic: "#2563eb", diastolic: "#93c5fd" },
  { systolic: "#d97706", diastolic: "#fcd34d" },
];

export function DashboardTrendChart({
  readings,
  household,
}: {
  readings: TrendReading[];
  household: HouseholdMember[];
}) {
  const [visible, setVisible] = useState<Set<string>>(
    new Set(household.map((m) => m.id))
  );

  const colorByPerson = useMemo(() => {
    const map = new Map<string, (typeof PALETTE)[number]>();
    household.forEach((m, i) => map.set(m.id, PALETTE[i % PALETTE.length]));
    return map;
  }, [household]);

  const data = useMemo(() => {
    const sorted = [...readings].sort(
      (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
    );
    return sorted.map((r) => ({
      takenAtMs: new Date(r.taken_at).getTime(),
      taken_at: r.taken_at,
      [`${r.user_id}_systolic`]: r.systolic,
      [`${r.user_id}_diastolic`]: r.diastolic,
    }));
  }, [readings]);

  function toggle(id: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Last 30 days</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          {household.map((member) => {
            const colors = colorByPerson.get(member.id);
            return (
              <label
                key={member.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Checkbox
                  checked={visible.has(member.id)}
                  onCheckedChange={() => toggle(member.id)}
                  style={{ borderColor: colors?.systolic }}
                />
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: colors?.systolic }}
                />
                {member.display_name}
              </label>
            );
          })}
        </div>

        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No readings in the last 30 days
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="takenAtMs"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  scale="time"
                  tickFormatter={(ms) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  domain={[40, "dataMax + 10"]}
                  tick={{ fontSize: 11 }}
                  width={40}
                />
                <Tooltip
                  labelFormatter={(ms) => new Date(ms as number).toLocaleString()}
                />
                {household
                  .filter((m) => visible.has(m.id))
                  .flatMap((member) => {
                    const colors = colorByPerson.get(member.id);
                    return [
                      <Line
                        key={`${member.id}-sys`}
                        type="monotone"
                        dataKey={`${member.id}_systolic`}
                        name={`${member.display_name} systolic`}
                        stroke={colors?.systolic}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                        isAnimationActive={false}
                      />,
                      <Line
                        key={`${member.id}-dia`}
                        type="monotone"
                        dataKey={`${member.id}_diastolic`}
                        name={`${member.display_name} diastolic`}
                        stroke={colors?.diastolic}
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        dot={{ r: 3 }}
                        connectNulls
                        isAnimationActive={false}
                      />,
                    ];
                  })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
