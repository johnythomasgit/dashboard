import './App.css'
import { PomodoroWidget } from './components/Pomodoro/PomodoroWidget'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Personal Dashboard</h1>
      </header>
      <main className="main">
        <div className="grid">
          <PomodoroWidget />
        </div>
      </main>
      <footer className="footer">
        <span className="muted">v0.1 • Pomodoro</span>
      </footer>
    </div>
  )
}

export default App
