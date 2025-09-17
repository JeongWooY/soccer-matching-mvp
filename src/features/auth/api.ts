import { supabase } from '@/lib/supabase'

function normEmail(email: string) {
  return email.trim().toLowerCase()
}

function mapAuthError(e: any) {
  const msg = (e?.message || '').toLowerCase()
  if (msg.includes('email not confirmed')) return '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.'
  if (msg.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (msg.includes('user already registered')) return '이미 가입된 이메일입니다. 로그인하거나 비밀번호를 재설정하세요.'
  if (msg.includes('password')) return '비밀번호 정책을 확인해주세요.'
  return e?.message || '알 수 없는 인증 오류가 발생했습니다.'
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: normEmail(email),
    password,
    // 개발 중엔 이메일 확인을 끄거나, 켜둔다면 redirect 설정
    // options: { emailRedirectTo: `${window.location.origin}/` }
  })
  if (error) throw new Error(mapAuthError(error))
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normEmail(email),
    password,
  })
  if (error) throw new Error(mapAuthError(error))
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(mapAuthError(error))
}

export async function requestResetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(normEmail(email), {
    redirectTo: `${window.location.origin}/login`
  })
  if (error) throw new Error(mapAuthError(error))
  return data
}
