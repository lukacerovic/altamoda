// Entry point for hosts that start the app as a plain Node process
// (cPanel "Setup Node.js App" / Phusion Passenger). Vercel ignores this file.
// Requires a prior `npm run build`; env comes from .env / .env.production.
// CommonJS on purpose: Passenger's Node loader expects a require()-able startup file.
/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http')
const next = require('next')

const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev: false, dir: __dirname })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`> altamoda ready on port ${port}`)
  })
})
