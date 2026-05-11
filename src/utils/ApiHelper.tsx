import axios from 'axios';
import { clearCookies, getCookie } from './CookieComponent';
import { decrypt, decryptData, eLevel, encryptData, getEncodedCookie } from './reusable';

export const URL = {
  apibaseurl: import.meta.env.VITE_APP_API_URL
};

export const public_token = {
  token: import.meta.env.VITE_APP_API_TOKEN
};

export const Securitykey = import.meta.env.VITE_APP_ENCRYPT_KEY || '';

const handleAuthFailure = () => {
  clearCookies();
  sessionStorage.clear();
  location.reload();
};

// API HEADER
export const apiHeader = (isFormData: any, encryptionLevel: any = 0) => {
    const token = getEncodedCookie('token') || '';

  if (!isFormData) {
    return {
      headers: {
        'x-authorization': `Token ${public_token.token}`,
        'x-token': token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Access-Control-Allow-Origin': '*',
        elevel: encryptionLevel
      }
    };
  }

  return {
    headers: {
      'x-authorization': `Token ${public_token.token}`,
      'x-token': token,
      'Content-Type': 'multipart/form-data',
      elevel: encryptionLevel
    }
  };
};

// API CALL for public POST (no auth)
export const postDataNoAccess = async (api: any, data: any, encryptionLevel: any = 0) => {
  try {
    const headers = {
      headers: {
        'x-authorization': `Token ${public_token.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Access-Control-Allow-Origin': '*',
        elevel: encryptionLevel
      }
    };

    const url = `${URL.apibaseurl}${api}`;

    if (!(data instanceof FormData)) {
      data = encryptData(data, eLevel[encryptionLevel]);
    }

    const response = await axios.post(url, data, headers);

    if (String(response?.status) === '200') {
      const elevel = response.headers['x-elevel'] || 0;
      response.data = decryptData(response.data, eLevel[elevel]);
    }

    return response;
  } catch (error: any) {
    console.error('Error in postDataNoAccess:', error.message);
    return undefined;
  }
};

// API CALL for POST method
export const postData = async (api: string, data: any, headers: any) => {
  try {
    const url = `${URL.apibaseurl}${api}`;

    if (!(data instanceof FormData)) {
      data = encryptData(data, eLevel[headers.headers.elevel]);
    }

    const response = await axios.post(url, data, headers);

    if (String(response?.status) === '200') {
      const elevel = response.headers['x-elevel'] || 0;
      const responseData = decryptData(response.data, eLevel[elevel]);
      response.data = responseData;

      if (['401', '403'].includes(String(responseData?.status))) {
        handleAuthFailure();
      }
    }

    return response;
  } catch (error: any) {
    console.error('Error in postData:', error.message);
    return undefined;
  }
};

// API CALL for GET method
export const getData = async (api: string, params: any, headers: any) => {
  try {
    const url = `${URL.apibaseurl}${api}`;
    const response = await axios.get(url, { params, headers: headers.headers });

    if (String(response?.status) === '200') {
      const elevel = response.headers['x-elevel'] || 0;
      const responseData = decryptData(response.data, eLevel[elevel]);
      response.data = responseData;

      if (['401', '403'].includes(String(responseData?.status))) {
        handleAuthFailure();
      }
    }
    return response;
  } catch (error: any) {
    console.error('Error in getData:', error.message);
    return undefined;
  }
};

// API CALL for PATCH method
export const patchData = async (api: string, data: any, headers: any) => {
  try {
    const url = `${URL.apibaseurl}${api}`;

    if (!(data instanceof FormData)) {
      data = encryptData(data, eLevel[headers.headers.elevel]);
    }

    const response = await axios.patch(url, data, headers);

    if (String(response?.status) === '200') {
      const elevel = response.headers['x-elevel'] || 0;
      const responseData = decryptData(response.data, eLevel[elevel]);
      response.data = responseData;

      if (['401', '403'].includes(String(responseData?.status))) {
        handleAuthFailure();
      }
    }

    return response;
  } catch (error: any) {
    console.error('Error in patchData:', error.message);
    return undefined;
  }
};

// API CALL for PUT method
export const putData = async (api: string, data: any, headers: any) => {
  try {
    const url = `${URL.apibaseurl}${api}`;

    if (!(data instanceof FormData)) {
      data = encryptData(data, eLevel[headers.headers.elevel]);
    }

    const response = await axios.put(url, data, headers);

    if (String(response?.status) === '200') {
      const elevel = response.headers['x-elevel'] || 0;
      const responseData = decryptData(response.data, eLevel[elevel]);
      response.data = responseData;

      if (['401', '403'].includes(String(responseData?.status))) {
        handleAuthFailure();
      }
    }
    return response;
  } catch (error: any) {
    console.error('Error in putData:', error.message);
    return undefined;
  }
};

// API CALL for DELETE method
export const deleteData = async (api: string, data: any, headers: any) => {
  try {
    const url = `${URL.apibaseurl}${api}`;

    if (data && !(data instanceof FormData)) {
      data = encryptData(data, eLevel[headers.headers.elevel]);
    }

    const response = await axios.delete(url, { data, headers: headers.headers });

    if (String(response?.status) === '200') {
      const elevel = response.headers['x-elevel'] || 0;
      const responseData = decryptData(response.data, eLevel[elevel]);
      response.data = responseData;

      if (['401', '403'].includes(String(responseData?.status))) {
        handleAuthFailure();
      }
    }

    return response;
  } catch (error: any) {
    console.error('Error in deleteData:', error.message);
    return undefined;
  }
};
