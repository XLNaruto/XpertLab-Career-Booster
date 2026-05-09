/* eslint-disable no-useless-escape */
// DOCS: https://javascript.info/cookie

/**
 * Returns the cookie with the given name, or undefined if not found
 *
 * @param  {string} name - cookie name
 * @returns string | null
 */

export function getCookie(name: any) {
  name = "xlcb-" + name;
  if (typeof window === "undefined") {
    return undefined; // Return undefined during SSR (server-side rendering)
  }

  // Client-side code to retrieve the cookie value
  const cookieMatch = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)"
    )
  );

  return cookieMatch ? decodeURIComponent(cookieMatch[1]) : undefined;
}

// export function getCookie(name) {
//   const matches = document.cookie.match(
//     new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
//   )
//   return matches ? decodeURIComponent(matches[1]) : undefined
// }

/**
 * Sets a cookie with the given name, value, and options.
 *
 * @param  {string} name - cookie name
 * @param  {string | number | boolean} value - cookie value
 * @param  {any} cookieOptions - cookie options
 * @returns void
 */
export function setCookie(name: any, value: any, cookieOptions: any) {

  name = "xlcb-" + name;

  const options = {
    path: "/",
    // add other defaults here if necessary
    ...cookieOptions,
  };

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie =
    encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (const optionKey in options) {
    updatedCookie += "; " + optionKey;
    const optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
}

/**
 * Sets a cookie that expires in 1 year.
 *
 * @param  {string} name - cookie name
 * @param  {string | number | boolean} value - cookie value
 */
export function setCookieForOneYear(name: any, value: any) {
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  setCookie(name, value, { expires: oneYearFromNow });
}

/**
 * Deletes a cookie by setting its max-age to -1
 *
 * @param  {string} name
 */
export function deleteCookie(name: any) {
  setCookie(name, "", {
    "max-age": -1,
  });
}

/**
 * Deletes all cookies by setting each of their max-age to -1
 */
// export function clearCookies() {
//   const cookies = document.cookie.split(";");
//   cookies.forEach((cookie) => {
//     let cookieName = cookie.split("=")[0].trim();
//     if (cookieName.startsWith(userStage=="employee"?"xlc-":"xlcb-")) {
//       setCookie(cookieName.replace(userStage=="employee"?"xlc-":"xlcb-", ""), "", {
//         "max-age": -1,
//       });
//     }
//   });
// }

export function clearCookies() {

  const cookies = document.cookie.split(";");
  cookies.forEach((cookie) => {
    let cookieName = cookie.split("=")[0].trim();
    if (cookieName.startsWith("xlcb-")) {
      cookieName = decodeURIComponent(cookieName);

      setCookie(
        cookieName.replace("xlcb-", ""),
        "",
        { "max-age": -1 }
      );
    }
  });
}
