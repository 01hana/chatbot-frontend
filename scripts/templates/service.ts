import httpRequest from '@/services/index';

class __PascalEntity__Service {
  public getTable = (params: Record<string, any>) => {
    return httpRequest.post('__ENTITY__/getTable', params);
  };

  public getFilters = () => {
    return httpRequest.get('__ENTITY__/filters');
  };

  public get = (id: string) => {
    return httpRequest.get(`__ENTITY__/${id}`);
  };

  public create = (data: Record<string, any>) => {
    return httpRequest.post('__ENTITY__', data);
  };

  public set = (id: string, data: Record<string, any>) => {
    return httpRequest.put(`__ENTITY__/${id}`, data);
  };

  public remove = (data: Record<string, any>) => {
    return httpRequest.delete('__ENTITY__', data);
  };
}

export default new __PascalEntity__Service();
