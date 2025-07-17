import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandlers } from './utils/error-handler'

// Set up global error handlers
setupGlobalErrorHandlers()

createRoot(document.getElementById("root")!).render(<App />);
