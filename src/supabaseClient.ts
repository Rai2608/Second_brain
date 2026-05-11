import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables if defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ==========================================
// Simulated Supabase Auth Client for local testing
// ==========================================
class SimulatedSupabaseAuth {
  private usersKey = 'synapse_corporate_users';
  private sessionKey = 'synapse_active_session';

  private getUsers(): any[] {
    const raw = localStorage.getItem(this.usersKey);
    if (!raw) {
      // Seed default corporate user
      const defaultUsers = [
        { id: 'usr_paramita', email: 'paramita@synapse.corp', name: 'Paramita Das', domain: 'synapse.corp' }
      ];
      localStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(raw);
  }

  private saveUsers(users: any[]) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  // Restrictions checking
  private isAllowedDomain(email: string): boolean {
    const domain = email.split('@')[1];
    if (!domain) return false;
    
    // Approved academic and corporate domains
    const allowed = ['synapse.corp', 'synapse.edu', 'synapse.org', 'mit.edu', 'stanford.edu', 'company.com'];
    return allowed.includes(domain.toLowerCase());
  }

  async signUp({ email, password, options }: any) {
    await new Promise(resolve => setTimeout(resolve, 800)); // natural API latency
    
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    
    if (!this.isAllowedDomain(cleanEmail)) {
      return { 
        data: { user: null }, 
        error: { 
          message: `Official validation failed! The domain @${cleanEmail.split('@')[1]} is not in the authorized corporate/institute list. Please use @synapse.corp, @synapse.edu, or @mit.edu.` 
        } 
      };
    }

    const exists = users.find(u => u.email === cleanEmail);
    if (exists) {
      return { data: { user: null }, error: { message: 'This official email is already registered.' } };
    }

    const name = options?.data?.name || email.split('@')[0];
    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email: cleanEmail,
      name,
      domain: cleanEmail.split('@')[1]
    };

    users.push(newUser);
    this.saveUsers(users);

    return { data: { user: newUser }, error: null };
  }

  async signInWithPassword({ email, password }: any) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    
    if (!this.isAllowedDomain(cleanEmail)) {
      return { 
        data: { user: null, session: null }, 
        error: { 
          message: `Corporate verification failed! Domain @${cleanEmail.split('@')[1]} is unauthorized.` 
        } 
      };
    }

    let user = users.find(u => u.email === cleanEmail);
    
    // Auto-create user if matching domain (for ease of quick-testing standard emails)
    if (!user) {
      user = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        email: cleanEmail,
        name: cleanEmail.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        domain: cleanEmail.split('@')[1]
      };
      users.push(user);
      this.saveUsers(users);
    }

    const session = {
      user,
      access_token: 'synapse_jwt_token_' + Math.random().toString(36).substr(2, 9),
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    return { data: { user, session }, error: null };
  }

  async signOut() {
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.removeItem(this.sessionKey);
    return { error: null };
  }

  async getSession() {
    const raw = localStorage.getItem(this.sessionKey);
    if (!raw) return { data: { session: null }, error: null };
    return { data: { session: JSON.parse(raw) }, error: null };
  }

  onAuthStateChange(callback: any) {
    // Standard event subscription interface helper
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
}

// Check if actual credentials are ready
export const isMockAuth = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL';

export const supabase = isMockAuth
  ? ({ auth: new SimulatedSupabaseAuth() } as any)
  : createClient(supabaseUrl, supabaseAnonKey);
