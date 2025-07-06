// ==UserScript==
// @name         Fanatical Auto Fetch + Open Steam (Fixed Loader)
// @namespace    KoK
// @author       KoK
// @version      2.1
// @description  Reveal and fetch Steam keys from Fanatical and open registerkey page in Steam
// @match        https://www.fanatical.com/en/orders/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let keysData = [];

    function createButton() {
        if (document.getElementById('fetchKeys')) return;
        const btn = document.createElement('button');
        btn.textContent = 'Fetch Steam Keys';
        btn.id = 'fetchKeys';
        Object.assign(btn.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 9999,
            padding: '10px 15px',
            backgroundColor: '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        });
        document.body.appendChild(btn);
    }

    function openSteam(keys) {
        const steamURL = 'https://store.steampowered.com/account/registerkey?key=' + keys.join(',');
        window.open(steamURL, '_blank');
    }

    function collectKeys() {
        keysData = [];

        document.querySelectorAll('input[type="text"].form-control').forEach(input => {
            const match = input.value.trim().match(/[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}/g);
            if (match) keysData.push(...match);
        });

        document.querySelectorAll('.redeem-key__key-copy-text, .redeem-key__key-text').forEach(span => {
            const matches = span.textContent.trim().match(/[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}/g);
            if (matches) keysData.push(...matches);
        });

        keysData = [...new Set(keysData)];
        console.log('[Fanatical Debug] Final filtered keys:', keysData);
    }

    async function revealKeysSequentially(buttons, updateStatus) {
        for (let i = 0; i < buttons.length; i++) {
            updateStatus(`Revealing ${i + 1}/${buttons.length}...`);
            buttons[i].click();
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    function setup() {
        createButton();

        document.getElementById('fetchKeys').addEventListener('click', async () => {
            const btn = document.getElementById('fetchKeys');
            btn.textContent = 'Scanning...';
            console.clear();

            const revealButtons = Array.from(document.querySelectorAll('button.btn.btn-primary'))
                .filter(btn => btn.textContent.trim().toLowerCase().includes('reveal'));

            if (revealButtons.length === 0) {
                console.log('[Fanatical Debug] No reveal buttons found – assuming keys already revealed.');
            } else {
                console.log('[Fanatical Debug] Found', revealButtons.length, 'reveal buttons');
                await revealKeysSequentially(revealButtons, status => (btn.textContent = status));
                btn.textContent = 'Waiting for keys...';
                await new Promise(r => setTimeout(r, 3000));
            }

            collectKeys();

            if (keysData.length === 0) {
                btn.textContent = 'No keys found';
            } else {
                btn.textContent = `${keysData.length} Key(s) – Opening Steam`;
                openSteam(keysData);
            }
        });
    }

    function waitForContentThenSetup() {
        const interval = setInterval(() => {
            const container = document.querySelector('.account-content, .redeem-key__key-text');
            if (container) {
                if (!document.getElementById('fetchKeys')) {
                    console.log('[Fanatical Debug] Content ready – running setup');
                    setup();
                }
                clearInterval(interval);
            }
        }, 500);
    }

    waitForContentThenSetup();

    // Fallback observer for dynamic changes or partial loads
    const observer = new MutationObserver(() => {
        const container = document.querySelector('.account-content, .redeem-key__key-text');
        if (container && !document.getElementById('fetchKeys')) {
            console.log('[Fanatical Debug] Mutation triggered setup');
            setup();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
