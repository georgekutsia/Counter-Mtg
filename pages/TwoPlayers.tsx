import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import Player from '../components/Player';

export default function TwoPlayers() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.half, styles.topHalf]}>
        <Player name="Player 1" />
      </View>
      <View style={[styles.half, styles.bottomHalf]}>
        <Player name="Player 2" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  half: {
    flex: 1,
  },
  topHalf: {
    backgroundColor: '#1e293b',
  },
  bottomHalf: {
    backgroundColor: '#334155',
  },
});
