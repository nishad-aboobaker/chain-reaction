import { useAppStore } from './store/appStore';
import MainMenu from './components/MainMenu';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import HowToPlay from './components/HowToPlay';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

function App() {
  const currentScreen = useAppStore((state) => state.currentScreen);

  return (
    <>
      {currentScreen === 'menu' && <MainMenu />}
      {currentScreen === 'create-room' && <CreateRoom />}
      {currentScreen === 'join-room' && <JoinRoom />}
      {currentScreen === 'how-to-play' && <HowToPlay />}
      {currentScreen === 'lobby' && <Lobby />}
      {currentScreen === 'game' && <GameBoard />}
    </>
  );
}

export default App;
