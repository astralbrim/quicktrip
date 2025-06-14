import { SignJWT } from 'jose'

export const generateJWT = async (payload: { userId: string; email: string }, secret: string): Promise<string> => {
  const secretKey = new TextEncoder().encode(secret)
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(secretKey)
}