import {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as supabaseService from '../services/supabaseService';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  TOKEN: '@auth_token',
  USER: '@auth_user',
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log("CONTEXT FUNCTION", email, password)

    try {

      const result = await supabaseService.signIn(email, password);
      console.log(result)
  
      if (result.success && result.data) {
        const {access_token: accessToken, user: supabaseUser} = result.data;
  
        setToken(accessToken);
        setUser(supabaseUser);
  
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken),
          AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(supabaseUser)),
        ]);
  
        return {success: true, error: null};
      }
  
      return {success: false, error: result.error};

    } catch (e) {
      console.log(e)
      return {success: false, error: "Error inesperado"};
    }
  };

  const register = async (email, password, username, fullName) => {
    const result = await supabaseService.signUp(email, password, username, fullName);

    if (result.success) {
      return {success: true, error: null};
    }

    return {success: false, error: result.error};
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }

    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;