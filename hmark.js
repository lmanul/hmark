let PATHS = [];
let PAGES = [];
let CURRENT_RENDER_COUNT = 0;
let CURRENTLY_RENDERED_PAGE_INDEX = 0;
let TIMINGS = [];
let RENDER_COUNT = 0;
let LOADED = 0;
const SETTLE_DOWN_TIME_MS = 100;

function start(pathA, pathB, renderCount) {
  RENDER_COUNT = renderCount;
  PATHS.push(pathA);
  fetchOnePage(pathA, 0);
  if (!!pathB) {
    PATHS.push(pathB);
    fetchOnePage(pathB, 1);
  }
  for (let i = 0; i < PATHS.length; i++) {
    TIMINGS.push([]);
  }
}

function fetchOnePage(path, index) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      onPageLoaded(xhr.response, index);
    }
  }
  xhr.open('GET', path, true);
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

function finish() {
  let contents = '';
  contents = renderSingleSeriesStats(TIMINGS[0]);
  document.body.innerHTML = contents;
}

/** Clears the page and moves on to the next render. */
function clearAndRenderAgain() {
  clear();
  CURRENTLY_RENDERED_PAGE_INDEX = 0;
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
  if (CURRENTLY_RENDERED_PAGE_INDEX < PATHS.length) {
    singleRender();
  } else {
    CURRENT_RENDER_COUNT++;
    window.setTimeout(clearAndRenderAgain, SETTLE_DOWN_TIME_MS);
  }
}

function onPageLoaded(loadedMarkup, index) {
  PAGES[index] = loadedMarkup;
  LOADED++;
  // If we have loaded all the test pages, we can start.
  if (LOADED === PATHS.length) {
    singleRender();
  }
}
