 

import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import * as api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
 
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        try {
            if (token) {
                const decodedUser = jwtDecode(token);
                if (decodedUser.exp * 1000 > Date.now()) {
                    setUser(decodedUser);
                } else {
                    localStorage.removeItem('token');
                }
            }
        } catch (error) {
            console.error("Invalid token found in localStorage, removing it.", error);
            localStorage.removeItem('token');
        } finally {
 
            setIsInitializing(false);
        }
    }, []);

    const loginUser = async (credentials) => {
        const response = await api.login(credentials);
        const { token } = response.data;
        localStorage.setItem('token', token);
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        return decodedUser;
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

 
    const value = { user, isInitializing, loginUser, logoutUser };

 
    return (
        <AuthContext.Provider value={value}>
            {!isInitializing && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};