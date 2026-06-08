import CryptoJS from 'crypto-js';
import { getCookie, setCookie, setCookieForOneYear } from './CookieComponent';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { Securitykey } from './ApiHelper';
import { useEffect } from 'react';
import { format } from 'date-fns';

// Title Change While Page Changes
export const ChangeTitle = (title: any) => {
  useEffect(() => {
    document.title = 'Xpertlab Career Booster | ' + title;
  }, []);
};

export const toAbsoluteUrl = (pathname: string): string => {
  const baseUrl = import.meta.env.BASE_URL;

  if (baseUrl && baseUrl !== '/') {
    return import.meta.env.BASE_URL + pathname;
  } else {
    return pathname;
  }
};

export const eLevel: any = {
  0: {
    key: false,
    value: false
  },
  1: {
    key: false,
    value: true
  },
  2: {
    key: true,
    value: true
  },
  3: {
    key: true,
    value: false
  }
};

export const AmountDisplay = (amount: any) => {
  amount = +amount;

  if (amount !== null && amount !== undefined && !isNaN(amount)) {
    const formattedAmount = amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formattedAmount;
  }
};

/**
 * Converts Uint8Array to URL-safe Base64 string.
 * Works in both Node.js and browser environments.
 * @param {Uint8Array} bytes - The bytes to encode.
 * @returns {string} - URL-safe Base64 string.
 */
const toUrlSafeBase64 = (bytes:any) => {
  let base64;
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    // Browser environment
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  // Convert to URL-safe Base64: replace + with -, / with _, remove padding =
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Converts URL-safe Base64 string to Uint8Array.
 * Works in both Node.js and browser environments.
 * @param {string} base64 - URL-safe Base64 string.
 * @returns {Uint8Array} - Decoded bytes.
 */
const fromUrlSafeBase64 = (base64:any) => {
  // Convert from URL-safe Base64: replace - with +, _ with /, add padding
  let standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (standardBase64.length % 4 !== 0) {
    standardBase64 += '=';
  }

  let binary;
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    binary = Buffer.from(standardBase64, 'base64').toString('binary');
  } else {
    // Browser environment
    binary = atob(standardBase64);
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * Encrypts text using XOR + URL-safe Base64.
 * Handles all Unicode characters (UTF-8) and is URL/browser-friendly.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} - Encrypted text (URL-safe Base64 format).
 */
export const encrypt = (text:any) => {
  const key = Securitykey || '';
  // Convert text to UTF-8 bytes using TextEncoder (handles all Unicode)
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(String(text));
  const keyBytes = encoder.encode(key);

  // XOR each byte with the key
  const encrypted = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return toUrlSafeBase64(encrypted);
};

/**
 * Decrypts URL-safe Base64 + XOR encrypted text.
 * Handles all Unicode characters (UTF-8) and is URL/browser-friendly.
 * @param {string} encryptedText - The encrypted text in URL-safe Base64 format.
 * @returns {string} - Decrypted plaintext.
 */
export const decrypt = (encryptedText:any) => {
  const key = Securitykey || '';
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);

  // Decode URL-safe Base64 to bytes
  const encryptedBytes = fromUrlSafeBase64(String(encryptedText));

  // XOR each byte with the key to decrypt
  const decrypted = new Uint8Array(encryptedBytes.length);
  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  // Convert bytes back to string using TextDecoder (handles all Unicode)
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(decrypted);
};

/**
 * Encrypts an object or array based on provided encryption levels.
 * @param {object|Array} data - The object or array to encrypt
 * @param {object} keyLevel - Encryption level object with 'key' and 'value' properties
 * @returns {object|Array} - Encrypted result
 */
export const encryptData = (data: any, keyLevel: any) => {
  // If data is not an object/array, return as is.
  if (data === null || typeof data !== "object") return data;

  const { key: isKeyEncrypted, value: isValueEncrypted } = keyLevel;

  // Create the root container depending on data type.
  const root = Array.isArray(data) ? [] : {};
  // Stack items: { orig: original data, copy: new container }
  const stack = [{ orig: data, copy: root }];

  while (stack.length) {
    const { orig, copy }: any = stack.pop();

    if (Array.isArray(orig)) {
      // Process array elements.
      for (let i = 0; i < orig.length; i++) {
        const item = orig[i];
        if (Array.isArray(item)) {
          const newArr = [] as any;
          copy[i] = newArr;
          stack.push({ orig: item, copy: newArr });
        } else if (item instanceof Date) {
          copy[i] = isValueEncrypted
            ? encrypt(item.toISOString())
            : item.toISOString();
        } else if (item !== null && typeof item === "object") {
          const newObj = {};
          copy[i] = newObj;
          stack.push({ orig: item, copy: newObj });
        } else if (typeof item === "string") {
          copy[i] = isValueEncrypted ? encrypt(item) : item;
        } else {
          copy[i] = item;
        }
      }
    } else {
      // Process object properties.
      for (const origKey in orig) {
        if (Object.prototype.hasOwnProperty.call(orig, origKey)) {
          // Encrypt the key if required.
          const newKey = isKeyEncrypted ? encrypt(String(origKey)) : origKey;
          const val = orig[origKey];

          if (Array.isArray(val)) {
            const newArr = [] as any;
            copy[newKey] = newArr;
            stack.push({ orig: val, copy: newArr });
          } else if (val instanceof Date) {
            copy[newKey] = isValueEncrypted
              ? encrypt(val.toISOString())
              : val.toISOString();
          } else if (val !== null && typeof val === "object") {
            const newObj = {};
            copy[newKey] = newObj;
            stack.push({ orig: val, copy: newObj });
          } else if (typeof val === "string") {
            copy[newKey] = isValueEncrypted ? encrypt(val) : val;
          } else {
            copy[newKey] = val;
          }
        }
      }
    }
  }

  return root;
};

/**
 * Decrypts an object or array based on provided decryption levels.
 * @param {object|Array} data - The encrypted object or array to decrypt
 * @param {object} keyLevel - Decryption level object with 'key' and 'value' properties
 * @returns {object|Array} - Decrypted result
 */
export const decryptData = (data: any, keyLevel: any) => {
  // If data is not an object/array, return as is.
  if (data === null || typeof data !== "object") return data;

  const { key: isKeyEncrypted, value: isValueEncrypted } = keyLevel;

  // Create the root container depending on data type.
  const root = Array.isArray(data) ? [] : {};
  // Stack items: { orig: encrypted data, copy: new container }
  const stack = [{ orig: data, copy: root }];

  while (stack.length) {
    const { orig, copy }: any = stack.pop();

    if (Array.isArray(orig)) {
      // Process array elements.
      for (let i = 0; i < orig.length; i++) {
        const item = orig[i];
        if (Array.isArray(item)) {
          const newArr = [] as any;
          copy[i] = newArr;
          stack.push({ orig: item, copy: newArr });
        } else if (typeof item === "string") {
          copy[i] = isValueEncrypted ? decrypt(item) : item;
        } else if (item !== null && typeof item === "object") {
          const newObj = {};
          copy[i] = newObj;
          stack.push({ orig: item, copy: newObj });
        } else {
          copy[i] = item;
        }
      }
    } else {
      // Process object properties.
      for (const origKey in orig) {
        if (Object.prototype.hasOwnProperty.call(orig, origKey)) {
          // Decrypt the key if required.
          const newKey = isKeyEncrypted ? decrypt(String(origKey)) : origKey;
          const val = orig[origKey];

          if (Array.isArray(val)) {
            const newArr = [] as any;
            copy[newKey] = newArr;
            stack.push({ orig: val, copy: newArr });
          } else if (typeof val === "string") {
            copy[newKey] = isValueEncrypted ? decrypt(val) : val;
          } else if (val !== null && typeof val === "object") {
            const newObj = {};
            copy[newKey] = newObj;
            stack.push({ orig: val, copy: newObj });
          } else {
            copy[newKey] = val;
          }
        }
      }
    }
  }

  return root;
};

// Encrypt an object by serializing it to a JSON string
export const encryptState = (data: any) => {
  const jsonString = JSON.stringify(data); // Convert object to JSON string
  return encrypt(jsonString); // Use your existing encrypt function
};

// Decrypt and parse the JSON string back to an object
export const decryptState = (data: any) => {
  const decryptedText = decrypt(data); // Use your existing decrypt function
  return JSON.parse(decryptedText); // Parse JSON string back to object
};

export const encryptUrlData = (data: Object) => {
  try {
    return encodeURIComponent(encryptState(data));
  } catch (error) {
    console.error("URL Encryption Error", error);
    return;
  }
};
export const decryptUrlData = (data: any) => {
  try {
    return data ? decryptState(decodeURIComponent(data)) : {};
  } catch (error) {
    console.error("Failed to decrypt URL data:", error);
    return {}; // Fallback in case of error
  }
};

export const getEncodedCookie = (key: any) => {
  const encryptedKey = encodeURIComponent(encrypt(key));
  const cookie = getCookie(encryptedKey);
  return cookie && decrypt(cookie);
};

export const getEncryptedCookieValue = (key: any) => {
  const encryptedKey = encodeURIComponent(encrypt(key));
  const cookie = getCookie(encryptedKey);
  return cookie && cookie;
};

export const checkValue = (value: any) => {
  if (value != '' && value != null && value != undefined) {
    return value;
  } else {
    return '';
  }
};

export const setEncodedCookie = (key: any, value: any) => {
  let formattedValue;

  switch (typeof value) {
    case 'object':
      formattedValue = JSON.stringify(value);
      break;
    case 'number':
      formattedValue = String(value);
      break;
    default:
      formattedValue = value;
      break;
  }

  setCookie(encrypt(key), encrypt(formattedValue), {});
};

export const setEncodedCookieOneYear = (key: any, value: any) => {
  let formattedValue;

  switch (typeof value) {
    case 'object':
      formattedValue = JSON.stringify(value);
      break;
    case 'number':
      formattedValue = String(value);
      break;
    default:
      formattedValue = value;
      break;
  }

  setCookieForOneYear(encrypt(key), encrypt(formattedValue));
};

export function LogOut() {
  return Swal.fire({
    title: "<h4 class='fw-bold text-primary'>Are you sure?</h4>",
    text: 'You want to Logout?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    customClass: {
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary'
    },
    buttonsStyling: false
  });
}

export function DeleteSweetAlert() {
  return Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to delete the record?',
    icon: 'question',
    iconColor: 'red',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    customClass: {
      confirmButton: 'btn btn-danger mr-2 !shadow-none',
      cancelButton: 'btn btn-secondary ml-2 !shadow-none'
    },
    buttonsStyling: false
  });
}

export function NotificationSweetAlert() {
  return Swal.fire({
    title: "<h4 class='fw-bold text-primary'>Start Notification</h4>",
    text: '',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    customClass: {
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary'
    },
    buttonsStyling: false
  });
}

export const inputClass = 'form-control bg-transparent';

export function toasterrormsg(message: any) {
  toast.error(message, {
    position: 'top-right',
    duration: 2000
  });
}

export function toastsuccessmsg(message: any) {
  toast.success(message, {
    position: 'top-right',
    duration: 2000
  });
}

export function toastsuccessmsglesstime(message: any) {
  toast.success(message, {
    position: 'top-right',
    duration: 1000
  });
}

export const getCustomSelectStyles = (themeMode: any = 'light') => ({
  control: (styles: any, { isFocused }: any) => ({
    ...styles,
    backgroundColor: themeMode == 'dark' ? '#1F212A' : '#fff',
    color: themeMode == 'dark' ? '#fff' : '#000',
    border: isFocused
      ? `1px solid ${themeMode == 'dark' ? '#363843' : '#bbb'}`
      : `1px solid ${themeMode == 'dark' ? '#363843' : '#DBDFE9'}`,
    boxShadow: isFocused
      ? `0 0 0 1px ${themeMode == 'dark' ? 'transparent' : 'transparent'}`
      : 'none',
    padding: '0',
    outline: 'none',
    fontSize: '0.8125rem',
    '&:hover': {
      borderColor: themeMode == 'dark' ? '#444444' : '#C4CADA'
    }
  }),
  menu: (styles: any) => ({
    ...styles,
    backgroundColor: themeMode == 'dark' ? '#15171C' : '#fff',
    fontSize: '0.8125rem'
  }),
  singleValue: (styles: any) => ({
    ...styles,
    color: themeMode == 'dark' ? '#fff' : '#000'
  }),
  // placeholder: (styles: any) => ({
  //   ...styles,
  //   color: themeMode == 'dark' ? '#A0A3AD' : '#aaa' // 👈 placeholder color
  // }),
  option: (styles: any, { isFocused, isSelected }: any) => ({
    ...styles,
    backgroundColor: isFocused
      ? themeMode == 'dark'
        ? '#555'
        : '#f0f0f0'
      : themeMode == 'dark'
        ? '#15171C'
        : '#fff',
    color: isSelected
      ? themeMode == 'dark'
        ? '#fff'
        : '#000'
      : themeMode == 'dark'
        ? '#fff'
        : '#000'
  })
});

export const getCustomSelectStyles3 = (themeMode: any = 'light') => ({
  control: (styles: any, { isFocused }: any) => ({
    ...styles,
    backgroundColor: themeMode == 'dark' ? '#1F212A' : '#fff',
    color: themeMode == 'dark' ? '#fff' : '#000',
    border: isFocused
      ? `1px solid ${themeMode == 'dark' ? '#363843' : '#bbb'}`
      : `1px solid ${themeMode == 'dark' ? '#363843' : '#DBDFE9'}`,
    boxShadow: isFocused
      ? `0 0 0 1px ${themeMode == 'dark' ? 'transparent' : 'transparent'}`
      : 'none',
    padding: '0',
    outline: 'none',
    fontSize: '0.8125rem',
    '&:hover': {
      borderColor: themeMode == 'dark' ? '#444444' : '#C4CADA'
    }
  }),
  menu: (styles: any) => ({
    ...styles,
    backgroundColor: themeMode == 'dark' ? '#15171C' : '#fff',
    fontSize: '0.8125rem'
  }),
  singleValue: (styles: any) => ({
    ...styles,
    color: themeMode == 'dark' ? '#fff' : '#000'
  }),
  option: (styles: any, { isFocused, isSelected }: any) => ({
    ...styles,
    backgroundColor: isFocused
      ? themeMode == 'dark'
        ? '#555'
        : '#f0f0f0'
      : themeMode == 'dark'
        ? '#15171C'
        : '#fff',
    color: isSelected
      ? themeMode == 'dark'
        ? '#fff'
        : '#000'
      : themeMode == 'dark'
        ? '#fff'
        : '#000'
  })
});

export const getCustomSelectStyles2 = (themeMode: any) => ({
  control: (styles: any, { isFocused }: any) => ({
    ...styles,
    backgroundColor: themeMode == 'dark' ? '#1F212A' : '#fff',
    color: themeMode == 'dark' ? '#fff' : '#000',
    border: 'none', // remove border completely
    boxShadow: 'none', // no shadow
    padding: 0, // no extra padding
    minHeight: 'auto', // shrink height
    height: 'auto',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    '&:hover': {
      borderColor: 'transparent'
    }
  }),
  indicatorsContainer: () => ({
    display: 'none' // removes the dropdown arrow and right padding
  }),
  dropdownIndicator: () => ({
    display: 'none' // just in case, to ensure arrow is hidden
  }),
  valueContainer: (styles: any) => ({
    ...styles,
    padding: '2px 8px', // compact padding like shown
    // backgroundColor: 'inherit', // light yellow background (matching your image)
    backgroundColor: 'initial',
    borderRadius: '4px',
    fontWeight: 500,
    color: '#F59E0B', // orange text
    justifyContent: 'start'
  }),
  singleValue: (styles: any) => ({
    ...styles,
    color: '#F59E0B', // orange text color
    fontWeight: 500
  }),
  menu: (styles: any) => ({
    ...styles,
    backgroundColor: themeMode == 'dark' ? '#15171C' : '#fff',
    fontSize: '0.8125rem',
    zIndex: 10
  }),
  option: (styles: any, { isFocused, isSelected }: any) => ({
    ...styles,
    backgroundColor: isFocused
      ? themeMode == 'dark'
        ? '#555'
        : '#f0f0f0'
      : themeMode == 'dark'
        ? '#15171C'
        : '#fff',
    color: '#000',
    cursor: 'pointer'
  })
});

export const getJoditConfig = () => ({
  buttons: [
    'source',
    '|',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'superscript',
    'subscript',
    '|',
    'ul',
    'ol',
    'outdent',
    'indent',
    '|',
    'font',
    'fontsize',
    'brush',
    'paragraph',
    '|',
    'table',
    'link',
    '|',
    'align',
    'undo',
    'redo',
    '|',
    'hr',
    'eraser',
    'copyformat',
    '|',
    'symbol',
    'fullsize',
    'print',
    'about'
  ],
  toolbarAdaptive: false,
  toolbarSticky: false,
  toolbarButtonSize: 'middle',
  showCharsCounter: true,
  showWordsCounter: true,
  showXPathInStatusbar: false,
  askBeforePasteHTML: false,
  askBeforePasteFromWord: false,
  defaultActionOnPaste: 'insertclear_html',
  placeholder: '',
  // Add dynamic styles based on the theme
  style: {
    background: '#fff',
    color: '#000'
  },
  uploader: { insertImageAsBase64URI: false }, // Disable image uploads
  filebrowser: { ajax: false, upload: false } // Disable file uploads
});

export const getJoditConfigWithImageUpload = () => ({
  buttons: [
    'source',
    '|',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'superscript',
    'subscript',
    '|',
    'ul',
    'ol',
    'outdent',
    'indent',
    '|',
    'font',
    'fontsize',
    'brush',
    'paragraph',
    '|',
    'image',
    'video',
    'table',
    'link',
    '|', // added 'image' and 'video' buttons
    'align',
    'undo',
    'redo',
    '|',
    'hr',
    'eraser',
    'copyformat',
    '|',
    'symbol',
    'fullsize',
    'print',
    'about'
  ],
  toolbarAdaptive: false,
  toolbarSticky: false,
  toolbarButtonSize: 'middle',
  showCharsCounter: true,
  showWordsCounter: true,
  showXPathInStatusbar: false,
  askBeforePasteHTML: false,
  askBeforePasteFromWord: false,
  defaultActionOnPaste: 'insert_clear_html',
  placeholder: '',
  style: {
    background: '#fff',
    color: '#000'
  },
  filebrowser: {
    ajax: true,
    upload: true,
    url: '/file-browser' // You can replace this with your file browsing endpoint
  }
});

export const dateFirstFormat = (date: any) => {
  return format(new Date(date), 'dd MMMM yyyy');
};

export const dateFirstFormat2 = (date: any) => {
  return format(new Date(date), 'dd/MM/yyyy');
};

export const dateDayFirstFormat = (date: any) => {
  return format(new Date(date), 'EEE, dd MMMM yyyy');
};

export const dateTimeFormat = (date: string | number | Date): string => {
  return format(new Date(date), 'dd/MM/yyyy h:mm a');
};

export const formatDateRange = (startDate: any, endDate: any) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
};

// Format Number into K, M, B
export function formatNumberShort(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '0';

  const ABS = Math.abs(value);

  // Decide which suffix to use
  const suffix =
    ABS >= 1000000000
      ? { divisor: 1000000000, label: 'B' }
      : ABS >= 1000000
        ? { divisor: 1000000, label: 'M' }
        : ABS >= 1000
          ? { divisor: 1000, label: 'K' }
          : { divisor: 1, label: '' };

  const short = (value / suffix.divisor).toFixed(
    // show one decimal only when it adds real information
    value % suffix.divisor === 0 || suffix.label === '' ? 0 : 1
  );

  return `${short.replace(/\.0$/, '')}${suffix.label}`;
}

///////////////////////////////////////

export function DeleteUserSweetAlert(type: 'user' | 'seller') {
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);

  return Swal.fire({
    title: `Delete ${capitalizedType}?`,
    text: `Are you sure you want to delete this ${type}?`,
    icon: 'question',
    iconColor: 'red',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    customClass: {
      confirmButton: 'btn btn-danger mr-2 !shadow-none',
      cancelButton: 'btn btn-secondary ml-2 !shadow-none'
    },
    buttonsStyling: false
  });
}

export function WarnUserSweetAlert(entityType: 'user' | 'seller') {
  const capitalizedEntity = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return Swal.fire({
    title: `Warn ${capitalizedEntity}?`,
    text: `Are you sure you want to issue a warning to this ${entityType}?`,
    icon: 'warning',
    iconColor: 'orange',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    customClass: {
      confirmButton: 'btn btn-warning mr-2 !shadow-none',
      cancelButton: 'btn btn-secondary ml-2 !shadow-none'
    },
    buttonsStyling: false
  });
}

export function RestrictUserSweetAlert(
  entityType: 'user' | 'seller',
  actionType: 'restrict' | 'unrestrict'
) {
  const capitalizedEntity = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const capitalizedAction = actionType.charAt(0).toUpperCase() + actionType.slice(1);

  return Swal.fire({
    title: `${capitalizedAction} ${capitalizedEntity}?`,
    text: `Are you sure you want to ${actionType} this ${entityType}?`,
    icon: 'warning',
    iconColor: actionType === 'restrict' ? 'orange' : 'blue',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    customClass: {
      confirmButton: `btn ${actionType === 'restrict' ? 'btn-warning' : 'btn-info'} mr-2 !shadow-none`,
      cancelButton: 'btn btn-secondary ml-2 !shadow-none'
    },
    buttonsStyling: false
  });
}

export function StatusChangeSweetAlert(
  entityType: 'user' | 'seller',
  actionType: 'restrict' | 'unrestrict' | 'suspend' | 'unsuspend'
) {
  const capitalizedEntity = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const capitalizedAction = actionType.charAt(0).toUpperCase() + actionType.slice(1);

  const colorMap: Record<typeof actionType, { iconColor: string; btnClass: string }> = {
    restrict: { iconColor: 'orange', btnClass: 'btn-warning' },
    unrestrict: { iconColor: 'blue', btnClass: 'btn-info' },
    suspend: { iconColor: 'red', btnClass: 'btn-danger' },
    unsuspend: { iconColor: 'green', btnClass: 'btn-success' }
  };

  const { iconColor, btnClass } = colorMap[actionType];

  return Swal.fire({
    title: `${capitalizedAction} ${capitalizedEntity}?`,
    text: `Are you sure you want to ${actionType} this ${entityType}?`,
    icon: 'warning',
    iconColor,
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    customClass: {
      confirmButton: `btn ${btnClass} mr-2 !shadow-none`,
      cancelButton: 'btn btn-secondary ml-2 !shadow-none'
    },
    buttonsStyling: false
  });
}

export function ApproveShopSweetAlert() {
  return Swal.fire({
    title: 'Approve Seller Shop?',
    text: 'Are you sure you want to approve this shop? The seller will be notified.',
    icon: 'question',
    iconColor: 'green',
    showCancelButton: true,
    confirmButtonText: 'Yes, Approve',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-success mr-2 !shadow-none',
      cancelButton: 'btn btn-secondary ml-2 !shadow-none'
    },
    buttonsStyling: false
  });
}

export function RejectShopSweetAlert() {
  return Swal.fire({
    title: 'Reject Seller Shop?',
    text: 'Are you sure you want to reject this shop? This action cannot be undone.',
    icon: 'warning',
    iconColor: 'red',
    showCancelButton: true,
    confirmButtonText: 'Yes, Reject',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger mr-2 !shadow-none',
      cancelButton: 'btn btn-secondary ml-2 !shadow-none'
    },
    buttonsStyling: false
  });
}
