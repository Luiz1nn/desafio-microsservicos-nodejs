import { fastify } from 'fastify'
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { fastifyCors } from '@fastify/cors'
import {z} from "zod";
import { randomUUID } from 'node:crypto'
import {db} from "../db/client.ts";
import {schema} from "../db/schema/index.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app.get('/health', () => {
  return 'OK'
})

app.post('/orders', {
  schema: {
    body: z.object({
      amount: z.number(),
    })
  }
}, async (request, reply) => {
  const { amount } = request.body

  console.log('Creating an order with amount', amount)

  const orderId = randomUUID()

  await db.insert(schema.orders).values({
    id: orderId,
    customerId: '0b41961f-c250-47ed-abef-2a81bfdd7708',
    amount: 30,
  });

  return reply.status(201).send()
})

app
	.listen({ host: '0.0.0.0', port: 3333 })
	.then(() => console.log('[Orders] HTTP Server is running!'))
