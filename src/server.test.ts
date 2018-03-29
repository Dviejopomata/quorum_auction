import server = require("./server")
import supertest = require("supertest")
import test = require("tape")
const setup = () => {
  const app = supertest(server)
  return { app }
}
test("Get message", async t => {
  const { app } = setup()
  const res = await app.get("/message")
  const { status, body } = res
  t.equal(status, 200)
  t.true(body)
  t.true(body.msg)
  t.end()
})

test("Set message", async t => {
  const { app } = setup()
  const msg = "Hello world"
  const { status } = await app.post("/message").send({ msg })
  t.equal(status, 204)
  //   t.deepEqual(body, { msg: "hello world" })
  t.end()
})
