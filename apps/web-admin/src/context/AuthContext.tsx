'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@ifam-eventos/types';
import { fetchApi } from '../lib/api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  pronoun?: string;
  category?: 'ALUNO' | 'PROFESSOR' | 'TECNICO' | 'EXTERNO';
  campus?: string;
  cpf?: string;
  matriculaOrSiape?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updatePrivacy: (isInvisible: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('ifam_token');
    const savedUser = localStorage.getItem('ifam_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // ignore error
      }
    }
    setLoading(false);

    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('ifam_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('ifam_auth_expired', handleAuthExpired);
    };
  }, []);

  const login = async (email: string, password = 'ifam123456') => {
    try {
      const res = await fetchApi<{ accessToken: string; user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(res.accessToken);
      setUser(res.user);
      localStorage.setItem('ifam_token', res.accessToken);
      localStorage.setItem('ifam_user', JSON.stringify(res.user));
    } catch (err: any) {
      console.error('Erro ao efetuar login:', err);
      throw new Error(err.message || 'E-mail ou senha incorretos.');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await fetchApi<{ accessToken: string; user: UserProfile }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          pronoun: data.pronoun,
          category: data.category || 'ALUNO',
          campus: data.campus || 'Campus Manaus - Centro',
          cpf: data.cpf,
          matriculaOrSiape: data.matriculaOrSiape,
        }),
      });

      setToken(res.accessToken);
      setUser(res.user);
      localStorage.setItem('ifam_token', res.accessToken);
      localStorage.setItem('ifam_user', JSON.stringify(res.user));
    } catch (err: any) {
      console.error('Erro ao cadastrar usuário:', err);
      throw new Error(err.message || 'Erro ao realizar cadastro.');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ifam_token');
    localStorage.removeItem('ifam_user');
  };

  const updatePrivacy = async (isInvisible: boolean) => {
    try {
      const res = await fetchApi<{ user: { id: string; isInvisibleInNetworking: boolean } }>('/auth/privacy', {
        method: 'PATCH',
        body: JSON.stringify({ isInvisibleInNetworking: isInvisible }),
      });

      if (user) {
        const updated = { ...user, isInvisibleInNetworking: res.user.isInvisibleInNetworking };
        setUser(updated);
        localStorage.setItem('ifam_user', JSON.stringify(updated));
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updatePrivacy }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
