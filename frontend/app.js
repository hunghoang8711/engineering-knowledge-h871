const config = window.H871_SUPABASE_CONFIG || {};
const form = document.querySelector("#search-form");
const input = document.querySelector("#global-search");
const message = document.querySelector("#search-message");
const resultsEl = document.querySelector("#search-results");
const authForm = document.querySelector("#auth-form");
const emailInput = document.querySelector("#auth-email");
const passwordInput = document.querySelector("#auth-password");
const authMessage = document.querySelector("#auth-message");
const signUpButton = document.querySelector("#sign-up-button");
const signOutButton = document.querySelector("#sign-out-button");
const userStatus = document.querySelector("#user-status");
const connectionStatus = document.querySelector("#connection-status");
const searchButton = form?.querySelector('button[type="submit"]');

let client = null;
let currentRole = null;

function isConfigured() {
  return typeof config.url === "string" &&
    /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/.test(config.url) &&
    typeof config.anonKey === "string" &&
    config.anonKey.length > 20 &&
    !config.url.includes("YOUR_PROJECT_REF") &&
    !config.anonKey.includes("YOUR_SUPABASE");
}

function setAuthMessage(text, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = text;
  authMessage.classList.toggle("error", isError);
}

function setSearchMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function clearResults() {
  if (resultsEl) resultsEl.replaceChildren();
}

function renderResults(groups) {
  clearResults();
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  if (!total) {
    const empty = document.createElement("p");
    empty.className = "result-empty";
    empty.textContent = "No matching records found.";
    resultsEl?.append(empty);
    return;
  }
  for (const group of groups) {
    if (!group.items.length) continue;
    const section = document.createElement("section");
    section.className = "result-group";
    const heading = document.createElement("h3");
    heading.textContent = group.label;
    section.append(heading);
    for (const item of group.items) {
      const card = document.createElement("article");
      card.className = "result-item";
      const title = document.createElement("strong");
      title.textContent = item.title || item.name || "Untitled";
      card.append(title);
      const detail = document.createElement("p");
      detail.textContent = item.description || item.summary || item.content || item.notes || item.status || item.category || "No additional details";
      card.append(detail);
      if (item.code) {
        const code = document.createElement("span");
        code.className = "result-meta";
        code.textContent = item.code;
        card.append(code);
      }
      section.append(card);
    }
    resultsEl?.append(section);
  }
}

async function loadUserState() {
  if (!client) return;
  const { data: { session }, error } = await client.auth.getSession();
  if (error) {
    setAuthMessage(error.message, true);
    return;
  }
  const signedIn = Boolean(session?.user);
  if (userStatus) userStatus.textContent = signedIn ? session.user.email : "Not signed in";
  if (signOutButton) signOutButton.hidden = !signedIn;
  if (signUpButton) signUpButton.hidden = signedIn;
  if (searchButton) searchButton.disabled = !signedIn;
  currentRole = null;
  if (!signedIn) {
    connectionStatus && (connectionStatus.textContent = "Supabase connected · Sign in required");
    setAuthMessage("Sign in with an authorized H871 account to access records.");
    setSearchMessage("Sign in to search H871 records.");
    return;
  }
  const { data: roleRow, error: roleError } = await client
    .from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle();
  if (roleError) {
    setAuthMessage("Signed in, but role lookup failed: " + roleError.message, true);
    return;
  }
  currentRole = roleRow?.role || null;
  connectionStatus && (connectionStatus.textContent = currentRole ? "Connected · " + currentRole : "Connected · role not assigned");
  setAuthMessage(currentRole
    ? "Signed in. Your workspace role is: " + currentRole + "."
    : "Account created/signed in, but no role is assigned yet. Ask the H871 administrator to grant viewer, editor, or admin access.", !currentRole);
  setSearchMessage(currentRole
    ? "Search across projects, customers, documents and approved knowledge entries."
    : "Your account has no assigned role yet. Records remain inaccessible until an administrator assigns one.", !currentRole);
  updateWriteAccess();
}

if (!isConfigured() || !window.supabase?.createClient) {
  connectionStatus && (connectionStatus.textContent = "Supabase not configured");
  setAuthMessage(!isConfigured() ? "Supabase configuration is missing or still contains placeholders. Check frontend/supabase-config.js." : "The Supabase JavaScript library did not load. Refresh the page or check whether your network/browser blocks the CDN.", true);
  setSearchMessage("Search is disabled until the dedicated H871 Supabase project is configured.");
  if (searchButton) searchButton.disabled = true;
} else {
  client = window.supabase.createClient(config.url, config.anonKey);
  connectionStatus && (connectionStatus.textContent = "Supabase configured");
  loadUserState();
  client.auth.onAuthStateChange(() => {
    // Defer follow-up API calls so they do not run inside the auth callback.
    window.setTimeout(loadUserState, 0);
  });
}

authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client) return setAuthMessage("Supabase is not configured yet.", true);
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return setAuthMessage(error.message, true);
  setAuthMessage("Signed in successfully.");
  await loadUserState();
});

signUpButton?.addEventListener("click", async () => {
  if (!client) return setAuthMessage("Supabase is not configured yet.", true);
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password || password.length < 6) {
    return setAuthMessage("Enter a valid email and a password with at least 6 characters.", true);
  }
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) return setAuthMessage(error.message, true);
  if (!data.session) {
    setAuthMessage("Account request created. Check your email to confirm the account, then sign in. An admin must assign your role.");
  } else {
    setAuthMessage("Account created and signed in. An admin must assign your role before you can access records.");
    await loadUserState();
  }
});

signOutButton?.addEventListener("click", async () => {
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) return setAuthMessage(error.message, true);
  clearResults();
  setAuthMessage("Signed out.");
  await loadUserState();
});

const writeAccessLabel = document.querySelector("#write-access-label");
const writeForms = ["project-form","customer-form","document-form","knowledge-form"]
  .map(id => document.querySelector("#" + id)).filter(Boolean);

function updateWriteAccess() {
  const canWrite = ["admin","editor"].includes(currentRole);
  if (writeAccessLabel) writeAccessLabel.textContent = !currentRole ? "Sign in required" : canWrite ? "Write access · " + currentRole : "Read only · viewer";
  for (const recordForm of writeForms) {
    for (const control of recordForm.querySelectorAll("input,textarea,select,button")) control.disabled = !canWrite;
  }
}
function feedback(formId, text, isError = false) {
  const el = document.querySelector("#" + formId + "-feedback");
  if (el) { el.textContent = text; el.classList.toggle("error", isError); }
}
async function saveRecord(formId, table, makeRecord, successText) {
  const recordForm = document.querySelector("#" + formId);
  recordForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!client) return feedback(formId, "Supabase is not configured.", true);
    if (!["admin","editor"].includes(currentRole)) return feedback(formId, "Your account has read-only access.", true);
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return feedback(formId, "Please sign in again.", true);
    const submit = recordForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    feedback(formId, "Saving…");
    try {
      const { error } = await client.from(table).insert({ ...makeRecord(), created_by: session.user.id });
      if (error) throw error;
      recordForm.reset();
      feedback(formId, successText);
    } catch (error) {
      feedback(formId, "Save failed: " + error.message, true);
    } finally { updateWriteAccess(); }
  });
}
saveRecord("project-form","projects",() => ({
  code: document.querySelector("#project-code").value.trim() || null,
  name: document.querySelector("#project-name").value.trim(),
  description: document.querySelector("#project-description").value.trim() || null,
  status: document.querySelector("#project-status").value
}),"Project saved.");
saveRecord("customer-form","customers",() => ({
  name: document.querySelector("#customer-name").value.trim(),
  industry: document.querySelector("#customer-industry").value.trim() || null,
  notes: document.querySelector("#customer-notes").value.trim() || null
}),"Customer saved.");
saveRecord("document-form","documents",() => ({
  title: document.querySelector("#document-title").value.trim(),
  original_filename: document.querySelector("#document-filename").value.trim() || null,
  file_type: document.querySelector("#document-type").value || null,
  relative_path: document.querySelector("#document-path").value.trim() || null,
  summary: document.querySelector("#document-summary").value.trim() || null,
  source_kind: "local_file",
  status: "pending_review"
}),"Document metadata registered for review. No file was uploaded.");
saveRecord("knowledge-form","knowledge_entries",() => ({
  title: document.querySelector("#knowledge-title").value.trim(),
  category: document.querySelector("#knowledge-category").value || null,
  content: document.querySelector("#knowledge-content").value.trim(),
  confidence: document.querySelector("#knowledge-confidence").value,
  review_status: "pending"
}),"Knowledge entry saved as pending review.");
updateWriteAccess();

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input?.value?.trim();
  clearResults();
  if (!client) return setSearchMessage("Supabase is not configured yet.", true);
  if (!query) return setSearchMessage("Enter a keyword to search.");
  const { data: { session } } = await client.auth.getSession();
  if (!session?.user) return setSearchMessage("Sign in before searching.", true);
  if (!currentRole) return setSearchMessage("Your account has no assigned role. Ask an administrator for access.", true);

  setSearchMessage("Searching H871 records…");
  if (searchButton) searchButton.disabled = true;
  try {
    const pattern = "%" + query.replace(/[%_,]/g, " ") + "%";
    const queries = await Promise.all([
      client.from("projects").select("id,code,name,description,status").or(`name.ilike.${pattern},code.ilike.${pattern},description.ilike.${pattern}`).limit(10),
      client.from("customers").select("id,name,industry,notes").or(`name.ilike.${pattern},industry.ilike.${pattern},notes.ilike.${pattern}`).limit(10),
      client.from("documents").select("id,title,original_filename,file_type,summary,status,relative_path").or(`title.ilike.${pattern},original_filename.ilike.${pattern},summary.ilike.${pattern}`).limit(10),
      client.from("knowledge_entries").select("id,title,content,category,confidence,review_status").eq("review_status","approved").or(`title.ilike.${pattern},content.ilike.${pattern},category.ilike.${pattern}`).limit(10)
    ]);
    const labels = ["Projects", "Customers", "Documents", "Approved knowledge"];
    const errors = queries.filter(result => result.error);
    if (errors.length) throw new Error(errors[0].error.message);
    const groups = queries.map((result, index) => ({
      label: labels[index],
      items: result.data || []
    }));
    const total = groups.reduce((sum, group) => sum + group.items.length, 0);
    renderResults(groups);
    setSearchMessage(`Found ${total} matching record(s) for “${query}”.`);
  } catch (error) {
    setSearchMessage("Search failed: " + error.message, true);
  } finally {
    if (searchButton) searchButton.disabled = false;
  }
});
