import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import supabase from '../services/supabaseService';

export default function ConsultationScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctor();
  }, []);

  const loadDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'doctor')
        .single();

      if (error) throw error;
      setSelectedDoctor(data);
    } catch (error) {
      console.error('Error loading doctor:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleChatPress = (doctor) => {
    navigation.navigate('Chat', {
      doctorId: doctor.id,
      patientId: user.id,
      doctorName: doctor.full_name
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Online Consultation</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => navigation.navigate('VideoCall')}
        >
          <MaterialIcons name="videocam" size={32} color="#2196F3" />
          <Text style={styles.optionTitle}>Video Call</Text>
          <Text style={styles.optionDescription}>Face-to-face consultation with doctor</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => navigation.navigate('AudioCall')}
        >
          <MaterialIcons name="phone" size={32} color="#4CAF50" />
          <Text style={styles.optionTitle}>Audio Call</Text>
          <Text style={styles.optionDescription}>Voice consultation with doctor</Text>
        </TouchableOpacity>        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => handleChatPress({
            id: 'temp-doctor-id', // Replace with actual doctor ID
            full_name: 'Dr. John Smith' // Replace with actual doctor name
          })}
        >
          <MaterialIcons name="chat" size={32} color="#FF9800" />
          <Text style={styles.optionTitle}>Chat</Text>
          <Text style={styles.optionDescription}>Text consultation with doctor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  optionsContainer: {
    padding: 20,
    gap: 15,
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
