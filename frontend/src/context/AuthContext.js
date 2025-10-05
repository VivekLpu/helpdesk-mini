import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  console.log('AuthContext action:', action.type, action.payload);
  
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      console.log('Token stored in localStorage:', action.payload.token);
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        user: action.payload.user,
        loading: false
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'AUTH_ERROR':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    token: localStorage.getItem('token'),
    user: null,
    loading: true,
    error: null
  });

  console.log('AuthContext state:', state);

  // Set up axios defaults whenever token changes
  useEffect(() => {
    console.log('Setting up axios defaults with token:', state.token);
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          console.log('Loading user with token:', state.token);
          const res = await api.get('/api/auth/me');
          console.log('User data received:', res.data);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              token: state.token,
              user: res.data.user
            }
          });
        } catch (error) {
          console.error('Error loading user:', error);
          dispatch({ type: 'AUTH_ERROR', payload: error.response?.data?.error?.message });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Making login request with:', email, password);
      const res = await api.post('/api/auth/login', { email, password });
      console.log('Login response:', res.data);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'AUTH_ERROR', payload: error.response?.data?.error?.message });
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/api/auth/register', userData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        token: state.token,
        user: userData
      }
    });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};