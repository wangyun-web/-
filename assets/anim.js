/* ============================================================
   动效系统 · GSAP + ScrollTrigger
   设计基调：开场揭幕 → Hero 标题遮罩+压缩归位 → 各模块大标题先大幅进场
   → 卡片 stagger → 图片 reveal + Hero 背景轻微 parallax
   缓动统一用 expo.out / power4，节奏放慢、丝滑、无廉价弹跳
   ============================================================ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var preloader = document.getElementById('preloader');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);

  // 降级：无 GSAP 或用户偏好减少动效时，直接展示内容并撤掉开场遮罩
  if (!hasGSAP || reduceMotion) {
    docEl.classList.add('no-anim');
    if (preloader) preloader.style.display = 'none';
    window.__preloadDone = true;
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.ticker.lagSmoothing(1000, 16);

  // 全局缓动（丝滑减速，无回弹）
  var EASE = 'expo.out';
  var EASE_SOFT = 'power3.out';

  /* ---------- 1. 开场预加载 / 揭幕 ---------- */
  var numEl = document.getElementById('pl-num');
  var fillEl = preloader ? preloader.querySelector('.pl-fill') : null;
  var plInner = preloader ? preloader.querySelector('.pl-inner') : null;

  var counter = { v: 0 };
  var tlLoad = gsap.timeline();

  tlLoad
    .from(plInner, { opacity: 0, scale: 1.06, duration: 1.0, ease: 'power2.out' }, 0)
    .to(counter, {
      v: 100,
      duration: 1.7,
      ease: 'power2.inOut',
      onUpdate: function () {
        var n = Math.round(counter.v);
        if (numEl) numEl.textContent = n;
        if (fillEl) fillEl.style.width = n + '%';
      }
    }, 0);

  function revealPreloader() {
    var tl = gsap.timeline({
      onComplete: function () {
        if (preloader) preloader.style.display = 'none';
        window.__preloadDone = true;
        ScrollTrigger.refresh();
        startHero();
      }
    });
    tl.to(plInner, { y: -36, opacity: 0, duration: 0.6, ease: 'power3.in' })
      .to(preloader, { yPercent: -100, duration: 1.15, ease: 'power4.inOut' }, '>-0.08')
      .set(preloader, { display: 'none' });
  }

  tlLoad.eventCallback('onComplete', function () {
    gsap.delayedCall(0.25, revealPreloader);
  });

  /* ---------- 2. 初始隐藏状态（在开场遮罩后、揭幕时由时间线接管） ---------- */
  gsap.set('.hero h1 .line-in', { yPercent: 110 });
  gsap.set(['#top .kicker', '#top .lead', '#top .stats', '#top .cta', '#top .slogan', '#top .foot'], { opacity: 0, y: 44 });
  gsap.set('#nav', { opacity: 0 });
  gsap.set('.hero .bg', { scale: 1.25 }); // 给背景 parallax 留出余量

  /* ---------- 3. Hero 强视觉进场 ---------- */
  function startHero() {
    var tl = gsap.timeline();

    // 导航淡入
    tl.to('#nav', { opacity: 1, duration: 0.9, ease: EASE }, 0.1);

    // 标题逐行遮罩揭开（位移）
    tl.to('.hero h1 .line-in', {
      yPercent: 0,
      duration: 1.15,
      ease: EASE,
      stagger: 0.12
    }, 0.15);

    // 压缩后归位：整块标题从略压缩恢复，落定到位
    tl.fromTo('.hero h1',
      { scaleY: 0.9, transformOrigin: '50% 100%' },
      { scaleY: 1, duration: 0.75, ease: 'expo.out' },
      '-=0.55');

    // 其余元素依次上浮进场
    tl.to('#top .kicker', { opacity: 1, y: 0, duration: 0.95, ease: EASE }, '-=0.7')
      .to('#top .lead', { opacity: 1, y: 0, duration: 0.95, ease: EASE }, '-=0.75')
      .to('#top .stats', { opacity: 1, y: 0, duration: 0.95, ease: EASE }, '-=0.75')
      .to('#top .cta', { opacity: 1, y: 0, duration: 0.95, ease: EASE }, '-=0.75')
      .to('#top .slogan', { opacity: 0.85, y: 0, duration: 1.05, ease: EASE }, '-=0.95')
      .to('#top .foot', { opacity: 1, y: 0, duration: 0.95, ease: EASE }, '-=0.85');
  }

  /* ---------- 4. Hero 背景轻微 parallax ---------- */
  gsap.fromTo('.hero .bg',
    { yPercent: -7 },
    {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

  /* ---------- 5. 各模块滚动进场：大标题先大幅进场 ---------- */
  // 5a. 模块头部（英文小标 + 大标题 + 引导文案）统一触发
  gsap.utils.toArray('.section, .contact').forEach(function (sec) {
    var eyebrow = sec.querySelector('.eyebrow');
    var title = sec.querySelector('.sec-title, .big');
    var intro = sec.querySelector('.sec-intro');
    if (sec.classList.contains('contact')) intro = sec.querySelector('p');

    var tl = gsap.timeline({
      scrollTrigger: { trigger: sec, start: 'top 78%', once: true }
    });

    // 英文小标先轻微上浮
    if (eyebrow) {
      tl.fromTo(eyebrow,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: EASE }, 0);
    }

    // 大标题大幅进场：clip 擦除揭开 + 位移
    if (title) {
      tl.fromTo(title,
        { yPercent: 16, opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' },
        { yPercent: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: EASE },
        '-=0.35');
    }

    // 引导文案跟进
    if (intro) {
      tl.fromTo(intro,
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: EASE },
        '-=0.7');
    }
  });

  // 5b. 卡片 stagger：项目区按「分类」逐个触发，其余模块整体触发
  gsap.utils.toArray('#projects .cat, #awards-more .cat').forEach(function (cat) {
    var cards = cat.querySelectorAll('.card, .hx-block');
    if (!cards.length) return;
    gsap.fromTo(cards,
      { y: 66, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.0, ease: EASE, stagger: 0.12,
        scrollTrigger: { trigger: cat, start: 'top 82%', once: true }
      });
  });

  ['#experience', '#advantages'].forEach(function (sel) {
    var sec = document.querySelector(sel);
    if (!sec) return;
    var cards = sec.querySelectorAll('.tl-item, .adv');
    if (!cards.length) return;
    gsap.fromTo(cards,
      { y: 66, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.0, ease: EASE, stagger: 0.12,
        scrollTrigger: { trigger: sec, start: 'top 74%', once: true }
      });
  });

  /* ---------- 6. 图片 reveal（卡片媒体容器擦除揭开） ---------- */
  gsap.utils.toArray('.card .media').forEach(function (media) {
    gsap.fromTo(media,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.1,
        ease: EASE,
        scrollTrigger: {
          trigger: media,
          start: 'top 86%',
          once: true
        }
      });
  });

  /* ---------- 7. 资源加载后刷新触发点 ---------- */
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
  });
})();
