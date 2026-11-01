import 'dotenv/config'
import { createApp } from './app.js'
import { validateEmailTransport } from './auth/email.js'

validateEmailTransport()

const app = createApp()
const port = Number(process.env.PORT ?? 4000)

app.listen(port, () => {
  console.log(`@spendio/api listening on port ${port}`)
})
