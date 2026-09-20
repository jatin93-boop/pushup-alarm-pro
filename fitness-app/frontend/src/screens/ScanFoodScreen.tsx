import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as ImagePicker from "expo-image-picker";
import { lookupBarcode, recognizeMealPhoto } from "../api/client";

type Mode = "menu" | "barcode" | "photo";

export default function ScanFoodScreen() {
  const [mode, setMode] = useState<Mode>("menu");
  const [result, setResult] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setMode("menu");
    try {
      const item = await lookupBarcode(data);
      setResult(item);
      setError("");
    } catch {
      setError("Product not found for that barcode.");
    }
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission is required to scan a meal.");
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (picked.canceled) return;

    const uri = picked.assets[0].uri;
    setPhotoUri(uri);
    try {
      const data = await recognizeMealPhoto(uri);
      setResult(data);
      setError("");
    } catch {
      setError("Couldn't identify that meal. Try again or log it manually.");
    }
  };

  if (mode === "barcode") {
    return (
      <View style={{ flex: 1 }}>
        <BarCodeScanner onBarCodeScanned={handleBarcodeScanned} style={StyleSheet.absoluteFillObject} />
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode("menu")}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log food</Text>

      <TouchableOpacity style={styles.optionBtn} onPress={() => setMode("barcode")}>
        <Text style={styles.optionText}>Scan barcode (packaged food)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionBtn} onPress={handlePickPhoto}>
        <Text style={styles.optionText}>Photo a meal (home-cooked / restaurant)</Text>
      </TouchableOpacity>

      {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>
            {result.name || result.candidates?.[0]?.name || "Result"}
          </Text>
          <Text style={styles.resultText}>
            {JSON.stringify(result, null, 2)}
          </Text>
          {/* TODO: confirm/edit portion size here, then call logFood() */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 20 },
  optionBtn: { backgroundColor: "#f5f5f5", padding: 16, borderRadius: 12, marginBottom: 12 },
  optionText: { fontWeight: "500" },
  preview: { width: "100%", height: 200, borderRadius: 12, marginTop: 12 },
  error: { color: "red", marginTop: 12 },
  resultBox: { marginTop: 16, padding: 16, backgroundColor: "#f0f0f0", borderRadius: 12 },
  resultTitle: { fontWeight: "600", marginBottom: 8 },
  resultText: { fontSize: 12, color: "#444" },
  cancelBtn: { position: "absolute", bottom: 40, alignSelf: "center", backgroundColor: "#000a", padding: 14, borderRadius: 24, paddingHorizontal: 28 },
  cancelText: { color: "#fff", fontWeight: "600" },
});
