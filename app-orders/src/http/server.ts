import '@opentelemetry/auto-instrumentations-node/register'

import { randomUUID } from 'node:crypto'
import { fastifyCors } from '@fastify/cors'
import { trace } from '@opentelemetry/api'
import { fastify } from 'fastify'
import {
	type ZodTypeProvider,
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'
import { z } from 'zod'
import { dispatchOrderCreated } from '../broker/messages/order-created.ts'
import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'
import { tracer } from '../tracer/tracer.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app.get('/health', () => {
	return 'OK'
})

app.post(
	'/orders',
	{
		schema: {
			body: z.object({
				amount: z.number(),
			}),
		},
	},
	async (request, reply) => {
		const { amount } = request.body

		console.log('Creating an order with amount', amount)

		const orderId = randomUUID()

		await db.insert(schema.orders).values({
			id: orderId,
			customerId: '0b41961f-c250-47ed-abef-2a81bfdd7708',
			amount: 30,
		})

		const span = tracer.startSpan('eu acho que aqui ta dando merda')

		span.setAttribute('teste', 'Hello World')

		span.end()

		trace.getActiveSpan()?.setAttribute('order_id', orderId)

		dispatchOrderCreated({
			orderId,
			amount,
			customer: {
				id: '0b41961f-c250-47ed-abef-2a81bfdd7708',
			},
		})

		return reply.status(201).send()
	}
)

app
	.listen({ host: '0.0.0.0', port: 3333 })
	.then(() => console.log('[Orders] HTTP Server is running!'))
