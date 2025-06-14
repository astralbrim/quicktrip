import { Hono } from 'hono'
import type { Env, Variables } from '../index'
import { authMiddleware } from '../middleware/auth'
import { createPrismaClient } from '../utils/db'

const userRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()

// Get current user profile
userRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  try {
    const prisma = createPrismaClient(c.env.DB)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get user's search history
userRoutes.get('/search-history', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  try {
    const prisma = createPrismaClient(c.env.DB)
    
    const searchHistory = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5, // Last 5 searches
    })
    
    return c.json({ searchHistory })
  } catch (error) {
    console.error('Get search history error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Save search to history
userRoutes.post('/search-history', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { timeMinutes, transport, latitude, longitude, address, filters } = await c.req.json()
  
  try {
    const prisma = createPrismaClient(c.env.DB)
    
    const searchHistory = await prisma.searchHistory.create({
      data: {
        userId,
        timeMinutes,
        transport,
        latitude,
        longitude,
        address,
        filters: filters ? JSON.stringify(filters) : null,
      }
    })
    
    return c.json({ searchHistory })
  } catch (error) {
    console.error('Save search history error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { userRoutes }