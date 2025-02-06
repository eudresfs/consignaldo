# Guia de Segurança

## 🔒 Visão Geral

Este documento descreve as práticas de segurança implementadas no Consignaldo, incluindo autenticação, autorização, proteção de dados e auditoria.

## 🔑 Autenticação

### JWT (JSON Web Tokens)

```typescript
interface JWTConfig {
  secret: string;
  expiresIn: string; // '1h'
  refreshExpiresIn: string; // '7d'
}

interface JWTPayload {
  sub: number;        // ID do usuário
  username: string;   // Nome de usuário
  roles: string[];    // Papéis
  consignante?: number; // ID do consignante (se aplicável)
  iat: number;        // Issued at
  exp: number;        // Expiration
}
```

### Rotação de Tokens

```typescript
@Injectable()
export class AuthService {
  async refresh(token: string): Promise<AuthTokens> {
    const payload = await this.jwtService.verifyAsync(token);
    const user = await this.userService.findById(payload.sub);
    
    return {
      accessToken: await this.generateAccessToken(user),
      refreshToken: await this.generateRefreshToken(user),
    };
  }
}
```

### Rate Limiting

```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitInfo>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);
    
    return this.checkRateLimit(key);
  }
}
```

## 👮 Autorização

### RBAC (Role-Based Access Control)

```typescript
enum Role {
  ADMIN = 'ADMIN',
  GESTOR = 'GESTOR',
  USUARIO = 'USUARIO',
  AUDITOR = 'AUDITOR',
  SISTEMA = 'SISTEMA'
}

interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    { resource: '*', action: '*' }
  ],
  GESTOR: [
    { resource: 'contratos', action: 'create' },
    { resource: 'contratos', action: 'read' },
    { resource: 'contratos', action: 'update' }
  ],
  // ...
};
```

### Guards

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    return this.authService.hasRoles(request.user, requiredRoles);
  }
}
```

## 🛡️ Proteção de Dados

### Criptografia

```typescript
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(
    @Inject('CRYPTO_KEY')
    private readonly cryptoKey: string,
  ) {
    this.key = createHash('sha256')
      .update(cryptoKey)
      .digest();
  }

  async encrypt(text: string): Promise<string> {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  async decrypt(encrypted: string): Promise<string> {
    const data = Buffer.from(encrypted, 'base64');
    const iv = data.slice(0, 16);
    const tag = data.slice(16, 32);
    const text = data.slice(32);

    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(text),
      decipher.final(),
    ]).toString('utf8');
  }
}
```

### Mascaramento de Dados

```typescript
@Injectable()
export class DataMaskingService {
  maskCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.$3-**');
  }

  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = `${local.charAt(0)}***${local.charAt(local.length - 1)}`;
    return `${maskedLocal}@${domain}`;
  }

  maskCard(card: string): string {
    return card.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '****-****-****-$4');
  }
}
```

## 📝 Auditoria

### Eventos

```typescript
interface AuditEvent {
  id: string;
  timestamp: Date;
  action: AuditAction;
  resource: AuditResource;
  userId: number;
  username: string;
  ip: string;
  userAgent: string;
  status: 'SUCCESS' | 'ERROR';
  details?: Record<string, any>;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  error?: string;
}

enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

enum AuditResource {
  USER = 'USER',
  CONTRACT = 'CONTRACT',
  MARGIN = 'MARGIN',
  PAYROLL = 'PAYROLL',
  SETTING = 'SETTING',
}
```

### Interceptor

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => this.logSuccess(request, data, startTime),
        error: (error) => this.logError(request, error, startTime),
      }),
    );
  }
}
```

## 🔍 Validação

### DTOs

```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]*$/)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
    },
  )
  password: string;
}
```

### Pipes

```typescript
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    const object = plainToClass(metadata.metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new ValidationException(this.formatErrors(errors));
    }

    return value;
  }
}
```

## 🌐 Headers de Segurança

```typescript
import helmet from 'helmet';

// main.ts
app.use(helmet());

// Configurações específicas
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
    referrerPolicy: { policy: 'same-origin' },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

## 🔒 CORS

```typescript
// main.ts
app.enableCors({
  origin: ['https://consignaldo.com.br'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 3600,
});
```

## 🛑 Prevenção de Ataques

### XSS

```typescript
// Sanitização de HTML
import { sanitize } from 'class-sanitizer';

export class CreatePostDto {
  @Trim()
  @Sanitize(sanitizeHtml)
  content: string;
}

// Escape de dados na saída
export class PostTransformer {
  transform(post: Post): PostDto {
    return {
      ...post,
      content: escapeHtml(post.content),
    };
  }
}
```

### SQL Injection

```typescript
// Uso do Prisma com parâmetros tipados
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
```

### CSRF

```typescript
import * as csurf from 'csurf';

// main.ts
app.use(csurf());

// Middleware para incluir token CSRF
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});
```

## 📈 Monitoramento

### Logging

```typescript
@Injectable()
export class SecurityLogger {
  private readonly logger = new Logger('Security');

  logSecurityEvent(event: SecurityEvent) {
    this.logger.warn({
      message: event.message,
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Alertas

```typescript
@Injectable()
export class SecurityAlertService {
  private readonly threshold = 5;

  async checkFailedLogins(userId: number) {
    const count = await this.getFailedLoginCount(userId);
    
    if (count >= this.threshold) {
      await this.notifyAdmin({
        type: 'BRUTE_FORCE_ATTEMPT',
        userId,
        count,
      });
      
      await this.blockAccount(userId);
    }
  }
}
```

## 🔄 Backups

### Configuração

```typescript
interface BackupConfig {
  schedule: string; // '0 0 * * *' (diário)
  retention: {
    days: number;
    copies: number;
  };
  storage: {
    type: 's3' | 'local';
    path: string;
    encryption: boolean;
  };
}
```

### Implementação

```typescript
@Injectable()
export class BackupService {
  @Cron('0 0 * * *')
  async createBackup() {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm');
    const filename = `backup-${timestamp}.sql`;

    await this.dumpDatabase(filename);
    await this.encrypt(filename);
    await this.upload(filename);
    await this.cleanup();
  }
}
```

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [TypeScript Security](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
