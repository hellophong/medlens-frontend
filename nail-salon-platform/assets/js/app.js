/* ============================================================
   NailConnect USA — shared interactivity + sample data
   ============================================================ */

/* ---- Mobile nav / sidebar toggles (shared across pages) ---- */
document.addEventListener("DOMContentLoaded", ()=>{
  const hamburger = document.getElementById("hamburger");
  const mainNav = document.getElementById("mainNav");
  if(hamburger && mainNav){
    hamburger.addEventListener("click", ()=> mainNav.classList.toggle("open"));
  }
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  if(sidebarToggle && sidebar){
    sidebarToggle.addEventListener("click", ()=> sidebar.classList.toggle("open"));
  }
});

/* ---- Sample listings (demo data only — a real site pulls this from the database) ---- */
const SAMPLE_LISTINGS = [
  {id:1, type:"jobs", name:"Luxury Nails & Spa", city:"Houston, TX", desc:"Hiring full-time nail technician. Great tips, flexible schedule, walk-ins welcome.", price:"$1,200–$1,800/wk", icon:"💅"},
  {id:2, type:"forsale", name:"Golden Nails Studio", city:"Orlando, FL", desc:"Established 12 years, 8 stations, 4 pedicure chairs, loyal clientele. Owner retiring.", price:"$145,000", icon:"🏪"},
  {id:3, type:"seeking", name:"Kim T. — Nail Technician", city:"San Jose, CA", desc:"8 years experience in gel-x, acrylic & nail art. Licensed, bilingual EN/VI, available immediately.", price:"Open to offers", icon:"🙋"},
  {id:4, type:"jobs", name:"Bella Nails Bar", city:"Atlanta, GA", desc:"Seeking experienced technician for pedicure & dip powder. Booth rent or commission available.", price:"60% Commission", icon:"💅"},
  {id:5, type:"directory", name:"Diamond Nails & Beauty", city:"Seattle, WA", desc:"Full-service nail salon offering manicure, pedicure, waxing, and eyelash extensions.", price:"Directory Listing", icon:"📍"},
  {id:6, type:"forsale", name:"Perfect 10 Nail Lounge", city:"Dallas, TX", desc:"Modern build-out, 6 stations, prime strip-mall location near residential area.", price:"$98,000", icon:"🏪"},
  {id:7, type:"jobs", name:"Elegant Nails", city:"Phoenix, AZ", desc:"Hiring 2 technicians for busy salon. Housing assistance available for relocating techs.", price:"$1,000–$1,500/wk", icon:"💅"},
  {id:8, type:"seeking", name:"Anh N. — Nail Artist", city:"Garden Grove, CA", desc:"Specializing in intricate nail art and 3D designs. 5 years experience, portfolio available.", price:"Open to offers", icon:"🙋"},
  {id:9, type:"directory", name:"Serenity Nail Spa", city:"Chicago, IL", desc:"Relaxing full-service salon with organic products and private VIP rooms.", price:"Directory Listing", icon:"📍"},
];

const badgeMap = {
  jobs:{cls:"badge-hiring", key:"badge.hiring"},
  forsale:{cls:"badge-forsale", key:"badge.forsale"},
  seeking:{cls:"badge-seeking", key:"badge.seeking"},
  directory:{cls:"badge-forsale", key:"tabs.directory"}
};

function renderListings(filterType, searchTerm){
  const grid = document.getElementById("listingGrid");
  if(!grid) return;
  const lang = localStorage.getItem("nc_lang") || "en";
  const term = (searchTerm || "").toLowerCase().trim();
  let items = SAMPLE_LISTINGS.filter(l => filterType === "all" || l.type === filterType);
  if(term){
    items = items.filter(l =>
      l.name.toLowerCase().includes(term) || l.city.toLowerCase().includes(term)
    );
  }
  const metaEl = document.getElementById("resultsMeta");
  if(metaEl){
    const tpl = I18N[lang]["results.meta"] || "Showing {n} results near you";
    metaEl.textContent = tpl.replace("{n}", items.length);
  }
  if(items.length === 0){
    grid.innerHTML = `<div class="panel text-center muted" style="grid-column:1/-1;padding:40px;">
      <div style="font-size:30px;margin-bottom:8px;">🔍</div>No listings match your search.</div>`;
    return;
  }
  grid.innerHTML = items.map(l=>{
    const b = badgeMap[l.type];
    return `<a class="listing-card" href="listing.html">
      <div class="listing-photo">${l.icon}<span class="badge ${b.cls}" data-i18n="${b.key}">${I18N[lang][b.key]}</span></div>
      <div class="listing-body">
        <h3>${l.name}</h3>
        <div class="listing-loc">📍 ${l.city}</div>
        <div class="listing-desc">${l.desc}</div>
        <div class="listing-price">${l.price}</div>
      </div>
    </a>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", ()=>{
  if(!document.getElementById("listingGrid")) return;
  let currentTab = "all";
  renderListings(currentTab, "");

  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.type;
      renderListings(currentTab, document.getElementById("searchName")?.value || "");
    });
  });

  const searchBtn = document.getElementById("searchBtn");
  if(searchBtn){
    searchBtn.addEventListener("click", ()=>{
      const term = (document.getElementById("searchName")?.value || "") + " " + (document.getElementById("searchLoc")?.value || "");
      renderListings(currentTab, term);
    });
  }

  document.querySelectorAll(".chip[data-type]").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      const tabBtn = document.querySelector(`.tab-btn[data-type="${chip.dataset.type}"]`);
      if(tabBtn) tabBtn.click();
      window.scrollTo({top: document.getElementById("resultsSection").offsetTop - 90, behavior:"smooth"});
    });
  });

  window.addEventListener("langchange", ()=> renderListings(currentTab, ""));
});

/* ---- Post-listing form: type selection + plan selection + payment method ---- */
document.addEventListener("DOMContentLoaded", ()=>{
  document.querySelectorAll(".type-card").forEach(card=>{
    card.addEventListener("click", ()=>{
      document.querySelectorAll(".type-card").forEach(c=>c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });
  document.querySelectorAll(".plan-card").forEach(card=>{
    card.addEventListener("click", ()=>{
      document.querySelectorAll(".plan-card").forEach(c=>c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });
  document.querySelectorAll(".pay-method").forEach(m=>{
    m.addEventListener("click", ()=>{
      document.querySelectorAll(".pay-method").forEach(x=>x.classList.remove("selected"));
      m.classList.add("selected");
      const cardFields = document.getElementById("cardFields");
      if(cardFields) cardFields.style.display = m.dataset.method === "card" ? "block" : "none";
    });
  });
  const form = document.getElementById("listingForm");
  if(form){
    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const lang = localStorage.getItem("nc_lang") || "en";
      btn.textContent = lang === "vi" ? "✓ Đã Đăng Tin Thành Công!" : "✓ Listing Published Successfully!";
      btn.disabled = true;
      btn.style.background = "#2E9E6A";
    });
  }
});
