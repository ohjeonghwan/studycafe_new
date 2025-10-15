import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트를 지연 초기화하는 함수
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // 환경 변수가 없거나 placeholder인 경우 null 반환
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://placeholder.supabase.co' ||
      supabaseAnonKey === 'placeholder-key') {
    return null
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

// 지연 초기화된 클라이언트
let _supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export const supabase = {
  get client() {
    if (!_supabaseClient) {
      _supabaseClient = createSupabaseClient()
    }
    return _supabaseClient
  },
  
  // 메서드들을 프록시로 처리
  get from() {
    const client = this.client
    if (!client) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }
    return client.from.bind(client)
  },
  
  get auth() {
    const client = this.client
    if (!client) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }
    return client.auth
  },
  
  get storage() {
    const client = this.client
    if (!client) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }
    return client.storage
  }
}








