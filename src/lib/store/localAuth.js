const SESSION_KEY = 'nplfz.local.session.v1'
const LEGACY_ACCOUNTS_KEY = 'nplfz.local.accounts.v1'

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getSession() {
  try {
    localStorage.removeItem(LEGACY_ACCOUNTS_KEY)
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
  return session?.role === 'admin' && session?.userId === 'admin' ? session : null
  } catch {
    return null
  }
}

export async function signIn({ id, email, password }) {
  const submittedId = String(id ?? email ?? '').trim()
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: submittedId, password }),
  })
  if (!response.ok) {
    throw new Error(response.status === 503 ? 'Admin login is not configured on the server.' : 'Incorrect email or password.')
  }

  return writeSession({
    userId: 'admin',
    id: submittedId,
    email: submittedId,
    displayName: 'Administrator',
    role: 'admin',
    createdAt: new Date().toISOString(),
    mode: 'local',
  })
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
}

