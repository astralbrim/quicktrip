export interface User {
  id: string
  email: string
  name?: string
  provider?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserRequest {
  email: string
  password?: string
  name?: string
  provider?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}