import { json, OPTIONS } from '#lib/server/api.ts';

/** GET /api/v1: what the API offers. */
export const GET = () =>
	json({
		name: 'DETECK API',
		version: 'v1',
		documentation: '/developers',
		openapi: '/api/v1/openapi.json',
		endpoints: [
			'POST /api/v1/checks',
			'GET /api/v1/checks/{id}',
			'GET /api/v1/checks/{id}/journey',
			'GET /api/v1/coverage',
			'GET /api/v1/manufacturer/products',
			'POST /api/v1/manufacturer/imports',
			'GET /api/v1/manufacturer/imports/{id}',
			'POST /api/v1/manufacturer/batch-status',
			'POST /api/v1/business/checks',
			'POST /api/v1/business/receipts'
		]
	});

export { OPTIONS };
