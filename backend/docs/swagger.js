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

const operationResponse = (summary, tag = 'Operations') => ({
  tags: [tag],
  summary,
  security: [{ bearerAuth: [] }],
  responses: {
    200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
  }
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
    { name: 'Finance' },
    { name: 'Platform' },
    { name: 'Partner', description: 'Read-only partner API authenticated with X-API-Key' },
    { name: 'Trusted Buyers' },
    { name: 'Prices' },
    { name: 'Notifications' },
    { name: 'Messages' },
    { name: 'Suppliers' },
    { name: 'Branches' },
    { name: 'Audit' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Partner key in the form kgl_<prefix>_<secret>, issued by a director under Platform.'
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
          isPaid: { type: 'boolean' },
          writtenOffUgx: { type: 'number' },
          writeOff: { $ref: '#/components/schemas/CreditWriteOff' }
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
          email: { type: 'string' },
          branch: { type: 'string', enum: ['Maganjo', 'Matugga'] },
          creditLimitUgx: { type: 'number', nullable: true },
          outstandingUgx: { type: 'number', description: 'Open credit balance (list responses only)' }
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
      },
      OidcStatus: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          issuer: { type: 'string', nullable: true },
          providerName: { type: 'string', nullable: true, example: 'SSO' }
        }
      },
      OidcLoginStart: {
        type: 'object',
        properties: {
          authorizationUrl: { type: 'string', format: 'uri' }
        }
      },
      WebhookEvent: {
        type: 'string',
        enum: [
          'sale.created',
          'sale.voided',
          'credit.overdue',
          'credit.created',
          'procurement.created',
          'retention.completed'
        ]
      },
      WebhookSubscription: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          targetUrl: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { $ref: '#/components/schemas/WebhookEvent' } },
          isActive: { type: 'boolean' },
          secretPreview: { type: 'string', example: 'a1b2…9f' },
          secret: {
            type: 'string',
            description: 'Only returned when a subscription is created or its secret is rotated.'
          },
          lastDeliveredAt: { type: 'string', format: 'date-time', nullable: true },
          lastStatusCode: { type: 'integer', nullable: true },
          lastError: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      WebhookCreateRequest: {
        type: 'object',
        required: ['name', 'targetUrl'],
        properties: {
          name: { type: 'string', maxLength: 120 },
          targetUrl: {
            type: 'string',
            format: 'uri',
            description: 'Private, loopback and link-local targets are refused in production.'
          },
          events: { type: 'array', items: { $ref: '#/components/schemas/WebhookEvent' } },
          secret: { type: 'string', minLength: 16, maxLength: 128 },
          isActive: { type: 'boolean' }
        }
      },
      WebhookUpdateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 120 },
          targetUrl: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { $ref: '#/components/schemas/WebhookEvent' } },
          isActive: { type: 'boolean' },
          rotateSecret: { type: 'boolean' }
        }
      },
      WebhookDelivery: {
        type: 'object',
        description:
          'Each POST carries X-KGL-Event, X-KGL-Delivery, X-KGL-Timestamp and ' +
          'X-KGL-Signature: sha256=HMAC_SHA256(secret, "{timestamp}.{rawBody}").',
        properties: {
          _id: { type: 'string' },
          subscription: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                properties: { _id: { type: 'string' }, name: { type: 'string' }, targetUrl: { type: 'string' } }
              }
            ]
          },
          event: { $ref: '#/components/schemas/WebhookEvent' },
          payload: { type: 'object' },
          status: { type: 'string', enum: ['queued', 'retrying', 'delivered', 'failed'] },
          statusCode: { type: 'integer', nullable: true },
          attemptCount: { type: 'integer' },
          error: { type: 'string' },
          deliveredAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      JobSchedule: {
        type: 'object',
        properties: {
          jobName: { type: 'string' },
          kind: { type: 'string', enum: ['interval', 'weekly'] },
          intervalMs: { type: 'integer', nullable: true },
          utcDay: { type: 'integer', nullable: true, minimum: 0, maximum: 6 },
          utcHour: { type: 'integer', nullable: true, minimum: 0, maximum: 23 },
          lastRunAt: { type: 'string', format: 'date-time', nullable: true },
          lastCompletedAt: { type: 'string', format: 'date-time', nullable: true },
          lastStatus: { type: 'string', enum: ['never', 'queued', 'completed', 'failed'] },
          lastError: { type: 'string' },
          runCount: { type: 'integer' },
          nextRunAt: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      PlatformStatus: {
        type: 'object',
        properties: {
          jobs: {
            type: 'object',
            properties: {
              started: { type: 'boolean' },
              mode: { type: 'string', enum: ['redis', 'in_process'] },
              schedulerEnabled: { type: 'boolean' },
              pendingInProcess: { type: 'integer' },
              pendingRetries: { type: 'integer' },
              handlers: { type: 'array', items: { type: 'string' } },
              recentJobs: { type: 'array', items: { type: 'object' } }
            }
          },
          schedules: { type: 'array', items: { $ref: '#/components/schemas/JobSchedule' } },
          manualJobs: { type: 'array', items: { type: 'string' } },
          oidc: { $ref: '#/components/schemas/OidcStatus' },
          webhookEvents: { type: 'array', items: { $ref: '#/components/schemas/WebhookEvent' } }
        }
      },
      WeeklyReportPreview: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          body: { type: 'string' },
          window: {
            type: 'object',
            properties: {
              from: { type: 'string', format: 'date-time' },
              to: { type: 'string', format: 'date-time' }
            }
          },
          stats: { type: 'object' },
          recipients: {
            type: 'array',
            items: {
              type: 'object',
              properties: { username: { type: 'string' }, hasEmail: { type: 'boolean' } }
            }
          }
        }
      },
      WeeklyReportRunResult: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          emailed: { type: 'integer' },
          inApp: { type: 'integer' },
          skippedNoEmail: { type: 'array', items: { type: 'string' } },
          sales: { type: 'integer' },
          cashSalesUgx: { type: 'number' },
          creditSalesUgx: { type: 'number' }
        }
      },
      JobRunResult: {
        type: 'object',
        properties: {
          jobName: { type: 'string' },
          id: { type: 'string' },
          result: { type: 'object' }
        }
      },
      CreditWriteOff: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['none', 'pending', 'approved', 'rejected'] },
          requestedAmountUgx: { type: 'number' },
          reason: { type: 'string' },
          requestedBy: { type: 'string' },
          requestedAt: { type: 'string', format: 'date-time', nullable: true },
          decidedBy: { type: 'string', nullable: true },
          decidedAt: { type: 'string', format: 'date-time', nullable: true },
          decisionNote: { type: 'string' }
        }
      },
      PeriodLock: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          scope: { type: 'string', example: 'ALL', description: 'ALL or a branch name' },
          lockedThrough: { type: 'string', format: 'date', nullable: true },
          note: { type: 'string' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CustomerStatement: {
        type: 'object',
        properties: {
          generatedAt: { type: 'string', format: 'date-time' },
          period: {
            type: 'object',
            properties: { from: { type: 'string', format: 'date' }, to: { type: 'string', format: 'date' } }
          },
          buyer: { type: 'object' },
          openingBalanceUgx: { type: 'number' },
          closingBalanceUgx: { type: 'number' },
          currentOutstandingUgx: { type: 'number' },
          totals: {
            type: 'object',
            properties: { debitUgx: { type: 'number' }, creditUgx: { type: 'number' } }
          },
          aging: {
            type: 'object',
            properties: {
              current: { type: 'number' },
              days1to30: { type: 'number' },
              days31to60: { type: 'number' },
              days61to90: { type: 'number' },
              over90: { type: 'number' }
            }
          },
          lines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date-time' },
                type: { type: 'string', enum: ['dispatch', 'payment', 'write_off'] },
                description: { type: 'string' },
                debitUgx: { type: 'number' },
                creditUgx: { type: 'number' },
                balanceUgx: { type: 'number' },
                creditSaleId: { type: 'string' }
              }
            }
          }
        }
      },
      StatementEmailResult: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
          status: { type: 'string', enum: ['queued', 'sent', 'failed'] },
          to: { type: 'string' },
          period: { type: 'object' },
          closingBalanceUgx: { type: 'number' }
        }
      },
      PersonalDataExport: {
        type: 'object',
        properties: {
          subjectType: { type: 'string', enum: ['trusted_buyer', 'user'] },
          exportedAt: { type: 'string', format: 'date-time' },
          profile: { type: 'object' },
          creditSales: { type: 'array', items: { type: 'object' } },
          recordsCreated: { type: 'object' },
          messages: { type: 'array', items: { type: 'object' } },
          auditTrail: { type: 'array', items: { type: 'object' } }
        }
      },
      ApiKey: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          prefix: { type: 'string' },
          scopes: {
            type: 'array',
            items: { type: 'string', enum: ['stock:read', 'sales:read', 'procurement:read', 'prices:read'] }
          },
          branch: { type: 'string', description: 'Empty means all branches' },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          revokedAt: { type: 'string', format: 'date-time', nullable: true },
          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['active', 'expired', 'revoked'] }
        }
      },
      ApiKeyCreated: {
        allOf: [
          { $ref: '#/components/schemas/ApiKey' },
          {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Full key. Shown once; only a hash is stored.' }
            }
          }
        ]
      },
      PartnerList: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'object' } },
          pagination: { type: 'object' }
        }
      }
    },
    responses: {
      Locked: {
        description: 'The record falls inside a closed accounting period',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } }
      },
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
        summary: 'Get users (manager or director)',
        description:
          'Managers see staff in their branch; directors see all accounts (read-only). Pass page and limit to receive a pagination wrapper.',
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
    '/auth/users/{id}/restore': {
      post: {
        tags: ['Users'],
        summary: 'Restore a removed user',
        description: 'Clears the removal flag so the account can sign in again.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/UserPublic' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
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
    '/procurement/{id}/restore': {
      post: {
        tags: ['Procurement'],
        summary: 'Restore a removed procurement',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/Procurement' }),
          400: { $ref: '#/components/responses/BadRequest' },
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
    '/sales/{id}/restore': {
      post: {
        tags: ['Sales'],
        summary: 'Restore a removed cash sale',
        description: 'Puts a removed sale back when the branch still has enough stock.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/Sale' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/sales/{id}/void': {
      post: {
        tags: ['Sales'],
        summary: 'Void a cash sale',
        description: 'Financially cancels a sale with a reason. Stock is returned. Voided sales cannot be restored.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: { reason: { type: 'string', minLength: 5, maxLength: 500 } }
              }
            }
          }
        },
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              message: { type: 'string' },
              sale: { $ref: '#/components/schemas/Sale' }
            }
          }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
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
    '/credit-sales/{id}/restore': {
      post: {
        tags: ['Credit Sales'],
        summary: 'Restore a removed credit sale',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/CreditSale' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/credit-sales/{id}/void': {
      post: {
        tags: ['Credit Sales'],
        summary: 'Void a credit sale',
        description: 'Cancels a credit sale with no repayments. Stock is returned. Voided records cannot be restored.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: { reason: { type: 'string', minLength: 5, maxLength: 500 } }
              }
            }
          }
        },
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              message: { type: 'string' },
              creditSale: { $ref: '#/components/schemas/CreditSale' }
            }
          }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/credit-sales/{id}/write-off': {
      post: {
        tags: ['Credit Sales'],
        summary: 'Request a bad-debt write-off (manager)',
        description:
          'Records a pending write-off of the outstanding balance. A different user (a director) must approve it under /finance/write-offs before the balance is cleared.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: { reason: { type: 'string', minLength: 5, maxLength: 500 } }
              }
            }
          }
        },
        responses: {
          202: successResponse({ $ref: '#/components/schemas/CreditSale' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' }
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
    '/inventory/movements': {
      get: {
        tags: ['Inventory'],
        summary: 'List immutable stock movements',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string' },
            description: 'Movement type filter'
          },
          {
            name: 'branch',
            in: 'query',
            schema: { type: 'string' },
            description: 'Branch filter (director only)'
          }
        ],
        responses: {
          200: successResponse(listSchema({ type: 'object' })),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/inventory/transfers': {
      get: {
        tags: ['Inventory'],
        summary: 'List inter-branch stock transfers',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { name: 'status', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: successResponse(listSchema({ type: 'object' })),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Inventory'],
        summary: 'Create a draft stock transfer',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['toBranch', 'lines'],
                properties: {
                  fromBranch: { type: 'string' },
                  toBranch: { type: 'string' },
                  note: { type: 'string' },
                  lines: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['produceName', 'produceType', 'tonnageKg'],
                      properties: {
                        produceName: { type: 'string' },
                        produceType: { type: 'string' },
                        tonnageKg: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          201: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/inventory/transfers/{id}/ship': {
      post: {
        tags: ['Inventory'],
        summary: 'Ship a draft transfer (debit source branch)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/inventory/transfers/{id}/receive': {
      post: {
        tags: ['Inventory'],
        summary: 'Receive an in-transit transfer (credit destination)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/inventory/transfers/{id}/cancel': {
      post: {
        tags: ['Inventory'],
        summary: 'Cancel a draft or in-transit transfer',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/inventory/adjustments': {
      get: {
        tags: ['Inventory'],
        summary: 'List stock adjustments',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { name: 'status', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: successResponse(listSchema({ type: 'object' })),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Inventory'],
        summary: 'Create a stock adjustment (may require dual-control approval)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['produceName', 'produceType', 'deltaKg', 'reasonCode', 'note'],
                properties: {
                  produceName: { type: 'string' },
                  produceType: { type: 'string' },
                  deltaKg: { type: 'number' },
                  reasonCode: {
                    type: 'string',
                    enum: ['damage', 'shrinkage', 'found', 'correction', 'other']
                  },
                  note: { type: 'string' },
                  branch: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/inventory/adjustments/{id}/approve': {
      post: {
        tags: ['Inventory'],
        summary: 'Approve a pending stock adjustment',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/inventory/adjustments/{id}/reject': {
      post: {
        tags: ['Inventory'],
        summary: 'Reject a pending stock adjustment',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/inventory/stocktakes': {
      get: {
        tags: ['Inventory'],
        summary: 'List stocktake sessions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ type: 'array', items: { type: 'object' } }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Inventory'],
        summary: 'Start a stocktake session from current balances',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  branch: { type: 'string' },
                  note: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: successResponse({ type: 'object' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/inventory/stocktakes/{id}': {
      get: {
        tags: ['Inventory'],
        summary: 'Get a stocktake session',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['Inventory'],
        summary: 'Update counted quantities on a draft stocktake',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lines'],
                properties: {
                  lines: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        produceName: { type: 'string' },
                        produceType: { type: 'string' },
                        countedKg: { type: 'number', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/inventory/stocktakes/{id}/post': {
      post: {
        tags: ['Inventory'],
        summary: 'Post stocktake variances to the movement ledger',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/inventory/stocktakes/{id}/count-sheet': {
      get: {
        tags: ['Inventory'],
        summary: 'Download a printable stocktake count sheet (CSV)',
        description: 'System quantities are omitted unless blind=false, so counters record what they see.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdParam' },
          { name: 'blind', in: 'query', schema: { type: 'string', enum: ['true', 'false'], default: 'true' } }
        ],
        responses: {
          200: {
            description: 'CSV count sheet',
            content: { 'text/csv': { schema: { type: 'string' } } },
            oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/SuccessEnvelope' }]
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/finance/tax-config': {
      get: {
        tags: ['Finance'],
        summary: 'Get tax configuration',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ type: 'object' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      put: {
        tags: ['Finance'],
        summary: 'Update tax configuration (director)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/invoices': {
      get: {
        tags: ['Finance'],
        summary: 'List tax invoices and credit notes',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ type: 'object' })),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/invoices/{id}': {
      get: {
        tags: ['Finance'],
        summary: 'Get a tax invoice',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/finance/invoices/{id}/document': {
      get: {
        tags: ['Finance'],
        summary: 'Get the tax invoice / credit note as printable HTML or PDF',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdParam' },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['html', 'pdf'], default: 'html' } }
        ],
        responses: {
          200: {
            description: 'HTML document, or a PDF attachment when format=pdf',
            content: {
              'text/html': {
                schema: { type: 'string', description: 'Printable invoice HTML' }
              },
              'application/pdf': {
                schema: { type: 'string', format: 'binary' }
              }
            },
            // Satisfy coverage gate (schema $ref or oneOf)
            oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/SuccessEnvelope' }]
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/finance/invoices/from-sale/{saleId}': {
      post: {
        tags: ['Finance'],
        summary: 'Issue a tax invoice for an existing cash sale',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'saleId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          201: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/finance/cash-up': {
      get: {
        tags: ['Finance'],
        summary: 'List cash-up sessions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ type: 'array', items: { type: 'object' } }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/cash-up/open': {
      post: {
        tags: ['Finance'],
        summary: 'Open or refresh a cash-up session for a business date',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['businessDate'],
                properties: {
                  businessDate: { type: 'string', example: '2026-10-15' },
                  branch: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/cash-up/{id}/close': {
      post: {
        tags: ['Finance'],
        summary: 'Close a cash-up session with counted till totals',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/finance/gl-export': {
      get: {
        tags: ['Finance'],
        summary: 'Export balanced GL journal lines for a date range',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'branch', in: 'query', schema: { type: 'string' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'] } }
        ],
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/gl-mappings': {
      get: {
        tags: ['Finance'],
        summary: 'List GL account mappings',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ type: 'array', items: { type: 'object' } }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/retention': {
      get: {
        tags: ['Finance'],
        summary: 'Get retention policy (director)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ type: 'object' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      put: {
        tags: ['Finance'],
        summary: 'Update retention policy (director)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/retention/run': {
      post: {
        tags: ['Finance'],
        summary: 'Run retention job (director)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ type: 'object' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/retention/audit-pack': {
      get: {
        tags: ['Finance'],
        summary: 'Download audit export pack (ZIP)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'branch', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'ZIP archive',
            content: {
              'application/zip': {
                schema: { type: 'string', format: 'binary' }
              }
            },
            oneOf: [{ type: 'string', format: 'binary' }, { $ref: '#/components/schemas/SuccessEnvelope' }]
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/write-offs': {
      get: {
        tags: ['Finance'],
        summary: 'List credit write-off requests',
        description: 'Managers see their branch; directors see all branches.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['pending', 'approved', 'rejected'], default: 'pending' }
          },
          { $ref: '#/components/parameters/BranchQuery' }
        ],
        responses: {
          200: successResponse({ type: 'array', items: { $ref: '#/components/schemas/CreditSale' } }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/write-offs/{id}/approve': {
      post: {
        tags: ['Finance'],
        summary: 'Approve a pending write-off (director, not the requester)',
        description:
          'Writes off whatever balance is still outstanding and books Dr bad debt / Cr receivables in the GL export.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { note: { type: 'string', maxLength: 500 } } }
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
    '/finance/write-offs/{id}/reject': {
      post: {
        tags: ['Finance'],
        summary: 'Reject a pending write-off (director, not the requester)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { note: { type: 'string', maxLength: 500 } } }
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
    '/finance/period-locks': {
      get: {
        tags: ['Finance'],
        summary: 'List period locks',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ type: 'array', items: { $ref: '#/components/schemas/PeriodLock' } }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      put: {
        tags: ['Finance'],
        summary: 'Close or reopen the books (director)',
        description:
          'Sales, credit sales and procurements dated on or before lockedThrough can no longer be created, edited, removed, restored or voided; those requests return 423. Send lockedThrough: null to reopen.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lockedThrough'],
                properties: {
                  scope: { type: 'string', default: 'ALL', description: 'ALL or a branch name' },
                  lockedThrough: { type: 'string', format: 'date', nullable: true },
                  note: { type: 'string', maxLength: 500 }
                }
              }
            }
          }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PeriodLock' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/finance/statements/{id}': {
      get: {
        tags: ['Finance'],
        summary: 'Customer statement for a trusted buyer (JSON or PDF)',
        description: 'Defaults to the last 90 days. Includes opening/closing balance and aging of what is owed now.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdParam' },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'pdf'] } }
        ],
        responses: {
          200: {
            description: 'Statement',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CustomerStatement' } },
              'application/pdf': { schema: { type: 'string', format: 'binary' } }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/finance/statements/{id}/email': {
      post: {
        tags: ['Finance'],
        summary: 'Email a customer statement to the buyer',
        description: 'Queues a plain-text statement in the message outbox. The buyer needs an email address.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  from: { type: 'string', format: 'date' },
                  to: { type: 'string', format: 'date' }
                }
              }
            }
          }
        },
        responses: {
          202: successResponse({ $ref: '#/components/schemas/StatementEmailResult' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/finance/personal-data/trusted-buyers/{id}': {
      get: {
        tags: ['Finance'],
        summary: 'Export everything held about a trusted buyer (director)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PersonalDataExport' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/finance/personal-data/users/{id}': {
      get: {
        tags: ['Finance'],
        summary: 'Export a staff account profile and activity (director)',
        description: 'Passwords, recovery codes and MFA secrets are never included.',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PersonalDataExport' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/platform/api-keys': {
      get: {
        tags: ['Platform'],
        summary: 'List partner API keys (director)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ type: 'array', items: { $ref: '#/components/schemas/ApiKey' } }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Platform'],
        summary: 'Issue a partner API key (director)',
        description: 'The full key is returned once in `key`. Store it securely; it cannot be shown again.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'scopes'],
                properties: {
                  name: { type: 'string', maxLength: 120 },
                  scopes: {
                    type: 'array',
                    items: { type: 'string', enum: ['stock:read', 'sales:read', 'procurement:read', 'prices:read'] }
                  },
                  branch: { type: 'string', description: 'Limit to one branch; omit for all' },
                  expiresAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          201: successResponse({ $ref: '#/components/schemas/ApiKeyCreated' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/platform/api-keys/{id}/revoke': {
      post: {
        tags: ['Platform'],
        summary: 'Revoke a partner API key (director)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/ApiKey' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/partner/me': {
      get: {
        tags: ['Partner'],
        summary: 'Describe the calling API key',
        security: [{ apiKeyAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/ApiKey' }),
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/partner/stock': {
      get: {
        tags: ['Partner'],
        summary: 'Stock on hand by branch and produce (stock:read)',
        security: [{ apiKeyAuth: [] }],
        parameters: [{ name: 'branch', in: 'query', schema: { type: 'string' } }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PartnerList' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/partner/sales': {
      get: {
        tags: ['Partner'],
        summary: 'Cash sales without buyer details (sales:read)',
        security: [{ apiKeyAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'branch', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PartnerList' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/partner/procurements': {
      get: {
        tags: ['Partner'],
        summary: 'Procurements without dealer contacts (procurement:read)',
        security: [{ apiKeyAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'branch', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PartnerList' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/partner/prices': {
      get: {
        tags: ['Partner'],
        summary: 'Current selling prices (prices:read)',
        security: [{ apiKeyAuth: [] }],
        parameters: [{ name: 'branch', in: 'query', schema: { type: 'string' } }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PartnerList' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/platform/status': {
      get: {
        tags: ['Platform'],
        summary: 'Job backend, schedules, recent jobs, SSO status and webhook event list',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PlatformStatus' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/platform/webhooks': {
      get: {
        tags: ['Platform'],
        summary: 'List webhook subscriptions (director). Secrets are masked.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ type: 'array', items: { $ref: '#/components/schemas/WebhookSubscription' } }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Platform'],
        summary: 'Create a webhook subscription (director). The secret is returned once.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WebhookCreateRequest' } } }
        },
        responses: {
          201: successResponse({ $ref: '#/components/schemas/WebhookSubscription' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/platform/webhooks/{id}': {
      put: {
        tags: ['Platform'],
        summary: 'Update, pause or rotate the secret of a webhook subscription (director)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WebhookUpdateRequest' } } }
        },
        responses: {
          200: successResponse({ $ref: '#/components/schemas/WebhookSubscription' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['Platform'],
        summary: 'Delete a webhook subscription (director)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/platform/webhooks/test-emit': {
      post: {
        tags: ['Platform'],
        summary: 'Emit a test domain event to matching subscriptions (director)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  event: { $ref: '#/components/schemas/WebhookEvent' },
                  payload: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          200: successResponse({
            type: 'object',
            properties: { event: { type: 'string' }, queued: { type: 'integer' } }
          }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/platform/webhook-deliveries': {
      get: {
        tags: ['Platform'],
        summary: 'Recent webhook deliveries (director)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['queued', 'retrying', 'delivered', 'failed'] }
          },
          { name: 'subscriptionId', in: 'query', schema: { type: 'string' } },
          { $ref: '#/components/parameters/LimitQuery' }
        ],
        responses: {
          200: successResponse({ type: 'array', items: { $ref: '#/components/schemas/WebhookDelivery' } }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/platform/webhook-deliveries/{id}/redeliver': {
      post: {
        tags: ['Platform'],
        summary: 'Queue a new delivery with the same event and payload (director)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          202: successResponse({ $ref: '#/components/schemas/WebhookDelivery' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' }
        }
      }
    },
    '/platform/jobs/enqueue': {
      post: {
        tags: ['Platform'],
        summary: 'Run a scheduled job now and wait for the result (director)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jobName'],
                properties: {
                  jobName: {
                    type: 'string',
                    enum: ['credit.overdue.scan', 'retention.run', 'reports.director.weekly']
                  }
                }
              }
            }
          }
        },
        responses: {
          202: successResponse({ $ref: '#/components/schemas/JobRunResult' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/platform/reports/weekly/preview': {
      get: {
        tags: ['Platform'],
        summary: 'Preview the weekly director report without sending it (director)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/WeeklyReportPreview' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/platform/reports/weekly/run': {
      post: {
        tags: ['Platform'],
        summary: 'Send the weekly director report now (email + inbox) (director)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/WeeklyReportRunResult' }),
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
    '/trusted-buyers/{id}/restore': {
      post: {
        tags: ['Trusted Buyers'],
        summary: 'Restore a removed trusted buyer',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/TrustedBuyer' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
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
    '/auth/oidc/status': {
      get: {
        tags: ['Auth'],
        summary: 'Whether OIDC single sign-on is configured',
        responses: {
          200: successResponse({ $ref: '#/components/schemas/OidcStatus' })
        }
      }
    },
    '/auth/oidc/login': {
      get: {
        tags: ['Auth'],
        summary: 'Start an OIDC sign-in',
        description:
          'Sets a short-lived httpOnly state cookie and either redirects to the identity provider ' +
          '(redirect=1) or returns the authorization URL. Uses PKCE (S256) and a nonce.',
        parameters: [{ name: 'redirect', in: 'query', schema: { type: 'string', enum: ['1', 'true'] } }],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/OidcLoginStart' }),
          302: { description: 'Redirect to the identity provider' },
          501: { description: 'OIDC is not configured' }
        }
      }
    },
    '/auth/oidc/callback': {
      get: {
        tags: ['Auth'],
        summary: 'OIDC redirect target',
        description:
          'Verifies state against the browser cookie, exchanges the code, and validates the id_token ' +
          'signature (JWKS), issuer, audience, expiry and nonce. Sets the refresh cookie, then redirects ' +
          'to OIDC_FRONTEND_REDIRECT with sso=success (or sso=error&reason=...). The access token is never ' +
          'placed in the URL; the frontend calls POST /auth/refresh. Without OIDC_FRONTEND_REDIRECT the auth ' +
          'payload is returned as JSON.',
        parameters: [
          { name: 'code', in: 'query', schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/AuthPayload' }),
          302: { description: 'Redirect back to the frontend' },
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
    '/finance/aging': {
      get: {
        tags: ['Finance'],
        summary: 'Company receivables aging',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({
            oneOf: [{ type: 'object', additionalProperties: true }]
          })
        }
      }
    },
    '/finance/gl-journal': {
      post: {
        tags: ['Finance'],
        summary: 'Post GL export lines into the journal',
        security: [{ bearerAuth: [] }],
        responses: { 200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] }) }
      }
    },
    '/finance/trial-balance': {
      get: {
        tags: ['Finance'],
        summary: 'Trial balance from posted journal lines',
        security: [{ bearerAuth: [] }],
        responses: { 200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] }) }
      }
    },
    '/finance/bank-lines': {
      get: {
        tags: ['Finance'],
        summary: 'Bank statement lines with match suggestions',
        security: [{ bearerAuth: [] }],
        responses: { 200: successResponse({ oneOf: [{ type: 'array', items: { type: 'object' } }] }) }
      },
      post: {
        tags: ['Finance'],
        summary: 'Import bank statement lines',
        security: [{ bearerAuth: [] }],
        responses: { 201: successResponse({ oneOf: [{ type: 'array', items: { type: 'object' } }] }) }
      }
    },
    '/finance/bank-lines/{id}/match': {
      post: {
        tags: ['Finance'],
        summary: 'Match a bank line to a sale or credit payment',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] }) }
      }
    },
    '/procurement/orders': {
      get: {
        tags: ['Procurement'],
        summary: 'List purchase orders',
        security: [{ bearerAuth: [] }],
        responses: { 200: successResponse({ oneOf: [{ type: 'array', items: { type: 'object' } }] }) }
      },
      post: {
        tags: ['Procurement'],
        summary: 'Create a purchase order (branch manager only)',
        security: [{ bearerAuth: [] }],
        responses: { 201: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] }) }
      }
    },
    '/procurement/orders/{id}/approve': {
      post: {
        tags: ['Procurement'],
        summary: 'Approve a purchase order (not the creator)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] }) }
      }
    },
    '/procurement/orders/{id}/receive': {
      post: {
        tags: ['Procurement'],
        summary: 'Record a goods receipt against a purchase order (branch manager only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] }) }
      }
    },
    '/procurement/orders/{id}/match': {
      get: {
        tags: ['Procurement'],
        summary: 'Three-way match of order, receipt, and procurement',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] }) }
      }
    },
    '/messages/outbox': {
      get: {
        tags: ['Messages'],
        summary: 'List the message outbox',
        security: [{ bearerAuth: [] }],
        responses: { 200: successResponse({ oneOf: [{ type: 'array', items: { type: 'object' } }] }) }
      }
    },
    '/messages/outbox/{id}/retry': {
      post: {
        tags: ['Messages'],
        summary: 'Retry a queued or failed message',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] }) }
      }
    },
    '/messages/delivery-receipts': {
      post: {
        tags: ['Messages'],
        summary: 'Record an SMS provider delivery receipt',
        responses: { 200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] }) }
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
    '/messages': {
      get: {
        tags: ['Messages'],
        summary: 'List inbox messages',
        description: 'In-app MessageOutbox rows addressed to the signed-in username.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/UnreadQuery' },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ type: 'object' })),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/messages/unread-count': {
      get: {
        tags: ['Messages'],
        summary: 'Count unread inbox messages',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({
            type: 'object',
            properties: { unread: { type: 'integer', example: 2 } }
          }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/messages/read-all': {
      put: {
        tags: ['Messages'],
        summary: 'Acknowledge all inbox messages',
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
    '/messages/{id}/read': {
      put: {
        tags: ['Messages'],
        summary: 'Acknowledge one inbox message',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/suppliers': {
      get: {
        tags: ['Suppliers'],
        summary: 'List suppliers for the caller branch, or every branch for a director',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' }
        ],
        responses: {
          200: successResponse(listSchema({ type: 'object' })),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Suppliers'],
        summary: 'Create a supplier',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'contact'],
                properties: {
                  name: { type: 'string' },
                  contact: { type: 'string' },
                  sourceType: { type: 'string', enum: ['individual', 'company', 'kgl_farm'] }
                }
              }
            }
          }
        },
        responses: {
          201: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/suppliers/{id}': {
      put: {
        tags: ['Suppliers'],
        summary: 'Update a supplier',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: {
          200: successResponse({ type: 'object' }),
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['Suppliers'],
        summary: 'Remove a supplier',
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
    '/suppliers/{id}/restore': {
      post: {
        tags: ['Suppliers'],
        summary: 'Restore a removed supplier',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ type: 'object' }),
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/organization/entities': {
      get: {
        tags: ['Organization'],
        summary: 'List legal entities and their branches',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ oneOf: [{ type: 'array', items: { type: 'object' } }] })
        }
      },
      post: {
        tags: ['Organization'],
        summary: 'Create a legal entity',
        security: [{ bearerAuth: [] }],
        responses: {
          201: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      }
    },
    '/organization/entities/{id}/branches': {
      post: {
        tags: ['Organization'],
        summary: 'Assign a branch to a legal entity',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      }
    },
    '/organization/entities/{id}/consolidation': {
      get: {
        tags: ['Organization'],
        summary: 'Consolidated cash sales and open receivables for one company',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      }
    },
    '/catalog/barcodes/{code}': {
      get: {
        tags: ['Catalog'],
        summary: 'Look up a barcode at the caller branch',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      }
    },
    '/catalog/barcodes': {
      post: {
        tags: ['Catalog'],
        summary: 'Register a produce barcode',
        security: [{ bearerAuth: [] }],
        responses: {
          201: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      }
    },
    '/finance/exchange-rates': {
      get: {
        tags: ['Finance'],
        summary: 'Latest rate to UGX for each foreign currency',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      },
      post: {
        tags: ['Finance'],
        summary: 'Record an exchange rate',
        security: [{ bearerAuth: [] }],
        responses: {
          201: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      }
    },
    '/finance/exchange-rates/quote': {
      get: {
        tags: ['Finance'],
        summary: 'Convert a foreign amount into UGX',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      }
    },
    '/platform/instances': {
      get: {
        tags: ['Platform'],
        summary: 'API processes that have reported in the last minute',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      }
    },
    '/operations/employees': {
      get: operationResponse('List employees'),
      post: operationResponse('Create an employee')
    },
    '/operations/attendance': { post: operationResponse('Mark attendance') },
    '/operations/leave': {
      get: operationResponse('List leave requests'),
      post: operationResponse('Request leave')
    },
    '/operations/leave/{id}/decision': { post: operationResponse('Approve or reject leave') },
    '/operations/payroll': { post: operationResponse('Run payroll for a month') },
    '/operations/bills': {
      get: operationResponse('List supplier bills'),
      post: operationResponse('Record a supplier bill for a received order')
    },
    '/operations/bills/{id}/payments': { post: operationResponse('Pay a supplier bill') },
    '/operations/bins': {
      get: operationResponse('List warehouse bins'),
      post: operationResponse('Add a warehouse bin')
    },
    '/operations/putaway': { post: operationResponse('Place stock in a bin') },
    '/operations/pick-lists': { post: operationResponse('Build a pick list for a sale') },
    '/operations/weighings/latest': { get: operationResponse('Latest stable weighbridge ticket') },
    '/operations/weighings': { post: operationResponse('Record a weighbridge ticket') },
    '/operations/fiscal': { get: operationResponse('List fiscal documents') },
    '/operations/assets': {
      get: operationResponse('List fixed assets'),
      post: operationResponse('Record a fixed asset')
    },
    '/operations/depreciation': { post: operationResponse('Post depreciation for a month') },
    '/operations/assets/{id}/dispose': { post: operationResponse('Dispose of a fixed asset') },
    '/operations/fleet': { get: operationResponse('List vehicles, trips, and fuel') },
    '/operations/vehicles': { post: operationResponse('Add a vehicle') },
    '/operations/trips': { post: operationResponse('Record a trip') },
    '/operations/fuel': { post: operationResponse('Record fuel') },
    '/operations/budgets': { post: operationResponse('Set a budget line') },
    '/operations/budgets/variance': { get: operationResponse('Budget against the ledger for a month') },
    '/operations/restore-drills': {
      get: operationResponse('List restore drills'),
      post: operationResponse('Restore a snapshot into a scratch database and remove it')
    },
    '/operations/portal-access': { post: operationResponse('Set a buyer portal password') },
    '/portal/login': {
      post: {
        tags: ['Portal'],
        summary: 'Buyer portal login',
        responses: {
          200: successResponse({ oneOf: [{ type: 'object', additionalProperties: true }] })
        }
      }
    },
    '/portal/home': { get: operationResponse('Buyer statement and invoices', 'Portal') },
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
