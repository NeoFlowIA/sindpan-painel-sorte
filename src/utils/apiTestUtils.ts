// Utilities para testar a integração da API SINDPAN
import { sindpanAuthApi, SindpanApiError, LoginData, RegisterData, User } from '@/services/sindpanAuthApi';

export interface TestResult {
  endpoint: string;
  status: 'success' | 'error';
  message: string;
  response?: unknown;
  error?: string;
}

export class ApiTester {
  static async testHealthCheck(): Promise<TestResult> {
    try {
      const response = await sindpanAuthApi.healthcheck();
      return {
        endpoint: 'GET /health',
        status: 'success',
        message: 'API está online e funcionando',
        response
      };
    } catch (error) {
      return {
        endpoint: 'GET /health',
        status: 'error',
        message: 'Falha na conexão com a API',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  static async testRegistration(identifier: string, password: string, bakeryName: string): Promise<TestResult> {
    try {
      const data: Partial<RegisterData> = { password, bakery_name: bakeryName };
      if (identifier.includes('@')) {
        data.email = identifier;
      } else {
        data.cnpj = identifier;
      }

      const response = await sindpanAuthApi.register(data);
      
      return {
        endpoint: 'POST /auth/register',
        status: 'success',
        message: `Padaria '${bakeryName}' cadastrada com sucesso`,
        response: {
          userId: response.user.id,
          email: response.user.email,
          cnpj: response.user.cnpj,
          role: response.user.role,
          bakeryName: response.user.bakery_name,
          hasToken: !!response.accessToken
        }
      };
    } catch (error) {
      let errorMessage = 'Erro no cadastro';
      
      if (error instanceof SindpanApiError) {
        switch (error.status) {
          case 409:
            errorMessage = 'Identificador já está cadastrado';
            break;
          case 400:
            errorMessage = 'Dados inválidos ou incompletos';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      return {
        endpoint: 'POST /auth/register',
        status: 'error',
        message: errorMessage,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  static async testLogin(identifier: string, password: string): Promise<TestResult> {
    try {
      const data: Partial<LoginData> = { password };
      if (identifier.includes('@')) {
        data.email = identifier;
      } else {
        data.cnpj = identifier;
      }

      const response = await sindpanAuthApi.login(data);
      
      return {
        endpoint: 'POST /auth/login',
        status: 'success',
        message: `Login realizado com sucesso para ${response.user.email || response.user.cnpj}`,
        response: {
          userId: response.user.id,
          email: response.user.email,
          cnpj: response.user.cnpj,
          role: response.user.role,
          bakeryName: response.user.bakery_name,
          hasToken: !!response.accessToken
        }
      };
    } catch (error) {
      let errorMessage = 'Erro no login';
      
      if (error instanceof SindpanApiError) {
        switch (error.status) {
          case 401:
            errorMessage = 'Credenciais inválidas';
            break;
          case 400:
            errorMessage = 'Identificador e senha são obrigatórios';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      return {
        endpoint: 'POST /auth/login',
        status: 'error',
        message: errorMessage,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  static async testProfile(): Promise<TestResult> {
    try {
      if (!sindpanAuthApi.isAuthenticated()) {
        return {
          endpoint: 'GET /auth/me',
          status: 'error',
          message: 'Usuário não está autenticado',
          error: 'No access token found'
        };
      }

      const response = await sindpanAuthApi.getProfile();
      
      return {
        endpoint: 'GET /auth/me',
        status: 'success',
        message: `Perfil obtido com sucesso para ${response.user.email || response.user.cnpj}`,
        response: {
          userId: response.user.id,
          email: response.user.email,
          cnpj: response.user.cnpj,
          role: response.user.role,
          bakeryName: response.user.bakery_name,
          createdAt: response.user.created_at
        }
      };
    } catch (error) {
      let errorMessage = 'Erro ao obter perfil';
      
      if (error instanceof SindpanApiError) {
        switch (error.status) {
          case 401:
            errorMessage = 'Token inválido ou expirado';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      return {
        endpoint: 'GET /auth/me',
        status: 'error',
        message: errorMessage,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  static async runFullTest(identifier: string, password: string, bakeryName: string): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 1. Test health check
    console.log('Testing health check...');
    results.push(await this.testHealthCheck());

    // 2. Test registration (only if not already registered)
    console.log('Testing registration...');
    const registrationResult = await this.testRegistration(identifier, password, bakeryName);
    results.push(registrationResult);

    // 3. Test login (even if registration failed, in case user already exists)
    console.log('Testing login...');
    results.push(await this.testLogin(identifier, password));

    // 4. Test profile (only if login was successful)
    if (sindpanAuthApi.isAuthenticated()) {
      console.log('Testing profile...');
      results.push(await this.testProfile());
    }

    return results;
  }

  static logResults(results: TestResult[]): void {
    console.group('🧪 SINDPAN API Test Results');
    
    results.forEach((result, index) => {
      const emoji = result.status === 'success' ? '✅' : '❌';
      console.group(`${emoji} Test ${index + 1}: ${result.endpoint}`);
      console.log('Status:', result.status);
      console.log('Message:', result.message);
      
      if (result.response) {
        console.log('Response:', result.response);
      }
      
      if (result.error) {
        console.log('Error:', result.error);
      }
      
      console.groupEnd();
    });
    
    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    
    console.log(`\n📊 Summary: ${successCount}/${totalCount} tests passed`);
    console.groupEnd();
  }
}

// Exemplo de uso:
export const runExampleTest = async () => {
  const testIdentifier = '00.000.000/0000-00';
  const testPassword = 'senha123';
  const testBakeryName = 'Padaria Teste API';

  const results = await ApiTester.runFullTest(testIdentifier, testPassword, testBakeryName);
  ApiTester.logResults(results);

  return results;
};
