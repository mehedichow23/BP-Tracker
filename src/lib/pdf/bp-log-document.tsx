import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

import { BP_CATEGORY_PDF_COLORS, categorizeBP } from "@/lib/bp-category";
import { formatDateOnly, formatTimeOnly } from "@/lib/dates";

export type BPLogReading = {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  taken_at: string;
  notes: string | null;
};

type BPLogDocumentProps = {
  readings: BPLogReading[];
  personsLabel: string;
  timezoneLabel: string;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  subtitle: { fontSize: 10, color: "#525252", marginBottom: 2 },
  table: { borderWidth: 1, borderColor: "#e5e5e5" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderColor: "#e5e5e5",
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e5e5" },
  cell: { padding: 6, fontSize: 9 },
  cellHeader: { padding: 6, fontSize: 9, fontFamily: "Helvetica-Bold" },
  colDate: { width: "18%" },
  colTime: { width: "14%" },
  colSys: { width: "14%" },
  colDia: { width: "14%" },
  colPulse: { width: "12%" },
  colNotes: { width: "28%" },
  summary: { marginTop: 16, borderTopWidth: 1, borderColor: "#e5e5e5", paddingTop: 10 },
  summaryTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  summaryRow: { marginBottom: 3 },
  disclaimer: { marginTop: 16, fontSize: 8, color: "#737373" },
});

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function BPLogDocument({ readings, personsLabel, timezoneLabel }: BPLogDocumentProps) {
  const sorted = [...readings].sort((a, b) => a.taken_at.localeCompare(b.taken_at));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const dateRangeLabel = !first
    ? "No readings"
    : formatDateOnly(first.taken_at) === formatDateOnly(last.taken_at)
      ? formatDateOnly(first.taken_at)
      : `${formatDateOnly(first.taken_at)} to ${formatDateOnly(last.taken_at)}`;

  const generatedAtLabel = format(new Date(), "MMM d, yyyy 'at' h:mm a");

  const systolics = sorted.map((r) => r.systolic);
  const diastolics = sorted.map((r) => r.diastolic);
  const pulses = sorted
    .map((r) => r.pulse)
    .filter((p): p is number => p !== null);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Blood Pressure Log</Text>
          <Text style={styles.subtitle}>{personsLabel}</Text>
          <Text style={styles.subtitle}>{dateRangeLabel}</Text>
          <Text style={styles.subtitle}>Generated {generatedAtLabel}</Text>
          <Text style={styles.subtitle}>Times shown in {timezoneLabel}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cellHeader, styles.colDate]}>Date</Text>
            <Text style={[styles.cellHeader, styles.colTime]}>Time</Text>
            <Text style={[styles.cellHeader, styles.colSys]}>Systolic</Text>
            <Text style={[styles.cellHeader, styles.colDia]}>Diastolic</Text>
            <Text style={[styles.cellHeader, styles.colPulse]}>Pulse</Text>
            <Text style={[styles.cellHeader, styles.colNotes]}>Notes</Text>
          </View>
          {sorted.map((reading) => {
            const colors = BP_CATEGORY_PDF_COLORS[categorizeBP(reading.systolic, reading.diastolic)];
            return (
              <View
                key={reading.id}
                style={[styles.tableRow, { backgroundColor: colors.bg }]}
              >
                <Text style={[styles.cell, styles.colDate, { color: colors.text }]}>
                  {formatDateOnly(reading.taken_at)}
                </Text>
                <Text style={[styles.cell, styles.colTime, { color: colors.text }]}>
                  {formatTimeOnly(reading.taken_at)}
                </Text>
                <Text style={[styles.cell, styles.colSys, { color: colors.text }]}>
                  {reading.systolic}
                </Text>
                <Text style={[styles.cell, styles.colDia, { color: colors.text }]}>
                  {reading.diastolic}
                </Text>
                <Text style={[styles.cell, styles.colPulse, { color: colors.text }]}>
                  {reading.pulse ?? "-"}
                </Text>
                <Text style={[styles.cell, styles.colNotes, { color: colors.text }]}>
                  {reading.notes ?? ""}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryRow}>Readings: {sorted.length}</Text>
          <Text style={styles.summaryRow}>
            Average: {average(systolics) ?? "-"}/{average(diastolics) ?? "-"}
            {pulses.length > 0 ? `, pulse ${average(pulses)}` : ""}
          </Text>
          <Text style={styles.summaryRow}>
            Systolic range: {systolics.length ? Math.min(...systolics) : "-"} to{" "}
            {systolics.length ? Math.max(...systolics) : "-"}
          </Text>
          <Text style={styles.summaryRow}>
            Diastolic range: {diastolics.length ? Math.min(...diastolics) : "-"} to{" "}
            {diastolics.length ? Math.max(...diastolics) : "-"}
          </Text>
          <Text style={styles.summaryRow}>
            Pulse range: {pulses.length ? Math.min(...pulses) : "-"} to{" "}
            {pulses.length ? Math.max(...pulses) : "-"}
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          These are self-reported readings, not a medical record. Consult a healthcare
          professional for diagnosis or treatment decisions.
        </Text>
      </Page>
    </Document>
  );
}
