
(() => {
  const defs = {
    projects:{table:"projects",title:"Projects",desc:"Project list, codes and status.",cols:"id,code,name,description,status,created_at",name:"name"},
    customers:{table:"customers",title:"Customers",desc:"Customer profiles and notes.",cols:"id,name,industry,notes,created_at",name:"name"},
    documents:{table:"documents",title:"Documents",desc:"Document metadata and approved local paths.",cols:"id,title,original_filename,file_type,relative_path,summary,status,created_at",name:"title"},
    knowledge:{table:"knowledge_entries",title:"Knowledge Library",desc:"Approved engineering calculations and lessons learned.",cols:"id,title,content,category,confidence,review_status,created_at",name:"title"}
  };
  const cache={projects:[],customers:[],documents:[],knowledge_entries:[]};
  let active="overview", client=null, role=null, user=null;
  const $=s=>document.querySelector(s);
  function hideOverview(hide){document.querySelectorAll(".main-content > section,.main-content > .workspace-editor,.main-content > .metric-grid,.main-content > .lower-grid,.main-content > .section-heading,.main-content > footer").forEach(el=>{if(!["module-workspace","profile-workspace"].includes(el.id))el.hidden=hide;});}
  function draw(tab){
    const d=defs[tab]; if(!d)return;
    const box=$("#module-records");box.replaceChildren();
    const term=($("#module-search").value||"").trim().toLowerCase();
    const rows=(cache[d.table]||[]).filter(r=>!term||Object.values(r).some(v=>String(v??"").toLowerCase().includes(term)));
    $("#module-count").textContent=rows.length+" records";
    if(!rows.length){const e=document.createElement("div");e.className="module-empty";e.textContent=term?"No records match this search.":user?"No records found.":"Sign in to view records.";box.append(e);}
    rows.forEach(r=>{const card=document.createElement("article");card.className="module-record";const title=document.createElement("strong");title.textContent=r[d.name]||"Untitled";const p=document.createElement("p");p.textContent=(d.table==="projects"?[r.code,r.status,r.description]:d.table==="customers"?[r.industry,r.notes]:d.table==="documents"?[r.original_filename,r.file_type,r.status,r.summary,r.relative_path]:[r.category,r.confidence,r.content]).filter(Boolean).join(" · ");card.append(title,p);box.append(card);});
  }
  async function load(tab){
    const d=defs[tab];if(!d)return;
    const msg=$("#module-message");
    if(!client||!user||!role){cache[d.table]=[];draw(tab);msg.textContent=!user?"Sign in to view records.":"Role not assigned; ask the administrator.";return;}
    msg.textContent="Loading records…";
    try{let q=client.from(d.table).select(d.cols).order("created_at",{ascending:false}).limit(200);if(d.table==="knowledge_entries")q=q.eq("review_status","approved");const {data,error}=await q;if(error)throw error;cache[d.table]=data||[];draw(tab);msg.textContent="Showing up to 200 records. Search filters this list.";}catch(e){msg.textContent="Could not load records: "+e.message;}
  }
  function activate(tab){
    active=tab;document.querySelectorAll("[data-tab]").forEach(a=>a.classList.toggle("active",a.dataset.tab===tab));
    const isModule=Boolean(defs[tab]),isProfile=tab==="profile"||tab==="settings",isOverview=!isModule&&!isProfile;
    hideOverview(!isOverview);$("#module-workspace").hidden=!isModule;$("#profile-workspace").hidden=!isProfile;
    if(isModule){const d=defs[tab];$("#module-title").textContent=d.title;$("#module-eyebrow").textContent=d.title.toUpperCase();$("#module-description").textContent=d.desc;$("#module-search").value="";draw(tab);load(tab);}
    if(isProfile){$("#profile-title").textContent=tab==="settings"?"Profile settings":"Profile overview";$("#profile-description").textContent="Account status, access role and profile display name.";}
    document.querySelectorAll("[data-form-mount]").forEach(el=>el.hidden=el.dataset.formMount!==tab);
    if(tab==="overview")window.scrollTo({top:0,behavior:"smooth"});
  }
  document.querySelectorAll("[data-tab]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();activate(a.dataset.tab);history.replaceState(null,"",a.getAttribute("href"));}));
  $("#module-search")?.addEventListener("input",()=>draw(active));
  $("#module-search-clear")?.addEventListener("click",()=>{$("#module-search").value="";draw(active);});
  // Keep the existing create forms and their original Supabase submit handlers.
  ["project-form","customer-form","document-form","knowledge-form"].forEach(id=>{const f=$("#"+id);if(!f)return;const tab=id==="project-form"?"projects":id==="customer-form"?"customers":id==="document-form"?"documents":"knowledge";const mount=document.createElement("div");mount.className="module-editor";mount.dataset.formMount=tab;mount.hidden=true;mount.append(f);$("#module-workspace").append(mount);});
  function sync(){
    if(!window.H871_SUPABASE_CONFIG||!window.supabase?.createClient)return;
    if(!client)client=window.supabase.createClient(window.H871_SUPABASE_CONFIG.url,window.H871_SUPABASE_CONFIG.anonKey);
    client.auth.getSession().then(async({data})=>{
      user=data.session?.user||null;
      role=null;
      if(user){const {data:rr}=await client.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();role=rr?.role||null;}
      if(defs[active])load(active);
    });
  }
  window.addEventListener("load",sync);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&defs[active])sync();});
  activate("overview");
})();
