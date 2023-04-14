/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-unused-expressions */

import { html } from 'lit';
import {
  fixture, expect, waitUntil, aTimeout,
} from '@open-wc/testing';

import '../src/app.js';
import { stub } from 'sinon';
import { recursiveQuery, simulateTyping } from './test-utils.js';
import AppModel from '../src/models/app-model.js';

const singleSheetPath = 'https://main--helix-test-content-onedrive--adobe.hlx.page/block-library-tests/library-single-sheet.json';
const multiSheetPath = 'https://main--helix-test-content-onedrive--adobe.hlx.page/block-library-tests/library-multi-sheet.json';
const unknownPluginPath = 'https://main--helix-test-content-onedrive--adobe.hlx.page/block-library-tests/library-unknown-plugin.json';

describe('FranklinLibrary', () => {
  beforeEach(() => {
    window.libraryDev = true;
  });
  it('renders container', async () => {
    const element = await fixture(html`<franklin-library></franklin-library>`);
    const container = element.shadowRoot.querySelector('.container');
    await expect(container).to.not.be.null;
  });

  it('passes the a11y audit', async () => {
    const element = await fixture(html`<franklin-library></franklin-library>`);
    await expect(element).shadowDom.to.be.accessible();
  });

  it('error message when no config', async () => {
    const library = document.createElement('franklin-library');

    await fixture(library);

    await waitUntil(
      () => recursiveQuery(library, 'illustrated-message'),
      'Element did not render children',
    );
  });

  it('loads single sheet', async () => {
    const library = document.createElement('franklin-library');
    library.config = {
      library: singleSheetPath,
    };

    await fixture(library);

    await waitUntil(
      () => recursiveQuery(library, 'sp-sidenav-item'),
      'Element did not render children',
    );

    const sideNav = recursiveQuery(library, 'sp-sidenav');
    const items = sideNav.querySelectorAll('sp-sidenav-item');
    expect([...items].length).to.equal(1);
  });

  it('loads supplied sheet', async () => {
    const urlParams = new URLSearchParams();
    urlParams.append('library', singleSheetPath);
    const searchStub = stub(URLSearchParams.prototype, 'entries');
    searchStub.onCall(0).returns(urlParams);

    const library = document.createElement('franklin-library');

    await fixture(library);

    await waitUntil(
      () => recursiveQuery(library, 'sp-sidenav-item'),
      'Element did not render children',
    );

    const sideNav = recursiveQuery(library, 'sp-sidenav');
    const items = sideNav.querySelectorAll('sp-sidenav-item');
    expect([...items].length).to.equal(1);
    searchStub.restore();
  });

  it('loads supplied sheet with supplied extends', async () => {
    const urlParams = new URLSearchParams();
    urlParams.append('library', singleSheetPath);
    urlParams.append('extends', multiSheetPath);

    const searchStub = stub(URLSearchParams.prototype, 'entries');
    searchStub.onCall(0).returns(urlParams);

    const library = document.createElement('franklin-library');

    await fixture(library);

    await waitUntil(
      () => recursiveQuery(library, 'sp-sidenav-item'),
      'Element did not render children',
    );

    const sideNav = recursiveQuery(library, 'sp-sidenav');
    const items = sideNav.querySelectorAll('sp-sidenav-item');
    expect([...items].length).to.equal(2);
    searchStub.restore();
  });

  it('loads multi sheet', async () => {
    const library = document.createElement('franklin-library');
    library.config = {
      library: multiSheetPath,
    };

    await fixture(library);

    await waitUntil(
      () => recursiveQuery(library, 'sp-sidenav-item'),
      'Element did not render children',
    );

    const sideNav = recursiveQuery(library, 'sp-sidenav');
    const items = sideNav.querySelectorAll('sp-sidenav-item');
    expect([...items].length).to.equal(2);
  });

  it('loads extended library', async () => {
    const library = document.createElement('franklin-library');
    library.config = {
      library: multiSheetPath,
      extends: unknownPluginPath,
    };

    await fixture(library);

    await waitUntil(
      () => recursiveQuery(library, 'sp-sidenav-item'),
      'Element did not render children',
    );

    const sideNav = recursiveQuery(library, 'sp-sidenav');
    const items = sideNav.querySelectorAll('sp-sidenav-item');
    expect([...items].length).to.equal(4);
  });

  it('unknown plugin', async () => {
    const library = document.createElement('franklin-library');
    library.config = {
      library: unknownPluginPath,
    };

    await fixture(library);

    await waitUntil(
      () => recursiveQuery(library, 'sp-sidenav-item'),
      'Element did not render children',
    );

    const sideNav = recursiveQuery(library, 'sp-sidenav');

    sideNav.value = 'Foobar';
    sideNav.dispatchEvent(new Event('click'));

    const toast = recursiveQuery(library, 'sp-toast');
    expect(toast).to.be.visible;
    expect(toast.getAttribute('variant')).to.equal('negative');
  });

  it('unload plugin', async () => {
    const library = document.createElement('franklin-library');
    library.config = {
      library: singleSheetPath,
    };

    await fixture(library);

    await waitUntil(
      () => recursiveQuery(library, 'sp-sidenav-item'),
      'Element did not render children',
    );

    const sideNav = recursiveQuery(library, 'sp-sidenav');
    sideNav.value = 'blocks';
    sideNav.dispatchEvent(new Event('click'));

    await waitUntil(
      () => recursiveQuery(library, '#back-button'),
      'Element did not render children',
    );

    expect(AppModel.appStore.activePlugin.title).to.equal('Blocks');
    expect(AppModel.appStore.pluginData).to.deep.equal([
      {
        name: 'Cards',
        path: 'https://main--helix-test-content-onedrive--adobe.hlx.page/block-library-tests/blocks/cards/cards',
      },
      {
        name: 'Columns',
        path: 'https://main--helix-test-content-onedrive--adobe.hlx.page/block-library-tests/blocks/columns/columns',
      },
    ]);

    const backButton = recursiveQuery(library, '#back-button');
    backButton.dispatchEvent(new Event('click'));

    expect(AppModel.appStore.activePlugin).to.equal(undefined);
    expect(AppModel.appStore.activePluginPath).to.equal(undefined);
    expect(AppModel.appStore.pluginData).to.equal(undefined);
  });

  it('should search', async () => {
    const library = document.createElement('franklin-library');
    library.config = {
      library: multiSheetPath,
    };

    await fixture(library);

    await waitUntil(
      () => recursiveQuery(library, 'sp-sidenav-item'),
      'Element did not render children',
    );

    const sideNav = recursiveQuery(library, 'sp-sidenav');
    sideNav.value = 'blocks';
    sideNav.dispatchEvent(new Event('click'));

    await waitUntil(
      () => recursiveQuery(library, '#back-button'),
      'Element did not render children',
    );

    const searchButton = recursiveQuery(library, '#search-button');
    searchButton.dispatchEvent(new Event('click'));

    await waitUntil(
      () => recursiveQuery(library, 'input'),
      'Element did not render children',
    );

    const input = recursiveQuery(library, 'sp-search');

    await aTimeout(1000);
    await simulateTyping(input, 'logos');
    input.dispatchEvent(new Event('input'));

    const pluginRenderer = recursiveQuery(library, 'plugin-renderer');

    await waitUntil(
      () => recursiveQuery(pluginRenderer, 'sp-sidenav-item'),
      'Element did not render children',
    );

    const pluginSideNav = recursiveQuery(pluginRenderer, 'sp-sidenav');
    const items = pluginSideNav.querySelectorAll('sp-sidenav-item');
    expect([...items].length).to.equal(6);
  }).timeout(5000);
});
