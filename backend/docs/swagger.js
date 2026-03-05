/**
 * Builds the OpenAPI/Swagger specification used to document and test backend endpoints.
 * File: backend/docs/swagger.js
 */

// Handle success response.
const successResponse = (dataSchema, description = 'Successful response') => ({
  description,
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: dataSchema
            }
          }
        ]
      }
    }
  }
});

// Configure swagger spec.
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Karibu Groceries LTD API',
    version: '1.0.0',
    description: 'API documentation for Karibu Groceries LTD wholesale produce management system.'
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server'
    }
  ],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Procurement' },
    { name: 'Sales' },
    { name: 'Credit Sales' },
    { name: 'Inventory' },
    { name: 'Trusted Buyers' },
    { name: 'Prices' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    parameters: {
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', example: '65f44c553f02d6f0bbad3f8f' }
      }
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        required: ['success', 'data', 'error'],
        properties: {
          success: { type: 'boolean', example: true },
          data: { nullable: true },
          error: { nullable: true, example: null }
        }
      },
      ErrorEnvelope: {
        type: 'object',
        required: ['success', 'data', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          data: { nullable: true, example: null },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Not authorized' },
              details: { nullable: true },
              statusCode: { type: 'number', example: 401 }
            }
          }
        }
      },
      MessageObject: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operation completed successfully' }
        }
      },
      UserPublic: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Manager A' },
          username: { type: 'string', example: 'managera' },
          role: {
            type: 'string',
            enum: ['director', 'manager', 'sales_agent']
          },
          branch: { type: 'string', enum: ['Maganjo', 'Matugga'], nullable: true }
        }
      },
      AuthPayload: {
        allOf: [
          { $ref: '#/components/schemas/UserPublic' },
          {
            type: 'object',
            properties: {
              token: { type: 'string' }
            }
          }
        ]
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'managera' },
          password: { type: 'string', format: 'password', example: 'Pass1234!' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'username', 'password', 'role', 'branch'],
        properties: {
          name: { type: 'string', example: 'Sales Agent 1' },
          username: { type: 'string', example: 'agent1' },
          password: { type: 'string', format: 'password', example: 'Pass1234!' },
          role: { type: 'string', enum: ['manager', 'sales_agent'] },
          branch: { type: 'string', enum: ['Maganjo', 'Matugga'] }
        }
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          username: { type: 'string' },
          role: { type: 'string', enum: ['manager', 'sales_agent'] },
          password: { type: 'string', format: 'password' }
        }
      },
      UpdateMyProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          username: { type: 'string' },
          password: { type: 'string', format: 'password' }
        }
      },
      Procurement: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
          },
          sourceType: { type: 'string', enum: ['individual', 'company', 'kgl_farm'] },
          dateReceived: { type: 'string', format: 'date' },
          timeReceived: { type: 'string' },
          tonnageKg: {
            type: 'number',
            minimum: 100,
            description: 'Minimum 100 kg. For sourceType=individual, minimum is 1000 kg.'
          },
          costUgx: { type: 'number' },
          dealerName: { type: 'string' },
          dealerContact: { type: 'string' },
          branch: { type: 'string', enum: ['Maganjo', 'Matugga'] },
          sellingPrice: { type: 'number' }
        }
      },
      ProcurementCreateRequest: {
        type: 'object',
        required: [
          'produceName',
          'produceType',
          'sourceType',
          'dateReceived',
          'timeReceived',
          'tonnageKg',
          'costUgx',
          'dealerName',
          'dealerContact'
        ],
        properties: {
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
          },
          sourceType: { type: 'string', enum: ['individual', 'company', 'kgl_farm'] },
          dateReceived: { type: 'string', format: 'date' },
          timeReceived: { type: 'string', example: '10:45' },
          tonnageKg: {
            type: 'number',
            minimum: 100,
            description: 'Minimum 100 kg. For sourceType=individual, minimum is 1000 kg.'
          },
          costUgx: { type: 'number', minimum: 10000 },
          dealerName: { type: 'string' },
          dealerContact: { type: 'string', example: '+256700000000' }
        }
      },
      Sale: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
          },
          tonnageKg: { type: 'number' },
          amountPaidUgx: { type: 'number' },
          buyerName: { type: 'string' },
          salesAgentName: { type: 'string' },
          date: { type: 'string', format: 'date' },
          time: { type: 'string' }
        }
      },
      SaleCreateRequest: {
        type: 'object',
        required: ['produceName', 'tonnageKg', 'buyerName', 'date', 'time'],
        properties: {
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'],
            nullable: true
          },
          tonnageKg: { type: 'number', minimum: 1 },
          buyerName: { type: 'string' },
          date: { type: 'string', format: 'date' },
          time: { type: 'string' }
        }
      },
      SalesAggregation: {
        type: 'object',
        properties: {
          branchTotals: { type: 'object', additionalProperties: true },
          grandTotal: { type: 'object', additionalProperties: true },
          trends: { type: 'object', additionalProperties: true }
        }
      },
      CreditSale: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          buyerName: { type: 'string' },
          nationalId: { type: 'string' },
          location: { type: 'string' },
          contact: { type: 'string' },
          amountDueUgx: { type: 'number' },
          amountPaidUgx: { type: 'number' },
          balanceUgx: { type: 'number' },
          salesAgentName: { type: 'string' },
          dueDate: { type: 'string', format: 'date' },
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
          },
          tonnageKg: { type: 'number' },
          dateOfDispatch: { type: 'string', format: 'date' },
          isPaid: { type: 'boolean' }
        }
      },
      CreditSaleCreateRequest: {
        type: 'object',
        required: ['trustedBuyerId', 'dueDate', 'produceName', 'tonnageKg', 'dateOfDispatch'],
        properties: {
          trustedBuyerId: { type: 'string' },
          dueDate: { type: 'string', format: 'date' },
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'],
            nullable: true
          },
          tonnageKg: { type: 'number', minimum: 1 },
          dateOfDispatch: { type: 'string', format: 'date' }
        }
      },
      CreditSalePaymentStatusRequest: {
        type: 'object',
        required: ['isPaid'],
        properties: {
          isPaid: { type: 'boolean' }
        }
      },
      CreditSaleRepayRequest: {
        type: 'object',
        required: ['amountUgx'],
        properties: {
          amountUgx: { type: 'number', minimum: 1 },
          paidAt: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      InventoryOverview: {
        type: 'object',
        properties: {
          inventory: { type: 'array', items: { type: 'object' } },
          outOfStockItems: { type: 'array', items: { type: 'object' } },
          statistics: { type: 'object', additionalProperties: true }
        }
      },
      InventoryCheckRequest: {
        type: 'object',
        required: ['produceName', 'tonnage'],
        properties: {
          produceName: { type: 'string' },
          tonnage: { type: 'number' }
        }
      },
      InventoryCheckResult: {
        type: 'object',
        properties: {
          available: { type: 'boolean' },
          currentStock: { type: 'number' }
        }
      },
      TrustedBuyer: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          nationalId: { type: 'string' },
          location: { type: 'string' },
          contact: { type: 'string' },
          branch: { type: 'string', enum: ['Maganjo', 'Matugga'] }
        }
      },
      TrustedBuyerRequest: {
        type: 'object',
        required: ['name', 'nationalId', 'location', 'contact'],
        properties: {
          name: { type: 'string' },
          nationalId: { type: 'string' },
          location: { type: 'string' },
          contact: { type: 'string' }
        }
      },
      PriceSetting: {
        type: 'object',
        properties: {
          _id: { type: 'string', nullable: true },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
          },
          priceUgx: { type: 'number', nullable: true },
          source: { type: 'string', enum: ['managed', 'inferred', 'unset'], nullable: true }
        }
      },
      PriceUpsertRequest: {
        type: 'object',
        required: ['produceType', 'priceUgx'],
        properties: {
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
          },
          priceUgx: { type: 'number', minimum: 10000 }
        }
      },
      PriceWriteResult: {
        type: 'object',
        properties: {
          setting: { type: 'object' },
          updatedProcurements: { type: 'number' }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } }
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } }
      },
      Forbidden: {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } }
      },
      NotFound: {
        description: 'Not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } }
      },
      Conflict: {
        description: 'Conflict',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } }
      }
    }
  },
  paths: {
    '/': {
      get: {
        tags: ['System'],
        summary: 'API root',
        responses: {
          200: successResponse({
            type: 'object',
            properties: { message: { type: 'string', example: 'Karibu Groceries LTD API' } }
          })
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/AuthPayload' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Users'],
        summary: 'Register user (manager only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } }
          }
        },
        responses: {
          201: successResponse({ $ref: '#/components/schemas/AuthPayload' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/UserPublic' }),
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      },
      put: {
        tags: ['Auth'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateMyProfileRequest' }
            }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/UserPublic' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/auth/users': {
      get: {
        tags: ['Users'],
        summary: 'Get users (manager only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({
            type: 'array',
            items: { $ref: '#/components/schemas/UserPublic' }
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/auth/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/UserPublic' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRequest' } }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/UserPublic' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/MessageObject' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/procurement': {
      get: {
        tags: ['Procurement'],
        summary: 'Get procurement records',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({
            type: 'array',
            items: { $ref: '#/components/schemas/Procurement' }
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Procurement'],
        summary: 'Create procurement',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProcurementCreateRequest' }
            }
          }
        },
        responses: {
          201: successResponse({ $ref: '#/components/schemas/Procurement' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/procurement/{id}': {
      get: {
        tags: ['Procurement'],
        summary: 'Get procurement by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/Procurement' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['Procurement'],
        summary: 'Update procurement',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProcurementCreateRequest' }
            }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/Procurement' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['Procurement'],
        summary: 'Delete procurement',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/MessageObject' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/sales': {
      get: {
        tags: ['Sales'],
        summary: 'Get sales',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({
            type: 'array',
            items: { $ref: '#/components/schemas/Sale' }
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Sales'],
        summary: 'Create sale',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SaleCreateRequest' } }
          }
        },
        responses: {
          201: successResponse({ $ref: '#/components/schemas/Sale' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/sales/aggregation': {
      get: {
        tags: ['Sales'],
        summary: 'Get sales aggregation (director + Mr. Orban only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/SalesAggregation' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/sales/{id}': {
      delete: {
        tags: ['Sales'],
        summary: 'Delete sale',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/MessageObject' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/credit-sales': {
      get: {
        tags: ['Credit Sales'],
        summary: 'Get credit sales',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({
            type: 'array',
            items: { $ref: '#/components/schemas/CreditSale' }
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Credit Sales'],
        summary: 'Create credit sale',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreditSaleCreateRequest' } }
          }
        },
        responses: {
          201: successResponse({ $ref: '#/components/schemas/CreditSale' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/credit-sales/{id}/payment': {
      put: {
        tags: ['Credit Sales'],
        summary: 'Update credit sale payment status',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreditSalePaymentStatusRequest' }
            }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/CreditSale' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/credit-sales/{id}/repay': {
      post: {
        tags: ['Credit Sales'],
        summary: 'Repay credit sale balance',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreditSaleRepayRequest' } }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/CreditSale' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/credit-sales/{id}': {
      delete: {
        tags: ['Credit Sales'],
        summary: 'Delete credit sale',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/MessageObject' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'Get inventory overview',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/InventoryOverview' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/inventory/check-stock': {
      post: {
        tags: ['Inventory'],
        summary: 'Check stock',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/InventoryCheckRequest' } }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/InventoryCheckResult' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/trusted-buyers': {
      get: {
        tags: ['Trusted Buyers'],
        summary: 'Get trusted buyers',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({
            type: 'array',
            items: { $ref: '#/components/schemas/TrustedBuyer' }
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Trusted Buyers'],
        summary: 'Create trusted buyer',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/TrustedBuyerRequest' } }
          }
        },
        responses: {
          201: successResponse({ $ref: '#/components/schemas/TrustedBuyer' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/trusted-buyers/{id}': {
      put: {
        tags: ['Trusted Buyers'],
        summary: 'Update trusted buyer',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/TrustedBuyerRequest' } }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/TrustedBuyer' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['Trusted Buyers'],
        summary: 'Delete trusted buyer',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/MessageObject' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/prices': {
      get: {
        tags: ['Prices'],
        summary: 'Get price matrix',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({
            type: 'array',
            items: { $ref: '#/components/schemas/PriceSetting' }
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Prices'],
        summary: 'Create produce price',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PriceUpsertRequest' } }
          }
        },
        responses: {
          201: successResponse({ $ref: '#/components/schemas/PriceWriteResult' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' }
        }
      }
    },
    '/api/prices/{id}': {
      get: {
        tags: ['Prices'],
        summary: 'Get price by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PriceSetting' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['Prices'],
        summary: 'Update price',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PriceUpsertRequest' } }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PriceWriteResult' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' }
        }
      },
      delete: {
        tags: ['Prices'],
        summary: 'Delete price',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/MessageObject' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    }
  }
};

export default swaggerSpec;
