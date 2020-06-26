import { serialize } from "./helpers";

const baseUrl = process.env.REACT_APP_API_URL;
const authUrl = process.env.REACT_APP_AUTH_URL;
const clientId = process.env.REACT_APP_CLIENT_ID;
const brandId = process.env.REACT_APP_BRAND_ID;

const requestException = (message, response, exception, extracted) => {
  this.message = `${message || "An unknown exception was triggered."}`;
  this.stack = new Error().stack;
  this.response = response;
  this.exception = exception;
  this.extracted = extracted;
};

const fiveHundredError = {
  status: 500,
  code: "errors.server.internal",
  title: "Internal Server Error",
  detail: "Internal server error. Please contact support.",
};

const handleReponse = (response) => {
  const { status, statusText } = response;
  if (status >= 500) {
    throw fiveHundredError;
  }
  if (statusText === "NO CONTENT" || status === 204) {
    return true;
  }
  const requestWasSuccessful = status >= 200 && status < 300;
  try {
    return response.json().then((parsed) => {
      if (requestWasSuccessful) return parsed;
      throw parsed;
    });
  } catch (err) {
    throw new requestException("Response could not be parsed", response, err);
  }
};

export const request = (
  endpoint,
  method = "GET",
  data = null,
  timeout = null,
  token = null
) => {
  let didTimeOut = false;
  return new Promise((resolve, reject) => {
    let timer;
    if (timeout) {
      timer = setTimeout(() => {
        didTimeOut = true;
        reject(new Error("Request timed out"));
      }, timeout);
    }
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "client-id": `${clientId}`,
      "brand-id": `${brandId}`,
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    let options = {
      method: method,
      headers: headers,
    };
    if (data) options.body = JSON.stringify(data);
    fetch(`${baseUrl}${endpoint}`, options)
      .then(handleReponse)
      .then((json) => {
        if (didTimeOut) return;
        resolve(json);
      })
      .catch((err) => {
        if (didTimeOut) return;
        err.code ? reject(err) : reject(fiveHundredError);
      })
      .finally(() => {
        if (timeout) clearTimeout(timer);
      });
  });
};

export const authRequest = (endpoint, data) => {
  return new Promise((resolve, reject) => {
    data.client_id = clientId;
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: serialize(data),
    };
    fetch(`${authUrl}/oauth2${endpoint}`, options)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error_description);
        resolve(json);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
