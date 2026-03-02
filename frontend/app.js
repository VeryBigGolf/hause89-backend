const API = "http://localhost:5000/api/v1";
let token = "",
  user = null;
const $ = (id) => document.getElementById(id);
const hdr = () => {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = "Bearer " + token;
  return h;
};
const call = async (m, p, b) => {
  const o = { method: m, headers: hdr() };
  if (b) o.body = JSON.stringify(b);
  return (await fetch(API + p, o)).json();
};
const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");

// Auth
async function doLogin() {
  const d = await call("POST", "/auth/login", {
    email: $("l-em").value,
    password: $("l-pw").value,
  });
  if (d.token) {
    token = d.token;
    enter();
  } else alert(d.msg || d.message || "Login failed");
}
async function doRegister() {
  const d = await call("POST", "/auth/register", {
    name: $("r-nm").value,
    email: $("r-em").value,
    password: $("r-pw").value,
    tel: $("r-tel").value,
    role: $("r-role").value,
  });
  if (d.token) {
    token = d.token;
    enter();
  } else alert(d.msg || d.message || "Register failed");
}
async function enter() {
  const d = await call("GET", "/auth/me");
  if (!d.success) return;
  user = d.data;
  $("uname").textContent = user.name + " (" + user.role + ")";
  $("pg-auth").classList.add("hide");
  $("pg-app").classList.remove("hide");
  $("nav-shops").classList[user.role === "admin" ? "remove" : "add"]("hide");
  loadAppts();
}
async function doLogout() {
  try {
    await call("GET", "/auth/logout");
  } catch (e) {}
  token = "";
  user = null;
  $("pg-auth").classList.remove("hide");
  $("pg-app").classList.add("hide");
  showLogin();
}
function showLogin() {
  $("f-login").classList.remove("hide");
  $("f-reg").classList.add("hide");
}
function showRegister() {
  $("f-login").classList.add("hide");
  $("f-reg").classList.remove("hide");
}

// Nav
function nav(v) {
  ["appointments", "shops"].forEach((x) => {
    $("v-" + x).classList.add("hide");
  });
  $("v-" + v).classList.remove("hide");
  if (v === "appointments") loadAppts();
  if (v === "shops") loadShops();
}

// Appointments
async function loadAppts() {
  const d = await call("GET", "/appointments");
  if (!d.success || !d.data.length) {
    $("atb").innerHTML = "<tr><td colspan=5>No appointments.</td></tr>";
    return;
  }
  $("atb").innerHTML = d.data
    .map((a) => {
      const s = a.shop || {};
      return `<tr><td>${s.name || a.shop || "-"}</td><td>${s.address || "-"}</td><td>${s.tel || "-"}</td><td>${fmt(a.apptDate)}</td><td><button onclick="editAppt('${a._id}','${a.apptDate || ""}')">Edit</button> <button onclick="delAppt('${a._id}')">Del</button></td></tr>`;
    })
    .join("");
}
async function delAppt(id) {
  if (!confirm("Delete?")) return;
  await call("DELETE", "/appointments/" + id);
  loadAppts();
}
function editAppt(id, dt) {
  $("ea-id").value = id;
  $("ea-dt").value = dt ? dt.substring(0, 16) : "";
  $("dlg-ea").showModal();
}
async function saveAppt() {
  const d = await call("PUT", "/appointments/" + $("ea-id").value, {
    apptDate: $("ea-dt").value,
  });
  $("dlg-ea").close();
  if (d.success) loadAppts();
  else alert(d.message || "Failed");
}

// Book
async function openBook() {
  $("dlg-bk").showModal();
  $("bk1").classList.remove("hide");
  $("bk2").classList.add("hide");
  const d = await call("GET", "/shops");
  if (!d.success || !d.data.length) {
    $("slist").innerHTML = "<li>No shops.</li>";
    return;
  }
  $("slist").innerHTML = d.data
    .map(
      (s) =>
        `<li><button onclick="pickShop('${s._id}','${s.name.replace(/'/g, "\\'")}')">${s.name}</button> ${s.address || ""} ${s.tel || ""}</li>`
    )
    .join("");
}
function pickShop(id, nm) {
  $("bk-sid").value = id;
  $("bk-snm").textContent = nm;
  $("bk1").classList.add("hide");
  $("bk2").classList.remove("hide");
  $("bk-dt").value = "";
}
async function confirmBook() {
  const d = await call(
    "POST",
    "/shops/" + $("bk-sid").value + "/appointments",
    { apptDate: $("bk-dt").value }
  );
  $("dlg-bk").close();
  if (d.success) loadAppts();
  else alert(d.message || "Failed");
}

// Admin: Shops
async function loadShops() {
  const d = await call("GET", "/shops");
  if (!d.success || !d.data.length) {
    $("stb").innerHTML = "<tr><td colspan=6>No shops.</td></tr>";
    return;
  }
  $("stb").innerHTML = d.data
    .map(
      (s) =>
        `<tr><td>${s.name}</td><td>${s.address || "-"}</td><td>${s.tel || "-"}</td><td>${fmt(s.openTime)}</td><td>${fmt(s.closeTime)}</td><td><button onclick="editShopDlg('${s._id}','${s.name.replace(/'/g, "\\'")}','${(s.address || "").replace(/'/g, "\\'")}','${s.tel || ""}')">Edit</button> <button onclick="delShop('${s._id}')">Del</button></td></tr>`
    )
    .join("");
}
async function delShop(id) {
  if (!confirm("Delete shop?")) return;
  await call("DELETE", "/shops/" + id);
  loadShops();
}
function openCS() {
  $("dlg-cs").showModal();
  ["cs-nm", "cs-ad", "cs-tel", "cs-op", "cs-cl"].forEach(
    (x) => ($(x).value = "")
  );
}
async function saveCS() {
  const b = { name: $("cs-nm").value, address: $("cs-ad").value };
  const t = $("cs-tel").value,
    o = $("cs-op").value,
    c = $("cs-cl").value;
  if (t) b.tel = t;
  if (o) b.openTime = o;
  if (c) b.closeTime = c;
  const d = await call("POST", "/shops", b);
  $("dlg-cs").close();
  if (d.success) loadShops();
  else alert("Failed");
}
function editShopDlg(id, n, a, t) {
  $("es-id").value = id;
  $("es-nm").value = n;
  $("es-ad").value = a;
  $("es-tel").value = t;
  $("dlg-es").showModal();
}
async function saveES() {
  const b = {};
  const n = $("es-nm").value,
    a = $("es-ad").value,
    t = $("es-tel").value;
  if (n) b.name = n;
  if (a) b.address = a;
  if (t) b.tel = t;
  const d = await call("PUT", "/shops/" + $("es-id").value, b);
  $("dlg-es").close();
  if (d.success) loadShops();
  else alert("Failed");
}
