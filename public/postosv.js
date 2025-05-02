const API = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

document.getElementById("newPostForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = e.target.title.value;
  const content = e.target.content.value;

  const res = await fetch(`${API}/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, content }),
  });

  const data = await res.json();
  if (res.ok) {
    loadPosts();
    e.target.reset();
  } else {
    alert(data.message || "Kunde inte skapa inlägg.");
  }
});

async function loadPosts() {
  const res = await fetch(`${API}/posts`);
  const posts = await res.json();

  const container = document.getElementById("posts");
  container.innerHTML = "";

  posts.forEach(post => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <strong>Av: ${post.writer.username}</strong>

      <form class="commentForm" data-id="${post._id}">
        <input type="text" name="content" placeholder="Kommentera..." required />
        <button type="submit">Skicka</button>
      </form>

      <ul>
        ${post.comments.map(c => `<li>${c.content} - <em>${c.writer}</em></li>`).join("")}
      </ul>
      <hr/>
    `;
    container.appendChild(div);
  });

  document.querySelectorAll(".commentForm").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = e.target.content.value;
      const postId = e.target.dataset.id;

      const res = await fetch(`${API}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, postId }),
      });

      if (res.ok) {
        loadPosts();
      } else {
        const data = await res.json();
        alert(data.message || "Kunde inte skicka kommentar.");
      }
    });
  });
}

loadPosts();