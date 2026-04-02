import httpRequest from '@/services/index';

class AuthService {
  public firstLogin = (data: Record<string, string>) => {
    return httpRequest.post('auth/firstLogin', data);
  };

  public login = (data: Record<string, string>) => {
    return httpRequest.post('auth/login', data);
  };

  public forgot = (data: Record<string, string>) => {
    return httpRequest.post('auth/forgot', data);
  };

  public resetPwd = (data: Record<string, string>) => {
    return httpRequest.post('auth/reset', data);
  };

  public getUser = () => {
    return httpRequest.get('auth/profile');
  };
}

export default new AuthService();
