// filepath: \workspace\dzydo-club\swagger.ts
// OpenAPI/Swagger documentation generation

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DzydoClub API',
      version: '1.0.0',
      description: 'Мультитенантное приложение для управления клубами дзюдо'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server'
      },
      {
        url: 'https://api.dzydo.local',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from /auth/login'
        }
      },
      schemas: {
        Role: {
          type: 'string',
          enum: ['SUPERADMIN', 'ADMIN', 'COACH', 'JUDGE', 'ATHLETE', 'PARENT'],
          description: 'User role in the system'
        },
        User: {
          type: 'object',
          required: ['id', 'email', 'name', 'role'],
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { $ref: '#/components/schemas/Role' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Club: {
          type: 'object',
          required: ['id', 'name', 'slug'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Athlete: {
          type: 'object',
          required: ['id', 'first_name', 'last_name'],
          properties: {
            id: { type: 'integer' },
            external_id: { type: 'string', format: 'uuid' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            birth_date: { type: 'string', format: 'date' },
            weight_kg: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Group: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            parent_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Tournament: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            starts_at: { type: 'string', format: 'date-time', nullable: true },
            ends_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Match: {
          type: 'object',
          required: ['id', 'tournament_id'],
          properties: {
            id: { type: 'integer' },
            tournament_id: { type: 'integer' },
            athlete_a: { type: 'integer', nullable: true },
            athlete_b: { type: 'integer', nullable: true },
            winner: { type: 'integer', nullable: true },
            round: { type: 'integer' },
            slot: { type: 'integer' },
            result: { type: 'object', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            access: { type: 'string', description: 'JWT access token (15min expiry)' },
            refresh: { type: 'string', description: 'JWT refresh token (30day expiry)' }
          }
        },
        InviteResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'Invitation token (7 days expiry)' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    security: [{ BearerAuth: [] }]
  },
  apis: []
};

export const endpoints = {
  '/health': {
    get: {
      tags: ['System'],
      security: [],
      responses: {
        '200': {
          description: 'System is healthy',
          content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } }
        }
      }
    }
  },

  '/auth/login': {
    post: {
      tags: ['Auth'],
      security: [],
      summary: 'User login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
        '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },

  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      security: [],
      summary: 'Refresh access token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refresh'],
              properties: { refresh: { type: 'string' } }
            }
          }
        }
      },
      responses: {
        '200': { description: 'New access token', content: { 'application/json': { schema: { type: 'object', properties: { access: { type: 'string' } } } } } },
        '401': { description: 'Invalid refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },

  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'User logout',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refresh'],
              properties: { refresh: { type: 'string' } }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Logout successful', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } }
      }
    }
  },

  '/users/invite': {
    post: {
      tags: ['Users'],
      summary: 'Create user invitation (SUPERADMIN/ADMIN only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'role'],
              properties: {
                email: { type: 'string', format: 'email' },
                role: { $ref: '#/components/schemas/Role' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Invitation created', content: { 'application/json': { schema: { $ref: '#/components/schemas/InviteResponse' } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '403': { description: 'Forbidden (insufficient role)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },

  '/users/accept': {
    post: {
      tags: ['Users'],
      security: [],
      summary: 'Accept invitation and register user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'password'],
              properties: {
                token: { type: 'string', description: 'Invitation token' },
                password: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'User created', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
        '404': { description: 'Invitation not found or expired', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },

  '/users': {
    get: {
      tags: ['Users'],
      summary: 'List all users (ADMIN only)',
      parameters: [],
      responses: {
        '200': { description: 'List of users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },

  '/clubs': {
    post: {
      tags: ['Clubs'],
      summary: 'Create new club (SUPERADMIN only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'slug'],
              properties: {
                name: { type: 'string' },
                slug: { type: 'string', pattern: '^[a-z0-9-]+$' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Club created', content: { 'application/json': { schema: { type: 'object', properties: { club: { $ref: '#/components/schemas/Club' }, schema: { type: 'string' } } } } },
        '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    }
  },

  '/athletes': {
    get: {
      tags: ['Athletes'],
      summary: 'List athletes in club (requires X-Club-Id header)',
      parameters: [{ name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }],
      responses: {
        '200': { description: 'List of athletes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Athlete' } } } } }
      }
    },
    post: {
      tags: ['Athletes'],
      summary: 'Create athlete',
      parameters: [{ name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['first_name', 'last_name'],
              properties: {
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                birth_date: { type: 'string', format: 'date' },
                weight_kg: { type: 'number' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Athlete created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Athlete' } } } }
      }
    }
  },

  '/athletes/{id}': {
    get: {
      tags: ['Athletes'],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      responses: {
        '200': { description: 'Athlete details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Athlete' } } } },
        '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
      }
    },
    put: {
      tags: ['Athletes'],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                birth_date: { type: 'string', format: 'date' },
                weight_kg: { type: 'number' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Athlete updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Athlete' } } } }
      }
    },
    delete: {
      tags: ['Athletes'],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      responses: {
        '204': { description: 'Athlete deleted' }
      }
    }
  },

  '/groups': {
    get: {
      tags: ['Groups'],
      summary: 'List groups (requires X-Club-Id header)',
      parameters: [{ name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }],
      responses: {
        '200': { description: 'List of groups', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Group' } } } } }
      }
    },
    post: {
      tags: ['Groups'],
      parameters: [{ name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                parent_id: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Group created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Group' } } } }
      }
    }
  },

  '/groups/{id}': {
    get: {
      tags: ['Groups'],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      responses: {
        '200': { description: 'Group details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Group' } } } }
      }
    },
    put: {
      tags: ['Groups'],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                parent_id: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Group updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Group' } } } }
      }
    },
    delete: {
      tags: ['Groups'],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      responses: {
        '204': { description: 'Group deleted' }
      }
    }
  },

  '/tournaments': {
    get: {
      tags: ['Tournaments'],
      summary: 'List tournaments (requires X-Club-Id header)',
      parameters: [{ name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }],
      responses: {
        '200': { description: 'List of tournaments', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Tournament' } } } } }
      }
    },
    post: {
      tags: ['Tournaments'],
      parameters: [{ name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                starts_at: { type: 'string', format: 'date-time' },
                ends_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Tournament created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tournament' } } } }
      }
    }
  },

  '/tournaments/{id}': {
    get: {
      tags: ['Tournaments'],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      responses: {
        '200': { description: 'Tournament details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tournament' } } } }
      }
    },
    put: {
      tags: ['Tournaments'],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                starts_at: { type: 'string', format: 'date-time' },
                ends_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Tournament updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tournament' } } } }
      }
    },
    delete: {
      tags: ['Tournaments'],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      responses: {
        '204': { description: 'Tournament deleted' }
      }
    }
  },

  '/matches/generate/{tournamentId}': {
    post: {
      tags: ['Matches'],
      summary: 'Generate tournament bracket (Olympic/single-elimination)',
      parameters: [
        { name: 'tournamentId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['participants'],
              properties: {
                participants: { type: 'array', items: { type: 'integer' }, description: 'Array of athlete IDs' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Bracket generated', content: { 'application/json': { schema: { type: 'object', properties: { created: { type: 'integer' }, byes: { type: 'integer' } } } } }
      }
    }
  },

  '/matches/tournament/{tournamentId}': {
    get: {
      tags: ['Matches'],
      summary: 'List matches for tournament',
      parameters: [
        { name: 'tournamentId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      responses: {
        '200': { description: 'List of matches', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Match' } } } } }
      }
    }
  },

  '/matches/{matchId}/result': {
    post: {
      tags: ['Matches'],
      summary: 'Submit match result and promote winner',
      parameters: [
        { name: 'matchId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'X-Club-Id', in: 'header', required: true, schema: { type: 'integer' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                winner: { type: 'integer', description: 'ID of winning athlete' },
                result: {
                  type: 'object',
                  properties: {
                    method: { type: 'string', enum: ['ippon', 'waza-ari', 'shido', 'time'], description: 'Method of victory' }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Result recorded', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } }
      }
    }
  }
};
