import app = require("src/server")
const port = process.env.PORT || 9500
const instance = app.listen(port, () => {
  const { address } = instance.address()
  console.log(`Listening on ${address}${port}`)
})
