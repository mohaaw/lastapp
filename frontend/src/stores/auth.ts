import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { LocalStorage } from 'quasar';

interface User {
  id: number;
  username: string;
  email: string;
  // Add other user fields as needed
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: LocalStorage.getItem('jwt') || null,
    isAuthenticated: false,
  }),

  getters: {
    // Double check if the user is authenticated
    isLoggedIn: (state) => state.isAuthenticated && !!state.token,
  },

  actions: {
    async login(credentials: { identifier: string; password: string }) {
      try {
        const response = await api.post('/auth/local', credentials);
        this.token = response.data.jwt;
        this.user = response.data.user;
        this.isAuthenticated = true;
        LocalStorage.set('jwt', this.token);
        // Optionally, redirect to dashboard or previous page
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        this.logout(); // Ensure state is clean on failed login
        throw error; // Re-throw to allow component to handle error
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      LocalStorage.remove('jwt');
      // Optionally, redirect to login page
    },

    // Check authentication status on app load
    checkAuth() {
      if (this.token) {
        // Optionally, validate token with backend or just assume valid for now
        // For a more robust solution, you'd hit a /users/me endpoint
        this.isAuthenticated = true;
      } else {
        this.isAuthenticated = false;
      }
    },
  },
});
