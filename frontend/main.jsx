import {AuthProvider} from './context/AuthContext.jsx';
import  React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { EventProvider } from './context/EventContext';
import {GoogleOAuthProvider} from '@react-oauth/google';
import { PlatformSettingsProvider } from './context/PlatformSettingsContext.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <FavoritesProvider>
        <EventProvider>
          <PlatformSettingsProvider>
            <GoogleOAuthProvider clientId='599126937366-3ahr3cnmf73mpsci0rdqvb3bmmg6hqb2.apps.googleusercontent.com'>
              <App />
            </GoogleOAuthProvider>
          </PlatformSettingsProvider>
        </EventProvider>     
      </FavoritesProvider>     
    </AuthProvider>
  </BrowserRouter>,
)
