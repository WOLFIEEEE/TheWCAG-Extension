/**
 * DevTools Entry Point
 * Creates the WCAG panel in Chrome DevTools
 */

import { createLogger } from '../lib/logger';

const logger = createLogger('DevTools');

chrome.devtools.panels.create(
  'WCAG Contrast',
  'icons/icon-32.png',
  'src/devtools/panel.html',
  (panel) => {
    logger.debug('WCAG Contrast panel created');
    
    // Panel shown callback
    panel.onShown.addListener((_window) => {
      logger.debug('Panel shown');
    });

    // Panel hidden callback
    panel.onHidden.addListener(() => {
      logger.debug('Panel hidden');
    });
  }
);



