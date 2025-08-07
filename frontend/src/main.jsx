import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

 
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import {loadStripe} from "@stripe/stripe-js";
import {Elements} from "@stripe/react-stripe-js";
import {NotificationProvider} from "./context/NotificationContext.jsx"; 

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <MantineProvider>
                <AuthProvider>
                    <NotificationProvider>
                    <Elements stripe={stripePromise}> { }
                        <App />
                    </Elements>
                        </NotificationProvider>
                </AuthProvider>
            </MantineProvider>
        </BrowserRouter>
    </React.StrictMode>
);