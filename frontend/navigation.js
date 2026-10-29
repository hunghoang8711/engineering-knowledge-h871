(() => {
 const $=s=>document.querySelector(s);
 const config=window.H871_SUPABASE_CONFIG||{};
 let client=null,user=null,role=null,active="overview",projects=[],customers=[],documents=[],knowledgeEntries=[],selectedProject=null,moduleLoadToken=0,knownEndUsers=[];
 let listSearch="",listFilter="",listFilterValue="",listToolbarReady=false;
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
 function projectTags(value){const source=Array.isArray(value)?value:[value];return [...new Set(source.flatMap(item=>String(item??"").split(",")).map(tag=>tag.trim()).filter(Boolean))];}
 function renderProjectTags(container,value){container.replaceChildren();projectTags(value).forEach(tag=>container.append(make("span","project-tag",tag)));}
 function backToAppOr(path){try{const ref=document.referrer?new URL(document.referrer):null;const here=new URL(location.href);if(ref&&ref.origin===here.origin&&ref.pathname.startsWith(here.pathname.slice(0,here.pathname.lastIndexOf("/")+1))){history.back();return;}}catch{}location.href=path;}
 function hideOverview(hide){document.querySelectorAll(".main-content > section,.main-content > footer").forEach(el=>{if(!["module-workspace","profile-workspace"].includes(el.id))el.hidden=hide;});const auth=$("#auth-panel");if(auth)auth.hidden=hide||!!user;}
 function activate(tab){
  active=tab;selectedProject=null;
  $("#module-records").hidden=false;$("#module-toolbar").hidden=!(tab==="projects"||tab==="customers");$("#module-message").hidden=false;$("#module-detail")?.remove();$("#customer-detail")?.remove();
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
  customers=data||[];
  const endUserResult=await client.from("project_customers").select("end_user_name");
  knownEndUsers=[...new Set([...(endUserResult.data||[]).map(row=>String(row.end_user_name||"").trim()),...customers.map(c=>String(c.end_user_name||"").trim())].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  populateCustomerChoices();populateCustomerSuggestions();
 }
 function populateCustomerChoices(){
  const select=$("#project-customers");if(!select)return;const prior=new Set([...select.selectedOptions].map(o=>o.value));select.replaceChildren();select.append(new Option("No customer selected",""));
  customers.forEach(c=>{const o=make("option","",c.name+(c.customer_type==="intermediary"&&c.end_user_name?" → "+c.end_user_name:""));o.value=c.id;o.selected=prior.has(c.id);select.append(o);});
 }
 function populateCustomerSuggestions(){
  const list=$("#customer-suggestions"),endList=$("#end-user-suggestions");if(list){list.replaceChildren();customers.forEach(c=>list.append(new Option(c.name)));}if(endList){endList.replaceChildren();const names=[...new Set([...customers.flatMap(c=>[c.name,c.end_user_name]),...knownEndUsers].map(n=>String(n||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));names.forEach(n=>endList.append(new Option(n)));}
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
   const [{data:p,error:pe},{data:d,error:de},{data:projectLinks,error:ple}]=await Promise.all([
    client.from("projects").select("id,code,name,description,status,tags,main_concept_document_id,created_at,updated_at").order("updated_at",{ascending:false}).limit(300),
    client.from("documents").select("id,project_id,title,original_filename,file_type,notes,tags,relative_path,status,created_by,updated_by,created_at,updated_at").order("updated_at",{ascending:false}).limit(1000),
    client.from("project_customers").select("project_id,customer_id,customers(id,name,customer_type,end_user_name)")
   ]);
   if(requestToken!==moduleLoadToken||active!==tab)return;
   if(pe){projects=[];documents=[];renderRows(tab,[]);say("Could not load projects: "+pe.message,true);return;}
   projects=(p||[]).map(project=>({...project,linkedCustomers:(projectLinks||[]).filter(link=>link.project_id===project.id&&link.customers).map(link=>link.customers)}));
   if(de){documents=[];say("Projects loaded; documents could not be loaded: "+de.message,true);}else{documents=d||[];}
   if(ple)say("Projects loaded; customer links could not be loaded: "+ple.message,true);
   knownTags.clear();projects.forEach(project=>projectTags(project.tags).forEach(tag=>knownTags.add(tag)));populateTagSuggestions();renderRows(tab,projects);loadedModules.add(tab);
   if(!de&&!ple)say(projects.length+" projects · documents are grouped within each project.");
  }else if(tab==="customers"){
   await loadCustomers();
   const [{data:allProjects,error:projectError},{data:allDocuments,error:documentError}]=await Promise.all([client.from("projects").select("id,code,name,description,status,tags,main_concept_document_id,created_at,updated_at").order("created_at",{ascending:false}).limit(500),client.from("documents").select("id,project_id,title,original_filename,file_type,notes,tags,relative_path,status,created_by,updated_by,created_at,updated_at").order("updated_at",{ascending:false}).limit(1000)]);
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
  const box=$("#module-records");if(!box)return;box.replaceChildren();const source=Array.isArray(rows)?rows:[];
  const query=listSearch.trim().toLowerCase();
  const filtered=source.filter(item=>{
   if(query){const haystack=tab==="projects"?[item.code,item.name,item.description,...(item.tags||[])].filter(Boolean).join(" ").toLowerCase():tab==="customers"?[item.name,item.end_user_name,item.description,item.notes,item.industry,item.customer_type].filter(Boolean).join(" ").toLowerCase():"";if(!haystack.includes(query))return false;}
   if(listFilter&&listFilterValue){if(tab==="projects"&&listFilter==="status"&&item.status!==listFilterValue)return false;if(tab==="projects"&&listFilter==="tag"&&!(item.tags||[]).includes(listFilterValue))return false;if(tab==="customers"&&listFilter==="customer_type"&&item.customer_type!==listFilterValue)return false;}
   return true;
  });
  $("#module-count").textContent=filtered.length+" "+(tab==="projects"?"projects":tab==="customers"?"customers":"entries");
  if(!filtered.length){box.append(make("div","module-empty",query||listFilterValue?"No matching records.":"No records found yet."));return;}
  if(tab==="projects")filtered.forEach(p=>box.append(projectCard(p)));
  if(tab==="customers")filtered.forEach(c=>box.append(customerCard(c)));
  if(tab==="knowledge")filtered.forEach(k=>{const card=make("article","module-record");card.append(make("strong","",k.title),make("p","",[k.category,k.content].filter(Boolean).join(" · ")));box.append(card);});
 }
 function refreshListFilters(){if(active==="projects")renderRows("projects",projects);else if(active==="customers")renderRows("customers",customers);}
 function setupListToolbar(){
  if(listToolbarReady)return;const toolbar=$("#module-toolbar"),search=$("#module-search");if(!toolbar||!search)return;
  listToolbarReady=true;toolbar.replaceChildren();toolbar.hidden=true;toolbar.className="module-toolbar";
  const searchWrap=make("label","compact-search");searchWrap.setAttribute("aria-label","Search records");const icon=make("span","search-icon","");icon.setAttribute("aria-hidden","true");icon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="5.8"></circle><path d="m14.4 14.4 4.1 4.1"></path></svg>';search.type="search";search.placeholder="Search";search.setAttribute("aria-label","Search projects or customers");search.autocomplete="off";searchWrap.append(icon,search);
  const filterWrap=make("div","filter-wrap");const filterButton=make("button","compact-filter","");filterButton.type="button";filterButton.setAttribute("aria-label","Open filters");filterButton.setAttribute("aria-expanded","false");const filterIcon=make("span","filter-icon","");filterIcon.setAttribute("aria-hidden","true");filterIcon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6.5h16M4 12h16M4 17.5h16"></path><path d="M13.5 5v3M8 10.5v3M16 16v3"></path></svg>';filterButton.append(filterIcon);filterWrap.append(filterButton);
  const panel=make("div","filter-panel");panel.hidden=true;panel.setAttribute("aria-label","Filter options");filterWrap.append(panel);toolbar.append(searchWrap,filterWrap);
  const rebuild=()=>{panel.replaceChildren();panel.append(make("strong","filter-panel-title","Filter by"));
   const label=make("label","filter-field",active==="projects"?"Project status":"Customer type");const select=make("select","");select.setAttribute("aria-label",active==="projects"?"Project status":"Customer type");select.append(new Option(active==="projects"?"All statuses":"All customer types",""));
   if(active==="projects"){[...new Set(projects.map(p=>p.status).filter(Boolean))].sort().forEach(v=>select.append(new Option(v,v)));}else{select.append(new Option("End user","end_user"),new Option("Intermediary partner","intermediary"));}
   if((listFilter==="status"||listFilter==="customer_type")&&listFilterValue)select.value=listFilterValue;select.addEventListener("change",()=>{listFilter=active==="projects"?"status":"customer_type";listFilterValue=select.value;refreshListFilters();});
   label.append(select);panel.append(label);
   if(active==="projects"){const tagLabel=make("label","filter-field","Project tag");const tagSelect=make("select","");tagSelect.setAttribute("aria-label","Project tag");tagSelect.append(new Option("All tags",""));[...new Set(projects.flatMap(p=>p.tags||[]))].sort().forEach(v=>tagSelect.append(new Option(v,v)));if(listFilter==="tag")tagSelect.value=listFilterValue;tagSelect.addEventListener("change",()=>{listFilter=tagSelect.value?"tag":"";listFilterValue=tagSelect.value;refreshListFilters();});tagLabel.append(tagSelect);panel.append(tagLabel);}
   const actions=make("div","filter-actions");const clear=make("button","filter-clear","Clear filters");clear.type="button";clear.addEventListener("click",()=>{listFilter="";listFilterValue="";panel.querySelectorAll("select").forEach(s=>s.selectedIndex=0);refreshListFilters();});actions.append(clear);panel.append(actions);
  };
  filterButton.addEventListener("click",()=>{const opening=panel.hidden;if(opening)rebuild();panel.hidden=!opening;filterButton.setAttribute("aria-expanded",String(opening));});
  search.addEventListener("input",()=>{listSearch=search.value;refreshListFilters();});
  document.addEventListener("click",e=>{if(!filterWrap.contains(e.target)){panel.hidden=true;filterButton.setAttribute("aria-expanded","false");}});
 }
 function projectCard(p){
  const card=make("article","project-card");card.tabIndex=0;card.setAttribute("role","link");card.setAttribute("aria-label","Open project "+(p.code||"")+" "+(p.name||""));card.title="Click anywhere on this project card to open its details";card.addEventListener("click",e=>{if(e.target.closest("button,a,input,textarea,select,[contenteditable=true]"))return;openProject(p.id);});card.addEventListener("keydown",e=>{if(e.target===card&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openProject(p.id);}});const head=make("div","project-card-head");const left=make("div","project-card-main");left.append(make("span","project-code",p.code||"PROJECT"),make("h3","",p.name),make("p","project-description",p.description||"No project description yet."));const tags=make("div","project-tags");renderProjectTags(tags,p.tags);if(tags.childElementCount)left.append(tags);head.append(left);
  const linked=make("div","project-customer-panel");const linkedCustomers=Array.isArray(p.linkedCustomers)?p.linkedCustomers:[];
  if(linkedCustomers.length){linkedCustomers.forEach(c=>{const customer=make("button","project-customer-card");customer.type="button";customer.setAttribute("aria-label","Open customer "+c.name+(c.end_user_name?" / end user "+c.end_user_name:""));customer.append(make("span","project-customer-meta",c.customer_type==="intermediary"?"CUSTOMER / INTERMEDIARY":"CUSTOMER / END USER"),make("strong","project-customer-title",c.name||"Unnamed customer"));if(c.end_user_name)customer.append(make("span","project-customer-enduser","End user: "+c.end_user_name));customer.addEventListener("click",e=>{e.stopPropagation();location.href="./customer-detail.html?id="+encodeURIComponent(c.id);});linked.append(customer);});}
  else linked.append(make("span","project-customer-empty","No customer linked"));
  head.append(linked);const open=make("button","project-open","Open project →");open.type="button";open.addEventListener("click",()=>openProject(p.id));head.append(open);card.append(head);
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
  if(user){
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
  const ids=new Set((links||[]).map(x=>x.project_id));const rows=projects.filter(p=>ids.has(p.id)).sort((a,b)=>new Date(b.updated_at||b.created_at||0)-new Date(a.updated_at||a.created_at||0));
  const section=make("section","detail-section customer-projects-section");const sectionHead=make("div","detail-section-heading");sectionHead.append(make("h3","","Customer projects"),make("span","",String(rows.length)+" linked"));section.append(sectionHead);
  if(!rows.length)section.append(make("p","muted-copy","No projects linked to this customer yet."));
  else{
   const table=make("div","customer-project-table");table.setAttribute("role","table");table.setAttribute("aria-label","Projects linked to this customer");
   const headerRow=make("div","customer-project-table-head");headerRow.setAttribute("role","row");
   [["Project code","code"],["Project name","name"],["Last updated","updated"],["Note","note"]].forEach(([label,kind])=>{const cell=make("span","customer-project-cell customer-project-"+kind,label);cell.setAttribute("role","columnheader");headerRow.append(cell);});
   table.append(headerRow);
   rows.forEach(p=>{
    const row=make("button","customer-project-row");row.type="button";row.setAttribute("role","row");row.setAttribute("aria-label","Open project "+(p.code||"")+" "+p.name);
    const code=make("span","customer-project-cell customer-project-code",p.code||"—");
    const name=make("span","customer-project-cell customer-project-name",p.name||"Untitled project");
    const updatedRaw=p.updated_at||p.created_at;const updatedDate=updatedRaw?new Date(updatedRaw):null;
    const updated=make("span","customer-project-cell customer-project-updated",updatedDate&&!Number.isNaN(updatedDate.getTime())?updatedDate.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"}):"—");
    const note=make("span","customer-project-cell customer-project-note",p.description||"—");note.title=p.description||"No note";
    row.append(code,name,updated,note);row.addEventListener("click",()=>{location.href="./project-detail.html?id="+encodeURIComponent(p.id);});table.append(row);
   });
   section.append(table);
  }
  detail.append(section);window.scrollTo({top:0,behavior:"smooth"});
 }
 function populateTagSuggestions(){const list=$("#project-tag-suggestions");if(list){list.replaceChildren();[...knownTags].sort().forEach(t=>list.append(new Option(t)));}}
 async function openProject(projectId,navigate=true){
  let p=projects.find(x=>x.id===projectId);
  if(!p&&client&&user){
   const result=await client.from("projects").select("id,code,name,description,status,tags,main_concept_document_id,created_at,updated_at").eq("id",projectId).maybeSingle();
   if(result.error){say("Could not load project details: "+result.error.message,true);return;}
   p=result.data||null;
   if(p)projects=[...projects.filter(x=>x.id!==p.id),p];
  }
  if(!p){say("Project not found. Return to Projects and refresh the list.",true);return;}
  if(navigate){location.href="./project-detail.html?id="+encodeURIComponent(projectId);return;}selectedProject=p;
  $("#module-records").hidden=true;$("#module-toolbar").hidden=true;$("#module-search").parentElement.hidden=true;$("#module-message").hidden=true;
  let detail=$("#module-detail");if(!detail){detail=make("section","project-detail");detail.id="module-detail";$("#module-workspace").append(detail);}detail.replaceChildren();detail.hidden=false;
  const back=make("button","back-button","← Back");back.addEventListener("click",()=>{backToAppOr("./projects.html");});detail.append(back);
  let customersForProject=await client.from("project_customers").select("customer_id,end_user_name,customers(id,name,customer_type,end_user_name)").eq("project_id",p.id);let projectCustomerSchemaReady=true;
  if(customersForProject.error){projectCustomerSchemaReady=false;const fallback=await client.from("project_customers").select("customer_id,customers(id,name,customer_type,end_user_name)").eq("project_id",p.id);customersForProject={...fallback,data:(fallback.data||[]).map(link=>({...link,end_user_name:link.customers?.end_user_name||null}))};}
  const header=make("div","project-detail-header");const headerLayout=make("div","project-detail-layout");const projectMain=make("div","project-detail-main");const customerAside=make("aside","project-detail-customer-aside");
  projectMain.append(make("span","project-code project-detail-code",p.code||"PROJECT"),make("h2","",p.name),make("p","project-description",p.description||"No description provided."));const projectTagBox=make("div","project-tags");renderProjectTags(projectTagBox,p.tags);if(projectTagBox.childElementCount)projectMain.append(projectTagBox);const statusBadge=make("span","project-status",String(p.status||"active").replace("_"," "));const headerActions=make("div","project-header-actions");headerActions.append(statusBadge);projectMain.append(headerActions);
  const customerAsideHead=make("div","project-detail-customer-heading");customerAsideHead.append(make("span","project-customer-meta","CUSTOMER INFORMATION"));customerAside.append(customerAsideHead);const projectCustomerCards=make("div","project-customer-cards");(customersForProject.data||[]).slice(0,1).forEach(link=>{const c=link.customers;if(!c)return;const customerCard=make("div","project-customer-card");const customerLabel=make("span","project-customer-field-label","Customer:");const customerName=make("strong","project-customer-title",c.name||"Unnamed customer");const endUserRow=make("div","project-customer-enduser-row");const endUserDetails=make("div","project-customer-enduser-details");endUserDetails.append(make("span","project-customer-field-label","End User:"),make("strong","project-customer-enduser-value",link.end_user_name||c.end_user_name||"Not specified"));endUserRow.append(endUserDetails);if(canWrite()){const editEndUser=make("button","project-enduser-edit","✎");editEndUser.type="button";editEndUser.title="Edit End User for this project";editEndUser.setAttribute("aria-label","Edit End User for this project");const inlineForm=make("form","project-enduser-inline-form");inlineForm.hidden=true;const endInput=make("input","");endInput.type="text";endInput.maxLength=200;endInput.value=link.end_user_name||c.end_user_name||"";endInput.placeholder="Enter End User";endInput.setAttribute("list","end-user-suggestions");const inlineActions=make("div","project-enduser-inline-actions");const saveEnd=make("button","","Save");saveEnd.type="submit";const cancelEnd=make("button","edit-note","Cancel");cancelEnd.type="button";cancelEnd.addEventListener("click",()=>{inlineForm.hidden=true;endUserDetails.hidden=false;editEndUser.hidden=false;});inlineActions.append(saveEnd,cancelEnd);inlineForm.append(endInput,inlineActions);editEndUser.addEventListener("click",()=>{inlineForm.hidden=false;endUserDetails.hidden=true;editEndUser.hidden=true;endInput.focus();});inlineForm.addEventListener("submit",async e=>{e.preventDefault();if(!canWrite())return;if(!projectCustomerSchemaReady){say("Run Supabase migration 0006_project_customer_end_users.sql before editing End User values.",true);return;}const value=endInput.value.trim()||null;saveEnd.disabled=true;try{const {error}=await client.from("project_customers").update({end_user_name:value}).eq("project_id",p.id).eq("customer_id",c.id);if(error)throw error;if(value&&!knownEndUsers.some(n=>n.toLowerCase()===value.toLowerCase()))knownEndUsers.push(value);knownEndUsers=[...new Set(knownEndUsers)].sort((a,b)=>a.localeCompare(b));populateCustomerSuggestions();await openProject(p.id,false);}catch(err){say("Could not update End User: "+err.message,true);saveEnd.disabled=false;}});endUserRow.append(editEndUser,inlineForm);}customerCard.append(customerLabel,customerName,endUserRow);projectCustomerCards.append(customerCard);});if(!projectCustomerCards.childElementCount)projectCustomerCards.append(make("p","project-customer-empty","No customer linked yet. Use Edit project to select a Customer."));customerAside.append(projectCustomerCards);headerLayout.append(projectMain,customerAside);header.append(headerLayout);
  if(user){
   const editButton=make("button","project-open","✎ Edit project");editButton.type="button";editButton.classList.add("project-edit-toggle");headerActions.append(editButton);
   const editForm=make("form","record-form project-edit-form");editForm.hidden=true;editForm.style.marginTop="18px";editForm.style.maxWidth="780px";
   const addField=(labelText,id,value,maxLength,kind="input")=>{const label=make("label","",labelText);label.htmlFor=id;const input=kind==="textarea"?make("textarea"):make("input");input.id=id;input.name=id;input.maxLength=maxLength;input.value=value??"";if(kind==="textarea")input.rows=3;else input.type="text";editForm.append(label,input);return input;};
   const editCode=addField("Project code","edit-project-code",p.code,80);
   const editName=addField("Project name *","edit-project-name",p.name,200);editName.required=true;
   const editDescription=addField("Summary / description","edit-project-description",p.description,2000,"textarea");
   const statusLabel=make("label","","Project status");statusLabel.htmlFor="edit-project-status";const editStatus=make("select");editStatus.id="edit-project-status";[["active","Active"],["on_hold","On hold"],["completed","Completed"],["archived","Archived"]].forEach(([v,t])=>editStatus.append(new Option(t,v)));editStatus.value=p.status||"active";editForm.append(statusLabel,editStatus);
   const editTags=addField("Tags (comma-separated)","edit-project-tags",(p.tags||[]).join(", "),500);
   const customerLabel=make("label","","Customer");customerLabel.htmlFor="edit-project-customer";const editCustomer=make("select");editCustomer.id="edit-project-customer";editCustomer.append(new Option("No customer selected",""));customers.forEach(c=>editCustomer.append(new Option(c.name,c.id)));const currentProjectCustomer=(customersForProject.data||[])[0];editCustomer.value=currentProjectCustomer?.customer_id||"";editForm.append(customerLabel,editCustomer);
   const editEndUser=addField("End User","edit-project-end-user",currentProjectCustomer?.end_user_name||currentProjectCustomer?.customers?.end_user_name||"",200);editEndUser.setAttribute("list","end-user-suggestions");editEndUser.placeholder="Enter or select a saved End User";
   const actions=make("div","inline-add");const save=make("button","","Save changes");save.type="submit";const cancel=make("button","edit-note","Cancel");cancel.type="button";cancel.addEventListener("click",()=>{editForm.hidden=true;editButton.hidden=false;});actions.append(save,cancel);editForm.append(actions);
   const statusMessage=make("p","form-feedback");statusMessage.setAttribute("role","status");editForm.append(statusMessage);
   editButton.addEventListener("click",()=>{editForm.hidden=!editForm.hidden;editButton.hidden=editForm.hidden;});
   editForm.addEventListener("submit",async e=>{e.preventDefault();if(!canWrite()){statusMessage.textContent="You do not have permission to edit projects.";statusMessage.classList.add("error");return;}
    const name=editName.value.trim();if(!name){statusMessage.textContent="Project name is required.";statusMessage.classList.add("error");return;}
    const tags=[...new Set(editTags.value.split(",").map(t=>t.trim()).filter(Boolean))];
    save.disabled=true;cancel.disabled=true;statusMessage.classList.remove("error");statusMessage.textContent="Saving changes…";
    try{if(!projectCustomerSchemaReady)throw new Error("Run Supabase migration 0006_project_customer_end_users.sql before changing the project Customer or End User.");const selectedCustomerId=editCustomer.value;const endUserName=editEndUser.value.trim()||null;
     const {error:deleteLinksError}=await client.from("project_customers").delete().eq("project_id",p.id);if(deleteLinksError)throw deleteLinksError;
     if(selectedCustomerId){const {error:insertLinkError}=await client.from("project_customers").insert({project_id:p.id,customer_id:selectedCustomerId,end_user_name:endUserName,created_by:user.id});if(insertLinkError)throw insertLinkError;}
     const payload={code:editCode.value.trim()||null,name,description:editDescription.value.trim()||null,status:editStatus.value,tags,updated_at:new Date().toISOString()};
     const {error:updateError}=await client.from("projects").update(payload).eq("id",p.id);if(updateError)throw updateError;
     const {data:refreshed,error:refreshError}=await client.from("projects").select("id,code,name,description,status,tags,main_concept_document_id,created_at,updated_at").eq("id",p.id).single();if(refreshError)throw refreshError;
     if(endUserName&&!knownEndUsers.some(n=>n.toLowerCase()===endUserName.toLowerCase()))knownEndUsers.push(endUserName);knownEndUsers=[...new Set(knownEndUsers)].sort((a,b)=>a.localeCompare(b));populateCustomerSuggestions();
     projects=[...projects.filter(x=>x.id!==p.id),refreshed];selectedProject=refreshed;loadedModules.delete("projects");await loadModule("projects",true);await openProject(p.id,false);
    }catch(err){statusMessage.textContent="Could not update project: "+err.message;statusMessage.classList.add("error");save.disabled=false;cancel.disabled=false;}
   });
   projectMain.append(editForm);
  }
  detail.append(header);

  const fileSection=make("section","detail-section");const fh=make("div","detail-section-heading");fh.append(make("h3","","Project documents"),make("span","",String(documents.filter(d=>d.project_id===p.id).length)+" files"));fileSection.append(fh);
  const fileRows=make("div","project-document-list");documents.filter(d=>d.project_id===p.id).forEach(d=>fileRows.append(fileCard(d)));if(!fileRows.children.length)fileRows.append(make("p","muted-copy","No files have been added to this project."));fileSection.append(fileRows);
  if(canWrite()){
   const uploadToggle=make("button","module-create-toggle","＋ Add project file");uploadToggle.type="button";const form=make("form","upload-document-form");form.hidden=true;uploadToggle.addEventListener("click",()=>{form.hidden=!form.hidden;uploadToggle.textContent=form.hidden?"＋ Add project file":"Cancel";if(!form.hidden)form.querySelector('input[type="file"]')?.focus({preventScroll:true});});fileSection.append(uploadToggle);form.innerHTML='<label>Upload files (PDF, Word, Excel, PowerPoint only)</label><input type="file" name="files" multiple required accept=".pdf,.doc,.docx,.docm,.xls,.xlsx,.xlsm,.ppt,.pptx,.pptm"><label>Notes for these files</label><textarea name="notes" rows="2" maxlength="2000" placeholder="Purpose, revision context, changes or instructions"></textarea><button type="submit">＋ Add project files</button><p class="form-feedback" role="status"></p>';
   form.addEventListener("submit",async e=>{e.preventDefault();const files=[...form.querySelector('input[type=file]').files];const note=form.querySelector("textarea").value.trim();const msg=form.querySelector(".form-feedback");if(!files.length)return;const bad=files.find(f=>!officeExt.includes(f.name.split(".").pop().toLowerCase()));if(bad){msg.textContent="Unsupported file: "+bad.name;return;}const btn=form.querySelector("button");btn.disabled=true;msg.textContent="Uploading…";try{await uploadFiles(p.id,files,note);loadedModules.delete("projects");await loadModule("projects",true);await openProject(p.id);}catch(err){msg.textContent="Upload failed: "+err.message;}finally{btn.disabled=false;}});fileSection.append(form);
  }else fileSection.append(make("p","muted-copy","Read-only access: only editors and admins can add files."));
  detail.append(fileSection);
  if(user){
   const aiSection=make("section","detail-section ai-analysis-section");aiSection.id="project-ai-analysis";
   const aiHead=make("div","detail-section-heading");aiHead.append(make("h3","","AI analysis & history"),make("span","","Gemini · PDF only"));aiSection.append(aiHead);
   const aiIntro=make("p","muted-copy","Analyze an approved PDF directly with Gemini. This does not change the project summary or tags until you choose Main Concept.");
   aiSection.append(aiIntro);
   const aiOutput=make("div","ai-analysis-output");aiOutput.id="ai-analysis-output";aiSection.append(aiOutput);
   const historyTitle=make("h4","ai-history-title","Recent analysis history");aiSection.append(historyTitle);
   const historyList=make("div","ai-history-list");historyList.id="ai-history-list";historyList.append(make("p","muted-copy","Loading analysis history…"));aiSection.append(historyList);
   detail.append(aiSection);
   if(canWrite())loadProjectAIHistory(p.id,historyList);
   else {historyList.replaceChildren(make("p","muted-copy","Read-only access. Only editors and admins can view analysis history and run analysis."));aiIntro.textContent="AI analysis is available to editors and admins. You can still view the project documents above.";}
  }
  window.scrollTo({top:0,behavior:"smooth"});
 }
 function fileCard(d){
  const project=projects.find(x=>x.id===d.project_id);const isMainConcept=project?.main_concept_document_id===d.id;const card=make("article","document-card"+(isMainConcept?" is-main-concept":""));const ext=(d.file_type||"FILE").toUpperCase();const info=make("div","document-main");info.append(make("span","file-type-badge",ext),make("strong","document-title",d.original_filename||d.title));if(isMainConcept)info.append(make("span","main-concept-badge","MAIN"));info.append(make("p","document-note",d.notes||"No note for this file."),make("p","document-meta","Updated "+new Date(d.updated_at||d.created_at).toLocaleString()+" · "+(d.updated_by===user?.id?"updated by you":d.updated_by?"updated by "+(d.updated_by_name||d.updated_by.slice(0,8)):"uploaded by "+(d.created_by===user?.id?"you":(d.created_by_name||String(d.created_by||"unknown").slice(0,8))))+" · "+(d.status||"pending_review")));card.append(info);
  const open=make("button","download-file","Open / download");open.type="button";open.addEventListener("click",async()=>{const {data,error}=await client.storage.from("h871-project-documents").createSignedUrl(d.relative_path,60);if(error){say(error.message,true);return;}window.open(data.signedUrl,"_blank","noopener");});card.append(open);
  const isPdf=(d.file_type||"").toLowerCase()==="pdf"||(d.original_filename||d.title||"").toLowerCase().endsWith(".pdf");
  if(canWrite()&&isPdf){const mainBtn=make("button","ai-apply-button",isMainConcept?"✓ Main Concept":"Set as Main Concept");mainBtn.type="button";mainBtn.disabled=isMainConcept;mainBtn.title=isMainConcept?"This document is already the project's Main Concept":"Use the latest successful AI analysis of this PDF as the project's Main Concept";mainBtn.addEventListener("click",async()=>{if(!confirm("Set this PDF as the project's Main Concept using its latest successful AI analysis? The project description and tags will be updated and a history snapshot saved."))return;mainBtn.disabled=true;mainBtn.textContent="Applying…";try{const {error}=await client.rpc("apply_main_concept",{p_project_id:d.project_id,p_document_id:d.id});if(error)throw error;loadedModules.delete("projects");await loadModule("projects",true);await openProject(d.project_id);say("Main Concept applied. Project description and tags updated; change history saved.");}catch(err){say("Could not set Main Concept: "+(err.message||"Unknown error")+". Ensure this PDF has a successful AI analysis first.",true);mainBtn.disabled=false;mainBtn.textContent="Set as Main Concept";}});card.append(mainBtn);const analyze=make("button","ai-analyze-button","✦ Analyze PDF");analyze.type="button";analyze.addEventListener("click",()=>{
   const output=$("#ai-analysis-output"),history=$("#ai-history-list");if(!output){say("Open project details to run AI analysis.",true);return;}
   analyze.disabled=true;analyze.textContent="Queued…";output.replaceChildren(make("p","muted-copy","Analysis request sent. The server will continue processing if you navigate to another page; this panel and history will update when the result is saved."));
   if(history)setTimeout(()=>{if(history.isConnected)loadProjectAIHistory(d.project_id,history);},1500);
   (async()=>{
    try{
     const {data,error}=await client.functions.invoke("analyze-document",{body:{documentId:d.id,projectId:d.project_id}});
     if(error){let detail=error.message||"Function request failed";try{const ctx=error.context;if(ctx&&typeof ctx.json==="function"){const body=await ctx.json();detail=body.message||body.error||detail;}}catch{}throw new Error(detail);}
     if(data?.error)throw new Error(data.message||data.error);
     if(output.isConnected)renderProjectAIResult(output,d,data);
     if(history?.isConnected)await loadProjectAIHistory(d.project_id,history);
    }catch(err){if(output.isConnected){output.replaceChildren(make("p","form-feedback error","AI analysis request failed: "+(err.message||"Unknown error")+". If the run was recorded, check its status in analysis history."));}if(history?.isConnected)await loadProjectAIHistory(d.project_id,history);}
    finally{if(analyze.isConnected){analyze.disabled=false;analyze.textContent="✦ Analyze PDF";}}
   })();
  });card.append(analyze);}
  if(canWrite()){const noteBtn=make("button","edit-note","Edit note");noteBtn.type="button";noteBtn.addEventListener("click",()=>{const form=make("form","edit-file-note");const area=make("textarea");area.value=d.notes||"";area.rows=2;const save=make("button","","Save note");save.type="submit";form.append(area,save);noteBtn.replaceWith(form);form.addEventListener("submit",async e=>{e.preventDefault();const {error}=await client.from("documents").update({notes:area.value.trim()||null,updated_by:user.id,updated_by_name:user.email||"H871 user"}).eq("id",d.id);if(error){say(error.message,true);return;}loadedModules.delete("projects");await loadModule("projects",true);await openProject(selectedProject.id);});});card.append(noteBtn);}
  return card;
 }
 function renderProjectAIResult(output,doc,data,options={}){
  output.replaceChildren();
  const result=data?.result||{};
  // New analyses store Vietnamese directly at the root. Existing bilingual records
  // remain readable by preferring their Vietnamese object when it is present.
  const localized=result.vi&&typeof result.vi==="object"?result.vi:result;
  const title=make("div","ai-result-title");title.append(make("span","ai-status","Phân tích thành công"),make("strong","",doc.original_filename||doc.title||"PDF"));output.append(title);
  const addText=(label,value)=>{if(!value)return;const block=make("div","ai-result-block");block.append(make("h4","",label),make("p","",value));output.append(block);};
  const addList=(label,items)=>{if(!Array.isArray(items)||!items.length)return;const block=make("div","ai-result-block");block.append(make("h4","",label));const ul=make("ul","");items.forEach(item=>{const li=make("li","",typeof item==="string"?item:JSON.stringify(item));ul.append(li);});block.append(ul);output.append(block);};
  addText("Summary",localized.summary||result.summary);addText("Technical Scope",localized.technical_scope||result.technical_scope);
  addList("Key Equipment",localized.key_equipment||result.key_equipment);addList("Requirements",localized.requirements||result.requirements);addList("Risks / Limitations",localized.risks||result.risks);addList("Open Questions",localized.open_questions||result.open_questions);
  if(Array.isArray(result.suggested_tags)&&result.suggested_tags.length&&canWrite()){
   const block=make("div","ai-result-block ai-tag-editor");block.append(make("h4","","Suggested tags"));
   const targetLabel=make("label","ai-tag-target-label","Save selected tags to");
   const target=make("select","ai-tag-target");target.append(new Option("This document","document"),new Option("Project","project"));targetLabel.append(target);block.append(targetLabel);
   const choices=make("div","ai-suggested-tag-choices");block.append(choices);
   const custom=make("input","ai-custom-tags");custom.type="text";custom.placeholder="Add other tags, separated by commas";custom.maxLength=500;custom.setAttribute("aria-label","Add custom tags");block.append(custom);
   const saveTags=make("button","ai-save-tags","Save selected tags");saveTags.type="button";const tagStatus=make("p","form-feedback");tagStatus.setAttribute("role","status");block.append(saveTags,tagStatus);
   const renderTagChoices=()=>{
    choices.replaceChildren();
    const current=target.value==="project"?(projects.find(x=>x.id===doc.project_id)?.tags||[]):(doc.tags||[]);
    const all=[...new Map([...current,...result.suggested_tags.map(t=>String(t).trim()).filter(Boolean)].map(t=>[String(t).toLowerCase(),String(t)])).values()];
    const existing=new Set(current.map(t=>String(t).toLowerCase()));
    all.forEach(tag=>{const chip=make("button","ai-suggested-tag", "");chip.type="button";chip.setAttribute("aria-pressed",String(existing.has(tag.toLowerCase())));chip.classList.toggle("is-selected",existing.has(tag.toLowerCase()));const text=make("span","ai-suggested-tag-text",tag);chip.append(text);chip.addEventListener("click",()=>{const selected=chip.getAttribute("aria-pressed")!=="true";chip.setAttribute("aria-pressed",String(selected));chip.classList.toggle("is-selected",selected);});choices.append(chip);});
   };
   renderTagChoices();
   target.addEventListener("change",renderTagChoices);
   saveTags.addEventListener("click",async()=>{
    const selected=[...choices.querySelectorAll('button.ai-suggested-tag[aria-pressed="true"]')].map(button=>button.querySelector(".ai-suggested-tag-text")?.textContent||"");
    const additions=custom.value.split(",").map(t=>t.trim()).filter(Boolean);
    const tags=[...new Map([...selected,...additions].map(t=>[t.toLowerCase(),t])).values()];
    saveTags.disabled=true;tagStatus.classList.remove("error");tagStatus.textContent="Saving tags…";
    try{
     if(target.value==="project"){
      const {error}=await client.from("projects").update({tags,updated_at:new Date().toISOString()}).eq("id",doc.project_id);if(error)throw error;
      const {data:updated,error:readError}=await client.from("projects").select("id,code,name,description,status,tags,main_concept_document_id,created_at,updated_at").eq("id",doc.project_id).single();if(readError)throw readError;
      projects=[...projects.filter(x=>x.id!==updated.id),updated];selectedProject=updated;
     }else{
      const {error}=await client.from("documents").update({tags,updated_by:user.id,updated_by_name:user.email||"H871 user",updated_at:new Date().toISOString()}).eq("id",doc.id);if(error)throw error;
      documents=documents.map(d=>d.id===doc.id?{...d,tags}:d);doc.tags=tags;
     }
     custom.value="";tagStatus.textContent="Tags saved.";knownTags.clear();projects.forEach(p=>(p.tags||[]).forEach(t=>knownTags.add(t)));documents.forEach(d=>(d.tags||[]).forEach(t=>knownTags.add(t)));populateTagSuggestions();renderTagChoices();
    }catch(err){tagStatus.textContent="Could not save tags: "+err.message;tagStatus.classList.add("error");}
    finally{saveTags.disabled=false;}
   });
   output.append(block);
  }else addList("Suggested tags",result.suggested_tags);
  if(Array.isArray(result.source_references)&&result.source_references.length){const block=make("div","ai-result-block");block.append(make("h4","","Source references"));const ul=make("ul");result.source_references.forEach(ref=>{const li=make("li","",[ref.reference,ref.claim].filter(Boolean).join(" — ")||JSON.stringify(ref));ul.append(li);});block.append(ul);output.append(block);}
  if(canWrite()&&options.includeApply!==false){const apply=make("button","ai-apply-button","Set this document as Main Concept");apply.type="button";apply.addEventListener("click",async()=>{if(!confirm("Use the latest successful analysis of this document to replace the project summary and tags? A history snapshot will be saved."))return;apply.disabled=true;apply.textContent="Applying…";try{const tagEditor=output.querySelector(".ai-tag-editor");let chosenProjectTags=projects.find(x=>x.id===doc.project_id)?.tags||[];if(tagEditor&&tagEditor.querySelector(".ai-tag-target")?.value==="project"){chosenProjectTags=[...tagEditor.querySelectorAll('button.ai-suggested-tag[aria-pressed="true"] .ai-suggested-tag-text')].map(el=>el.textContent||"");chosenProjectTags=[...new Map(chosenProjectTags.map(t=>[t.trim().toLowerCase(),t.trim()])).values()].filter(Boolean);}const {data:historyId,error}=await client.rpc("apply_main_concept",{p_project_id:doc.project_id,p_document_id:doc.id});if(error)throw error;const {error:tagRestoreError}=await client.from("projects").update({tags:chosenProjectTags,updated_at:new Date().toISOString()}).eq("id",doc.project_id);if(tagRestoreError)throw tagRestoreError;const {data:project,error:projectError}=await client.from("projects").select("id,code,name,description,status,tags,main_concept_document_id,created_at,updated_at").eq("id",doc.project_id).single();if(projectError)throw projectError;projects=[...projects.filter(x=>x.id!==project.id),project];selectedProject=project;const header=$("#module-detail .project-detail-header");if(header){const desc=header.querySelector(".project-description");if(desc)desc.textContent=project.description||"No description provided.";let tagBox=header.querySelector(".project-tags");if(!tagBox){tagBox=make("div","project-tags");const status=header.querySelector(".project-status");header.insertBefore(tagBox,status||null);}renderProjectTags(tagBox,project.tags);}const fileRows=$("#module-detail .project-document-list");if(fileRows){fileRows.replaceChildren();documents.filter(d=>d.project_id===project.id).forEach(d=>fileRows.append(fileCard(d)));}say("Main Concept applied. Project description and tags updated; change history saved.");const list=$("#ai-history-list");if(list)await loadProjectAIHistory(doc.project_id,list);apply.textContent="Main Concept applied";}catch(err){say("Could not apply Main Concept: "+err.message,true);apply.disabled=false;apply.textContent="Set this document as Main Concept";}});output.append(apply);}
 }
 async function loadProjectAIHistory(projectId,container){
  if(!container||!client||!user||!canWrite())return;
  container.replaceChildren(make("p","muted-copy","Loading analysis history…"));
  const {data:analyses,error}=await client.from("project_ai_analyses").select("id,document_id,provider,model,status,summary,result,error_message,created_at,completed_at").eq("project_id",projectId).order("created_at",{ascending:false}).limit(10);
  if(error){container.replaceChildren(make("p","form-feedback error","Could not load analysis history: "+error.message));return;}
  container.replaceChildren();
  if(!analyses?.length){container.append(make("p","muted-copy","No AI analyses recorded yet."));return;}
  analyses.forEach(item=>{
   const row=make("article","ai-history-item");
   const top=make("div","ai-history-top");
   top.append(make("strong","",item.summary||"Document analysis"),make("span","ai-history-status ai-status-"+String(item.status||"unknown"),String(item.status||"unknown").replaceAll("_"," ")));
   row.append(top);
   row.append(make("p","document-meta",new Date(item.created_at).toLocaleString()+" · "+item.provider+" / "+item.model));
   if(item.error_message)row.append(make("p","form-feedback error",item.error_message));
   if(item.status==="succeeded"){
    const doc=documents.find(d=>d.id===item.document_id);
    row.append(make("p","muted-copy","Source: "+(doc?.original_filename||doc?.title||"document")));
    const savedResult=make("div","ai-history-saved-result");savedResult.hidden=true;
    const more=make("button","ai-history-more","See more");more.type="button";more.setAttribute("aria-expanded","false");
    more.addEventListener("click",()=>{
     const expand=savedResult.hidden;
     savedResult.hidden=!expand;
     more.textContent=expand?"See less":"See more";
     more.setAttribute("aria-expanded",String(expand));
     if(expand&&!savedResult.dataset.rendered){
      if(item.result&&doc){renderProjectAIResult(savedResult,doc,{result:item.result},{includeApply:false});}
      else savedResult.append(make("p","muted-copy","Saved detailed result is unavailable for this record."));
      savedResult.dataset.rendered="true";
     }
    });
    row.append(more,savedResult);
   }
   container.append(row);
  });
  const pending=(analyses||[]).some(a=>["queued","processing"].includes(a.status));
  if(pending&&!container.dataset.polling){
   container.dataset.polling="true";
   const poll=async()=>{if(!container.isConnected){container.dataset.polling="";clearInterval(timer);return;}const {data:latest,error:pollError}=await client.from("project_ai_analyses").select("status").eq("project_id",projectId).in("status",["queued","processing"]).limit(1);if(pollError||!latest?.length){container.dataset.polling="";clearInterval(timer);await loadProjectAIHistory(projectId,container);}};
   const timer=setInterval(poll,2500);
  }
  const {data:changes,error:historyError}=await client.from("project_change_history").select("id,event_type,source_document_id,previous_description,new_description,previous_tags,new_tags,created_at,restored_from_history_id").eq("project_id",projectId).order("created_at",{ascending:false}).limit(10);
  if(historyError){container.append(make("p","form-feedback error","Could not load project change history: "+historyError.message));return;}
  if(changes?.length){container.append(make("h4","ai-history-title","Main Concept change history"));changes.forEach(change=>{const row=make("article","ai-history-item");row.append(make("div","ai-history-top",String(change.event_type||"change").replaceAll("_"," ")),make("p","document-meta",new Date(change.created_at).toLocaleString()));row.append(make("p","ai-history-description","Description: "+(change.new_description||"—")));row.append(make("p","ai-history-description","Tags: "+((change.new_tags||[]).join(", ")||"—")));if(change.restored_from_history_id)row.append(make("p","muted-copy","Restored from a previous snapshot."));container.append(row);});}
 }
 function wireForms(){
  $("#customer-type")?.addEventListener("change",updateCustomerForm);updateCustomerForm();$("#project-tags")?.addEventListener("input",()=>{const values=$("#project-tags").value.split(",").map(x=>x.trim()).filter(Boolean);values.forEach(t=>knownTags.add(t));populateTagSuggestions();});
  $("#customer-name")?.addEventListener("input",()=>customerMatch("#customer-name","#customer-match-hint"));
  $("#customer-end-user")?.addEventListener("input",()=>customerMatch("#customer-end-user","#customer-match-hint"));
  $("#project-form")?.addEventListener("submit",async e=>{
   e.preventDefault();const form=e.currentTarget;if(!canWrite())return feedback("project","Read-only access.",true);
   const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;feedback("project","Creating project…");
   try{
    const selectedCustomerId=$("#project-customers").value;
    const newCustomerName=$("#project-new-customer")?.value.trim()||"";
    if(selectedCustomerId&&newCustomerName)throw new Error("Choose an existing customer or enter a new customer name, not both.");
    const tags=$("#project-tags").value.split(",").map(t=>t.trim()).filter(Boolean).filter((t,i,a)=>a.findIndex(x=>x.toLowerCase()===t.toLowerCase())===i);const {data:p,error}=await client.from("projects").insert({code:$("#project-code").value.trim()||null,name:$("#project-name").value.trim(),description:$("#project-description").value.trim()||null,status:$("#project-status").value,tags,created_by:user.id}).select().single();if(error)throw error;
    let customerId=selectedCustomerId||null;
    if(newCustomerName){
     const match=customers.find(c=>[c.name,c.end_user_name].filter(Boolean).some(n=>n.trim().toLowerCase()===newCustomerName.toLowerCase()));
     if(match)customerId=match.id;
     else{
      const {data:newCustomer,error:customerError}=await client.from("customers").insert({name:newCustomerName,customer_type:"end_user",created_by:user.id}).select("id,name,customer_type,end_user_name,description,industry,notes,created_at").single();
      if(customerError)throw new Error("Project was created, but the new customer could not be saved: "+customerError.message);
      customers=[...customers,newCustomer].sort((a,b)=>a.name.localeCompare(b.name));customerId=newCustomer.id;populateCustomerChoices();populateCustomerSuggestions();
     }
    }
    const endUserName=$("#project-end-user")?.value.trim()||null;
    if(customerId){const {error:ce}=await client.from("project_customers").insert({project_id:p.id,customer_id:customerId,end_user_name:endUserName,created_by:user.id});if(ce)throw new Error("Project was created, but the customer link failed: "+ce.message);if(endUserName&&!knownEndUsers.some(n=>n.toLowerCase()===endUserName.toLowerCase()))knownEndUsers.push(endUserName);knownEndUsers=[...new Set(knownEndUsers)].sort((a,b)=>a.localeCompare(b));populateCustomerSuggestions();}
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
  addForms();makeNewButton();wireForms();setupListToolbar();
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
   if(route==="project"||route==="customer"){
    if(!user){
     const sessionResult=await client.auth.getSession();
     user=sessionResult.data.session?.user||null;
     role=null;
    }
    // A transient role lookup failure during initial auth sync must not hide editor controls.
    if(user&&!role){
     let roleResult=await client.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();
     if(roleResult.error||!roleResult.data?.role){await new Promise(resolve=>setTimeout(resolve,300));roleResult=await client.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();}
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
  const globalForm=$("#search-form"),globalInput=$("#global-search"),globalResults=$("#search-results"),globalMessage=$("#search-message");
  if(globalForm&&globalInput&&globalResults&&!globalForm.dataset.h871Bound){
   globalForm.dataset.h871Bound="1";
   let searchTimer=null,searchToken=0,searchCache=null,cachePromise=null;
   const highlight=(element,value,query)=>{
    element.replaceChildren();const text=String(value??"");if(!query){element.textContent=text;return;}
    const lower=text.toLocaleLowerCase(),needle=query.toLocaleLowerCase();let cursor=0,at=lower.indexOf(needle);
    while(at!==-1){if(at>cursor)element.append(document.createTextNode(text.slice(cursor,at)));const mark=make("mark","search-highlight",text.slice(at,at+needle.length));element.append(mark);cursor=at+needle.length;at=lower.indexOf(needle,cursor);}
    if(cursor<text.length)element.append(document.createTextNode(text.slice(cursor)));
   };
   const loadSearchData=async()=>{
    if(searchCache)return searchCache;if(cachePromise)return cachePromise;
    cachePromise=(async()=>{
     const [{data:ps,error:pe},{data:ds,error:de},{data:as,error:ae},{data:ks,error:ke}]=await Promise.all([
      client.from("projects").select("id,code,name,description,status,tags").limit(500),
      client.from("documents").select("id,project_id,title,original_filename,file_type,notes,tags,created_at").limit(1500),
      client.from("project_ai_analyses").select("id,project_id,document_id,status,summary,result,created_at").eq("status","succeeded").order("created_at",{ascending:false}).limit(500),
      client.from("knowledge_entries").select("id,title,content,category,review_status").eq("review_status","approved").limit(500)
     ]);
     const err=pe||de||ae||ke;if(err)throw err;
     searchCache={projects:ps||[],documents:ds||[],analyses:as||[],knowledge:ks||[]};return searchCache;
    })();
    try{return await cachePromise;}catch(err){cachePromise=null;throw err;}
   };
   const runSearch=async()=>{
    const token=++searchToken,query=globalInput.value.trim();
    globalResults.replaceChildren();globalMessage.classList.remove("error");
    if(!query){globalMessage.textContent="Type to search engineering knowledge.";return;}
    if(!client||!user){globalMessage.textContent="Sign in to search workspace records.";return;}
    globalMessage.textContent="Searching…";
    try{
     const data=await loadSearchData();if(token!==searchToken)return;
     const q=query.toLocaleLowerCase(),matches=[];
     const includes=value=>String(value??"").toLocaleLowerCase().includes(q);
     data.projects.forEach(p=>{if([p.code,p.name,p.description,(p.tags||[]).join(" ")].some(includes))matches.push({type:"Project",title:(p.code?p.code+" · ":"")+(p.name||""),detail:[p.description,(p.tags||[]).join(", ")].filter(Boolean).join(" · "),href:"./project-detail.html?id="+encodeURIComponent(p.id)});});
     data.documents.forEach(d=>{if([d.title,d.original_filename,d.notes,d.file_type,(d.tags||[]).join(" ")].some(includes)){const p=data.projects.find(x=>x.id===d.project_id);matches.push({type:"Document",title:d.original_filename||d.title||"Untitled document",detail:[p?.name,(d.tags||[]).join(", "),d.notes].filter(Boolean).join(" · "),href:d.project_id?"./project-detail.html?id="+encodeURIComponent(d.project_id):null});}});
     data.analyses.forEach(a=>{const serialized=JSON.stringify(a.result||{});if(includes(a.summary)||includes(serialized)){const d=data.documents.find(x=>x.id===a.document_id),p=data.projects.find(x=>x.id===a.project_id);matches.push({type:"AI Analysis",title:a.summary||d?.original_filename||"Saved AI analysis",detail:[p?.name,d?.original_filename,new Date(a.created_at).toLocaleString()].filter(Boolean).join(" · "),href:a.project_id?"./project-detail.html?id="+encodeURIComponent(a.project_id):null});}});
     data.knowledge.forEach(k=>{if([k.title,k.content,k.category].some(includes))matches.push({type:"Knowledge",title:k.title||"Knowledge entry",detail:[k.category,k.content].filter(Boolean).join(" · "),href:null});});
     if(token!==searchToken)return;
     if(!matches.length){globalMessage.textContent="No matching records found.";return;}
     globalMessage.textContent=matches.length+" matching records · Includes saved AI analysis results.";
     matches.slice(0,50).forEach(m=>{const card=make("article","search-result-card"),type=make("span","search-result-type",m.type),title=make("strong"),detail=make("p");highlight(title,m.title,query);highlight(detail,m.detail,query);card.append(type,title,detail);if(m.href){const link=make("a","search-result-link","Open record →");link.href=m.href;card.append(link);}globalResults.append(card);});
    }catch(err){if(token!==searchToken)return;globalMessage.textContent="Search failed: "+err.message;globalMessage.classList.add("error");}
   };
   const scheduleSearch=()=>{clearTimeout(searchTimer);searchToken++;globalResults.replaceChildren();globalMessage.classList.remove("error");globalMessage.textContent=globalInput.value.trim()?"Searching…":"Type to search engineering knowledge.";searchTimer=setTimeout(runSearch,220);};
   globalInput.addEventListener("input",scheduleSearch);
   globalForm.addEventListener("submit",e=>{e.preventDefault();clearTimeout(searchTimer);runSearch();});
  }
  document.querySelectorAll("[data-account-action]").forEach(b=>b.addEventListener("click",()=>{const a=b.dataset.accountAction;if(a==="documents")activate("projects");if(a==="profile")activate("profile");if(a==="settings")activate("settings");}));
  document.querySelectorAll(".metric-card").forEach(card=>card.addEventListener("click",()=>{const id=card.id;if(id==="projects-card")activate("projects");if(id==="customers-card")activate("customers");if(id==="knowledge-card")activate("knowledge");}));
 }
 document.addEventListener("DOMContentLoaded",init);
})();