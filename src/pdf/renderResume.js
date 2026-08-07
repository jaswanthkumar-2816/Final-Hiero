/**
 * src/pdf/renderResume.js
 * Targeted fix to resume pagination logic, bullet point rendering, and MAX-FIT 1-Page optimization.
 * Restructures all bullet items into a 2-column flexbox hanging-indent layout (bullet icon + text block),
 * ensuring wrapped lines align perfectly with the start of text and never wrap under the bullet or margin.
 * Implements MAX-FIT 1-Page auto-scaling to force every resume (including uploaded old resumes with extensive data)
 * onto 1 single page with crisp legibility.
 */

// --- PAGE HEIGHT & MARGIN CONSTANTS ---
// Printable area = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM
// A4 dimensions at 96 DPI: 210mm x 297mm -> height = 1122.52px (standard CSS pixels)
const PAGE_HEIGHT = 1122.52; // Total A4 page height in pixels
const MARGIN_TOP = 0;       // Top margin in pixels (matches PDF options margin)
const MARGIN_BOTTOM = 0;    // Bottom margin in pixels (matches PDF options margin)

// Calculated printable area on a single page
const PRINTABLE_PAGE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

/**
 * Pagination and layout engine injected into Puppeteer browser DOM.
 * Applies 1-Page Max-Fit auto-scaling, transforms bullet lists into flexbox hanging-indent layouts,
 * measures section and item heights, pushes non-fitting bullets cleanly to the next page when multi-page is required,
 * and eliminates trailing blank pages.
 * 
 * @param {number} pageHeight - Total page height in px
 * @param {number} marginTop - Top margin in px
 * @param {number} marginBottom - Bottom margin in px
 */
function paginateResumeInBrowser(pageHeight, marginTop, marginBottom) {
    // Height-check: Define printable page area from PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM
    const TOTAL_HEIGHT = pageHeight || 1122.52;
    const M_TOP = marginTop || 0;
    const M_BOTTOM = marginBottom || 0;
    
    // Printable space per page threshold
    const PRINTABLE_HEIGHT = TOTAL_HEIGHT - M_TOP - M_BOTTOM;

    // Helper: calculate absolute Y offset of element relative to page scroll
    function getOffsetTop(element) {
        const rect = element.getBoundingClientRect();
        return rect.top + window.scrollY;
    }

    // 1. Inject global stylesheet for print layout, hanging indents, and bullet resets
    const styleEl = document.createElement('style');
    styleEl.id = 'hiero-bullet-pagination-styles';
    styleEl.textContent = `
        /* Reset list containers */
        ul, ol {
            padding-left: 0 !important;
            margin-top: 2pt !important;
            margin-bottom: 3pt !important;
            list-style-type: none !important;
            list-style-position: outside !important;
        }

        /* Flexbox hanging indent for all bullet items */
        .hiero-bullet-item {
            display: flex !important;
            align-items: flex-start !important;
            gap: 5px !important;
            margin-bottom: 2pt !important;
            padding: 0 !important;
            text-indent: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            max-width: 100% !important;
        }

        .hiero-bullet-icon {
            flex-shrink: 0 !important;
            display: inline-block !important;
            font-weight: bold !important;
            line-height: 1.25 !important;
            user-select: none !important;
        }

        .hiero-bullet-text {
            flex: 1 !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            line-height: 1.25 !important;
            display: block !important;
        }

        /* Prevent overflow outside printable container */
        * {
            box-sizing: border-box !important;
            max-width: 100% !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
        }

        @media print {
            .page { height: auto !important; min-height: 100% !important; overflow: visible !important; }
            * { page-break-after: auto; }
        }
    `;
    document.head.appendChild(styleEl);

    // 2. Transform all bullet lists (li) and custom bullet elements (div, p, span, td) into 2-column flexbox hanging indent layout
    const bulletCandidates = Array.from(document.querySelectorAll('li, div, p, span, td'));
    const bulletPrefixRegex = /^[\*\-\•\–\►]\s*/;

    bulletCandidates.forEach(el => {
        if (el.classList.contains('hiero-bullet-item')) return;

        const isLi = el.tagName.toLowerCase() === 'li';
        const hasNoBlockChildren = Array.from(el.children).every(child => 
            !['div', 'p', 'ul', 'ol', 'li', 'table', 'section'].includes(child.tagName.toLowerCase())
        );

        if (isLi || (hasNoBlockChildren && el.textContent)) {
            const rawText = el.textContent.trim();
            if (!rawText) return;

            // Check if item is a list item or starts with a bullet symbol
            if (isLi || bulletPrefixRegex.test(rawText)) {
                // Extract clean text without leading bullet symbol
                const cleanText = rawText.replace(bulletPrefixRegex, '').trim();
                if (!cleanText) return;

                // Transform element into flexbox hanging-indent layout
                el.classList.add('hiero-bullet-item');
                el.style.display = 'flex';
                el.style.alignItems = 'flex-start';
                el.style.gap = '5px';
                el.style.marginBottom = '2pt';
                el.style.listStyleType = 'none';
                el.style.pageBreakInside = 'avoid';
                el.style.breakInside = 'avoid';

                // Preserve original computed text color if defined
                const computedColor = window.getComputedStyle(el).color;
                const colorStyle = computedColor ? `color: ${computedColor};` : '';

                el.innerHTML = `
                    <span class="hiero-bullet-icon" style="flex-shrink: 0; display: inline-block; font-weight: bold; ${colorStyle}">•</span>
                    <span class="hiero-bullet-text" style="flex: 1; word-break: break-word; overflow-wrap: break-word; ${colorStyle}">${cleanText}</span>
                `;
            }
        }
    });

    // 3. MAX-FIT 1-PAGE AUTO-FIT ENGINE
    // Measure total rendered height of resume content across all template structures (div.page, table, body, documentElement)
    const pageContainer = document.querySelector('.page') || document.body;
    let initialHeight = Math.max(
        pageContainer.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.scrollHeight
    );
    let isSinglePageMaxFit = false;

    if (initialHeight > PRINTABLE_HEIGHT) {
        const scaleRatio = PRINTABLE_HEIGHT / initialHeight;

        // MAX-FIT range: Scale content down so every resume fits on 1 single page
        if (scaleRatio >= 0.45) {
            // Tighten section headers
            document.querySelectorAll('.section-title, .section-header, .title-section, h2, h3').forEach(el => {
                el.style.marginTop = '2pt';
                el.style.marginBottom = '1.5pt';
                el.style.paddingBottom = '1pt';
            });

            // Tighten item margins
            document.querySelectorAll('.item, .experience-item, .education-item, .project-item, .entry, .job, .hiero-bullet-item, li').forEach(el => {
                el.style.marginBottom = '1.5pt';
            });

            // Tighten text line heights
            document.querySelectorAll('.content, p, li, .hiero-bullet-text').forEach(el => {
                el.style.lineHeight = '1.2';
            });

            // Re-measure after tightening spacing
            let tightenedHeight = Math.max(
                pageContainer.scrollHeight,
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            );

            const fineScale = Math.max(0.50, Math.min(0.98, (PRINTABLE_HEIGHT / tightenedHeight) * 0.98));
            
            // Apply zoom / scale to both body and pageContainer for 100% template compatibility
            document.body.style.zoom = String(fineScale);
            if (pageContainer !== document.body) {
                pageContainer.style.zoom = String(fineScale);
            }

            // Flag as MAX FIT single page so multi-page split pass does not insert break-before rules
            isSinglePageMaxFit = true;
        }
    }

    // 4. Identify sections across all templates using universal section selectors
    let sections = Array.from(document.querySelectorAll(
        'section, .section, .resume-section, .section-block, [data-section]'
    ));

    // Fallback: If sections are not wrapped in containers, group titles with following items
    if (sections.length === 0) {
        const titles = Array.from(document.querySelectorAll(
            '.section-title, .section-header, .title-section, .rotate-text, h2, h3'
        ));

        titles.forEach(title => {
            const wrapper = document.createElement('div');
            wrapper.className = 'resume-section-wrapper';
            title.parentNode.insertBefore(wrapper, title);

            let curr = title;
            while (curr) {
                const next = curr.nextElementSibling;
                wrapper.appendChild(curr);
                if (!next || next.matches('.section-title, .section-header, .title-section, .rotate-text, h2, h3')) {
                    break;
                }
                curr = next;
            }
            sections.push(wrapper);
        });
    }

    // 5. Multi-page fallback pagination (ONLY run if content could NOT be auto-fitted onto 1 page)
    if (!isSinglePageMaxFit) {
        sections.forEach(section => {
            const textContent = (section.textContent || '').trim();
            if (!textContent) return;

            let sectionTop = getOffsetTop(section);
            let sectionHeight = section.getBoundingClientRect().height;

            let currentPageIndex = Math.floor(sectionTop / PRINTABLE_HEIGHT);
            let currentPageBottom = (currentPageIndex + 1) * PRINTABLE_HEIGHT;
            let remainingSpaceOnPage = currentPageBottom - sectionTop;

            if (sectionHeight > remainingSpaceOnPage) {
                const isAtPageTop = (sectionTop % PRINTABLE_HEIGHT) < 10;
                if (!isAtPageTop) {
                    section.style.breakBefore = 'page';
                    section.style.pageBreakBefore = 'always';

                    sectionTop = getOffsetTop(section);
                    currentPageIndex = Math.floor(sectionTop / PRINTABLE_HEIGHT);
                    currentPageBottom = (currentPageIndex + 1) * PRINTABLE_HEIGHT;
                    remainingSpaceOnPage = currentPageBottom - sectionTop;
                }
            }

            const items = Array.from(section.querySelectorAll(
                '.hiero-bullet-item, li, [data-bullet-item="true"], .bullet-item, .item, .experience-item, .education-item, .project-item, .entry, .job, .resume-item, tr, .item-title, .content > div'
            ));

            items.forEach(item => {
                const itemTop = getOffsetTop(item);
                const itemHeight = item.getBoundingClientRect().height;

                const itemPageIndex = Math.floor(itemTop / PRINTABLE_HEIGHT);
                const itemPageBottom = (itemPageIndex + 1) * PRINTABLE_HEIGHT;
                const itemRemainingSpace = itemPageBottom - itemTop;

                if (itemHeight >= PRINTABLE_HEIGHT) {
                    item.style.breakInside = 'auto';
                    item.style.pageBreakInside = 'auto';
                } else if (itemHeight > itemRemainingSpace) {
                    const isItemAtPageTop = (itemTop % PRINTABLE_HEIGHT) < 10;
                    if (!isItemAtPageTop) {
                        item.style.breakBefore = 'page';
                        item.style.pageBreakBefore = 'always';
                    }
                }
            });
        });
    }

    // 6. Detect and remove trailing blank page / empty trailing elements
    const pageContainers = Array.from(document.querySelectorAll('.page, body'));
    pageContainers.forEach(container => {
        let lastNode = container.lastElementChild;
        while (lastNode && (!lastNode.textContent || !lastNode.textContent.trim())) {
            const prev = lastNode.previousElementSibling;
            lastNode.remove();
            lastNode = prev;
        }
    });
}

/**
 * Renders a resume template to PDF via Puppeteer using MAX-FIT 1-Page auto-scaling and hanging bullet layout.
 * 
 * @param {import('puppeteer').Page} page - Active Puppeteer page instance
 * @param {string} html - HTML string of the resume
 * @param {Object} [pdfOptions] - Additional Puppeteer page.pdf options
 * @returns {Promise<Buffer>} Buffer containing generated PDF binary
 */
async function renderResumeWithPagination(page, html, pdfOptions = {}) {
    await page.emulateMediaType('screen');
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluateHandle('document.fonts.ready');

    // Perform height measurement, MAX-FIT 1-Page auto-scaling, hanging bullet styling, and page break insertion in browser context
    await page.evaluate(paginateResumeInBrowser, PAGE_HEIGHT, MARGIN_TOP, MARGIN_BOTTOM);

    // Generate PDF output with exact A4 printable page dimensions
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        timeout: 20000,
        margin: {
            top: `${MARGIN_TOP}px`,
            right: '0px',
            bottom: `${MARGIN_BOTTOM}px`,
            left: '0px'
        },
        ...pdfOptions
    });

    return pdfBuffer;
}

module.exports = {
    PAGE_HEIGHT,
    MARGIN_TOP,
    MARGIN_BOTTOM,
    PRINTABLE_PAGE_HEIGHT,
    paginateResumeInBrowser,
    renderResumeWithPagination
};
