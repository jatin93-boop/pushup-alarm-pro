import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { getCurrentPlan } from "../api/client";

const DEMO_USER_ID = "demo-user-id";

export default function PlanScreen() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentPlan(DEMO_USER_ID)
      .then(setPlan)
      .catch(() => setPlan(null))
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
      <Text style={styles.title}>This week's plan</Text>
      {plan ? (
        <>
          <Text style={styles.row}>Calories: {plan.target_calories} kcal</Text>
          <Text style={styles.row}>Protein: {plan.target_protein_g} g</Text>
          <Text style={styles.row}>Carbs: {plan.target_carbs_g} g</Text>
          <Text style={styles.row}>Fat: {plan.target_fat_g} g</Text>
          {plan.reason && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Why this changed</Text>
              <Text style={styles.reasonText}>{plan.reason}</Text>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.error}>No plan yet -- finish onboarding first.</Text>
      )}
      {/* TODO: training split preview, pulled from /workouts/{user_id}/plan */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 20 },
  row: { fontSize: 16, marginBottom: 8 },
  reasonBox: { marginTop: 20, padding: 16, backgroundColor: "#f0f0f0", borderRadius: 12 },
  reasonLabel: { fontWeight: "600", marginBottom: 6 },
  reasonText: { color: "#444" },
  error: { color: "red" },
});
