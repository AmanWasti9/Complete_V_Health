// components/DoctorCard.js
import { View, Text, Image, StyleSheet } from "react-native";

const DoctorCard = ({ name, specialty }) => {
  return (
    <View style={styles.card}>
      <Image
        source={{
          uri: "https://static.everypixel.com/ep-pixabay/0329/8099/0858/84037/3298099085884037069-head.png",
        }}
        style={styles.image}
      />
      <Text style={styles.name}>Dr. {name}</Text>
      <Text style={styles.specialty}>{specialty}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    elevation: 3,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  name: {
    fontWeight: "bold",
    textAlign: "center",
  },
  specialty: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});

export default DoctorCard;
