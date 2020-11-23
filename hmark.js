/** The paths (relative URLs) to test pages. */
let PATHS = [];

/** The actual markup of each test page. */
let PAGES = [];

/** The number of times we want to render each page. */
let RENDER_COUNT = 0;

/** The number of times we have rendered the full list of test pages. */
let CURRENT_RENDER_COUNT = 0;

/** The index of the page we are currently rendering. */
let CURRENTLY_RENDERED_PAGE_INDEX = 0;

/** Keeps track of measurements:
 * [
 *   [page_a_render_1, page_b_render_2, ...],
 *   [page_b_render_1, page_b_render_2, ...],
 * ]
 */
let TIMINGS = [];

/** The number of pages that we have loaded so far. */
let LOADED = 0;

/** The number of milliseconds we wait in between two renders. */
const SETTLE_DOWN_TIME_MS = 200;

/** Entry point. Starts the process. */
function start(pathA, pathB, renderCount) {
  const now = new Date().getTime();
  RENDER_COUNT = renderCount;
  PATHS.push(pathA);
  fetchOnePage(pathA, 0, now);
  if (!!pathB) {
    PATHS.push(pathB);
    fetchOnePage(pathB, 1, now);
  }
  for (let i = 0; i < PATHS.length; i++) {
    TIMINGS.push([]);
    PAGES.push("");
  }
}

/** Starts fetching the page at the given path.  */
function fetchOnePage(path, index, now) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      onPageLoaded(xhr.response, index);
    }
  }
  const url = path + '?nocache=' + now;
  xhr.open('GET', url, true);
  xhr.send(null);
}

function clear() {
  document.body.innerHTML = '';
}

function render(markup) {
  document.body.innerHTML = markup;
}

function renderSingleSeriesStats(timings) {
  const sum = timings.reduce((a, b) => a + b, 0);
  const average = sum / timings.length;

  // Standard deviation.
  const squaredDiffs = timings.map((v) => (v - average) ** 2);
  const squaredDiffsSum = squaredDiffs.reduce((a, b) => a + b, 0);
  const stdDev = Math.sqrt(squaredDiffsSum / timings.length);

  const rendered = '<big>Rendered ' + timings.length + ' times. ' +
      'Average render time: <b>' + average.toFixed(1) + ' ms.</b> ' +
      'Standard deviation: <b>' + stdDev.toFixed(1) + ' ms.</b></big>';
  return rendered;
}

/** Called when we are done and want to show the timings. */
function finish() {
  let contents = '';
  for (let i = 0; i < PATHS.length; i++) {
    contents += '<h1>Page ' + i + '</h1>';
    contents += renderSingleSeriesStats(TIMINGS[i]);
  }
  document.body.innerHTML = contents;
}

/** Clears the page and moves on to the next render. */
function clearAndRenderAgain() {
  clear();
  if (CURRENTLY_RENDERED_PAGE_INDEX >= PATHS.length) {
    CURRENTLY_RENDERED_PAGE_INDEX = 0;
    CURRENT_RENDER_COUNT++;
  }

  if (CURRENT_RENDER_COUNT < RENDER_COUNT) {
    window.setTimeout(singleRender, SETTLE_DOWN_TIME_MS);
  } else {
    finish();
  }
}

/** Performs a single render, and remembers how long it took. */
function singleRender() {
  document.title = '' + CURRENT_RENDER_COUNT + ' — ' + CURRENTLY_RENDERED_PAGE_INDEX;
  const before = new Date().getTime();
  render(PAGES[CURRENTLY_RENDERED_PAGE_INDEX]);
  const after = new Date().getTime();

  const elapsed = after - before;
  TIMINGS[CURRENTLY_RENDERED_PAGE_INDEX].push(elapsed);
  CURRENTLY_RENDERED_PAGE_INDEX++;

  window.setTimeout(clearAndRenderAgain, SETTLE_DOWN_TIME_MS);
}

/** Callback for when a page finished loading. */
function onPageLoaded(loadedMarkup, index) {
  PAGES[index] = loadedMarkup;
  LOADED++;
  // If we have loaded all the test pages, we can start.
  if (LOADED === PATHS.length) {
    singleRender();
  }
}
