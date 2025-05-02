const API = 'http://localhost:3000/api/writers';

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = e.target.username.value;
  const password = e.target.password.value;

  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('token', data.token);
    window.location.href = 'postosv.html';
  } else {
    alert(data.message || "Inloggning misslyckades.");
  }
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = e.target.username.value;
  const password = e.target.password.value;

  const res = await fetch(`${API}/reg`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  alert(data.message || "Registrering misslyckades.");
});