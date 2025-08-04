import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  console.log('App component is rendering!');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🕉️ Devebhyo</Text>
      <Text style={styles.subtext}>Basic App Test - Working!</Text>
      <Text style={styles.info}>If you see this, React Native is running</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 20,
    color: 'white',
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: '#FFE5D9',
  },
});