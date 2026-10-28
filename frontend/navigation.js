(() => {
 const $=s=>document.querySelector(s);
 const config=window.H871_SUPABASE_CONFIG||{};
 let client=null,user=null,role=null,active="overview",projects=[],customers=[],documents=[],knowledgeEntries=[],selectedProject=null,moduleLoadToken=0;
 const knownTags=new Set();
 const loadedModules=new Set();
 const officeExt=["pdf","doc","docx","docm","xls","xlsx","xlsm","ppt","pptx","pptm"];
 const defs={
  projects:{title:"Projects",desc:"Projects with linked customers and technical documents."},
  customers:{title:"Customers",desc:"Customer profiles, with end users and intermediary partners."},
  knowledge:{title:"Knowledge Library",desc:"Approved engineering calculations and lessons learned."}
 };
 function canWrite(){return !!user&&["admin","editor"].includes(role);}
 function say(msg,error=false){const el=$("#module-message");if(el){el.textContent=msg;el.classList.toggle("error",error);}}
 function feedback(id,msg,error=false){const el=$("#"+id+"-feedback");if(el){el.textContent=msg;el.classList.toggle("error",error);}}
 function esc(s){return String(s??"");}
 function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
 function backToAppOr(path){try{const ref=document.referrer?new URL(document.referrer):null;const here=new URL(location.href);if(ref&&ref.origin===here.origin&&ref.pathname.startsWith(here.pathname.slice(0,here.pathname.lastIndexOf("/")+1))){history.back();return;}}catch{}location.href=path;}
 function hideOverview(hide){document.querySelectorAll(".main-content > section,.main-content > footer").forEach(el=>{if(!["module-workspace","profile-workspace"].includes(el.id))el.hidden=hide;});const auth=$("#auth-panel");if(auth)auth.hidden=hide||!!user;}
 function activate(tab){
  active=tab;selectedProject=null;
  $("#module-records").hidden=false;$("#module-search").parentElement.hidden=false;$("#module-message").hidden=false;$("#module-detail")?.remove();$("#customer-detail")?.remove();
  document.querySelectorAll("[data-tab]").forEach(a=>a.classList.toggle("active",a.dataset.tab===tab));
  const module=!!defs[tab],profile=tab==="profile"||tab==="settings",overview=tab==="overview"||tab==="search";
  hideOverview(!overview);$("#module-workspace").hidden=!module;$("#profile-workspace").hidden=!profile;
  if(module){$("#module-title").textContent=defs[tab].title;$("#module-eyebrow").textContent=defs[tab].title.toUpperCase();$("#module-description").textContent=defs[tab].desc;document.querySelectorAll("[data-form-mount]").forEach(el=>el.hidden=true);$("#module-create-toggle").hidden=!["projects","customers"].includes(tab);$("#module-create-toggle").textContent=tab==="projects"?"＋ Add project":"＋ Add customer";if(loadedModules.has(tab)){say(tab==="projects"?projects.length+" projects · documents are grouped within each project.":tab==="customers"?customers.length+" customers.":knowledgeEntries.length+" approved entries.");return Promise.resolve();}return loadModule(tab);}
  if(profile){$("#profile-title").textContent=tab==="settings"?"Profile settings":"Profile overview";$("#profile-description").textContent="Account status, access role and profile display name.";}
  if(tab==="overview")window.scrollTo({top:0,behavior:"smooth"});if(tab==="search")$("#search")?.scrollIntoView({behavior:"smooth",block:"start"});
 }
 function addForms(){
  [["project-form","projects"],["customer-form","customers"],["knowledge-form","knowledge"]].forEach(([id,tab])=>{
   const f=$("#"+id);if(!f||f.dataset.moduleMoved)return;
   const mount=make("div","module-editor");mount.dataset.formMount=tab;mount.hidden=true;mount.append(f);$("#module-workspace").append(mount);f.dataset.moduleMoved="1";
  });
  const doc=$("#document-form");if(doc)doc.remove();
 }
 function showCreate(tab){
  if(!["projects","customers","knowledge"].includes(tab))return;
  if(tab==="knowledge"){activate("knowledge");const mount=document.querySelector('[data-form-mount="knowledge"]');if(mount){mount.hidden=false;const f=mount.querySelector("form");if(f)f.hidden=false;mount.scrollIntoView({behavior:"smooth",block:"start"});}return;}
  activate(tab);const mount=document.querySelector('[data-form-mount="'+tab+'"]');if(!mount)return;mount.hidden=false;const form=mount.querySelector("form");if(form)form.hidden=false;const toggle=$("#module-create-toggle");if(toggle)toggle.textContent="Cancel";mount.scrollIntoView({behavior:"smooth",block:"start"});mount.querySelector("input,textarea,select")?.focus({preventScroll:true});
 }
 function makeNewButton(){
  const toggle=$("#module-create-toggle");
  toggle?.addEventListener("click",()=>{const mount=document.querySelector('[data-form-mount="'+active+'"]');if(!mount)return;const opening=mount.hidden;mount.hidden=!opening;const form=mount.querySelector("form");if(form)form.hidden=!opening;toggle.textContent=opening?"Cancel":"＋ Add "+(active==="projects"?"project":"customer");if(opening){mount.scrollIntoView({behavior:"smooth",block:"start"});mount.querySelector("input,textarea,select")?.focus({preventScroll:true});}});
  const menu=$("#add-menu"),trigger=$("#add-menu-trigger");
  trigger?.addEventListener("click",()=>{if(menu)menu.hidden=!menu.hidden;});
  document.querySelectorAll("[data-create]").forEach(b=>b.addEventListener("click",()=>{if(menu)menu.hidden=true;showCreate(b.dataset.create==="project"?"projects":b.dataset.create==="customer"?"customers":"knowledge");}));
  document.addEventListener("contextmenu",e=>{if(e.target.closest(".main-content")&&!e.target.closest("input,textarea,select,button,a,[contenteditable=true]")){e.preventDefault();if(menu){menu.hidden=false;menu.style.position="fixed";menu.style.left=Math.max(8,Math.min(e.clientX,window.innerWidth-220))+"px";menu.style.top=Math.max(8,Math.min(e.clientY,window.innerHeight-150))+"px";}}});
  document.addEventListener("click",e=>{if(menu&&!e.target.closest("#add-menu")&&!e.target.closest("#add-menu-trigger"))menu.hidden=true;});
 }
 function updateCustomerForm(){
  const intermediary=$("#customer-type")?.value==="intermediary";
  $("#end-user-field").hidden=!intermediary;$("#customer-end-user").required=intermediary;
 }
 async function loadCustomers(){
  if(!client||!user){customers=[];return;}
  const {data,error}=await client.from("customers").select("id,name,customer_type,end_user_name,description,industry,notes,created_at").order("name");
  if(error){say("Could not load customers: "+error.message,true);return;}
  customers=data||[];populateCustomerChoices();populateCustomerSuggestions();
 }
 function populateCustomerChoices(){
  const select=$("#project-customers");if(!select)return;const prior=new Set([...select.selectedOptions].map(o=>o.value));select.replaceChildren();
  customers.forEach(c=>{const o=make("option","",c.name+(c.customer_type==="intermediary"&&c.end_user_name?" → "+c.end_user_name:""));o.value=c.id;o.selected=prior.has(c.id);select.append(o);});
 }
 function populateCustomerSuggestions(){
  const list=$("#customer-suggestions"),endList=$("#end-user-suggestions");if(list){list.replaceChildren();customers.forEach(c=>list.append(new Option(c.name)));}if(endList){endList.replaceChildren();const names=[...new Set(customers.flatMap(c=>[c.name,c.end_user_name]).filter(Boolean))];names.forEach(n=>endList.append(new Option(n)));}
 }
 function customerMatch(inputId, hintId){
  const raw=$(inputId).value.trim().toLowerCase();const hint=$(hintId);if(!hint)return;
  if(!raw){hint.textContent="";return;}
  const match=customers.find(c=>[c.name,c.end_user_name].filter(Boolean).some(n=>n.trim().toLowerCase()===raw));
  hint.textContent=match?"A customer with this name already exists. Select the existing record from the Customers tab instead.":"Existing names will be suggested as you type.";
  hint.classList.toggle("error",!!match);
 }
 async function uploadFiles(projectId,files,notes){
  const uploaded=[];for(const file of files){
   const ext=file.name.split(".").pop().toLowerCase();
   if(!officeExt.includes(ext))throw new Error("Unsupported file type: "+file.name+". Only PDF, Word, Excel and PowerPoint files are allowed.");
   if(file.size>50*1024*1024)throw new Error(file.name+" exceeds the 50 MB limit.");
   // Store under an ASCII-only key; retain the original filename in metadata.
   const safeExt=ext.replace(/[^a-z0-9]/g,"")||"bin";
   const path=projectId+"/"+crypto.randomUUID()+"."+safeExt;
   const {error:storageError}=await client.storage.from("h871-project-documents").upload(path,file,{upsert:false,contentType:file.type||undefined});
   if(storageError)throw storageError;
   const {error:rowError}=await client.from("documents").insert({
    project_id:projectId,title:file.name,original_filename:file.name,file_type:ext.toUpperCase(),relative_path:path,
    notes:notes||null,source_kind:"local_file",status:"pending_review",created_by:user.id,updated_by:user.id,created_by_name:user.email||"H871 user",updated_by_name:user.email||"H871 user"
   });
   if(rowError){await client.storage.from("h871-project-documents").remove([path]);throw rowError;}
   uploaded.push(file.name);
  }return uploaded;
 }
 async function loadModule(tab,force=false){
  if(!force&&loadedModules.has(tab))return;
  const requestToken=++moduleLoadToken;
  if(!client||!user){if(active===tab){say("Sign in to view this list.",true);renderRows(tab,[]);}return;}
  if(active===tab)say("Loading…");
  if(tab==="projects"){
   const [{data:p,error:pe},{data:d,error:de}]=await Promise.all([
    client.from("projects").select("id,code,name,description,status,tags,created_at,updated_at").order("updated_at",{ascending:false}).limit(300),
    client.from("documents").select("id,project_id,title,original_filename,file_type,notes,relative_path,status,created_by,updated_by,created_at,updated_at").order("updated_at",{ascending:false}).limit(1000)
   ]);
   if(requestToken!==moduleLoadToken||active!==tab)return;
   if(pe){projects=[];documents=[];renderRows(tab,[]);say("Could not load projects: "+pe.message,true);return;}
   projects=p||[];
   if(de){documents=[];say("Projects loaded; documents could not be loaded: "+de.message,true);}else{documents=d||[];}
   knownTags.clear();projects.forEach(p=>(p.tags||[]).forEach(t=>knownTags.add(t)));populateTagSuggestions();renderRows(tab,projects);loadedModules.add(tab);
   if(!de)say(projects.length+" projects · documents are grouped within each project.");
  }else if(tab==="customers"){
   await loadCustomers();
   const [{data:allProjects,error:projectError},{data:allDocuments,error:documentError}]=await Promise.all([client.from("projects").select("id,code,name,description,status,tags,created_at,updated_at").order("created_at",{ascending:false}).limit(500),client.from("documents").select("id,project_id,title,original_filename,file_type,notes,relative_path,status,created_by,updated_by,created_at,updated_at").order("updated_at",{ascending:false}).limit(1000)]);
   if(requestToken!==moduleLoadToken||active!==tab)return;
   projects=allProjects||[];documents=documentError?[]:(allDocuments||[]);
   knownTags.clear();projects.forEach(p=>(p.tags||[]).forEach(t=>knownTags.add(t)));populateTagSuggestions();renderRows(tab,customers);loadedModules.add(tab);
   if(projectError||documentError)say("Customers loaded; related data warning: "+(projectError||documentError).message,true);else say(customers.length+" customers.");}
  else{
   const {data,error}=await client.from("knowledge_entries").select("id,title,content,category,confidence,review_status,created_at").eq("review_status","approved").order("created_at",{ascending:false}).limit(200);
   if(requestToken!==moduleLoadToken||active!==tab)return;
   if(error){say("Could not load knowledge: "+error.message,true);return;}knowledgeEntries=data||[];renderRows(tab,knowledgeEntries);loadedModules.add(tab);say(knowledgeEntries.length+" approved entries.");
  }
 }
 function renderRows(tab,rows){
  const box=$("#module-records");if(!box)return;box.replaceChildren();const filtered=Array.isArray(rows)?rows:[];
  $("#module-count").textContent=filtered.length+" "+(tab==="projects"?"projects":tab==="customers"?"customers":"entries");
  if(!filtered.length){box.append(make("div","module-empty","No records found yet."));return;}
  if(tab==="projects")filtered.forEach(p=>box.append(projectCard(p)));
  if(tab==="customers")filtered.forEach(c=>box.append(customerCard(c)));
  if(tab==="knowledge")filtered.forEach(k=>{const card=make("article","module-record");card.append(make("strong","",k.title),make("p","",[k.category,k.content].filter(Boolean).join(" · ")));box.append(card);});
 }
 function projectCard(p){
  const card=make("article","project-card");const head=make("div","project-card-head");const left=make("div","");left.append(make("span","project-code",p.code||"PROJECT"),make("h3","",p.name),make("p","project-description",p.description||"No project description yet."));const tags=make("div","project-tags");(p.tags||[]).forEach(t=>tags.append(make("span","project-tag",t)));left.append(tags);head.append(left);
  const open=make("button","project-open","Open project →");open.type="button";open.addEventListener("click",()=>openProject(p.id));head.append(open);card.append(head);
  const docs=documents.filter(d=>d.project_id===p.id);const preview=make("div","project-file-preview");
  docs.slice(0,3).forEach(d=>preview.append(make("span","file-chip",d.original_filename||d.title)));
  if(docs.length>3)preview.append(make("button","file-overflow","+"+(docs.length-3)));if(!docs.length)preview.append(make("span","no-files","No files attached yet"));
  const row=make("button","project-expand",docs.length?"Show file list":"Add the first file");row.type="button";row.addEventListener("click",()=>openProject(p.id));card.append(preview,row);return card;
 }
 function customerCard(c){
  const card=make("article","customer-card");card.tabIndex=0;card.setAttribute("role","link");card.setAttribute("aria-label","View customer "+c.name);card.title="Click to view customer details";
  const type=make("span","customer-type",c.customer_type==="intermediary"?"INTERMEDIARY PARTNER":"END USER");const name=make("h3","customer-card-name",c.name);const desc=make("p","customer-description",c.description||c.notes||"No description added yet.");card.append(type,name,desc);
  if(c.customer_type==="intermediary"&&c.end_user_name)card.append(make("p","customer-enduser","End user: "+c.end_user_name));
  if(c.industry)card.append(make("span","customer-industry",c.industry));
  card.addEventListener("click",()=>openCustomer(c.id));card.addEventListener("keydown",e=>{if(e.target===card&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openCustomer(c.id);}});
  return card;
 }
 async function openCustomer(customerId,navigate=true){
  let c=customers.find(x=>x.id===customerId);
  if(!c&&client&&user){
   const result=await client.from("customers").select("id,name,customer_type,end_user_name,description,industry,notes,created_at").eq("id",customerId).maybeSingle();
   if(result.error){say("Could not load customer details: "+result.error.message,true);return;}
   c=result.data||null;
   if(c)customers=[...customers.filter(x=>x.id!==c.id),c];
  }
  if(!c){say("Customer not found. Return to Customers and refresh the list.",true);return;}
  if(navigate){location.href="./customer-detail.html?id="+encodeURIComponent(customerId);return;}
  $("#module-records").hidden=true;$("#module-search").parentElement.hidden=true;$("#module-message").hidden=true;$("#module-create-toggle").hidden=true;
  let detail=$("#customer-detail");if(!detail){detail=make("section","customer-detail");detail.id="customer-detail";$("#module-workspace").append(detail);}detail.replaceChildren();
  const back=make("button","back-button","← All customers");back.addEventListener("click",()=>{backToAppOr("./customers.html");});detail.append(back);
  const header=make("div","project-detail-header");header.append(make("span","customer-type",c.customer_type==="intermediary"?"INTERMEDIARY PARTNER":"END USER"),make("h2","",c.name),make("p","project-description",c.description||c.notes||"No description provided."));if(c.customer_type==="intermediary"&&c.end_user_name)header.append(make("p","customer-enduser","End user: "+c.end_user_name));
  if(canWrite()){
   const editButton=make("button","project-open","✎ Edit customer");editButton.type="button";editButton.style.marginTop="18px";header.append(editButton);
   const editForm=make("form","record-form customer-edit-form");editForm.hidden=true;editForm.style.marginTop="18px";editForm.style.maxWidth="780px";
   const field=(labelText,id,type,value,maxLength)=>{const label=make("label","",labelText);label.htmlFor=id;const input=type==="textarea"?make("textarea"):make("input");input.id=id;input.name=id;input.maxLength=maxLength;input.value=value||"";if(type==="textarea")input.rows=3;else input.type="text";editForm.append(label,input);return input;};
   const editName=field("Customer name *","edit-customer-name","text",c.name,200);editName.required=true;
   const typeLabel=make("label","","Customer type");typeLabel.htmlFor="edit-customer-type";const editType=make("select");editType.id="edit-customer-type";editType.append(new Option("End user","end_user"),new Option("Intermediary partner","intermediary"));editType.value=c.customer_type||"end_user";editForm.append(typeLabel,editType);
   const endLabel=make("label","","End user company");endLabel.htmlFor="edit-customer-end-user";const editEnd=make("input");editEnd.id="edit-customer-end-user";editEnd.maxLength=200;editEnd.value=c.end_user_name||"";editForm.append(endLabel,editEnd);
   const editDescription=field("Description","edit-customer-description","textarea",c.description,2000);
   const editIndustry=field("Industry","edit-customer-industry","text",c.industry,120);
   const editNotes=field("Notes","edit-customer-notes","textarea",c.notes,2000);
   const updateEndUser=()=>{const intermediary=editType.value==="intermediary";endLabel.hidden=!intermediary;editEnd.hidden=!intermediary;editEnd.required=intermediary;};editType.addEventListener("change",updateEndUser);updateEndUser();
   const actions=make("div","inline-add");const save=make("button","","Save changes");save.type="submit";const cancel=make("button","edit-note","Cancel");cancel.type="button";cancel.addEventListener("click",()=>{editForm.hidden=true;editButton.hidden=false;});actions.append(save,cancel);editForm.append(actions);
   const status=make("p","form-feedback");status.setAttribute("role","status");editForm.append(status);
   editButton.addEventListener("click",()=>{editForm.hidden=!editForm.hidden;editButton.hidden=editForm.hidden;});
   editForm.addEventListener("submit",async e=>{e.preventDefault();if(!canWrite()){status.textContent="You do not have permission to edit customers.";status.classList.add("error");return;}
    const name=editName.value.trim(),type=editType.value,endUser=editEnd.value.trim();
    if(!name){status.textContent="Customer name is required.";status.classList.add("error");return;}
    if(type==="intermediary"&&!endUser){status.textContent="Enter the end user company.";status.classList.add("error");return;}
    if(customers.some(x=>x.id!==c.id&&[x.name,x.end_user_name].filter(Boolean).some(n=>n.trim().toLowerCase()===name.toLowerCase()))){status.textContent="This name already exists as a customer or end user.";status.classList.add("error");return;}
    save.disabled=true;cancel.disabled=true;status.classList.remove("error");status.textContent="Saving changes…";
    try{const payload={name,customer_type:type,end_user_name:type==="intermediary"?endUser:null,description:editDescription.value.trim()||null,industry:editIndustry.value.trim()||null,notes:editNotes.value.trim()||null};
     const {error:updateError}=await client.from("customers").update(payload).eq("id",c.id);if(updateError)throw updateError;
     const {data:refreshed,error:refreshError}=await client.from("customers").select("id,name,customer_type,end_user_name,description,industry,notes,created_at").eq("id",c.id).single();if(refreshError)throw refreshError;
     customers=[...customers.filter(x=>x.id!==c.id),refreshed];populateCustomerChoices();populateCustomerSuggestions();await openCustomer(c.id,false);
    }catch(err){status.textContent="Could not update customer: "+err.message;status.classList.add("error");save.disabled=false;cancel.disabled=false;}
   });
   header.append(editForm);
  }
  detail.append(header);
  const {data:links,error}=await client.from("project_customers").select("project_id").eq("customer_id",c.id);
  if(error){detail.append(make("p","form-feedback error","Could not load customer projects: "+error.message));return;}
  const ids=new Set((links||[]).map(x=>x.project_id));const rows=projects.filter(p=>ids.has(p.id)).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
  const section=make("section","detail-section");section.append(make("h3","","Customer projects"));
  if(!rows.length)section.append(make("p","muted-copy","No projects linked to this customer yet."));
  let currentYear="";
  rows.forEach(p=>{const date=new Date(p.created_at||Date.now());const year=String(date.getFullYear());if(year!==currentYear){currentYear=year;section.append(make("h4","customer-project-year",year));}
   const row=make("button","customer-project-row");row.type="button";const dateLabel=make("span","customer-project-date",date.toLocaleDateString(undefined,{month:"2-digit",year:"numeric"}));const info=make("span","customer-project-info");info.append(make("strong","",p.name),make("small","",p.code||"Project"));row.append(dateLabel,info,make("span","customer-project-arrow","→"));row.addEventListener("click",()=>{location.href="./project-detail.html?id="+encodeURIComponent(p.id);});section.append(row);
  });detail.append(section);window.scrollTo({top:0,behavior:"smooth"});
 }
 function populateTagSuggestions(){const list=$("#project-tag-suggestions");if(list){list.replaceChildren();[...knownTags].sort().forEach(t=>list.append(new Option(t)));}}
 async function openProject(projectId,navigate=true){
  let p=projects.find(x=>x.id===projectId);
  if(!p&&client&&user){
   const result=await client.from("projects").select("id,code,name,description,status,tags,created_at,updated_at").eq("id",projectId).maybeSingle();
   if(result.error){say("Could not load project details: "+result.error.message,true);return;}
   p=result.data||null;
   if(p)projects=[...projects.filter(x=>x.id!==p.id),p];
  }
  if(!p){say("Project not found. Return to Projects and refresh the list.",true);return;}
  if(navigate){location.href="./project-detail.html?id="+encodeURIComponent(projectId);return;}selectedProject=p;
  $("#module-records").hidden=true;$("#module-search").parentElement.hidden=true;$("#module-message").hidden=true;
  let detail=$("#module-detail");if(!detail){detail=make("section","project-detail");detail.id="module-detail";$("#module-workspace").append(detail);}detail.replaceChildren();detail.hidden=false;
  const back=make("button","back-button","← Back");back.addEventListener("click",()=>{backToAppOr("./projects.html");});detail.append(back);
  const header=make("div","project-detail-header");header.append(make("span","project-code",p.code||"PROJECT"),make("h2","",p.name),make("p","project-description",p.description||"No description provided."),make("span","project-status",String(p.status||"active").replace("_"," ")));
  if(canWrite()){
   const editButton=make("button","project-open","✎ Edit project");editButton.type="button";editButton.style.marginTop="18px";header.append(editButton);
   const editForm=make("form","record-form project-edit-form");editForm.hidden=true;editForm.style.marginTop="18px";editForm.style.maxWidth="780px";
   const addField=(labelText,id,value,maxLength,kind="input")=>{const label=make("label","",labelText);label.htmlFor=id;const input=kind==="textarea"?make("textarea"):make("input");input.id=id;input.name=id;input.maxLength=maxLength;input.value=value??"";if(kind==="textarea")input.rows=3;else input.type="text";editForm.append(label,input);return input;};
   const editCode=addField("Project code","edit-project-code",p.code,80);
   const editName=addField("Project name *","edit-project-name",p.name,200);editName.required=true;
   const editDescription=addField("Summary / description","edit-project-description",p.description,2000,"textarea");
   const statusLabel=make("label","","Project status");statusLabel.htmlFor="edit-project-status";const editStatus=make("select");editStatus.id="edit-project-status";[["active","Active"],["on_hold","On hold"],["completed","Completed"],["archived","Archived"]].forEach(([v,t])=>editStatus.append(new Option(t,v)));editStatus.value=p.status||"active";editForm.append(statusLabel,editStatus);
   const editTags=addField("Tags (comma-separated)","edit-project-tags",(p.tags||[]).join(", "),500);
   const actions=make("div","inline-add");const save=make("button","","Save changes");save.type="submit";const cancel=make("button","edit-note","Cancel");cancel.type="button";cancel.addEventListener("click",()=>{editForm.hidden=true;editButton.hidden=false;});actions.append(save,cancel);editForm.append(actions);
   const statusMessage=make("p","form-feedback");statusMessage.setAttribute("role","status");editForm.append(statusMessage);
   editButton.addEventListener("click",()=>{editForm.hidden=!editForm.hidden;editButton.hidden=editForm.hidden;});
   editForm.addEventListener("submit",async e=>{e.preventDefault();if(!canWrite()){statusMessage.textContent="You do not have permission to edit projects.";statusMessage.classList.add("error");return;}
    const name=editName.value.trim();if(!name){statusMessage.textContent="Project name is required.";statusMessage.classList.add("error");return;}
    const tags=[...new Set(editTags.value.split(",").map(t=>t.trim()).filter(Boolean))];
    save.disabled=true;cancel.disabled=true;statusMessage.classList.remove("error");statusMessage.textContent="Saving changes…";
    try{const payload={code:editCode.value.trim()||null,name,description:editDescription.value.trim()||null,status:editStatus.value,tags,updated_at:new Date().toISOString()};
     const {error:updateError}=await client.from("projects").update(payload).eq("id",p.id);if(updateError)throw updateError;
     const {data:refreshed,error:refreshError}=await client.from("projects").select("id,code,name,description,status,tags,created_at,updated_at").eq("id",p.id).single();if(refreshError)throw refreshError;
     projects=[...projects.filter(x=>x.id!==p.id),refreshed];selectedProject=refreshed;loadedModules.delete("projects");await loadModule("projects",true);await openProject(p.id,false);
    }catch(err){statusMessage.textContent="Could not update project: "+err.message;statusMessage.classList.add("error");save.disabled=false;cancel.disabled=false;}
   });
   header.append(editForm);
  }
  detail.append(header);
  const customersForProject=await client.from("project_customers").select("customer_id,customers(id,name,customer_type,end_user_name)").eq("project_id",p.id);
  const custSection=make("section","detail-section");const custHead=make("div","detail-section-heading");custHead.append(make("h3","","Customers"),make("span","",String((customersForProject.data||[]).length)+" linked"));custSection.append(custHead);
  const custNames=make("div","linked-customer-list");(customersForProject.data||[]).forEach(link=>{const c=link.customers;if(c){const linkButton=make("button","linked-customer",c.name);linkButton.type="button";linkButton.addEventListener("click",()=>{location.href="./customer-detail.html?id="+encodeURIComponent(c.id);});custNames.append(linkButton);}});if(!custNames.children.length)custNames.append(make("p","muted-copy","No customers linked yet."));custSection.append(custNames);
  if(canWrite()){const editCust=make("button","icon-edit","✎ Edit");editCust.type="button";editCust.setAttribute("aria-label","Edit linked customers");custHead.append(editCust);const addCust=make("form","inline-add");addCust.hidden=true;const sel=make("select");sel.required=true;sel.append(new Option("Select a customer to link…",""));customers.forEach(c=>{if(!(customersForProject.data||[]).some(x=>x.customer_id===c.id))sel.append(new Option(c.name,c.id));});const btn=make("button","","Link customer");btn.type="submit";addCust.append(sel,btn);editCust.addEventListener("click",()=>{addCust.hidden=!addCust.hidden;});addCust.addEventListener("submit",async e=>{e.preventDefault();if(!sel.value)return;const {error}=await client.from("project_customers").insert({project_id:p.id,customer_id:sel.value,created_by:user.id});if(error){say(error.message,true);return;}await loadCustomers();await openProject(p.id);});custSection.append(addCust);}
  detail.append(custSection);
  const fileSection=make("section","detail-section");const fh=make("div","detail-section-heading");fh.append(make("h3","","Project documents"),make("span","",String(documents.filter(d=>d.project_id===p.id).length)+" files"));fileSection.append(fh);
  const fileRows=make("div","project-document-list");documents.filter(d=>d.project_id===p.id).forEach(d=>fileRows.append(fileCard(d)));if(!fileRows.children.length)fileRows.append(make("p","muted-copy","No files have been added to this project."));fileSection.append(fileRows);
  if(canWrite()){
   const uploadToggle=make("button","module-create-toggle","＋ Add project file");uploadToggle.type="button";const form=make("form","upload-document-form");form.hidden=true;uploadToggle.addEventListener("click",()=>{form.hidden=!form.hidden;uploadToggle.textContent=form.hidden?"＋ Add project file":"Cancel";if(!form.hidden)form.querySelector('input[type="file"]')?.focus({preventScroll:true});});fileSection.append(uploadToggle);form.innerHTML='<label>Upload files (PDF, Word, Excel, PowerPoint only)</label><input type="file" name="files" multiple required accept=".pdf,.doc,.docx,.docm,.xls,.xlsx,.xlsm,.ppt,.pptx,.pptm"><label>Notes for these files</label><textarea name="notes" rows="2" maxlength="2000" placeholder="Purpose, revision context, changes or instructions"></textarea><button type="submit">＋ Add project files</button><p class="form-feedback" role="status"></p>';
   form.addEventListener("submit",async e=>{e.preventDefault();const files=[...form.querySelector('input[type=file]').files];const note=form.querySelector("textarea").value.trim();const msg=form.querySelector(".form-feedback");if(!files.length)return;const bad=files.find(f=>!officeExt.includes(f.name.split(".").pop().toLowerCase()));if(bad){msg.textContent="Unsupported file: "+bad.name;return;}const btn=form.querySelector("button");btn.disabled=true;msg.textContent="Uploading…";try{await uploadFiles(p.id,files,note);loadedModules.delete("projects");await loadModule("projects",true);await openProject(p.id);}catch(err){msg.textContent="Upload failed: "+err.message;}finally{btn.disabled=false;}});fileSection.append(form);
  }else fileSection.append(make("p","muted-copy","Read-only access: only editors and admins can add files."));
  detail.append(fileSection);window.scrollTo({top:0,behavior:"smooth"});
 }
 function fileCard(d){
  const card=make("article","document-card");const ext=(d.file_type||"FILE").toUpperCase();const info=make("div","document-main");info.append(make("span","file-type-badge",ext),make("strong","",d.original_filename||d.title),make("p","document-note",d.notes||"No note for this file."),make("p","document-meta","Updated "+new Date(d.updated_at||d.created_at).toLocaleString()+" · "+(d.updated_by===user?.id?"updated by you":d.updated_by?"updated by "+(d.updated_by_name||d.updated_by.slice(0,8)):"uploaded by "+(d.created_by===user?.id?"you":(d.created_by_name||String(d.created_by||"unknown").slice(0,8))))+" · "+(d.status||"pending_review")));card.append(info);
  const open=make("button","download-file","Open / download");open.type="button";open.addEventListener("click",async()=>{const {data,error}=await client.storage.from("h871-project-documents").createSignedUrl(d.relative_path,60);if(error){say(error.message,true);return;}window.open(data.signedUrl,"_blank","noopener");});card.append(open);
  if(canWrite()){const noteBtn=make("button","edit-note","Edit note");noteBtn.type="button";noteBtn.addEventListener("click",()=>{const form=make("form","edit-file-note");const area=make("textarea");area.value=d.notes||"";area.rows=2;const save=make("button","","Save note");save.type="submit";form.append(area,save);noteBtn.replaceWith(form);form.addEventListener("submit",async e=>{e.preventDefault();const {error}=await client.from("documents").update({notes:area.value.trim()||null,updated_by:user.id,updated_by_name:user.email||"H871 user"}).eq("id",d.id);if(error){say(error.message,true);return;}loadedModules.delete("projects");await loadModule("projects",true);await openProject(selectedProject.id);});});card.append(noteBtn);}
  return card;
 }
 function wireForms(){
  $("#customer-type")?.addEventListener("change",updateCustomerForm);updateCustomerForm();$("#project-tags")?.addEventListener("input",()=>{const values=$("#project-tags").value.split(",").map(x=>x.trim()).filter(Boolean);values.forEach(t=>knownTags.add(t));populateTagSuggestions();});
  $("#customer-name")?.addEventListener("input",()=>customerMatch("#customer-name","#customer-match-hint"));
  $("#customer-end-user")?.addEventListener("input",()=>customerMatch("#customer-end-user","#customer-match-hint"));
  $("#project-form")?.addEventListener("submit",async e=>{
   e.preventDefault();const form=e.currentTarget;if(!canWrite())return feedback("project","Read-only access.",true);
   const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;feedback("project","Creating project…");
   try{
    const tags=$("#project-tags").value.split(",").map(t=>t.trim()).filter(Boolean).filter((t,i,a)=>a.findIndex(x=>x.toLowerCase()===t.toLowerCase())===i);const {data:p,error}=await client.from("projects").insert({code:$("#project-code").value.trim()||null,name:$("#project-name").value.trim(),description:$("#project-description").value.trim()||null,status:$("#project-status").value,tags,created_by:user.id}).select().single();if(error)throw error;
    const customerIds=[...$("#project-customers").selectedOptions].map(o=>o.value);
    if(customerIds.length){const {error:ce}=await client.from("project_customers").insert(customerIds.map(customer_id=>({project_id:p.id,customer_id,created_by:user.id})));if(ce)throw ce;}
    const files=[...$("#project-files").files];if(files.length)await uploadFiles(p.id,files,$("#project-file-notes").value.trim());
    form.reset();feedback("project","Project created successfully.");document.querySelector('[data-form-mount="projects"]').hidden=true;$("#module-create-toggle").textContent="＋ Add project";loadedModules.delete("projects");await loadModule("projects",true);await openProject(p.id);
   }catch(err){feedback("project","Could not create project: "+err.message,true);}finally{btn.disabled=false;}
  });
  $("#customer-form")?.addEventListener("submit",async e=>{
   e.preventDefault();const form=e.currentTarget;if(!canWrite())return feedback("customer","Read-only access.",true);
   const name=$("#customer-name").value.trim(),type=$("#customer-type").value,endUser=$("#customer-end-user").value.trim();
   if(customers.some(c=>[c.name,c.end_user_name].filter(Boolean).some(n=>n.trim().toLowerCase()===name.toLowerCase())))return feedback("customer","This name already exists as a customer or end user. Choose the existing record instead.",true);
   if(type==="intermediary"&&!endUser)return feedback("customer","Enter the end user company.",true);
   if(type==="intermediary"&&customers.some(c=>[c.name,c.end_user_name].filter(Boolean).some(n=>n.trim().toLowerCase()===endUser.toLowerCase()))){const ok=confirm("This end-user name already exists in the customer records. Continue using the existing name?");if(!ok)return;}
   const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;feedback("customer","Saving customer…");
   try{const {error}=await client.from("customers").insert({name,customer_type:type,end_user_name:type==="intermediary"?endUser:null,description:$("#customer-description").value.trim()||null,industry:$("#customer-industry").value.trim()||null,notes:$("#customer-notes").value.trim()||null,created_by:user.id});if(error)throw error;form.reset();updateCustomerForm();feedback("customer","Customer saved.");await loadCustomers();loadedModules.add("customers");renderRows("customers",customers);say(customers.length+" customers.");}catch(err){feedback("customer","Could not save customer: "+err.message,true);}finally{btn.disabled=false;}
  });
 }
 async function init(){
  addForms();makeNewButton();wireForms();
  // Resolve route before async auth checks to prevent the overview from flashing over detail pages.
  const initialPath=location.pathname.split("/").pop()||"index.html";
  active=({"customers.html":"customers","projects.html":"projects","customer-detail.html":"customers","project-detail.html":"projects","knowledge.html":"knowledge"})[initialPath]||"overview";
  if(initialPath!=="index.html"&&initialPath!=="")hideOverview(true);
  if(!config.url||!config.anonKey||!window.supabase?.createClient){say("Supabase configuration unavailable.",true);return;}
  client=window.supabase.createClient(config.url,config.anonKey);
  let authSyncToken=0;
  const sync=async(loadCurrentModule=false)=>{const syncToken=++authSyncToken;const {data}=await client.auth.getSession();user=data.session?.user||null;role=null;if(user){const {data:r}=await client.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();if(syncToken!==authSyncToken)return;role=r?.role||null;}if(syncToken!==authSyncToken)return;const auth=$("#auth-panel");if(auth)auth.hidden=!!user||!(active==="overview"||active==="search");if(loadCurrentModule&&defs[active])await activate(active);};
  const renderRoute=async()=>{
   const path=location.pathname.split("/").pop()||"index.html";
   if(["customers.html","projects.html","customer-detail.html","project-detail.html","knowledge.html"].includes(path)&&location.hash){history.replaceState(history.state,"",location.pathname+location.search);}
   const params=new URLSearchParams(location.search);
   const legacy=location.hash.replace(/^#/, "").split("/");
   let route=({ "customers.html":"customers","projects.html":"projects","customer-detail.html":"customer","project-detail.html":"project","knowledge.html":"knowledge" })[path]||legacy[0]||document.body.dataset.startTab||"overview";
   const routeId=params.get("id")||legacy[1];
   const tab=({project:"projects",customer:"customers"})[route]||route;
   if(!(defs[tab]||["overview","profile","settings"].includes(tab)))return;
   // A newly loaded detail page can race Supabase's initial session event.
   // Resolve the session here before loading records; otherwise openProject/openCustomer
   // can run with user=null and leave the list page visible until a hard refresh.
   if((route==="project"||route==="customer")&&!user){
    const sessionResult=await client.auth.getSession();
    user=sessionResult.data.session?.user||null;
    role=null;
    if(user){
     const roleResult=await client.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();
     role=roleResult.data?.role||null;
    }
   }
   await activate(tab);
   if((route==="project"||route==="customer")&&!user){
    say("Please sign in to view this record.",true);
    return;
   }
   if(route==="project"&&routeId)await openProject(routeId,false);
   else if(route==="customer"&&routeId)await openCustomer(routeId,false);
  };
  // Auth events update permissions and the sign-in panel only. Do not re-render the
  // current route here: activate(tab) removes the detail DOM and can race navigation,
  // causing the overview/list to flash back over a successfully opened record.
  client.auth.onAuthStateChange(()=>setTimeout(async()=>{await sync(false);},0));
  window.addEventListener("popstate",()=>{renderRoute();});
  await sync();await renderRoute();
  document.querySelectorAll("[data-tab]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const tab=a.dataset.tab;const pages={overview:"index.html",projects:"projects.html",customers:"customers.html",knowledge:"knowledge.html"};if(pages[tab]){const target="./"+pages[tab];if(location.pathname.split("/").pop()!==pages[tab])location.href=target;else if(location.hash)history.replaceState({h871Route:tab},"",target);activate(tab);return;}history.replaceState({h871Route:tab},"",location.pathname+location.search);activate(tab);}));
  // Search functionality intentionally disabled while stabilizing list rendering.
  document.querySelectorAll("[data-account-action]").forEach(b=>b.addEventListener("click",()=>{const a=b.dataset.accountAction;if(a==="documents")activate("projects");if(a==="profile")activate("profile");if(a==="settings")activate("settings");}));
  document.querySelectorAll(".metric-card").forEach(card=>card.addEventListener("click",()=>{const id=card.id;if(id==="projects-card")activate("projects");if(id==="customers-card")activate("customers");if(id==="knowledge-card")activate("knowledge");}));
 }
 document.addEventListener("DOMContentLoaded",init);
})();