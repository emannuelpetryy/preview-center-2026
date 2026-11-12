const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  let browser;
  try {
    console.log('=== INICIANDO VERIFICAÇÃO AUTOMATIZADA COMPLETA DA LP 03 (DARK TECH CIÁTICO & DESCOMPRESSÃO) ===');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.toString()));

    const filePath = path.resolve('C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-dor-ciatica/index.html');
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
    console.log('1. Carregando Landing Page oficial LP 03:', fileUrl);

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // 1. Verificação de Título e Metas
    const title = await page.title();
    console.log('Título da página:', title);

    // 2. Garante carregamento completo de imagens com auto-scroll
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 50);
      });
    });
    await new Promise(r => setTimeout(r, 400));

    // Captura de Screenshots Desktop (Hero Viewport e Full Page)
    const desktopScreenshotPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-dor-ciatica/preview-desktop.png';
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log('Screenshot Hero Desktop gravado em:', desktopScreenshotPath);

    const desktopFullPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-dor-ciatica/preview-full-desktop.png';
    await page.screenshot({ path: desktopFullPath, fullPage: true });
    console.log('Screenshot Full Page Desktop gravado em:', desktopFullPath);

    // 3. Teste do Botão de Alternância de Tags Wix CMS
    await page.click('#cmsToggleBtn');
    const tagsAudit = await page.evaluate(() => {
      const isVisible = document.body.classList.contains('show-wix-tags');
      const pill = document.querySelector('.unit-dynamic-pill');
      const pillAfter = window.getComputedStyle(pill, '::after').content;
      const marker = pill.querySelector('.wix-field-marker');
      const markerAfter = window.getComputedStyle(marker, '::after').content;
      const fisioBox = document.querySelector('.team-member-item .member-avatar-box');
      const fisioImg = fisioBox.querySelector('img');
      const boxRect = fisioBox.getBoundingClientRect();
      const imgRect = fisioImg.getBoundingClientRect();
      const fisioBoxAfter = window.getComputedStyle(fisioBox, '::after').content;
      const videoCont = document.querySelector('#techVideoContainer');
      const videoAfter = window.getComputedStyle(videoCont, '::after');
      const videoOverlay = videoCont.querySelector('.video-poster-overlay');

      return {
        isVisible,
        pillAfter,
        markerAfter,
        fisioBoxAfter,
        hasDuplicatePillTag: pillAfter !== 'none' && markerAfter !== 'none',
        avatarImgInside: imgRect.left >= boxRect.left && imgRect.right <= boxRect.right + 2,
        videoTagVisibleAboveOverlay: parseInt(videoAfter.zIndex, 10) > parseInt(window.getComputedStyle(videoOverlay).zIndex, 10)
      };
    });
    console.log('Alternância para exibição de tags Wix CMS ativada:', tagsAudit);

    if (tagsAudit.hasDuplicatePillTag) {
      throw new Error('Falha de tags: detectada tag duplicada no elemento .unit-dynamic-pill');
    }
    if (!tagsAudit.fisioBoxAfter.includes('{imagemFisio}')) {
      throw new Error('Falha de tags: tag {imagemFisio} não foi renderizada no avatar');
    }
    if (!tagsAudit.avatarImgInside) {
      throw new Error('Falha visual: a tag deslocou a imagem do avatar para fora do círculo');
    }
    if (!tagsAudit.videoTagVisibleAboveOverlay) {
      throw new Error('Falha de visibilidade: a tag do container de vídeo está oculta atrás do poster');
    }
    
    await page.screenshot({
      path: 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-dor-ciatica/preview-banner-desktop.png',
      fullPage: false
    });
    console.log('Screenshot com tags Wix CMS salvo em preview-banner-desktop.png');

    // Desativa modo tags para os próximos testes
    await page.click('#cmsToggleBtn');

    // 4. Teste e Captura Viewport Mobile (iPhone 14/15 390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.evaluate(() => window.scrollTo(0, 0));

    const mobileScreenPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-dor-ciatica/preview-mobile-screen.png';
    await page.screenshot({ path: mobileScreenPath, fullPage: false });
    console.log('Screenshot Mobile Viewport salvo em:', mobileScreenPath);

    const mobileFullPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-dor-ciatica/preview-mobile.png';
    await page.evaluate(() => {
      const dock = document.querySelector('.mobile-sticky-dock');
      if (dock) dock.style.display = 'none';
    });
    await page.screenshot({ path: mobileFullPath, fullPage: true });
    await page.evaluate(() => {
      const dock = document.querySelector('.mobile-sticky-dock');
      if (dock) dock.style.display = '';
    });
    console.log('Screenshot Mobile Full Page salvo em:', mobileFullPath);

    // 4.1 Teste de Viewport Estreito Android (360x640)
    await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    const narrowAudit = await page.evaluate(() => {
      const dock = document.querySelector('.mobile-sticky-dock');
      const info = document.querySelector('.mobile-dock-unit-info');
      const hours = document.querySelector('.mobile-unit-hours');
      const docWidth = document.documentElement.scrollWidth;
      return {
        dockVisible: window.getComputedStyle(dock).display !== 'none',
        dockHeight: dock.offsetHeight,
        infoWidth: info.offsetWidth,
        hoursHeight: hours.offsetHeight,
        hoursWrapped: hours.offsetHeight > 20,
        docWidth,
        hasHorizontalOverflow: docWidth > 360
      };
    });
    console.log('Auditoria Viewport Estreito 360px:', narrowAudit);
    if (narrowAudit.hasHorizontalOverflow) {
      throw new Error(`Overflow horizontal detectado no viewport 360px: largura ${narrowAudit.docWidth}px`);
    }
    if (narrowAudit.hoursWrapped) {
      throw new Error(`Texto de horários quebrou linha desnecessariamente no dock 360px: altura ${narrowAudit.hoursHeight}px`);
    }

    // 4.2 Teste de Viewport Ultra-Estreito 320px
    await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    const ultraNarrowAudit = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const logo = document.querySelector('.brand-logo-img');
      const logoRect = logo.getBoundingClientRect();
      const tb = document.querySelector('.wix-cms-toolbar');
      const tbInner = document.querySelector('.wix-cms-toolbar-inner');
      return {
        docWidth,
        logoW: logoRect.width,
        logoH: logoRect.height,
        isLogoSquashed: logoRect.width < 50,
        tbHeight: tb.offsetHeight,
        tbInnerHeight: tbInner.offsetHeight,
        isTbSpilling: tbInner.offsetHeight > tb.offsetHeight + 2
      };
    });
    console.log('Auditoria Viewport Ultra-Estreito 320px:', ultraNarrowAudit);
    if (ultraNarrowAudit.docWidth > 320) {
      throw new Error(`Overflow horizontal detectado no viewport 320px: largura ${ultraNarrowAudit.docWidth}px`);
    }
    if (ultraNarrowAudit.isLogoSquashed) {
      throw new Error(`Logo oficial foi deformada/espremida no viewport 320px: largura ${ultraNarrowAudit.logoW}px`);
    }
    if (ultraNarrowAudit.isTbSpilling) {
      throw new Error(`Toolbar CMS extravasou a altura fixa de 36px no mobile: altura ${ultraNarrowAudit.tbInnerHeight}px`);
    }

    // 4.3 Teste de Viewport Estreito 360px e 320px com Modo Tags Wix Ativado
    await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true });
    await page.click('#cmsToggleBtn');
    const tags360Width = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log('Auditoria Viewport Estreito 360px com tags ativadas:', { tags360Width });
    if (tags360Width > 360) {
      throw new Error(`Overflow horizontal detectado no modo tags em 360px: largura ${tags360Width}px`);
    }

    await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true });
    const tags320Width = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log('Auditoria Viewport Ultra-Estreito 320px com tags ativadas:', { tags320Width });
    if (tags320Width > 320) {
      throw new Error(`Overflow horizontal detectado no modo tags em 320px: largura ${tags320Width}px`);
    }
    await page.click('#cmsToggleBtn');

    // 4.4 Teste de Viewport Tablet / Desktop Estreito 900px
    await page.setViewport({ width: 900, height: 800 });
    const tabletAudit = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      return { docWidth, hasOverflow: docWidth > 900 };
    });
    console.log('Auditoria Viewport Tablet 900px:', tabletAudit);
    if (tabletAudit.hasOverflow) {
      throw new Error(`Overflow horizontal detectado no viewport 900px: largura ${tabletAudit.docWidth}px`);
    }

    // Restaura viewport desktop para os testes seguintes
    await page.setViewport({ width: 1440, height: 900 });

    // =========================================================================
    // 5. VALIDAÇÕES ESPECÍFICAS DA REFORMULAÇÃO LP 03 (DARK TECH ANTI-CLONE)
    // =========================================================================

    // ITEM 1: DARK HERO (#061A3B), SEM CARD BRANCO, TÍTULO E BOTÃO VERDE ESMERALDA
    console.log('5.1 Validando Dark Hero (#061A3B), Sem Card Branco e Botão Verde Esmeralda...');
    const heroAudit = await page.evaluate(() => {
      const hero = document.querySelector('.hero-ciatica-section');
      if (!hero) return { exists: false };
      const heroStyle = window.getComputedStyle(hero);
      const heroBg = heroStyle.backgroundColor;

      // Verifica se existe algum card branco dentro do Hero
      const allHeroElements = Array.from(hero.querySelectorAll('*'));
      const whiteCardViolations = [];
      allHeroElements.forEach(el => {
        const s = window.getComputedStyle(el);
        const bg = s.backgroundColor;
        // Se for um container/card com largura maior que 100px e fundo puramente branco
        if ((bg === 'rgb(255, 255, 255)' || bg === '#ffffff') && el.offsetWidth > 100 && el.offsetHeight > 50) {
          whiteCardViolations.push(`${el.tagName}.${el.className} [${bg}]`);
        }
      });

      const titleEl = hero.querySelector('.hero-title');
      const titleText = titleEl ? titleEl.innerText.replace(/\s+/g, ' ').trim() : '';

      const btn = hero.querySelector('.btn-hero-emerald');
      const btnStyle = btn ? window.getComputedStyle(btn) : null;
      const btnBg = btnStyle ? btnStyle.backgroundColor : '';
      const btnTopText = btn ? (btn.querySelector('.cta-label-top') ? btn.querySelector('.cta-label-top').innerText.trim() : '') : '';
      const btnSubText = btn ? (btn.querySelector('.cta-label-sub') ? btn.querySelector('.cta-label-sub').innerText.trim() : '') : '';

      const consoleEl = hero.querySelector('.hero-dark-console');
      const consoleImg = consoleEl ? consoleEl.querySelector('img') : null;
      const consoleImgSrc = consoleImg ? consoleImg.getAttribute('src') : '';

      return {
        exists: true,
        heroBg,
        isDarkHero: heroBg === 'rgb(6, 26, 59)',
        whiteCardViolations,
        titleText,
        hasRequiredTitle: titleText.includes('Dor no Nervo Ciático? A Queimação que Desce para a Perna Tem Tratamento sem Cirurgia'),
        btnBg,
        isEmeraldBtn: btnBg === 'rgb(16, 185, 129)',
        btnTopText,
        btnSubText,
        hasCorrectBtnText: btnTopText === 'Agendar Descompressão em Araucária' && btnSubText === 'Atendimento com hora marcada',
        consoleImgSrc,
        hasXrayImg: consoleImgSrc.includes('anatomia-nervo-ciatico.jpg')
      };
    });
    console.log('Auditoria do Dark Hero:', heroAudit);

    if (!heroAudit.exists) throw new Error('Seção Dark Hero (.hero-ciatica-section) não encontrada.');
    if (!heroAudit.isDarkHero) throw new Error(`Dark Hero não possui fundo #061A3B (rgb(6, 26, 59)). Encontrado: ${heroAudit.heroBg}`);
    if (heroAudit.whiteCardViolations.length > 0) {
      throw new Error(`VIOLAÇÃO ANTI-CLONE: Encontrado card branco dentro do Hero:\n${heroAudit.whiteCardViolations.join('\n')}`);
    }
    if (!heroAudit.hasRequiredTitle) {
      throw new Error(`Título do Hero não corresponde ao solicitado:\nEncontrado: "${heroAudit.titleText}"`);
    }
    if (!heroAudit.isEmeraldBtn) {
      throw new Error(`Botão do Hero não é Verde Esmeralda #10B981 (rgb(16, 185, 129)). Encontrado: ${heroAudit.btnBg}`);
    }
    if (!heroAudit.hasCorrectBtnText) {
      throw new Error(`Texto do botão do Hero incorreto: "${heroAudit.btnTopText}" / "${heroAudit.btnSubText}"`);
    }
    if (!heroAudit.hasXrayImg) {
      throw new Error(`Console Biomecânico não exibe a imagem anatomia-nervo-ciatico.jpg: ${heroAudit.consoleImgSrc}`);
    }

    // ITEM 2: O CAMINHO DA DOR (4 PASSOS) + FRASE DE DIAGNÓSTICO
    console.log('5.2 Validando O Caminho da Dor (4 Passos) e Frase de Diagnóstico...');
    const pathAudit = await page.evaluate(() => {
      const section = document.querySelector('.nerve-path-section');
      if (!section) return { exists: false };
      const steps = Array.from(section.querySelectorAll('.step-direct-card'));
      const stepTitles = steps.map(s => s.querySelector('.step-card-title') ? s.querySelector('.step-card-title').innerText.trim() : '');
      const alertBanner = section.querySelector('.diagnostic-alert-banner');
      const alertText = alertBanner ? alertBanner.innerText.replace(/\s+/g, ' ').trim() : '';

      return {
        exists: true,
        stepsCount: steps.length,
        stepTitles,
        hasAll4Steps: stepTitles.includes('Lombar') && stepTitles.includes('Glúteo') && stepTitles.includes('Coxa') && stepTitles.includes('Pé'),
        alertText,
        hasRequiredAlertPhrase: alertText.includes('Se a dor passa do joelho, seu nervo ciático está sob compressão mecânica.')
      };
    });
    console.log('Auditoria de O Caminho da Dor:', pathAudit);

    if (!pathAudit.exists) throw new Error('Seção O Caminho da Dor (.nerve-path-section) não encontrada.');
    if (pathAudit.stepsCount !== 4 || !pathAudit.hasAll4Steps) {
      throw new Error(`Os 4 passos ("Lombar", "Glúteo", "Coxa", "Pé") não foram encontrados: ${JSON.stringify(pathAudit.stepTitles)}`);
    }
    if (!pathAudit.hasRequiredAlertPhrase) {
      throw new Error(`Frase de diagnóstico não encontrada: "${pathAudit.alertText}"`);
    }

    // ITEM 3: BENTO GRID DA MACA (3 BLOCOS COM ALINHAMENTO DESKTOP)
    console.log('5.3 Validando Bento Grid da Maca (3 Blocos)...');
    const bentoAudit = await page.evaluate(() => {
      const grid = document.querySelector('.maca-bento-grid');
      if (!grid) return { exists: false };
      const cards = Array.from(grid.querySelectorAll('.bento-card'));
      const mainCard = grid.querySelector('.bento-card-main');
      const sideCards = Array.from(grid.querySelectorAll('.bento-card-side'));

      const mainImg = mainCard ? mainCard.querySelector('.clinical-room-img') : null;
      const mainVideo = mainCard ? mainCard.querySelector('#techVideoContainer') : null;
      const mainCaption = mainCard ? mainCard.querySelector('.bento-main-caption') : null;

      const sideTitles = sideCards.map(c => c.querySelector('.bento-card-title') ? c.querySelector('.bento-card-title').innerText.trim() : '');

      // Coordenadas para teste de layout desktop
      const rMain = mainCard ? mainCard.getBoundingClientRect() : null;
      const rSide1 = sideCards[0] ? sideCards[0].getBoundingClientRect() : null;
      const rSide2 = sideCards[1] ? sideCards[1].getBoundingClientRect() : null;

      return {
        exists: true,
        totalBlocks: cards.length,
        hasMainImg: mainImg && mainImg.getAttribute('src').includes('maca-descompressao-sala.jpg'),
        hasTechVideo: !!mainVideo,
        mainCaptionText: mainCaption ? mainCaption.innerText.trim() : '',
        sideTitles,
        hasBlock2: sideTitles.includes('Tração Milimétrica Computadorizada'),
        hasBlock3: sideTitles.includes('Alívio da Pressão no Disco'),
        rMain,
        rSide1,
        rSide2,
        isMainOnLeft: rMain && rSide1 && rMain.right <= rSide1.left + 10,
        isSideStacked: rSide1 && rSide2 && rSide1.bottom <= rSide2.top + 10,
        heightAligned: rMain && rSide1 && rSide2 && Math.abs(rMain.top - rSide1.top) < 15 && Math.abs(rMain.bottom - rSide2.bottom) < 25
      };
    });
    console.log('Auditoria do Bento Grid da Maca:', bentoAudit);

    if (!bentoAudit.exists || bentoAudit.totalBlocks !== 3) {
      throw new Error(`Bento Grid não possui exatamente 3 blocos. Encontrados: ${bentoAudit.totalBlocks}`);
    }
    if (!bentoAudit.hasMainImg) {
      throw new Error('Bloco Principal não contém a foto real da sala maca-descompressao-sala.jpg');
    }
    if (!bentoAudit.hasTechVideo) {
      throw new Error('Bloco Principal não contém o container de vídeo interativo #techVideoContainer');
    }
    if (!bentoAudit.mainCaptionText.includes('Maca de Descompressão Dinâmica em funcionamento clínico')) {
      throw new Error(`Legenda do Bloco Principal não confere: "${bentoAudit.mainCaptionText}"`);
    }
    if (!bentoAudit.hasBlock2 || !bentoAudit.hasBlock3) {
      throw new Error(`Blocos 2 ou 3 ausentes. Encontrados: ${JSON.stringify(bentoAudit.sideTitles)}`);
    }
    if (!bentoAudit.isMainOnLeft || !bentoAudit.isSideStacked) {
      throw new Error('Layout do Bento Grid incorreto: Bloco 1 deve ficar à esquerda e Blocos 2 e 3 empilhados à direita no desktop');
    }

    // ITEM 4: COMPARATIVO BIOMECÂNICO (SPLIT CARD COMERCIAL DARK TECH)
    console.log('5.4 Validando Comparativo Biomecânico: Split Card Antes vs. Depois...');
    const compAudit = await page.evaluate(() => {
      const section = document.querySelector('.comparison-section');
      if (!section) return { exists: false };
      const sectionBg = window.getComputedStyle(section).backgroundColor;
      const cardBefore = section.querySelector('.comp-card-before');
      const cardAfter = section.querySelector('.comp-card-after');
      const hasOldSvg = !!section.querySelector('.comp-svg-diagram') || section.innerHTML.includes('VÉRTEBRA LOMBAR L4');

      const beforeImg = cardBefore ? cardBefore.querySelector('img.comp-medical-img') : null;
      const afterImg = cardAfter ? cardAfter.querySelector('img.comp-medical-img') : null;

      const beforeText = cardBefore ? (cardBefore.textContent + ' ' + cardBefore.innerText) : '';
      const afterText = cardAfter ? (cardAfter.textContent + ' ' + cardAfter.innerText) : '';

      return {
        exists: true,
        sectionBg,
        isDarkBg: sectionBg === 'rgb(6, 26, 59)',
        hasOldSvg,
        hasBothCards: !!cardBefore && !!cardAfter,
        hasBeforeBadge: beforeText.includes('Sob Compressão Mecânica'),
        hasBeforeTitle: beforeText.includes('Antes: Raiz Nervosa Sufocada'),
        hasBeforeImg: !!beforeImg && (beforeImg.getAttribute('src') || '').includes('comparativo-antes-compressao.jpg') && beforeImg.complete && beforeImg.naturalWidth > 0,
        hasBeforeBullets:
          beforeText.includes('Vértebras coladas e perda do espaço discal') &&
          beforeText.includes('Nervo ciático comprimido gerando dor que desce para a perna') &&
          beforeText.includes('Inflamação contínua e travamento nos movimentos'),
        hasAfterBadge: afterText.includes('Espaço Articular Restaurado'),
        hasAfterTitle: afterText.includes('Depois: Descompressão Dinâmica Computadorizada'),
        hasAfterImg: !!afterImg && (afterImg.getAttribute('src') || '').includes('comparativo-depois-descompressao.jpg') && afterImg.complete && afterImg.naturalWidth > 0,
        hasAfterBullets:
          afterText.includes('Afastamento micrométrico controlado por computador') &&
          afterText.includes('Raiz do nervo ciático desimpedida e alívio da queimação') &&
          afterText.includes('Retorno gradual da mobilidade e alívio sem cirurgia')
      };
    });
    console.log('Auditoria do Comparativo Antes vs. Depois:', compAudit);

    if (!compAudit.exists || !compAudit.hasBothCards) {
      throw new Error('Seção de Comparativo (.comparison-section) ou containers Antes/Depois não encontrados.');
    }
    if (!compAudit.isDarkBg) {
      throw new Error(`Seção de Comparativo deve usar fundo Azul Noite #061A3B. Atual: ${compAudit.sectionBg}`);
    }
    if (compAudit.hasOldSvg) {
      throw new Error('VIOLAÇÃO: Desenho SVG tosco ("VÉRTEBRA LOMBAR L4") ainda está presente na seção #comparativo.');
    }
    if (!compAudit.hasBeforeBadge || !compAudit.hasBeforeTitle || !compAudit.hasBeforeImg || !compAudit.hasBeforeBullets) {
      throw new Error('Container "Antes: Raiz Nervosa Sufocada" não contém badge, título, imagem médica 3D ou os 3 pontos objetivos.');
    }
    if (!compAudit.hasAfterBadge || !compAudit.hasAfterTitle || !compAudit.hasAfterImg || !compAudit.hasAfterBullets) {
      throw new Error('Container "Depois: Descompressão Dinâmica Computadorizada" não contém badge, título, imagem médica 3D ou os 3 pontos objetivos.');
    }

    // ITEM 5: PROVA SOCIAL & UNIDADE ARAUCÁRIA
    console.log('5.5 Validando Prova Social e Card da Unidade Araucária...');
    const socialAudit = await page.evaluate(() => {
      const rawText = document.body.innerText;
      const rawHtml = document.documentElement.outerHTML;

      const hasQuote1 = rawText.includes('Voltei a dirigir sem queimação');
      const hasQuote2 = rawText.includes('Consigo caminhar sem mancar');
      const hasQuote3 = rawText.includes('Rotina ativa recuperada sem cirurgia');

      const unitCard = document.querySelector('.unit-authority-section');
      const hasUnitTitle = unitCard && rawHtml.includes('{title}');
      const hasEndereo = unitCard && rawHtml.includes('{endereoTexto}');
      const hasFisio1 = rawHtml.includes('GABRIELA AMARAL') && rawHtml.includes('354364-F');
      const hasFisio2 = rawHtml.includes('DÉBORA AMARAL') && rawHtml.includes('355151-F');
      const hasMapBtn = unitCard && unitCard.querySelector('[data-wix-field="linkVerNoMapa"]');
      const hasWppBtn = unitCard && unitCard.querySelector('[data-wix-field="linkWpp"]');

      return {
        hasQuote1,
        hasQuote2,
        hasQuote3,
        hasUnitCard: !!unitCard,
        hasUnitTitle,
        hasEndereo,
        hasFisio1,
        hasFisio2,
        hasMapBtn: !!hasMapBtn,
        hasWppBtn: !!hasWppBtn
      };
    });
    console.log('Auditoria de Prova Social e Unidade Araucária:', socialAudit);

    if (!socialAudit.hasQuote1 || !socialAudit.hasQuote2 || !socialAudit.hasQuote3) {
      throw new Error('Citações de depoimentos ("Voltei a dirigir sem queimação", "Consigo caminhar sem mancar", "Rotina ativa recuperada sem cirurgia") não encontradas.');
    }
    if (!socialAudit.hasUnitCard || !socialAudit.hasFisio1 || !socialAudit.hasFisio2) {
      throw new Error('Card da Unidade Araucária ou Fisioterapeutas Responsáveis oficiais (Dra. Gabriela e Dra. Débora com CREFITO) não encontrados.');
    }

    // ITEM 6: FAQ OBJETIVO (EXATAMENTE AS 4 PERGUNTAS)
    console.log('5.6 Validando FAQ Objetivo (Exatamente as 4 Perguntas)...');
    const faqAudit = await page.evaluate(() => {
      const section = document.querySelector('.faq-ciatica-section');
      if (!section) return { exists: false };
      const items = Array.from(section.querySelectorAll('.faq-accordion-item'));
      const questions = items.map(it => it.querySelector('.faq-question-text') ? it.querySelector('.faq-question-text').innerText.trim() : '');

      return {
        exists: true,
        count: items.length,
        questions,
        hasQ1: questions.includes('Dói para fazer?'),
        hasQ2: questions.includes('Quantas sessões?'),
        hasQ3: questions.includes('Precisa de encaminhamento?'),
        hasQ4: questions.includes('Onde fica a clínica?')
      };
    });
    console.log('Auditoria do FAQ Objetivo:', faqAudit);

    if (!faqAudit.exists || faqAudit.count !== 4) {
      throw new Error(`FAQ deve conter exatamente 4 perguntas. Encontradas: ${faqAudit.count}`);
    }
    if (!faqAudit.hasQ1 || !faqAudit.hasQ2 || !faqAudit.hasQ3 || !faqAudit.hasQ4) {
      throw new Error(`As 4 perguntas obrigatórias do FAQ não foram encontradas:\n${JSON.stringify(faqAudit.questions)}`);
    }

    // ITEM 7: VETO AO VERMELHO E VALIDAÇÃO DOS 19 PLACEHOLDERS WIX CMS & COMPLIANCE
    console.log('5.7 Validando Veto ao Vermelho, 19 Placeholders Wix CMS e Compliance...');
    const complianceAudit = await page.evaluate(() => {
      const rawHtml = document.documentElement.outerHTML;
      const text = document.body.innerText;
      const violations = [];

      // Veto a botões vermelhos
      const buttons = Array.from(document.querySelectorAll('a[class*="btn"], button[class*="btn"]'));
      buttons.forEach(btn => {
        const style = window.getComputedStyle(btn);
        const bg = (style.backgroundColor || '') + ' ' + (style.backgroundImage || '');
        const color = style.color || '';
        if (/b10f0b|8c0b08|9e0d09|760907|177,\s*15,\s*11|140,\s*11,\s*8|rgb\(255,\s*0,\s*0\)|#ff0000|#e11d48|#dc2626|#ef4444/i.test(bg + ' ' + color)) {
          violations.push(`Botão com vermelho proibido: ${btn.className} [${bg}]`);
        }
      });

      // Veto a atributos pessoais associados a dor
      if (/\bsua dor\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "sua dor"');
      if (/\bseu corpo\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "seu corpo"');
      if (/\bseu quadro\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "seu quadro"');
      if (/\bseu problema\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "seu problema"');
      if (/\bseus sintomas\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "seus sintomas"');
      if (/\bsuas?\s+atividades\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "suas atividades"');
      if (/\bsua perna\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "sua perna"');

      // Veto a promessas absolutas
      if (/viver sem dor/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "viver sem dor"');
      if (/cura definitiva/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "cura definitiva"');
      if (/\bgarantido\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "garantido"');
      if (/a única solução/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "a única solução"');
      if (/a principal causa/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "a principal causa"');
      if (/com certeza/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "com certeza"');
      if (/alívio imediato/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "alívio imediato"');
      if (/100%\s+garantido/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "100% garantido"');
      if (/100%\s+eficaz/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "100% eficaz"');

      // Veto a links de fuga
      if (/link na bio/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "link na bio"');

      // Veto a travessões artificiais
      if (/—|--/.test(text)) violations.push('VIOLAÇÃO: Encontrado travessão de IA');

      // Verificação rigorosa dos 19 Placeholders do Wix CMS
      const placeholdersFound = {
        title: rawHtml.includes('{title}'),
        horario: rawHtml.includes('{horario}'),
        diasSemana: rawHtml.includes('{diasSemana}'),
        linkWpp: rawHtml.includes('{linkWpp}'),
        endereoTexto: rawHtml.includes('{endereoTexto}'),
        telefone: rawHtml.includes('{telefone}'),
        whatsapp: rawHtml.includes('{whatsapp}'),
        linkVerNoMapa: rawHtml.includes('{linkVerNoMapa}'),
        slidesFotosUnidades: rawHtml.includes('{slidesFotosUnidades}'),
        imagemFisio: rawHtml.includes('{imagemFisio}'),
        fisioterapeutasResponsveis: rawHtml.includes('{fisioterapeutasResponsveis}'),
        imagemFisio1: rawHtml.includes('{imagemFisio1}'),
        fisioterapeutasResponsveis1: rawHtml.includes('{fisioterapeutasResponsveis1}'),
        video_youtube_pq_dores_costas: rawHtml.includes('{video_youtube_pq_dores_costas}'),
        video_youtube_depoimento_1: rawHtml.includes('{video_youtube_depoimento_1}'),
        video_youtube_depoimento_2: rawHtml.includes('{video_youtube_depoimento_2}'),
        video_youtube_depoimento_3: rawHtml.includes('{video_youtube_depoimento_3}'),
        redessociais: rawHtml.includes('{redessociais}'),
        redessociais1: rawHtml.includes('{redessociais1}')
      };

      const fontLoaded = document.fonts.check('16px Lufga');

      return {
        violations,
        placeholdersFound,
        fontLoaded
      };
    });
    console.log('Auditoria de Placeholders e Compliance:', complianceAudit);

    if (complianceAudit.violations.length > 0) {
      throw new Error('Falha de compliance detectada:\n' + complianceAudit.violations.join('\n'));
    }

    const missingPlaceholders = Object.keys(complianceAudit.placeholdersFound).filter(k => !complianceAudit.placeholdersFound[k]);
    if (missingPlaceholders.length > 0) {
      throw new Error('Placeholders Wix CMS ausentes:\n' + missingPlaceholders.join('\n'));
    }

    // 8.1 Teste Interativo de Vídeos (Offset Click e Keyboard Enter/Space)
    console.log('8.1 Testando Interatividade e Acessibilidade dos Players de Vídeo...');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      const c = document.querySelector('#techVideoContainer');
      if (c) c.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 200));

    // Teste de clique com mouse fora do centro (offset 80, 80)
    const techVideoBox = await page.evaluate(() => {
      const el = document.querySelector('#techVideoContainer');
      const r = el.getBoundingClientRect();
      return { x: r.left + 80, y: r.top + 80 };
    });
    await page.mouse.click(techVideoBox.x, techVideoBox.y);
    await new Promise(r => setTimeout(r, 200));

    const techPlayAudit = await page.evaluate(() => {
      const c = document.querySelector('#techVideoContainer');
      const iframe = c.querySelector('iframe');
      const overlay = c.querySelector('.video-poster-overlay');
      return {
        hasOverlay: !!overlay,
        iframeSrc: iframe ? iframe.src : '',
        autoplayActive: iframe ? iframe.src.includes('autoplay=1') : false
      };
    });
    console.log('Auditoria de Play por Clique no Poster:', techPlayAudit);

    if (techPlayAudit.hasOverlay || !techPlayAudit.autoplayActive) {
      throw new Error('Falha no clique do vídeo técnico: poster não foi substituído por iframe com autoplay.');
    }

    // Teste de acessibilidade por teclado (Enter no depoimento 1)
    await page.evaluate(() => {
      const el = document.querySelector('#depoimentos .testimonial-media-wrap .video-poster-overlay');
      if (el) el.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 200));
    await page.focus('#depoimentos .testimonial-media-wrap .video-poster-overlay');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 200));

    const keyPlayAudit = await page.evaluate(() => {
      const c = document.querySelector('#depoimentos .testimonial-media-wrap');
      const iframe = c.querySelector('iframe');
      const overlay = c.querySelector('.video-poster-overlay');
      return {
        hasOverlay: !!overlay,
        iframeSrc: iframe ? iframe.src : '',
        autoplayActive: iframe ? iframe.src.includes('autoplay=1') : false
      };
    });
    console.log('Auditoria de Play por Teclado (Enter):', keyPlayAudit);

    if (keyPlayAudit.hasOverlay || !keyPlayAudit.autoplayActive) {
      throw new Error('Falha de acessibilidade: tecla Enter não acionou reprodução do vídeo de depoimento.');
    }

    // Teste de acessibilidade por tecla Espaço (Space no depoimento 2)
    await page.evaluate(() => {
      const cards = document.querySelectorAll('#depoimentos .testimonial-video-card');
      if (cards.length >= 2) {
        const overlay = cards[1].querySelector('.video-poster-overlay');
        if (overlay) overlay.scrollIntoView();
      }
    });
    await new Promise(r => setTimeout(r, 200));
    await page.focus('#depoimentos .testimonial-video-card:nth-child(2) .video-poster-overlay');
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 200));

    const spacePlayAudit = await page.evaluate(() => {
      const cards = document.querySelectorAll('#depoimentos .testimonial-video-card');
      if (cards.length < 2) return { hasOverlay: true, autoplayActive: false };
      const c = cards[1].querySelector('.testimonial-media-wrap');
      const iframe = c ? c.querySelector('iframe') : null;
      const overlay = c ? c.querySelector('.video-poster-overlay') : null;
      return {
        hasOverlay: !!overlay,
        iframeSrc: iframe ? iframe.src : '',
        autoplayActive: iframe ? iframe.src.includes('autoplay=1') : false
      };
    });
    console.log('Auditoria de Play por Teclado (Space):', spacePlayAudit);

    if (spacePlayAudit.hasOverlay || !spacePlayAudit.autoplayActive) {
      throw new Error('Falha de acessibilidade: tecla Espaço não acionou reprodução do vídeo de depoimento 2.');
    }

    // 9. Teste de Borda com Parâmetros Dinâmicos e Nome de Unidade Longo
    console.log('9. Testando Parâmetros Dinâmicos e Nome Longo de Unidade...');
    const edgeUrl = fileUrl + '?unidade=' + encodeURIComponent('UNIDADE PRESIDENTE PRUDENTE E SÃO JOSÉ DO RIO PRETO - SP') +
      '&whatsapp=18999998888&telefone=(18)%203222-1111&endereco=Avenida%20Coronel%20Jos%C3%A9%20Soares%20Marcondes%2C%201200&horario=07:30%20-%2019:00&diasSemana=Seg-Sab&fisio1=' + encodeURIComponent('DRA. CARLA SILVA - CREFITO 8 / 12345-F');
    
    await page.goto(edgeUrl, { waitUntil: 'networkidle0' });

    const dynamicAudit = await page.evaluate(() => {
      const headerTitle = document.querySelector('.site-header .unit-dynamic-pill .wix-field-marker').textContent;
      const headerHeight = document.querySelector('.site-header').offsetHeight;
      const dockTitle = document.querySelector('.mobile-unit-title').textContent;
      const enderecoText = document.querySelector('[data-wix-tag="{endereoTexto}"]').textContent;
      const wppLink = document.querySelector('#heroCtaButton').href;
      const wppTexts = Array.from(document.querySelectorAll('[data-wix-tag="{whatsapp}"]')).map(el => el.textContent.trim());
      const telTexts = Array.from(document.querySelectorAll('[data-wix-tag="{telefone}"]')).map(el => el.textContent.trim());
      const fisioText = document.querySelector('[data-wix-tag="{fisioterapeutasResponsveis}"]').textContent.trim();

      return {
        headerTitle,
        headerHeight,
        dockTitle,
        enderecoText,
        wppLinkMatches: wppLink.includes('5518999998888'),
        wppTextMatches: wppTexts.every(t => t.includes('(18) 99999-8888')),
        telTextMatches: telTexts.every(t => t.includes('(18) 3222-1111')),
        fisioMatches: fisioText.includes('CARLA SILVA')
      };
    });
    console.log('Auditoria do Teste de Borda Dinâmico:', dynamicAudit);

    if (!dynamicAudit.headerTitle.includes('PRESIDENTE PRUDENTE')) {
      throw new Error('Parâmetro dinâmico da unidade não refletiu no cabeçalho.');
    }
    if (!dynamicAudit.wppLinkMatches) {
      throw new Error('Link dinâmico de WhatsApp não foi atualizado corretamente.');
    }
    if (!dynamicAudit.wppTextMatches) {
      throw new Error('Número de WhatsApp exibido na página não foi sincronizado dinamicamente.');
    }
    if (!dynamicAudit.telTextMatches) {
      throw new Error('Telefone fixo exibido na página não foi sincronizado dinamicamente.');
    }
    if (!dynamicAudit.fisioMatches) {
      throw new Error('Fisioterapeuta responsável não foi atualizado dinamicamente via parâmetro.');
    }

    // 9.1 Teste de Responsividade com Parâmetros Longos em Viewports Mobile
    for (const w of [390, 360, 320]) {
      await page.setViewport({ width: w, height: 640, isMobile: true, hasTouch: true });
      const dynamicDocW = await page.evaluate(() => document.documentElement.scrollWidth);
      console.log(`Auditoria Responsiva Dinâmica em ${w}px com nome longo: docWidth = ${dynamicDocW}px`);
      if (dynamicDocW > w) {
        throw new Error(`Overflow horizontal detectado com parâmetros dinâmicos longos no viewport ${w}px: largura ${dynamicDocW}px`);
      }
    }

    console.log('=== TODOS OS TESTES PASSARAM COM 100% DE SUCESSO NA REFORMULAÇÃO DA LP 03! ===');
  } catch (err) {
    console.error('ERRO NA AUDITORIA:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
