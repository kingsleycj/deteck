import { WEBHOOK_EVENTS } from '@deteck/core/server/webhooks.ts';
import { json, OPTIONS } from '#lib/server/api.ts';

const error = {
	description: 'An error',
	content: {
		'application/json': {
			schema: { $ref: '#/components/schemas/Error' }
		}
	}
};

/** GET /api/v1/openapi.json: the API described in OpenAPI 3.1, for code generators and tools. */
export const GET = () =>
	json({
		openapi: '3.1.0',
		info: {
			title: 'DETECK API',
			version: '1.0.0',
			description:
				'Check medicine serials against manufacturer records, send manufacturer data, and check deliveries. Human documentation: /developers.'
		},
		servers: [{ url: '/api/v1' }],
		components: {
			securitySchemes: {
				apiKey: {
					type: 'http',
					scheme: 'bearer',
					description: 'An API key from the manufacturer workspace, business portal or DETECK.'
				}
			},
			schemas: {
				Error: {
					type: 'object',
					properties: {
						error: {
							type: 'object',
							properties: { code: { type: 'string' }, message: { type: 'string' } },
							required: ['code', 'message']
						}
					}
				},
				Result: {
					type: 'object',
					description: 'A check result. "code" is one of the fixed result states.',
					properties: {
						code: {
							type: 'string',
							enum: [
								'VALID',
								'UNRECOGNISED',
								'NOT_COVERED',
								'CANT_CONFIRM',
								'RECALLED',
								'NEEDS_BATCH'
							]
						},
						flags: {
							type: 'array',
							items: { type: 'string', enum: ['EXPIRED', 'LOT_MISMATCH', 'EXPIRY_MISMATCH'] }
						},
						reason: { type: 'string' },
						serialDisplay: { type: 'string', example: '…TB8D' },
						manufacturer: {
							type: 'object',
							properties: {
								name: { type: 'string' },
								state: { type: 'string' },
								town: { type: ['string', 'null'] }
							}
						},
						product: { type: 'object' },
						batch: { type: 'object' },
						journeyAvailable: { type: 'boolean' },
						checkedAt: { type: 'string', format: 'date-time' }
					}
				},
				ImportRequest: {
					type: 'object',
					required: ['kind', 'rows'],
					properties: {
						kind: { type: 'string', enum: ['products', 'batches_serials', 'distribution'] },
						rows: {
							type: 'array',
							maxItems: 50000,
							items: { type: 'object', additionalProperties: { type: ['string', 'number'] } },
							description:
								'Field names: products: gtin, brandName, genericName, strength, dosageForm, packSize, nafdacRegNo, serialHint. batches_serials: gtin (or nafdacRegNo), lot, manufactureDate, expiryDate, serial, quantity. distribution: gtin (or nafdacRegNo), lot, serial, toName, toRole, toState, toCity, eventDate, fromName, toCac, toPcn, toGln.'
						},
						commit: {
							type: 'boolean',
							description: 'false (default) only checks the rows; true imports the ready rows.'
						}
					}
				}
			}
		},
		paths: {
			'/checks': {
				post: {
					summary: 'Check a serial or a scanned code',
					description:
						'No key needed (limited per IP); a key raises the limit. The `summary` is in the language asked for with `Accept-Language` or `?lang=` (en, pcm, ha, yo, ig), English by default.',
					security: [{}, { apiKey: [] }],
					parameters: [
						{
							name: 'lang',
							in: 'query',
							required: false,
							schema: { type: 'string', enum: ['en', 'pcm', 'ha', 'yo', 'ig'] }
						}
					],
					requestBody: {
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										serial: { type: 'string', example: '7K4M9QX2TB8D' },
										code: { type: 'string', example: '(01)09506000990019(21)7K4M9QX2TB8D' },
										lot: {
											type: 'string',
											example: 'NB-2611',
											description:
												'The batch number printed on the pack. Needed when a serial is on more than one product (the answer then says `needs: "lot"`).'
										}
									}
								}
							}
						}
					},
					responses: {
						'201': {
							description: 'The result, kept for 30 minutes under its id',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											result: { $ref: '#/components/schemas/Result' },
											needs: {
												type: 'string',
												nullable: true,
												enum: ['lot', 'code'],
												description:
													'For NEEDS_BATCH: send the check again with "lot", or, for "code", a scan of the square code.'
											},
											summary: { type: 'object' },
											links: { type: 'object' }
										}
									}
								}
							}
						},
						'422': error,
						'429': error
					}
				}
			},
			'/checks/{id}': {
				get: {
					summary: 'Read a check result again',
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': { description: 'The result' }, '404': error }
				}
			},
			'/checks/{id}/journey': {
				get: {
					summary: 'The recorded journey of a Valid pack',
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': { description: 'The journey' }, '404': error, '409': error }
				}
			},
			'/coverage': {
				get: {
					summary: 'How many manufacturers and drugs DETECK covers',
					responses: { '200': { description: 'Counts' } }
				}
			},
			'/manufacturer/products': {
				get: {
					summary: "Your company's drugs",
					security: [{ apiKey: ['manufacturer:read'] }],
					responses: { '200': { description: 'Drugs with counts' }, '401': error, '403': error }
				}
			},
			'/manufacturer/imports': {
				post: {
					summary: 'Send drugs, batches and serials, or supply chain records',
					description:
						'Checked exactly like an uploaded file. Sending identical rows again returns the first import (safe to retry).',
					security: [{ apiKey: ['manufacturer:write'] }],
					requestBody: {
						content: {
							'application/json': { schema: { $ref: '#/components/schemas/ImportRequest' } }
						}
					},
					responses: {
						'202': { description: 'Accepted; poll the import for its result' },
						'400': error,
						'403': error
					}
				}
			},
			'/manufacturer/imports/{id}': {
				get: {
					summary: 'An import: status, counts and the first 100 problem rows',
					security: [{ apiKey: ['manufacturer:read'] }],
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': { description: 'The import' }, '404': error }
				}
			},
			'/manufacturer/batch-status': {
				post: {
					summary: 'Recall or withdraw a batch',
					security: [{ apiKey: ['manufacturer:write'] }],
					responses: { '200': { description: 'Saved' }, '400': error, '404': error }
				}
			},
			'/business/checks': {
				post: {
					summary: 'Check up to 500 serials or scanned codes from a delivery',
					security: [{ apiKey: ['business:verify'] }],
					responses: { '200': { description: 'One result per code' }, '400': error }
				}
			},
			'/business/receipts': {
				post: {
					summary: 'Record the Valid packs as received by your business',
					security: [{ apiKey: ['business:receive'] }],
					responses: { '200': { description: 'How many were recorded, and which were skipped' } }
				}
			}
		},
		webhooks: Object.fromEntries(
			Object.entries(WEBHOOK_EVENTS).map(([event, description]) => [
				event,
				{
					post: {
						summary: description,
						description:
							'Signed with x-deteck-signature: v1=HMAC-SHA256(secret, "<x-deteck-timestamp>.<body>").',
						responses: { '200': { description: 'Any 2xx answer marks it delivered' } }
					}
				}
			])
		)
	});

export { OPTIONS };
