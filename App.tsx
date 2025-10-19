import React, { useState } from 'react';
import Menu from './pages/Menu';
import Game from './pages/Game';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [players, setPlayers] = useState<number>(2);

  if (screen === 'menu') {
    return (
      <Menu
        initialPlayers={players}
        onStart={(n) => {
          setPlayers(n);
          setScreen('game');
        }}
      />
    );
  }

  return <Game count={players} onBack={() => setScreen('menu')} />;
}
