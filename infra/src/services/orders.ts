import * as awsx from "@pulumi/awsx"
import * as pulumi from '@pulumi/pulumi'

import { amqpListener } from "./rabbitmq"
import { ordersDockerImage } from "../images/orders"
import { cluster } from "../cluster"
import { appLoadBalancer } from "../load-balancer"

const ordersTargetGroup = appLoadBalancer.createTargetGroup('orders-target', {
  port: 3333,
  protocol: 'HTTP',
  healthCheck: {
    path: '/health',
    protocol: 'HTTP',
  },
})

export const ordersHttpListener = appLoadBalancer.createListener('orders-listener', {
  port: 3333,
  protocol: 'HTTP',
  targetGroup: ordersTargetGroup,
})

export const ordersService = new awsx.classic.ecs.FargateService("fargate-orders", {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: ordersDockerImage.ref,
      cpu: 256,
      memory: 512,
      portMappings: [ordersHttpListener],
      environment: [
        {
          name: 'BROKER_URL',
          value: pulumi.interpolate`amqp://admin:admin@${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}`
        },
        {
          name: 'DATABASE_URL',
          value: 'postgresql://orders_owner:npg_aKXpI10lxGdH@ep-bold-dew-a4ij7g19.us-east-1.aws.neon.tech/orders?sslmode=require',
        },
        {
          name: "OTEL_TRACES_EXPORTER",
          value: "otlp"
        },
        {
          name: "OTEL_EXPORTER_OTLP_ENDPOINT",
          value: "https://otlp-gateway-prod-sa-east-1.grafana.net/otlp"
        },
        {
          name: "OTEL_EXPORTER_OTLP_HEADERS",
          value: "Authorization=Basic MTI4NjM3ODpnbGNfZXlKdklqb2lNVFExTlRnNE5TSXNJbTRpT2lKemRHRmpheTB4TWpnMk16YzRMVzkwWld3dGIyNWliMkZ5WkdsdVp5MW5jbUZtWVc1aExXNXZaR1ZxY3lJc0ltc2lPaUozUkRnelIwYzNkVTlIUWpOUU5UaFlUemc0ZFdOek9UUWlMQ0p0SWpwN0luSWlPaUp3Y205a0xYTmhMV1ZoYzNRdE1TSjlmUT09"
        },
        {
          name: "OTEL_SERVICE_NAME",
          value: "orders"
        },
        {
          name: "OTEL_RESOURCE_ATTRIBUTES",
          value: "service.name=orders,service.namespace=evento-nodejs,deployment.environment=production"
        },
        {
          name: "OTEL_NODE_RESOURCE_DETECTORS",
          value: "env,host,os"
        },
        {
          name: 'OTEL_NODE_ENABLED_INSTRUMENTATIONS',
          value: 'http,fastify,pg,amqplib'
        }
      ]
    }
  }
})