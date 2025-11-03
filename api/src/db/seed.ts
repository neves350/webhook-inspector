import { faker } from '@faker-js/faker'
import { db } from '.'
import { webhooks } from './schema'

// Stripe webhook event types
const stripeEventTypes = [
	'payment_intent.succeeded',
	'payment_intent.payment_failed',
	'payment_intent.created',
	'charge.succeeded',
	'charge.failed',
	'charge.refunded',
	'customer.created',
	'customer.updated',
	'customer.deleted',
	'customer.subscription.created',
	'customer.subscription.updated',
	'customer.subscription.deleted',
	'invoice.created',
	'invoice.payment_succeeded',
	'invoice.payment_failed',
	'invoice.finalized',
	'checkout.session.completed',
	'checkout.session.expired',
	'payout.created',
	'payout.paid',
	'payout.failed',
]

function generateStripeWebhookPayload(eventType: string) {
	const eventId = `evt_${faker.string.alphanumeric(24)}`
	const timestamp = faker.date.recent({ days: 30 }).getTime() / 1000

	// Base event structure
	const baseEvent = {
		id: eventId,
		object: 'event',
		api_version: '2023-10-16',
		created: Math.floor(timestamp),
		type: eventType,
		livemode: faker.datatype.boolean(),
		pending_webhooks: faker.number.int({ min: 0, max: 3 }),
		request: {
			id: `req_${faker.string.alphanumeric(14)}`,
			idempotency_key: faker.string.uuid(),
		},
	}

	// Generate specific data based on event type
	if (eventType.startsWith('payment_intent')) {
		return {
			...baseEvent,
			data: {
				object: {
					id: `pi_${faker.string.alphanumeric(24)}`,
					object: 'payment_intent',
					amount: faker.number.int({ min: 1000, max: 100000 }),
					currency: faker.helpers.arrayElement(['usd', 'eur', 'brl', 'gbp']),
					status: eventType.includes('succeeded')
						? 'succeeded'
						: eventType.includes('failed')
							? 'failed'
							: 'requires_payment_method',
					customer: `cus_${faker.string.alphanumeric(14)}`,
					description: faker.commerce.productName(),
					receipt_email: faker.internet.email(),
				},
			},
		}
	}

	if (eventType.startsWith('charge')) {
		return {
			...baseEvent,
			data: {
				object: {
					id: `ch_${faker.string.alphanumeric(24)}`,
					object: 'charge',
					amount: faker.number.int({ min: 1000, max: 100000 }),
					currency: faker.helpers.arrayElement(['usd', 'eur', 'brl', 'gbp']),
					status: eventType.includes('succeeded') ? 'succeeded' : 'failed',
					customer: `cus_${faker.string.alphanumeric(14)}`,
					description: faker.commerce.productName(),
					receipt_email: faker.internet.email(),
					paid: eventType.includes('succeeded'),
					refunded: eventType.includes('refunded'),
				},
			},
		}
	}

	if (eventType.startsWith('customer.subscription')) {
		return {
			...baseEvent,
			data: {
				object: {
					id: `sub_${faker.string.alphanumeric(14)}`,
					object: 'subscription',
					customer: `cus_${faker.string.alphanumeric(14)}`,
					status: faker.helpers.arrayElement([
						'active',
						'canceled',
						'past_due',
						'trialing',
					]),
					current_period_start: Math.floor(timestamp),
					current_period_end: Math.floor(timestamp + 2592000), // +30 days
					plan: {
						id: `plan_${faker.string.alphanumeric(14)}`,
						amount: faker.number.int({ min: 999, max: 9999 }),
						currency: 'usd',
						interval: faker.helpers.arrayElement(['month', 'year']),
						product: faker.commerce.productName(),
					},
				},
			},
		}
	}

	if (eventType.startsWith('invoice')) {
		return {
			...baseEvent,
			data: {
				object: {
					id: `in_${faker.string.alphanumeric(24)}`,
					object: 'invoice',
					customer: `cus_${faker.string.alphanumeric(14)}`,
					subscription: `sub_${faker.string.alphanumeric(14)}`,
					amount_due: faker.number.int({ min: 1000, max: 50000 }),
					amount_paid: eventType.includes('succeeded')
						? faker.number.int({ min: 1000, max: 50000 })
						: 0,
					currency: faker.helpers.arrayElement(['usd', 'eur', 'brl']),
					status: eventType.includes('succeeded')
						? 'paid'
						: eventType.includes('failed')
							? 'open'
							: 'draft',
					hosted_invoice_url: faker.internet.url(),
					invoice_pdf: faker.internet.url(),
				},
			},
		}
	}

	if (eventType.startsWith('customer') && !eventType.includes('subscription')) {
		return {
			...baseEvent,
			data: {
				object: {
					id: `cus_${faker.string.alphanumeric(14)}`,
					object: 'customer',
					email: faker.internet.email(),
					name: faker.person.fullName(),
					phone: faker.phone.number(),
					address: {
						city: faker.location.city(),
						country: faker.location.countryCode(),
						line1: faker.location.streetAddress(),
						postal_code: faker.location.zipCode(),
						state: faker.location.state(),
					},
					created: Math.floor(timestamp),
				},
			},
		}
	}

	if (eventType.startsWith('checkout.session')) {
		return {
			...baseEvent,
			data: {
				object: {
					id: `cs_${faker.string.alphanumeric(24)}`,
					object: 'checkout.session',
					customer: `cus_${faker.string.alphanumeric(14)}`,
					payment_status: eventType.includes('completed') ? 'paid' : 'unpaid',
					status: eventType.includes('completed') ? 'complete' : 'expired',
					amount_total: faker.number.int({ min: 1000, max: 100000 }),
					currency: faker.helpers.arrayElement(['usd', 'eur', 'brl']),
					success_url: faker.internet.url(),
					cancel_url: faker.internet.url(),
				},
			},
		}
	}

	if (eventType.startsWith('payout')) {
		return {
			...baseEvent,
			data: {
				object: {
					id: `po_${faker.string.alphanumeric(24)}`,
					object: 'payout',
					amount: faker.number.int({ min: 10000, max: 500000 }),
					currency: faker.helpers.arrayElement(['usd', 'eur', 'brl']),
					arrival_date: Math.floor(timestamp + 86400 * 7), // +7 days
					status: eventType.includes('paid')
						? 'paid'
						: eventType.includes('failed')
							? 'failed'
							: 'in_transit',
					description: 'STRIPE PAYOUT',
					method: 'standard',
				},
			},
		}
	}

	// Default fallback
	return {
		...baseEvent,
		data: {
			object: {
				id: faker.string.alphanumeric(24),
				description: faker.lorem.sentence(),
			},
		},
	}
}

function generateStripeHeaders() {
	return {
		'content-type': 'application/json',
		'stripe-signature': `t=${Date.now()},v1=${faker.string.alphanumeric(64)}`,
		'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
		host: faker.internet.domainName(),
		'content-length': faker.number.int({ min: 500, max: 3000 }).toString(),
		accept: '*/*',
		'accept-encoding': 'gzip, deflate',
		connection: 'keep-alive',
	}
}

async function seed() {
	console.log('🌱 Seeding database...')

	// Clear existing webhooks
	await db.delete(webhooks)
	console.log('🗑️  Cleared existing webhooks')

	const webhooksToInsert = []

	// Generate 60+ webhooks with varied Stripe events
	for (let i = 0; i < 65; i++) {
		const eventType = faker.helpers.arrayElement(stripeEventTypes)
		const payload = generateStripeWebhookPayload(eventType)
		const headers = generateStripeHeaders()

		webhooksToInsert.push({
			method: 'POST',
			pathname: `/stripe/webhooks/${faker.string.alphanumeric(8)}`,
			ip: faker.internet.ipv4(),
			statusCode: 200,
			contentType: 'application/json',
			contentLength: JSON.stringify(payload).length,
			headers,
			body: JSON.stringify(payload, null, 2),
			createdAt: faker.date.recent({ days: 30 }),
		})
	}

	// Insert all webhooks
	await db.insert(webhooks).values(webhooksToInsert)

	console.log(`✅ Successfully seeded ${webhooksToInsert.length} webhooks`)
	console.log('📊 Event type distribution:')

	const distribution = webhooksToInsert.reduce(
		(acc, webhook) => {
			const body = JSON.parse(webhook.body)
			const eventType = body.type
			acc[eventType] = (acc[eventType] || 0) + 1
			return acc
		},
		{} as Record<string, number>,
	)

	Object.entries(distribution)
		.sort(([, a], [, b]) => b - a)
		.forEach(([eventType, count]) => {
			console.log(`   ${eventType}: ${count}`)
		})

	process.exit(0)
}

seed().catch((error) => {
	console.error('❌ Seed failed:', error)
	process.exit(1)
})
