import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { registerUser } from "../api/client";

const GOALS = ["bulk", "lean_bulk", "maintain", "cut"];

export default function OnboardingScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState("lean_bulk");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password || !weightKg || !heightCm || !age) {
      setError("Fill in every field before continuing.");
      return;
    }
    try {
      await registerUser({
        email,
        password,
        weight_kg: parseFloat(weightKg),
        height_cm: parseFloat(heightCm),
        age: parseInt(age, 10),
        sex: "male", // TODO: add a picker
        activity_level: "moderate", // TODO: add a picker
        goal,
      });
      navigation.replace("Main");
    } catch (e) {
      setError("Could not create your account. Check the backend is running.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your goal</Text>

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Weight (kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Height (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />

      <Text style={styles.label}>Goal</Text>
      <View style={styles.goalRow}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.goalChip, goal === g && styles.goalChipActive]}
            onPress={() => setGoal(g)}
          >
            <Text style={goal === g ? styles.goalTextActive : styles.goalText}>{g.replace("_", " ")}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  label: { fontSize: 14, marginBottom: 8, color: "#555" },
  goalRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  goalChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: "#ccc" },
  goalChipActive: { backgroundColor: "#222", borderColor: "#222" },
  goalText: { color: "#333" },
  goalTextActive: { color: "#fff" },
  error: { color: "red", marginBottom: 12 },
  button: { backgroundColor: "#222", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
