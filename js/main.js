/* --- 1. GLOBAL & DOM VARIABLES --- */
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval;
let isBg1Active = true;
let touchStartX = 0, touchEndX = 0;
let debounceTimer;

const DOM = {
    body: document.body, mainHeader: document.querySelector('.main-header'), bg1: document.querySelector('.hero-background'), bg2: document.querySelector('.hero-background-next'), heroSection: document.getElementById('hero-section'), heroLogoContainer: document.querySelector('.hero-logo-container'), heroLogoImg: document.querySelector('.hero-logo'), heroTitle: document.querySelector('.hero-title'), heroTagline: document.querySelector('.hero-tagline'), heroIndicatorsContainer: document.querySelector('.hero-indicators'), carouselsContainer: document.getElementById('content-carousels'), modalOverlay: document.getElementById('details-modal-overlay'), modal: document.getElementById('details-modal'),
    modalContent: document.querySelector('#details-modal .modal-content'),
    modalBanner: document.querySelector('#details-modal .modal-banner'),
    modalScrollContainer: document.getElementById('modal-scroll-container'),
    modalCloseBtn: document.getElementById('modal-close-btn'), searchLink: document.getElementById('search-link'), searchOverlay: document.getElementById('search-overlay'), searchCloseBtn: document.getElementById('search-close-btn'), searchInput: document.getElementById('search-input'), searchResultsContainer: document.getElementById('search-results-container'),
};

/* --- 2. INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [trendingMovies, trendingShows] = await Promise.all([
            fetchMedia('movie', 'trending'),
            fetchMedia('tv', 'trending')
        ]);
        heroSlides = [...trendingMovies, ...trendingShows].filter(Boolean).sort((a, b) => b.popularity - a.popularity).slice(0, 7);
        if (heroSlides.length > 0) setupHero();
        if (trendingMovies?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending Movies', trendingMovies));
        if (trendingShows?.length > 0) DOM.carouselsContainer.appendChild(createCarousel('Trending TV Shows', trendingShows));
        setupScrollAnimations();
        setupEventListeners();
    } catch (error) {
        console.error("Failed to initialize the application:", error);
    }
});

/* (Sections 3, 4, 5 are unchanged) */
/* --- 3. EVENT LISTENERS --- */
function setupEventListeners(){if(DOM.mainHeader){window.addEventListener("scroll",()=>{DOM.mainHeader.classList.toggle("scrolled",window.scrollY>50)})}if(DOM.modalOverlay)DOM.modalOverlay.addEventListener("click",closeModal);if(DOM.modalCloseBtn)DOM.modalCloseBtn.addEventListener("click",closeModal);if(DOM.searchLink)DOM.searchLink.addEventListener("click",openSearch);if(DOM.searchCloseBtn)DOM.searchCloseBtn.addEventListener("click",closeSearch);if(DOM.searchInput)DOM.searchInput.addEventListener("input",handleSearchInput)}
/* --- 4. HERO SLIDER LOGIC --- */
function setupHero(){if(!DOM.heroSection)return;setupHeroIndicators();setupSwipeHandlers();updateHeroSlide(currentHeroIndex,true);startHeroSlider()}
function startHeroSlider(){clearInterval(heroInterval);const e=parseInt(getComputedStyle(document.documentElement).getPropertyValue("--hero-slide-duration"))*1000||1e4;heroInterval=setInterval(()=>{currentHeroIndex=(currentHeroIndex+1)%heroSlides.length,updateHeroSlide(currentHeroIndex)},e)}
function resetHeroSlider(){clearInterval(heroInterval),startHeroSlider()}
async function updateHeroSlide(e,t=!1){if(!heroSlides[e])return;currentHeroIndex=e;const s=heroSlides[e],o=(e+1)%heroSlides.length;heroSlides[o]?.backdrop_path&&(new Image).src=`https://image.tmdb.org/t/p/original${heroSlides[o].backdrop_path}`,DOM.heroSection.classList.remove("active");const a=s.media_type||(s.title?"movie":"tv"),[n,i]=await Promise.all([fetchMediaDetails(a,s.id),fetchMediaImages(a,s.id)]);updateHeroBackground(s.backdrop_path,t),setTimeout(()=>{updateHeroContent(n,i,s),DOM.heroSection.classList.add("active"),updateHeroIndicators(e)},600)}
function updateHeroBackground(e,t){const s=`url(https://image.tmdb.org/t/p/original${e})`,o=isBg1Active?DOM.bg1:DOM.bg2,a=isBg1Active?DOM.bg2:DOM.bg1;if(t)return void(o.style.backgroundImage=s);a.style.backgroundImage=s,o.style.opacity=0,a.style.opacity=1,isBg1Active=!isBg1Active}
function updateHeroContent(e,t,s){const o=t?.logos||[],a=o.find(e=>"en"===e.iso_639_1&&e.file_path.endsWith(".svg"))||o.find(e=>"en"===e.iso_639_1)||o[0];a?.file_path?(DOM.heroLogoImg.src=`https://image.tmdb.org/t/p/w500${a.file_path}`,DOM.heroLogoContainer.style.display="block",DOM.heroTitle.style.display="none"):(DOM.heroTitle.textContent=s.title||s.name||"Untitled",DOM.heroTitle.style.display="block",DOM.heroLogoContainer.style.display="none"),e?.tagline?(DOM.heroTagline.textContent=e.tagline,DOM.heroTagline.style.display="block"):DOM.heroTagline.style.display="none"}
/* --- 5. UI & ANIMATION HELPERS --- */
function setupHeroIndicators(){if(!DOM.heroIndicatorsContainer)return;DOM.heroIndicatorsContainer.innerHTML="";heroSlides.forEach((e,t)=>{const s=document.createElement("div");s.className="indicator-bar",s.innerHTML='<div class="progress"></div>',s.addEventListener("click",()=>{t!==currentHeroIndex&&(updateHeroSlide(t),resetHeroSlider())}),DOM.heroIndicatorsContainer.appendChild(s)})}
function updateHeroIndicators(e){if(!DOM.heroIndicatorsContainer)return;const t=DOM.heroIndicatorsContainer.querySelectorAll(".indicator-bar");t.forEach((t,s)=>{t.classList.remove("active");const o=t.querySelector(".progress");o&&(o.style.transition="none",o.style.width="0%",void o.offsetWidth,s===e&&(t.classList.add("active"),o.style.transition=`width var(--hero-slide-duration) linear`,o.style.width="100%"))})}
function createCarousel(e,t){if(!Array.isArray(t)||0===t.length)return document.createDocumentFragment();const s=document.createElement("section");s.className="carousel-section",s.innerHTML=`<h2>${e}</h2>`;const o=document.createElement("div");o.className="movie-carousel",t.forEach(e=>{if(!e?.poster_path)return;const t=document.createElement("a");t.className="movie-poster",t.href="#",t.innerHTML=`<img src="https://image.tmdb.org/t/p/w500${e.poster_path}" alt="${e.title||e.name}" loading="lazy">`,t.addEventListener("click",t=>{t.preventDefault(),openDetailsModal(e)}),o.appendChild(t)}),s.appendChild(o);return s}
function setupScrollAnimations(){const e=document.querySelectorAll(".carousel-section");if(0===e.length)return;const t=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add("is-visible"),t.unobserve(e.target))})},{threshold:.1});e.forEach(e=>t.observe(e))}

/* --- 6. MODAL LOGIC (REVAMPED) --- */
async function openDetailsModal(mediaItem) {
    if (!DOM.modal || !mediaItem) return;
    DOM.modalContent.innerHTML = ''; // Clear previous content
    DOM.modalBanner.style.backgroundImage = '';
    DOM.modal.classList.remove('active');
    DOM.body.classList.add('modal-open');
    DOM.modalOverlay.classList.add('active');

    setTimeout(() => DOM.modal.classList.add('active'), 50);

    const mediaType = mediaItem.media_type || (mediaItem.title ? 'movie' : 'tv');
    const details = await fetchMediaDetails(mediaType, mediaItem.id);

    if (!details || Object.keys(details).length === 0) {
        DOM.modalContent.innerHTML = '<p>Sorry, details could not be loaded.</p>';
        return;
    }

    DOM.modalBanner.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${details.backdrop_path})`;

    const year = (details.release_date || details.first_air_date || '').split('-')[0];
    const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time?.length > 0 ? `${details.episode_run_time[0]} min` : '');
    const rating = details.certification || 'N/A';
    const bestLogo = details.logos?.find(l => l.iso_639_1 === 'en') || details.logos?.[0];

    const titleHtml = bestLogo?.file_path ?
        `<img src="https://image.tmdb.org/t/p/w500${bestLogo.file_path}" class="modal-title-logo" alt="${details.title || details.name}">` :
        `<h1 class="modal-title-text">${details.title || details.name}</h1>`;

    const castHtml = details.cast?.filter(c => c.profile_path).map(member => `
        <div class="cast-member">
            <img src="https://image.tmdb.org/t/p/w200${member.profile_path}" alt="${member.name}">
            <p>${member.name}</p>
        </div>`).join('') || '';
        
    const seasonsHtml = (mediaType === 'tv' && details.seasons?.length > 0) ? `
        <div class="modal-seasons">
            <h3 class="section-title">Seasons</h3>
            <div class="seasons-list">
                ${details.seasons.map(season => `
                    <div class="season-item">
                        <div class="season-header">
                            <img src="https://image.tmdb.org/t/p/w200${season.poster_path}" alt="${season.name}" class="season-poster">
                            <div class="season-info">
                                <h4>${season.name}</h4>
                                <p>${season.episode_count} Episodes</p>
                            </div>
                        </div>
                        <div class="episodes-container">
                            ${season.episodes.map(ep => `
                                <div class="episode-item">
                                    <span class="episode-number">${ep.episode_number}.</span>
                                    <p class="episode-title">${ep.name}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    DOM.modalContent.innerHTML = `
        <div class="modal-main-details">
            <img src="https://image.tmdb.org/t/p/w500${details.poster_path}" alt="${details.title || details.name}" class="modal-poster">
            <div class="modal-title-group">
                ${titleHtml}
                <div class="modal-meta">
                    ${year ? `<span>${year}</span>` : ''}
                    <span class="rating">${rating}</span>
                    ${runtime ? `<span>${runtime}</span>` : ''}
                </div>
                <div class="modal-genres">
                    ${details.genres?.map(g => `<span>${g.name}</span>`).join('') || ''}
                </div>
            </div>
        </div>
        <div class="modal-overview">
            <p>${details.overview || ''}</p>
        </div>
        ${castHtml ? `<div class="modal-cast"><h3 class="section-title">Cast</h3><div class="cast-list">${castHtml}</div></div>` : ''}
        ${seasonsHtml}
    `;
    
    // Add event listeners for the new season items
    document.querySelectorAll('.season-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
}

function closeModal() {
    DOM.body.classList.remove('modal-open');
    DOM.modalOverlay.classList.remove('active');
    DOM.modal.classList.remove('active');
    // Reset scroll position for next time
    setTimeout(() => DOM.modalScrollContainer.scrollTop = 0, 600);
}

/* (Sections 7 and 8 for Search and Swipe are unchanged) */
/* --- 7. AWWWARDS-LEVEL SEARCH LOGIC --- */
function openSearch(e){e.preventDefault(),DOM.body.classList.add("search-open"),DOM.searchOverlay.classList.add("active"),setTimeout(()=>DOM.searchInput.focus(),400)}
function closeSearch(){DOM.body.classList.remove("search-open"),DOM.searchOverlay.classList.remove("active"),setTimeout(()=>{DOM.searchInput.value="",DOM.searchResultsContainer.innerHTML=""},400)}
function handleSearchInput(){clearTimeout(debounceTimer),debounceTimer=setTimeout(async()=>{const e=DOM.searchInput.value.trim();if(e.length>1){const t=await searchMedia(e);displaySearchResults(t)}else DOM.searchResultsContainer.innerHTML=""},500)}
function displaySearchResults(e){DOM.searchResultsContainer.innerHTML="";if(0===e.length){const t=document.createElement("p");t.className="no-results",t.textContent="No results found.",DOM.searchResultsContainer.appendChild(t),setTimeout(()=>t.classList.add("is-visible"),50);return}
e.forEach((e,t)=>{if(!e.poster_path)return;const s=document.createElement("a");s.className="movie-poster",s.href="#",s.innerHTML=`<img src="https://image.tmdb.org/t/p/w500${e.poster_path}" alt="${e.title||e.name}" loading="lazy">`,s.addEventListener("click",s=>{s.preventDefault(),closeSearch(),setTimeout(()=>openDetailsModal(e),400)}),DOM.searchResultsContainer.appendChild(s),setTimeout(()=>{s.classList.add("is-visible")},50*t)})}
/* --- 8. SWIPE LOGIC --- */
function setupSwipeHandlers(){if(!DOM.heroSection)return;DOM.heroSection.addEventListener("touchstart",e=>{touchStartX=e.touches[0].clientX,clearInterval(heroInterval)},{passive:!0}),DOM.heroSection.addEventListener("touchmove",e=>{touchEndX=e.touches[0].clientX},{passive:!0}),DOM.heroSection.addEventListener("touchend",()=>{0!==touchEndX&&Math.abs(touchStartX-touchEndX)>50&&(currentHeroIndex=touchStartX>touchEndX?(currentHeroIndex+1)%heroSlides.length:(currentHeroIndex-1+heroSlides.length)%heroSlides.length,updateHeroSlide(currentHeroIndex)),startHeroSlider(),touchStartX=0,touchEndX=0})}
