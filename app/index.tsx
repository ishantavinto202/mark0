import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello, so you are back?</Text>
      <Text
        style={{
          textAlign: "center",
          marginTop: 16,
          fontSize: 18,
          fontWeight: "500",
        }}
      >
        Let me tell you something for now
      </Text>
      <Text style={{ textAlign: "center", marginTop: 8, fontSize: 16 }}>
        My partner accused me of having no sense of direction.
      </Text>
      <Text style={{ textAlign: "center", marginTop: 4, fontSize: 16 }}>
        I got so angry, I packed up my stuff and right.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#000000",
    fontSize: 28,
    fontWeight: "600",
  },
  subtext: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "600",
  },
});
