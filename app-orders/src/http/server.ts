import { fastify } from 'fastify'
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { fastifyCors } from '@fastify/cors'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app
	.listen({ host: '0.0.0.0', port: 3333 })
	.then(() => console.log('[Orders] HTTP Server is running!'))
