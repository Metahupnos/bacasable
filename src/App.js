import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Mon App React Simple</h1>
        <p>Bienvenue dans ma première application React !</p>
        <button onClick={() => alert('Hello World!')}>
          Clique-moi !
        </button>
      </header>
    </div>
  );
}

export default App;
