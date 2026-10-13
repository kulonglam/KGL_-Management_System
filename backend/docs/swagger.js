// Builds the OpenAPI/Swagger specification used to document and test backend endpoints.
 

// Handle success response.
const listSchema = (itemSchema) => ({
  description: 'An array when page and limit are omitted, otherwise items plus pagination.',
  oneOf: [
    { type: 'array', items: itemSchema },
    {
      type: 'object',
      required: ['items', 'pagination'],
      properties: {
        items: { type: 'array', items: itemSchema },
        pagination: { $ref: '#/components/schemas/PaginationMeta' }
      }
    }
  ]
});

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
      url: 'http://localhost:5000/api/v1',
      description: 'API v1'
    },
    {
      url: 'http://localhost:5000/api',
      description: 'Legacy alias of v1'
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
    { name: 'Prices' },
    { name: 'Notifications' },
    { name: 'Branches' },
    { name: 'Audit' }
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
      },
      PageQuery: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1 },
        description: 'With limit, wraps the result as { items, pagination }. Omit both for a capped array.'
      },
      LimitQuery: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 200 }
      },
      SearchQuery: {
        name: 'search',
        in: 'query',
        schema: { type: 'string', maxLength: 80 }
      },
      SortQuery: {
        name: 'sort',
        in: 'query',
        schema: { type: 'string', example: 'name_asc' }
      },
      PeriodQuery: {
        name: 'period',
        in: 'query',
        schema: { type: 'string', example: 'weekly' }
      },
      SpecificDateQuery: {
        name: 'specificDate',
        in: 'query',
        schema: { type: 'string', format: 'date' }
      },
      BranchQuery: {
        name: 'branch',
        in: 'query',
        schema: { type: 'string', example: 'all' }
      },
      UnreadQuery: {
        name: 'unread',
        in: 'query',
        schema: { type: 'string', enum: ['true', 'false'], default: 'true' },
        description: 'Defaults to unread notifications. Pass false to include read ones.'
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
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
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
        description: 'Manager pricing is resolved from Price Management; clients do not submit sellingPrice.',
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
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
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
          dealerContact: { type: 'string', example: '0700000000' }
        }
      },
      Sale: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
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
        description: 'Cash-sale amount is computed from the active managed selling price.',
        required: ['produceName', 'tonnageKg', 'buyerName', 'date', 'time'],
        properties: {
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans'],
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
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
          },
          tonnageKg: { type: 'number' },
          dateOfDispatch: { type: 'string', format: 'date' },
          isPaid: { type: 'boolean' }
        }
      },
      CreditSaleCreateRequest: {
        type: 'object',
        description:
          'Trusted buyer is selected by trustedBuyerId and amountDue is computed from the active managed selling price.',
        required: ['trustedBuyerId', 'dueDate', 'produceName', 'tonnageKg', 'dateOfDispatch'],
        properties: {
          trustedBuyerId: { type: 'string', description: 'ID of an existing trusted buyer in the same branch.' },
          dueDate: { type: 'string', format: 'date', description: 'Any valid due date.' },
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans'],
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
          produceName: { type: 'string', nullable: true },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
          },
          priceUgx: { type: 'number', nullable: true },
          source: { type: 'string', enum: ['managed', 'inferred'], nullable: true },
          scope: { type: 'string', enum: ['specific', 'type_default'], nullable: true }
        }
      },
      PriceHistoryEntry: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          branch: { type: 'string', enum: ['Maganjo', 'Matugga'] },
          priceSettingId: { type: 'string' },
          action: { type: 'string', enum: ['create', 'update', 'delete'] },
          previousProduceName: { type: 'string', nullable: true },
          previousProduceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans'],
            nullable: true
          },
          previousPriceUgx: { type: 'number', nullable: true },
          nextProduceName: { type: 'string', nullable: true },
          nextProduceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans'],
            nullable: true
          },
          nextPriceUgx: { type: 'number', nullable: true },
          changedBy: {
            allOf: [{ $ref: '#/components/schemas/UserPublic' }],
            nullable: true
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      PriceUpsertRequest: {
        type: 'object',
        required: ['produceType', 'priceUgx'],
        properties: {
          produceName: {
            type: 'string',
            nullable: true,
            description: 'Optional. Leave empty to create a type-default price for all produce names.'
          },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
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
      },
      PaginationMeta: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages'],
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 }
        }
      },
      RememberedUsername: {
        type: 'object',
        properties: {
          username: { type: 'string', example: 'kulong' }
        }
      },
      PasswordResetRequest: {
        type: 'object',
        required: ['username', 'recoveryCode', 'newPassword'],
        properties: {
          username: { type: 'string', example: 'kulong' },
          recoveryCode: { type: 'string', example: 'AB12-CD34' },
          newPassword: {
            type: 'string',
            format: 'password',
            minLength: 10,
            description: 'At least 10 characters with uppercase, lowercase, a digit, and a symbol.'
          }
        }
      },
      MfaLoginRequest: {
        type: 'object',
        required: ['mfaToken', 'code'],
        properties: {
          mfaToken: { type: 'string' },
          code: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
          rememberMe: { type: 'boolean' }
        }
      },
      MfaEnableRequest: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
          mfaToken: { type: 'string' }
        }
      },
      MfaDisableRequest: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', format: 'password' },
          code: { type: 'string', pattern: '^\\d{6}$', example: '123456' }
        }
      },
      MfaSetupResult: {
        type: 'object',
        properties: {
          secret: { type: 'string' },
          otpauthUri: { type: 'string' }
        }
      },
      RecoveryCodesResult: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          recoveryCodes: { type: 'array', items: { type: 'string' } },
          message: { type: 'string' }
        }
      },
      SaleUpdateRequest: {
        type: 'object',
        properties: {
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
          },
          tonnageKg: { type: 'number', minimum: 1 },
          buyerName: { type: 'string' },
          salesAgentName: { type: 'string' },
          date: { type: 'string', format: 'date' },
          time: { type: 'string', example: '14:30' }
        }
      },
      CreditSaleUpdateRequest: {
        type: 'object',
        properties: {
          dueDate: { type: 'string', format: 'date' },
          dateOfDispatch: { type: 'string', format: 'date' }
        }
      },
      StockNotification: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          branch: { type: 'string', example: 'Maganjo' },
          produceName: { type: 'string' },
          produceType: {
            type: 'string',
            enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
          },
          category: { type: 'string', enum: ['out_of_stock', 'low_stock'] },
          message: { type: 'string' },
          isRead: { type: 'boolean' },
          readAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Branch: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Bweyogerere' },
          isActive: { type: 'boolean' },
          isDefault: { type: 'boolean' }
        }
      },
      BranchList: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Branch' } },
          names: { type: 'array', items: { type: 'string' } }
        }
      },
      BranchCreateRequest: {
        type: 'object',
        required: ['name', 'managerName', 'managerUsername', 'managerPassword'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'Bweyogerere' },
          managerName: { type: 'string', minLength: 2 },
          managerUsername: { type: 'string', minLength: 2 },
          managerPassword: {
            type: 'string',
            format: 'password',
            minLength: 10,
            description: 'At least 10 characters with uppercase, lowercase, a digit, and a symbol.'
          }
        }
      },
      BranchUpdateRequest: {
        type: 'object',
        required: ['isActive'],
        properties: {
          isActive: { type: 'boolean' }
        }
      },
      BranchCreateResult: {
        type: 'object',
        properties: {
          branch: { $ref: '#/components/schemas/Branch' },
          manager: { $ref: '#/components/schemas/UserPublic' }
        }
      },
      AuditLogEntry: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          actorId: { type: 'string', nullable: true },
          actorName: { type: 'string' },
          actorRole: { type: 'string' },
          action: { type: 'string', enum: ['create', 'update', 'delete', 'login', 'repay', 'auth'] },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          branch: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      ManagerDashboard: {
        type: 'object',
        properties: {
          reportRange: {
            type: 'object',
            properties: {
              from: { type: 'string', format: 'date-time' },
              to: { type: 'string', format: 'date-time' }
            }
          },
          stats: {
            type: 'object',
            properties: {
              cashSales: { type: 'number' },
              cashCount: { type: 'integer' },
              creditSales: { type: 'number' },
              creditCount: { type: 'integer' },
              procurementTotal: { type: 'number' },
              procurementCount: { type: 'integer' }
            }
          },
          topProducts: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, totalKg: { type: 'number' } }
            }
          },
          salesOverTime: {
            type: 'array',
            items: {
              type: 'object',
              properties: { label: { type: 'string' }, amount: { type: 'number' } }
            }
          },
          creditCollection: {
            type: 'object',
            properties: { collected: { type: 'number' }, outstanding: { type: 'number' } }
          },
          agentPerformance: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, amount: { type: 'number' } }
            }
          },
          dealerPerformance: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, amount: { type: 'number' } }
            }
          }
        }
      },
      AgentDashboard: {
        type: 'object',
        properties: {
          cashSales: { type: 'number' },
          cashCount: { type: 'integer' },
          creditSales: { type: 'number' },
          creditCount: { type: 'integer' },
          totalKg: { type: 'number' },
          overdueCount: { type: 'integer' }
        }
      },
      HealthStatus: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'karibu-groceries-backend' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      ReadinessStatus: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ready', 'not_ready'] },
          databaseReadyState: { type: 'integer', description: 'Mongoose readyState. 1 means connected.' }
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
    '/auth/login': {
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
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/MessageObject' }),
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/auth/register': {
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
    '/auth/me': {
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
    '/auth/users': {
      get: {
        tags: ['Users'],
        summary: 'Get users (manager only)',
        description: 'Managers see staff in their branch. Pass page and limit to receive a pagination wrapper.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/SortQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ $ref: '#/components/schemas/UserPublic' })),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/auth/users/{id}': {
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
    '/procurement': {
      get: {
        tags: ['Procurement'],
        summary: 'Get procurement records',
        description: 'Branch-scoped. Pass page and limit to receive a pagination wrapper.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/SortQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ $ref: '#/components/schemas/Procurement' })),
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
    '/procurement/{id}': {
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
    '/sales': {
      get: {
        tags: ['Sales'],
        summary: 'Get sales',
        description: 'Branch-scoped for managers and sales agents. Pass page and limit to receive a pagination wrapper.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/SortQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ $ref: '#/components/schemas/Sale' })),
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
    '/sales/aggregation': {
      get: {
        tags: ['Sales'],
        summary: 'Get sales aggregation (director only)',
        description: 'Cross-branch totals for the selected period.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PeriodQuery' },
          { $ref: '#/components/parameters/BranchQuery' },
          { $ref: '#/components/parameters/SpecificDateQuery' }
        ],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/SalesAggregation' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/sales/{id}': {
      put: {
        tags: ['Sales'],
        summary: 'Update a cash sale',
        description: 'Manager correction of produce, buyer, weight, or sale time. Stock notifications are recalculated.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SaleUpdateRequest' } } }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/Sale' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
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
    '/credit-sales': {
      get: {
        tags: ['Credit Sales'],
        summary: 'Get credit sales',
        description: 'Branch-scoped for managers and sales agents. Pass page and limit to receive a pagination wrapper.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/SortQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ $ref: '#/components/schemas/CreditSale' })),
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
    '/credit-sales/{id}/payment': {
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
    '/credit-sales/{id}/repay': {
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
    '/credit-sales/{id}': {
      put: {
        tags: ['Credit Sales'],
        summary: 'Update a credit sale',
        description: 'Manager correction of the due date or dispatch date.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreditSaleUpdateRequest' } }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/CreditSale' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
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
    '/inventory': {
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
    '/trusted-buyers': {
      get: {
        tags: ['Trusted Buyers'],
        summary: 'Get trusted buyers',
        description: 'Branch-scoped. Pass page and limit to receive a pagination wrapper.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/SortQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ $ref: '#/components/schemas/TrustedBuyer' })),
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
    '/trusted-buyers/{id}': {
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
    '/prices': {
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
    '/prices/{id}': {
      get: {
        tags: ['Prices'],
        summary: 'Get one price rule',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PriceSetting' }),
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
    },
    '/prices/{id}/history': {
      get: {
        tags: ['Prices'],
        summary: 'Get price history',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({
            type: 'array',
            items: { $ref: '#/components/schemas/PriceHistoryEntry' }
          }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/auth/remembered': {
      get: {
        tags: ['Auth'],
        summary: 'Read the remembered username cookie',
        description: 'Returns the username stored by Remember me. No bearer token. An invalid cookie is cleared.',
        responses: {
          200: successResponse({ $ref: '#/components/schemas/RememberedUsername' })
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate the refresh cookie and issue a new access token',
        description:
          'Reads the httpOnly kgl_refresh cookie. A spent cookie does not return a session; it revokes that login. The browser serializes this call across tabs so a second tab sends the replacement cookie.',
        responses: {
          200: successResponse({ $ref: '#/components/schemas/AuthPayload' }),
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/auth/password-reset': {
      post: {
        tags: ['Auth'],
        summary: 'Reset a password with a one-time recovery code',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PasswordResetRequest' } } }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/MessageObject' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/auth/login/mfa': {
      post: {
        tags: ['Auth'],
        summary: 'Finish login with an authenticator code',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MfaLoginRequest' } } }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/AuthPayload' }),
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/auth/recovery-codes': {
      post: {
        tags: ['Auth'],
        summary: 'Issue recovery codes for the signed-in user',
        description: 'Replaces any previous codes. The plaintext codes are returned once.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/RecoveryCodesResult' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/auth/users/{id}/recovery-codes': {
      post: {
        tags: ['Users'],
        summary: 'Issue recovery codes for a managed user',
        description: 'Manager-only. Replaces that user\'s codes and writes an audit entry.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/RecoveryCodesResult' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/auth/mfa/setup': {
      post: {
        tags: ['Auth'],
        summary: 'Start authenticator enrollment',
        description: 'Stores a pending TOTP secret and returns the otpauth URI for the authenticator app.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/MfaSetupResult' }),
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/auth/mfa/enable': {
      post: {
        tags: ['Auth'],
        summary: 'Confirm authenticator enrollment',
        description: 'Verifies the 6-digit code, turns MFA on, and rotates the session.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MfaEnableRequest' } } }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/AuthPayload' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/auth/mfa/disable': {
      post: {
        tags: ['Auth'],
        summary: 'Turn off authenticator MFA',
        description: 'Requires the account password and, when MFA is already on, a current authenticator code. Production accounts cannot disable MFA.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MfaDisableRequest' } } }
        },
        responses: {
          200: successResponse({
            type: 'object',
            properties: { mfaEnabled: { type: 'boolean', example: false } }
          }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List stock notifications for the signed-in branch',
        description: 'Managers and sales agents. Unread only unless unread=false. Without page and limit, at most 50 rows are returned.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/UnreadQuery' },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ $ref: '#/components/schemas/StockNotification' })),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark every stock notification read',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({
            type: 'object',
            properties: { modifiedCount: { type: 'integer', example: 3 } }
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/notifications/{id}/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark one stock notification read',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/StockNotification' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/branches': {
      get: {
        tags: ['Branches'],
        summary: 'List branches',
        description: 'Any signed-in user. Includes which names are the built-in defaults.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/BranchList' }),
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      },
      post: {
        tags: ['Branches'],
        summary: 'Create a branch and its manager',
        description: 'Director only. Creates the branch and the first manager account together.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BranchCreateRequest' } } }
        },
        responses: {
          201: successResponse({ $ref: '#/components/schemas/BranchCreateResult' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' }
        }
      }
    },
    '/branches/{id}': {
      put: {
        tags: ['Branches'],
        summary: 'Activate or deactivate a branch',
        description: 'Director only. The built-in branches cannot be deactivated.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BranchUpdateRequest' } } }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/Branch' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'List audit logs',
        description: 'Directors see every branch. Managers see their own branch. Without page and limit, the newest 100 rows are returned.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ $ref: '#/components/schemas/AuditLogEntry' })),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/sales/dashboard': {
      get: {
        tags: ['Sales'],
        summary: 'Manager dashboard totals',
        description: 'Branch totals, trend, credit collection, and ranked products, agents, and dealers.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PeriodQuery' },
          { $ref: '#/components/parameters/SpecificDateQuery' }
        ],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/ManagerDashboard' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/sales/agent-dashboard': {
      get: {
        tags: ['Sales'],
        summary: 'Sales agent dashboard totals for today',
        description: 'Cash and credit totals, weight, and overdue credit count for the signed-in agent.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/AgentDashboard' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/healthz': {
      get: {
        tags: ['System'],
        summary: 'Liveness probe',
        description: 'Served from the process root, not under /api/v1. Does not check the database.',
        servers: [{ url: 'http://localhost:5000', description: 'Process root' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/HealthStatus' })
        }
      }
    },
    '/readyz': {
      get: {
        tags: ['System'],
        summary: 'Readiness probe',
        description: 'Served from the process root. Returns 503 until MongoDB is connected.',
        servers: [{ url: 'http://localhost:5000', description: 'Process root' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/ReadinessStatus' }),
          503: successResponse({ $ref: '#/components/schemas/ReadinessStatus' }, 'Database is not connected')
        }
      }
    }
  }
};

export default swaggerSpec;
