<template>
  <div class="premium-auth">
    <!-- Not Logged In State -->
    <div v-if="!user" class="auth-container">
      <div class="auth-card">
        <div class="auth-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <h3>{{ $t('premium.title') }}</h3>
        <p class="auth-description">{{ $t('premium.description') }}</p>

        <div class="auth-features">
          <div class="feature-item">
            <span class="feature-check">✓</span>
            <span>{{ $t('premium.features.exclusive') }}</span>
          </div>
          <div class="feature-item">
            <span class="feature-check">✓</span>
            <span>{{ $t('premium.features.priority') }}</span>
          </div>
          <div class="feature-item">
            <span class="feature-check">✓</span>
            <span>{{ $t('premium.features.noAds') }}</span>
          </div>
          <div class="feature-item">
            <span class="feature-check">✓</span>
            <span>{{ $t('premium.features.support') }}</span>
          </div>
        </div>

        <button
          @click="signInWithGoogle"
          class="google-btn"
          :disabled="isLoading"
        >
          <svg v-if="!isLoading" class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span v-if="isLoading" class="loading-spinner"></span>
          <span>{{ isLoading ? $t('premium.signingIn') : $t('premium.signInWithGoogle') }}</span>
        </button>

        <p class="auth-note">{{ $t('premium.authNote') }}</p>
      </div>
    </div>

    <!-- Logged In State -->
    <div v-else class="premium-content">
      <div class="user-header">
        <div class="user-info">
          <img
            v-if="user.photoURL"
            :src="user.photoURL"
            :alt="user.displayName || 'User'"
            class="user-avatar"
          />
          <div v-else class="user-avatar-placeholder">
            {{ getUserInitials }}
          </div>
          <div class="user-details">
            <span class="user-name">{{ user.displayName || $t('premium.user') }}</span>
            <span class="user-email">{{ user.email }}</span>
          </div>
        </div>
        <button @click="signOut" class="sign-out-btn">
          {{ $t('premium.signOut') }}
        </button>
      </div>

      <div class="premium-tools-placeholder">
        <div class="coming-soon-card">
          <div class="coming-soon-icon">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3>{{ $t('premium.comingSoon') }}</h3>
          <p>{{ $t('premium.comingSoonDescription') }}</p>
          <div class="premium-badge">
            <span>PREMIUM</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <Transition name="fade">
      <div v-if="errorMessage" class="error-toast">
        <span class="error-icon">!</span>
        <span>{{ errorMessage }}</span>
        <button @click="errorMessage = ''" class="error-close">×</button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth'

// Firebase configuration - Replace with your own Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
}

// Initialize Firebase only on client side
let app: FirebaseApp | null = null
let auth: ReturnType<typeof getAuth> | null = null

const user = ref<User | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const isClient = typeof window !== 'undefined'

const getUserInitials = computed(() => {
  if (user.value?.displayName) {
    return user.value.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (user.value?.email) {
    return user.value.email[0].toUpperCase()
  }
  return 'U'
})

const initFirebase = () => {
  if (!isClient) return

  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    // Only initialize if config is present
    if (firebaseConfig.apiKey && firebaseConfig.authDomain) {
      app = initializeApp(firebaseConfig)
    }
  } else {
    app = getApps()[0]
  }

  if (app) {
    auth = getAuth(app)

    // Listen for auth state changes
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
    })
  }
}

const signInWithGoogle = async () => {
  if (!isClient || !auth) {
    errorMessage.value = 'Firebase not configured. Please contact the administrator.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const provider = new GoogleAuthProvider()
    provider.addScope('profile')
    provider.addScope('email')

    await signInWithPopup(auth, provider)
  } catch (error: unknown) {
    console.error('Sign in error:', error)
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string; message: string }
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show error
      } else if (firebaseError.code === 'auth/cancelled-popup-request') {
        // Multiple popup requests, ignore
      } else {
        errorMessage.value = firebaseError.message || 'An error occurred during sign in'
      }
    } else {
      errorMessage.value = 'An unexpected error occurred'
    }
  } finally {
    isLoading.value = false
  }
}

const signOut = async () => {
  if (!auth) return

  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Sign out error:', error)
  }
}

onMounted(() => {
  initFirebase()
})
</script>

<style scoped>
.premium-auth {
  padding: 1rem;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.auth-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.auth-icon {
  color: var(--primary-color);
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.auth-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.auth-features {
  text-align: left;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(162, 134, 128, 0.05);
  border-radius: 0.75rem;
}

[data-theme="dark"] .auth-features {
  background: rgba(242, 226, 142, 0.05);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--text-color);
}

.feature-check {
  color: #34A853;
  font-weight: bold;
  font-size: 1rem;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.google-btn:hover:not(:disabled) {
  background: rgba(162, 134, 128, 0.1);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

[data-theme="dark"] .google-btn:hover:not(:disabled) {
  background: rgba(242, 226, 142, 0.1);
}

.google-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-note {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Logged In State */
.premium-content {
  max-width: 800px;
  margin: 0 auto;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  margin-bottom: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-color);
}

.user-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--gradient-1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color);
}

.user-email {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.sign-out-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-color);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sign-out-btn:hover {
  background: rgba(234, 67, 53, 0.1);
  border-color: #EA4335;
  color: #EA4335;
}

/* Coming Soon Card */
.premium-tools-placeholder {
  display: flex;
  justify-content: center;
}

.coming-soon-card {
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.coming-soon-icon {
  color: var(--primary-color);
  margin-bottom: 1rem;
  opacity: 0.8;
}

.coming-soon-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.coming-soon-card p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.premium-badge {
  display: inline-block;
  padding: 0.35rem 1rem;
  background: var(--gradient-2);
  color: #0C0C10;
  border-radius: 2rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

/* Error Toast */
.error-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #FEE2E2;
  border: 1px solid #EF4444;
  border-radius: 0.5rem;
  color: #991B1B;
  font-size: 0.875rem;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

[data-theme="dark"] .error-toast {
  background: #450A0A;
  border-color: #DC2626;
  color: #FCA5A5;
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #EF4444;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.75rem;
}

.error-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.error-close:hover {
  opacity: 1;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .auth-card {
    padding: 1.5rem;
    margin: 0 1rem;
  }

  .auth-card h3 {
    font-size: 1.25rem;
  }

  .user-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .user-info {
    flex-direction: column;
  }

  .sign-out-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .premium-auth {
    padding: 0.5rem;
  }

  .auth-card {
    padding: 1.25rem;
  }

  .google-btn {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .coming-soon-card {
    padding: 2rem 1rem;
  }
}
</style>
