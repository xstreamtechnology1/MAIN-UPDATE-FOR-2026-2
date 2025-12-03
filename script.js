let currentSlide = 0;
const slides = document.querySelectorAll(".slide");

function showNextSlide() {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add("active");
}

setInterval(showNextSlide, 5000); // Change slide every 5 seconds

/* Reels functionality */
(function(){
    const thumbs = document.getElementById('reels-thumbs');
    if(!thumbs) return; // no reels section

    // Fix mobile viewport height issues: set CSS variable --vh to 1% of the innerHeight
    // This avoids problems where 100vh includes browser chrome and causes content to be cut off.
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    setVh();
    window.addEventListener('resize', () => {
        // debounce resize slightly
        clearTimeout(window._vhTimeout);
        window._vhTimeout = setTimeout(setVh, 150);
    });

    const reelViewer = document.getElementById('reel-viewer');
    const reelList = document.getElementById('reel-list');
    const backBtn = document.querySelector('.back-btn');
    const playPauseOverlay = document.getElementById('play-pause-overlay');
    const overlayIcon = document.getElementById('overlay-icon');
    const unmuteBtn = document.querySelector('.unmute-btn');
    const likeBtn = document.querySelector('.like-btn');
    const likeIcon = document.querySelector('.like-icon');
    const likeCountSpan = document.querySelector('.like-count');
    const shareBtn = document.querySelector('.share-btn');
    const shareCountSpan = document.querySelector('.share-count');
    const commentToggle = document.querySelector('.comment-toggle');
    const commentCountSpan = document.querySelector('.comment-count');
    const commentPanel = document.getElementById('comment-panel');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const closeCommentsBtn = document.querySelector('.close-comments-btn');

    let currentVideoSrc = null;
    let globalUnmuted = false;
    let overlayTimeout = null;

    // Optional Firebase / Firestore integration
    // To enable: add a `firebase-config.js` file that sets `window.FIREBASE_CONFIG = { ... }`
    let db = null;
    let useFirestore = false;
    let unsubscribeLike = null;
    let unsubscribeComments = null;

    if(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey){
        try{
            // using compat SDK (loaded from CDN in index.html)
            firebase.initializeApp(window.FIREBASE_CONFIG);
            db = firebase.firestore();
            useFirestore = true;
            console.log('Firestore initialized');
        }catch(e){ console.warn('Firebase init failed', e); }
    }

    function saveLiked(key, isLiked){
        // keep per-browser liked state so users can toggle locally
        const likes = JSON.parse(localStorage.getItem('reel_likes') || '{}');
        likes[key] = isLiked ? true : false;
        localStorage.setItem('reel_likes', JSON.stringify(likes));

        // update global counter in Firestore (if enabled)
        if(useFirestore && db){
            const docRef = db.collection('reels').doc(encodeURIComponent(key));
            db.runTransaction(tx => tx.get(docRef).then(doc => {
                let likesCount = (doc.exists && doc.data().likes) ? doc.data().likes : 0;
                likesCount = isLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
                tx.set(docRef, { likes: likesCount }, { merge: true });
            })).catch(err=> console.warn('saveLiked tx failed', err));
        }
    }

    function isLiked(key){
        const likes = JSON.parse(localStorage.getItem('reel_likes') || '{}');
        return likes[key] === true;
    }

    // Listen for global like count updates for a specific reel
    function listenToLikeCount(key){
        if(unsubscribeLike){ unsubscribeLike(); unsubscribeLike = null; }
        if(!useFirestore || !db || !likeCountSpan) return;
        const docRef = db.collection('reels').doc(encodeURIComponent(key));
        unsubscribeLike = docRef.onSnapshot(doc => {
            const data = doc.exists ? doc.data() : {};
            const count = data.likes || 0;
            const shares = data.shares || 0;
            likeCountSpan.textContent = count;
            if(shareCountSpan) shareCountSpan.textContent = shares;
        }, err => { console.warn('like listener error', err); });
    }

    function saveComments(key, arr){
        // local fallback (keeps previous behavior for offline/local)
        const c = JSON.parse(localStorage.getItem('reel_comments') || '{}');
        c[key] = arr;
        localStorage.setItem('reel_comments', JSON.stringify(c));
    }

    function getComments(key){
        const c = JSON.parse(localStorage.getItem('reel_comments') || '{}');
        return c[key] || [];
    }

    // Real-time comment listener (Firestore) — falls back to local storage rendering
    function listenToComments(key){
        if(unsubscribeComments){ unsubscribeComments(); unsubscribeComments = null; }
        if(!useFirestore || !db){
            renderCommentsFromLocal(key);
            return;
        }
        const colRef = db.collection('reels').doc(encodeURIComponent(key)).collection('comments').orderBy('time', 'asc');
        unsubscribeComments = colRef.onSnapshot(snapshot => {
            const rows = [];
            snapshot.forEach(d => {
                const item = d.data();
                rows.push({ name: item.name || 'Visitor', text: item.text || '', time: item.time ? (item.time.toMillis ? item.time.toMillis() : item.time) : Date.now() });
            });
            commentsList.innerHTML = rows.map(r=>`<div class="comment"><strong>${escapeHtml(r.name)}:</strong> <div>${escapeHtml(r.text)}</div></div>`).join('') || '<div class="comment">No comments yet</div>';
            // Update comment count in UI
            if(commentCountSpan) commentCountSpan.textContent = rows.length;
        }, err => { console.warn('comment listener error', err); });
    }

    function renderComments(src){
        if(useFirestore && db){
            listenToComments(src);
        } else {
            renderCommentsFromLocal(src);
        }
    }

    function renderCommentsFromLocal(src){
        const rows = getComments(src);
        commentsList.innerHTML = rows.map(r=>`<div class="comment"><strong>${escapeHtml(r.name||'Guest')}:</strong> <div>${escapeHtml(r.text)}</div></div>`).join('') || '<div class="comment">No comments yet</div>';
        // Update comment count in UI
        if(commentCountSpan) commentCountSpan.textContent = rows.length;
    }

    function showPlayPauseIcon(isPlaying){
        overlayIcon.textContent = isPlaying ? '⏸' : '▶';
        playPauseOverlay.classList.add('show');
        clearTimeout(overlayTimeout);
        overlayTimeout = setTimeout(() => {
            playPauseOverlay.classList.remove('show');
        }, 600);
    }

    thumbs.addEventListener('click', e=>{
        const thumb = e.target.closest('.reel-thumb');
        if(!thumb) return;
        const src = thumb.getAttribute('data-src');
        openReels(Array.from(document.querySelectorAll('.reel-thumb')).map(t=>t.getAttribute('data-src')), src);
    });

    // Generate thumbnail images from the video frames for each reel-thumb
    // This replaces the small preview <video> with an <img> captured from the video's frame
    function generateThumbnails(){
        const thumbs = document.querySelectorAll('.reel-thumb video');
        thumbs.forEach(videoEl => {
            try{
                // Pause and ensure metadata is loaded
                videoEl.pause();

                const capture = () => {
                    try{
                        const w = videoEl.videoWidth || 320;
                        const h = videoEl.videoHeight || 180;
                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#000';
                        ctx.fillRect(0,0,w,h);
                        ctx.drawImage(videoEl, 0, 0, w, h);
                        const data = canvas.toDataURL('image/jpeg', 0.8);
                        const img = document.createElement('img');
                        img.src = data;
                        img.alt = 'Reel thumbnail';
                        img.loading = 'lazy';
                        // preserve parent data-src
                        const parent = videoEl.parentElement;
                        parent.replaceChild(img, videoEl);
                    }catch(err){
                        console.warn('Thumbnail capture failed for', videoEl, err);
                    }
                };

                if(videoEl.readyState >= 2){
                    // have enough data to seek
                    // try to seek to 0.5s or center
                    const seekTo = Math.min(0.5, (videoEl.duration || 1) / 2);
                    const onseek = () => { capture(); videoEl.removeEventListener('seeked', onseek); };
                    videoEl.addEventListener('seeked', onseek);
                    try{ videoEl.currentTime = seekTo; }catch(e){ capture(); }
                } else {
                    const onloaded = () => {
                        videoEl.removeEventListener('loadeddata', onloaded);
                        const seekTo = Math.min(0.5, (videoEl.duration || 1) / 2);
                        const onseek = () => { capture(); videoEl.removeEventListener('seeked', onseek); };
                        videoEl.addEventListener('seeked', onseek);
                        try{ videoEl.currentTime = seekTo; }catch(e){ capture(); }
                    };
                    videoEl.addEventListener('loadeddata', onloaded);
                    // also handle error: if it fails (e.g., AVI unsupported), leave video element as-is
                    videoEl.addEventListener('error', ()=>{ console.warn('Cannot load video for thumbnail', videoEl.src); });
                }
            }catch(err){ console.warn('generateThumbnails error', err); }
        });
    }

    // run thumbnail generation after a short delay so metadata can start loading
    setTimeout(generateThumbnails, 300);

    function openReels(srcList, startSrc){
        // populate reelList
        reelList.innerHTML = '';
        srcList.forEach(s=>{
            const item = document.createElement('div'); item.className='reel-item';
            const v = document.createElement('video');
            v.src = encodeURI(s);
            v.addEventListener('error', ()=>{ console.warn('Video failed to load: ' + s); });
            v.setAttribute('playsinline','');
            v.setAttribute('webkit-playsinline','');
            v.muted = true;
            v.preload = 'metadata';
            v.loop = false;
            v.controls = false;
            item.appendChild(v);
            reelList.appendChild(item);
        });

        // show viewer
        reelViewer.classList.remove('hidden'); 
        reelViewer.setAttribute('aria-hidden','false');
    // prevent the underlying page from scrolling while the viewer is open
    try{ document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; }catch(e){}

        // scroll to startSrc
        const items = Array.from(reelList.children);
        const startIndex = srcList.findIndex(x=> encodeURI(x) === encodeURI(startSrc));
        if(startIndex >=0){ items[startIndex].scrollIntoView(); }

        // observe intersection — but only play the centered video to avoid multiple playing
        const videos = reelList.querySelectorAll('video');
        const io = new IntersectionObserver(() => {
            const centered = getCenteredVideo();
            videos.forEach(v => {
                try{
                    if(v === centered){
                        v.muted = !globalUnmuted;
                        v.play().catch(()=>{});
                    } else {
                        v.pause();
                    }
                }catch(e){ /* ignore play errors */ }
            });
        }, { threshold: [0.6] });
        videos.forEach(v => io.observe(v));

        // When the viewport resizes (e.g. switch to mobile), ensure only centered video plays
        window.addEventListener('resize', debounce(()=>{
            const centered = getCenteredVideo();
            videos.forEach(v => {
                try{
                    if(v === centered){ v.muted = !globalUnmuted; v.play().catch(()=>{}); }
                    else { v.pause(); }
                }catch(e){}
            });
        }, 180));

        // Since the viewer was opened by a user click, play with sound by default
        // (browsers allow unmuted playback after a user interaction)
        globalUnmuted = true;
        if(unmuteBtn) unmuteBtn.textContent = 'Mute';
        // ensure the currently-centered video is unmuted and playing
        setTimeout(()=>{
            const centered = getCenteredVideo();
            if(centered){
                // unmute only the centered video to avoid overlapping audio
                centered.muted = false;
                centered.play().catch(()=>{});
            }
        }, 200);

        // set currentVideoSrc and update likes/comments
        function updateCurrent(){
            let chosen = null; let best = Infinity;
            Array.from(reelList.children).forEach(item=>{
                const r = item.getBoundingClientRect();
                const center = Math.abs((r.top + r.bottom)/2 - window.innerHeight/2);
                if(center < best){ best = center; chosen = item; }
            });
            if(chosen){
                const v = chosen.querySelector('video');
                if(v){
                    currentVideoSrc = v.currentSrc || v.src;
                    updateLikeButton();
                    renderComments(currentVideoSrc);
                }
            }
        }

        reelList.addEventListener('scroll', debounce(updateCurrent,150));
        setTimeout(updateCurrent,500);

        // Click video to toggle play/pause and show overlay icon
        videos.forEach(v=>{
            v.addEventListener('click', e=>{
                e.stopPropagation();
                if(v.paused){
                    v.play().catch(()=>{});
                    showPlayPauseIcon(true);
                } else {
                    v.pause();
                    showPlayPauseIcon(false);
                }
            });
            // Update progress bar on video timeupdate
            v.addEventListener('timeupdate', ()=>{
                if(v === getCenteredVideo()){
                    updateProgressBar(v);
                }
            });
        });

        // Progress bar scrubbing
        const progressBar = document.getElementById('reel-progress-bar');
        const progressContainer = document.querySelector('.reel-progress-container');
        let isScrubbing = false;

        const updateProgressBar = (vid)=>{
            if(!vid || !vid.duration) return;
            const percent = (vid.currentTime / vid.duration) * 100;
            const fill = document.querySelector('.reel-progress-fill');
            if(fill) fill.style.width = percent + '%';
        };

        const seek = (e)=>{
            const vid = getCenteredVideo();
            if(!vid || !vid.duration) return;
            const rect = progressContainer.getBoundingClientRect();
            const x = e.clientX || (e.touches && e.touches[0].clientX);
            const pos = x - rect.left;
            const percent = Math.max(0, Math.min(1, pos / rect.width));
            vid.currentTime = percent * vid.duration;
            updateProgressBar(vid);
        };

        progressContainer.addEventListener('mousedown', ()=>{ isScrubbing = true; });
        progressContainer.addEventListener('touchstart', ()=>{ isScrubbing = true; });
        document.addEventListener('mouseup', ()=>{ isScrubbing = false; });
        document.addEventListener('touchend', ()=>{ isScrubbing = false; });
        progressContainer.addEventListener('mousemove', (e)=>{ if(isScrubbing) seek(e); });
        progressContainer.addEventListener('touchmove', (e)=>{ if(isScrubbing) seek(e); });
        progressContainer.addEventListener('click', seek);
    }

    backBtn && backBtn.addEventListener('click', ()=>{
        reelViewer.classList.add('hidden'); 
        reelViewer.setAttribute('aria-hidden','true');
        reelList.querySelectorAll('video').forEach(v=>{ try{v.pause(); v.muted = true;}catch(e){} });
        reelList.innerHTML = '';
        currentVideoSrc = null; 
        globalUnmuted = false;
        if(unmuteBtn) unmuteBtn.textContent = 'Unmute';
        // cleanup any listeners
        if(unsubscribeLike){ unsubscribeLike(); unsubscribeLike = null; }
        if(unsubscribeComments){ unsubscribeComments(); unsubscribeComments = null; }
        if(likeCountSpan) likeCountSpan.textContent = '0';
        if(shareCountSpan) shareCountSpan.textContent = '0';
        if(commentCountSpan) commentCountSpan.textContent = '0';
        if(commentsList) commentsList.innerHTML = '';
        if(likeIcon) likeIcon.textContent = '🤍';
        // restore page scrolling
        try{ document.documentElement.style.overflow = ''; document.body.style.overflow = ''; }catch(e){}
    });

    likeBtn && likeBtn.addEventListener('click', ()=>{
        if(!currentVideoSrc) return;
        const liked = isLiked(currentVideoSrc);
        saveLiked(currentVideoSrc, !liked);
        updateLikeButton();
    });

    function updateLikeButton(){
        if(!likeBtn || !likeIcon) return;
        const liked = isLiked(currentVideoSrc);
        // Update the icon based on whether user has liked this video
        likeIcon.textContent = liked ? '❤' : '🤍';
        likeBtn.classList.toggle('liked', liked);
        // start listening to the global like count for this video (if enabled)
        if(currentVideoSrc){
            listenToLikeCount(currentVideoSrc);
        }
        // if not using Firestore, ensure a visible 0 if no data
        if(!useFirestore && likeCountSpan){ likeCountSpan.textContent = likeCountSpan.textContent || '0'; }
        if(!useFirestore && shareCountSpan){ shareCountSpan.textContent = shareCountSpan.textContent || '0'; }
    }

    shareBtn && shareBtn.addEventListener('click', async ()=>{
        if(!currentVideoSrc) return;
        try{
            if(navigator.share){
                await navigator.share({ title: 'Reel', text:'Check out this reel', url: currentVideoSrc });
            } else {
                await navigator.clipboard.writeText(currentVideoSrc);
                alert('Video URL copied to clipboard');
            }
            // increment global share counter
            if(useFirestore && db){
                const docRef = db.collection('reels').doc(encodeURIComponent(currentVideoSrc));
                docRef.set({ shares: firebase.firestore.FieldValue.increment(1) }, { merge: true }).catch(e=>console.warn('share increment failed', e));
            }
        }catch(err){ console.error(err); alert('Unable to share'); }
    });

    commentToggle && commentToggle.addEventListener('click', ()=>{
        commentPanel.classList.toggle('hidden');
    });

    closeCommentsBtn && closeCommentsBtn.addEventListener('click', ()=>{
        commentPanel.classList.add('hidden');
    });

    // comment rendering is handled by renderComments / listenToComments (defined earlier)

    commentForm && commentForm.addEventListener('submit', e=>{
        e.preventDefault();
        if(!currentVideoSrc) return;
        const v = commentInput.value.trim(); if(!v) return;
        if(useFirestore && db){
            const colRef = db.collection('reels').doc(encodeURIComponent(currentVideoSrc)).collection('comments');
            colRef.add({ name: 'Visitor', text: v, time: firebase.firestore.FieldValue.serverTimestamp() }).then(()=>{
                commentInput.value = '';
                // UI will update via realtime listener
            }).catch(err => { console.warn('Failed to add comment', err); alert('Unable to post comment'); });
        } else {
            const arr = getComments(currentVideoSrc);
            arr.push({ name: 'Visitor', text: v, time: Date.now() });
            saveComments(currentVideoSrc, arr);
            commentInput.value = '';
            renderCommentsFromLocal(currentVideoSrc);
        }
    });

    // unmute control
    if(unmuteBtn){
        unmuteBtn.addEventListener('click', ()=>{
            globalUnmuted = !globalUnmuted;
            const vid = getCenteredVideo();
            if(vid) vid.muted = !globalUnmuted;
            unmuteBtn.textContent = globalUnmuted ? 'Mute' : 'Unmute';
        });
    }

    function getCenteredVideo(){
        let chosen = null; let best = Infinity;
        Array.from(reelList.children).forEach(item=>{
            const r = item.getBoundingClientRect();
            const center = Math.abs((r.top + r.bottom)/2 - window.innerHeight/2);
            if(center < best){ best = center; chosen = item; }
        });
        return chosen ? chosen.querySelector('video') : null;
    }

    // small helpers
    function debounce(fn, t){ let to; return function(){ clearTimeout(to); to = setTimeout(()=>fn.apply(this,arguments), t); }}
    function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
})();

/* Article reader / sharing */
(function(){
    const list = document.getElementById('articles-list');
    if(!list) return;

    const reader = document.getElementById('article-reader');
    const readerImage = document.getElementById('article-image');
    const readerTitle = document.getElementById('article-title');
    const readerBody = document.getElementById('article-body');
    const readerClose = document.querySelector('.article-close');
    const readerShareBtn = document.getElementById('article-share');
    const readerShareCount = document.getElementById('article-share-count');
    const readerPdfBtn = document.getElementById('article-pdf');

    // Firestore for articles (use firebase global if available)
    let db = null;
    let useFirestore = false;
    if(window.firebase && firebase.firestore){
        try{ db = firebase.firestore(); useFirestore = true; }catch(e){ useFirestore = false; }
    }

    let currentArticleId = null;

    // updated openArticle to accept article content
    function openArticle(id, imageSrc, title, bodyText){
        currentArticleId = id;
        if(reader){
            reader.classList.remove('hidden');
            reader.setAttribute('aria-hidden','false');
            try{ document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; }catch(e){}

            readerImage.src = imageSrc || '';
            readerImage.alt = title || '';
            readerTitle.textContent = title || '';
            readerBody.textContent = bodyText || 'Content not available';

            if(useFirestore && db){
                const docRef = db.collection('articles').doc(encodeURIComponent(id));
                docRef.get().then(d=>{ 
                    if(d.exists && d.data().shares) readerShareCount.textContent = d.data().shares; 
                    else readerShareCount.textContent = '0'; 
                }).catch(()=>{});
                if(window._articleUnsub) { window._articleUnsub(); window._articleUnsub = null; }
                window._articleUnsub = docRef.onSnapshot(d=>{
                    const val = (d.exists && d.data().shares) ? d.data().shares : 0; 
                    readerShareCount.textContent = val; 
                }, ()=>{});
            } else {
                readerShareCount.textContent = '0';
            }
        }
    }

    function closeArticle(){
        if(reader){ reader.classList.add('hidden'); reader.setAttribute('aria-hidden','true'); }
        try{ document.documentElement.style.overflow = ''; document.body.style.overflow = ''; }catch(e){}
        if(window._articleUnsub){ window._articleUnsub(); window._articleUnsub = null; }
        currentArticleId = null;
    }

    async function generatePdfAndDownload({ id, title, imageSrc, bodyHtml, buttonEl }){
        if(buttonEl){ buttonEl.disabled = true; var originalText = buttonEl.textContent; buttonEl.textContent = 'Generating...'; }
        try{
            const container = document.createElement('div');
            container.style.padding = '20px';
            container.style.background = '#ffffff';
            container.style.color = '#000000';
            container.style.fontFamily = 'Georgia, serif';
            container.style.width = '800px';

            if(imageSrc){
                const img = document.createElement('img');
                img.src = imageSrc || '';
                img.style.width = '100%';
                img.style.objectFit = 'cover';
                img.alt = title || '';
                container.appendChild(img);
            }

            const h = document.createElement('h1');
            h.textContent = title || 'Article';
            h.style.fontSize = '22px';
            h.style.margin = '14px 0';
            container.appendChild(h);

            const bodyDiv = document.createElement('div');
            bodyDiv.innerHTML = bodyHtml || '';
            bodyDiv.style.whiteSpace = 'pre-wrap';
            bodyDiv.style.lineHeight = '1.6';
            bodyDiv.style.fontSize = '14px';
            container.appendChild(bodyDiv);

            const opt = {
                margin: 0.4,
                filename: `${id || 'article'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(container).save();
        }catch(err){
            console.warn('PDF generation failed', err);
            alert('Failed to generate PDF — try again.');
        } finally {
            if(buttonEl){ buttonEl.disabled = false; buttonEl.textContent = originalText; }
        }
    }

    if(readerPdfBtn){
        readerPdfBtn.addEventListener('click', async ()=>{
            if(!currentArticleId) return;
            await generatePdfAndDownload({ id: currentArticleId, title: readerTitle.textContent, imageSrc: readerImage.src, bodyHtml: readerBody.innerHTML, buttonEl: readerPdfBtn });
        });
    }

    // updated click handler for list
    list.addEventListener('click', e=>{
        const card = e.target.closest('.article-card');
        if(!card) return;

        const id = card.getAttribute('data-id');
        const img = card.getAttribute('data-image') || (card.querySelector('img') && card.querySelector('img').src);
        const title = card.querySelector('h3') ? card.querySelector('h3').textContent : '';

        // get full article content from hidden div or excerpt
        const fullContentEl = card.querySelector('.full-content'); 
        const bodyText = fullContentEl ? fullContentEl.textContent : card.querySelector('.excerpt').textContent;

        if(e.target.closest('.article-read-btn')){
            openArticle(id, img, title, bodyText);
        } else if(e.target.closest('.article-share-btn')){
            shareArticle(id, title, img);
        } else if(e.target.closest('.article-download-btn')){
            const btn = e.target.closest('.article-download-btn');
            generatePdfAndDownload({ id, title, imageSrc: img, bodyHtml: bodyText, buttonEl: btn });
        }
    });

    readerClose && readerClose.addEventListener('click', closeArticle);

    function shareArticle(id, title, url){
        const card = document.querySelector(`.article-card[data-id="${id}"]`);
        const fullContentEl = card ? card.querySelector('.full-content') : null;
        const bodyText = fullContentEl ? fullContentEl.textContent : card.querySelector('.excerpt').textContent;
        const shareText = `${title}\n\n${(bodyText||'').slice(0,160)}...`;
        const shareUrl = location.href.split('#')[0];
        (async ()=>{
            try{
                if(navigator.share){ await navigator.share({ title, text: shareText, url: shareUrl }); }
                else { await navigator.clipboard.writeText(`${title} - ${shareUrl}`); alert('Article link copied to clipboard'); }
                if(useFirestore && db && id){
                    const docRef = db.collection('articles').doc(encodeURIComponent(id));
                    docRef.set({ shares: firebase.firestore.FieldValue.increment(1) }, { merge: true }).catch(e=>console.warn('article share increment failed', e));
                }
            }catch(err){ console.warn('share failed', err); alert('Unable to share'); }
        })();
    }

    readerShareBtn && readerShareBtn.addEventListener('click', ()=>{
        if(!currentArticleId) return;
        shareArticle(currentArticleId, readerTitle.textContent, readerImage.src);
    });

    window.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeArticle(); });
})();


