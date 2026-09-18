(function () {
  var form = document.getElementById('auth-form');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var mode = form.getAttribute('data-mode');
    var next = form.getAttribute('data-next') || '/';
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;
    var displayNameEl = document.getElementById('displayName');
    var displayName = displayNameEl ? displayNameEl.value.trim() : '';
    var path = mode === 'signup' ? '/auth/signup' : '/auth/signin';
    var submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;

    var formFields = [
      { id: 'email', value: email },
      { id: 'password', value: password },
    ];
    if (mode === 'signup' && displayName) {
      formFields.push({ id: 'displayName', value: displayName });
    }

    fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        rid: 'emailpassword',
        'st-auth-mode': 'cookie',
      },
      body: JSON.stringify({ formFields: formFields }),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.body && result.body.status === 'OK') {
          window.location.href =
            next.charAt(0) === '/' && next.slice(0, 2) !== '//' ? next : '/';
          return;
        }
        var message = 'Не удалось войти';
        if (result.body && result.body.status === 'WRONG_CREDENTIALS_ERROR') {
          message = 'Неверный email или пароль';
        } else if (result.body && result.body.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
          message = 'Этот email уже зарегистрирован';
        } else if (result.body && result.body.formFields) {
          message = result.body.formFields
            .map(function (f) {
              return f.error;
            })
            .filter(Boolean)
            .join('; ') || message;
        }
        window.location.href =
          (mode === 'signup' ? '/register' : '/login') +
          '?error=' +
          encodeURIComponent(message) +
          '&next=' +
          encodeURIComponent(next);
      })
      .catch(function () {
        window.location.href =
          (mode === 'signup' ? '/register' : '/login') +
          '?error=' +
          encodeURIComponent('Сеть или сервер SuperTokens недоступны');
      })
      .finally(function () {
        if (submit) submit.disabled = false;
      });
  });
})();
