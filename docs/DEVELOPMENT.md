# Guia de Desenvolvimento

## 🚀 Começando

### Ambiente de Desenvolvimento

1. **Requisitos**
   - Node.js 18+
   - PostgreSQL 14+
   - Redis 6+
   - VS Code (recomendado)
   - Docker (opcional)

2. **Extensões VS Code Recomendadas**
   ```json
   {
     "recommendations": [
       "dbaeumer.vscode-eslint",
       "esbenp.prettier-vscode",
       "prisma.prisma",
       "firsttris.vscode-jest-runner",
       "ms-azuretools.vscode-docker"
     ]
   }
   ```

3. **Configuração do Editor**
   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "typescript.preferences.importModuleSpecifier": "relative"
   }
   ```

## 📝 Padrões de Código

### Nomenclatura

1. **Arquivos**
   ```
   ✅ user.service.ts
   ✅ create-user.dto.ts
   ✅ user-role.enum.ts
   ❌ UserService.ts
   ❌ createUserDTO.ts
   ```

2. **Classes**
   ```typescript
   // ✅ Bom
   export class UserService {
     private readonly logger = new Logger(UserService.name);
   }

   // ❌ Ruim
   export class userService {
     private readonly logger = new Logger('userService');
   }
   ```

3. **Interfaces**
   ```typescript
   // ✅ Bom
   interface CreateUserDto {
     username: string;
     email: string;
   }

   // ❌ Ruim
   interface ICreateUser {
     username: string;
     email: string;
   }
   ```

### Estrutura de Arquivos

```
src/
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   └── __tests__/
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   └── __tests__/
├── repositories/
│   ├── user.repository.ts
│   └── __tests__/
├── domain/
│   ├── entities/
│   ├── enums/
│   └── interfaces/
└── infrastructure/
    ├── auth/
    ├── cache/
    └── queue/
```

## 🧪 Testes

### Unitários

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let repository: MockType<UserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useFactory: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get(UserService);
    repository = module.get(UserRepository);
  });

  it('deve criar um usuário', async () => {
    const dto = {
      username: 'teste',
      email: 'teste@exemplo.com',
    };

    repository.create.mockResolvedValue({
      id: 1,
      ...dto,
    });

    const result = await service.create(dto);

    expect(result).toEqual({
      id: 1,
      ...dto,
    });
    expect(repository.create).toHaveBeenCalledWith(dto);
  });
});
```

### E2E

```typescript
// auth.e2e-spec.ts
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'senha123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
      });
  });
});
```

## 🔍 Logging

### Níveis de Log

```typescript
// ✅ Bom
this.logger.log('Usuário criado com sucesso', { userId: user.id });
this.logger.warn('Tentativa de acesso não autorizado', { ip });
this.logger.error('Falha ao processar pagamento', { error });

// ❌ Ruim
console.log('Usuário criado');
console.error(error);
```

### Contexto

```typescript
// ✅ Bom
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async create(dto: CreateUserDto) {
    this.logger.log('Criando novo usuário', {
      username: dto.username,
      context: 'UserService.create',
    });
  }
}

// ❌ Ruim
@Injectable()
export class UserService {
  async create(dto: CreateUserDto) {
    console.log('Criando usuário:', dto);
  }
}
```

## 🔒 Segurança

### Validação de Entrada

```typescript
// ✅ Bom
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
  password: string;
}

// ❌ Ruim
export class CreateUserDto {
  username: string;
  email: string;
  password: string;
}
```

### Autenticação

```typescript
// ✅ Bom
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}

// ❌ Ruim
@Controller('users')
export class UserController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    if (dto.role === 'admin') {
      // Verificar permissões aqui
    }
    return this.userService.create(dto);
  }
}
```

## 🎯 Tratamento de Erros

### Exceções Personalizadas

```typescript
// ✅ Bom
export class UserNotFoundException extends NotFoundException {
  constructor(userId: number) {
    super(`Usuário com ID ${userId} não encontrado`);
  }
}

// ❌ Ruim
throw new Error('Usuário não encontrado');
```

### Filtros de Exceção

```typescript
// ✅ Bom
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest<Request>().url,
      message: exception.message,
    });
  }
}

// ❌ Ruim
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

## 📦 Dependências

### Injeção de Dependências

```typescript
// ✅ Bom
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}
}

// ❌ Ruim
export class UserService {
  private userRepository = new UserRepository();
  private mailService = new MailService();
}
```

### Providers

```typescript
// ✅ Bom
@Module({
  providers: [
    UserService,
    {
      provide: 'MAIL_CONFIG',
      useFactory: (configService: ConfigService) => ({
        host: configService.get('SMTP_HOST'),
        port: configService.get('SMTP_PORT'),
      }),
      inject: [ConfigService],
    },
  ],
})

// ❌ Ruim
@Module({
  providers: [
    UserService,
    MailService,
  ],
})
```

## 🔄 Transações

### Unit of Work

```typescript
// ✅ Bom
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createWithProfile(dto: CreateUserWithProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: dto.username,
          email: dto.email,
        },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
          name: dto.profile.name,
        },
      });

      return user;
    });
  }
}

// ❌ Ruim
@Injectable()
export class UserService {
  async createWithProfile(dto: CreateUserWithProfileDto) {
    const user = await this.userRepository.create(dto);
    await this.profileRepository.create({
      userId: user.id,
      ...dto.profile,
    });
    return user;
  }
}
```

## 🔍 Cache

### Estratégias

```typescript
// ✅ Bom
@Injectable()
export class UserService {
  @CacheKey('user')
  @CacheTTL(3600)
  async findById(id: number) {
    return this.userRepository.findById(id);
  }

  @CacheKey('users')
  @CacheTTL(1800)
  async findAll() {
    return this.userRepository.findAll();
  }

  @CacheEvict('users')
  async create(dto: CreateUserDto) {
    return this.userRepository.create(dto);
  }
}

// ❌ Ruim
@Injectable()
export class UserService {
  private cache = new Map();

  async findById(id: number) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    const user = await this.userRepository.findById(id);
    this.cache.set(id, user);
    return user;
  }
}
```

## 📝 Documentação

### Swagger

```typescript
// ✅ Bom
@ApiTags('Users')
@Controller('users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}

// ❌ Ruim
@Controller('users')
export class UserController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

### JSDoc

```typescript
// ✅ Bom
/**
 * Cria um novo usuário no sistema
 * @param dto - Dados do usuário
 * @throws {UserAlreadyExistsException} Se o email já estiver em uso
 * @returns {Promise<User>} Usuário criado
 */
async create(dto: CreateUserDto): Promise<User> {
  // ...
}

// ❌ Ruim
async create(dto: CreateUserDto): Promise<User> {
  // Cria usuário
  return this.userRepository.create(dto);
}
```

## 🔄 Git

### Commits

```bash
# ✅ Bom
git commit -m "feat: adiciona autenticação JWT"
git commit -m "fix: corrige validação de email"
git commit -m "docs: atualiza README"

# ❌ Ruim
git commit -m "updates"
git commit -m "fix bug"
```

### Branches

```bash
# ✅ Bom
feature/auth-jwt
fix/email-validation
docs/api-documentation

# ❌ Ruim
new-feature
bugfix
update
```

## 🚀 Deploy

### Docker

```dockerfile
# ✅ Bom
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN yarn install

COPY . .
RUN yarn build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/main"]

# ❌ Ruim
FROM node:18

COPY . .
RUN npm install
CMD npm start
```

### Environment

```bash
# ✅ Bom
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379

# ❌ Ruim
DB_HOST=localhost
DB_PORT=5432
DB_USER=user
DB_PASS=pass
DB_NAME=db
```

## 📚 Recursos Adicionais

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Prisma Documentation](https://www.prisma.io/docs/)
