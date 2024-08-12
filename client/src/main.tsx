import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'rsuite/dist/rsuite.min.css'
import { CustomProvider } from 'rsuite';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <CustomProvider theme="dark">
    <App />
  </CustomProvider>
)
