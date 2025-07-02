import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { authApi, type LoginCredentials } from '../../lib/authApi';
import { type User } from '../../store/authStore';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login: loginStore, setError } = useAuthStore();
  const [form, setForm] = useState<LoginCredentials>({ 
    email: '', 
    password: '' 
  });

  // Login mutation
  const { mutateAsync, isPending, isError, error } = useMutation<
    User,
    Error,
    LoginCredentials
  >({
    mutationFn: authApi.login,
    onSuccess: (userData) => {
      loginStore(userData);
      // Update the auth query cache
      queryClient.setQueryData(['auth', 'me'], userData);
      setError(null);
    },
    onError: (error) => {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutateAsync(form);
    } catch (error) {
      // Error is handled in onError callback
      console.error('Login error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ email: '', password: '' });
  };

  return {
    form,
    setForm,
    handleSubmit,
    handleChange,
    resetForm,
    isLoading: isPending,
    isError,
    error,
  };
}; 