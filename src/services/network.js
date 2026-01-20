const delayRange = { min: 1, max: 5 }

const clone = (value) => JSON.parse(JSON.stringify(value))

const wait = (payloadFactory) => Promise.resolve(clone(payloadFactory()))

const isNetworkError = (error) => {
  if (!error) return false
  const message = typeof error.message === 'string' ? error.message : ''
  if (
    error instanceof TypeError ||
    /Failed to fetch|NetworkError|ECONN|refused|fetch failed|Load failed/i.test(message)
  ) {
    return true
  }
  const httpMatch = /HTTP\s(\d{3})/.exec(message)
  if (httpMatch) {
    const status = Number(httpMatch[1])
    return Number.isFinite(status) && (status === 404 || status >= 500)
  }
  return false
}

export { wait, clone, isNetworkError }
