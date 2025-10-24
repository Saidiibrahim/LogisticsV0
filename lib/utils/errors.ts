export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return "An unexpected error occurred"
  }
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("auth") ||
      message.includes("unauthorized") ||
      message.includes("not authenticated") ||
      message.includes("forbidden")
    )
  }

  if (typeof error === "string") {
    const message = error.toLowerCase()
    return (
      message.includes("auth") ||
      message.includes("unauthorized") ||
      message.includes("not authenticated") ||
      message.includes("forbidden")
    )
  }

  return false
}
