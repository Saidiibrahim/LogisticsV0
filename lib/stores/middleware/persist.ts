"use client"

import { createJSONStorage } from "zustand/middleware"

export interface CookieStorageOptions {
  /** Cookie max age in seconds. Defaults to 7 days. */
  maxAge?: number
  /** Cookie path scope. Defaults to `/`. */
  path?: string
  /** Cookie SameSite attribute. Defaults to `lax`. */
  sameSite?: "lax" | "strict" | "none"
  /** Whether to mark the cookie as secure. Defaults to `true` in production builds. */
  secure?: boolean
}

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7

const readCookie = (name: string) => {
  if (typeof document === "undefined") {
    return null
  }

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))

  if (!match) {
    return null
  }

  try {
    const value = match.split("=")[1]
    return value ? decodeURIComponent(value) : null
  } catch (error) {
    console.warn(`[zustand] Failed to decode cookie value for ${name}`, error)
    return null
  }
}

const writeCookie = (
  name: string,
  value: string,
  {
    maxAge = DEFAULT_MAX_AGE,
    path = "/",
    sameSite = "lax",
    secure,
  }: CookieStorageOptions = {}
) => {
  if (typeof document === "undefined") {
    return
  }

  const isSecure = secure ?? process.env.NODE_ENV === "production"
  const encoded = encodeURIComponent(value)

  const cookie = [
    `${name}=${encoded}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    `SameSite=${sameSite}`,
    isSecure ? "Secure" : undefined,
  ]
    .filter(Boolean)
    .join("; ")

  /* biome-ignore lint/suspicious/noDocumentCookie: fallback for environments without Cookie Store API */
  document.cookie = cookie
}

const removeCookie = (name: string) => {
  if (typeof document === "undefined") {
    return
  }

  /* biome-ignore lint/suspicious/noDocumentCookie: fallback for environments without Cookie Store API */
  document.cookie = `${name}=; Path=/; Max-Age=0`
}

/**
 * Creates a raw cookie storage implementation (for testing).
 */
export const createRawCookieStorage = (options: CookieStorageOptions = {}) => ({
  getItem: (name: string) => {
    const value = readCookie(name)
    return value ?? null
  },
  setItem: (name: string, value: string) => {
    try {
      writeCookie(name, value, options)
    } catch (error) {
      console.warn(`[zustand] Failed to write cookie for ${name}`, error)
    }
  },
  removeItem: (name: string) => {
    removeCookie(name)
  },
})

/**
 * Creates a Zustand-compatible JSON storage that persists state via cookies instead of localStorage.
 */
export const createCookieStorage = (options: CookieStorageOptions = {}) => {
  return createJSONStorage(() => createRawCookieStorage(options))
}

/**
 * In-memory fallback storage used when cookies are unavailable (SSR).
 */
export const createNoopStorage = () => ({
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
})
