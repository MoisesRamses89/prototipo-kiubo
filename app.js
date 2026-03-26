// app.js - Frontend lógica de contactos y envío de Kiubo!
const API_URL = "http://localhost:3000"; // Cambia por tu URL si despliegas

// Elementos DOM
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const addBtn = document.getElementById("addBtn");
const contactListUl = document.getElementById("contactList");
const contactCountSpan = document.getElementById("contactCount");
const clearAllBtn = document.getElementById("clearAllBtn");

let contacts = [];

// Cargar contactos desde localStorage al iniciar
function loadContacts() {
  const stored = localStorage.getItem("kiubo_contacts");
  if (stored) {
    contacts = JSON.parse(stored);
  } else {
    contacts = [];
  }
  renderContacts();
}

// Guardar contactos en localStorage
function saveContacts() {
  localStorage.setItem("kiubo_contacts", JSON.stringify(contacts));
}

// Renderizar la lista de contactos
function renderContacts() {
  if (!contactListUl) return;

  contactListUl.innerHTML = "";
  if (contacts.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-message";
    emptyLi.innerHTML = `
      <i class="fas fa-users-slash"></i>
      <p>No hay contactos aún.<br>Agrega uno para enviarle un Kiubo!</p>
    `;
    contactListUl.appendChild(emptyLi);
    contactCountSpan.innerText = "(0)";
    return;
  }

  contactCountSpan.innerText = `(${contacts.length})`;

  contacts.forEach((contact, idx) => {
    const li = document.createElement("li");

    const infoDiv = document.createElement("div");
    infoDiv.className = "contact-info";
    infoDiv.innerHTML = `
      <span class="contact-name">${escapeHtml(contact.name)}</span>
      <span class="contact-phone">${escapeHtml(contact.phone)}</span>
    `;

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "contact-actions";

    const smsBtn = document.createElement("button");
    smsBtn.className = "sms-btn";
    smsBtn.innerHTML = '<i class="fas fa-comment-dots"></i> Kiubo!';
    smsBtn.title = "Enviar Kiubo! por SMS";
    smsBtn.onclick = () => sendKiubo(contact.phone, contact.name);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = "Eliminar contacto";
    deleteBtn.onclick = () => deleteContact(idx);

    actionsDiv.appendChild(smsBtn);
    actionsDiv.appendChild(deleteBtn);
    li.appendChild(infoDiv);
    li.appendChild(actionsDiv);
    contactListUl.appendChild(li);
  });
}

// Escapar HTML para prevenir XSS
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Agregar nuevo contacto
function addContact() {
  const name = nameInput.value.trim();
  let phone = phoneInput.value.trim();

  if (!name || !phone) {
    alert("Por favor, completa el nombre y el número de teléfono.");
    return;
  }

  // Validación básica de teléfono (acepta +, números, guiones, espacios)
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{4,12}$/;
  if (!phoneRegex.test(phone)) {
    alert("Ingresa un número válido (incluye código país, ej: +521234567890)");
    return;
  }

  contacts.push({ name, phone });
  saveContacts();
  renderContacts();

  // Limpiar campos
  nameInput.value = "";
  phoneInput.value = "";
  nameInput.focus();
}

// Eliminar un contacto
function deleteContact(index) {
  if (confirm(`¿Eliminar a ${contacts[index].name} de tus contactos?`)) {
    contacts.splice(index, 1);
    saveContacts();
    renderContacts();
  }
}

// Eliminar todos los contactos
function clearAllContacts() {
  if (contacts.length === 0) return;
  if (confirm("⚠️ ¿Borrar TODOS los contactos? Esta acción no se puede deshacer.")) {
    contacts = [];
    saveContacts();
    renderContacts();
  }
}

// Enviar Kiubo! (SMS) – dos estrategias:
// 1. Si el backend está disponible (Twilio), se usa fetch.
// 2. Fallback: usar el esquema SMS nativo del navegador (sms:)
async function sendKiubo(phone, contactName) {
  if (!phone) {
    alert("Número no válido");
    return;
  }

  const message = "Kiubo! 👋";

  // Primero intentar con backend local (si existe)
  try {
    const response = await fetch(`${API_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message })
    });
    if (response.ok) {
      const data = await response.json();
      alert(`✅ ${data.message || "Kiubo! enviado con éxito a " + contactName}`);
      return;
    } else {
      throw new Error("Backend no disponible");
    }
  } catch (error) {
    // Fallback nativo: abrir el cliente SMS con mensaje predefinido
    const smsUrl = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, "_blank");
    console.warn("Usando fallback SMS nativo", error);
  }
}

// Event listeners
addBtn.addEventListener("click", addContact);
clearAllBtn.addEventListener("click", clearAllContacts);

// Permitir agregar con Enter en los inputs
nameInput.addEventListener("keypress", (e) => { if (e.key === "Enter") addContact(); });
phoneInput.addEventListener("keypress", (e) => { if (e.key === "Enter") addContact(); });

// Inicializar
loadContacts();