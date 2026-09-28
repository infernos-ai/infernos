import { useEffect, useState } from 'react'
import { fetchModels } from './api/modelsClient'
import { createSession } from './api/l402Client'
import { WalletBadge } from './components/WalletBadge'
import { InvoiceModal } from './components/InvoiceModal'
import { ChatWindow } from './components/ChatWindow'
import { Dashboard } from './components/Dashboard'
import './index.css'

function App() {
  const [view, setView] = useState('caller'); // 'caller' | 'operator'

  const [models, setModels] = useState([])
  const [error, setError] = useState(null)
  
  // Session State
  const [sessionState, setSessionState] = useState('IDLE') // IDLE, CREATING_SESSION, PAYMENT_REQUIRED, AUTHORIZED
  const [challenge, setChallenge] = useState(null)
  const [authData, setAuthData] = useState(null) // { macaroon, preimage }

  useEffect(() => {
    fetchModels()
      .then((data) => {
        if (data && data.data) setModels(data.data)
      })
      .catch((err) => setError(err.message))
  }, [])

  const handleCreateSession = async () => {
    setSessionState('CREATING_SESSION')
    setError(null)
    try {
      const result = await createSession(100)
      if (result.status === 402) {
        setChallenge(result.challenge)
        setSessionState('PAYMENT_REQUIRED')
      }
    } catch (err) {
      setError(err.message)
      setSessionState('IDLE')
    }
  }

  const handlePaymentSuccess = (preimage) => {
    setAuthData({
      macaroon: challenge.macaroon,
      preimage
    })
    setChallenge(null)
    setSessionState('AUTHORIZED')
  }

  const handleSessionError = (msg) => {
    setError(msg)
    setSessionState('IDLE')
    setAuthData(null)
  }

  const activeModel = models.length > 0 ? models[0].id : 'llama3.2';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      
      {/* Responsive Header Navbar */}
      <header className="flex flex-col md:flex-row md:h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 md:py-0 gap-3 md:gap-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover">
            Infernos {view === 'caller' ? 'Caller' : 'Operator'}
          </h1>
          <div className="flex bg-card border border-border/40 rounded-lg p-1 hidden md:flex">
            <button 
              onClick={() => setView('caller')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${view === 'caller' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Caller GUI
            </button>
            <button 
              onClick={() => setView('operator')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${view === 'operator' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Operator Dashboard
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-card border border-border/40 rounded-lg p-1 md:hidden">
            <button 
              onClick={() => setView('caller')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${view === 'caller' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Caller
            </button>
            <button 
              onClick={() => setView('operator')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${view === 'operator' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Operator
            </button>
          </div>
          {view === 'caller' && <WalletBadge />}
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-6 justify-center">
        {view === 'operator' ? (
          <div className="w-full max-w-5xl h-full flex flex-col">
            <Dashboard />
          </div>
        ) : sessionState === 'AUTHORIZED' ? (
          <div className="w-full max-w-5xl h-full flex flex-col">
            <ChatWindow 
              model={activeModel} 
              authData={authData} 
              onSessionError={handleSessionError} 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="bg-card/50 border border-border/40 rounded-xl p-8 max-w-md w-full text-center shadow-lg">
              <h3 className="text-2xl font-semibold text-primary mb-2">Phase C4 & C5: Real Inference</h3>
              <p className="text-muted-foreground mb-8">
                Initialize an L402 session to lock in a budget and open the chat window.
              </p>
              
              <button 
                onClick={handleCreateSession} 
                disabled={sessionState === 'CREATING_SESSION'}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {sessionState === 'CREATING_SESSION' ? 'Creating Session...' : 'Initialize L402 Session'}
              </button>

              {error && <p className="text-error mt-4 text-sm bg-error/10 p-2 rounded">{error}</p>}
            </div>
          </div>
        )}
      </main>

      {sessionState === 'PAYMENT_REQUIRED' && challenge && view === 'caller' && (
        <InvoiceModal 
          invoice={challenge.invoice} 
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => setSessionState('IDLE')}
        />
      )}
    </div>
  )
}

export default App
