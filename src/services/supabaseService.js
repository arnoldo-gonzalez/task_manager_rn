import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../config/supabase';

const AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const REST_URL = `${SUPABASE_URL}/rest/v1`;

const getAuthHeaders = () => ({
  'apikey': SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
});

const getAuthRequestHeaders = (accessToken) => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
});

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    return {success: false, error: data.msg || data.message || 'An error occurred', data: null};
  }
  return {success: true, error: null, data};
};

export const signUp = async (email, password, username, fullName) => {
  try {
    const response = await fetch(`${AUTH_URL}/signup`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({email, password, username, full_name: fullName}),
    });
    return handleResponse(response);
  } catch (error) {
    return {success: false, error: error.message, data: null};
  }
};

export const signIn = async (email, password) => {
  console.log("INIT LOGIN")
  try {
    const response = await fetch(`${AUTH_URL}/token?grant_type=password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({email, password, gotrue_meta_security: []}),
    });
    console.log(response)
    return handleResponse(response);
  } catch (error) {
    return {success: false, error: error.message, data: null};
  }
};

export const getUserProfile = async (accessToken) => {
  try {
    const response = await fetch(`${AUTH_URL}/user`, {
      method: 'GET',
      headers: getAuthRequestHeaders(accessToken),
    });
    return handleResponse(response);
  } catch (error) {
    return {success: false, error: error.message, data: null};
  }
};

export const getStatuses = async (accessToken) => {
  try {
    const response = await fetch(`${REST_URL}/status_task`, {
      method: 'GET',
      headers: getAuthRequestHeaders(accessToken),
    });
    return handleResponse(response);
  } catch (error) {
    return {success: false, error: error.message, data: null};
  }
};

export const getTasks = async (accessToken, userId) => {
  try {
    const response = await fetch(`${REST_URL}/tasks?user_id=eq.${userId}`, {
      method: 'GET',
      headers: getAuthRequestHeaders(accessToken),
    });
    return handleResponse(response);
  } catch (error) {
    return {success: false, error: error.message, data: null};
  }
};

export const createTask = async (accessToken, data) => {
  try {
    const response = await fetch(`${REST_URL}/tasks`, {
      method: 'POST',
      headers: getAuthRequestHeaders(accessToken),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    return {success: false, error: error.message, data: null};
  }
};

export const updateTask = async (accessToken, taskId, data) => {
  try {
    const response = await fetch(`${REST_URL}/tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      headers: getAuthRequestHeaders(accessToken),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    return {success: false, error: error.message, data: null};
  }
};

export const deleteTask = async (accessToken, taskId) => {
  try {
    const response = await fetch(`${REST_URL}/tasks?id=eq.${taskId}`, {
      method: 'DELETE',
      headers: getAuthRequestHeaders(accessToken),
    });
    if (!response.ok) {
      const data = await response.json();
      return {success: false, error: data.msg || data.message || 'An error occurred', data: null};
    }
    return {success: true, error: null, data: null};
  } catch (error) {
    return {success: false, error: error.message, data: null};
  }
};