/* api.js — thin fetch wrapper for the admin API.
   All endpoints are session-authenticated (cookie). On 401 we bounce to login. */
(function () {
  async function request(method, url, body) {
    const opts = {
      method,
      headers: {},
      credentials: 'same-origin',
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);

    if (res.status === 401) {
      location.href = '/admin/login';
      throw new Error('Unauthorized');
    }

    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message = isJson && data && data.error ? data.error : 'Request failed';
      throw new Error(message);
    }
    return data;
  }

  window.api = {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body),
    put: (url, body) => request('PUT', url, body),
    patch: (url, body) => request('PATCH', url, body),
    del: (url, body) => request('DELETE', url, body),
    // Build a query string from an object, skipping empty values.
    qs: (params) => {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') sp.set(k, v);
      });
      const s = sp.toString();
      return s ? '?' + s : '';
    },
  };
})();
