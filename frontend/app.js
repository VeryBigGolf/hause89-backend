const API = "http://localhost:5000/api/v1";
let token = "";
let user = null;
const getTagById = (id) => document.getElementById(id);
const header = () => {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = "Bearer " + token;
  return h;
};

const call = async (m, p, b) => {
  const o = { method: m, headers: header() };
  if (b) o.body = JSON.stringify(b);
  return (await fetch(API + p, o)).json();
};
const dateFmt = (d) => (d ? new Date(d).toLocaleString() : "-");

// Auth
async function doLogin() {
  const d = await call("POST", "/auth/login", {
    email: getTagById("l-em").value,
    password: getTagById("l-pw").value,
  });
  if (d.token) {
    token = d.token;
    enter();
  } else alert(d.msg || "Login failed");
}
async function doRegister() {
  const d = await call("POST", "/auth/register", {
    name: getTagById("r-nm").value,
    email: getTagById("r-em").value,
    password: getTagById("r-pw").value,
    tel: getTagById("r-tel").value,
    role: getTagById("r-role").value,
  });
  if (d.token) {
    token = d.token;
    enter();
  } else alert(d.msg || "Register failed");
}
async function enter() {
  const d = await call("GET", "/auth/me");
  if (!d.success) return;
  user = d.data;
  getTagById("uname").textContent = user.name + " (" + user.role + ")";
  getTagById("pg-auth").classList.add("hide");
  getTagById("pg-app").classList.remove("hide");
  getTagById("nav-shops").classList[user.role === "admin" ? "remove" : "add"](
    "hide"
  );
  loadAppts();
}
async function doLogout() {
  try {
    await call("GET", "/auth/logout");
  } catch (e) {}
  token = "";
  user = null;
  getTagById("pg-auth").classList.remove("hide");
  getTagById("pg-app").classList.add("hide");
  showLogin();
}
function showLogin() {
  getTagById("f-login").classList.remove("hide");
  getTagById("f-reg").classList.add("hide");
}
function showRegister() {
  getTagById("f-login").classList.add("hide");
  getTagById("f-reg").classList.remove("hide");
}

// Nav
function nav(v) {
  ["appointments", "shops"].forEach((x) => {
    getTagById("v-" + x).classList.add("hide");
  });
  getTagById("v-" + v).classList.remove("hide");
  if (v === "appointments") loadAppts();
  if (v === "shops") loadShops();
}

// Appointments
async function loadAppts() {
  const d = await call("GET", "/appointments");
  if (!d.success || !d.data.length) {
    getTagById("atb").innerHTML =
      "<tr><td colspan=5>No appointments.</td></tr>";
    return;
  }
  getTagById("atb").innerHTML = d.data
    .map((a) => {
      const s = a.shop || {};
      return `
<tr>
<td>${s.name || a.shop || "-"}</td>
<td>${s.address || "-"}</td>
<td>${s.tel || "-"}</td>
<td>${dateFmt(a.apptDate)}</td>
<td><button onclick="editAppt('${a._id}','${a.apptDate || ""}')">Edit</button> <button onclick="delAppt('${a._id}')">Del</button></td>
</tr>`;
    })
    .join("");
}
async function delAppt(id) {
  if (!confirm("Delete?")) return;
  await call("DELETE", "/appointments/" + id);
  loadAppts();
}
function editAppt(id, dt) {
  getTagById("ea-id").value = id;
  getTagById("ea-dt").value = dt ? dt.substring(0, 16) : "";
  getTagById("dlg-ea").showModal();
}
async function saveAppt() {
  const d = await call("PUT", "/appointments/" + getTagById("ea-id").value, {
    apptDate: getTagById("ea-dt").value,
  });
  getTagById("dlg-ea").close();
  if (d.success) loadAppts();
  else alert(d.message || "Failed");
}

// Book
async function openBook() {
  getTagById("dlg-bk").showModal();
  getTagById("bk1").classList.remove("hide");
  getTagById("bk2").classList.add("hide");
  const d = await call("GET", "/shops");
  if (!d.success || !d.data.length) {
    getTagById("slist").innerHTML = "<li>No shops.</li>";
    return;
  }
  getTagById("slist").innerHTML = d.data
    .map(
      (s) =>
        `<li><button onclick="pickShop('${s._id}','${s.name.replace(/'/g, "\\'")}')">${s.name}</button> ${s.address || ""} ${s.tel || ""}</li>`
    )
    .join("");
}
function pickShop(id, nm) {
  getTagById("bk-sid").value = id;
  getTagById("bk-snm").textContent = nm;
  getTagById("bk1").classList.add("hide");
  getTagById("bk2").classList.remove("hide");
  getTagById("bk-dt").value = "";
}
async function confirmBook() {
  const d = await call(
    "POST",
    "/shops/" + getTagById("bk-sid").value + "/appointments",
    { apptDate: getTagById("bk-dt").value }
  );
  getTagById("dlg-bk").close();
  if (d.success) loadAppts();
  else alert(d.message || "Failed");
}

// Admin: Shops
async function loadShops() {
  const d = await call("GET", "/shops");
  if (!d.success || !d.data.length) {
    getTagById("stb").innerHTML = "<tr><td colspan=6>No shops.</td></tr>";
    return;
  }
  getTagById("stb").innerHTML = d.data
    .map(
      (s) =>
        `
<tr>
<td>${s.name}</td>
<td>${s.address || "-"}</td>
<td>${s.tel || "-"}</td>
<td>${dateFmt(s.openTime)}</td>
<td>${dateFmt(s.closeTime)}</td>
<td>
<button onclick="editShopDlg('${s._id}','${s.name.replace(/'/g, "\\'")}','${(s.address || "").replace(/'/g, "\\'")}','${s.tel || ""}')">Edit</button>
<button onclick="delShop('${s._id}')">Del</button></td>
</tr>`
    )
    .join("");
}
async function delShop(id) {
  if (!confirm("Delete shop?")) return;
  await call("DELETE", "/shops/" + id);
  loadShops();
}
function openCS() {
  getTagById("dlg-cs").showModal();
  ["cs-nm", "cs-ad", "cs-tel", "cs-op", "cs-cl"].forEach(
    (x) => (getTagById(x).value = "")
  );
}
async function saveCS() {
  const b = {
    name: getTagById("cs-nm").value,
    address: getTagById("cs-ad").value,
  };
  const t = getTagById("cs-tel").value,
    o = getTagById("cs-op").value,
    c = getTagById("cs-cl").value;
  if (t) b.tel = t;
  if (o) b.openTime = o;
  if (c) b.closeTime = c;
  const d = await call("POST", "/shops", b);
  getTagById("dlg-cs").close();
  if (d.success) loadShops();
  else alert("Failed");
}
function editShopDlg(id, n, a, t) {
  getTagById("es-id").value = id;
  getTagById("es-nm").value = n;
  getTagById("es-ad").value = a;
  getTagById("es-tel").value = t;
  getTagById("dlg-es").showModal();
}
async function saveES() {
  const b = {};
  const n = getTagById("es-nm").value,
    a = getTagById("es-ad").value,
    t = getTagById("es-tel").value;
  if (n) b.name = n;
  if (a) b.address = a;
  if (t) b.tel = t;
  const d = await call("PUT", "/shops/" + getTagById("es-id").value, b);
  getTagById("dlg-es").close();
  if (d.success) loadShops();
  else alert("Failed");
}
