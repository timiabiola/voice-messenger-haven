/**
 * Client-side rate limiting utility
 * Prevents brute force attacks by limiting authentication attempts
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  
  // Configuration
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly blockDurationMs = 30 * 60 * 1000; // 30 minutes
  private readonly cleanupIntervalMs = 60 * 60 * 1000; // 1 hour
  
  constructor() {
    // Periodically clean up old entries
    setInterval(() => this.cleanup(), this.cleanupIntervalMs);
    
    // Load from localStorage if available
    this.loadFromStorage();
  }
  
  private getKey(identifier: string, action: string): string {
    return `${action}:${identifier}`;
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('rateLimitData');
      if (stored) {
        const data = JSON.parse(stored);
        this.store = new Map(Object.entries(data));
      }
    } catch (error) {
      // Ignore errors, start fresh
    }
  }
  
  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.store);
      localStorage.setItem('rateLimitData', JSON.stringify(data));
    } catch (error) {
      // Ignore storage errors
    }
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      // Remove entries older than the window + block duration
      if (now - entry.lastAttempt > this.windowMs + this.blockDurationMs) {
        this.store.delete(key);
      }
    }
    this.saveToStorage();
  }
  
  public checkLimit(identifier: string, action: string = 'auth'): {
    allowed: boolean;
    remainingAttempts?: number;
    resetTime?: Date;
    blockedUntil?: Date;
  } {
    const key = this.getKey(identifier, action);
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry) {
      // First attempt
      this.store.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      this.saveToStorage();
      
      return {
        allowed: true,
        remainingAttempts: this.maxAttempts - 1
      };
    }
    
    // Check if blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil)
      };
    }
    
    // Check if window has expired
    if (now - entry.firstAttempt > this.windowMs) {
      // Reset the window
      this.store.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      this.saveToStorage();
      
      return {
        allowed: true,
        remainingAttempts: this.maxAttempts - 1
      };
    }
    
    // Within window
    entry.attempts++;
    entry.lastAttempt = now;
    
    if (entry.attempts > this.maxAttempts) {
      // Block the user
      entry.blockedUntil = now + this.blockDurationMs;
      this.store.set(key, entry);
      this.saveToStorage();
      
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil)
      };
    }
    
    this.store.set(key, entry);
    this.saveToStorage();
    
    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - entry.attempts,
      resetTime: new Date(entry.firstAttempt + this.windowMs)
    };
  }
  
  public reset(identifier: string, action: string = 'auth'): void {
    const key = this.getKey(identifier, action);
    this.store.delete(key);
    this.saveToStorage();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();