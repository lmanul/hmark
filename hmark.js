let PAGES = [];
let CURRENT_RENDER_COUNT = 0;
let TIMINGS = [];
let RENDER_COUNT = 0;
const SETTLE_DOWN_TIME_MS = 100;

function start(pathA, pathB, renderCount) {
  RENDER_COUNT = renderCount;
  fetchOnePage(pathA, 0);
  if (!!pathB) {
    fetchOnePage(pathB, 1);
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
  if (TIMINGS.length === RENDER_COUNT) {
     contents = renderSingleSeriesStats(TIMINGS);
  } else {
    contents = '<b>Comparison benchmarks not yet supported</b>';
  }
  document.body.innerHTML = contents;
}

function clearAndRenderAgain() {
  clear();
  if (CURRENT_RENDER_COUNT < RENDER_COUNT) {
    document.title = CURRENT_RENDER_COUNT;
    window.setTimeout(timedRender, SETTLE_DOWN_TIME_MS);
  } else {
    finish();
  }
}

function timedRender() {
  const before = new Date().getTime();
  render(PAGES[0]);
  const after = new Date().getTime();
  CURRENT_RENDER_COUNT++;
  const elapsed = after - before;
  TIMINGS.push(elapsed);
  window.setTimeout(clearAndRenderAgain, SETTLE_DOWN_TIME_MS);
}

function onPageLoaded(loadedMarkup, index) {
  PAGES[index] = loadedMarkup;
  timedRender();
}
