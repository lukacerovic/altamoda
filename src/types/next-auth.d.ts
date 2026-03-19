import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'b2c' | 'b2b' | 'admin'
      status: 'active' | 'pending' | 'suspended'
      image?: string | null
    }
  }

  interface User {
    role: 'b2c' | 'b2b' | 'admin'
    status: 'active' | 'pending' | 'suspended'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    status: string
  }
}
