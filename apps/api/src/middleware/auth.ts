import { Context, Next } from 'hono'
import { jwtVerify } from 'jose'
import type { Env, Variables } from '../index'

export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export const authMiddleware = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401)
  }

  const token = authHeader.substring(7)
  
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    
    // Store user info in request context
    c.set('userId', payload.userId as string)
    c.set('userEmail', payload.email as string)
    
    await next()
  } catch (error) {
    console.error('JWT verification error:', error)
    return c.json({ error: 'Invalid token' }, 401)
  }
}

export const optionalAuthMiddleware = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    try {
      const secret = new TextEncoder().encode(c.env.JWT_SECRET)
      const { payload } = await jwtVerify(token, secret)
      
      c.set('userId', payload.userId as string)
      c.set('userEmail', payload.email as string)
    } catch (error) {
      // Token is invalid but we don't throw error for optional auth
      console.warn('Invalid token in optional auth:', error)
    }
  }
  
  await next()
}