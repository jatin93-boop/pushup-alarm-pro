import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { getUserTargets } from "../api/client";

// TODO: replace with the real logged-in user id from auth/session state
const DEMO_USER_ID = "demo-user-id";

export default function DashboardScreen() {
  const [targets, setTargets] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserTargets(DEMO_USER_ID)
      .then(setTargets)
      .catch(() => setTargets(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's targets</Text>
      {targets ? (
        <View style={styles.grid}>
          <Stat label="Calories" value={`${targets.target_calories} kcal`} />
          <Stat label="Protein" value={`${targets.target_protein_g} g`} />
          <Stat label="Carbs" value={`${targets.target_carbs_g} g`} />
          <Stat label="Fat" value={`${targets.target_fat_g} g`} />
        </View>
      ) : (
        <Text style={styles.error}>Couldn't load targets. Is the backend running?</Text>
      )}
      {/* TODO: daily score card, quick-log buttons, training plan preview */}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { width: "47%", padding: 16, borderRadius: 12, backgroundColor: "#f5f5f5" },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 13, color: "#666", marginTop: 4 },
  error: { color: "red" },
});
