import React, { useState } from 'react';
import { SafeAreaView, View, Text, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

type MenuProps = {
  initialPlayers?: number;
  initialLife?: 20 | 30 | 40;
  onStart: (players: number, life: 20 | 30 | 40) => void;
};

export default function Menu({ initialPlayers = 2, initialLife = 20, onStart }: MenuProps) {
  const [selected, setSelected] = useState<number>(initialPlayers);
  const [life, setLife] = useState<20 | 30 | 40>(initialLife);
  React.useEffect(() => {
    // Ensure system UI is visible when landing on the menu (native only)
    if (Platform.OS !== 'web') {
      try { StatusBar.setHidden(false, 'fade'); } catch {}
      if (Platform.OS === 'android') {
        try {
          const NavigationBar = require('expo-navigation-bar');
          NavigationBar.setVisibilityAsync('visible');
          NavigationBar.setBehaviorAsync('inset-swipe');
        } catch {}
      }
    }
  }, []);
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const doc: any = (globalThis as any).document;
    if (!doc) return;
    const onChange = () => setIsFullscreen(!!doc.fullscreenElement);
    try { doc.addEventListener('fullscreenchange', onChange); } catch {}
    return () => { try { doc.removeEventListener('fullscreenchange', onChange); } catch {} };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Counter MTG</Text>
      <Text style={styles.subtitle}>Elige cantidad de jugadores (1 a 6)</Text>

      <View style={styles.grid}>
        {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
          <Pressable
            key={n}
            onPress={() => setSelected(n)}
            style={[styles.option, selected === n ? styles.optionSelected : null]}
          >
            <Text style={styles.optionText}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.subtitle}>Vidas iniciales</Text>
      <View style={styles.lifeRow}>
        {[20, 30, 40].map((v) => (
          <Pressable
            key={v}
            onPress={() => setLife(v as 20 | 30 | 40)}
            style={[styles.lifeBtn, life === v ? styles.lifeBtnSelected : null]}
          >
            <Text style={styles.lifeText}>{v}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={async () => {
          try {
            if (Platform.OS === 'web') {
              const doc: any = (globalThis as any).document;
              if (doc && !doc.fullscreenElement && doc.documentElement?.requestFullscreen) {
                try { await doc.documentElement.requestFullscreen(); } catch {}
              }
            } else {
              // Native: enter fullscreen by hiding system UI
              try { StatusBar.setHidden(true, 'fade'); } catch {}
              if (Platform.OS === 'android') {
                try {
                  const NavigationBar = require('expo-navigation-bar');
                  await NavigationBar.setVisibilityAsync('hidden');
                  await NavigationBar.setBehaviorAsync('overlay-swipe');
                } catch {}
              }
            }
          } catch {}
          onStart(selected, life);
        }}
        style={styles.startBtn}
      >
        <Text style={styles.startText}>Comenzar</Text>
      </Pressable>

      <Pressable
        onPress={async () => {
          if (Platform.OS === 'web') {
            try {
              const doc: any = (globalThis as any).document;
              if (!doc) return;
              if (!doc.fullscreenElement && doc.documentElement?.requestFullscreen) {
                try { await doc.documentElement.requestFullscreen(); } catch {}
              } else if (doc.exitFullscreen) {
                try { await doc.exitFullscreen(); } catch {}
              }
            } catch {}
          }
        }}
        style={styles.fullBtn}
        accessibilityLabel={'Toggle fullscreen'}
      >
        <FontAwesome5 name={isFullscreen ? 'compress' : 'expand'} size={18} color="#e2e8f0" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
    gap: 16,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  lifeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  option: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  optionSelected: {
    backgroundColor: '#0ea5e9',
  },
  lifeBtn: {
    minWidth: 80,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  lifeBtnSelected: {
    backgroundColor: '#0ea5e9',
  },
  optionText: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
  },
  lifeText: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  startBtn: {
    marginTop: 16,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 5,
    alignItems: 'center',
    alignSelf: 'center',
  },
  fullBtn: {
    marginTop: 8,
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    alignSelf: 'center',
  },
  startText: {
    color: '#052e12',
    fontWeight: '800',
    fontSize: 18,
  },
});
