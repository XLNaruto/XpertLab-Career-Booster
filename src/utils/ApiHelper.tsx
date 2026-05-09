import axios from 'axios';
import { getEncodedCookie } from './reusable';
import { clearCookies } from './CookieComponent';

const appStage = import.meta.env.VITE_APP_STAGE || '';

const URL = {
  uatgogagnerurl: import.meta.env[`VITE_APP_${appStage.toUpperCase()}_API_URL`]
};

export const Securitykey = import.meta.env.VITE_APP_ENCRYPT_KEY || '';

// API HEADER
export const apiHeader = (isFormData: any) => {
  const authToken = '';
  const token = getEncodedCookie('token') || '';

  if (!isFormData) {
    return {
      headers: {
        'x-authorization': authToken,
        'x-token': token,
        'Content-Type': 'application/json'
      }
    };
  }

  if (isFormData) {
    return {
      headers: {
        'x-token': token,
        'x-authorization': authToken,
        'Content-Type': 'multipart/form-data'
      }
    };
  }
};

// API CALL for POST method
export const postData = async (api: any, data: any, headers: any, showAlert = true) => {
  try {
    const url = `${URL.uatgogagnerurl}${api}`;

    const response = await axios.post(url, data, headers);

    if (['401', '403'].includes(String(response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }
    return response;
  } catch (error: any) {
    console.log('error ==============++==+=======+==+', error.message);
    console.log('error ==============++==+=======+==+', error);
    if (['401', '403'].includes(String(error?.response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }
    return error?.response;
  }
};

// API CALL for GET method
export const getData = async (api: any, params: any, headers: any, showAlert = true) => {
  try {
    const url = `${URL.uatgogagnerurl}${api}`;

    const response = await axios.get(url, {
      params: params,
      headers: headers['headers']
    });

    if (['401', '403'].includes(String(response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }
    return response;
  } catch (error: any) {
    console.log('Error:', error.message);
    if (['401', '403'].includes(String(error?.response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }
    return error?.response;
  }
};

// API CALL for PATCH method
export const patchData = async (api: any, data: any, headers: any, showAlert = true) => {
  try {
    const url = `${URL.uatgogagnerurl}${api}`;

    const response = await axios.patch(url, data, headers);

    if (['401', '403'].includes(String(response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }

    return response;
  } catch (error: any) {
    console.log('Error:', error.message);
    console.log('Error:::::::::::::::::::::::::::::::::', error);
    if (['401', '403'].includes(String(error?.response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }
    return error?.response;
  }
};

// API CALL for PUT method
export const putData = async (api: any, data: any, headers: any, showAlert = true) => {
  try {
    const url = `${URL.uatgogagnerurl}${api}`;

    const response = await axios.put(url, data, headers);

    if (['401', '403'].includes(String(response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }
    return response;
  } catch (error: any) {
    console.log('Error:', error.message);
    if (['401', '403'].includes(String(error?.response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }
    return error?.response;
  }
};

// API CALL for DELETE method
export const deleteData = async (api: any, data: any, headers: any, showAlert = true) => {
  try {
    const url = `${URL.uatgogagnerurl}${api}`;

    const response = await axios.delete(url, {
      data,
      ...headers
    });

    if (['401', '403'].includes(String(response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }
    return response;
  } catch (error: any) {
    console.log('Error:', error.message);

    if (['401', '403'].includes(String(error?.response?.status))) {
      clearCookies();
      sessionStorage.clear();
      location.reload();
    }

    return error?.response;
  }
};
