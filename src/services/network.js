const delayRange = { min: 1, max: 5 }

const clone = (value) => JSON.parse(JSON.stringify(value))

const wait = (payloadFactory) => Promise.resolve(clone(payloadFactory()))

export { wait, clone }
