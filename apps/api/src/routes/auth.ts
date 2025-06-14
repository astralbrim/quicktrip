import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../index'
import { createPrismaClient } from '../utils/db'
import { hashPassword, verifyPassword } from '../utils/password'
import { generateJWT } from '../utils/jwt'

const authRoutes = new Hono<{ Bindings: Env }>()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Register endpoint
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json')
  
  try {
    const prisma = createPrismaClient(c.env.DB)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400)
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: 'email',
      },
    })
    
    // Generate JWT
    const token = await generateJWT(
      { userId: user.id, email: user.email },
      c.env.JWT_SECRET
    )
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user
    
    return c.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error('Register error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Login endpoint
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  
  try {
    const prisma = createPrismaClient(c.env.DB)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user || !user.password) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    // Generate JWT
    const token = await generateJWT(
      { userId: user.id, email: user.email },
      c.env.JWT_SECRET
    )
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user
    
    return c.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { authRoutes }