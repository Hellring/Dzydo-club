# Frontend Development — Phase 0: Инициализация

**Статус:** Ready to start  
**Дата:** 9 февраля 2026  
**Этап:** Phase 0 (Инициализация и базовая структура)  

---

## Обзор

Эта фаза подготавливает проект React+TypeScript к разработке функциональности. Цель — установить все необходимые инструменты, конфигурации и базовые компоненты, которые будут использоваться в остальных фазах.

---

## Задачи (по порядку)

### 1. ✅ Базовая структура React + Vite

**Что:** Создать или инициализировать React проект в `frontend/` папке

**Действия:**
```bash
cd frontend

# Если проект уже существует, пропустить эту часть
# Если нет, инициализировать:
npm create vite@latest . -- --template react-ts
# или
npm create react-app . --template typescript
```

**Проверка:**
```bash
npm run dev
# Должна открыться страница на http://localhost:5173 (Vite) или http://localhost:3000
```

**Исход:** 
- [ ] `frontend/src/main.tsx` существует
- [ ] `frontend/src/App.tsx` работает
- [ ] `npm run dev` запускается без ошибок

---

### 2. Установка зависимостей (NPM)

**Что:** Установить требуемые библиотеки

**Действия:**
```bash
cd frontend
npm install

# Основные зависимости:
npm install react-router-dom axios sass

# Dev зависимости (если нужны):
npm install --save-dev @types/react @types/react-dom typescript
```

**Проверка:**
```bash
npm list react-router-dom axios sass
# Должны показать установленные версии
```

**Исход:**
- [ ] `package.json` содержит указанные зависимости
- [ ] `package-lock.json` обновлён
- [ ] `npm install` запускается без ошибок

---

### 3. TypeScript Configuration

**Что:** Настроить `tsconfig.json` для strict mode

**Файл:** `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Ключевые настройки:**
- `"strict": true` — строгая типизация
- `"baseUrl"` + `"paths"` — пути импорта (@/components вместо ../../components)
- `"jsx": "react-jsx"` — React 17+ JSX transform

**Проверка:**
```bash
npx tsc --noEmit
# Не должно быть ошибок типов
```

**Исход:**
- [ ] `tsconfig.json` настроен с `strict: true`
- [ ] Paths alias работают (@/components и т.д.)
- [ ] `npx tsc --noEmit` проходит без ошибок

---

### 4. Структура папок

**Что:** Создать основную структуру папок

**Действия:**
```bash
cd frontend/src

# Создать папки
mkdir -p components/common
mkdir -p components/layout
mkdir -p components/auth
mkdir -p context
mkdir -p hooks
mkdir -p types
mkdir -p services
mkdir -p utils
mkdir -p styles
mkdir -p pages

# Создать базовые файлы
touch styles/variables.scss
touch styles/global.scss
touch styles/index.scss
```

**Исход:**
- [ ] Структура папок создана
- [ ] Все папки содержат файлы (или хотя бы .gitkeep)

---

### 5. Vite Configuration

**Что:** Настроить `vite.config.ts` для proxy и aliases

**Файл:** `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

**Что это делает:**
- `@/components` → `src/components`
- `/api/users` → `http://localhost:8081/users` (proxy)

**Проверка:**
```bash
npm run dev
# Сервер должен стартовать без ошибок
```

**Исход:**
- [ ] `vite.config.ts` содержит proxy конфигурацию
- [ ] Aliases работают
- [ ] Dev server запускается и проксирует запросы

---

### 6. Global Styles + Sass Variables

**Что:** Создать глобальные стили и переменные

**Файл:** `frontend/src/styles/variables.scss`

```scss
// Colors
$primary: #1976d2;
$secondary: #dc3545;
$success: #28a745;
$warning: #ffc107;
$danger: #dc3545;
$light: #f8f9fa;
$dark: #343a40;

// Spacing
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;

// Breakpoints
$breakpoint-mobile: 576px;
$breakpoint-tablet: 768px;
$breakpoint-desktop: 992px;
$breakpoint-large: 1200px;

// Fonts
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
$font-size-base: 14px;
$font-weight-normal: 400;
$font-weight-bold: 700;

// Transitions
$transition-default: all 0.3s ease;
```

**Файл:** `frontend/src/styles/global.scss`

```scss
@import './variables';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  font-family: $font-family-base;
  font-size: $font-size-base;
  color: $dark;
  background-color: $light;
}

a {
  color: $primary;
  text-decoration: none;
  transition: $transition-default;

  &:hover {
    color: darken($primary, 10%);
  }
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  outline: none;
  transition: $transition-default;
}

// Responsive utilities
@media (max-width: $breakpoint-tablet) {
  html {
    font-size: 13px;
  }
}

// Utilities
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $spacing-md;
}
```

**Проверка:**
```bash
npm run dev
# Стили должны применяться
```

**Исход:**
- [ ] `styles/variables.scss` содержит переменные
- [ ] `styles/global.scss` импортирует переменные
- [ ] CSS свойства применяются корректно

---

### 7. Context API + useReducer (Глобальное состояние)

**Что:** Создать базовые contexts для Auth и UI

**Файл:** `frontend/src/context/AuthContext.tsx`

```typescript
import React, { createContext, useReducer, ReactNode, useCallback } from 'react';

export interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
  clubId?: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
  setUser: (user: User) => void;
  refreshAccessToken: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
};

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKENS'; payload: { accessToken: string; refreshToken: string } };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return { ...initialState, isAuthenticated: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TOKENS':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };
    default:
      return state;
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // API call будет добавлен в Фазе 1
      const response = await fetch('http://localhost:8081/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
      });
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setUser = useCallback((user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const refreshAccessToken = useCallback(async () => {
    // Будет реализовано в Фазе 1
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    setError,
    setUser,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Файл:** `frontend/src/context/UIContext.tsx`

```typescript
import React, { createContext, useReducer, ReactNode, useCallback } from 'react';

export interface UIState {
  sidebarOpen: boolean;
  selectedClubId: number | null;
  isDarkMode: boolean;
}

interface UIContextType extends UIState {
  toggleSidebar: () => void;
  setSelectedClub: (clubId: number | null) => void;
  toggleDarkMode: () => void;
}

const initialState: UIState = {
  sidebarOpen: true,
  selectedClubId: null,
  isDarkMode: false,
};

type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SELECTED_CLUB'; payload: number | null }
  | { type: 'TOGGLE_DARK_MODE' };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SELECTED_CLUB':
      return { ...state, selectedClubId: action.payload };
    case 'TOGGLE_DARK_MODE':
      return { ...state, isDarkMode: !state.isDarkMode };
    default:
      return state;
  }
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setSelectedClub = useCallback((clubId: number | null) => {
    dispatch({ type: 'SET_SELECTED_CLUB', payload: clubId });
  }, []);

  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  }, []);

  const value: UIContextType = {
    ...state,
    toggleSidebar,
    setSelectedClub,
    toggleDarkMode,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
```

**Файл:** `frontend/src/hooks/useAuth.ts`

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**Файл:** `frontend/src/hooks/useUI.ts`

```typescript
import { useContext } from 'react';
import { UIContext } from '@/context/UIContext';

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};
```

**Исход:**
- [ ] `AuthContext.tsx` содержит auth logic
- [ ] `UIContext.tsx` содержит UI state
- [ ] Hooks `useAuth` и `useUI` работают

---

### 8. React Router Setup

**Что:** Настроить маршруты с базовой структурой

**Файл:** `frontend/src/App.tsx`

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { UIProvider } from '@/context/UIContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import '@/styles/index.scss';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <UIProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                {/* More routes будут добавлены в следующих фазах */}
              </Route>
            </Route>

            {/* 404 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Routes>
        </UIProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
```

**Файл:** `frontend/src/pages/Login.tsx`

```typescript
import React from 'react';
import styles from './Login.module.scss';

const Login: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1>Dzydo Club — Login</h1>
      <p>Placeholder для Login фазы 1</p>
    </div>
  );
};

export default Login;
```

**Файл:** `frontend/src/pages/Register.tsx`

```typescript
import React from 'react';

const Register: React.FC = () => {
  return <div><h1>Register</h1><p>Placeholder для Register фазы 1</p></div>;
};

export default Register;
```

**Файл:** `frontend/src/pages/Dashboard.tsx`

```typescript
import React from 'react';

const Dashboard: React.FC = () => {
  return <div><h1>Dashboard</h1><p>Placeholder для Dashboard фазы 1</p></div>;
};

export default Dashboard;
```

**Файл:** `frontend/src/pages/NotFound.tsx`

```typescript
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h1>404 Not Found</h1>
      <Link to="/">Go back to Dashboard</Link>
    </div>
  );
};

export default NotFound;
```

**Файл:** `frontend/src/components/auth/ProtectedRoute.tsx`

```typescript
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
```

**Файл:** `frontend/src/components/layout/MainLayout.tsx`

```typescript
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './MainLayout.module.scss';

const MainLayout: React.FC = () => {
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
```

**Файл:** `frontend/src/components/layout/Header.tsx`

```typescript
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.scss';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1>🥋 Dzydo Club</h1>
      </div>
      <div className={styles.right}>
        <span>{user?.email}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
```

**Файл:** `frontend/src/components/layout/Sidebar.tsx`

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './Sidebar.module.scss';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const menuItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Clubs', path: '/clubs' },
    { label: 'Athletes', path: '/athletes' },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link to={item.path}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
```

**Файлы стилей (CSS Modules):**

`frontend/src/components/layout/MainLayout.module.scss`:
```scss
@import '@/styles/variables';

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.body {
  display: flex;
  flex: 1;
}

.content {
  flex: 1;
  padding: $spacing-lg;
  overflow-y: auto;
}
```

`frontend/src/components/layout/Header.module.scss`:
```scss
@import '@/styles/variables';

.header {
  background-color: $primary;
  color: white;
  padding: $spacing-md $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h1 {
    margin: 0;
    font-size: 24px;
  }

  .left {
    flex: 1;
  }

  .right {
    display: flex;
    gap: $spacing-md;
    align-items: center;

    button {
      background-color: $danger;
      color: white;
      padding: $spacing-sm $spacing-md;
      border-radius: 4px;

      &:hover {
        background-color: darken($danger, 10%);
      }
    }
  }
}
```

`frontend/src/components/layout/Sidebar.module.scss`:
```scss
@import '@/styles/variables';

.sidebar {
  width: 250px;
  background-color: $dark;
  padding: $spacing-lg;

  nav ul {
    list-style: none;

    li {
      margin-bottom: $spacing-md;

      a {
        color: white;
        padding: $spacing-sm $spacing-md;
        display: block;
        border-radius: 4px;
        transition: $transition-default;

        &:hover {
          background-color: lighten($dark, 10%);
        }
      }
    }
  }
}
```

`frontend/src/pages/Login.module.scss`:
```scss
@import '@/styles/variables';

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, $primary 0%, darken($primary, 20%) 100%);

  h1 {
    color: white;
  }
}
```

**Проверка:**
```bash
npm run dev
# Должна открыться страница с Header и Sidebar
# Клик по Logout должен редиректить на /login
```

**Исход:**
- [ ] React Router настроен
- [ ] Маршруты работают
- [ ] Layout компоненты отображаются
- [ ] Protection routes работает (редирект на /login для неавторизованных)

---

### 9. Jest + React Testing Library (Setup)

**Что:** Настроить тестовое окружение

**Действия:**
```bash
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest
npx jest --init
```

**Файл:** `frontend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
```

**Файл:** `frontend/src/setupTests.ts`

```typescript
import '@testing-library/jest-dom';
```

**Файл:** `frontend/src/__mocks__/styleMock.js`

```javascript
module.exports = {};
```

**Пример теста:** `frontend/src/App.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page', () => {
  render(<App />);
  const heading = screen.queryByText(/Dzydo Club/i);
  expect(heading).toBeInTheDocument();
});
```

**Проверка:**
```bash
npm test
# Тесты должны запуститься
```

**Исход:**
- [ ] Jest и React Testing Library установлены
- [ ] `jest.config.js` настроен
- [ ] Первый тест проходит

---

### 10. Финальная проверка и документация

**Что:** Убедиться, что всё работает

**Чеклист:**
- [ ] `npm run dev` работает без ошибок
- [ ] `npm run build` создаёт production build
- [ ] `npm test` запускает тесты
- [ ] TypeScript: `npx tsc --noEmit` без ошибок
- [ ] Router работает (переходы между страницами)
- [ ] Context API работает (user доступен в компонентах)
- [ ] Styles применяются (CSS Modules работает)
- [ ] Proxy работает (запросы идут на http://localhost:8081)

**Итоговые скрипты в `package.json`:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

---

## Входные критерии

Перед началом этой фазы убедиться:
- [ ] Backend Stage 1 полностью завершена и работает на http://localhost:8081
- [ ] Backend endpoints задокументированы в (BACKEND_DOCUMENTATION.md)
- [ ] VSCode установлен и готов
- [ ] Node.js 18+ и npm 10+ установлены
- [ ] Git репозиторий инициализирован и готов

---

## Выходные критерии

После завершения этой фазы должны быть:
- [ ] React+TypeScript проект инициализирован
- [ ] Все зависимости установлены
- [ ] TypeScript strict mode включен
- [ ] CSS/Sass структура создана с переменными
- [ ] Context API + useReducer работают
- [ ] React Router настроен с защитой маршрутов
- [ ] Layout компоненты готовы (Header, Sidebar, MainLayout)
- [ ] Jest + React Testing Library настроены
- [ ] Dev server запускается на http://localhost:5173 (или 3000)
- [ ] Proxy для API работает

---

## Время выполнения

**Ожидаемо:** 1-2 дня (4-8 рабочих часов)

---

## Следующие шаги

После завершения Фазы 0:
1. Перейти к **Фазе 1: Аутентификация**
2. Реализовать форму входа (LoginForm.tsx)
3. Реализовать форму принятия приглашения (RegisterForm.tsx)
4. Интегрировать API вызовы для auth endpoints

---

**Версия:** 1.0  
**Дата:** 9 февраля 2026  
**Статус:** Ready to start 🚀
